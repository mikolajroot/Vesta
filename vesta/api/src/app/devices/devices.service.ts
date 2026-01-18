import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateDeviceDto } from './dto/create-device.dto';

@Injectable()
export class DevicesService {
    constructor(private prisma: PrismaService) {}

    async create(createDeviceDto: CreateDeviceDto) {
        return this.prisma.devices.create({
            data: createDeviceDto,
        });
    }
}
