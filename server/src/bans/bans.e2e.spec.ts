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
import {BansService} from './bans.service';

describe('Bans', () => {
    const gDto = new GeneratorDto('bans');
    let app: NestExpressApplication;
    let httpServer;
    let usersService: UsersService;
    let tokensService: TokensService;
    let rolesService: RolesService;
    let bansService: BansService;
    let admin: User;
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
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                AppModule
            ]
        }).compile();
        usersService = module.get<UsersService>(UsersService);
        tokensService = module.get<TokensService>(TokensService);
        rolesService = module.get<RolesService>(RolesService);
        bansService = module.get<BansService>(BansService);
        app = module.createNestApplication<NestExpressApplication>();
        const httpAdapter = app.get(HttpAdapterHost);
        app.useGlobalFilters(new NotFoundExceptionFilter(httpAdapter));
        app.useGlobalPipes(new ValidationPipe);
        app.useStaticAssets(path.resolve(process.env.STATIC_PATH || 'static_path'));
        await app.init();
        httpServer = app.getHttpServer();
        [subscriberToken] = await createUser(gDto.generateUserDto(), RoleTypes.SUBSCRIBER);
        [adminToken, admin] = await createUser(gDto.generateUserDto(), RoleTypes.ADMIN);
    });
    afterAll(async () => {
        await app.close();
    });
    describe('Ban the user', () => {
        it('should ban the user', async () => {
            const [, user] = await createUser(gDto.generateUserDto(), RoleTypes.SUBSCRIBER);
            const data = {
                banReason: 'Spam'
            }
            const {body} = await supertest(httpServer)
                .post(`/bans/ban/${user.id}`)
                .send(data)
                .set("authorization", `Bearer ${adminToken}`)
                .expect(201)
            expect(body).toMatchObject({
                userId: user.id,
                bannedById: admin.id
            })
        });
        it('should return the 400 status code', async () => {
            const [, user] = await createUser(gDto.generateUserDto(), RoleTypes.SUBSCRIBER);
            await supertest(httpServer)
                .post(`/bans/ban/${user.id}`)
                .set("authorization", `Bearer ${adminToken}`)
                .expect(400)
        });
        it('should return the 403 status code', async () => {
            const [, user] = await createUser(gDto.generateUserDto(), RoleTypes.SUBSCRIBER);
            const data = {
                banReason: 'Spam'
            }
            await supertest(httpServer)
                .post(`/bans/ban/${user.id}`)
                .send(data)
                .set("authorization", `Bearer ${subscriberToken}`)
                .expect(403)
        });
        it('should return the 401 status code', async () => {
            const [, user] = await createUser(gDto.generateUserDto(), RoleTypes.SUBSCRIBER);
            const data = {
                banReason: 'Spam'
            }
            await supertest(httpServer)
                .post(`/bans/ban/${user.id}`)
                .send(data)
                .expect(401)
        });
    });
    describe('Unban the user', () => {
        it('should unban the user', async () => {
            const [, user] = await createUser(gDto.generateUserDto(), RoleTypes.SUBSCRIBER);
            await bansService.createBan(gDto.generateBanDto(admin.id, user.id));
            const {body} = await supertest(httpServer)
                .get(`/bans/unban/${user.id}`)
                .set("authorization", `Bearer ${adminToken}`)
                .expect(200)
            expect(body).toMatchObject({
                userId: user.id,
                bannedById: admin.id
            })
        });
        it('should return the 400 status code', async () => {
            const [, user] = await createUser(gDto.generateUserDto(), RoleTypes.SUBSCRIBER);
            await supertest(httpServer)
                .get(`/bans/unban/${user.id}`)
                .set("authorization", `Bearer ${adminToken}`)
                .expect(400)
        });
        it('should return the 403 status code', async () => {
            const [, user] = await createUser(gDto.generateUserDto(), RoleTypes.SUBSCRIBER);
            await bansService.createBan(gDto.generateBanDto(admin.id, user.id));
            await supertest(httpServer)
                .get(`/bans/unban/${user.id}`)
                .set("authorization", `Bearer ${subscriberToken}`)
                .expect(403)
        });
        it('should return the 401 status code', async () => {
            const [, user] = await createUser(gDto.generateUserDto(), RoleTypes.SUBSCRIBER);
            await bansService.createBan(gDto.generateBanDto(admin.id, user.id));
            await supertest(httpServer)
                .get(`/bans/unban/${user.id}`)
                .expect(401)
        });
    });
});