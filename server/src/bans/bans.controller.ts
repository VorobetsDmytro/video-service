import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Roles } from '../decorators/roles.decorator';
import { IsBannedGuard } from '../guards/is-banned.guard';
import { RolesGuard } from '../guards/roles.guard';
import { BansService } from './bans.service';
import { CreateBanDto } from './dto/create-ban.dto';
import { Request } from 'express';

@Controller('bans')
export class BansController {
    constructor(private bansService: BansService){}

    @Post('/ban/:userId')
    @Roles(['ADMIN'])
    @UseGuards(RolesGuard)
    @UseGuards(IsBannedGuard)
    ban(@Body() dto: CreateBanDto, @Param('userId') userId: string, @Req() req: Request){
        return this.bansService.ban(dto, {userId}, req);
    }

    @Get('/unban/:userId')
    @Roles(['ADMIN'])
    @UseGuards(RolesGuard)
    @UseGuards(IsBannedGuard)
    unban(@Param('userId') userId: string, @Req() req: Request){
        return this.bansService.unban({userId}, req);
    }
}
