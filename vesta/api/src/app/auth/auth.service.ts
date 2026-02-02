import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { Roles } from '../../generated/prisma/enums';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signIn(
    username: string,
    pass: string,
  ): Promise<{ access_token: string }> {
    const user = await this.usersService.findOne(username);
    const isMatch = user?.password
      ? await bcrypt.compare(pass, user.password)
      : false;

    if (!user || !isMatch) {
      throw new UnauthorizedException();
    }

    const payload = { sub: user.id, username: user.username,role: user.role };
    return { access_token: await this.jwtService.signAsync(payload) };
  }

  async signUp(
    username: string,
    password: string,
    role: Roles
  ): Promise<{ access_token: string }> {

    const existingUser = await this.usersService.findOne(username);
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }


    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);


    const user = await this.usersService.create(username, hashedPassword, role);


    const payload = { sub: user.id, username: user.username, role: user.role };
    return { access_token: await this.jwtService.signAsync(payload) };
  }

    async getProfile(req: any) {
    const user = await this.usersService.findById(req.user.sub);
    
    if (!user) {
      throw new Error('User not found');
    }

    return {
      sub: user.id,
      username: user.username,
      role: user.role,
    };
  }
}
