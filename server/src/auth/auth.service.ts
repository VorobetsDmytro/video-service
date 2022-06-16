import { HttpException, Injectable } from '@nestjs/common';
import { PostgreSQLPrismaService } from '../db/postgreSQL.prisma.service';
import { RegisterUserDto } from './dto/register-user.dto';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { TokensService } from '../tokens/tokens.service';
import { ActivationLinksService } from '../activation-links/activation-links.service';
import { LoginDto } from './dto/login.dto';
import { LogsService } from '../logs/logs.service';
import { ForgotPassDto } from './dto/forgot-pass.dto';
import { ResetPasswordsService } from '../reset-passwords/reset-passwords.service';
import { ResetPassDto } from './dto/reset-pass.dto';
import { RoleTypes } from '../roles/roles.type';
import { MailTransporterService } from '../mail-transporter/mail-transporter.service';
import { SecuredUser, SelectSecuredUser } from '../users/users.type';
import { SubscriptionTypesService } from '../subscription-types/subscription-types.service';
import { SubscriptionType_Types } from '../subscription-types/subscription-types.type';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { User } from 'prisma/PostgreSQL/generated/client';
import { RolesService } from '../roles/roles.service';
import { Request } from 'express';

@Injectable()
export class AuthService {
    constructor(private postgreSQLService: PostgreSQLPrismaService,
                private usersService: UsersService,
                private tokensService: TokensService,
                private activationLinksService: ActivationLinksService,
                private logsService: LogsService,
                private resetPasswordsService: ResetPasswordsService,
                private mailTransporterService: MailTransporterService,
                private subscriptionTypesService: SubscriptionTypesService,
                private subscriptionsService: SubscriptionsService,
                private rolesService: RolesService){}
    
    async register(dto: RegisterUserDto) {
        const user = await this.usersService.getOneByEmail(dto.email);
        if(user)
            throw new HttpException('This email is already in use.', 400);
        const hashPassword = await bcrypt.hash(dto.password!, 5);
        const id = await this.usersService.generateUserId();
        const newUser = await this.usersService.createUser({ ...dto, id, password: hashPassword });
        if (!newUser)
            throw new HttpException('Error creating user.', 400);
        const subscriptionType = await this.subscriptionTypesService.getSubscriptionTypeByType(SubscriptionType_Types.STANDART);
        if(subscriptionType){
            const subscriptionId = await this.subscriptionsService.generateSubscriptionId();
            const expiresIn = new Date();
            expiresIn.setDate(new Date().getDate() + subscriptionType.duration);
            await this.subscriptionsService.createSubscription({
                id: subscriptionId,
                subscriptionTypeId: subscriptionType.id,
                downloadsLeft: subscriptionType.maxDownloads, 
                viewsForTodayLeft: subscriptionType.maxViews,
                userId: newUser.id,
                expiresIn
            });
        }
        const link = await this.activationLinksService.generateLink();
        const linkURL = this.activationLinksService.createActiovationLinkUrl(newUser.id, link);
        await this.activationLinksService.createActiovationLink({link, userId: newUser.id});
        await this.mailTransporterService.sendEmail(newUser.email, 'Activation link', `Your activation link: < ${linkURL} >`);
        const token = await this.tokensService.generateToken(newUser);
        if(!token)
            throw new HttpException('Error creating token.', 400);
        await this.tokensService.saveToken(newUser.id, token);
        await this.logsService.create({operation: 'Registration', createdBy: newUser.id});
        return { message: 'To complete your registration you have to move on the link in your email.' };
    }

    async validateSubscriptionExpires(user: User | SecuredUser){
        const subscription = await this.subscriptionsService.getSubscriptionByUserId(user.id);
        if(!subscription)
            throw new HttpException('The subscription was not found.', 400);
        if(subscription.subscriptionType.name !== SubscriptionType_Types.STANDART && subscription.expiresIn <= new Date()){
            await this.subscriptionsService.deleteSubscription(subscription);
            const subscriptionType = await this.subscriptionTypesService.getSubscriptionTypeByType(SubscriptionType_Types.STANDART);
            if(!subscriptionType)
                throw new HttpException('The subscription type was not found.', 400);
            const subscriptionId = await this.subscriptionsService.generateSubscriptionId();
            const expiresIn = new Date();
            expiresIn.setDate(new Date().getDate() + subscriptionType.duration);
            await this.subscriptionsService.createSubscription({
                id: subscriptionId, 
                userId: user.id,
                subscriptionTypeId: subscriptionType.id,
                downloadsLeft: subscriptionType.maxDownloads,
                viewsForTodayLeft: subscriptionType.maxViews,
                expiresIn
            });
        }
        return true;
    }

    async login(dto: LoginDto){
        const user = await this.usersService.getOneByEmail(dto.email);
        if(!user)
            throw new HttpException('Incorrect data.', 400);
        const lastBan = await this.usersService.isBanned(user);
        if(lastBan)
            throw new HttpException(`BANNED! By: <${lastBan.bannedById}> Reason: ${lastBan.banReason}`, 403);
        const activationLink = await this.postgreSQLService.activationlink.findFirst({where: {userId: user.id}});
        if(!activationLink || !activationLink.isActivated)
            throw new HttpException('Incorrect data.', 400);
        const comparePasswords = await bcrypt.compare(dto.password, user.password);
        if(!comparePasswords)
            throw new HttpException('Incorrect data.', 400);
        const role = await this.rolesService.getRoleById(user.roleId);
        if(!role)
            throw new HttpException('The role was not found.', 400);
        if(role.value !== RoleTypes.ADMIN)
            await this.validateSubscriptionExpires(user);
        const token = await this.tokensService.generateToken(user);
        if(!token)
            throw new HttpException('Error creating token.', 400);
        await this.tokensService.saveToken(user.id, token);
        await this.logsService.create({operation: 'Login', createdBy: user.id});
        const securedUser = await this.usersService.getOneById(user.id, SelectSecuredUser);
        return { token, user: securedUser };
    }

