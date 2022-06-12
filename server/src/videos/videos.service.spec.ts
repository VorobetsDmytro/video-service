import { Test, TestingModule } from "@nestjs/testing";
import { RolesService } from "../roles/roles.service";
import { PostgreSQLPrismaService } from "../db/postgreSQL.prisma.service";
import { LogsService } from "../logs/logs.service";
import { GeneratorDto } from "../generators/generate-dto";
import * as mocks from 'node-mocks-http';
import { UsersService } from "../users/users.service";
import { RoleTypes } from "../roles/roles.type";
import { SubscriptionsService } from "../subscriptions/subscriptions.service";
import { VideosService } from "./videos.service";
import { CommentsService } from "../comments/comments.service";
import * as path from "path";
import { Video } from "../../prisma/PostgreSQL/generated/client";

describe('VideosService', () => {
    let service: VideosService;
    const gDto = new GeneratorDto('video');
    const mocksRequest = mocks.createRequest();
    const videos: Video[] = [
        gDto.generateVideoDto('123', '123'),
        gDto.generateVideoDto('123', '123'),
        gDto.generateVideoDto('123', '123')
    ]
    mocksRequest.user = {
        id: '123',
        email: 'email',
        role: 'role'
    }
    mocksRequest.headers.range = 'bytes=0-1000'
    mocksRequest.res = mocks.createResponse();

    const mocksPostgreSQLPrismaService = {
        video: {
            create: jest.fn().mockImplementation((dto) => {
                return {
                    ...gDto.generateVideoDto('123', path.resolve(__dirname, 'forTest.mp4')),
                    ...dto.data
                }
            }),
            findFirst: jest.fn().mockImplementation((dto) => {
                return null
            }),
            delete: jest.fn().mockImplementation((dto) => {
                return dto.where
            }),
            findMany: jest.fn().mockImplementation(() => {
                return videos
            }),
            findUnique: jest.fn().mockImplementation((dto) => {
                if(dto.where.id.length === 36)
                    return null;
                return {
                    ...gDto.generateVideoDto('123', dto.where.id === 'null' ? '132' : path.resolve(__dirname, 'forTest.mp4')),
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
        }
    };
    const mocksRolesService = {
        getRoleByValue: jest.fn().mockImplementation((role) => {
            return {
                id: '123',
                value: RoleTypes.ADMIN
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
    const mocksCommentsService = {
        deleteCommentsByVideoId: jest.fn().mockImplementation((videoId) => {
            return [{videoId}]
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
                VideosService,
                { provide: PostgreSQLPrismaService, useValue: mocksPostgreSQLPrismaService },
                { provide: RolesService, useValue: mocksRolesService },
                { provide: LogsService, useValue: mocksLogsService },
                { provide: UsersService, useValue: mocksUsersService },
                { provide: CommentsService, useValue: mocksCommentsService },
                { provide: SubscriptionsService, useValue: mocksSubscriptionsService }
            ]
        }).compile();

        service = module.get<VideosService>(VideosService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should add the video', async () => {
        const dto = gDto.generateVideoDto('', path.resolve(__dirname, 'forTest.mp4'));
        expect(await service.addVideo(dto, mocksRequest)).toMatchObject({
            video: {
                previewPath: dto.previewPath,
                videoPath: dto.videoPath
            },
            message: expect.any(String)
        });
    });
    it('should edit the video', async () => {
        const dto = {
            title: 'title'
        }
        const videoId = '123';
        expect(await service.edit(dto, videoId, mocksRequest)).toMatchObject({
            video: {
                id: videoId,
                title: dto.title
            },
            message: expect.any(String)
        });
    });
    it('should delete the video', async () => {
        const videoId = 'null';
        expect(await service.delete(videoId, mocksRequest)).toMatchObject({
            message: expect.any(String)
        });
    });
    it('should delete the video', async () => {
        const dto = gDto.generateVideoDto('123', '123');
        expect(await service.deleteVideo(dto)).toMatchObject({
            id: dto.id
        });
    });
    it('should create a video', async () => {
        const dto = gDto.generateVideoDto('123', '123');
        expect(await service.createVideo(dto)).toMatchObject({
            ...dto
        });
    });
    it('should return the video by id', async () => {
        const videoId = '123';
        expect(await service.getById(videoId, mocksRequest)).toMatchObject({
            video: {
                id: videoId
            },
            canWatchVideo: expect.any(Boolean),
            canAddComments: expect.any(Boolean),
        });
    });
    it('should send the video chunk', async () => {
        const videoId = '123';
        expect(await service.watch(videoId, mocksRequest, mocksRequest.res));
    });
    it('should send the video chunk', async () => {
        const videoId = '123';
        expect(await service.download(videoId, mocksRequest, mocksRequest.res));
    });
    it('should send the video chunk', () => {
        const dto = gDto.generateVideoDto('', path.resolve(__dirname, 'forTest.mp4'));
        expect(service.sendVideoChunk(dto, mocksRequest, mocksRequest.res));
    });
    it('should update the video', async () => {
        const dto = gDto.generateVideoDto('123', '123');
        expect(await service.updateVideo(dto, dto)).toMatchObject({
            ...dto
        })
    });
    it('should return the video by id', async () => {
        const id = '123';
        expect(await service.getVideoById(id)).toMatchObject({
            id
        })
    });
    it(`should return the video's id`, async () => {
        expect(await service.generateVideoId()).toEqual(expect.any(String));
    });
})