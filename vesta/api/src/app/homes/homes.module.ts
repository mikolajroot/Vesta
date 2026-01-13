import { Module } from '@nestjs/common';
import { HomesController } from './homes.controller';
import { PrismaService } from '../../prisma.service';
import { HomesService } from './homes.service';
import { RoomService } from '../room/room.service';

@Module({
  controllers: [HomesController],
  providers: [PrismaService,HomesService],
  exports:[RoomService]
})
export class HomesModule {
}
