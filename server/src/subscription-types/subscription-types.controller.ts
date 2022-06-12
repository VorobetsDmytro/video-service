import { Body, Controller, Delete, Get, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Roles } from '../decorators/roles.decorator';
import { IsBannedGuard } from '../guards/is-banned.guard';
import { IsLogedInGuard } from '../guards/is-loged-in.guard';
import { RolesGuard } from '../guards/roles.guard';
import { CreateSubscriptionTypeDto } from './dto/create-subscription-type.dto';
import { SubscriptionTypesService } from './subscription-types.service';

@Controller('subscription-types')
export class SubscriptionTypesController {
    constructor(private subscriptionTypesService: SubscriptionTypesService){}

    @Post('/create')
    @Roles(['ADMIN'])
    @UseGuards(RolesGuard)
    @UseGuards(IsBannedGuard)
    @HttpCode(201)
    create(@Body() dto: CreateSubscriptionTypeDto, @Req() req){
        return this.subscriptionTypesService.create(dto, req);
    }

    @Get('/')
    @UseGuards(IsLogedInGuard)
    @UseGuards(IsBannedGuard)
    @HttpCode(200)
    getAll(@Req() req){
        return this.subscriptionTypesService.getAll(req);
    }

    @Delete('/delete/:name')
    @Roles(['ADMIN'])
    @UseGuards(RolesGuard)
    @UseGuards(IsBannedGuard)
    @HttpCode(200)
    delete(@Param('name') name: string, @Req() req){
        return this.subscriptionTypesService.delete(name, req);
    }
}
