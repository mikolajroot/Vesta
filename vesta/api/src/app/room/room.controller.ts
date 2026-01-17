import {
  Body,
  Controller,
  Post,
  Get,
  Patch,
  Param,
  ParseIntPipe,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RequireRoles } from '../auth/decorators/roles.decorator';
import { Roles } from '../../generated/prisma/enums';

@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post()
  @RequireRoles(Roles.Admin)
  @ApiOperation({ summary: 'Create a room', description: 'Creates a new room' })
  @ApiBody({ type: CreateRoomDto, description: 'Room payload' })
  @ApiConflictResponse({ description: 'Room name already exists' })
  @ApiCreatedResponse({ description: 'Room created with success' })
  create(@Body() createRoomDto: CreateRoomDto) {
    return this.roomService.create(createRoomDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all rooms in home',
    description: 'Retrieves a list of all rooms in the home',
  })
  @ApiQuery({ name: 'homeId', type: Number, description: 'Home ID' })
  @ApiQuery({ name: 'userId', type: Number, description: 'User ID' })
  @ApiOkResponse({ description: 'List of rooms retrieved successfully' })
  @ApiForbiddenResponse({description: 'User doesn`t have access to this home'})
  getAllRooms(
    @Query('homeId', ParseIntPipe) homeId: number,
    @Query('userId', ParseIntPipe) userId: number,
  ) {
    return this.roomService.getAllRooms(homeId, userId);
  }

  @Patch(':id')
  @RequireRoles(Roles.Admin)
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
  @RequireRoles(Roles.Admin)
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
