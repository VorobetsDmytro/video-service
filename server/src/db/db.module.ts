import { Module } from '@nestjs/common';
import { MongoDBPrismaService } from './mongoDB.prisma.service';
import { PostgreSQLPrismaService } from './postgreSQL.prisma.service';

@Module({
    providers: [
        MongoDBPrismaService,
        PostgreSQLPrismaService
    ],
    exports: [
        MongoDBPrismaService,
        PostgreSQLPrismaService
    ]
})
export class DbModule {}
