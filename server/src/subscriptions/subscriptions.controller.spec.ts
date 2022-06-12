import { Test, TestingModule } from '@nestjs/testing'
import { DbModule } from '../db/db.module';
import { JwtModule } from '@nestjs/jwt';
import * as mocks from 'node-mocks-http';
import { Subscription } from '../../prisma/PostgreSQL/generated/client';
import { GeneratorDto } from '../generators/generate-dto';
import { RolesGuard } from '../guards/roles.guard';
import { IsBannedGuard } from '../guards/is-banned.guard';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionType_Types } from '../subscription-types/subscription-types.type';

describe('SubscriptionsController', () => {
    let controller: SubscriptionsController;
    const gDto = new GeneratorDto('subs');
    const mocksRequest = mocks.createRequest();
    const message = 'message';
    const subscriptions: Subscription[] = [
        gDto.generateSubscriptionDto('123', '213'),
        gDto.generateSubscriptionDto('123', '213'),
        gDto.generateSubscriptionDto('123', '213')
    ]
    const mockService = {
        getAll: jest.fn().mockImplementation(req => {
            return {
                id: Date.now(),
                subscriptions
            }
        }),
        changeSubscription: jest.fn().mockImplementation((dto, req) => {
            return {
                id: Date.now(),
                subscription: {
                    subscriptionTypeName: dto.subscriptionTypeName
                },
                message
            }
        })
    }
    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [SubscriptionsController],
            providers: [
                SubscriptionsService,
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
        .overrideProvider(SubscriptionsService)
        .useValue(mockService)
        .compile();

        controller = module.get<SubscriptionsController>(SubscriptionsController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should return all the subscriptions', () => {
        expect(controller.getAll(mocksRequest)).toEqual({
            id: expect.any(Number),
            subscriptions: expect.any(Array<Subscription>)
        });
    });
    it('should change the subscription', () => {
        const dto = {
            creditCardId: '123',
            subscriptionTypeName: SubscriptionType_Types.SILVER,
            userId: '123'
        }
        expect(controller.changeSubscription(dto, mocksRequest)).toEqual({
            id: expect.any(Number),
            subscription: {
                subscriptionTypeName: dto.subscriptionTypeName
            },
            message
        });
    });
})