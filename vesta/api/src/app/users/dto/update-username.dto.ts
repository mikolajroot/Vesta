import { IsString, MinLength, MaxLength } from 'class-validator';

export class UpdateUsernameDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;
}