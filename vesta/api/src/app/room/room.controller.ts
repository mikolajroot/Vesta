import {
  Body,
  Controller,
  Post,
  Get,
  Patch,
  Param,
  ParseIntPipe,
  Delete,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post()
  @ApiOperation({ summary: 'Create a room', description: 'Creates a new room' })
  @ApiBody({ type: CreateRoomDto, description: 'Room payload' })
  @ApiConflictResponse({ description: 'Room name already exists' })
  @ApiCreatedResponse({ description: 'Room created with success' })
  create(@Body() createRoomDto: CreateRoomDto) {
    return this.roomService.create(createRoomDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all rooms',
    description: 'Retrieves a list of all rooms in the system',
  })
  @ApiOkResponse({ description: 'List of rooms retrieved successfully' })
  getAllRooms() {
    return this.roomService.getAllRooms();
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a room',
    description: 'Updates an existing room by id',
  })
  @ApiBody({ type: UpdateRoomDto, description: 'Room update payload' })
  @ApiOkResponse({ description: 'Room updated successfully' })
  @ApiNotFoundResponse({ description: 'Room not found' })
  @ApiConflictResponse({ description: 'Room name already exists' })
  updateRoom(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoomDto: UpdateRoomDto,
  ) {
    return this.roomService.updateRoom(id, updateRoomDto);
  }
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a room',
    description: 'Deletes an existing room by id',
  })
  @ApiOkResponse({ description: 'Room deleted successfully' })
  @ApiNotFoundResponse({ description: 'Room not found' })
  deleteRoom(@Param('id', ParseIntPipe) id: number) {
    return this.roomService.deleteRoom(id);
  }
}
