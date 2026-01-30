import { Module } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';
import { DevicesGateway } from './devices.gateway';
import { MqttService } from './mqtt.service';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [DevicesController],
  providers: [
    DevicesService,
    PrismaService,
    DevicesGateway,
    MqttService,
    {
      provide: 'MQTT_INIT',
      useFactory: (devicesService: DevicesService, mqttService: MqttService) => {
        devicesService.setMqttService(mqttService);
        return null;
      },
      inject: [DevicesService, MqttService],
    },
  ],
  exports: [DevicesService, DevicesGateway, MqttService],
})
export class DevicesModule {}
