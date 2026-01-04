import { Body, Controller, Post, Get } from '@nestjs/common';
import { ApiConflictResponse, ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';

@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post()
  @ApiBody({ type: CreateRoomDto, description: 'Room payload' })
  @ApiConflictResponse({ description: 'Room name already exists' })
  @ApiCreatedResponse({ description: 'Room created with success' })
  create(@Body() createRoomDto: CreateRoomDto) {
    return this.roomService.create(createRoomDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all rooms', description: 'Retrieves a list of all rooms in the system' })
  @ApiOkResponse({ description: 'List of rooms retrieved successfully' })
  getAllRooms() {
    return this.roomService.getAllRooms()
  }
}
