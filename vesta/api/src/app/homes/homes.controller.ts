import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { CreateHomeDto } from './dto/create-home.dto';
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { HomesService } from './homes.service';
import { UpdateHomeDto } from './dto/update-home.dto';

@Controller('homes')
export class HomesController {

    constructor(private readonly homeService: HomesService ){}

    @Post()
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
    @ApiOperation({ summary: "Update home name"})
    @ApiParam({name: "homeID", type: Number, description:"Home identification number"})
    @ApiBody({ type: UpdateHomeDto,description: "Name payload"})
    updateHome(
        @Param('id',ParseIntPipe) id: number,
        @Body() updateHomeDto: UpdateHomeDto){
            return this.homeService.updatehomeName(id, updateHomeDto)
        }
    
}
