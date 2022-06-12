import { Test, TestingModule } from "@nestjs/testing";
import { RolesService } from "../roles/roles.service";
import { PostgreSQLPrismaService } from "../db/postgreSQL.prisma.service";
import { LogsService } from "../logs/logs.service";
import { GeneratorDto } from "../generators/generate-dto";
import * as mocks from 'node-mocks-http';
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";
import { TokensService } from "../tokens/tokens.service";
import { ActivationLinksService } from "../activation-links/activation-links.service";
import { ResetPasswordsService } from "../reset-passwords/reset-passwords.service";
import { MailTransporterService } from "../mail-transporter/mail-transporter.service";
import { SubscriptionTypesService } from "../subscription-types/subscription-types.service";
import { SubscriptionsService } from "../subscriptions/subscriptions.service";
import { RoleTypes } from "../roles/roles.type";

describe('AuthService', () => {
    let service: AuthService;
    const gDto = new GeneratorDto('auth');
    const mocksRequest = mocks.createRequest();
    mocksRequest.user = {
        id: '123',
        email: 'email',
        role: 'role'
    }

    const mocksPostgreSQLPrismaService = {
        activationlink: {
            findFirst: jest.fn().mockImplementation((dto) => {
                const activationLink = gDto.generateActivationLinkDto(dto.where.userId, 'link');
                return {
                    ...activationLink,
                    isActivated: true
                }
            })
        },
        token: {
            findFirst: jest.fn().mockImplementation((dto) => {
                return gDto.generateTokenDto(dto.where.userId, 'access');
            })
        },
        role: {
            findUnique: jest.fn().mockImplementation((dto) => {
                const role = gDto.generateRoleDto(RoleTypes.ADMIN)
                return {
                    ...role,
                    id: dto.where.id
                }
            })
        },
        resetPassword: {
            findUnique: jest.fn().mockImplementation((dto) => {
                return gDto.generateResetPasswordDto(dto.where.userId, 'token')
            }),
            update: jest.fn().mockImplementation((dto) => {
                return dto;
            }),
        }
    };
    const mocksRolesService = {
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
    const mocksTokensService = {
        generateToken: jest.fn().mockImplementation((user) => {
            return 'token' + user.id
        }),
        saveToken: jest.fn().mockImplementation((userId, token) => {
            return {
                userId, 
                token
            }
        }),
        disactivateToken: jest.fn().mockImplementation((token) => {
            return token
        })
    };
    const mocksActivationLinksService = {
        generateLink: jest.fn().mockImplementation(() => {
            return 'link'
        }),
        createActiovationLinkUrl: jest.fn().mockImplementation((userId, link) => {
            return `http://localhost:3000/registration/accept/${userId}/${link}`
        }),
        createActiovationLink: jest.fn().mockImplementation((dto) => {
            return {
                ...gDto.generateActivationLinkDto('123', 'link'),
                ...dto
            }
        }),
    };
    const mocksResetPasswordsService = {
        getResetPasswordByUserId: jest.fn().mockImplementation((userId) => {
            return gDto.generateResetPasswordDto(userId, 'token');
        }),
        generateResetPasswordId: jest.fn().mockImplementation(() => {
            return '123'
        }),
        generateResetPasswordToken: jest.fn().mockImplementation(() => {
            return 'token'
        }),
        createResetPassword: jest.fn().mockImplementation((dto) => {
            const resetPass = gDto.generateResetPasswordDto(dto.userId, dto.token)
            return {
                ...resetPass,
                id: dto.id
            }
        }),
        getTokenByUserIdAndTokenVal: jest.fn().mockImplementation((userId, token) => {
            const resetPass = gDto.generateResetPasswordDto(userId, token);
            return {
                ...resetPass,
                isApproved: true
            }
        }),
        deleteResetPassword: jest.fn().mockImplementation((resetPass) => {
            return resetPass;
        })
    };
    const mocksMailTransporterService = {
        sendEmail: jest.fn().mockImplementation((email, title, text) => {
            return {
                email,
                title,
                text
            }
        })
    };
    const mocksSubscriptionTypesService = {
        getSubscriptionTypeByType: jest.fn().mockImplementation((type) => {
            return gDto.generateSubscriptionTypeDto(type)
        })
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
                    name: '123'
                }
            }
        }),
        deleteSubscription: jest.fn().mockImplementation((subscription) => {
            return subscription;
        })
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: PostgreSQLPrismaService, useValue: mocksPostgreSQLPrismaService },
                { provide: RolesService, useValue: mocksRolesService },
                { provide: LogsService, useValue: mocksLogsService },
                { provide: UsersService, useValue: mocksUsersService },
                { provide: TokensService, useValue: mocksTokensService },
                { provide: ActivationLinksService, useValue: mocksActivationLinksService },
                { provide: ResetPasswordsService, useValue: mocksResetPasswordsService },
                { provide: MailTransporterService, useValue: mocksMailTransporterService },
                { provide: SubscriptionTypesService, useValue: mocksSubscriptionTypesService },
                { provide: SubscriptionsService, useValue: mocksSubscriptionsService },
            ]
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should register a user', async () => {
        const dto = {
            email: 'null',
            firstname: 'firstname',
            lastname: 'lastname',
            password: 'password'
        }
        expect(await service.register(dto)).toEqual({
            message: expect.any(String)
        })
    });

    it(`should validate user's subscription`, async () => {
        const user = gDto.generateUserDto();
        expect(await service.validateSubscriptionExpires(user)).toEqual(true);
    });
    it(`should login the user`, async () => {
        const dto = {
            email: 'email',
            password: '123'
        }
        expect(await service.login(dto)).toMatchObject({
            token: expect.any(String)
        });
    });
    it(`should auth the user`, async () => {
        expect(await service.auth(mocksRequest)).toMatchObject({
            token: expect.any(String)
        });
    });
    it(`should logout`, async () => {
        expect(await service.logout(mocksRequest)).toMatchObject({
            message: expect.any(String)
        });
    });
    it(`should send the forgot pass request`, async () => {
        const dto = {
            email: 'email'
        }
        expect(await service.forgotPass(dto)).toMatchObject({
            message: expect.any(String)
        });
    });
    it(`should reset user's password`, async () => {
        const dto = {
            password: '123'
        }
        const userId = '123';
        const token = 'token';
        expect(await service.resetPass(dto, userId, token)).toMatchObject({
            message: expect.any(String)
        });
    });
    it(`should accept the reset password request`, async () => {
        const resetPasswordId = '123';
        expect(await service.resetPassAccept(resetPasswordId, mocksRequest)).toMatchObject({
            message: expect.any(String)
        });
    });
    it(`should create a reset password link`, async () => {
        const resetPasswordId = '123';
        const value = '123';
        expect(await service.createResetPasswordLink(resetPasswordId, value)).toEqual(expect.any(String));
    });
})