import { Test, TestingModule } from '@nestjs/testing'
import { DbModule } from '../db/db.module';
import { JwtModule } from '@nestjs/jwt';
import * as mocks from 'node-mocks-http';
import { GeneratorDto } from '../generators/generate-dto';
import { RolesGuard } from '../guards/roles.guard';
import { IsBannedGuard } from '../guards/is-banned.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from '../../prisma/PostgreSQL/generated/client';

describe('AuthController', () => {
    let controller: AuthController;
    const gDto = new GeneratorDto('auth');
    const mocksRequest = mocks.createRequest();
    const user: User = gDto.generateUserDto();
    const token = 'token';
    const message = 'message';
    const mockService = {
        auth: jest.fn().mockImplementation((mocksRequest) => {
            return {
                id: Date.now(),
                token,
                user
            }
        }),
        register: jest.fn().mockImplementation((dto) => {
            return {
                id: Date.now(),
                message
            }
        }),
        login: jest.fn().mockImplementation((dto) => {
            return {
                id: Date.now(),
                token: 'token',
                user: {
                    id: dto.id
                }
            }
        }),
        logout: jest.fn().mockImplementation((mocksRequest) => {
            return {
                id: Date.now(),
                message
            }
        }),
        forgotPass: jest.fn().mockImplementation((dto) => {
            return {
                id: Date.now(),
                message
            }
        }),
        resetPass: jest.fn().mockImplementation((dto, userId, token) => {
            return {
                id: Date.now(),
                message,
                userId,
                token
            }
        }),
        resetPassAccept: jest.fn().mockImplementation((resetPasswordId, req) => {
            return {
                id: Date.now(),
                message,
                resetPasswordId
            }
        })
    }
    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                AuthService,
                {provide: RolesGuard, useValue: jest.fn().mockImplementation(() => true)},
                {provide: IsBannedGuard, useValue: jest.fn().mockImplementation(() => true)},
            ],
            imports: [
                DbModule,
                JwtModule.register({
                    secret: process.env.JWT_SECRET || 'jwtsecret',
                    signOptions: {
                      expiresIn: '1h'
                    }
                  }),
            ]
        })
        .overrideProvider(AuthService)
        .useValue(mockService)
        .compile();

        controller = module.get<AuthController>(AuthController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
    it('should auth the user', () => {
        expect(controller.auth(mocksRequest)).toEqual({
            id: expect.any(Number),
            token: expect.any(String),
            user
        });
    });
    it('should register the user', () => {
        const dto = gDto.generateUserDto();
        expect(controller.register(dto)).toEqual({
            id: expect.any(Number),
            message: expect.any(String)
        });
    });
    it('should register the user', () => {
        const dto = gDto.generateUserDto();
        expect(controller.login(dto)).toEqual({
            id: expect.any(Number),
            token: expect.any(String),
            user: {
                id: dto.id
            }
        });
    });
    it('should logout', () => {
        expect(controller.logout(mocksRequest)).toEqual({
            id: expect.any(Number),
            message: expect.any(String)
        });
    });
    it('should send forgot pass request', () => {
        expect(controller.forgotPass(user)).toEqual({
            id: expect.any(Number),
            message: expect.any(String)
        });
    });
    it('should send forgot pass request', () => {
        expect(controller.resetPass(user, user.id, token)).toEqual({
            id: expect.any(Number),
            message: expect.any(String),
            userId: user.id,
            token
        });
    });
    it('should send forgot pass request', () => {
        const resetPasswordId = '1';
        expect(controller.resetPassAccept(resetPasswordId, mocksRequest)).toEqual({
            id: expect.any(Number),
            message: expect.any(String),
            resetPasswordId
        });
    });
})