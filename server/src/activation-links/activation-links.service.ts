import { HttpException, Injectable } from '@nestjs/common';
import { Activationlink } from 'prisma/PostgreSQL/generated/client';
import { PostgreSQLPrismaService } from '../db/postgreSQL.prisma.service';
import { v4 } from "uuid";
import * as bcrypt from 'bcryptjs';
import { ActivationDto } from './dto/activation.dto';
import { CreateActiovationLinkDto } from './dto/create-actvation-link.dto';
import { LogsService } from '../logs/logs.service';
import { UsersService } from '../users/users.service';
import { SelectSecuredUser } from '../users/users.type';
import { Request } from 'express';

@Injectable()
export class ActivationLinksService {
    constructor(private postgreSQLService: PostgreSQLPrismaService,
                private logsService: LogsService,
                private usersService: UsersService){}

    async activation(dto: ActivationDto, userId: string, link: string){
        const user = await this.postgreSQLService.user.findUnique({where: {id: userId}});
        if(!user)
            throw new HttpException('Incorrect data.', 400);
        const comparePasswords = await bcrypt.compare(dto.password, user.password);
        if(!comparePasswords)
            throw new HttpException('Incorrect data.', 400);
        const activationLink = await this.postgreSQLService.activationlink.findFirst({where: {userId, link}});
        if(!activationLink || activationLink.isActivated)
            throw new HttpException('Incorrect data.', 400);
        await this.postgreSQLService.activationlink.update({data: {isActivated: true}, where: {userId}});
        await this.logsService.create({operation: 'Account activation', createdBy: user.id});
        return { message: 'Your account has been activated successfully!' };
    }

    async generateLink(): Promise<string>{
        let activationlink: Activationlink | null, link: string;
        do {
            link = v4();
            activationlink = await this.postgreSQLService.activationlink.findUnique({where: {link}});
        } while (activationlink);
        return link;
    }

    createActiovationLinkUrl(userId: string, link: string): string{
        return `http://localhost:3000/registration/accept/${userId}/${link}`;
    }

    async createActiovationLink(dto: CreateActiovationLinkDto): Promise<Activationlink>{
        return this.postgreSQLService.activationlink.create({data: dto});
    }

    async getAll(req: Request): Promise<Activationlink[]>{
        const userReq = req.user as Express.User;
        const user = await this.usersService.getOneById(userReq.id, SelectSecuredUser);
        if(!user)
            throw new HttpException('The user was not found.', 404);
        await this.logsService.create({operation: 'Get all acivation links', createdBy: user.id});
        return this.postgreSQLService.activationlink.findMany();
    }
}
