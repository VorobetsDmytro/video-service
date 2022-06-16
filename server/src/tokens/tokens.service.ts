import { HttpException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User, Token } from 'prisma/PostgreSQL/generated/client';
import { PostgreSQLPrismaService } from '../db/postgreSQL.prisma.service';
import { LogsService } from '../logs/logs.service';
import { RolesService } from '../roles/roles.service';
import { UsersService } from '../users/users.service';
import { SecuredUser, SelectSecuredUser } from '../users/users.type';
import { Request } from 'express';

@Injectable()
export class TokensService {
    constructor(private jwtService: JwtService,
                private postgreSQLService: PostgreSQLPrismaService,
                private logsService: LogsService,
                private rolesService: RolesService,
                private usersService: UsersService){}
    
    async generateToken(user: User | SecuredUser): Promise<string> {
        const role = await this.rolesService.getRoleById(user.roleId);
        if(!role)
            return null;
        const payload = {
            id: user.id,
            email: user.email,
            role: role.value
        }
        return this.jwtService.sign(payload);
    }

    async saveToken(userId: string, accessToken: string): Promise<Token> {
        const token = await this.postgreSQLService.token.findFirst({where: {userId}});
        if(!token)
            return this.postgreSQLService.token.create({
                data: {
                    userId,
                    accessToken,
                    isActive: true,
                    lastAuthorization: new Date()
                }
            });
        return this.postgreSQLService.token.update({
            data: { accessToken, isActive: true, lastAuthorization: new Date() },
            where: { userId }
        });
    }

    async getAll(req: Request): Promise<Token[]>{
        const userReq = req.user as Express.User;
        const user = await this.usersService.getOneById(userReq.id, SelectSecuredUser);
        if(!user)
            throw new HttpException('The user was not found.', 400);
        await this.logsService.create({operation: `Get all the tokens`, createdBy: user.id});
        return this.postgreSQLService.token.findMany();
    }

    async disactivateToken(token: Token): Promise<Token> {
        return this.postgreSQLService.token.update({data: {isActive: false}, where: {userId: token.userId}});
    }
}
