import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { IsLogedInGuard } from '../guards/is-loged-in.guard';
import { Roles } from '../decorators/roles.decorator';
import { IsBannedGuard } from '../guards/is-banned.guard';
import { RolesGuard } from '../guards/roles.guard';
import { ChangePassDto } from './dto/change-pass.dto';
import { UsersService } from './users.service';
import { Request } from 'express';

@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService){}

    @Get('/')
    @Roles(['ADMIN'])
    @UseGuards(RolesGuard)
    @UseGuards(IsBannedGuard)
    getAll(@Req() req: Request) {
        return this.usersService.getAll(req);
    }
    
    @Patch('/change-pass')
    @UseGuards(IsLogedInGuard)
    @UseGuards(IsBannedGuard)
    changePass(@Body() dto: ChangePassDto, @Req() req: Request){
        return this.usersService.changePass(dto, req);
    }
}
