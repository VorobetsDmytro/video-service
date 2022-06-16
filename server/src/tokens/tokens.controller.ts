import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Roles } from '../decorators/roles.decorator';
import { IsBannedGuard } from '../guards/is-banned.guard';
import { RolesGuard } from '../guards/roles.guard';
import { TokensService } from './tokens.service';
import { Request } from 'express';

@Controller('tokens')
export class TokensController {
    constructor(private tokenService: TokensService){}

    @Get('/')
    @Roles(['ADMIN'])
    @UseGuards(RolesGuard)
    @UseGuards(IsBannedGuard)
    getAll(@Req() req: Request){
        return this.tokenService.getAll(req);
    }
}
