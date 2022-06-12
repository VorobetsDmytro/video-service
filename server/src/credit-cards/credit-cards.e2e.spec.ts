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
import { CreditCard, Role, User } from "../../prisma/PostgreSQL/generated/client";
import * as supertest from "supertest";
import { CreditCardsService } from "./credit-cards.service";

describe('Credit-cards', () => {
    const gDto = new GeneratorDto('ccards');
    let app: NestExpressApplication;
    let httpServer;
    let usersService: UsersService;
    let tokensService: TokensService;
    let rolesService: RolesService;
    let creditCardsService: CreditCardsService;
    let adminToken: string;
    let admin: User;
    let subscriber: User;
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
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                AppModule
            ]
        }).compile();
        usersService = module.get<UsersService>(UsersService);
        tokensService = module.get<TokensService>(TokensService);
        rolesService = module.get<RolesService>(RolesService);
        creditCardsService = module.get<CreditCardsService>(CreditCardsService);
        app = module.createNestApplication<NestExpressApplication>();
        const httpAdapter = app.get(HttpAdapterHost);
        app.useGlobalFilters(new NotFoundExceptionFilter(httpAdapter));
        app.useGlobalPipes(new ValidationPipe);
        app.useStaticAssets(path.resolve(process.env.STATIC_PATH || 'static_path'));
        await app.init();
        httpServer = app.getHttpServer();
        [subscriberToken, subscriber] = await createUser(gDto.generateUserDto(), RoleTypes.SUBSCRIBER);
        [adminToken, admin] = await createUser(gDto.generateUserDto(), RoleTypes.ADMIN);
    });
    afterAll(async () => {
        await app.close();
    });
    describe('Add the card', () => {
        it('should add the card', async () => {
            const dto = gDto.generateCreditCardDto(subscriber.id, '1111-1111-1111-1111');
            const {body} = await supertest(httpServer)
                .post('/credit-cards')
                .send(dto)
                .set("authorization", `Bearer ${subscriberToken}`)
                .expect(201)
            expect(body).toMatchObject({
                creditCard: {
                    userId: dto.userId,
                    number: dto.number
                },
                message: expect.any(String)
            })
        });
        it('should return the 400 status code', async () => {
            await supertest(httpServer)
                .post('/credit-cards')
                .set("authorization", `Bearer ${subscriberToken}`)
                .expect(400)
        });
        it('should return the 403 status code', async () => {
            const dto = gDto.generateCreditCardDto(admin.id, '1111-1111-1111-1112');
            await supertest(httpServer)
                .post('/credit-cards')
                .send(dto)
                .set("authorization", `Bearer ${adminToken}`)
                .expect(403)
        });
        it('should return the 401 status code', async () => {
            const dto = gDto.generateCreditCardDto(subscriber.id, '1111-1111-1111-1113');
            await supertest(httpServer)
                .post('/credit-cards')
                .send(dto)
                .expect(401)
        });
    });
    describe('Get all the credit cards', () => {
        it('should return all the credit cards', async () => {
            const {body} = await supertest(httpServer)
                .get('/credit-cards')
                .set("authorization", `Bearer ${adminToken}`)
                .expect(200)
            expect(body).toEqual(expect.any(Array<CreditCard>));
        });
        it('should return the 403 status code', async () => {
            await supertest(httpServer)
                .get('/credit-cards')
                .set("authorization", `Bearer ${subscriberToken}`)
                .expect(403)
        });
        it('should return the 401 status code', async () => {
            await supertest(httpServer)
                .get('/credit-cards')
                .expect(401)
        });
    });
    describe('Top up the balance', () => {
        it('should top up the balance', async () => {
            const creditCarddto = gDto.generateCreditCardDto(subscriber.id, '2111-1111-1111-1111');
            const creditCard = await creditCardsService.createCreditCard(creditCarddto);
            const dto = {
                money: 10
            }
            const {body} = await supertest(httpServer)
                .patch(`/credit-cards/${creditCard.id}`)
                .send(dto)
                .set("authorization", `Bearer ${subscriberToken}`)
                .expect(200)
            expect(body).toMatchObject({
                creditCard: {
                    id: creditCard.id,
                    money: creditCard.money + dto.money
                },
                message: expect.any(String)
            })
        });
        it('should return the 400 status code', async () => {
            const creditCarddto = gDto.generateCreditCardDto(subscriber.id, '2111-1111-1111-1112');
            const creditCard = await creditCardsService.createCreditCard(creditCarddto);
            await supertest(httpServer)
                .patch(`/credit-cards/${creditCard.id}`)
                .set("authorization", `Bearer ${subscriberToken}`)
                .expect(400)
        });
        it('should return the 403 status code', async () => {
            const creditCarddto = gDto.generateCreditCardDto(admin.id, '2111-1111-1111-1113');
            const creditCard = await creditCardsService.createCreditCard(creditCarddto);
            const dto = {
                money: 10
            }
            await supertest(httpServer)
                .patch(`/credit-cards/${creditCard.id}`)
                .send(dto)
                .set("authorization", `Bearer ${adminToken}`)
                .expect(403)
        });
        it('should return the 401 status code', async () => {
            const creditCarddto = gDto.generateCreditCardDto(admin.id, '2111-1111-1111-1114');
            const creditCard = await creditCardsService.createCreditCard(creditCarddto);
            const dto = {
                money: 10
            }
            await supertest(httpServer)
                .patch(`/credit-cards/${creditCard.id}`)
                .send(dto)
                .expect(401)
        });
    });
    describe('Remove the card', () => {
        it('should remove the card', async () => {
            const creditCarddto = gDto.generateCreditCardDto(subscriber.id, '3111-1111-1111-1111');
            const creditCard = await creditCardsService.createCreditCard(creditCarddto);
            const {body} = await supertest(httpServer)
                .delete(`/credit-cards/${creditCard.id}`)
                .set("authorization", `Bearer ${subscriberToken}`)
                .expect(200)
            expect(body).toMatchObject({
                message: expect.any(String)
            })
        });
        it('should return the 403 status code', async () => {
            const creditCarddto = gDto.generateCreditCardDto(admin.id, '3111-1111-1111-1112');
            const creditCard = await creditCardsService.createCreditCard(creditCarddto);
            await supertest(httpServer)
                .delete(`/credit-cards/${creditCard.id}`)
                .set("authorization", `Bearer ${adminToken}`)
                .expect(403)
        });
        it('should return the 401 status code', async () => {
            const creditCarddto = gDto.generateCreditCardDto(subscriber.id, '3111-1111-1111-1113');
            const creditCard = await creditCardsService.createCreditCard(creditCarddto);
            await supertest(httpServer)
                .delete(`/credit-cards/${creditCard.id}`)
                .expect(401)
        });
    });
});