import { forwardRef, HttpException, Inject, Injectable } from '@nestjs/common';
import { Comment, Prisma } from 'prisma/PostgreSQL/generated/client';
import { PostgreSQLPrismaService } from '../db/postgreSQL.prisma.service';
import { UsersService } from '../users/users.service';
import { SelectSecuredUser } from '../users/users.type';
import { VideosService } from '../videos/videos.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { v4 } from "uuid";
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { RolesService } from '../roles/roles.service';
import { RoleTypes } from '../roles/roles.type';
import { LogsService } from '../logs/logs.service';
import { EditCommentDto } from './dto/edit-comment.dto';

@Injectable()
export class CommentsService {
    constructor(private postgreSQLService: PostgreSQLPrismaService,
                private usersService: UsersService,
                @Inject(forwardRef(() => VideosService)) private videosService: VideosService,
                private subscriprionsService: SubscriptionsService,
                private rolesService: RolesService,
                private logsService: LogsService){}

    async create(dto: CreateCommentDto, req){
        const userReq = req.user as Express.User;
        const user = await this.usersService.getOneById(userReq.id, SelectSecuredUser);
        if(!user)
            throw new HttpException('The user was not found.', 400);
        const video = await this.videosService.getVideoById(dto.videoId);
        if(!video)
            throw new HttpException('The video was not found.', 400);
        const role = await this.rolesService.getRoleByValue(userReq.role);
        if(!role)
            throw new HttpException('The role was not found.', 400);
        if(role.value !== RoleTypes.ADMIN){
            const subscription = await this.subscriprionsService.getSubscriptionByUserId(user.id);
            if(!subscription)
                throw new HttpException('The subscription was not found.', 400);
            if(!subscription.subscriptionType.canAddComments)
                throw new HttpException(`You don't have this permission. Buy a more better subscription for it.`, 400);
        }
        const commentId = await this.generateCommentId();
        const comment = await this.createComment({...dto, id: commentId, userId: user.id});
        await this.logsService.create({operation: `Create comment: Comment id: < ${comment.id} >`, createdBy: user.id});
        return {comment};
    }

    async edit(dto: EditCommentDto, commentId: string, req){
        const userReq = req.user as Express.User;
        const user = await this.usersService.getOneById(userReq.id, SelectSecuredUser);
        if(!user)
            throw new HttpException('The user was not found.', 400);
        let comment = await this.getCommentById(commentId);
        if(!comment)
            throw new HttpException('The comment was not found.', 400);
        comment = await this.updateComment(dto, comment);
        await this.logsService.create({operation: `Edit the comment. Comment id: < ${comment.id} >`, createdBy: user.id});
        return {comment};
    }

    async delete(commentId: string, req){
        const userReq = req.user as Express.User;
        const user = await this.usersService.getOneById(userReq.id, SelectSecuredUser);
        if(!user)
            throw new HttpException('The user was not found.', 400);
        const role = await this.rolesService.getRoleById(user.roleId);
        if(!role)
            throw new HttpException('The role was not found.', 400);
        let comment: Comment;
        if(role.value === RoleTypes.ADMIN)
            comment = await this.getCommentById(commentId);
        else
            comment = await this.getCommentByIdAndUserId(commentId, user.id);
        if(!comment)
            throw new HttpException('The comment was not found.', 400);
        await this.deleteComment(comment);
        await this.logsService.create({operation: `Delete comment: Comment id: < ${comment.id} >`, createdBy: user.id});
        return {comment};
    }

    async deleteComment(comment: Comment) {
        return this.postgreSQLService.comment.delete({where: {id: comment.id}});
    }

    async getCommentById(id: string) {
        return this.postgreSQLService.comment.findFirst({where: {id}});
    }

    async getCommentByIdAndUserId(id: string, userId: string) {
        return this.postgreSQLService.comment.findFirst({where: {id, userId}});
    }

    async deleteCommentsByVideoId(videoId: string) {
        return this.postgreSQLService.comment.deleteMany({where: {videoId}});
    }

    async createComment(dto: Prisma.CommentUncheckedCreateInput): Promise<Comment>{
        return this.postgreSQLService.comment.create({data: dto, include: {user: {select: SelectSecuredUser}}});
    }

    async updateComment(dto: Prisma.CommentUncheckedUpdateInput, comment: Comment): Promise<Comment>{
        return this.postgreSQLService.comment.update({data: dto, where: {id: comment.id}});
    }

    async generateCommentId(): Promise<string>{
        let comment: Comment | null, id: string;
        do {
            id = v4();
            comment = await this.postgreSQLService.comment.findUnique({where: {id}});
        } while (comment);
        return id;
    }
}
