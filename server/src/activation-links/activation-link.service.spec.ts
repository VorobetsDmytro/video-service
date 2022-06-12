import { Test, TestingModule } from "@nestjs/testing";
import { PostgreSQLPrismaService } from "../db/postgreSQL.prisma.service";
import { LogsService } from "../logs/logs.service";
import { GeneratorDto } from "../generators/generate-dto";
import * as mocks from 'node-mocks-http';
import { ActivationLinksService } from "./activation-links.service";
import { UsersService } from "../users/users.service";
import { Activationlink } from "../../prisma/PostgreSQL/generated/client";

describe('ActivationLinksService', () => {
    let service: ActivationLinksService;
    const gDto = new GeneratorDto('users');
    const mocksRequest = mocks.createRequest();
    const activationLinks: Activationlink[] = [
        gDto.generateActivationLinkDto('123', 'link'),
        gDto.generateActivationLinkDto('123', 'link'),
        gDto.generateActivationLinkDto('123', 'link')
    ]
    mocksRequest.user = {
        id: '123',
        email: 'email',
        role: 'role'
    }

    const mocksPostgreSQLPrismaService = {
        user: {
            findUnique: jest.fn().mockImplementation((dto) => {
                const user = gDto.generateUserDto();
                return {
                    ...user,
                    ...dto
                }
            }),
        },
        activationlink: {
            findFirst: jest.fn().mockImplementation((dto) => {
                return gDto.generateActivationLinkDto(dto.where.userId, dto.where.link)
            }),
            update: jest.fn().mockImplementation((dto) => {
                return dto
            }),
            findUnique: jest.fn().mockImplementation((dto) => {
                if(dto.where.link.length === 36)
                    return null;
                return dto.where
            }),
            create: jest.fn().mockImplementation((dto) => {
                return gDto.generateActivationLinkDto(dto.data.userId, dto.data.link);
            }),
            findMany: jest.fn().mockImplementation(() => {
                return activationLinks
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
                ActivationLinksService,
                { provide: PostgreSQLPrismaService, useValue: mocksPostgreSQLPrismaService },
                { provide: LogsService, useValue: mocksLogsService },
                { provide: UsersService, useValue: mocksUsersService },
            ]
        }).compile();

        service = module.get<ActivationLinksService>(ActivationLinksService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it(`should activate the user's profile`, async () => {
        const dto = {
            password: '123'
        }
        const userId = '123';
        const link = 'link';
        expect(await service.activation(dto, userId, link)).toMatchObject({
            message: expect.any(String)
        })
    });
    it(`should generate link`, async () => {
        expect(await service.generateLink()).toEqual(expect.any(String));
    });
    it(`should create an activation link url`, () => {
        const userId = '123';
        const link = 'link';
        expect(service.createActiovationLinkUrl(userId, link)).toEqual(expect.any(String));
    });
    it(`should create an activation link`, async () => {
        const dto = {
            link: 'link',
            userId: '123'
        }
        expect(await service.createActiovationLink(dto)).toMatchObject({
            link: dto.link,
            userId: dto.userId
        });
    });
    it(`should return all the activation links`, async () => {
        expect(await service.getAll(mocksRequest)).toEqual(expect.any(Array<Activationlink>));
    });
})