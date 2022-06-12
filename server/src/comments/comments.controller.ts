import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { IsBannedGuard } from '../guards/is-banned.guard';
import { IsLogedInGuard } from '../guards/is-loged-in.guard';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('comments')
export class CommentsController {
    constructor(private commentsService: CommentsService){}

    @Post('/')
    @UseGuards(IsLogedInGuard)
    @UseGuards(IsBannedGuard)
    create(@Body() dto: CreateCommentDto, @Req() req){
        return this.commentsService.create(dto, req);
    }

    @Delete('/:commentId')
    @UseGuards(IsLogedInGuard)
    @UseGuards(IsBannedGuard)
    delete(@Param('commentId') commentId: string, @Req() req) {
        return this.commentsService.delete(commentId, req);
    }
}
