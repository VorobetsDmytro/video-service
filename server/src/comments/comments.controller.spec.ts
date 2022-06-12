import { Test, TestingModule } from '@nestjs/testing'
import { DbModule } from '../db/db.module';
import { JwtModule } from '@nestjs/jwt';
import * as mocks from 'node-mocks-http';
import { GeneratorDto } from '../generators/generate-dto';
import { RolesGuard } from '../guards/roles.guard';
import { IsBannedGuard } from '../guards/is-banned.guard';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

describe('CommentsController', () => {
    let controller: CommentsController;
    const gDto = new GeneratorDto('comments');
    const mocksRequest = mocks.createRequest();
    const mockService = {
        create: jest.fn().mockImplementation((dto, req) => {
            return {
                id: Date.now(),
                comment: {
                    id: dto.id
                }
            }
        }),
        delete: jest.fn().mockImplementation((commentId, req) => {
            return {
                id: Date.now(),
                commentId
            }
        }),
    }
    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [CommentsController],
            providers: [
                CommentsService,
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
        .overrideProvider(CommentsService)
        .useValue(mockService)
        .compile();

        controller = module.get<CommentsController>(CommentsController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should create a comment', () => {
        const comment = gDto.generateCommentDto('123', '123');
        expect(controller.create(comment, mocksRequest)).toEqual({
            id: expect.any(Number),
            comment: {
                id: comment.id
            }
        });
    });
    it('should delete the comment', () => {
        const commentId = '123';
        expect(controller.delete(commentId, mocksRequest)).toEqual({
            id: expect.any(Number),
            commentId
        });
    });
})