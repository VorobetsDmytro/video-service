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
import { Role, User } from "../../prisma/PostgreSQL/generated/client";
import * as supertest from "supertest";
import { VideosService } from "../videos/videos.service";
import { CommentsService } from "./comments.service";

describe('Comments', () => {
    const gDto = new GeneratorDto('comments');
    let app: NestExpressApplication;
    let httpServer;
    let usersService: UsersService;
    let tokensService: TokensService;
    let rolesService: RolesService;
    let videosService: VideosService;
    let commentsService: CommentsService;
    let admin: User;
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
        commentsService = module.get<CommentsService>(CommentsService);
        app = module.createNestApplication<NestExpressApplication>();
        const httpAdapter = app.get(HttpAdapterHost);
        app.useGlobalFilters(new NotFoundExceptionFilter(httpAdapter));
        app.useGlobalPipes(new ValidationPipe);
        app.useStaticAssets(path.resolve(process.env.STATIC_PATH || 'static_path'));
        await app.init();
        httpServer = app.getHttpServer();
        [subscriberToken] = await createUser(gDto.generateUserDto(), RoleTypes.SUBSCRIBER);
        [adminToken, admin] = await createUser(gDto.generateUserDto(), RoleTypes.ADMIN);
    });
    afterAll(async () => {
        await app.close();
    });
    describe('Create a comment', () => {
        it('should create a comment', async () => {
            const video = await videosService.createVideo(gDto.generateVideoDto('', ''));
            const dto = {
                videoId: video.id,
                text: '123'
            }
            const {body} = await supertest(httpServer)
                .post('/comments/')
                .send(dto)
                .set("authorization", `Bearer ${adminToken}`)
                .expect(201)
            expect(body).toMatchObject({
                comment: {
                    ...dto
                }
            })
        });
        it('should return the 400 status code', async () => {
            const video = await videosService.createVideo(gDto.generateVideoDto('', ''));
            await supertest(httpServer)
                .post('/comments/')
                .set("authorization", `Bearer ${adminToken}`)
                .expect(400)
        });
        it('should return the 401 status code', async () => {
            const video = await videosService.createVideo(gDto.generateVideoDto('', ''));
            const dto = {
                videoId: video.id,
                text: '123'
            }
            await supertest(httpServer)
                .post('/comments/')
                .send(dto)
                .expect(401)
        });
    });
    describe('Delete the comment', () => {
        it('should delete the comment', async () => {
            const video = await videosService.createVideo(gDto.generateVideoDto('', ''));
            const comment = await commentsService.createComment(gDto.generateCommentDto(admin.id, video.id));
            const {body} = await supertest(httpServer)
                .delete(`/comments/${comment.id}`)
                .set("authorization", `Bearer ${adminToken}`)
                .expect(200)
            expect(body).toMatchObject({
                comment: {
                    id: comment.id
                }
            })
        });
        it('should return the 404 status code', async () => {
            const video = await videosService.createVideo(gDto.generateVideoDto('', ''));
            const comment = await commentsService.createComment(gDto.generateCommentDto(admin.id, video.id));
            await supertest(httpServer)
                .delete(`/comments/${comment.id}`)
                .set("authorization", `Bearer ${subscriberToken}`)
                .expect(404)
        });
        it('should return the 401 status code', async () => {
            const video = await videosService.createVideo(gDto.generateVideoDto('', ''));
            const comment = await commentsService.createComment(gDto.generateCommentDto(admin.id, video.id));
            await supertest(httpServer)
                .delete(`/comments/${comment.id}`)
                .expect(401)
        });
    });
});