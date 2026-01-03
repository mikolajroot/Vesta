import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { RoomType } from '../../../generated/prisma/enums';

export class CreateRoomDto {
  @ApiProperty({ example: 'Kitchen', description: 'Room name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'KITCHEN',
    description: 'Room type',
    enum: RoomType,
    required: false
  })
  @IsEnum(RoomType)
  @IsOptional()
  type?: RoomType;

  @ApiProperty({
    example: 1,
    description: 'Floor number',
    required: false
  })
  @IsNumber()
  @IsOptional()
  floor?: number;

  @ApiProperty({
    example: 25.5,
    description: 'Room area in square meters',
    required: false
  })
  @IsNumber()
  @IsOptional()
  area?: number;
}
