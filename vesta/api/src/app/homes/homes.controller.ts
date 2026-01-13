import { Body, Controller, Post } from '@nestjs/common';
import { CreateHomeDto } from './dto/create-home.dto';
import { ApiBody, ApiCreatedResponse, ApiOperation } from '@nestjs/swagger';
import { HomesService } from './homes.service';

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

    
}
