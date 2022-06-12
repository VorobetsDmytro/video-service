import { Body, Controller, Delete, Get, Param, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { IsBannedGuard } from '../guards/is-banned.guard';
import { Roles } from '../decorators/roles.decorator';
import { IsLogedInGuard } from '../guards/is-loged-in.guard';
import { RolesGuard } from '../guards/roles.guard';
import { CreateVideoDto } from './dto/create-video.dto';
import { EditVideoDto } from './dto/edit-video.dto';
import { VideosService } from './videos.service';

@Controller('videos')
export class VideosController {
    constructor(private videosService: VideosService){}

    @Post('/')
    @Roles(['ADMIN'])
    @UseGuards(RolesGuard)
    @UseGuards(IsBannedGuard)
    addVideo(@Body() dto: CreateVideoDto, @Req() req){
        return this.videosService.addVideo(dto, req);
    }

    @Get('/')
    @UseGuards(IsLogedInGuard)
    @UseGuards(IsBannedGuard)
    getAll(@Req() req){
        return this.videosService.getAll(req);
    }

    @Get('/:videoId')
    @UseGuards(IsLogedInGuard)
    @UseGuards(IsBannedGuard)
    getById(@Param('videoId') videoId: string, @Req() req){
        return this.videosService.getById(videoId, req);
    }

    @Get('/watch/:videoId')
    @UseGuards(IsLogedInGuard)
    @UseGuards(IsBannedGuard)
    watch(@Param('videoId') videoId: string, @Req() req, @Res() res){
        return this.videosService.watch(videoId, req, res);
    }

    @Get('/download/:videoId')
    @UseGuards(IsLogedInGuard)
    @UseGuards(IsBannedGuard)
    download(@Param('videoId') videoId: string, @Req() req, @Res() res) {
        return this.videosService.download(videoId, req, res);
    }

    @Patch('/:videoId')
    @Roles(['ADMIN'])
    @UseGuards(RolesGuard)
    @UseGuards(IsBannedGuard)
    edit(@Body() dto: EditVideoDto, @Param('videoId') videoId: string, @Req() req) {
        return this.videosService.edit(dto, videoId, req);
    }

    @Delete('/:videoId')
    @Roles(['ADMIN'])
    @UseGuards(RolesGuard)
    @UseGuards(IsBannedGuard)
    delete(@Param('videoId') videoId: string, @Req() req){
        return this.videosService.delete(videoId, req);
    }
}
