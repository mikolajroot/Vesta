import { ApiProperty } from '@nestjs/swagger';
import {IsNotEmpty, IsNumber, IsString, Length} from 'class-validator';

export class UpdateArrayDto {
  @ApiProperty({example: 3, description: "User ID"})
  @IsNotEmpty()
  @IsNumber()
  user_id: number
  @ApiProperty({ example: "6aaf9e47-e633-4624-b0ea-c55d2c999f6e", description: "Invitation code"})
  @IsNotEmpty()
  @IsString()
  @Length(32)
  invitation_code: string
}