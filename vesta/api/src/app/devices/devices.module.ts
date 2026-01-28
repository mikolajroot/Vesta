import { Module } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';
import { DevicesGateway } from './devices.gateway';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [DevicesController],
  providers: [DevicesService, PrismaService, DevicesGateway],
  exports: [DevicesService, DevicesGateway],
})
export class DevicesModule {}
