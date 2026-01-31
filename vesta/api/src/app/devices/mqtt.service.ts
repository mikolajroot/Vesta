import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as mqtt from 'mqtt';
import { DevicesService } from './devices.service';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private client: mqtt.MqttClient;
  private temperatureIntervals: Map<string, NodeJS.Timeout> = new Map();
  private temperatureState: Map<string, number> = new Map();

  constructor(
    private devicesService: DevicesService,
    private prisma: PrismaService,
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

      this.startTemperatureSimulation();
    });

    this.client.on('message', async (topic, payload) => {
      try {
        console.log(`Received MQTT message on ${topic}:`, payload.toString());
        
        const payloadStr = payload.toString();
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
      } catch (error) {
        console.error('Error processing MQTT message:', error);
      }
    });

    this.client.on('error', (error) => {
      console.error('MQTT error:', error);
    });
  }

  private async startTemperatureSimulation() {
    const tempSensors = await this.prisma.devices.findMany({
      where: { type: 'temp_sensor' },
    });

    console.log(`Found ${tempSensors.length} temperature sensors`);
    
    tempSensors.forEach((sensor) => {
      if (sensor.mqtt_topic) {
        console.log(`Starting simulation for: ${sensor.mqtt_topic}`);
        this.startSensorSimulation(sensor.mqtt_topic);
      }
    });
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
          current += 0.2 + Math.random() * 0.4;
        } else {
          current += (Math.random() - 0.5) * 0.6; 
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

  async addTemperatureSensor(mqttTopic: string) {
    console.log(`Adding new temperature sensor: ${mqttTopic}`);
    this.startSensorSimulation(mqttTopic);
  }

  async onModuleDestroy() {
    this.temperatureIntervals.forEach((interval) => {
      clearInterval(interval);
    });
    this.temperatureIntervals.clear();

    if (this.client) {
      this.client.end();
    }
  }

  publish(topic: string, message: string) {
    this.client.publish(topic, message);
  }
}