import { HttpException, Injectable } from '@nestjs/common';
import { CreditCard, Prisma } from 'prisma/PostgreSQL/generated/client';
import { PostgreSQLPrismaService } from '../db/postgreSQL.prisma.service';
import { UsersService } from '../users/users.service';
import { SelectSecuredUser } from '../users/users.type';
import { CreateCreditCardDto } from './dto/create-credit-card.dto';
import { v4 } from "uuid";
import { RemoveCreditCardDto } from './dto/remove-credit-card.dto';
import { TopUpMyBalanceDto } from './dto/top-up-my-balance.dto';
import { LogsService } from '../logs/logs.service';

@Injectable()
export class CreditCardsService {
    constructor(private postgreSQLService: PostgreSQLPrismaService,
                private usersService: UsersService,
                private logsService: LogsService){}

    async add(dto: CreateCreditCardDto, req){
        const userReq = req.user as Express.User;
        const user = await this.usersService.getOneById(userReq.id, SelectSecuredUser);
        if(!user)
            throw new HttpException('The user was not found.', 400);
        const correctedNumber = this.correctTheCreditCardNumber(dto.number);
        const checkCreditCard = await this.getCreditCardByUserIdAndNumber(user.id, correctedNumber);
        if(checkCreditCard)
            throw new HttpException('This card is already added.', 400);
        const creditCardId = await this.generateCreditCardId();
        const creditCard = await this.createCreditCard({...dto, id: creditCardId, userId: user.id, number: correctedNumber});
        await this.logsService.create({operation: `Add credit card: Credit card id: < ${creditCard.id} >`, createdBy: user.id});
        return {creditCard, message: 'Your credit card has been added successfully.'}
    }

    async remove(dto: RemoveCreditCardDto, req){
        const userReq = req.user as Express.User;
        const user = await this.usersService.getOneById(userReq.id, SelectSecuredUser);
        if(!user)
            throw new HttpException('The user was not found.', 400);
        const checkCreditCard = await this.getCreditCardByIdAndUserId(dto.creditCardId, user.id);
        if(!checkCreditCard)
            throw new HttpException('This card was not found.', 400);
        await this.deleteCreditCard(checkCreditCard);
        await this.logsService.create({operation: `Remove credit card. Credit card id: < ${checkCreditCard.id} >`, createdBy: user.id});
        return {message: 'Your credit card has been removed successfully.'}
    }

    correctTheCreditCardNumber(number: string): string{
        return number.replace(/ /g, '-');
    }

    async deleteCreditCard(creditCard: CreditCard): Promise<CreditCard | null> {
        return this.postgreSQLService.creditCard.delete({where: {id: creditCard.id}});
    }

    async getAll(req): Promise<CreditCard[]>{
        const userReq = req.user as Express.User;
        const user = await this.usersService.getOneById(userReq.id, SelectSecuredUser);
        if(!user)
            throw new HttpException('The user was not found.', 400);
        await this.logsService.create({operation: `Get all the credit cards`, createdBy: user.id});
        return this.postgreSQLService.creditCard.findMany();
    }

    async createCreditCard(dto: Prisma.CreditCardUncheckedCreateInput): Promise<CreditCard> {
        return this.postgreSQLService.creditCard.create({data: dto});
    }

    async getCreditCardById(id: string): Promise<CreditCard | null> { 
        return this.postgreSQLService.creditCard.findUnique({where: {id}});
    }

    async getCreditCardByIdAndUserId(id: string, userId: string): Promise<CreditCard | null> { 
        return this.postgreSQLService.creditCard.findFirst({where: {id, userId}});
    }

    async getCreditCardByUserIdAndNumber(userId: string, number: string): Promise<CreditCard | null>{
        return this.postgreSQLService.creditCard.findFirst({where: {userId, number}});
    }

    async generateCreditCardId() {
        let creditCard: CreditCard | null, id: string;
        do {
            id = v4();
            creditCard = await this.postgreSQLService.creditCard.findUnique({where: {id}});
        } while (creditCard);
        return id;
    }

    async topUpMyBalance(dto: TopUpMyBalanceDto, req){
        const userReq = req.user as Express.User;
        const user = await this.usersService.getOneById(userReq.id, SelectSecuredUser);
        if(!user)
            throw new HttpException('The user was not found.', 400);
        let creditCard = await this.getCreditCardByIdAndUserId(dto.creditCardId, user.id);
        if(!creditCard)
            throw new HttpException('The credit card was not found.', 400);
        creditCard = await this.topUp(creditCard, dto.money);
        await this.logsService.create({operation: `Top up balance on ${dto.money} dollar(s). Credit card id: < ${creditCard.id} >`, createdBy: user.id});
        return {creditCard, message: 'You have topped up your bill successfully.'}
    }

    async topUp(creditCard: CreditCard, money: number): Promise<CreditCard>{
        return this.postgreSQLService.creditCard.update({data: {money: creditCard.money + money}, where: {id: creditCard.id}});
    }

    async withdraw(creditCard: CreditCard, money: number): Promise<CreditCard | null>{
        if(creditCard.money - money < 0)
            return null;
        return this.postgreSQLService.creditCard.update({data: {money: creditCard.money - money}, where: {id: creditCard.id}});
    }
}
