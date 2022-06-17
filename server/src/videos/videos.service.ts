import { forwardRef, HttpException, Inject, Injectable } from '@nestjs/common';
import { PostgreSQLPrismaService } from '../db/postgreSQL.prisma.service';
import { CreateVideoDto } from './dto/create-video.dto';
import * as fs from 'fs';
import * as vDuration from 'get-video-duration';
import { Prisma, Video } from 'prisma/PostgreSQL/generated/client';
import { v4 } from "uuid";
import { SelectSecuredUser, StandartUser } from '../users/users.type';
import { UsersService } from '../users/users.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { SubscriptionType_Types } from '../subscription-types/subscription-types.type';
import { RolesService } from '../roles/roles.service';
import { RoleTypes } from '../roles/roles.type';
import { EditVideoDto } from './dto/edit-video.dto';
import { CommentsService } from '../comments/comments.service';
import { LogsService } from '../logs/logs.service';
import { Response, Request } from 'express';

@Injectable()
export class VideosService {
    constructor(private postgreSQLService: PostgreSQLPrismaService,
                private usersService: UsersService,
                private subscriptionsService: SubscriptionsService,
                private rolesService: RolesService,
                @Inject(forwardRef(() => CommentsService)) private commentsService: CommentsService,
                private logsService: LogsService){}

    async addVideo(dto: CreateVideoDto, req: Request){
        const userReq = req.user as Express.User;
        const user = await this.usersService.getOneById(userReq.id, SelectSecuredUser);
        if(!user)
            throw new HttpException('The user was not found.', 404);
        if(!fs.existsSync(dto.videoPath))
            throw new HttpException('The video was not found.', 404);
        const duration = Math.floor(await vDuration.getVideoDurationInSeconds(dto.videoPath));
        const videoId = await this.generateVideoId();
        const video = await this.createVideo({...dto, id: videoId, duration});
        await this.logsService.create({operation: `Create video. Video id: < ${video.id} >`, createdBy: user.id});
        return {video, message: 'The video has been added successfully.'};
    }

    async edit(dto: EditVideoDto, videoId: string, req: Request){
        const userReq = req.user as Express.User;
        const user = await this.usersService.getOneById(userReq.id, SelectSecuredUser);
        if(!user)
            throw new HttpException('The user was not found.', 404);
        let video = await this.getVideoById(videoId);
        if(!video)
            throw new HttpException('The video was not found.', 404);
        if(dto.previewPath)
            if(fs.existsSync(video.previewPath))
                fs.unlinkSync(video.previewPath);
        video = await this.updateVideo(dto, video);
        await this.logsService.create({operation: `Edit video. Video id: < ${video.id} >`, createdBy: user.id});
        return {video, message: 'The video has been updated successfully.'};
    }

    async delete(videoId: string, req: Request){
        const userReq = req.user as Express.User;
        const user = await this.usersService.getOneById(userReq.id, SelectSecuredUser);
        if(!user)
            throw new HttpException('The user was not found.', 404);
        const video = await this.getVideoById(videoId);
        if(!video)
            throw new HttpException('The video was not found.', 404);
        await this.commentsService.deleteCommentsByVideoId(video.id);
        if(fs.existsSync(video.videoPath))
            fs.unlinkSync(video.videoPath);
        if(fs.existsSync(video.previewPath))
            fs.unlinkSync(video.previewPath);
        await this.deleteVideo(video);
        await this.logsService.create({operation: `Delete video. Video id: < ${video.id} >`, createdBy: user.id});
        return {message: 'The video has been deleted successfully.'}
    }

    async deleteVideo(video: Video) {
        return this.postgreSQLService.video.delete({where: {id: video.id}});
    }

    async createVideo(dto: Prisma.VideoUncheckedCreateInput){
        return this.postgreSQLService.video.create({data: dto});
    }

    async getById(videoId: string, req: Request){
        const userReq = req.user as Express.User;
        const user = await this.usersService.getOneById(userReq.id, SelectSecuredUser);
        if(!user)
            throw new HttpException('The user was not found.', 404);
        const video = await this.getVideoById(videoId);
        if(!video)
            throw new HttpException('The video was not found.', 404);
        const role = await this.rolesService.getRoleByValue(userReq.role);
        if(!role)
            throw new HttpException('The role was not found.', 404);
        let subscription = null;
        if(role.value !== RoleTypes.ADMIN){
            subscription = await this.subscriptionsService.getSubscriptionByUserId(user.id);
            if(!subscription)
                throw new HttpException('The subscription was not found.', 400);
            const canResetSubscription = await this.subscriptionsService.canResetSubscription(subscription);
            if(canResetSubscription){
                subscription = await this.subscriptionsService.resetSubscription(subscription);
                if(!subscription)
                    throw new HttpException('The subscription type was not found.', 400);
            }
        }
        await this.logsService.create({operation: `Get video by id. Video id: < ${video.id} >`, createdBy: user.id});
        return {
            video, 
            canWatchVideo: (subscription && (subscription.viewsForTodayLeft > 0 || subscription.lastViewedVideoId === video.id)) || (role.value === RoleTypes.ADMIN), 
            canAddComments: (subscription && subscription.subscriptionType.canAddComments) || (role.value === RoleTypes.ADMIN)
        };
    }

