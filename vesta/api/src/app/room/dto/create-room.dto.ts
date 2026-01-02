import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateRoomDto {
  @ApiProperty({ example: 'Kitchen', description: 'Room name' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
