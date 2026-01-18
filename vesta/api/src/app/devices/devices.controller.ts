import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiBadRequestResponse, ApiBody, ApiNotFoundResponse } from '@nestjs/swagger';
import { DevicesService } from './devices.service';
import { CreateDeviceDto } from './dto/create-device.dto';

@ApiTags('Devices')
@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new device' })
  @ApiBody({ type: CreateDeviceDto, description: 'Device payload' })
  @ApiCreatedResponse({ description: 'Device successfully created' })
  @ApiNotFoundResponse({ description: "You are trying to create device in a room that doesn`t exists"})
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  create(@Body() createDeviceDto: CreateDeviceDto) {
    return this.devicesService.create(createDeviceDto);
  }
}
