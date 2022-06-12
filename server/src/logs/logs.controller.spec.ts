import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing'
import { GeneratorDto } from '../generators/generate-dto';
import { Log } from '../../prisma/MongoDB/generated/client';
import { DbModule } from '../db/db.module';
import { LogsController } from "./logs.controller";
import { LogsService } from './logs.service';
import { RolesGuard } from '../guards/roles.guard';
import { IsBannedGuard } from '../guards/is-banned.guard';

describe('LogsController', () => {
    let controller: LogsController;
    const gDto = new GeneratorDto('logs');
    const logs: Log[] = [
        gDto.generateLogDto('123'),
        gDto.generateLogDto('123'),
        gDto.generateLogDto('123')
    ]
    const mockService = {
        getAll: jest.fn().mockImplementation(() => {
            return {
                id: Date.now(),
                logs
            }
        })
    }
    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [LogsController],
            providers: [
                LogsService,
                {provide: RolesGuard, useValue: jest.fn().mockImplementation(() => true)},
                {provide: IsBannedGuard, useValue: jest.fn().mockImplementation(() => true)}
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
        .overrideProvider(LogsService)
        .useValue(mockService)
        .compile();

        controller = module.get<LogsController>(LogsController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should return all the logs', () => {
        expect(controller.getAll()).toEqual({
            id: expect.any(Number),
            logs: expect.any(Array<Log>)
        });
    })
})