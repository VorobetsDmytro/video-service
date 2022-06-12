import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Roles } from '../decorators/roles.decorator';
import { IsBannedGuard } from '../guards/is-banned.guard';
import { RolesGuard } from '../guards/roles.guard';
import { ResetPasswordsService } from './reset-passwords.service';

@Controller('reset-passwords')
export class ResetPasswordsController {
    constructor(private resetPasswordsService: ResetPasswordsService){}

    @Get('/')
    @Roles(['ADMIN'])
    @UseGuards(RolesGuard)
    @UseGuards(IsBannedGuard)
    getAll(@Req() req){
        return this.resetPasswordsService.getAll(req);
    }
}
