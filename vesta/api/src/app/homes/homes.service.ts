import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateHomeDto } from './dto/create-home.dto';
import { Home } from '../../generated/prisma/client';
import { UpdateHomeDto } from './dto/update-home.dto';
import {UpdateArrayDto} from './dto/update-array.dto';

@Injectable()
export class HomesService {
  constructor(private prisma: PrismaService) {}

  async create(createHomeDto: CreateHomeDto): Promise<{ message: string }> {
    await this.prisma.home.create({ data: {
      name: createHomeDto.name,
      users_id: [createHomeDto.userId],
      owner_id: createHomeDto.userId
    }});

    return { message: 'Home created successfully' };
  }

  async getAllHomes(userId: number): Promise<Home[] | null> {
    return this.prisma.home.findMany({ where: { users_id: { has: userId } } });
  }

  async updatehomeName(homeId: number,updateHomeDto:UpdateHomeDto): Promise<{ message: string }>  {

    const existingHome = await this.prisma.home.findUnique({ where: { id: homeId}})

    if (!existingHome){
      throw new NotFoundException("Home doesn`t exists")
    }

    
    await this.prisma.home.update({where : {id : homeId} , data: updateHomeDto})

    return { message: "Succesfully updated name"}

  }

  async addUserToUsersArray(updatePayload: UpdateArrayDto): Promise<{ messege: string}>{
    await this.prisma.home.update({where : { invite_code: updatePayload.invitation_code} ,data : { users_id: {push : updatePayload.user_id} }})

    return { messege : "User added to House"}

  }
  
}
