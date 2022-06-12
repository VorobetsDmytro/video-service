import { Test, TestingModule } from '@nestjs/testing'
import { DbModule } from '../db/db.module';
import { JwtModule } from '@nestjs/jwt';
import * as mocks from 'node-mocks-http';
import { GeneratorDto } from '../generators/generate-dto';
import { RolesGuard } from '../guards/roles.guard';
import { IsBannedGuard } from '../guards/is-banned.guard';
import { CreditCardsController } from './credit-cards.controller';
import { CreditCardsService } from './credit-cards.service';
import { CreditCard } from '../../prisma/PostgreSQL/generated/client';

describe('CreditCardsController', () => {
    let controller: CreditCardsController;
    const gDto = new GeneratorDto('credit-cards');
    const mocksRequest = mocks.createRequest();
    const message = 'message';
    const creditCards: CreditCard[] = [
        gDto.generateCreditCardDto('123', 'number'),
        gDto.generateCreditCardDto('123', 'number'),
        gDto.generateCreditCardDto('123', 'number')
    ]
    const mockService = {
        add: jest.fn().mockImplementation((dto, req) => {
            return {
                id: Date.now(),
                creditCard: {
                    id: dto.id
                },
                message
            }
        }),
        getAll: jest.fn().mockImplementation((req) => {
            return {
                id: Date.now(),
                creditCards
            }
        }),
        topUpMyBalance: jest.fn().mockImplementation((dto, req) => {
            return {
                id: Date.now(),
                creditCard: {
                    id: dto.creditCardId
                }
            }
        }),
        remove: jest.fn().mockImplementation(({creditCardId}, req) => {
            return {
                id: Date.now(),
                message,
                creditCardId
            }
        })
    }
    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [CreditCardsController],
            providers: [
                CreditCardsService,
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
        .overrideProvider(CreditCardsService)
        .useValue(mockService)
        .compile();

        controller = module.get<CreditCardsController>(CreditCardsController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should add a credit card', () => {
        const card = gDto.generateCreditCardDto('123', 'number');
        expect(controller.addCard(card, mocksRequest)).toEqual({
            id: expect.any(Number),
            creditCard: {
                id: card.id
            },
            message
        });
    });
    it('should return all the credit cards', () => {
        expect(controller.getAll(mocksRequest)).toEqual({
            id: expect.any(Number),
            creditCards: expect.any(Array<CreditCard>)
        });
    });
    it('should return the toped up the credit card', () => {
        const creditCardId = '100';
        const dto = {
            money: 100
        };
        expect(controller.topUpMyBalance(dto, creditCardId, mocksRequest)).toEqual({
            id: expect.any(Number),
            creditCard: {
                id: creditCardId
            },
        });
    });
    it('should delete the credit card', () => {
        const creditCardId = '100';
        expect(controller.remove(creditCardId, mocksRequest)).toEqual({
            id: expect.any(Number),
            message,
            creditCardId
        });
    });
})