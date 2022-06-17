import { HttpException, Injectable } from '@nestjs/common';
import { Prisma, Subscription, SubscriptionType } from 'prisma/PostgreSQL/generated/client';
import { CreditCardsService } from '../credit-cards/credit-cards.service';
import { PostgreSQLPrismaService } from '../db/postgreSQL.prisma.service';
import { LogsService } from '../logs/logs.service';
import { SubscriptionTypesService } from '../subscription-types/subscription-types.service';
import { UsersService } from '../users/users.service';
import { SelectSecuredUser } from '../users/users.type';
import { v4 } from "uuid";
import { ChangeSubscriptionDto } from './dto/change-subscription.dto';
import { Request } from 'express';

@Injectable()
export class SubscriptionsService {
    constructor(private postgreSQLService: PostgreSQLPrismaService,
                private usersService: UsersService,
                private subscriptionTypesService: SubscriptionTypesService,
                private creditCardsService: CreditCardsService,
                private logsService: LogsService){}

    async createSubscription(dto: Prisma.SubscriptionUncheckedCreateInput): Promise<Subscription>{
        return this.postgreSQLService.subscription.create({data: dto});
    }

    async getAll(req: Request): Promise<Subscription[]>{
        const userReq = req.user as Express.User;
        const user = await this.usersService.getOneById(userReq.id, SelectSecuredUser);
        if(!user)
            throw new HttpException('The user was not found.', 404);
        await this.logsService.create({operation: `Get all the subscriptions`, createdBy: user.id});
        return this.postgreSQLService.subscription.findMany();
    }

    async changeSubscription(dto: ChangeSubscriptionDto, req: Request){
        const userReq = req.user as Express.User;
        const user = await this.usersService.getOneById(userReq.id, SelectSecuredUser);
        if(!user)
            throw new HttpException('The user was not found.', 404);
        const subscriptionType = await this.subscriptionTypesService.getSubscriptionTypeByType(dto.subscriptionTypeName);
        if(!subscriptionType)
            throw new HttpException('The subscription type was not found.', 404);
        const creditCard = await this.creditCardsService.getCreditCardByIdAndUserId(dto.creditCardId, user.id);
        if(!creditCard)
            throw new HttpException('The credit card was not found.', 404);
        if(creditCard.money - subscriptionType.price < 0)
            throw new HttpException(`You don't have enough money to buy it.`, 400);
        const curSubscription = await this.getSubscriptionByUserId(user.id);
        if(curSubscription){
            if(curSubscription.subscriptionTypeId === subscriptionType.id)
                throw new HttpException(`You can't change your subscription to the same.`, 400);
            await this.deleteSubscription(curSubscription);
        }
        const subscriptionId = await this.generateSubscriptionId();
        const expiresIn = new Date();
        expiresIn.setDate(new Date().getDate() + subscriptionType.duration);
        const newSubscription = await this.createSubscription({
            id: subscriptionId, 
            userId: user.id,
            subscriptionTypeId: subscriptionType.id,
            downloadsLeft: subscriptionType.maxDownloads,
            viewsForTodayLeft: subscriptionType.maxViews,
            expiresIn
        });
        await this.creditCardsService.withdraw(creditCard, subscriptionType.price);
        await this.logsService.create({operation: `Change subscription. Subscription id: < ${subscriptionId} >`, createdBy: user.id});
        return {subscription: newSubscription, message: 'You have changed your subscription successfully.'}
    }

    canResetSubscription(subscription: Subscription): boolean{
        if(!subscription.lastDownload && !subscription.lastView)
            return true;
        const today = new Date().toLocaleDateString();
        if(!subscription.lastDownload && subscription.lastView && subscription.lastView.toLocaleDateString() !== today)
            return true;
        if(!subscription.lastView && subscription.lastDownload && subscription.lastDownload.toLocaleDateString() !== today)
            return true;
        if(subscription.lastView && subscription.lastDownload && subscription.lastView.toLocaleDateString() !== today && subscription.lastDownload.toLocaleDateString() !== today)
            return true
        return false;
    }

    async resetSubscription(subscription: Subscription): Promise<Subscription & { subscriptionType: SubscriptionType }>{
        const subscriptionType = await this.subscriptionTypesService.getSubscriptionTypeById(subscription.subscriptionTypeId);
        if(!subscriptionType)
            return null;
        return this.postgreSQLService.subscription.update({data: {
            viewsForTodayLeft: subscriptionType.maxViews
        }, where: {id: subscription.id}, include: {subscriptionType: true}});
    }

    async updateSubscription(subscription: Subscription): Promise<Subscription & { subscriptionType: SubscriptionType }> {
        return this.postgreSQLService.subscription.update({data: {
            downloadsLeft: subscription.downloadsLeft,
            lastView: subscription.lastView,
            lastDownload: subscription.lastDownload,
            viewsForTodayLeft: subscription.viewsForTodayLeft,
            lastViewedVideoId: subscription.lastViewedVideoId
        }, where: {id: subscription.id}, include: {subscriptionType: true}});
    }

    async deleteSubscription(subscription: Subscription){
        return this.postgreSQLService.subscription.delete({where: {id: subscription.id}});
    }

    async getSubscriptionById(id: string): Promise<Subscription | null>{
        return this.postgreSQLService.subscription.findUnique({where: {id}});
    }

    async getSubscriptionByUserId(userId: string): Promise<Subscription & { subscriptionType: SubscriptionType } | null>{
        return this.postgreSQLService.subscription.findFirst({where: {userId}, include: {subscriptionType: true}});
    }

    async generateSubscriptionId(): Promise<string>{
        let subscription: Subscription | null, id: string;
        do {
            id = v4();
            subscription = await this.postgreSQLService.subscription.findUnique({where: {id}});
        } while (subscription);
        return id;
    }
}
