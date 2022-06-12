import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { Roles } from '../decorators/roles.decorator';
import { IsBannedGuard } from '../guards/is-banned.guard';
import { RolesGuard } from '../guards/roles.guard';
import { ChangeSubscriptionDto } from './dto/change-subscription.dto';
import { SubscriptionsService } from './subscriptions.service';

@Controller('subscriptions')
export class SubscriptionsController {
    constructor(private subscriptionsService: SubscriptionsService){}

    @Get('/')
    @Roles(['ADMIN'])
    @UseGuards(RolesGuard)
    @UseGuards(IsBannedGuard)
    getAll(@Req() req){
        return this.subscriptionsService.getAll(req);
    }

    @Patch('/')
    @Roles(['SUBSCRIBER'])
    @UseGuards(RolesGuard)
    @UseGuards(IsBannedGuard)
    changeSubscription(@Body() dto: ChangeSubscriptionDto, @Req() req){
        return this.subscriptionsService.changeSubscription(dto, req);
    }
}
