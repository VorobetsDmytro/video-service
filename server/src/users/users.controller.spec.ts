import { Test, TestingModule } from '@nestjs/testing'
import { DbModule } from '../db/db.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtModule } from '@nestjs/jwt';
import * as mocks from 'node-mocks-http';
import { User } from '../../prisma/PostgreSQL/generated/client';
import { GeneratorDto } from '../generators/generate-dto';
import { RolesGuard } from '../guards/roles.guard';
import { IsBannedGuard } from '../guards/is-banned.guard';

describe('UsersController', () => {
    let controller: UsersController;
    const gDto = new GeneratorDto('users');
    const mocksRequest = mocks.createRequest();
    const users: User[] = [
        gDto.generateUserDto(),
        gDto.generateUserDto(),
        gDto.generateUserDto()
    ]
    const mockService = {
        getAll: jest.fn().mockImplementation(req => {
            return {
                id: Date.now(),
                users
            }
        })
    }
    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [UsersController],
            providers: [
                UsersService,
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
        .overrideProvider(UsersService)
        .useValue(mockService)
        .compile();

        controller = module.get<UsersController>(UsersController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should return all the users', () => {
        expect(controller.getAll(mocksRequest)).toEqual({
            id: expect.any(Number),
            users: expect.any(Array<User>)
        });
    });
})