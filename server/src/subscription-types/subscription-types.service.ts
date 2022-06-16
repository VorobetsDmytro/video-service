import { HttpException, Injectable } from '@nestjs/common';
import { Prisma, SubscriptionType } from 'prisma/PostgreSQL/generated/client';
import { PostgreSQLPrismaService } from '../db/postgreSQL.prisma.service';
import { CreateSubscriptionTypeDto } from './dto/create-subscription-type.dto';
import { v4 } from "uuid";
import { UsersService } from '../users/users.service';
import { LogsService } from '../logs/logs.service';
import { SelectSecuredUser } from '../users/users.type';
import { Request } from 'express';

@Injectable()
export class SubscriptionTypesService {
    constructor(private postgreSQLService: PostgreSQLPrismaService,
                private usersService: UsersService,
                private logsService: LogsService){}

    async create(dto: CreateSubscriptionTypeDto, req: Request){
        const userReq = req.user as Express.User;
        const user = await this.usersService.getOneById(userReq.id, SelectSecuredUser);
        if(!user)
            throw new HttpException('The user was not found.', 400);
        const checkSubscriptionType = await this.getSubscriptionTypeByType(dto.name);
        if(checkSubscriptionType)
            throw new HttpException('This subscription type already exists.', 400);
        const subscriptionTypeId = await this.generateSubscriptionTypeId();
        await this.logsService.create({operation: `Create subscription type. Subscription type id: < ${subscriptionTypeId} >`, createdBy: user.id});
        return this.createSubscriptionType({...dto, id: subscriptionTypeId});
    }

    async delete(name: string, req: Request){
        const userReq = req.user as Express.User;
        const user = await this.usersService.getOneById(userReq.id, SelectSecuredUser);
        if(!user)
            throw new HttpException('The user was not found.', 400);
        const subscriptionTypeName = await this.deleteSubscriptionTypeByName(name);
        if(!subscriptionTypeName)
            throw new HttpException('This subscription type was not found.', 400);
        await this.logsService.create({operation: `Delete subscription type. Subscription type name: < ${subscriptionTypeName} >`, createdBy: user.id});
        return { subscriptionTypeName };
    }

    async deleteSubscriptionTypeByName(name: string): Promise<string | null> {
        const subscriptionType = await this.postgreSQLService.subscriptionType.findFirst({where: {name}});
        if(!subscriptionType)
            return null;
        await this.postgreSQLService.subscriptionType.delete({where: {id: subscriptionType.id}});
        return name;
    }

    async createSubscriptionType(dto: Prisma.SubscriptionTypeUncheckedCreateInput){
        return this.postgreSQLService.subscriptionType.create({data: dto});
    }

    async getSubscriptionTypeById(id: string): Promise<SubscriptionType | null>{
        return this.postgreSQLService.subscriptionType.findUnique({where: {id}});
    }

    async getSubscriptionTypeByType(name: string): Promise<SubscriptionType | null>{
        return this.postgreSQLService.subscriptionType.findFirst({where: {name}});
    }

    async getAll(req: Request): Promise<SubscriptionType[]>{
        const userReq = req.user as Express.User;
        const user = await this.usersService.getOneById(userReq.id, SelectSecuredUser);
        if(!user)
            throw new HttpException('The user was not found.', 400);
        await this.logsService.create({operation: `Get all the subscription types`, createdBy: user.id});
        return this.postgreSQLService.subscriptionType.findMany();
    }

    async generateSubscriptionTypeId(): Promise<string>{
        let subscriptionType: SubscriptionType | null, id: string;
        do {
            id = v4();
            subscriptionType = await this.postgreSQLService.subscriptionType.findUnique({where: {id}});
        } while (subscriptionType);
        return id;
    }
}
