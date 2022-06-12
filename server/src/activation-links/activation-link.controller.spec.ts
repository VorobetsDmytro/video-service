import { Test, TestingModule } from '@nestjs/testing'
import { DbModule } from '../db/db.module';
import { JwtModule } from '@nestjs/jwt';
import * as mocks from 'node-mocks-http';
import { GeneratorDto } from '../generators/generate-dto';
import { RolesGuard } from '../guards/roles.guard';
import { IsBannedGuard } from '../guards/is-banned.guard';
import { Activationlink } from '../../prisma/PostgreSQL/generated/client';
import { ActivationLinksController } from './activation-links.controller';
import { ActivationLinksService } from './activation-links.service';

describe('ActivationLinksController', () => {
    let controller: ActivationLinksController;
    const gDto = new GeneratorDto('activlink');
    const mocksRequest = mocks.createRequest();
    const message = 'message';
    const activationLinks: Activationlink[] = [
        gDto.generateActivationLinkDto('123', 'link'),
        gDto.generateActivationLinkDto('123', 'link'),
        gDto.generateActivationLinkDto('123', 'link')
    ]
    const mockAuthService = {
        activation: jest.fn().mockImplementation((dto, userId, link) => {
            return {
                id: Date.now(),
                message,
                userId,
                link,
                ...dto
            }
        }),
        getAll: jest.fn().mockImplementation((req) => {
            return {
                id: Date.now(),
                activationLinks,
                ...req
            }
        })
    }
    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ActivationLinksController],
            providers: [
                ActivationLinksService,
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
        .overrideProvider(ActivationLinksService)
        .useValue(mockAuthService)
        .compile();

        controller = module.get<ActivationLinksController>(ActivationLinksController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
    it('should activate account', () => {
        const password = '123';
        const userId = '132';
        const link = '132';
        expect(controller.activation({password}, userId, link)).toEqual({
            id: expect.any(Number),
            message: expect.any(String),
            userId,
            link,
            password
        })
    });
    it('should return all the activation links', () => {
        expect(controller.getAll(mocksRequest)).toEqual({
            id: expect.any(Number),
            activationLinks,
            ...mocksRequest
        })
    });
})