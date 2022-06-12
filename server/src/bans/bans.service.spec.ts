import { Test, TestingModule } from "@nestjs/testing";
import { PostgreSQLPrismaService } from "../db/postgreSQL.prisma.service";
import { LogsService } from "../logs/logs.service";
import { BansService } from "../bans/bans.service";
import { GeneratorDto } from "../generators/generate-dto";
import * as mocks from 'node-mocks-http';
import { UsersService } from "../users/users.service";
import { Ban } from "../../prisma/PostgreSQL/generated/client";

describe('BansService', () => {
    let service: BansService;
    const gDto = new GeneratorDto('bans');
    const mocksRequest = mocks.createRequest();
    mocksRequest.user = {
        id: '123',
        email: 'email',
        role: 'role'
    }

    const mocksPostgreSQLPrismaService = {
        ban: {
            findMany: jest.fn().mockImplementation((dto) => {
                if(dto.where.userId === 'banned')
                    return [ gDto.generateBanDto('123', dto.where.userId) ]
                return []
            }),
            findUnique: jest.fn().mockImplementation((dto) => {
                if(dto.where.id.length === 36)
                    return null;
                return dto.where
            }),
            create: jest.fn().mockImplementation((dto) => {
                return {
                    ...gDto.generateBanDto(dto.data.bannedById, dto.data.bannedId),
                    ...dto.data
                }
            }),
            update: jest.fn().mockImplementation((dto) => {
                return dto
            })
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
                BansService,
                { provide: PostgreSQLPrismaService, useValue: mocksPostgreSQLPrismaService },
                { provide: UsersService, useValue: mocksUsersService },
                { provide: LogsService, useValue: mocksLogsService },
            ]
        }).compile();

        service = module.get<BansService>(BansService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should ban the user', async () => {
        const dto = gDto.generateBanDto('123', '321');
        const params = {
            userId: '321'
        }
        expect(await service.ban(dto, params, mocksRequest)).toMatchObject({
            userId: dto.userId,
            bannedById: dto.bannedById
        })
    });
    it('should unban the user', async () => {
        const params = {
            userId: 'banned'
        }
        expect(await service.unban(params, mocksRequest));
    });
    it(`should check the user's bans`, async () => {
        const user = gDto.generateUserDto();
        expect(await service.isBanned(user)).toEqual(null);
    });
    it(`should return the ban id`, async () => {
        expect(await service.generateBanId()).toEqual(expect.any(String));
    });
    it(`should return the user's bans`, async () => {
        const userId = '123';
        expect(await service.getBansByUserId(userId)).toEqual(expect.any(Array<Ban>));
    });
    it(`should create a ban`, async () => {
        const dto = gDto.generateBanDto('123', '312');
        expect(await service.createBan(dto)).toMatchObject({
            ...dto
        })
    });
    it(`should unban the user`, async () => {
        const dto = gDto.generateBanDto('123', '312');
        expect(await service.unbanUser({...dto, bannedAt: new Date(), unBannedAt: null})).toMatchObject({
            data: {unBannedAt: expect.any(Date)},
            where: {id: dto.id}
        })
    });
})