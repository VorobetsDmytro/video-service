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
import { ChangeEmail, Role, User } from "../../prisma/PostgreSQL/generated/client";
import * as supertest from "supertest";
import { PostgreSQLPrismaService } from "../db/postgreSQL.prisma.service";

describe('Profiles', () => {
    const gDto = new GeneratorDto('profiles');
    let app: NestExpressApplication;
    let httpServer;
    let usersService: UsersService;
    let tokensService: TokensService;
    let rolesService: RolesService;
    let postgreSQLPrismaService: PostgreSQLPrismaService;
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
        jest.setTimeout(60000);
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                AppModule
            ]
        }).compile();
        usersService = module.get<UsersService>(UsersService);
        tokensService = module.get<TokensService>(TokensService);
        rolesService = module.get<RolesService>(RolesService);
        postgreSQLPrismaService = module.get<PostgreSQLPrismaService>(PostgreSQLPrismaService);
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
    describe('Get the profile', () => {
        it('should return the profile', async () => {
            const {body} = await supertest(httpServer)
                .get('/profiles')
                .set("authorization", `Bearer ${adminToken}`)
                .expect(200)
            expect(body).toMatchObject({
                id: admin.id
            })
        });
        it('should return the 401 status code', async () => {
            await supertest(httpServer)
                .get('/profiles')
                .expect(401)
        });
    });
    describe('Get the profile by id', () => {
        it('should return the profile', async () => {
            const {body} = await supertest(httpServer)
                .get(`/profiles/${admin.id}`)
                .set("authorization", `Bearer ${adminToken}`)
                .expect(200)
            expect(body).toMatchObject({
                id: admin.id
            })
        });
        it('should return the 403 status code', async () => {
            await supertest(httpServer)
                .get(`/profiles/${admin.id}`)
                .set("authorization", `Bearer ${subscriberToken}`)
                .expect(403)
        });
        it('should return the 401 status code', async () => {
            await supertest(httpServer)
                .get(`/profiles/${admin.id}`)
                .expect(401)
        });
    });
    describe('Change the profile', () => {
        it('should change the profile', async () => {
            const dto = {
                firstname: 'Newfirstname'
            }
            const {body} = await supertest(httpServer)
                .patch(`/profiles`)
                .send(dto)
                .set("authorization", `Bearer ${adminToken}`)
                .expect(200)
            expect(body).toMatchObject({
                user: {
                    id: admin.id
                },
                message: expect.any(String)
            })
        });
        it('should return the 400 status code', async () => {
            const dto = {
                firstname: 'Newfirstname11'
            }
            await supertest(httpServer)
                .patch(`/profiles`)
                .send(dto)
                .set("authorization", `Bearer ${adminToken}`)
                .expect(400)
        });
        it('should return the 401 status code', async () => {
            const dto = {
                firstname: 'Newfirstnamee'
            }
            await supertest(httpServer)
                .patch(`/profiles`)
                .send(dto)
                .expect(401)
        });
    });
    describe('Change the email approve', () => {
        it('should accept the change email request', async () => {
            const dtoChangeEmail = gDto.generateChangeEmailDto(admin.id, 'newemail@test.com')
            const changeEmail = await postgreSQLPrismaService.changeEmail.create({data: dtoChangeEmail});
            const dto = {
                password: '123'
            }
            const {body} = await supertest(httpServer)
                .post(`/profiles/change-email/accept/${changeEmail.id}`)
                .send(dto)
                .set("authorization", `Bearer ${adminToken}`)
                .expect(201)
            expect(body).toMatchObject({
                message: expect.any(String)
            })
            await postgreSQLPrismaService.changeEmail.deleteMany({where: {userId: admin.id,}});
        });
        it('should return the 400 status code', async () => {
            const dtoChangeEmail = gDto.generateChangeEmailDto(admin.id, 'newemail1@test.com')
            const changeEmail = await postgreSQLPrismaService.changeEmail.create({data: dtoChangeEmail});
            await supertest(httpServer)
                .post(`/profiles/change-email/accept/${changeEmail.id}`)
                .set("authorization", `Bearer ${adminToken}`)
                .expect(400)
            await postgreSQLPrismaService.changeEmail.deleteMany({where: {userId: admin.id,}});
        });
        it('should return the 403 status code', async () => {
            const dtoChangeEmail = gDto.generateChangeEmailDto(admin.id, 'newemail2@test.com')
            const changeEmail = await postgreSQLPrismaService.changeEmail.create({data: dtoChangeEmail});
            const dto = {
                password: '123'
            }
            await supertest(httpServer)
                .post(`/profiles/change-email/accept/${changeEmail.id}`)
                .send(dto)
                .set("authorization", `Bearer ${subscriberToken}`)
                .expect(403)
            await postgreSQLPrismaService.changeEmail.deleteMany({where: {userId: admin.id,}});
        });
        it('should return the 401 status code', async () => {
            const dtoChangeEmail = gDto.generateChangeEmailDto(admin.id, 'newemail3@test.com')
            const changeEmail = await postgreSQLPrismaService.changeEmail.create({data: dtoChangeEmail});
            const dto = {
                password: '123'
            }
            await supertest(httpServer)
                .post(`/profiles/change-email/accept/${changeEmail.id}`)
                .send(dto)
                .expect(401)
            await postgreSQLPrismaService.changeEmail.deleteMany({where: {userId: admin.id,}});
        });
    });
    describe('Get all the change email requests', () => {
        it('should return all the change email requests', async () => {
            const {body} = await supertest(httpServer)
                .get(`/profiles/change-email`)
                .set("authorization", `Bearer ${adminToken}`)
                .expect(200)
            expect(body).toEqual(expect.any(Array<ChangeEmail>));
        });
        it('should return the 403 status code', async () => {
            await supertest(httpServer)
                .get(`/profiles/change-email`)
                .set("authorization", `Bearer ${subscriberToken}`)
                .expect(403)
        });
        it('should return the 401 status code', async () => {
            await supertest(httpServer)
                .get(`/profiles/change-email`)
                .expect(401)
        });
    });
});