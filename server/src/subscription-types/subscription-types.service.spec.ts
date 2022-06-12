import { Test, TestingModule } from "@nestjs/testing";
import { PostgreSQLPrismaService } from "../db/postgreSQL.prisma.service";
import { LogsService } from "../logs/logs.service";
import { GeneratorDto } from "../generators/generate-dto";
import * as mocks from 'node-mocks-http';
import { UsersService } from "../users/users.service";
import { SubscriptionTypesService } from "./subscription-types.service";
import { SubscriptionType } from "../../prisma/PostgreSQL/generated/client";

describe('SubscriptionTypesService', () => {
    let service: SubscriptionTypesService;
    const gDto = new GeneratorDto('subtypes');
    const mocksRequest = mocks.createRequest();
    const subscriptionTypes: SubscriptionType[] = [
        gDto.generateSubscriptionTypeDto('name'),
        gDto.generateSubscriptionTypeDto('name'),
        gDto.generateSubscriptionTypeDto('name')
    ]
    mocksRequest.user = {
        id: '123',
        email: 'email',
        role: 'role'
    }

    const mocksPostgreSQLPrismaService = {
        subscriptionType: {
            findFirst: jest.fn().mockImplementation((dto) => {
                if(dto.where.name === 'null')
                    return null;
                return gDto.generateSubscriptionTypeDto(dto.where.name);
            }),
            findUnique: jest.fn().mockImplementation((dto) => {
                if(dto.where.id.length === 36)
                    return null;
                return {
                    ...gDto.generateSubscriptionTypeDto(dto.where.name),
                    id: dto.where.id
                }
            }),
            create: jest.fn().mockImplementation((dto) => {
                return {
                    ...gDto.generateSubscriptionTypeDto(dto.data.name),
                    ...dto
                }
            }),
            delete: jest.fn().mockImplementation((dto) => {
                return dto.where
            }),
            findMany: jest.fn().mockImplementation(() => {
                return subscriptionTypes
            }),
        }
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
                SubscriptionTypesService,
                { provide: PostgreSQLPrismaService, useValue: mocksPostgreSQLPrismaService },
                { provide: LogsService, useValue: mocksLogsService },
                { provide: UsersService, useValue: mocksUsersService },
            ]
        }).compile();

        service = module.get<SubscriptionTypesService>(SubscriptionTypesService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should create a subscription type', async () => {
        const dto = gDto.generateSubscriptionTypeDto('null');
        expect(await service.create(dto, mocksRequest)).toMatchObject({
            ...dto,
            id: expect.any(String)
        })
    });
    it('should delete the subscription type', async () => {
        const name = 'name';
        expect(await service.delete(name, mocksRequest)).toMatchObject({
            subscriptionTypeName: name
        })
    });
    it('should delete the subscription type by name', async () => {
        const name = 'name';
        expect(await service.deleteSubscriptionTypeByName(name)).toEqual(name)
    });
    it('should create a subscription type', async () => {
        const dto = gDto.generateSubscriptionTypeDto('123');
        expect(await service.createSubscriptionType(dto)).toMatchObject({
            ...dto,
            id: expect.any(String)
        })
    });
    it('should return the subscription type by id', async () => {
        const id = '123';
        expect(await service.getSubscriptionTypeById(id)).toMatchObject({
            id
        })
    });
    it('should return the subscription type by type', async () => {
        const name = 'name';
        expect(await service.getSubscriptionTypeByType(name)).toMatchObject({
            name
        })
    });
    it('should return all the subscription types', async () => {
        expect(await service.getAll(mocksRequest)).toEqual(expect.any(Array<SubscriptionType>));
    });
    it(`should return the subscription type's id`, async () => {
        expect(await service.generateSubscriptionTypeId()).toEqual(expect.any(String));
    });
})