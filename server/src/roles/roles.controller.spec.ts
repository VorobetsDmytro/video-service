import { Test, TestingModule } from '@nestjs/testing'
import { DbModule } from '../db/db.module';
import { JwtModule } from '@nestjs/jwt';
import * as mocks from 'node-mocks-http';
import { Role } from '../../prisma/PostgreSQL/generated/client';
import { GeneratorDto } from '../generators/generate-dto';
import { RolesGuard } from '../guards/roles.guard';
import { IsBannedGuard } from '../guards/is-banned.guard';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { RoleTypes } from './roles.type';

describe('RolesController', () => {
    let controller: RolesController;
    const gDto = new GeneratorDto('roles');
    const mocksRequest = mocks.createRequest();
    const roles: Role[] = [
        gDto.generateRoleDto(RoleTypes.SUBSCRIBER),
        gDto.generateRoleDto(RoleTypes.ADMIN)
    ]
    const mockService = {
        create: jest.fn().mockImplementation((dto, req) => {
            return {
                id: Date.now(),
                role: {
                    id: dto.id
                }
            }
        }),
        getAll: jest.fn().mockImplementation((req) => {
            return {
                id: Date.now(),
                roles
            }
        }),
        delete: jest.fn().mockImplementation((value, req) => {
            return {
                id: Date.now(),
                value
            }
        })
    }
    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [RolesController],
            providers: [
                RolesService,
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
                })
            ]
        })
        .overrideProvider(RolesService)
        .useValue(mockService)
        .compile();

        controller = module.get<RolesController>(RolesController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should create a role', () => {
        const dto = gDto.generateRoleDto(RoleTypes.SUBSCRIBER);
        expect(controller.create(dto, mocksRequest)).toEqual({
            id: expect.any(Number),
            role: {
                id: dto.id
            }
        });
    });
    it('should return all the roles', () => {
        expect(controller.getAll(mocksRequest)).toEqual({
            id: expect.any(Number),
            roles: expect.any(Array<Role>)
        });
    });
    it('should delete the role', () => {
        const value = RoleTypes.SUBSCRIBER;
        expect(controller.delete(value, mocksRequest)).toEqual({
            id: expect.any(Number),
            value
        });
    });
})