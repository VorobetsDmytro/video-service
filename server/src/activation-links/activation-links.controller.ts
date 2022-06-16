import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ActivationDto } from '../activation-links/dto/activation.dto';
import { Roles } from '../decorators/roles.decorator';
import { IsBannedGuard } from '../guards/is-banned.guard';
import { RolesGuard } from '../guards/roles.guard';
import { ActivationLinksService } from './activation-links.service';
import { Request } from 'express';

@Controller('activation-links')
export class ActivationLinksController {
    constructor(private activationLinksService: ActivationLinksService){}

    @Post('/activation/:userId/:link')
    activation(@Body() dto: ActivationDto, @Param('userId') userId: string, @Param('link') link: string){
        return this.activationLinksService.activation(dto, userId, link);
    }

    @Get('/')
    @Roles(['ADMIN'])
    @UseGuards(RolesGuard)
    @UseGuards(IsBannedGuard)
    getAll(@Req() req: Request){
        return this.activationLinksService.getAll(req);
    }
}
