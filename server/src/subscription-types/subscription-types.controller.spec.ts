import { Test, TestingModule } from '@nestjs/testing'
import { DbModule } from '../db/db.module';
import { JwtModule } from '@nestjs/jwt';
import * as mocks from 'node-mocks-http';
import { SubscriptionType } from '../../prisma/PostgreSQL/generated/client';
import { GeneratorDto } from '../generators/generate-dto';
import { RolesGuard } from '../guards/roles.guard';
import { IsBannedGuard } from '../guards/is-banned.guard';
import { SubscriptionTypesController } from './subscription-types.controller';
import { SubscriptionTypesService } from './subscription-types.service';
import { SubscriptionType_Types } from './subscription-types.type';

describe('SubscriptionTypesController', () => {
    let controller: SubscriptionTypesController;
    const gDto = new GeneratorDto('subtype');
    const mocksRequest = mocks.createRequest();
    const subscriptionTypes: SubscriptionType[] = [
        gDto.generateSubscriptionTypeDto('name'),
        gDto.generateSubscriptionTypeDto('name'),
        gDto.generateSubscriptionTypeDto('name')
    ]
    const mockService = {
        create: jest.fn().mockImplementation((dto, req) => {
            return {
                id: Date.now(),
                subscriptionType: {
                    id: dto.id
                }
            }
        }),
        getAll: jest.fn().mockImplementation((req) => {
            return {
                id: Date.now(),
                subscriptionTypes
            }
        }),
        delete: jest.fn().mockImplementation((name, req) => {
            return {
                id: Date.now(),
                name
            }
        })
    }
    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [SubscriptionTypesController],
            providers: [
                SubscriptionTypesService,
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
        .overrideProvider(SubscriptionTypesService)
        .useValue(mockService)
        .compile();

        controller = module.get<SubscriptionTypesController>(SubscriptionTypesController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should create a subscription type', () => {
        const dto = gDto.generateSubscriptionTypeDto('name');
        expect(controller.create(dto, mocksRequest)).toEqual({
            id: expect.any(Number),
            subscriptionType: {
                id: dto.id
            }
        });
    });
    it('should return all the subscription types', () => {
        expect(controller.getAll(mocksRequest)).toEqual({
            id: expect.any(Number),
            subscriptionTypes: expect.any(Array<SubscriptionType>)
        });
    });
    it('should delete the subscription type', () => {
        const name = SubscriptionType_Types.STANDART;
        expect(controller.delete(name, mocksRequest)).toEqual({
            id: expect.any(Number),
            name
        });
    });
})