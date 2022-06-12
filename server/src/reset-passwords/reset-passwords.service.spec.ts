import { Test, TestingModule } from "@nestjs/testing";
import { PostgreSQLPrismaService } from "../db/postgreSQL.prisma.service";
import { LogsService } from "../logs/logs.service";
import { GeneratorDto } from "../generators/generate-dto";
import * as mocks from 'node-mocks-http';
import { UsersService } from "../users/users.service";
import { ResetPasswordsService } from "./reset-passwords.service";
import { ResetPassword } from "../../prisma/PostgreSQL/generated/client";

describe('ResetPasswordsService', () => {
    let service: ResetPasswordsService;
    const gDto = new GeneratorDto('profiles');
    const mocksRequest = mocks.createRequest();
    const resetPasswords: ResetPassword[] = [
        gDto.generateResetPasswordDto('123', 'token'),
        gDto.generateResetPasswordDto('123', 'token'),
        gDto.generateResetPasswordDto('123', 'token')
    ]
    mocksRequest.user = {
        id: '123',
        email: 'email',
        role: 'role'
    }

    const mocksPostgreSQLPrismaService = {
        resetPassword: {
            findMany: jest.fn().mockImplementation(() => {
                return resetPasswords
            }),
            findFirst: jest.fn().mockImplementation((dto) => {
                if(dto.where.token && dto.where.token.length === 36)
                    return null;
                return gDto.generateResetPasswordDto(dto.where.userId, dto.where.token ? dto.where.token : 'token')
            }),
            create: jest.fn().mockImplementation((dto) => {
                return dto.data
            }),
            findUnique: jest.fn().mockImplementation((dto) => {
                return null
            }),
            delete: jest.fn().mockImplementation((dto) => {
                return dto.where
            })
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
                ResetPasswordsService,
                { provide: PostgreSQLPrismaService, useValue: mocksPostgreSQLPrismaService },
                { provide: LogsService, useValue: mocksLogsService },
                { provide: UsersService, useValue: mocksUsersService },
            ]
        }).compile();

        service = module.get<ResetPasswordsService>(ResetPasswordsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should return all the reset password requests', async () => {
        expect(await service.getAll(mocksRequest)).toEqual(expect.any(Array<ResetPassword>))
    });
    it('should return all the reset password request by user id', async () => {
        const userId = '123';
        expect(await service.getResetPasswordByUserId(userId)).toMatchObject({
            userId
        })
    });
    it('should return all the reset password request by user id and token', async () => {
        const userId = '123';
        const token = '1token23';
        expect(await service.getTokenByUserIdAndTokenVal(userId, token)).toMatchObject({
            userId,
            token
        })
    });
    it('should create a reset password request', async () => {
        const dto = gDto.generateResetPasswordDto('123', 'token');
        expect(await service.createResetPassword(dto)).toMatchObject({
            ...dto
        })
    });
    it(`should return a reset password request's token`, async () => {
        expect(await service.generateResetPasswordToken()).toEqual(expect.any(String));
    });
    it(`should return a reset password request's id`, async () => {
        expect(await service.generateResetPasswordId()).toEqual(expect.any(String));
    });
    it(`should delete the reset password request`, async () => {
        const dto = gDto.generateResetPasswordDto('123', 'token');
        expect(await service.deleteResetPassword(dto)).toMatchObject({
            id: dto.id
        })
    });
})