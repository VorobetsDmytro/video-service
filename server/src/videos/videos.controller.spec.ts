import { Test, TestingModule } from '@nestjs/testing'
import { DbModule } from '../db/db.module';
import { JwtModule } from '@nestjs/jwt';
import * as mocks from 'node-mocks-http';
import { Video } from '../../prisma/PostgreSQL/generated/client';
import { GeneratorDto } from '../generators/generate-dto';
import { RolesGuard } from '../guards/roles.guard';
import { IsBannedGuard } from '../guards/is-banned.guard';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';

describe('VideosController', () => {
    let controller: VideosController;
    const gDto = new GeneratorDto('video');
    const mocksRequest = mocks.createRequest();
    mocksRequest.res = mocks.createResponse();
    const message = 'message';
    const videos: Video[] = [
        gDto.generateVideoDto('123', '123'),
        gDto.generateVideoDto('123', '123'),
        gDto.generateVideoDto('123', '123')
    ]
    const mockService = {
        addVideo: jest.fn().mockImplementation((dto, req) => {
            return {
                id: Date.now(),
                video: {
                    id: dto.id
                },
                message
            }
        }),
        getAll: jest.fn().mockImplementation((req) => {
            return {
                id: Date.now(),
                videos
            }
        }),
        getById: jest.fn().mockImplementation((videoId, req) => {
            return {
                id: Date.now(),
                video: {
                    id: videoId
                },
                canWatchVideo: true,
                canAddComments: true
            }
        }),
        watch: jest.fn().mockImplementation((videoId, req, res) => {
            return {
                id: Date.now(),
                blob: {}
            }
        }),
        download: jest.fn().mockImplementation((videoId, req, res) => {
            return {
                id: Date.now(),
                blob: {}
            }
        }),
        edit: jest.fn().mockImplementation((dto, videoId, req) => {
            return {
                id: Date.now(),
                video: {
                    id: videoId
                },
                message
            }
        }),
        delete: jest.fn().mockImplementation((videoId, req) => {
            return {
                id: Date.now(),
                message
            }
        }),
    }
    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [VideosController],
            providers: [
                VideosService,
                {provide: RolesGuard, useValue: jest.fn().mockImplementation(() => true)},
                {provide: IsBannedGuard, useValue: jest.fn().mockImplementation(() => true)},
            ],
            imports: [
                DbModule,
                JwtModule.register({
                    secret: process.env.JWT_SECRET || 'jwtsecret',
                    signOptions: {
                      expiresIn: '1h'
                    }
                }),
            ]
        })
        .overrideProvider(VideosService)
        .useValue(mockService)
        .compile();

        controller = module.get<VideosController>(VideosController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should add the video', () => {
        const dto = gDto.generateVideoDto('123', '1332');
        expect(controller.addVideo(dto, mocksRequest)).toEqual({
            id: expect.any(Number),
            video: {
                id: dto.id
            },
            message
        });
    });
    it('should return all the video', () => {
        expect(controller.getAll(mocksRequest)).toEqual({
            id: expect.any(Number),
            videos: expect.any(Array<Video>)
        });
    });
    it('should return the video by id', () => {
        const videoId = '123'
        expect(controller.getById(videoId, mocksRequest)).toEqual({
            id: expect.any(Number),
            video: {
                id: videoId
            },
            canWatchVideo: expect.any(Boolean),
            canAddComments: expect.any(Boolean)
        });
    });
    it('should return the blob of video', () => {
        const videoId = '123'
        expect(controller.watch(videoId, mocksRequest, mocksRequest.res)).toEqual({
            id: expect.any(Number),
            blob: expect.any(Object)
        });
    });
    it('should return the blob of video', () => {
        const videoId = '123'
        expect(controller.download(videoId, mocksRequest, mocksRequest.res)).toEqual({
            id: expect.any(Number),
            blob: expect.any(Object)
        });
    });
    it('should return the changed video', () => {
        const videoId = '123'
        const dto = {
            title: 'title',
            previewPath: 'prew'
        }
        expect(controller.edit(dto, videoId, mocksRequest)).toEqual({
            id: expect.any(Number),
            video: {
                id: videoId
            },
            message
        });
    });
    it('should delete the video', () => {
        const videoId = '123'
        expect(controller.delete(videoId, mocksRequest)).toEqual({
            id: expect.any(Number),
            message
        });
    });
})