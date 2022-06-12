import { Test, TestingModule } from '@nestjs/testing'
import { DbModule } from '../db/db.module';
import { JwtModule } from '@nestjs/jwt';
import * as mocks from 'node-mocks-http';
import { GeneratorDto } from '../generators/generate-dto';
import { RolesGuard } from '../guards/roles.guard';
import { IsBannedGuard } from '../guards/is-banned.guard';
import { ResetPassword } from '../../prisma/PostgreSQL/generated/client';
import { ResetPasswordsController } from './reset-passwords.controller';
import { ResetPasswordsService } from './reset-passwords.service';

describe('ResetPasswordsController', () => {
    let controller: ResetPasswordsController;
    const gDto = new GeneratorDto('resetpass');
    const mocksRequest = mocks.createRequest();
    const resetPasswords: ResetPassword[] = [
        gDto.generateResetPasswordDto('123', 'token'),
        gDto.generateResetPasswordDto('123', 'token'),
        gDto.generateResetPasswordDto('123', 'token')
    ]
    const mockService = {
        getAll: jest.fn().mockImplementation((req) => {
            return {
                id: Date.now(),
                resetPasswords
            }
        }),
    }
    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ResetPasswordsController],
            providers: [
                ResetPasswordsService,
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
                })
            ]
        })
        .overrideProvider(ResetPasswordsService)
        .useValue(mockService)
        .compile();

        controller = module.get<ResetPasswordsController>(ResetPasswordsController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
    it('should return all the reset password requests', () => {
        expect(controller.getAll(mocksRequest)).toEqual({
            id: expect.any(Number),
            resetPasswords: expect.any(Array<ResetPassword>)
        });
    });
})