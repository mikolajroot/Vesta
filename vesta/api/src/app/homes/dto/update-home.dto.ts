import { ApiProperty } from '@nestjs/swagger';
import {IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UpdateHomeDto {
  @ApiProperty({example: "House1", description: "Name of home"})
  @IsNotEmpty()
  @MinLength(3)
  @IsString()
  name: string
}