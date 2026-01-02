import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';


@Injectable()
export class RoomService {
  constructor(private prisma: PrismaService){}

  async create(createRoomDto: CreateRoomDto){
    const existingRoom = await this.prisma.room.findUnique({
      where: { name: createRoomDto.name }
    });

    if (existingRoom) {
      throw new ConflictException(`Room with name "${createRoomDto.name}" already exists`);
    }

    return this.prisma.room.create({
      data: createRoomDto
    })
  }
}
