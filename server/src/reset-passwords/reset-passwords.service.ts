import { HttpException, Injectable } from '@nestjs/common';
import { PostgreSQLPrismaService } from '../db/postgreSQL.prisma.service';
import { Prisma, ResetPassword } from '../../prisma/PostgreSQL/generated/client';
import { v4 } from "uuid";
import { UsersService } from '../users/users.service';
import { SelectSecuredUser } from '../users/users.type';
import { LogsService } from '../logs/logs.service';

@Injectable()
export class ResetPasswordsService {
    constructor(private postgreSQLService: PostgreSQLPrismaService,
                private usersService: UsersService,
                private logsService: LogsService){}

    async getAll(req): Promise<ResetPassword[]>{
        const userReq = req.user as Express.User;
        const user = await this.usersService.getOneById(userReq.id, SelectSecuredUser);
        if(!user)
            throw new HttpException('The user was not found.', 400);
         await this.logsService.create({operation: `Get all the reset password requests`, createdBy: user.id});
        return this.postgreSQLService.resetPassword.findMany();
    }

    async getResetPasswordByUserId(userId: string): Promise<ResetPassword | null> {
        return this.postgreSQLService.resetPassword.findFirst({where: {userId}});
    }

    async getTokenByUserIdAndTokenVal(userId: string, token: string): Promise<ResetPassword | null>{
        return this.postgreSQLService.resetPassword.findFirst({where: {userId, token}});
    }

    async createResetPassword(dto: Prisma.ResetPasswordUncheckedCreateInput): Promise<ResetPassword>{
        return this.postgreSQLService.resetPassword.create({data: dto});
    }

    async generateResetPasswordToken(): Promise<string> {
        let resetPassword: ResetPassword | null, token: string;
        do {
            token = v4();
            resetPassword = await this.postgreSQLService.resetPassword.findFirst({where: {token}});
        } while (resetPassword);
        return token;
    }

    async generateResetPasswordId(): Promise<string>{
        let resetPassword: ResetPassword | null, id: string;
        do {
            id = v4();
            resetPassword = await this.postgreSQLService.resetPassword.findUnique({where: {id}});
        } while (resetPassword);
        return id;
    }

    async deleteResetPassword(resetToken: ResetPassword): Promise<ResetPassword> {
        return this.postgreSQLService.resetPassword.delete({where: {id: resetToken.id}});
    }
}
