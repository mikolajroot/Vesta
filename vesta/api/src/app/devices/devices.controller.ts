import { Controller, Post, Body, Get, Query, ParseIntPipe, Delete, Param, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiBadRequestResponse, ApiBody, ApiNotFoundResponse, ApiOkResponse, ApiQuery } from '@nestjs/swagger';
import { DevicesService } from './devices.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { RequireRoles } from '../auth/decorators/roles.decorator';
import { Roles } from '../../generated/prisma/enums';

@ApiTags('Devices')
@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  @RequireRoles(Roles.Admin)
  @ApiOperation({ summary: 'Create a new device' })
  @ApiBody({ type: CreateDeviceDto, description: 'Device payload' })
  @ApiCreatedResponse({ description: 'Device successfully created' })
  @ApiNotFoundResponse({ description: "You are trying to create device in a room that doesn`t exists"})
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  create(@Body() createDeviceDto: CreateDeviceDto) {
    return this.devicesService.create(createDeviceDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all devices in room',
    description: 'Retrieves a list of all devices in the room',
  })
  @ApiQuery({ name: 'roomId', type: Number, description: 'Room ID' })
  @ApiOkResponse({ description: 'List of devices retrieved successfully' })
  getAllDevices(@Query('roomId', ParseIntPipe) roomId: number) {
    return this.devicesService.getAllDevices(roomId);
  }

  @Patch(':id')
  @RequireRoles(Roles.Admin)
  @ApiOperation({
    summary: 'Update a device',
    description: 'Updates an existing device by id',
  })
  @ApiBody({ type: UpdateDeviceDto, description: 'Device update payload' })
  @ApiOkResponse({ description: 'Device updated successfully' })
  @ApiNotFoundResponse({ description: 'Device not found' })
  updateDevice(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDeviceDto: UpdateDeviceDto,
  ) {
    return this.devicesService.updateDevice(id, updateDeviceDto);
  }

  @Delete(':id')
  @RequireRoles(Roles.Admin)
  @ApiOperation({
    summary: 'Delete a device',
    description: 'Deletes an existing device by id',
  })
  @ApiOkResponse({ description: 'Device deleted successfully' })
  @ApiNotFoundResponse({ description: 'Device not found' })
  deleteDevice(@Param('id', ParseIntPipe) id: number) {
    return this.devicesService.deleteDevice(id);
  }
}
