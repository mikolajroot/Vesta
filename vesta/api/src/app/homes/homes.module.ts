import { Module } from '@nestjs/common';
import { HomesController } from './homes.controller';
import { HomesService } from './homes.service';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [HomesController],
  providers: [HomesService,PrismaService],
  exports: [HomesService]
})
export class HomesModule {
}
