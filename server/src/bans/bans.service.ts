import { forwardRef, HttpException, Inject, Injectable } from '@nestjs/common';
import { Ban, Prisma, User } from 'prisma/PostgreSQL/generated/client';
import { PostgreSQLPrismaService } from '../db/postgreSQL.prisma.service';
import { LogsService } from '../logs/logs.service';
import { UsersService } from '../users/users.service';
import { SecuredUser, SelectSecuredUser } from '../users/users.type';
import { v4 }from 'uuid';
import { CreateBanDto } from './dto/create-ban.dto';
import { GetUserIdParamsDto } from './dto/get-userId.dto';

@Injectable()
export class BansService {
    constructor(private postgreSQLService: PostgreSQLPrismaService,
                @Inject(forwardRef(() => UsersService)) private usersService: UsersService,
                private logsService: LogsService){}

    async ban(dtoBody: CreateBanDto, dtoParams: GetUserIdParamsDto, req){
        const reqUser = req.user as Express.User;
        if(!dtoParams.userId)
            throw new HttpException('The user was not found.', 400);
        const user = await this.usersService.getOneById(reqUser.id, SelectSecuredUser);
        if(!user)
            throw new HttpException('The user was not found.', 400);
        const banUser = await this.usersService.getOneById(dtoParams.userId, SelectSecuredUser);
        if(!banUser)
            throw new HttpException('The user was not found.', 400);
        if(user.id === banUser.id)
            throw new HttpException('You cannot ban yourself.', 400);
        const lastBan = await this.isBanned(banUser);
        if(lastBan && !lastBan.unBannedAt)
            throw new HttpException('This user has already been banned', 400);
        const banId = await this.generateBanId();
        const ban = await this.createBan({...dtoBody, id: banId, userId: banUser.id, bannedById: reqUser.id});
        await this.logsService.create({operation: `Ban user. Ban id: < ${ban.id} >`, createdBy: user.id});
        return ban;
    }

    async unban(dtoParams: GetUserIdParamsDto, req){
        const userReq = req.user as Express.User;
        const user = await this.usersService.getOneById(userReq.id, SelectSecuredUser);
        if(!user)
            throw new HttpException('No authorization', 401);
        if(!dtoParams.userId)
            throw new HttpException('The user was not found.', 400);
        const ubanUser = await this.usersService.getOneById(dtoParams.userId, SelectSecuredUser);
        if(!ubanUser)
            throw new HttpException('The user was not found.', 400);
        let lastBan = await this.isBanned(ubanUser);
        if(!lastBan)
            throw new HttpException('This user is not banned.', 400);
        lastBan = await this.unbanUser(lastBan);
        await this.logsService.create({operation: `Unban user. Ban id: < ${lastBan.id} >`, createdBy: user.id});
        return lastBan;
    }

    async isBanned(user: User | SecuredUser): Promise<Ban | null> {
        const bans = await this.postgreSQLService.ban.findMany({where: {userId: user.id}});
        if(bans.length === 0)
            return null;
        const lastBan = bans[bans.length - 1];
        if(lastBan.unBannedAt)
            return null;
        return lastBan;
    }
    
    async generateBanId(){
        let ban: Ban | null, id: string;
        do {
            id = v4();
            ban = await this.postgreSQLService.ban.findUnique({where: {id}});
        } while (ban);
        return id;
    }

    async getBansByUserId(userId: string): Promise<Ban[]> {
        return this.postgreSQLService.ban.findMany({where: {userId}});
    }

    async createBan(dto: Prisma.BanUncheckedCreateInput): Promise<Ban> {
        return this.postgreSQLService.ban.create({data: dto});
    }

    async unbanUser(ban: Ban): Promise<Ban> {
        return this.postgreSQLService.ban.update({data: {unBannedAt: new Date()}, where: {id: ban.id}});
    }
}