    async getAll(req: Request){
        const userReq = req.user as Express.User;
        const user = await this.usersService.getOneById(userReq.id, SelectSecuredUser);
        if(!user)
            throw new HttpException('The user was not found.', 404);
        const role = await this.rolesService.getRoleById(user.roleId);
        if(!role)
            throw new HttpException('The role was not found.', 404);
        let subscription = null;
        if(role.value !== RoleTypes.ADMIN){
            subscription = await this.subscriptionsService.getSubscriptionByUserId(user.id);
            if(!subscription)
                throw new HttpException('The subscription was not found.', 404);
            const canResetSubscription = await this.subscriptionsService.canResetSubscription(subscription);
            if(canResetSubscription){
                subscription = await this.subscriptionsService.resetSubscription(subscription);
                if(!subscription)
                    throw new HttpException('The subscription type was not found.', 404);
            }
        }
        const videos = await this.postgreSQLService.video.findMany({include: {comments: { include: {user: {select: StandartUser}}}}, orderBy: {createdAt: 'desc'}});
        await this.logsService.create({operation: `Get all the video`, createdBy: user.id});
        return {
            videos, 
            canDownloadVideo: (subscription && (subscription.downloadsLeft > 0 || subscription.subscriptionType.name !== SubscriptionType_Types.STANDART))
                              || (role.value === RoleTypes.ADMIN)
        };
    }

    async watch(videoId: string, req: Request, res: Response){
        const userReq = req.user as Express.User;
        const user = await this.usersService.getOneById(userReq.id, SelectSecuredUser);
        if(!user)
            throw new HttpException('The user was not found.', 404);
        const video = await this.getVideoById(videoId);
        if(!video)
            throw new HttpException('The video was not found.', 404);
        const role = await this.rolesService.getRoleById(user.roleId);
        if(!role)
            throw new HttpException('The role was not found.', 404);
        if(role.value !== RoleTypes.ADMIN){
            let subscription = await this.subscriptionsService.getSubscriptionByUserId(user.id);
            if(!subscription)
                throw new HttpException('The subscription was not found.', 404);
            if(subscription.subscriptionType.name === SubscriptionType_Types.STANDART)
                throw new HttpException(`You don't have this permission. Buy a more better subscription for it.`, 400);
            const canResetSubscription = await this.subscriptionsService.canResetSubscription(subscription);
            if(canResetSubscription){
                subscription = await this.subscriptionsService.resetSubscription(subscription);
                if(!subscription)
                    throw new HttpException('The subscription type was not found.', 404);
            }
            if(subscription.viewsForTodayLeft <= 0 && subscription.lastViewedVideoId !== video.id)
                throw new HttpException(`Your access to view is exhausted. Come tomorrow!`, 400);
            const viewsForTodayLeft = subscription.subscriptionType.name !== SubscriptionType_Types.GOLD && subscription.lastViewedVideoId !== video.id
                                    ? subscription.viewsForTodayLeft - 1 
                                    : subscription.viewsForTodayLeft;
            await this.subscriptionsService.updateSubscription({...subscription, viewsForTodayLeft, lastViewedVideoId: video.id, lastView: new Date()});
        }
        await this.logsService.create({operation: `Watch the video. Video id: < ${video.id} >`, createdBy: user.id});
        this.sendVideoChunk(video, req, res);
    }

    async download(videoId: string, req: Request, res: Response) {
        const userReq = req.user as Express.User;
        const user = await this.usersService.getOneById(userReq.id, SelectSecuredUser);
        if(!user)
            throw new HttpException('The user was not found.', 404);
        const video = await this.getVideoById(videoId);
        if(!video)
            throw new HttpException('The video was not found.', 404);
        const role = await this.rolesService.getRoleById(user.roleId);
        if(!role)
            throw new HttpException('The role was not found.', 404);
        if(role.value !== RoleTypes.ADMIN){
            let subscription = await this.subscriptionsService.getSubscriptionByUserId(user.id);
            if(!subscription)
                throw new HttpException('The subscription was not found.', 404);
            const canResetSubscription = await this.subscriptionsService.canResetSubscription(subscription);
            if(canResetSubscription){
                subscription = await this.subscriptionsService.resetSubscription(subscription);
                if(!subscription)
                    throw new HttpException('The subscription type was not found.', 404);
            }
            if(subscription.downloadsLeft <= 0)
                throw new HttpException(`Your access to download is exhausted.`, 400);
            const downloadsLeft = subscription.subscriptionType.name === SubscriptionType_Types.STANDART
                                ? subscription.downloadsLeft - 1 
                                : subscription.downloadsLeft;
            await this.subscriptionsService.updateSubscription({...subscription, downloadsLeft, lastDownload: new Date()});
        }
        await this.logsService.create({operation: `Download the video. Video id: < ${video.id} >`, createdBy: user.id});
        this.sendVideoChunk(video, req, res);
    }

    sendVideoChunk(video: Video, req: Request, res: Response) {
        const videoStat = fs.statSync(video.videoPath);
        const fileSize = videoStat.size;
        const videoRange = req.headers.range;
        if(!videoRange)
            throw new HttpException('Error getting video.', 400);
        const chunks = videoRange.replace(/bytes=/, '').split('-');
        const start = parseInt(chunks[0], 10);
        const end = chunks[1] ? parseInt(chunks[1], 10): fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(video.videoPath, {start, end});
        const headers = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4',
        };
        res.writeHead(206, headers);
        file.pipe(res);
    }

    async updateVideo(dto: EditVideoDto, video: Video) {
        return this.postgreSQLService.video.update({data: dto, where: {id: video.id}});
    }

    async getVideoById(id: string): Promise<Video | null> {
        return this.postgreSQLService.video.findUnique({where: {id}, include: {comments: { include: {user: {select: SelectSecuredUser}}}}});
    }

    async generateVideoId(): Promise<string>{
        let video: Video | null, id: string;
        do {
            id = v4();
            video = await this.postgreSQLService.video.findUnique({where: {id}});
        } while (video);
        return id;
    }
}
