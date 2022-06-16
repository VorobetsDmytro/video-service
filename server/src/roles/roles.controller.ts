import { Body, Controller, Delete, Get, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Roles } from '../decorators/roles.decorator';
import { IsBannedGuard } from '../guards/is-banned.guard';
import { RolesGuard } from '../guards/roles.guard';
import { CreateRoleDto } from './dto/create-role.dto';
import { RolesService } from './roles.service';
import { Request } from 'express';

@Controller('roles')
export class RolesController {
    constructor(private rolesService: RolesService){}

    @Post('/create')
    @Roles(['ADMIN'])
    @UseGuards(RolesGuard)
    @UseGuards(IsBannedGuard)
    @HttpCode(201)
    create(@Body() dto: CreateRoleDto, @Req() req: Request){
        return this.rolesService.create(dto, req);
    }

    @Get('/')
    @Roles(['ADMIN'])
    @UseGuards(RolesGuard)
    @UseGuards(IsBannedGuard)
    @HttpCode(200)
    getAll(@Req() req: Request){
        return this.rolesService.getAll(req);
    }

    @Delete('/delete/:value')
    @Roles(['ADMIN'])
    @UseGuards(RolesGuard)
    @UseGuards(IsBannedGuard)
    @HttpCode(200)
    delete(@Param('value') value: string, @Req() req: Request){
        return this.rolesService.delete(value, req);
    }
}
