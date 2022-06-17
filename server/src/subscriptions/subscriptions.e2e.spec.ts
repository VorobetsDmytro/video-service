import { HttpAdapterHost } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundExceptionFilter } from "../filters/not-found-exception.filter";
import { AppModule } from "../app.module";
import { ValidationPipe } from "@nestjs/common";
import * as path from 'path';
import { RegisterUserDto } from "../auth/dto/register-user.dto";
import { UsersService } from "../users/users.service";
import { RolesService } from "../roles/roles.service";
import { TokensService } from "../tokens/tokens.service";
import { GeneratorDto } from "../generators/generate-dto";
import { RoleTypes } from "../roles/roles.type";
import { Role, Subscription, User } from "../../prisma/PostgreSQL/generated/client";
import * as supertest from "supertest";
import { SubscriptionsService } from "./subscriptions.service";
import { SubscriptionTypesService } from "../subscription-types/subscription-types.service";
import { CreditCardsService } from "../credit-cards/credit-cards.service";

describe('Subscriptions', () => {
    const gDto = new GeneratorDto('subs');
    let app: NestExpressApplication;
    let httpServer;
    let usersService: UsersService;
    let tokensService: TokensService;
    let rolesService: RolesService;
    let subscriptionsService: SubscriptionsService;
    let subscriptionTypesService: SubscriptionTypesService;
    let creditCardsService: CreditCardsService;
    let adminToken: string;
    let subscriberToken: string;
    const createUser = async (userDto: RegisterUserDto, role: string): Promise<[string, User, Role]> => {
        const userRole = await rolesService.getRoleByValue(role);
        const userId = await usersService.generateUserId();
        let user = await usersService.createUser({...userDto, id: userId});
        user = await rolesService.setRoleToUser(userRole!, user!);
        const token = await tokensService.generateToken(user!);
        await tokensService.saveToken(user.id, token);
        return [token, user, userRole!];
    }
    beforeAll(async () => {
        jest.setTimeout(60000);
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                AppModule
            ]
        }).compile();
        usersService = module.get<UsersService>(UsersService);
        tokensService = module.get<TokensService>(TokensService);
        rolesService = module.get<RolesService>(RolesService);
        subscriptionsService = module.get<SubscriptionsService>(SubscriptionsService);
        subscriptionTypesService = module.get<SubscriptionTypesService>(SubscriptionTypesService);
        creditCardsService = module.get<CreditCardsService>(CreditCardsService);
        app = module.createNestApplication<NestExpressApplication>();
        const httpAdapter = app.get(HttpAdapterHost);
        app.useGlobalFilters(new NotFoundExceptionFilter(httpAdapter));
        app.useGlobalPipes(new ValidationPipe);
        app.useStaticAssets(path.resolve(process.env.STATIC_PATH || 'static_path'));
        await app.init();
        httpServer = app.getHttpServer();
        [subscriberToken] = await createUser(gDto.generateUserDto(), RoleTypes.SUBSCRIBER);
        [adminToken] = await createUser(gDto.generateUserDto(), RoleTypes.ADMIN);
    });
    afterAll(async () => {
        await app.close();
    });
    describe('Get all the subscriptions', () => {
        it('should return all the subscriptions', async () => {
            const {body} = await supertest(httpServer)
                .get('/subscriptions')
                .set("authorization", `Bearer ${adminToken}`)
                .expect(200)
            expect(body).toEqual(expect.any(Array<Subscription>));
        });
        it('should return the 403 status code', async () => {
            await supertest(httpServer)
                .get('/subscriptions')
                .set("authorization", `Bearer ${subscriberToken}`)
                .expect(403)
        });
        it('should return the 401 status code', async () => {
            await supertest(httpServer)
                .get('/subscriptions')
                .expect(401)
        });
    });
    describe('Change the subscription', () => {
        it('should change the subscription', async () => {
            const dtoUser = gDto.generateUserDto();
            const [userToken, user] = await createUser(dtoUser, RoleTypes.SUBSCRIBER);
            const subscriptionType = await subscriptionTypesService.getSubscriptionTypeByType('STANDART');
            const creditCardDto = gDto.generateCreditCardDto(user.id, '1111-1111-1111-1111');
            const creditCard = await creditCardsService.createCreditCard(creditCardDto);
            await subscriptionsService.createSubscription(gDto.generateSubscriptionDto(user.id, subscriptionType.id))
            const dto = {
                subscriptionTypeName: 'SILVER',
                creditCardId: creditCard.id
            }
            const {body} = await supertest(httpServer)
                .patch('/subscriptions')
                .send(dto)
                .set("authorization", `Bearer ${userToken}`)
                .expect(200)
            expect(body).toMatchObject({
                message: expect.any(String)
            })
        });
        it('should return the 400 status code', async () => {
            const dtoUser = gDto.generateUserDto();
            const [userToken, user] = await createUser(dtoUser, RoleTypes.SUBSCRIBER);
            const subscriptionType = await subscriptionTypesService.getSubscriptionTypeByType('STANDART');
            const creditCardDto = gDto.generateCreditCardDto(user.id, '1111-1111-1111-1112');
            await creditCardsService.createCreditCard(creditCardDto);
            await subscriptionsService.createSubscription(gDto.generateSubscriptionDto(user.id, subscriptionType.id))
            await supertest(httpServer)
                .patch('/subscriptions')
                .set("authorization", `Bearer ${userToken}`)
                .expect(400)
        });
        it('should return the 403 status code', async () => {
            const dtoUser = gDto.generateUserDto();
            const [userToken, user] = await createUser(dtoUser, RoleTypes.SUBSCRIBER);
            const subscriptionType = await subscriptionTypesService.getSubscriptionTypeByType('STANDART');
            const creditCardDto = gDto.generateCreditCardDto(user.id, '1111-1111-1111-1113');
            const creditCard = await creditCardsService.createCreditCard(creditCardDto);
            await subscriptionsService.createSubscription(gDto.generateSubscriptionDto(user.id, subscriptionType.id))
            const dto = {
                subscriptionTypeName: 'SILVER',
                creditCardId: creditCard.id
            }
            await supertest(httpServer)
                .patch('/subscriptions')
                .send(dto)
                .set("authorization", `Bearer ${adminToken}`)
                .expect(403)
        });
        it('should return the 401 status code', async () => {
            const dtoUser = gDto.generateUserDto();
            const [userToken, user] = await createUser(dtoUser, RoleTypes.SUBSCRIBER);
            const subscriptionType = await subscriptionTypesService.getSubscriptionTypeByType('STANDART');
            const creditCardDto = gDto.generateCreditCardDto(user.id, '1111-1111-1111-1114');
            const creditCard = await creditCardsService.createCreditCard(creditCardDto);
            await subscriptionsService.createSubscription(gDto.generateSubscriptionDto(user.id, subscriptionType.id))
            const dto = {
                subscriptionTypeName: 'SILVER',
                creditCardId: creditCard.id
            }
            await supertest(httpServer)
                .patch('/subscriptions')
                .send(dto)
                .expect(401)
        });
    });
});