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
import { Activationlink, Role, User } from "../../prisma/PostgreSQL/generated/client";
import * as supertest from "supertest";
import { ActivationLinksService } from "./activation-links.service";
import { ActivationDto } from "./dto/activation.dto";

describe('ActivationLinks', () => {
    const gDto = new GeneratorDto('activlinks');
    let app: NestExpressApplication;
    let httpServer;
    let usersService: UsersService;
    let tokensService: TokensService;
    let rolesService: RolesService;
    let activationLinksService: ActivationLinksService;
    let adminToken: string;
    let subscriberToken: string;
    let admin: User; 
    let subscriber: User; 
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
        activationLinksService = module.get<ActivationLinksService>(ActivationLinksService);
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
    describe('Activate the account', () => {
        it('should activate the account', async () => {
            const link = 'link1';
            const userId = admin.id;
            const data: ActivationDto = {
                password: '123'
            }
            await activationLinksService.createActiovationLink({link, userId});
            const {body} = await supertest(httpServer)
                .post(`/activation-links/activation/${userId}/${link}`)
                .send(data)
                .expect(201)
            expect(body).toMatchObject({
                message: expect.any(String)
            })
        });
        it('should return the 400 status code', async () => {
            const link = 'link2';
            const userId = admin.id;
            const data: ActivationDto = {
                password: '123'
            }
            await supertest(httpServer)
                .post(`/activation-links/activation/${userId}/${link}`)
                .send(data)
                .expect(400)
        });
    });
    describe('Get all the activation links', () => {
        it('should return all the activation links', async () => {
            const {body} = await supertest(httpServer)
                .get(`/activation-links`)
                .set("authorization", `Bearer ${adminToken}`)
                .expect(200)
            expect(body).toEqual(expect.any(Array<Activationlink>));
        });
        it('should return the 403 status code', async () => {
            await supertest(httpServer)
                .get(`/activation-links`)
                .set("authorization", `Bearer ${subscriberToken}`)
                .expect(403)
        });
        it('should return the 401 status code', async () => {
             await supertest(httpServer)
                .get(`/activation-links`)
                .expect(401)
        });
    })
});