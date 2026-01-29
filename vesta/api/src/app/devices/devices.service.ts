import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { Devices } from '../../generated/prisma/client';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { DevicesGateway } from './devices.gateway';
import { randomUUID } from 'crypto';

@Injectable()
export class DevicesService {
  constructor(
    private prisma: PrismaService,
    private devicesGateway: DevicesGateway,
  ) {}

  async create(createDto: CreateDeviceDto): Promise<{ message: string }> {
    let mqttTopic: string | undefined;
    if (createDto.type === 'temp_sensor') {
      const uuid = randomUUID();
      mqttTopic = `sensors/temp/${uuid}`;
    }

    await this.prisma.devices.create({
      data: {
        ...createDto,
        mqtt_topic: mqttTopic,
      },
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

    const updated = await this.prisma.devices.update({
      where: { id: device.id },
      data: { status: temperature.toString() },
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
  }
}
