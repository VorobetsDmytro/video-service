import { Test, TestingModule } from "@nestjs/testing";
import { RolesService } from "../roles/roles.service";
import { PostgreSQLPrismaService } from "../db/postgreSQL.prisma.service";
import { LogsService } from "../logs/logs.service";
import { GeneratorDto } from "../generators/generate-dto";
import * as mocks from 'node-mocks-http';
import { CommentsService } from "./comments.service";
import { VideosService } from "../videos/videos.service";
import { SubscriptionsService } from "../subscriptions/subscriptions.service";
import { UsersService } from "../users/users.service";
import { RoleTypes } from "../roles/roles.type";

describe('CommentsService', () => {
    let service: CommentsService;
    const gDto = new GeneratorDto('comments');
    const mocksRequest = mocks.createRequest();
    mocksRequest.user = {
        id: '123',
        email: 'email',
        role: 'role'
    }

    const mocksPostgreSQLPrismaService = {
        comment: {
            findUnique: jest.fn().mockImplementation((dto) => {
                if(dto.where.id.length === 36)
                    return null;
                return dto.where
            }),
            create: jest.fn().mockImplementation((dto) => {
                return {
                    ...gDto.generateCommentDto(dto.data.userId, dto.data.videoId),
                    ...dto.data
                }
            }),
            findFirst: jest.fn().mockImplementation((dto) => {
                return {
                    ...gDto.generateCommentDto(dto.where.userId ? dto.where.userId : '123', '321'),
                    id: dto.where.id
                }
            }),
            delete: jest.fn().mockImplementation((dto) => {
                return dto;
            }),
            deleteMany: jest.fn().mockImplementation((videoId) => {
                return [{...gDto.generateCommentDto('123', videoId)}];
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
    const mocksVideosService = {
        getVideoById: jest.fn().mockImplementation((videoId) => {
            return {
                ...gDto.generateVideoDto('prev', 'video'),
                id: videoId
            }
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
                    name: '123',
                    canAddComments: true
                }
            }
        }),
        deleteSubscription: jest.fn().mockImplementation((subscription) => {
            return subscription;
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
                CommentsService,
                { provide: PostgreSQLPrismaService, useValue: mocksPostgreSQLPrismaService },
                { provide: RolesService, useValue: mocksRolesService },
                { provide: LogsService, useValue: mocksLogsService },
                { provide: VideosService, useValue: mocksVideosService },
                { provide: SubscriptionsService, useValue: mocksSubscriptionsService },
                { provide: UsersService, useValue: mocksUsersService },
            ]
        }).compile();

        service = module.get<CommentsService>(CommentsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should create a comment', async () => {
        const dto = gDto.generateCommentDto('123', '123');
        expect(await service.create(dto, mocksRequest)).toMatchObject({
            comment: {
                ...dto,
                id: expect.any(String)
            }
        });
    });
    it('should delete the comment', async () => {
        const commentId = '123'
        expect(await service.delete(commentId, mocksRequest)).toMatchObject({
            comment: {
                id: commentId
            }
        });
    });
    it('should delete the comment', async () => {
        const dto = gDto.generateCommentDto('123', '321');
        expect(await service.deleteComment(dto)).toMatchObject({
            where: {
                id: dto.id
            }
        });
    });
    it('should return the comment by id', async () => {
        const id = '123';
        expect(await service.getCommentById(id)).toMatchObject({
            id
        });
    });
    it('should delete the comment by id', async () => {
        const videoId = '123';
        expect(await service.deleteCommentsByVideoId(videoId)).toEqual(expect.any(Array<Comment>))
    });
    it('should create a comment', async () => {
        const dto = gDto.generateCommentDto('123', '321');
        expect(await service.createComment(dto)).toMatchObject({
            ...dto
        })
    });
    it('should return the comment id', async () => {
        expect(await service.generateCommentId()).toEqual(expect.any(String));
    });
})