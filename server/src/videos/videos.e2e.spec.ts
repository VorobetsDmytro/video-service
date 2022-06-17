import { HttpAdapterHost } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundExceptionFilter } from "../filters/not-found-exception.filter";
import { AppModule } from "../app.module";
import { ValidationPipe } from "@nestjs/common";
import * as path from 'path';
import { RegisterUserDto } from "../auth/dto/register-user.dto";
import { UsersService } from "../users/users.service";
import { RolesService } from "../roles/roles.service";
import { TokensService } from "../tokens/tokens.service";
import { GeneratorDto } from "../generators/generate-dto";
import { RoleTypes } from "../roles/roles.type";
import { Role, User, Video } from "../../prisma/PostgreSQL/generated/client";
import * as supertest from "supertest";
import { VideosService } from "./videos.service";

describe('Video', () => {
    const gDto = new GeneratorDto('video');
    let app: NestExpressApplication;
    let httpServer;
    let usersService: UsersService;
    let tokensService: TokensService;
    let rolesService: RolesService;
    let videosService: VideosService;
    let adminToken: string;
    let subscriberToken: string;
    const createUser = async (userDto: RegisterUserDto, role: string): Promise<[string, User, Role]> => {
        const userRole = await rolesService.getRoleByValue(role);
        const userId = await usersService.generateUserId();
        let user = await usersService.createUser({...userDto, id: userId});
        user = await rolesService.setRoleToUser(userRole!, user!);
        const token = await tokensService.generateToken(user!);
        await tokensService.saveToken(user.id, token);
        return [token, user, userRole!];
    }
    beforeAll(async () => {
        jest.setTimeout(60000);
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                AppModule
            ]
        }).compile();
        usersService = module.get<UsersService>(UsersService);
        tokensService = module.get<TokensService>(TokensService);
        rolesService = module.get<RolesService>(RolesService);
        videosService = module.get<VideosService>(VideosService);
        app = module.createNestApplication<NestExpressApplication>();
        const httpAdapter = app.get(HttpAdapterHost);
        app.useGlobalFilters(new NotFoundExceptionFilter(httpAdapter));
        app.useGlobalPipes(new ValidationPipe);
        app.useStaticAssets(path.resolve(process.env.STATIC_PATH || 'static_path'));
        await app.init();
        httpServer = app.getHttpServer();
        [subscriberToken] = await createUser(gDto.generateUserDto(), RoleTypes.SUBSCRIBER);
        [adminToken] = await createUser(gDto.generateUserDto(), RoleTypes.ADMIN);
    });
    afterAll(async () => {
        await app.close();
    });
    describe('Get all the video', () => {
        it('should return all the video', async () => {
            const {body} = await supertest(httpServer)
                .get('/videos')
                .set("authorization", `Bearer ${adminToken}`)
                .expect(200)
            expect(body).toMatchObject({
                videos: expect.any(Array<Video>)
            });
        });
        it('should return the 401 status code', async () => {
            await supertest(httpServer)
                .get('/videos')
                .expect(401)
        });
    });
    describe('Add the video', () => {
        it('should add the video', async () => {
            const dto = gDto.generateVideoDto('', path.resolve(__dirname, './forTest.mp4'));
            const {body} = await supertest(httpServer)
                .post('/videos')
                .send(dto)
                .set("authorization", `Bearer ${adminToken}`)
                .expect(201)
            expect(body).toMatchObject({
                video: {
                    videoPath: dto.videoPath
                },
                message: expect.any(String)
            });
        });
        it('should return the 400 status code', async () => {
            await supertest(httpServer)
                .post('/videos')
                .set("authorization", `Bearer ${adminToken}`)
                .expect(400)
        });
        it('should return the 403 status code', async () => {
            const dto = gDto.generateVideoDto('', path.resolve(__dirname, './forTest.mp4'));
            await supertest(httpServer)
                .post('/videos')
                .send(dto)
                .set("authorization", `Bearer ${subscriberToken}`)
                .expect(403)
        });
        it('should return the 401 status code', async () => {
            const dto = gDto.generateVideoDto('', path.resolve(__dirname, './forTest.mp4'));
            await supertest(httpServer)
                .post('/videos')
                .send(dto)
                .expect(401)
        });
    });
    describe('Get the video by id', () => {
        it('should add the video', async () => {
            const dto = gDto.generateVideoDto('', path.resolve(__dirname, './forTest.mp4'));
            const video = await videosService.createVideo(dto);
            const {body} = await supertest(httpServer)
                .get(`/videos/${video.id}`)
                .set("authorization", `Bearer ${adminToken}`)
                .expect(200)
            expect(body).toMatchObject({
                video: {
                    id: video.id
                },
                canWatchVideo: expect.any(Boolean),
                canAddComments: expect.any(Boolean)
            });
        });
        it('should return the 400 status code', async () => {
            const dto = gDto.generateVideoDto('', path.resolve(__dirname, './forTest.mp4'));
            const video = await videosService.createVideo(dto);
            await supertest(httpServer)
                .get(`/videos/${video.id}`)
                .set("authorization", `Bearer ${subscriberToken}`)
                .expect(400)
        });
        it('should return the 401 status code', async () => {
            const dto = gDto.generateVideoDto('', path.resolve(__dirname, './forTest.mp4'));
            const video = await videosService.createVideo(dto);
            await supertest(httpServer)
                .get(`/videos/${video.id}`)
                .expect(401)
        });
    });
    describe('Watch the video', () => {
        it('should return the video chunk', async () => {
            const dto = gDto.generateVideoDto('', path.resolve(__dirname, './forTest.mp4'));
            const video = await videosService.createVideo(dto);
            await supertest(httpServer)
                .get(`/videos/watch/${video.id}`)
                .set("authorization", `Bearer ${adminToken}`)
                .set('range', 'bytes=0-')
                .expect(206);
        });
        it('should returnt the 400 status code', async () => {
            await supertest(httpServer)
                .get(`/videos/watch/132`)
                .set("authorization", `Bearer ${adminToken}`)
                .set('range', 'bytes=0-')
                .expect(400);
        });
        it('should returnt the 401 status code', async () => {
            const dto = gDto.generateVideoDto('', path.resolve(__dirname, './forTest.mp4'));
            const video = await videosService.createVideo(dto);
            await supertest(httpServer)
                .get(`/videos/watch/${video.id}`)
                .set('range', 'bytes=0-')
                .expect(401);
        });
    });
    describe('Download the video', () => {
        it('should return the video chunk', async () => {
            const dto = gDto.generateVideoDto('', path.resolve(__dirname, './forTest.mp4'));
            const video = await videosService.createVideo(dto);
            await supertest(httpServer)
                .get(`/videos/download/${video.id}`)
                .set("authorization", `Bearer ${adminToken}`)
                .set('range', 'bytes=0-')
                .expect(206);
        });
        it('should returnt the 400 status code', async () => {
            await supertest(httpServer)
                .get(`/videos/download/132`)
                .set("authorization", `Bearer ${adminToken}`)
                .set('range', 'bytes=0-')
                .expect(400);
        });
        it('should returnt the 401 status code', async () => {
            const dto = gDto.generateVideoDto('', path.resolve(__dirname, './forTest.mp4'));
            const video = await videosService.createVideo(dto);
            await supertest(httpServer)
                .get(`/videos/download/${video.id}`)
                .set('range', 'bytes=0-')
                .expect(401);
        });
    });
    describe('Edit the video', () => {
        it('should edit the video', async () => {
            const dtoVideo = gDto.generateVideoDto('', path.resolve(__dirname, './forTest.mp4'));
            const video = await videosService.createVideo(dtoVideo);
            const dto = {
                title: 'newtitle'
            }
            const {body} = await supertest(httpServer)
                .patch(`/videos/${video.id}`)
                .send(dto)
                .set("authorization", `Bearer ${adminToken}`)
                .expect(200);
            expect(body).toMatchObject({
                video: {
                    id: video.id,
                    title: dto.title
                },
                message: expect.any(String)
            });
        });
        it('should return the 403 status code', async () => {
            const dtoVideo = gDto.generateVideoDto('', path.resolve(__dirname, './forTest.mp4'));
            const video = await videosService.createVideo(dtoVideo);
            await supertest(httpServer)
                .patch(`/videos/${video.id}`)
                .set("authorization", `Bearer ${subscriberToken}`)
                .expect(403);
        });
        it('should return the 401 status code', async () => {
            const dtoVideo = gDto.generateVideoDto('', path.resolve(__dirname, './forTest.mp4'));
            const video = await videosService.createVideo(dtoVideo);
            await supertest(httpServer)
                .patch(`/videos/${video.id}`)
                .expect(401);
        });
    });
    describe('Delete the video', () => {
        it('should delete the video', async () => {
            const dtoVideo = gDto.generateVideoDto('', '');
            const video = await videosService.createVideo(dtoVideo);
            const {body} = await supertest(httpServer)
                .delete(`/videos/${video.id}`)
                .set("authorization", `Bearer ${adminToken}`)
                .expect(200);
            expect(body).toMatchObject({
                message: expect.any(String)
            });
        });
        it('should return the 403 status code', async () => {
            const dtoVideo = gDto.generateVideoDto('', '');
            const video = await videosService.createVideo(dtoVideo);
            await supertest(httpServer)
                .delete(`/videos/${video.id}`)
                .set("authorization", `Bearer ${subscriberToken}`)
                .expect(403);
        });
        it('should return the 401 status code', async () => {
            const dtoVideo = gDto.generateVideoDto('', '');
            const video = await videosService.createVideo(dtoVideo);
            await supertest(httpServer)
                .delete(`/videos/${video.id}`)
                .expect(401);
        });
    });
});