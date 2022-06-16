import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Roles } from '../decorators/roles.decorator';
import { IsBannedGuard } from '../guards/is-banned.guard';
import { RolesGuard } from '../guards/roles.guard';
import { CreditCardsService } from './credit-cards.service';
import { CreateCreditCardDto } from './dto/create-credit-card.dto';
import { TopUpMyBalanceDto } from './dto/top-up-my-balance.dto';
import { Request } from 'express';

@Controller('credit-cards')
export class CreditCardsController {
    constructor(private creditCardsService: CreditCardsService){}

    @Post('/')
    @Roles(['SUBSCRIBER'])
    @UseGuards(RolesGuard)
    @UseGuards(IsBannedGuard)
    addCard(@Body() dto: CreateCreditCardDto, @Req() req: Request){
        return this.creditCardsService.add(dto, req);
    }

    @Get('/')
    @Roles(['ADMIN'])
    @UseGuards(RolesGuard)
    @UseGuards(IsBannedGuard)
    getAll(@Req() req: Request){
        return this.creditCardsService.getAll(req);
    }

    @Patch('/:creditCardId')
    @Roles(['SUBSCRIBER'])
    @UseGuards(RolesGuard)
    @UseGuards(IsBannedGuard)
    topUpMyBalance(@Body() dto: TopUpMyBalanceDto, @Param('creditCardId') creditCardId: string, @Req() req: Request){
        return this.creditCardsService.topUpMyBalance({...dto, creditCardId}, req);
    }

    @Delete('/:creditCardId')
    @Roles(['SUBSCRIBER'])
    @UseGuards(RolesGuard)
    @UseGuards(IsBannedGuard)
    remove(@Param('creditCardId') creditCardId: string, @Req() req: Request){
        return this.creditCardsService.remove({creditCardId}, req);
    }
}
