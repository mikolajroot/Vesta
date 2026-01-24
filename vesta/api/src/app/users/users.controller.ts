import { Controller, Delete, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user account' })
  @ApiParam({ name: 'id', type: Number, description: 'User identification number' })
  @ApiOkResponse({ description: 'User successfully deleted' })
  deleteAccount(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.deleteAccount(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'User identification number' })
  @ApiOkResponse({ description: 'User details' })
  getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findById(id);
  }
}
