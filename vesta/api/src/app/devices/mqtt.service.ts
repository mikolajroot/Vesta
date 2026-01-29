import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as mqtt from 'mqtt';
import { DevicesService } from './devices.service';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private client: mqtt.MqttClient;
  private temperatureIntervals: Map<string, NodeJS.Timeout> = new Map();

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
        const temperature = parseFloat(payload.toString());
        if (!isNaN(temperature)) {
          await this.devicesService.updateTemperature(topic, temperature);
          console.log(`Temperature update: ${topic} = ${temperature}°C`);
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

    tempSensors.forEach((sensor) => {
      if (sensor.mqtt_topic) {
        this.startSensorSimulation(sensor.mqtt_topic);
      }
    });
  }

  private startSensorSimulation(topic: string) {

    const existingInterval = this.temperatureIntervals.get(topic);
    if (existingInterval !== undefined) {
      clearInterval(existingInterval);
    }

    const interval = setInterval(() => {
      const randomTemp = (Math.random() * 15 + 15).toFixed(1); // 15-30°C
      this.client.publish(topic, randomTemp);
      console.log(`Published to ${topic}: ${randomTemp}°C`);
    }, 5000);

    this.temperatureIntervals.set(topic, interval);
  }

  async addTemperatureSensor(mqttTopic: string) {
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