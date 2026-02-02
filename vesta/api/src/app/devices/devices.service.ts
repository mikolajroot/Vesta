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
    }

    let mqttTopic: string | undefined;
    
    switch (createDto.type) {
      case 'temp_sensor':
        mqttTopic = `sensors/temp/${randomUUID()}`;
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

    if (createDto.type === 'camera' && mqttTopic && this.mqttService) {
      await this.mqttService.addCamera(device.id, mqttTopic);
    }

    if (this.mqttService) {
      await this.mqttService.addDevice(device.id);
    }

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

  async updateEnergy(
    deviceId: number,
    powerW: number,
    energyKwh: number,
  ): Promise<void> {
    const device = await this.prisma.devices.findFirst({
      where: { id: deviceId },
    });

    if (!device) {
      console.warn(`No device found with id: ${deviceId}`);
      return;
    }

    const updated = await this.prisma.devices.update({
      where: { id: deviceId },
      data: {
        power_w: powerW,
        energy_kwh: energyKwh,
      },
    });

    this.devicesGateway.broadcastEnergyUpdate({
      deviceId: updated.id,
      roomId: updated.room_id,
      powerW: updated.power_w,
      energyKwh: updated.energy_kwh,
      timestamp: new Date(),
    });
  }
}
