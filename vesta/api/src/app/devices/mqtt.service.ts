import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as mqtt from 'mqtt';
import { DevicesService } from './devices.service';
import { PrismaService } from '../../prisma.service';
import { DevicesGateway } from './devices.gateway';
import { Devices } from '../../generated/prisma/client';

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private client: mqtt.MqttClient;
  private temperatureIntervals: Map<string, NodeJS.Timeout> = new Map();
  private temperatureState: Map<string, number> = new Map();
  private humidityIntervals: Map<string, NodeJS.Timeout> = new Map();
  private humidityState: Map<string, number> = new Map();
  private cameraIntervals: Map<number, NodeJS.Timeout> = new Map();

  constructor(
    private devicesService: DevicesService,
    private prisma: PrismaService,
    private devicesGateway: DevicesGateway,
  ) {}

  async onModuleInit() {
    this.client = mqtt.connect('mqtt://localhost:1883', {
      clientId: `vesta_${Math.random().toString(16).slice(3)}`,
      clean: true,
      reconnectPeriod: 1000,
    });

    this.client.on('connect', () => {
      console.log('Connected to MQTT broker');

      this.client.subscribe('sensors/temp/+', (err) => {
        if (err) {
          console.error('MQTT subscription error:', err);
        } else {
          console.log('Subscribed to sensors/temp/+');
        }
      });

      this.client.subscribe('camera/motion/+', (err) => {
        if (err) {
          console.error('Camera MQTT subscription error:', err);
        } else {
          console.log('Subscribed to camera/motion/+');
        }
      });

      this.client.subscribe('sensors/humidity/+', (err) => {
        if (err) {
          console.error('Humidity MQTT subscription error:', err);
        } else {
          console.log('Subscribed to sensors/humidity/+');
        }
      });

      setTimeout(() => {
        this.startTemperatureSimulation();
        this.startHumiditySimulation();
        this.startCameraSimulations();
      }, 2000);
    });

    this.client.on('message', async (topic, payload) => {
      try {
        const payloadStr = payload.toString();
        console.log(`Received MQTT message on ${topic}:`, payloadStr);

        if (topic.startsWith('sensors/temp/')) {
          let temperature: number;

          try {
            const json = JSON.parse(payloadStr);
            temperature = parseFloat(json.msg || json.temperature || json.temp || json.value);
          } catch {
            temperature = parseFloat(payloadStr);
          }

          if (!isNaN(temperature)) {
            await this.devicesService.updateTemperature(topic, temperature);
            console.log(`Temperature update: ${topic} = ${temperature}°C`);
          } else {
            console.warn(`Invalid temperature value received: ${payloadStr}`);
          }
        }
        
        else if (topic.startsWith('camera/motion/')) {
          try {
            const json = JSON.parse(payloadStr);
            console.log(`Camera motion event: ${topic} - motion: ${json.motion}`);
          } catch (err) {
            console.warn(`Invalid camera motion payload: ${payloadStr}`);
          }
        }

        else if (topic.startsWith('sensors/humidity/')) {
          let humidity: number;

          try {
            const json = JSON.parse(payloadStr);
            humidity = parseFloat(json.msg || json.humidity || json.value);
          } catch {
            humidity = parseFloat(payloadStr);
          }

          if (!isNaN(humidity)) {
            await this.devicesService.updateHumidity(topic, humidity);
            console.log(`Humidity update: ${topic} = ${humidity}%`);
          } else {
            console.warn(`Invalid humidity value received: ${payloadStr}`);
          }
        }

      } catch (error) {
        console.error('Error processing MQTT message:', error);
      }
    });

    this.client.on('error', (error) => {
      console.error('MQTT error:', error);
    });
  }


  private async startTemperatureSimulation() {
    try {
      const tempSensors = await this.prisma.devices.findMany({
        where: { type: 'temp_sensor' },
      });

      console.log(`Found ${tempSensors.length} temperature sensors`);
      
      tempSensors.forEach((sensor: Devices) => {
        if (sensor.mqtt_topic) {
          console.log(`Starting simulation for: ${sensor.mqtt_topic}`);
          this.startSensorSimulation(sensor.mqtt_topic);
        }
      });
    } catch (error) {
      console.error('Error starting temperature simulation, retrying in 5s:', error);
      setTimeout(() => this.startTemperatureSimulation(), 5000);
    }
  }

  private async startHumiditySimulation() {
    try {
      const humiditySensors = await this.prisma.devices.findMany({
        where: { type: 'humidity_sensor' },
      });

      console.log(`Found ${humiditySensors.length} humidity sensors`);

      humiditySensors.forEach((sensor: Devices) => {
        if (sensor.mqtt_topic) {
          console.log(`Starting humidity simulation for: ${sensor.mqtt_topic}`);
          this.startHumiditySensorSimulation(sensor.mqtt_topic);
        }
      });
    } catch (error) {
      console.error('Error starting humidity simulation, retrying in 5s:', error);
      setTimeout(() => this.startHumiditySimulation(), 5000);
    }
  }

  private startHumiditySensorSimulation(topic: string) {
    const existingInterval = this.humidityIntervals.get(topic);
    if (existingInterval !== undefined) {
      clearInterval(existingInterval);
    }

    if (!this.humidityState.has(topic)) {
      this.humidityState.set(topic, Math.random() * 20 + 40); // 40–60% initial
    }

    const interval = setInterval(async () => {
      try {
        const sensor = await this.prisma.devices.findFirst({
          where: { mqtt_topic: topic, type: 'humidity_sensor' },
        });

        if (!sensor) return;

        const humidifier = await this.prisma.devices.findFirst({
          where: { room_id: sensor.room_id, type: 'humidifier' },
        });

        let current = this.humidityState.get(topic) ?? 50;
        const setpoint =
          humidifier && humidifier.status !== 'off' && !Number.isNaN(Number(humidifier.status))
            ? Number(humidifier.status)
            : null;

        if (setpoint !== null && current < setpoint) {
          current += 0.3 + Math.random() * 0.5;
        } else if (setpoint !== null && current > setpoint) {
          current -= 0.2 + Math.random() * 0.3;
        } else {
          current += (Math.random() - 0.5) * 0.6;
        }

        current = Math.max(20, Math.min(80, current));
        this.humidityState.set(topic, current);

        const payload = JSON.stringify({ msg: current.toFixed(1) });
        this.client.publish(topic, payload);
      } catch (err) {
        console.error('Humidity sensor simulation error:', err);
      }
    }, 5000);

    this.humidityIntervals.set(topic, interval);
  }

  private startSensorSimulation(topic: string) {
    const existingInterval = this.temperatureIntervals.get(topic);
    if (existingInterval !== undefined) {
      clearInterval(existingInterval);
    }

    if (!this.temperatureState.has(topic)) {
      this.temperatureState.set(topic, Math.random() * 6 + 20); // 20–26°C initial
    }

    const interval = setInterval(async () => {
      try {
        const sensor = await this.prisma.devices.findFirst({
          where: { mqtt_topic: topic, type: 'temp_sensor' },
        });

        if (!sensor) return;

        const thermostat = await this.prisma.devices.findFirst({
          where: { room_id: sensor.room_id, type: 'thermostat' },
        });

        let current = this.temperatureState.get(topic) ?? 22;
        const setpoint =
          thermostat && thermostat.status !== 'off' && !Number.isNaN(Number(thermostat.status))
            ? Number(thermostat.status)
            : null;

        if (setpoint !== null && current < setpoint) {
          current += 0.1 + Math.random() * 0.2;
        } else if (setpoint !== null && current > setpoint) {
          current -= 0.1 + Math.random() * 0.2;
        } else {
          current += (Math.random() - 0.5) * 0.3;
        }

        current = Math.max(10, Math.min(35, current));
        this.temperatureState.set(topic, current);

        const payload = JSON.stringify({ msg: current.toFixed(1) });
        this.client.publish(topic, payload);
      } catch (err) {
        console.error('Sensor simulation error:', err);
      }
    }, 5000);

    this.temperatureIntervals.set(topic, interval);
  }

  private async startCameraSimulations() {
    try {
      const cameras = await this.prisma.devices.findMany({
        where: { type: 'camera' },
      });

      console.log(`Found ${cameras.length} cameras`);
      
      cameras.forEach((camera: Devices) => {
        if (camera.mqtt_topic) {
          console.log(`Starting camera simulation for: ${camera.name}`);
          this.startCameraSimulation(camera.id, camera.mqtt_topic);
        }
      });
    } catch (error) {
      console.error('Error starting camera simulation, retrying in 5s:', error);
      setTimeout(() => this.startCameraSimulations(), 5000);
    }
  }

  private startCameraSimulation(deviceId: number, mqttTopic: string) {
    const existingInterval = this.cameraIntervals.get(deviceId);
    if (existingInterval !== undefined) {
      clearInterval(existingInterval);
    }

    const interval = setInterval(async () => {
      try {
        const device = await this.prisma.devices.findFirst({
          where: { id: deviceId, type: 'camera' },
        });

        if (!device || device.status === 'off') return;

        const motionDetected = Math.random() < 0.2;
        const status = motionDetected ? 'motion' : 'idle';

        const updated = await this.prisma.devices.update({
          where: { id: deviceId },
          data: { status },
        });

        const payload = JSON.stringify({
          motion: motionDetected,
          timestamp: new Date().toISOString(),
          camera_id: deviceId,
        });
        this.client.publish(mqttTopic, payload);

        this.devicesGateway.broadcastDeviceUpdate({
          deviceId: updated.id,
          roomId: updated.room_id,
          status: updated.status ?? '',
          name: updated.name,
          type: updated.type,
          changedBy: 0,
          timestamp: new Date(),
        });

        if (motionDetected) {
          console.log(`Camera ${device.name}: Motion detected! Published to ${mqttTopic}`);
        }
      } catch (err) {
        console.error(`Camera simulation error for device ${deviceId}:`, err);
      }
    }, 3000);

    this.cameraIntervals.set(deviceId, interval);
  }

  async addTemperatureSensor(mqttTopic: string) {
    console.log(`Adding new temperature sensor: ${mqttTopic}`);
    this.startSensorSimulation(mqttTopic);
  }

  async addHumiditySensor(mqttTopic: string) {
    console.log(`Adding new humidity sensor: ${mqttTopic}`);
    this.startHumiditySensorSimulation(mqttTopic);
  }

  async addCamera(deviceId: number, mqttTopic: string) {
    console.log(`Adding new camera: ${deviceId} with topic: ${mqttTopic}`);
    this.startCameraSimulation(deviceId, mqttTopic);
  }

  async onModuleDestroy() {
    this.temperatureIntervals.forEach((interval) => {
      clearInterval(interval);
    });
    this.temperatureIntervals.clear();

    this.humidityIntervals.forEach((interval) => {
      clearInterval(interval);
    });
    this.humidityIntervals.clear();

    this.cameraIntervals.forEach((interval) => {
      clearInterval(interval);
    });
    this.cameraIntervals.clear();

    if (this.client) {
      this.client.end();
    }
  }

  publish(topic: string, message: string) {
    this.client.publish(topic, message);
  }
}