import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { Devices } from '../../generated/prisma/client';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { DevicesGateway } from './devices.gateway';
import { randomUUID } from 'crypto';

@Injectable()
export class DevicesService {
  private mqttService: any; 

  constructor(
    private prisma: PrismaService,
    private devicesGateway: DevicesGateway,
  ) {}

  setMqttService(mqttService: any) {
    this.mqttService = mqttService;
  }

  async create(createDto: CreateDeviceDto): Promise<{ message: string }> {
    switch (createDto.type) {
      case 'temp_sensor': {
        const existingTempSensor = await this.prisma.devices.findFirst({
          where: { room_id: createDto.room_id, type: 'temp_sensor' },
          select: { id: true },
        });

        if (existingTempSensor) {
          throw new BadRequestException(
            'Only one temperature sensor is allowed per room.',
          );
        }
        break;
      }

      case 'humidity_sensor': {
        const existingHumiditySensor = await this.prisma.devices.findFirst({
          where: { room_id: createDto.room_id, type: 'humidity_sensor' },
          select: { id: true },
        });

        if (existingHumiditySensor) {
          throw new BadRequestException(
            'Only one humidity sensor is allowed per room.',
          );
        }
        break;
      }

      case 'thermostat': {
        const existingThermostat = await this.prisma.devices.findFirst({
          where: { room_id: createDto.room_id, type: 'thermostat' },
          select: { id: true },
        });

        if (existingThermostat) {
          throw new BadRequestException(
            'Only one thermostat is allowed per room.',
          );
        }
        break;
      }

      case 'humidifier': {
        const existingHumidifier = await this.prisma.devices.findFirst({
          where: { room_id: createDto.room_id, type: 'humidifier' },
          select: { id: true },
        });

        if (existingHumidifier) {
          throw new BadRequestException(
            'Only one humidifier is allowed per room.',
          );
        }
        break;
      }
    }

    let mqttTopic: string | undefined;
    
    switch (createDto.type) {
      case 'temp_sensor':
        mqttTopic = `sensors/temp/${randomUUID()}`;
        break;
      case 'humidity_sensor':
        mqttTopic = `sensors/humidity/${randomUUID()}`;
        break;
      case 'camera':
        mqttTopic = `camera/motion/${randomUUID()}`;
        break;
    }

    const device = await this.prisma.devices.create({
      data: {
        ...createDto,
        mqtt_topic: mqttTopic,
      },
    });

    if (createDto.type === 'temp_sensor' && mqttTopic && this.mqttService) {
      await this.mqttService.addTemperatureSensor(mqttTopic);
    }

    if (createDto.type === 'humidity_sensor' && mqttTopic && this.mqttService) {
      await this.mqttService.addHumiditySensor(mqttTopic);
    }

    if (createDto.type === 'camera' && mqttTopic && this.mqttService) {
      await this.mqttService.addCamera(device.id, mqttTopic);
    }

    this.devicesGateway.broadcastDeviceCreated({
      id: device.id,
      name: device.name,
      type: device.type,
      status: device.status || 'off',
      room_id: device.room_id,
      mqtt_topic: device.mqtt_topic ?? undefined,
      created_at: device.created_at.toISOString(),
    });

    return { message: 'device created successfully' };
  }

  async getAllDevices(room_id: number): Promise<Devices[]> {
    return this.prisma.devices.findMany({
      where: { room_id },
      orderBy: { created_at: 'desc' },
    });
  }

  async updateDevice(
    device_id: number,
    updateDto: UpdateDeviceDto,
  ): Promise<{ message: string }> {
    const existing = await this.prisma.devices.findFirst({
      where: { id: device_id },
    });
    if (!existing) {
      throw new NotFoundException('Device not found');
    }

    const updated = await this.prisma.devices.update({
      where: { id: device_id },
      data: updateDto,
      include: { Room: true },
    });

    this.devicesGateway.broadcastDeviceUpdate({
      deviceId: updated.id,
      roomId: updated.room_id,
      status: updated.status ?? '',
      name: updated.name,
      type: updated.type,
      changedBy: 0,
      timestamp: new Date(),
    });

    return { message: 'device updated successfully' };
  }

  async deleteDevice(device_id: number): Promise<{ message: string }> {
    const existing = await this.prisma.devices.findFirst({
      where: { id: device_id },
    });
    if (!existing) {
      throw new NotFoundException('Device not found');
    }

    await this.prisma.devices.delete({
      where: { id: device_id },
    });

    this.devicesGateway.broadcastDeviceDeleted({
      id: device_id,
      room_id: existing.room_id,
    });

    return { message: 'device deleted successfully' };
  }

  async updateTemperature(
    mqttTopic: string,
    temperature: number,
  ): Promise<void> {
    const device = await this.prisma.devices.findFirst({
      where: { mqtt_topic: mqttTopic, type: 'temp_sensor' },
    });

    if (!device) {
      console.warn(`No temp sensor found for topic: ${mqttTopic}`);
      return;
    }

    if (device.status === 'off') {
      console.log(`Sensor ${device.name} is off, ignoring temperature update`);
      return;
    }

    const updated = await this.prisma.devices.update({
      where: { id: device.id },
      data: { status: temperature.toString() },
    });

    console.log(`Updated device ${device.name} temperature to ${temperature}°C`);

    this.devicesGateway.broadcastDeviceUpdate({
      deviceId: updated.id,
      roomId: updated.room_id,
      status: updated.status ?? '',
      name: updated.name,
      type: updated.type,
      changedBy: 0,
      timestamp: new Date(),
    });
  }

  async updateHumidity(
    mqttTopic: string,
    humidity: number,
  ): Promise<void> {
    const device = await this.prisma.devices.findFirst({
      where: { mqtt_topic: mqttTopic, type: 'humidity_sensor' },
    });

    if (!device) {
      console.warn(`No humidity sensor found for topic: ${mqttTopic}`);
      return;
    }

    if (device.status === 'off') {
      console.log(`Sensor ${device.name} is off, ignoring humidity update`);
      return;
    }

    const updated = await this.prisma.devices.update({
      where: { id: device.id },
      data: { status: humidity.toString() },
    });

    console.log(`Updated device ${device.name} humidity to ${humidity}%`);

    this.devicesGateway.broadcastDeviceUpdate({
      deviceId: updated.id,
      roomId: updated.room_id,
      status: updated.status ?? '',
      name: updated.name,
      type: updated.type,
      changedBy: 0,
      timestamp: new Date(),
    });
  }

}
