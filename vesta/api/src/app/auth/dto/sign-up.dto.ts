import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { Roles } from '../../../generated/prisma/enums';
import { ApiProperty } from '@nestjs/swagger';

export class SignUpDto {
  @ApiProperty({
    example: 'Paolo',
    description: 'Username',
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    example: 'password123',
    description: 'Password',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({
    enum: Roles,
    example: 'Child',
    description: 'role for Users',
  })
  @IsString()
  @IsNotEmpty()
  role: Roles;
}
