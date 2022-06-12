import { Body, Controller, Get, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Roles } from '../decorators/roles.decorator';
import { RolesGuard } from '../guards/roles.guard';
import { IsBannedGuard } from '../guards/is-banned.guard';
import { IsLogedInGuard } from '../guards/is-loged-in.guard';
import { AuthService } from './auth.service';
import { ForgotPassDto } from './dto/forgot-pass.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { ResetPassDto } from './dto/reset-pass.dto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService){}

    @Get('/')
    @UseGuards(IsLogedInGuard)
    @UseGuards(IsBannedGuard)
    @HttpCode(200)
    auth(@Req() req) {
        return this.authService.auth(req);
    }

    @Post('/registration')
    @HttpCode(201)
    register(@Body() dto: RegisterUserDto){
        return this.authService.register(dto);
    }

    @Post('/login')
    @HttpCode(200)
    login(@Body() dto: LoginDto){
        return this.authService.login(dto);
    } 

    @Get('/logout')
    @UseGuards(IsLogedInGuard)
    @UseGuards(IsBannedGuard)
    @HttpCode(200)
    logout(@Req() req){
        return this.authService.logout(req);
    }

    @Post('/forgot-pass')
    @HttpCode(201)
    forgotPass(@Body() dto: ForgotPassDto){
        return this.authService.forgotPass(dto);
    }

    @Post('/reset-pass/:userId/:token')
    @HttpCode(200)
    resetPass(@Body() dto: ResetPassDto, @Param('userId') userId: string, @Param('token') token: string){
        return this.authService.resetPass(dto, userId, token);
    }

    @Get('/reset-pass/accept/:resetPasswordId')
    @Roles(['ADMIN'])
    @UseGuards(RolesGuard)
    @UseGuards(IsBannedGuard)
    @HttpCode(200)
    resetPassAccept(@Param('resetPasswordId') resetPasswordId: string, @Req() req){
        return this.authService.resetPassAccept(resetPasswordId, req);
    }
}
