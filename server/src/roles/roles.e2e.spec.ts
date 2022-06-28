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

describe('Roles', () => {
    const gDto = new GeneratorDto('roles');
    let app: NestExpressApplication;
    let httpServer;
    let usersService: UsersService;
    let tokensService: TokensService;
    let rolesService: RolesService;
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
    describe('Create a role', () => {
        it('should create a role', async () => {
            const dto = {
                value: 'newrole'
            }
            const {body} = await supertest(httpServer)
                .post('/roles/create')
                .send(dto)
                .set("authorization", `Bearer ${adminToken}`)
                .expect(201)
            expect(body).toMatchObject({
                value: dto.value
            })
        });
        it('should return the 400 status code', async () => {
            await supertest(httpServer)
                .post('/roles/create')
                .set("authorization", `Bearer ${adminToken}`)
                .expect(400)
        });
        it('should return the 403 status code', async () => {
            const dto = {
                value: 'newrole2'
            }
            await supertest(httpServer)
                .post('/roles/create')
                .send(dto)
                .set("authorization", `Bearer ${subscriberToken}`)
                .expect(403)
        });
        it('should return the 401 status code', async () => {
            const dto = {
                value: 'newrole3'
            }
            await supertest(httpServer)
                .post('/roles/create')
                .send(dto)
                .expect(401)
        });
    });
    describe('Get all the roles', () => {
        it('should return all the roles', async () => {
            const {body} = await supertest(httpServer)
                .get('/roles')
                .set("authorization", `Bearer ${adminToken}`)
                .expect(200)
            expect(body).toEqual(expect.any(Array<Role>));
        });
        it('should return the 403 status code', async () => {
            await supertest(httpServer)
                .get('/roles')
                .set("authorization", `Bearer ${subscriberToken}`)
                .expect(403)
        });
        it('should return the 401 status code', async () => {
            await supertest(httpServer)
                .get('/roles')
                .expect(401)
        });
    });
    describe('Delete the role', () => {
        it('should delete the role', async () => {
            const dtoRole = gDto.generateRoleDto('newrole1');
            const role = await rolesService.createRole(dtoRole);
            const {body} = await supertest(httpServer)
                .delete(`/roles/delete/${role.value}`)
                .set("authorization", `Bearer ${adminToken}`)
                .expect(200)
            expect(body).toMatchObject({
                roleValue: role.value
            });
        });
        it('should return the 404 status code', async () => {
            await supertest(httpServer)
                .delete(`/roles/delete/123`)
                .set("authorization", `Bearer ${adminToken}`)
                .expect(404)
        });
        it('should return the 403 status code', async () => {
            const dtoRole = gDto.generateRoleDto('newrole2');
            const role = await rolesService.createRole(dtoRole);
            await supertest(httpServer)
                .delete(`/roles/delete/${role.value}`)
                .set("authorization", `Bearer ${subscriberToken}`)
                .expect(403)
        });
        it('should return the 401 status code', async () => {
            const dtoRole = gDto.generateRoleDto('newrole3');
            const role = await rolesService.createRole(dtoRole);
            await supertest(httpServer)
                .delete(`/roles/delete/${role.value}`)
                .expect(401)
        });
    });
});