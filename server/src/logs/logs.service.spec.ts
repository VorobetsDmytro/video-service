import { Test, TestingModule } from "@nestjs/testing";
import { Log } from "../../prisma/MongoDB/generated/client";
import { GeneratorDto } from "../generators/generate-dto";
import { MongoDBPrismaService } from "../db/mongoDB.prisma.service";
import { LogsService } from "./logs.service"

describe('LogsService', () => {
    let service: LogsService;
    const gDto = new GeneratorDto('logs');
    const logs: Log[] = [
        gDto.generateLogDto('123'),
        gDto.generateLogDto('123'),
        gDto.generateLogDto('123')
    ]

    const mocksMongoDBPrismaService = {
        log: {
            findMany: jest.fn().mockImplementation(() => {
                return {
                    logs
                }
            }),
            create: jest.fn().mockImplementation((dto) => {
                return dto.data
            }),
        }
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LogsService,
                { provide: MongoDBPrismaService, useValue: mocksMongoDBPrismaService }
            ]
        }).compile();

        service = module.get<LogsService>(LogsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should return all the logs', async () => {
        expect(await service.getAll()).toEqual({
            logs: expect.any(Array<Log>)
        })
    });
    it('should create a log', async () => {
        const dto = gDto.generateLogDto('123');
        expect(await service.create(dto)).toMatchObject({
            id: dto.id
        })
    });
})