import { Test, TestingModule } from '@nestjs/testing'
import { DbModule } from '../db/db.module';
import { JwtModule } from '@nestjs/jwt';
import * as mocks from 'node-mocks-http';
import { GeneratorDto } from '../generators/generate-dto';
import { RolesGuard } from '../guards/roles.guard';
import { IsBannedGuard } from '../guards/is-banned.guard';
import { User } from '../../prisma/PostgreSQL/generated/client';
import { BansController } from './bans.controller';
import { BansService } from './bans.service';

describe('BansController', () => {
    let controller: BansController;
    const gDto = new GeneratorDto('bans');
    const mocksRequest = mocks.createRequest();
    const user: User = gDto.generateUserDto();
    const token = 'token';
    const message = 'message';
    const mockService = {
        ban: jest.fn().mockImplementation((dto, userId, req) => {
            return {
                id: Date.now(),
                ban: {
                    id: dto.id
                }
            }
        }),
        unban: jest.fn().mockImplementation((userId, req) => {
            return {
                id: Date.now(),
                ...userId
            }
        }),
    }
    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [BansController],
            providers: [
                BansService,
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
        .overrideProvider(BansService)
        .useValue(mockService)
        .compile();

        controller = module.get<BansController>(BansController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
    it('should ban the user', () => {
        const userId = '123';
        const ban = gDto.generateBanDto(userId, '321');
        expect(controller.ban(ban, userId, mocksRequest)).toEqual({
            id: expect.any(Number),
            ban: {
                id: ban.id
            }
        })
    });
    it('should unban the user', () => {
        const userId = '123';
        expect(controller.unban(userId, mocksRequest)).toEqual({
            id: expect.any(Number),
            userId
        })
    });
})