    async auth(req: Request) {
        const userReq = req.user as Express.User;
        const user = await this.usersService.getOneById(userReq.id, SelectSecuredUser);
        if(!user)
            throw new HttpException('No authorization', 401);
        const role = await this.rolesService.getRoleById(user.roleId);
        if(!role)
            throw new HttpException('The role was not found.', 400);
        if(role.value !== RoleTypes.ADMIN)
            await this.validateSubscriptionExpires(user);
        const token = await this.tokensService.generateToken(user);
        if(!token)
            throw new HttpException('Error creating token.', 400);
        await this.tokensService.saveToken(user.id, token);
        await this.logsService.create({operation: 'Auth', createdBy: user.id});
        return { token, user };
    }

    async logout(req: Request){
        const userReq = req.user as Express.User;
        const user = await this.usersService.getOneById(userReq.id, SelectSecuredUser);
        if(!user)
            throw new HttpException('No authorization', 401);
        const token = await this.postgreSQLService.token.findFirst({where: {userId: user.id}});
        if(!token)
            throw new HttpException('No authorization', 401);
        await this.tokensService.disactivateToken(token);
        await this.logsService.create({operation: 'Logout', createdBy: user.id});
        return { message: 'Logout has been executed successfully.' };
    }

    async forgotPass(dto: ForgotPassDto){
        const user = await this.usersService.getOneByEmail(dto.email);
        if(!user)
            throw new HttpException('Incorrect data.', 400);
        let resetPassword = await this.resetPasswordsService.getResetPasswordByUserId(user.id);
        let resetPasswordToken;
        if(!resetPassword){
            const tokenId = await this.resetPasswordsService.generateResetPasswordId();
            resetPasswordToken = await this.resetPasswordsService.generateResetPasswordToken();
            resetPassword = await this.resetPasswordsService.createResetPassword({userId: user.id, token: resetPasswordToken, id: tokenId});
        }else
            resetPasswordToken = resetPassword.token;
        const role = await this.postgreSQLService.role.findUnique({where: {id: user.roleId}});
        if(role.value === RoleTypes.SUBSCRIBER)
            return {message: `Wait for an admin approvement. After approvement you'll get the link on your email.`};
        const link = this.createResetPasswordLink(user.id, resetPasswordToken);
        await this.mailTransporterService.sendEmail(user.email, 'Reset password', link);
        await this.logsService.create({operation: 'Forgot password', createdBy: user.id});
        return {message: `To complete your resetting password you have to move on the link in your email.`};
    }

    async resetPass(dto: ResetPassDto, userId: string, token: string){
        const user = await this.usersService.getOneById(userId, SelectSecuredUser);
        if(!user)
            throw new HttpException('Incorrect data.', 400);
        const tokenDB = await this.resetPasswordsService.getTokenByUserIdAndTokenVal(userId, token);
        if(!tokenDB)
            throw new HttpException('Incorrect data.', 400);
        const role = await this.postgreSQLService.role.findUnique({where: {id: user.roleId}});
        if(role.value !== RoleTypes.ADMIN && !tokenDB.isApproved)
            return {message: `Your reset password request still hasn't been approved by an admin.`};
        const hashPassword = await bcrypt.hash(dto.password, 5);
        await this.usersService.updateUser({password: hashPassword}, user);
        await this.resetPasswordsService.deleteResetPassword(tokenDB);
        await this.logsService.create({operation: 'Reset password', createdBy: user.id});
        return {message: `The password was changed sucessfully.`};
    }

    async resetPassAccept(resetPasswordId: string, req: Request) {
        const userReq = req.user as Express.User;
        const user = await this.usersService.getOneById(userReq.id, SelectSecuredUser);
        if(!user)
            throw new HttpException('No authorization', 401);
        const resetPassword = await this.postgreSQLService.resetPassword.findUnique({where: {id: resetPasswordId}});
        if(!resetPassword)
            throw new HttpException(`This reset password doesn't exist.`, 400);
        if(resetPassword.isApproved)
            throw new HttpException('This reset password request has already approved.', 400)
        const userReset = await this.usersService.getOneById(resetPassword.userId, SelectSecuredUser);
        if(!userReset)
            throw new HttpException('Incorrect data.', 400);
        await this.postgreSQLService.resetPassword.update({data: {isApproved: true}, where: {id: resetPasswordId}});
        const link = await this.createResetPasswordLink(userReset.id, resetPassword.token);
        await this.mailTransporterService.sendEmail(userReset.email, 'Reset password', link);
        await this.logsService.create({operation: `Reset password accept. User id: < ${userReset.id} >`, createdBy: user.id});
        return {message: `The reset password request has been approved successfully.`};
    }

    createResetPasswordLink(userId: string, value: string): string {
        return `http://localhost:3000/forgot-pass/accept/${userId}/${value}`;
    }
}
