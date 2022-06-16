import { HttpException, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { ChangeProfileDto } from './dto/change-profile.dto';
import * as fs from 'fs';
import * as bcrypt from 'bcryptjs';
import { ChangeEmail, User } from 'prisma/PostgreSQL/generated/client';
import { PostgreSQLPrismaService } from '../db/postgreSQL.prisma.service';
import { SecuredUser, SelectFullUser, SelectSecuredUser } from '../users/users.type';
import { RolesService } from '../roles/roles.service';
import { RoleTypes } from '../roles/roles.type';
import { ChangeEmailAcceptDto } from './dto/change-email-accept.dto';
import { v4 } from "uuid";
import { MailTransporterService } from '../mail-transporter/mail-transporter.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { LogsService } from '../logs/logs.service';
import { Request } from 'express';

@Injectable()
export class ProfilesService {
    constructor(private postgreSQLService: PostgreSQLPrismaService,
                private usersService: UsersService,
                private rolesService: RolesService,
                private mailTransporterService: MailTransporterService,
                private subscriptionsService: SubscriptionsService,
                private logsService: LogsService){}

    async getProfile(req: Request){
        const userReq = req.user as Express.User;
        const role = await this.rolesService.getRoleByValue(userReq.role);
        if(!role)
            throw new HttpException('The role was not found.', 400);
        const selectUser = role.value === RoleTypes.SUBSCRIBER ? SelectSecuredUser : SelectFullUser;
        const user = await this.usersService.getOneById(userReq.id, selectUser);
        if(!user)
            throw new HttpException('The user was not found.', 400);
        let subscription = null;
        if(role.value !== RoleTypes.ADMIN) {
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
        await this.logsService.create({operation: `Get profile`, createdBy: user.id});
        return {...user, subscription};
    }

    async getProfileByUserId(userId: string, req: Request) {
        const userReq = req.user as Express.User;
        const user = await this.usersService.getOneById(userReq.id, SelectSecuredUser);
        if(!user)
            throw new HttpException('The user was not found.', 400);
        const userProfile = await this.usersService.getOneById(userId, SelectFullUser);
        if(!userProfile)
            throw new HttpException('The user was not found.', 400);
        const role = await this.rolesService.getRoleById(userProfile.roleId);
        if(!role)
            throw new HttpException('The role was not found.', 400);
        let subscription = null;
        if(role.value !== RoleTypes.ADMIN){
            subscription = await this.subscriptionsService.getSubscriptionByUserId(userProfile.id);
            if(!subscription)
                throw new HttpException('The subscription was not found.', 400);
            const canResetSubscription = await this.subscriptionsService.canResetSubscription(subscription);
            if(canResetSubscription){
                subscription = await this.subscriptionsService.resetSubscription(subscription);
                if(!subscription)
                    throw new HttpException('The subscription type was not found.', 400);
            }
        }
        await this.logsService.create({operation: `Get profile by user id. User id: < ${userId} >`, createdBy: user.id});
        return {...userProfile, subscription};
    }

    async changeProfile(dto: ChangeProfileDto, req: Request){
        const userReq = req.user as Express.User;
        let user = await this.usersService.getOneById(userReq.id, SelectSecuredUser);
        if(!user)
            throw new HttpException('The user was not found.', 400);
        let message = '';
        if(dto.email) {
            const checkEmail = await this.postgreSQLService.user.findFirst({where: {email: dto.email}});
            if(checkEmail)
                throw new HttpException('This email is already in use.', 400);
            let changeEmail = await this.postgreSQLService.changeEmail.findFirst({where: {userId: userReq.id}});
            if(!changeEmail){
                const changeEmailId = await this.generateChangeEmailId();
                changeEmail = await this.postgreSQLService.changeEmail.create({data: {id: changeEmailId, newEmail: dto.email, userId: userReq.id}});
            } else
                changeEmail = await this.postgreSQLService.changeEmail.update({data: {newEmail: dto.email}, where: {id: changeEmail.id}});
            const link = this.createChangeEmailLink(changeEmail.id);
            await this.mailTransporterService.sendEmail(dto.email, 'Change email', link);
            message = 'To complete your changing email you have to move on the link in your new email.'
        }
        if(dto.firstname)
            user = await this.postgreSQLService.user.update({data: {firstname: dto.firstname}, where: {id: user.id}});
        if(dto.lastname)
            user = await this.postgreSQLService.user.update({data: {lastname: dto.lastname}, where: {id: user.id}});
        if(dto.avatar){
            user = await this.uploadAvatar(user, dto.avatar);
            if(!user)
             throw new HttpException('This avatar was not found.', 400);
        }
        await this.logsService.create({operation: `Change profile`, createdBy: user.id});
        return {user, message};
    }

    createChangeEmailLink(changeEmailId: string): string {
        return `http://localhost:3000/profile/change-email/accept/${changeEmailId}`;
    }

    deleteFile(filePath: string): string | null{
        if(!fs.existsSync(filePath))
            return null;
        fs.unlinkSync(filePath);
        return filePath;
    }

    async uploadAvatar(user: User | SecuredUser, avatar: string): Promise<User | null> {
        if(!fs.existsSync(avatar))
            return null;
        if(user.avatar)
            this.deleteFile(user.avatar);
        return this.postgreSQLService.user.update({data: {avatar}, where: {id: user.id}});
    }

    async generateChangeEmailId() {
        let changeEmail: ChangeEmail | null, id: string;
        do {
            id = v4();
            changeEmail = await this.postgreSQLService.changeEmail.findUnique({where: {id}});
        } while (changeEmail);
        return id;
    }

    async getAllChangeEmailRequests(req: Request){
        const userReq = req.user as Express.User;
        const user = await this.postgreSQLService.user.findUnique({where: {id: userReq.id}});
        if(!user)
            throw new HttpException('No authorization', 401);
        await this.logsService.create({operation: `Get all change email requests`, createdBy: user.id});
        return this.postgreSQLService.changeEmail.findMany();
    }

    async changeEmailAccept(dto: ChangeEmailAcceptDto, changeEmailId: string, req){
        const userReq = req.user as Express.User;
        const user = await this.postgreSQLService.user.findUnique({where: {id: userReq.id}});
        if(!user)
            throw new HttpException('No authorization', 401);
        const comparePasswords = await bcrypt.compare(dto.password, user.password);
        if(!comparePasswords)
            throw new HttpException('Incorrect data.', 400);
        const changeEmail = await this.postgreSQLService.changeEmail.findUnique({where: {id: changeEmailId}});
        if(!changeEmail)
            throw new HttpException(`The change email request wasn't found`, 400);
        const checkEmail = await this.postgreSQLService.user.findFirst({where: {email: changeEmail.newEmail}});
        if(checkEmail){
            await this.postgreSQLService.changeEmail.delete({where: {id: changeEmail.id}});
            throw new HttpException('This email is already in use.', 400);
        }
        await this.postgreSQLService.user.update({data: {email: changeEmail.newEmail}, where: {id: changeEmail.userId}});
        await this.postgreSQLService.changeEmail.delete({where: {id: changeEmail.id}});
        await this.logsService.create({operation: `Change email accept. User id: < ${changeEmail.userId} >`, createdBy: user.id});
        return { message: 'The email has been changed successfully.' }
    }
}
