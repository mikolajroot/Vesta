import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { Devices } from '../../generated/prisma/client';

@Injectable()
export class DevicesService {
    constructor(private prisma: PrismaService) {}

    async create(createDeviceDto: CreateDeviceDto): Promise<{ message: string }> {
      const existingRoom = await this.prisma.room.findFirst({where: {id: createDeviceDto.room_id}})

      if (!existingRoom){
        throw new NotFoundException("You are trying to create device in a room that doesn`t exists")
      }


      await this.prisma.devices.create({
            data: createDeviceDto,
        });

      return {message: "device created successfully"}
    }

    async getAllDevices(room_id: number): Promise<Devices[]>{
      return this.prisma.devices.findMany({ where: { room_id } })
    }
}
