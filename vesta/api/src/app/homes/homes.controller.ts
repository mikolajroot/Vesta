import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { CreateHomeDto } from './dto/create-home.dto';
import { ApiBody, ApiCreatedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { HomesService } from './homes.service';
import { UpdateHomeDto } from './dto/update-home.dto';
import { UpdateArrayDto } from './dto/update-array.dto';
import { RequireRoles } from '../auth/decorators/roles.decorator';
import { Roles } from '../../generated/prisma/enums';

@Controller('homes')
export class HomesController {

    constructor(private readonly homeService: HomesService ){}

    @Post()

    @RequireRoles(Roles.Admin)
    @ApiOperation({ summary: 'Create a home', description: 'Creates a new home' })
    @ApiBody({ type: CreateHomeDto, description: 'Home payload' })
    @ApiCreatedResponse({ description: 'Home created succesffuly' })
    create(@Body() createHomeDto: CreateHomeDto) {
    return this.homeService.create(createHomeDto)
    }

    @Get()
    @ApiOperation({ summary: "Get all homes", description:"get homes that user belongs to"})
    @ApiQuery({ name: "userId",type:Number, description:"User identification number"})
    @ApiOkResponse({ description: 'List of homes retrieved successfully' })
    getAllHomes(@Query("userId",ParseIntPipe) userId: number){
        return this.homeService.getAllHomes(userId)
    }

    @Patch(':id')
    @RequireRoles(Roles.Admin)
    @ApiOperation({ summary: "Update home name"})
    @ApiParam({name: "homeID", type: Number, description:"Home identification number"})
    @ApiBody({ type: UpdateHomeDto,description: "Name payload"})
    updateHome(
        @Param('id',ParseIntPipe) id: number,
        @Body() updateHomeDto: UpdateHomeDto){
            return this.homeService.updatehomeName(id, updateHomeDto)
        }

    @Patch('add-user')
    @ApiOperation({ summary: "Add user to home", description: "Add a user to the home's users array using invitation code"})
    @ApiBody({ type: UpdateArrayDto, description: "User and invitation code payload"})
    @ApiOkResponse({ description: 'User added to home successfully' })
    addUserToUsersArray(@Body() updateArrayDto: UpdateArrayDto){
        return this.homeService.addUserToUsersArray(updateArrayDto)
    }

    @Delete(':id')
    @RequireRoles(Roles.Admin)
    @ApiOperation({ summary: "Delete home" })
    @ApiParam({ name: "id", type: Number, description: "Home identification number" })
    @ApiQuery({ name: "userId", type: Number, description: "User identification number" })
    @ApiOkResponse({ description: 'Home deleted successfully' })
    @ApiForbiddenResponse({ description:"User is not the owner"})
    @ApiNotFoundResponse({ description: "Home doesn`t exists"})
    deleteHome(
        @Param('id', ParseIntPipe) id: number,
        @Query('userId', ParseIntPipe) userId: number) {
        return this.homeService.deleteHome(id, userId)
    }


}
