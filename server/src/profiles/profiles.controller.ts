import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Roles } from '../decorators/roles.decorator';
import { IsBannedGuard } from '../guards/is-banned.guard';
import { IsLogedInGuard } from '../guards/is-loged-in.guard';
import { RolesGuard } from '../guards/roles.guard';
import { ChangeEmailAcceptDto } from './dto/change-email-accept.dto';
import { ChangeProfileDto } from './dto/change-profile.dto';
import { ProfilesService } from './profiles.service';

@Controller('profiles')
export class ProfilesController {
    constructor(private profilesService: ProfilesService){}
    
    @Get('/')
    @UseGuards(IsLogedInGuard)
    @UseGuards(IsBannedGuard)
    getProfile(@Req() req){
        return this.profilesService.getProfile(req);
    }

    @Get('/change-email')
    @Roles(['ADMIN'])
    @UseGuards(RolesGuard)
    @UseGuards(IsBannedGuard)
    getAllChangeEmailRequests(@Req() req){
        return this.profilesService.getAllChangeEmailRequests(req);
    }

    @Get('/:userId')
    @Roles(['ADMIN'])
    @UseGuards(RolesGuard)
    @UseGuards(IsBannedGuard)
    getProfileByUserId(@Param('userId') userId: string, @Req() req) {
        return this.profilesService.getProfileByUserId(userId, req);
    }

    @Patch('/')
    @UseGuards(IsLogedInGuard)
    @UseGuards(IsBannedGuard)
    changeProfile(@Body() dto: ChangeProfileDto, @Req() req){
        return this.profilesService.changeProfile(dto, req);
    }

    @Post('/change-email/accept/:changeEmailId')
    @Roles(['ADMIN'])
    @UseGuards(RolesGuard)
    @UseGuards(IsBannedGuard)
    changeEmailAccept(@Body() dto: ChangeEmailAcceptDto, @Param('changeEmailId') changeEmailId: string, @Req() req){
        return this.profilesService.changeEmailAccept(dto, changeEmailId, req);
    }
}
