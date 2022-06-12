import { Test, TestingModule } from "@nestjs/testing";
import { RolesService } from "../roles/roles.service";
import { PostgreSQLPrismaService } from "../db/postgreSQL.prisma.service";
import { UsersService } from "./users.service";
import { LogsService } from "../logs/logs.service";
import { BansService } from "../bans/bans.service";
import { GeneratorDto } from "../generators/generate-dto";
import { SelectSecuredUser } from "./users.type";
import * as mocks from 'node-mocks-http';
import { User } from "../../prisma/PostgreSQL/generated/client";

describe('UsersService', () => {
    let service: UsersService;
    const gDto = new GeneratorDto('users');
    const mocksRequest = mocks.createRequest();
    const users: User[] = [
        gDto.generateUserDto(),
        gDto.generateUserDto(),
        gDto.generateUserDto()
    ]
    mocksRequest.user = {
        id: '123',
        email: 'email',
        role: 'role'
    }

    const mocksPostgreSQLPrismaService = {
        user: {
            create: jest.fn().mockImplementation((dto) => {
                return dto.data
            }),
            findFirst: jest.fn().mockImplementation((dto) => {
                return dto.where
            }),
            findUnique: jest.fn().mockImplementation((dto) => {
                if(dto.where.id.length === 36)
                    return null;
                return dto.where
            }),
            findMany: jest.fn().mockImplementation((dto) => {
                return users
            }),
            update: jest.fn().mockImplementation((dto) => {
                const user = {
                    id: dto.where.id
                }
                return {
                    ...user,
                    ...dto.data
                }
            }),
        }
    };
    const mocksRolesService = {
        getRoleByValue: jest.fn().mockImplementation((role) => {
            return {
                id: '123',
                value: role
            }
        })
    };
    const mocksLogsService = {
        create: jest.fn().mockImplementation((dto) => {
            return dto
        })
    };
    const mocksBansService = {
        getBansByUserId: jest.fn().mockImplementation((userId) => {
            return []
        })
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                { provide: PostgreSQLPrismaService, useValue: mocksPostgreSQLPrismaService },
                { provide: RolesService, useValue: mocksRolesService },
                { provide: LogsService, useValue: mocksLogsService },
                { provide: BansService, useValue: mocksBansService },
            ]
        }).compile();

        service = module.get<UsersService>(UsersService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should create a user', async () => {
        const dto = gDto.generateUserDto();
        expect(await service.createUser(dto)).toMatchObject({
            id: dto.id
        })
    });
    it('should return a user by email', async () => {
        const email = 'email';
        expect(await service.getOneByEmail(email)).toMatchObject({
            email
        })
    });
    it('should return a user by id', async () => {
        const id = '123';
        expect(await service.getOneById(id, SelectSecuredUser)).toMatchObject({
            id
        })
    });
    it('should return all the users', async () => {
        expect(await service.getAll(mocksRequest)).toEqual(expect.any(Array<User>))
    });
    it('should update the user', async () => {
        const dto = {
            email: 'email'
        }
        const user = gDto.generateUserDto();
        expect(await service.updateUser(dto, user)).toMatchObject({
            id: user.id,
            email: dto.email
        })
    });
    it('should generate the user id', async () => {
        expect(await service.generateUserId()).toEqual(expect.any(String));
    });
})