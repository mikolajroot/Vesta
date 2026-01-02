import { Body, Controller, Post } from '@nestjs/common';
import { ApiAcceptedResponse, ApiConflictResponse, ApiBody, ApiCreatedResponse } from '@nestjs/swagger';
import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';

@Controller('room')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post()
  @ApiBody({ type: CreateRoomDto, description: 'Room payload' })
  @ApiConflictResponse({ description: 'Room name already exists' })
  @ApiCreatedResponse({ description: 'Room created with success' })
  create(@Body() createRoomDto: CreateRoomDto) {
    return this.roomService.create(createRoomDto);
  }
}
