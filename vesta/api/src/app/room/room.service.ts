import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';


@Injectable()
export class RoomService {
  constructor(private prisma: PrismaService){}

  async create(createRoomDto: CreateRoomDto){
    return this.prisma.rOOM.create({
      data: createRoomDto
    })
  }
}
