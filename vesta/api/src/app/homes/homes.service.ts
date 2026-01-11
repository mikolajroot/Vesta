import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateHomeDto } from './dto/create-home.dto';
import { Home } from '../../generated/prisma/client';
@Injectable()
export class HomesService {
  constructor(private prisma: PrismaService) {}

  async create(createHomeDto: CreateHomeDto): Promise<{ message: string }> {
    await this.prisma.home.create({ data: createHomeDto });

    return { message: 'Home creates successfully' };
  }

  async getAllHomes(userId: number): Promise<Home[] | null> {
    return this.prisma.home.findMany({ where: { users_id: { has: userId } } });
  }
}
