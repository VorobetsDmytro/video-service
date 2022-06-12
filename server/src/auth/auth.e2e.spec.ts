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
import { LoginDto } from "./dto/login.dto";
import { ActivationLinksService } from "../activation-links/activation-links.service";
import { ResetPasswordsService } from "../reset-passwords/reset-passwords.service";

describe('Auth', () => {
    const gDto = new GeneratorDto('auth');
    let app: NestExpressApplication;
    let httpServer;
    let usersService: UsersService;
    let tokensService: TokensService;
    let rolesService: RolesService;
    let activationLinksService: ActivationLinksService;
    let resetPasswordsService: ResetPasswordsService;
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
        const link = await activationLinksService.generateLink();
        await activationLinksService.createActiovationLink({link, userId});
        await activationLinksService.activation({password: '123'}, userId, link);
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
        activationLinksService = module.get<ActivationLinksService>(ActivationLinksService);
        resetPasswordsService = module.get<ResetPasswordsService>(ResetPasswordsService);
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
    describe('Authorization', () => {
        it('should auth the user', async () => {
            const {body} = await supertest(httpServer)
                .get(`/auth`)
                .set("authorization", `Bearer ${adminToken}`)
                .expect(200)
            expect(body).toMatchObject({
                token: expect.any(String)
            });
        });
        it('should return the 401 status code', async () => {
            await supertest(httpServer)
                .get(`/auth`)
                .expect(401)
        });
    });
    describe('Registration', () => {
        it('should register the user', async () => {
            const data: RegisterUserDto = {
                email: 'testaaa1@gmail.com',
                firstname: 'Test',
                lastname: 'Test',
                password: '123'
            }
            const {body} = await supertest(httpServer)
                .post(`/auth/registration`)
                .send(data)
                .expect(201)
            expect(body).toMatchObject({
                message: expect.any(String)
            });
        });
        it('should return the 400 status code', async () => {
            await supertest(httpServer)
                .post(`/auth/registration`)
                .expect(400)
        });
        it('should return the 400 status code', async () => {
            const data = {
                email: 'testaaa2@gmail.com',
                firstname: 'Test',
                lastname: 'Test'
            }
            await supertest(httpServer)
                .post(`/auth/registration`)
                .send(data)
                .expect(400)
        });
    });
    describe('Login', () => {
        it('should login the user', async () => {
            const data: LoginDto = {
                email: admin.email,
                password: '123'
            }
            const {body} = await supertest(httpServer)
                .post(`/auth/login`)
                .send(data)
                .expect(200)
            expect(body).toMatchObject({
                token: expect.any(String)
            });
        });
        it('should return the 400 status code', async () => {
            await supertest(httpServer)
                .post(`/auth/login`)
                .expect(400)
        });
    });
    describe('Logout', () => {
        it('should logout the user', async () => {
            const {body} = await supertest(httpServer)
                .get(`/auth/logout`)
                .set("authorization", `Bearer ${adminToken}`)
                .expect(200)
            expect(body).toMatchObject({
                message: expect.any(String)
            });
            await tokensService.saveToken(admin.id, adminToken);
        });
        it('should return the 401 status code', async () => {
            await supertest(httpServer)
                .get(`/auth/logout`)
                .expect(401)
        });
    });
    describe('Forgot pass', () => {
        it('should send the reset link to the mail', async () => {
            const data = {
                email: admin.email
            }
            const {body} = await supertest(httpServer)
                .post(`/auth/forgot-pass`)
                .send(data)
                .expect(201)
            expect(body).toMatchObject({
                message: expect.any(String)
            });
        });
        it('should return the 400 status code', async () => {
            await supertest(httpServer)
                .post(`/auth/forgot-pass`)
                .expect(400)
        });
    });
    describe('Reset pass', () => {
        it('should reset the password', async () => {
            const token = await resetPasswordsService.generateResetPasswordToken();
            const id = await resetPasswordsService.generateResetPasswordId();
            const dtoResetPass = gDto.generateResetPasswordDto(admin.id, token);
            let resetPass = await resetPasswordsService.getResetPasswordByUserId(admin.id);
            if(resetPass)
                await resetPasswordsService.deleteResetPassword(resetPass);
            resetPass = await resetPasswordsService.createResetPassword({...dtoResetPass, id, isApproved: true});
            const data = {
                password: '123'
            }
            const {body} = await supertest(httpServer)
                .post(`/auth/reset-pass/${resetPass.userId}/${resetPass.token}`)
                .send(data)
                .expect(200)
            expect(body).toMatchObject({
                message: expect.any(String)
            });
        });
        it('should return the 400 status code', async () => {
            const token = await resetPasswordsService.generateResetPasswordToken();
            const id = await resetPasswordsService.generateResetPasswordId();
            const dtoResetPass = gDto.generateResetPasswordDto(admin.id, token);
            let resetPass = await resetPasswordsService.getResetPasswordByUserId(admin.id);
            if(resetPass)
                await resetPasswordsService.deleteResetPassword(resetPass);
            resetPass = await resetPasswordsService.createResetPassword({...dtoResetPass, id, isApproved: true});
            await supertest(httpServer)
                .post(`/auth/reset-pass/${resetPass.userId}/${resetPass.token}`)
                .expect(400)
        });
        it('should return the 400 status code', async () => {
            const data = {
                password: '123'
            }
            await supertest(httpServer)
                .post(`/auth/reset-pass/${admin.id}/token`)
                .send(data)
                .expect(400)
        });
    });
    describe('Reset pass accept', () => {
        it('should accept the reset password request', async () => {
            const token = await resetPasswordsService.generateResetPasswordToken();
            const id = await resetPasswordsService.generateResetPasswordId();
            const dtoResetPass = gDto.generateResetPasswordDto(admin.id, token);
            let resetPass = await resetPasswordsService.getResetPasswordByUserId(admin.id);
            if(resetPass)
                await resetPasswordsService.deleteResetPassword(resetPass);
            resetPass = await resetPasswordsService.createResetPassword({...dtoResetPass, id});
            const {body} = await supertest(httpServer)
                .get(`/auth/reset-pass/accept/${resetPass.id}`)
                .set("authorization", `Bearer ${adminToken}`)
                .expect(200)
            expect(body).toMatchObject({
                message: expect.any(String)
            });
        });
        it('should return the 400 status code', async () => {
            await supertest(httpServer)
                .get(`/auth/reset-pass/accept/123`)
                .set("authorization", `Bearer ${adminToken}`)
                .expect(400)
        });
        it('should return the 403 status code', async () => {
            const token = await resetPasswordsService.generateResetPasswordToken();
            const id = await resetPasswordsService.generateResetPasswordId();
            const dtoResetPass = gDto.generateResetPasswordDto(admin.id, token);
            let resetPass = await resetPasswordsService.getResetPasswordByUserId(admin.id);
            if(resetPass)
                await resetPasswordsService.deleteResetPassword(resetPass);
            resetPass = await resetPasswordsService.createResetPassword({...dtoResetPass, id});
            await supertest(httpServer)
                .get(`/auth/reset-pass/accept/${resetPass.id}`)
                .set("authorization", `Bearer ${subscriberToken}`)
                .expect(403)
        });
        it('should return the 401 status code', async () => {
            const token = await resetPasswordsService.generateResetPasswordToken();
            const id = await resetPasswordsService.generateResetPasswordId();
            const dtoResetPass = gDto.generateResetPasswordDto(admin.id, token);
            let resetPass = await resetPasswordsService.getResetPasswordByUserId(admin.id);
            if(resetPass)
                await resetPasswordsService.deleteResetPassword(resetPass);
            resetPass = await resetPasswordsService.createResetPassword({...dtoResetPass, id});
            await supertest(httpServer)
                .get(`/auth/reset-pass/accept/${resetPass.id}`)
                .expect(401)
        });
    });
});