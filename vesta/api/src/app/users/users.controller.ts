import {
  Controller,
  Delete,
  Get,
  Put,
  Param,
  Body,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUsernameDto } from './dto/update-username.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({ description: 'Current user details' })
  async getMe(@Request() req: any) {
    return this.usersService.findById(req.user.sub);
  }

  @Put('username')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update username' })
  @ApiBody({
    type: UpdateUsernameDto,
    description: 'New username',
    examples: {
      example1: {
        value: {
          username: 'newusername',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Username updated successfully',
    schema: {
      example: { message: 'Username updated successfully' },
    },
  })
  async updateUsername(
    @Request() req: any,
    @Body() updateUsernameDto: UpdateUsernameDto,
  ) {
    return this.usersService.updateUsername(
      req.user.sub,
      updateUsernameDto.username,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user account' })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'User identification number',
  })
  @ApiOkResponse({ description: 'User successfully deleted' })
  deleteAccount(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.deleteAccount(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'User identification number',
  })
  @ApiOkResponse({ description: 'User details' })
  getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findById(id);
  }
}
