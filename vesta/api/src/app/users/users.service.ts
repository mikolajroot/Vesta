import { ConflictException, Injectable } from '@nestjs/common';
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

    async updateUsername(userId: number, newUsername: string): Promise<{ message: string }> {
    const existingUser = await this.prisma.users.findUnique({
      where: { username: newUsername },
    });

    if (existingUser && existingUser.id !== userId) {
      throw new ConflictException('Username is already taken');
    }

    await this.prisma.users.update({
      where: { id: userId },
      data: { username: newUsername },
    });

    return { message: 'Username updated successfully' };
  }

  async deleteAccount(userId: number) : Promise<{ message: string }>{
    await this.prisma.users.delete({ where: { id: userId}})
    return { message: "User successfully deleted"}
  }

  async findById(id: number): Promise<Pick<Users, 'id' | 'username' | 'role'> | null> {
    return await this.prisma.users.findUnique({
      where: { id },
      select: { id: true, username: true, role: true }
    });
  }
}
