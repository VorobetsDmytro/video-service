import { Test, TestingModule } from "@nestjs/testing";
import { RolesService } from "../roles/roles.service";
import { PostgreSQLPrismaService } from "../db/postgreSQL.prisma.service";
import { LogsService } from "../logs/logs.service";
import { GeneratorDto } from "../generators/generate-dto";
import * as mocks from 'node-mocks-http';
import { UsersService } from "../users/users.service";
import { RoleTypes } from "../roles/roles.type";
import { TokensService } from "./tokens.service";
import { JwtService } from "@nestjs/jwt";
import { Token } from "../../prisma/PostgreSQL/generated/client";

describe('TokensService', () => {
    let service: TokensService;
    const gDto = new GeneratorDto('tokens');
    const mocksRequest = mocks.createRequest();
    const tokens: Token[] = [
        gDto.generateTokenDto('123', 'access'),
        gDto.generateTokenDto('123', 'access'),
        gDto.generateTokenDto('123', 'access')
    ]
    mocksRequest.user = {
        id: '123',
        email: 'email',
        role: 'role'
    }

    const mocksPostgreSQLPrismaService = {
        token: {
            findFirst: jest.fn().mockImplementation((dto) => {
                return gDto.generateTokenDto(dto.where.userId, 'access')
            }),
            update: jest.fn().mockImplementation((dto) => {
                return {
                    ...gDto.generateTokenDto(dto.where.userId, dto.data.accessToken),
                    ...dto.data
                }
            }),
            findMany: jest.fn().mockImplementation(() => {
                return tokens
            }),
        }
    };
    const mocksRolesService = {
        getRoleByValue: jest.fn().mockImplementation((role) => {
            return {
                id: '123',
                value: role
            }
        }),
        getRoleById: jest.fn().mockImplementation((id) => {
            const role = gDto.generateRoleDto(RoleTypes.ADMIN)
            return {
                ...role,
                id
            }
        })
    };
    const mocksLogsService = {
        create: jest.fn().mockImplementation((dto) => {
            return dto
        })
    };
    const mocksJwtService = {
        sign: jest.fn().mockImplementation((dto) => {
            return 'token'
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
                TokensService,
                { provide: PostgreSQLPrismaService, useValue: mocksPostgreSQLPrismaService },
                { provide: RolesService, useValue: mocksRolesService },
                { provide: LogsService, useValue: mocksLogsService },
                { provide: UsersService, useValue: mocksUsersService },
                { provide: JwtService, useValue: mocksJwtService },
            ]
        }).compile();

        service = module.get<TokensService>(TokensService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should return a token', async () => {
        const dto = gDto.generateUserDto();
        expect(await service.generateToken(dto)).toEqual(expect.any(String));
    });
    it('should save the token', async () => {
        const userId = 'userId';
        const accessToken = 'accessToken';
        expect(await service.saveToken(userId, accessToken)).toMatchObject({
            userId,
            accessToken
        });
    });
    it('should return all the tokens', async () => {
        expect(await service.getAll(mocksRequest)).toEqual(expect.any(Array<Token>));
    });
    it('should disactivate the token', async () => {
        const dto = gDto.generateTokenDto('123', 'access');
        dto.isActive = true;
        expect(await service.disactivateToken(dto)).toMatchObject({
            userId: dto.userId,
            isActive: false
        })
    });
})