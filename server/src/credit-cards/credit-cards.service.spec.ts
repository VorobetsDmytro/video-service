import { Test, TestingModule } from "@nestjs/testing";
import { PostgreSQLPrismaService } from "../db/postgreSQL.prisma.service";
import { LogsService } from "../logs/logs.service";
import { GeneratorDto } from "../generators/generate-dto";
import * as mocks from 'node-mocks-http';
import { CreditCardsService } from "./credit-cards.service";
import { UsersService } from "../users/users.service";
import { CreditCard } from "../../prisma/PostgreSQL/generated/client";

describe('CreditCardsService', () => {
    let service: CreditCardsService;
    const gDto = new GeneratorDto('creditCards');
    const mocksRequest = mocks.createRequest();
    mocksRequest.user = {
        id: '123',
        email: 'email',
        role: 'role'
    }
    const creditCards: CreditCard[] = [
        gDto.generateCreditCardDto('123', 'number'),
        gDto.generateCreditCardDto('123', 'number'),
        gDto.generateCreditCardDto('123', 'number')
    ]

    const mocksPostgreSQLPrismaService = {
        creditCard: {
            create: jest.fn().mockImplementation((dto) => {
                return {
                    ...gDto.generateCreditCardDto(dto.data.userId, dto.data.number),
                    ...dto.data
                }
            }),
            findFirst: jest.fn().mockImplementation((dto) => {
                if(dto.where.userId && dto.where.number && dto.where.userId !== 'null')
                    return null;
                return gDto.generateCreditCardDto(dto.where.userId, '1111');
            }),
            findUnique: jest.fn().mockImplementation((dto) => {
                if(dto.where.id.length === 36)
                    return null;
                return dto.where
            }),
            findMany: jest.fn().mockImplementation((dto) => {
                return creditCards
            }),
            delete: jest.fn().mockImplementation((dto) => {
                return dto
            }),
            update: jest.fn().mockImplementation((dto) => {
                return dto.where
            }),
        }
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
    const mocksLogsService = {
        create: jest.fn().mockImplementation((dto) => {
            return dto
        })
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CreditCardsService,
                { provide: PostgreSQLPrismaService, useValue: mocksPostgreSQLPrismaService },
                { provide: UsersService, useValue: mocksUsersService },
                { provide: LogsService, useValue: mocksLogsService },
            ]
        }).compile();

        service = module.get<CreditCardsService>(CreditCardsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should add the credit card', async () => {
        const dto = gDto.generateCreditCardDto('123', '1111');
        expect(await service.add(dto, mocksRequest)).toEqual({
           creditCard: {
               ...dto,
               id: expect.any(String)
           },
           message: expect.any(String)
        });
    });
    it('should remove the credit card', async () => {
        const dto = {
            creditCardId: '123'
        }
        expect(await service.remove(dto, mocksRequest)).toEqual({
           message: expect.any(String)
        });
    });
    it(`should correct the card's number`, () => {
        const number = '1111'
        expect(service.correctTheCreditCardNumber(number)).toEqual(expect.any(String));
    });
    it('should delete the credit card', async () => {
        const dto = gDto.generateCreditCardDto('123', '1111');
        expect(await service.deleteCreditCard(dto)).toMatchObject({
            where: {
                id: dto.id
            }
        });
    });
    it('should return all the credit cards', async () => {
        expect(await service.getAll(mocksRequest)).toEqual(expect.any(Array<CreditCard>));
    });
    it('should create a credit card', async () => {
        const dto = gDto.generateCreditCardDto('123', '1111');
        expect(await service.createCreditCard(dto)).toMatchObject({
            ...dto
        });
    });
    it('should return the credit card by id', async () => {
        const id = '123'
        expect(await service.getCreditCardById(id)).toMatchObject({
            id
        });
    });
    it('should return the credit card by id and user id', async () => {
        const id = '123'
        const userId = 'null'
        expect(await service.getCreditCardByIdAndUserId(id, userId)).toMatchObject({
            id: expect.any(String)
        });
    });
    it('should return the credit card by id and user id', async () => {
        const number = 'number'
        const userId = '123'
        expect(await service.getCreditCardByUserIdAndNumber(userId, number)).toEqual(null);
    });
    it('should return the credit card id', async () => {
        expect(await service.generateCreditCardId()).toEqual(expect.any(String));
    });
    it('should top up the credit card', async () => {
        const dto = {
            money: 100,
            creditCard: '123'
        }
        expect(await service.topUpMyBalance(dto, mocksRequest)).toMatchObject({
            message: expect.any(String)
        })
    });
    it('should top up the credit card', async () => {
        const dto = gDto.generateCreditCardDto('123', '1111');
        const money = 100;
        expect(await service.topUp(dto, money)).toMatchObject({
            id: dto.id
        })
    });
    it('should withdraw the money', async () => {
        const dto = gDto.generateCreditCardDto('123', '1111');
        const money = 100;
        expect(await service.withdraw(dto, money)).toMatchObject({
            id: dto.id
        })
    });
})