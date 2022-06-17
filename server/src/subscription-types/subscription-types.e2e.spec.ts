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
import { Role, User } from "../../prisma/PostgreSQL/generated/client";
import * as supertest from "supertest";
import { SubscriptionTypesService } from "./subscription-types.service";

describe('Subscription-types', () => {
    const gDto = new GeneratorDto('stypes');
    let app: NestExpressApplication;
    let httpServer;
    let usersService: UsersService;
    let tokensService: TokensService;
    let rolesService: RolesService;
    let subscriptionTypesService: SubscriptionTypesService;
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
        subscriptionTypesService = module.get<SubscriptionTypesService>(SubscriptionTypesService);
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
    describe('Create a subscription type', () => {
        it('should create a subscription type', async () => {
            const dto = gDto.generateSubscriptionTypeDto('name1');
            const {body} = await supertest(httpServer)
                .post('/subscription-types/create')
                .send(dto)
                .set("authorization", `Bearer ${adminToken}`)
                .expect(201)
            expect(body).toMatchObject({
                name: dto.name
            })
        });
        it('should return the 400 status code', async () => {
            await supertest(httpServer)
                .post('/subscription-types/create')
                .set("authorization", `Bearer ${adminToken}`)
                .expect(400)
        });
        it('should return the 403 status code', async () => {
            const dto = gDto.generateSubscriptionTypeDto('name2');
            await supertest(httpServer)
                .post('/subscription-types/create')
                .send(dto)
                .set("authorization", `Bearer ${subscriberToken}`)
                .expect(403)
        });
        it('should return the 401 status code', async () => {
            const dto = gDto.generateSubscriptionTypeDto('name3');
            await supertest(httpServer)
                .post('/subscription-types/create')
                .send(dto)
                .expect(401)
        });
    });
    describe('Get all the subscription types', () => {
        it('should return all the subscription types', async () => {
            const {body} = await supertest(httpServer)
                .get('/subscription-types')
                .set("authorization", `Bearer ${adminToken}`)
                .expect(200)
            expect(body).toEqual(expect.any(Array<Role>));
        });
        it('should return the 401 status code', async () => {
            await supertest(httpServer)
                .get('/subscription-types')
                .expect(401)
        });
    });
    describe('Delete the subscription type', () => {
        it('should delete the subscription type', async () => {
            const dtoSType = gDto.generateSubscriptionTypeDto('type1');
            const subscriptionType = await subscriptionTypesService.createSubscriptionType(dtoSType);
            const {body} = await supertest(httpServer)
                .delete(`/subscription-types/delete/${subscriptionType.name}`)
                .set("authorization", `Bearer ${adminToken}`)
                .expect(200)
            expect(body).toMatchObject({
                subscriptionTypeName: subscriptionType.name
            });
        });
        it('should return the 400 status code', async () => {
            await supertest(httpServer)
                .delete(`/subscription-types/delete/123`)
                .set("authorization", `Bearer ${adminToken}`)
                .expect(400)
        });
        it('should return the 403 status code', async () => {
            const dtoSType = gDto.generateSubscriptionTypeDto('type2');
            const subscriptionType = await subscriptionTypesService.createSubscriptionType(dtoSType);
            await supertest(httpServer)
                .delete(`/subscription-types/delete/${subscriptionType.name}`)
                .set("authorization", `Bearer ${subscriberToken}`)
                .expect(403)
        });
        it('should return the 401 status code', async () => {
            const dtoSType = gDto.generateSubscriptionTypeDto('type3');
            const subscriptionType = await subscriptionTypesService.createSubscriptionType(dtoSType);
            await supertest(httpServer)
                .delete(`/subscription-types/delete/${subscriptionType.name}`)
                .expect(401)
        });
    });
});