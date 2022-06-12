import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { IsBannedGuard } from '../guards/is-banned.guard';
import { IsLogedInGuard } from '../guards/is-loged-in.guard';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { EditCommentDto } from './dto/edit-comment.dto';

@Controller('comments')
export class CommentsController {
    constructor(private commentsService: CommentsService){}

    @Post('/')
    @UseGuards(IsLogedInGuard)
    @UseGuards(IsBannedGuard)
    create(@Body() dto: CreateCommentDto, @Req() req){
        return this.commentsService.create(dto, req);
    }

    @Patch('/:commentId')
    @UseGuards(IsLogedInGuard)
    @UseGuards(IsBannedGuard)
    edit(@Body() dto: EditCommentDto, @Param('commentId') commentId: string, @Req() req){
        return this.commentsService.edit(dto, commentId, req);
    }

    @Delete('/:commentId')
    @UseGuards(IsLogedInGuard)
    @UseGuards(IsBannedGuard)
    delete(@Param('commentId') commentId: string, @Req() req) {
        return this.commentsService.delete(commentId, req);
    }
}
