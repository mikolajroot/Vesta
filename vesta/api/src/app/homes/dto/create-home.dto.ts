import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateHomeDto {
  @ApiProperty({example: "House1", description: "Name of home"})
  @IsNotEmpty()
  @MinLength(3)
  @IsString()
  name: string
  @ApiProperty({example: 1,description: "Id of creator"})
  @IsNotEmpty()
  userId: number
}
