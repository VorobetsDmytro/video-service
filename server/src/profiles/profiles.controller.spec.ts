import { Test, TestingModule } from '@nestjs/testing'
import { DbModule } from '../db/db.module';
import { JwtModule } from '@nestjs/jwt';
import * as mocks from 'node-mocks-http';
import { GeneratorDto } from '../generators/generate-dto';
import { RolesGuard } from '../guards/roles.guard';
import { IsBannedGuard } from '../guards/is-banned.guard';
import { ChangeEmail, User } from '../../prisma/PostgreSQL/generated/client';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';

describe('ProfilesController', () => {
    let controller: ProfilesController;
    const gDto = new GeneratorDto('profiles');
    const mocksRequest = mocks.createRequest();
    const user: User = gDto.generateUserDto();
    const changeEmails: ChangeEmail[] = [
        gDto.generateChangeEmailDto('123', 'email'),
        gDto.generateChangeEmailDto('123', 'email'),
        gDto.generateChangeEmailDto('123', 'email')
    ]
    const message = 'message';
    const mockService = {
        getProfile: jest.fn().mockImplementation((req) => {
            return {
                id: Date.now(),
                user,
                subscription: {
                    userId: user.id
                }
            }
        }),
        getProfileByUserId: jest.fn().mockImplementation((userId, req) => {
            const userTemp = {...user, id: userId}
            return {
                id: Date.now(),
                user: userTemp,
                subscription: {
                    userId
                }
            }
        }),
        changeProfile: jest.fn().mockImplementation((dto, req) => {
            const userTemp = {...user, firstname: dto.firstname}
            return {
                id: Date.now(),
                user: userTemp
            }
        }),
        changeEmailAccept: jest.fn().mockImplementation((dto, changeEmailId, req) => {
            return {
                id: Date.now(),
                message
            }
        }),
        getAllChangeEmailRequests: jest.fn().mockImplementation((req) => {
            return {
                id: Date.now(),
                changeEmails
            }
        })
    }
    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ProfilesController],
            providers: [
                ProfilesService,
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
        .overrideProvider(ProfilesService)
        .useValue(mockService)
        .compile();

        controller = module.get<ProfilesController>(ProfilesController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
    it('should return the user profile', () => {
        expect(controller.getProfile(mocksRequest)).toEqual({
            id: expect.any(Number),
            user,
            subscription: {
                userId: user.id
            }
        });
    });
    it('should return the user profile by id', () => {
        const userId = '123';
        const userTemp = {...user, id: userId}
        expect(controller.getProfileByUserId(userId, mocksRequest)).toEqual({
            id: expect.any(Number),
            user: userTemp,
            subscription: {
                userId
            }
        });
    });
    it('should return the changed user profile', () => {
        const dto = {
            firstname: 'Dmitry'
        }
        const userTemp = {...user, firstname: dto.firstname}
        expect(controller.changeProfile(dto, mocksRequest)).toEqual({
            id: expect.any(Number),
            user: userTemp
        });
    });
    it('should send a change email request', () => {
        const dto = {
            email: 'test@gmail.com',
            password: 'pass'
        }
        const changeEmailId = '132';
        expect(controller.changeEmailAccept(dto, changeEmailId, mocksRequest)).toEqual({
            id: expect.any(Number),
            message
        });
    });
    it('should return all the change email requests', () => {
        expect(controller.getAllChangeEmailRequests(mocksRequest)).toEqual({
            id: expect.any(Number),
            changeEmails: expect.any(Array<ChangeEmail>)
        });
    });
})