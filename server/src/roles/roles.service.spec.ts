import { Test, TestingModule } from "@nestjs/testing";
import { RolesService } from "../roles/roles.service";
import { PostgreSQLPrismaService } from "../db/postgreSQL.prisma.service";
import { LogsService } from "../logs/logs.service";
import { GeneratorDto } from "../generators/generate-dto";
import * as mocks from 'node-mocks-http';
import { UsersService } from "../users/users.service";
import { RoleTypes } from "./roles.type";
import { Role } from "../../prisma/PostgreSQL/generated/client";

describe('RolesService', () => {
    let service: RolesService;
    const gDto = new GeneratorDto('roles');
    const mocksRequest = mocks.createRequest();
    const roles: Role[] = [
        gDto.generateRoleDto(RoleTypes.SUBSCRIBER),
        gDto.generateRoleDto(RoleTypes.ADMIN)
    ]
    mocksRequest.user = {
        id: '123',
        email: 'email',
        role: 'role'
    }

    const mocksPostgreSQLPrismaService = {
        user: {
            update: jest.fn().mockImplementation((dto) => {
                const user = {
                    id: dto.where.id
                }
                return {
                    ...user,
                    ...dto.data
                }
            }),
        },
        role: {
            findUnique: jest.fn().mockImplementation((dto) => {
                return null;
            }),
            create: jest.fn().mockImplementation((dto) => {
                return {
                    ...gDto.generateRoleDto(dto.data.value),
                    ...dto
                }
            }),
            findFirst: jest.fn().mockImplementation((dto) => {
                if(dto.where.value === 'null')
                    return null;
                return {
                    ...gDto.generateRoleDto(dto.where.value),
                    id: dto.where.id ? dto.where.id : 'ididid'
                }
            }),
            delete: jest.fn().mockImplementation((dto) => {
                return dto.data
            }),
            findMany: jest.fn().mockImplementation((dto) => {
                return roles
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
                RolesService,
                { provide: PostgreSQLPrismaService, useValue: mocksPostgreSQLPrismaService },
                { provide: LogsService, useValue: mocksLogsService },
                { provide: UsersService, useValue: mocksUsersService },
            ]
        }).compile();

        service = module.get<RolesService>(RolesService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should create a role', async () => {
        const dto = gDto.generateRoleDto('null');
        expect(await service.create(dto, mocksRequest)).toMatchObject({
            value: dto.value
        })
    });
    it('should delete the role', async () => {
        const value = RoleTypes.ADMIN;
        expect(await service.delete(value, mocksRequest)).toMatchObject({
            roleValue: value
        })
    });
    it('should create a role', async () => {
        const dto = gDto.generateRoleDto(RoleTypes.ADMIN);
        expect(await service.createRole(dto)).toMatchObject({
            data: {
                ...dto
            }
        })
    });
    it('should return all the roles', async () => {
        expect(await service.getAll(mocksRequest)).toEqual(expect.any(Array<Role>));
    });
    it('should return the role by value', async () => {
        const value = RoleTypes.ADMIN;
        expect(await service.getRoleByValue(value)).toMatchObject({
            value
        })
    });
    it('should return the role by id', async () => {
        const id = '123';
        expect(await service.getRoleById(id)).toMatchObject({
            id
        })
    });
    it('should delete role by value', async () => {
        const value = RoleTypes.ADMIN;
        expect(await service.deleteRoleByValue(value)).toEqual(value);
    });
    it('should set the role to the user', async () => {
        const role = gDto.generateRoleDto(RoleTypes.ADMIN);
        const user = gDto.generateUserDto();
        expect(await service.setRoleToUser(role, user)).toMatchObject({
            roleId: role.id,
            id: user.id
        })
    });
    it('should return the role id', async () => {
        expect(await service.generateRoleId()).toEqual(expect.any(String));
    });
})