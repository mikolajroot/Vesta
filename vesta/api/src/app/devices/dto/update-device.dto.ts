import { IsString, IsNumber, IsOptional, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateDeviceDto {
  @ApiProperty({ example: 'Living Room Light', description: 'Device name (minimum 3 characters)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;

  @ApiProperty({ example: 'light', description: 'Device type' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ example: 'on', description: 'Device status', required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ example: 1, description: 'Room ID' })
  @IsNumber()
  @IsNotEmpty()
  room_id: number;
}
