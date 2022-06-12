import { Test, TestingModule } from '@nestjs/testing'
import { DbModule } from '../db/db.module';
import { JwtModule } from '@nestjs/jwt';
import * as mocks from 'node-mocks-http';
import { Token } from '../../prisma/PostgreSQL/generated/client';
import { GeneratorDto } from '../generators/generate-dto';
import { RolesGuard } from '../guards/roles.guard';
import { IsBannedGuard } from '../guards/is-banned.guard';
import { TokensController } from './tokens.controller';
import { TokensService } from './tokens.service';

describe('TokensController', () => {
    let controller: TokensController;
    const gDto = new GeneratorDto('tokens');
    const mocksRequest = mocks.createRequest();
    const tokens: Token[] = [
        gDto.generateTokenDto('123', 'access'),
        gDto.generateTokenDto('123', 'access'),
        gDto.generateTokenDto('123', 'access')
    ]
    const mockService = {
        getAll: jest.fn().mockImplementation(req => {
            return {
                id: Date.now(),
                tokens
            }
        })
    }
    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [TokensController],
            providers: [
                TokensService,
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
        .overrideProvider(TokensService)
        .useValue(mockService)
        .compile();

        controller = module.get<TokensController>(TokensController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should return all the tokens', () => {
        expect(controller.getAll(mocksRequest)).toEqual({
            id: expect.any(Number),
            tokens: expect.any(Array<Token>)
        });
    });
})