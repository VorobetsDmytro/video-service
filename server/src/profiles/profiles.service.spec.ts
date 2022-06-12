import { Test, TestingModule } from "@nestjs/testing";
import { RolesService } from "../roles/roles.service";
import { PostgreSQLPrismaService } from "../db/postgreSQL.prisma.service";
import { LogsService } from "../logs/logs.service";
import { GeneratorDto } from "../generators/generate-dto";
import * as mocks from 'node-mocks-http';
import { ProfilesService } from "./profiles.service";
import { UsersService } from "../users/users.service";
import { RoleTypes } from "../roles/roles.type";
import { MailTransporterService } from "../mail-transporter/mail-transporter.service";
import { SubscriptionsService } from "../subscriptions/subscriptions.service";
import { ChangeEmail } from "../../prisma/PostgreSQL/generated/client";

describe('ProfilesService', () => {
    let service: ProfilesService;
    const gDto = new GeneratorDto('profiles');
    const mocksRequest = mocks.createRequest();
    const changeEmails: ChangeEmail[] = [
        gDto.generateChangeEmailDto('123', 'email'),
        gDto.generateChangeEmailDto('123', 'email'),
        gDto.generateChangeEmailDto('123', 'email')
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
                return null
            }),
            findUnique: jest.fn().mockImplementation((dto) => {
                if(dto.where.id.length === 36)
                    return null;
                return {
                    ...gDto.generateUserDto(),
                    id: dto.where.id
                }
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
        },
        changeEmail: {
            findFirst: jest.fn().mockImplementation((dto) => {
                return gDto.generateChangeEmailDto(dto.where.userId, 'newemail');
            }),
            update: jest.fn().mockImplementation((dto) => {
                return {
                    ...gDto.generateChangeEmailDto('123', dto.data.newEmail),
                    id: dto.where.id
                }
            }),
            findUnique: jest.fn().mockImplementation((dto) => {
                if(dto.where.id.length === 36)
                    return null;
                return dto.where
            }),
            findMany: jest.fn().mockImplementation(() => {
                return changeEmails
            }),
            delete: jest.fn().mockImplementation((dto) => {
                return dto
            })
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
    const mocksMailTransporterService = {
        sendEmail: jest.fn().mockImplementation((email, text, link) => {})
    };
    const mocksSubscriptionsService = {
        generateSubscriptionId: jest.fn().mockImplementation(() => {
            return '123'
        }),
        createSubscription: jest.fn().mockImplementation((dto) => {
            return {
                ...gDto.generateSubscriptionDto('123', '123'),
                ...dto
            }
        }),
        getSubscriptionByUserId: jest.fn().mockImplementation((userId) => {
            return {
                ...gDto.generateSubscriptionDto('123', '123'),
                userId,
                subscriptionType: {
                    name: '123',
                    canAddComments: true
                }
            }
        }),
        deleteSubscription: jest.fn().mockImplementation((subscription) => {
            return subscription;
        }),
        canResetSubscription: jest.fn().mockImplementation((subscription) => {
            return false;
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
                ProfilesService,
                { provide: PostgreSQLPrismaService, useValue: mocksPostgreSQLPrismaService },
                { provide: RolesService, useValue: mocksRolesService },
                { provide: LogsService, useValue: mocksLogsService },
                { provide: UsersService, useValue: mocksUsersService },
                { provide: MailTransporterService, useValue: mocksMailTransporterService },
                { provide: SubscriptionsService, useValue: mocksSubscriptionsService }
            ]
        }).compile();

        service = module.get<ProfilesService>(ProfilesService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should return the profile', async () => {
        expect(await service.getProfile(mocksRequest)).toMatchObject({
            id: mocksRequest.user.id
        })
    });
    it('should return the profile by user id', async () => {
        const userId = '123';
        expect(await service.getProfileByUserId(userId, mocksRequest)).toMatchObject({
            id: userId
        })
    });
    it('should return the changed profile', async () => {
        const dto = {
            firstname: 'aaaa'
        }
        expect(await service.changeProfile(dto, mocksRequest)).toMatchObject({
            user: {
                id: mocksRequest.user.id,
                firstname: dto.firstname
            }
        })
    });
    it('should create a change email link', () => {
        const changeEmailId = '123';
        expect(service.createChangeEmailLink(changeEmailId)).toEqual(expect.any(String));
    });
    it('should try to delete a not existing file', () => {
        const filePath = 'filePath';
        expect(service.deleteFile(filePath)).toEqual(null);
    });
    it('should try to upload not existing file', async () => {
        const user = gDto.generateUserDto();
        const avatar = 'avatar';
        expect(await service.uploadAvatar(user, avatar)).toEqual(null);
    });
    it('should return a change email id', async () => {
        expect(await service.generateChangeEmailId()).toEqual(expect.any(String));
    });
    it('should return all the change email requests', async () => {
        expect(await service.getAllChangeEmailRequests(mocksRequest)).toEqual(expect.any(Array<ChangeEmail>));
    });
    it('should accept the change email request', async () => {
        const dto = {
            password: '123'
        }
        const changeEmailId = '123';
        expect(await service.changeEmailAccept(dto, changeEmailId, mocksRequest)).toEqual({
            message: expect.any(String)
        });
    });
})