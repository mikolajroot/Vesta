import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Room } from '../../generated/prisma/client';


@Injectable()
export class RoomService {
  constructor(private prisma: PrismaService){}

  async create(createRoomDto: CreateRoomDto): Promise<Room | null>{
    const capitalizedName = createRoomDto.name.charAt(0).toUpperCase() + createRoomDto.name.slice(1).toLowerCase()
    const existingRoom = await this.prisma.room.findUnique({
      where: { name: capitalizedName }
    });

    if (existingRoom) {
      throw new ConflictException(`Room with name "${createRoomDto.name}" already exists`);
    }

    return this.prisma.room.create({
      data: {...createRoomDto,name: capitalizedName}
    })
  }

  async getAllRooms(): Promise<Room[] | null>{
    const allRooms = this.prisma.room.findMany()

    return allRooms
  }

  async updateRoom(id: number, updateRoomDto: UpdateRoomDto): Promise<{ message: string }>{
    const existingRoom = await this.prisma.room.findUnique({
      where: { id }
    })

     if (!existingRoom) {
      throw new NotFoundException(`Room with id ${id} not found`);
    }


    const updateData = { ...updateRoomDto };
    if (updateData.name) {
      updateData.name = updateData.name.charAt(0).toUpperCase() + updateData.name.slice(1).toLowerCase();
    }

    if (updateData.name && updateData.name !== existingRoom.name) {
      const roomWithSameName = await this.prisma.room.findUnique({
        where: { name: updateData.name }
      });
      
      if (roomWithSameName) {
        throw new ConflictException(`Room with name "${updateData.name}" already exists`);
      }
    }

    await this.prisma.room.update({
      where: {id},
      data: updateData
    })

    return { message: 'Room updated successfully' }
  }
}
