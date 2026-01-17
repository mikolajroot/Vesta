import { Injectable } from '@nestjs/common';
import { Roles, Users } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma.service';
@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(username: string): Promise<Users | null> {
    return await this.prisma.users.findUnique({ where: { username } });
  }

  async create(username: string, hashedPassword: string,role: Roles): Promise<Users> {
    return await this.prisma.users.create({
      data: {
        username,
        password: hashedPassword,
        role
      },
    });


  }

  async deleteAccount(userId: number) : Promise<{ message: string }>{
    await this.prisma.users.delete({ where: { id: userId}})
    return { message: "User successfully deleted"}
  }
}
