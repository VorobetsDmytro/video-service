import { Injectable } from '@nestjs/common';
import { MongoDBPrismaService } from '../db/mongoDB.prisma.service';
import { Log, Prisma } from '../../prisma/MongoDB/generated/client';

@Injectable()
export class LogsService {
    constructor(private mongoDBService: MongoDBPrismaService){}

    async getAll(): Promise<Log[]> {
        return this.mongoDBService.log.findMany();
    }

    async create(dto: Prisma.LogUncheckedCreateInput): Promise<Log> {
        return this.mongoDBService.log.create({data: dto});
    }
}
