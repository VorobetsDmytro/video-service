import { Test, TestingModule } from "@nestjs/testing";
import { PostgreSQLPrismaService } from "../db/postgreSQL.prisma.service";
import { LogsService } from "../logs/logs.service";
import { GeneratorDto } from "../generators/generate-dto";
import * as mocks from 'node-mocks-http';
import { UsersService } from "../users/users.service";
import { SubscriptionsService } from "../subscriptions/subscriptions.service";
import { SubscriptionTypesService } from "../subscription-types/subscription-types.service";
import { CreditCardsService } from "../credit-cards/credit-cards.service";
import { Subscription } from "../../prisma/PostgreSQL/generated/client";

describe('SubscriptionsService', () => {
    let service: SubscriptionsService;
    const gDto = new GeneratorDto('subs');
    const mocksRequest = mocks.createRequest();
    const subscriptions: Subscription[] = [
        gDto.generateSubscriptionDto('123', '213'),
        gDto.generateSubscriptionDto('123', '213'),
        gDto.generateSubscriptionDto('123', '213')
    ]
    mocksRequest.user = {
        id: '123',
        email: 'email',
        role: 'role'
    }

    const mocksPostgreSQLPrismaService = {
        subscription: {
            create: jest.fn().mockImplementation((dto) => {
                return {
                    ...gDto.generateSubscriptionDto(dto.data.userId, dto.data.subscriptionTypeId),
                    ...dto
                }
            }),
            findMany: jest.fn().mockImplementation(() => {
                return subscriptions
            }),
            findFirst: jest.fn().mockImplementation((dto) => {
                if(dto.where.userId === 'null')
                    return null
                return dto.where;
            }),
            delete: jest.fn().mockImplementation((dto) => {
                return dto.where
            }),
            findUnique: jest.fn().mockImplementation((dto) => {
                if(dto.where.id && dto.where.id.length === 36)
                    return null;
                return {
                    ...gDto.generateSubscriptionDto('123', '123'),
                    ...dto.where
                }
            }),
            update: jest.fn().mockImplementation((dto) => {
                return {
                    ...gDto.generateSubscriptionDto('123', '123'),
                    ...dto.where
                }
            }),
        }
    };
    const mocksCreditCardsService = {
        getCreditCardByIdAndUserId: jest.fn().mockImplementation((creditCardId, userId) => {
            return {
                ...gDto.generateCreditCardDto(userId, 'number'),
                id: creditCardId
            }
        }),
        withdraw: jest.fn().mockImplementation((creditCard, price) => {
            return {
                ...creditCard,
                money: creditCard.money - price
            }
        }),
    };
    const mocksSubscriptionTypesService = {
        getSubscriptionTypeByType: jest.fn().mockImplementation((type) => {
            return gDto.generateSubscriptionTypeDto(type)
        }),
        getSubscriptionTypeById: jest.fn().mockImplementation((id) => {
            return {
                ...gDto.generateSubscriptionTypeDto('123'),
                id
            }
        }),
    };
    const mocksLogsService = {
        create: jest.fn().mockImplementation((dto) => {
            return dto
        })
    };
    const mocksUsersService = {
        getOneByEmail: jest.fn().mockImplementation((email) => {
            if(email === 'null')
                return null;
            const user = gDto.generateUserDto();
            return {
                ...user,
                email
            }
        }),
        generateUserId: jest.fn().mockImplementation(() => {
            return '123'
        }),
        createUser: jest.fn().mockImplementation((dto) => {
            const user = gDto.generateUserDto();
            return {
                ...user,
                ...dto
            }
        }),
        isBanned: jest.fn().mockImplementation((user) => {
            return null
        }),
        getOneById: jest.fn().mockImplementation((id, select) => {
            const user = gDto.generateUserDto();
            return {
                ...user,
                id
            }
        }),
        updateUser: jest.fn().mockImplementation((dto, user) => {
            return {
                ...user,
                ...dto
            }
        })
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SubscriptionsService,
                { provide: PostgreSQLPrismaService, useValue: mocksPostgreSQLPrismaService },
                { provide: LogsService, useValue: mocksLogsService },
                { provide: UsersService, useValue: mocksUsersService },
                { provide: SubscriptionTypesService, useValue: mocksSubscriptionTypesService },
                { provide: CreditCardsService, useValue: mocksCreditCardsService },
            ]
        }).compile();

        service = module.get<SubscriptionsService>(SubscriptionsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should create a subscription', async () => {
        const dto = gDto.generateSubscriptionDto('null', '321');
        expect(await service.createSubscription(dto)).toMatchObject({
            ...dto,
            id: expect.any(String)
        });
    });
    it('should return all the subscriptions', async () => {
        expect(await service.getAll(mocksRequest)).toEqual(expect.any(Array<Subscription>));
    });
    it('should change the subscription', async () => {
        const dto = {
            subscriptionTypeName: 'subscriptionTypeName',
            creditCardId: 'creditCardId'
        }
        expect(await service.changeSubscription(dto, mocksRequest)).toMatchObject({
            message: expect.any(String)
        })
    });
    it('should check the reset subscription',  () => {
        const dto = gDto.generateSubscriptionDto('123', '123');
        expect(service.canResetSubscription(dto)).toEqual(true);
    });
    it('should reset the subscription', async () => {
        const dto = gDto.generateSubscriptionDto('123', '123');
        expect(await service.resetSubscription(dto)).toMatchObject({
            ...dto
        })
    });
    it('should update the subscription', async () => {
        const dto = gDto.generateSubscriptionDto('123', '123');
        expect(await service.updateSubscription(dto)).toMatchObject({
            ...dto
        })
    });
    it('should delete the subscription', async () => {
        const dto = gDto.generateSubscriptionDto('123', '123');
        expect(await service.deleteSubscription(dto)).toMatchObject({
            id: dto.id
        })
    });
    it('should return the subscription by id', async () => {
        const id = '123'
        expect(await service.getSubscriptionById(id)).toMatchObject({
            id
        })
    });
    it('should return the subscription by user id', async () => {
        const userId = '123'
        expect(await service.getSubscriptionByUserId(userId)).toMatchObject({
            userId
        })
    });
    it(`should return the subscription's id`, async () => {
        expect(await service.generateSubscriptionId()).toEqual(expect.any(String));
    });
})