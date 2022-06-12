import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { ActivationLinksService } from './activation-links.service';
import { ActivationLinksController } from './activation-links.controller';
import { TokensModule } from '../tokens/tokens.module';
import { LogsModule } from '../logs/logs.module';
import { UsersModule } from '../users/users.module';

@Module({
  providers: [ActivationLinksService],
  imports: [
    DbModule,
    TokensModule,
    LogsModule,
    UsersModule
  ],
  exports: [
    ActivationLinksService
  ],
  controllers: [ActivationLinksController]
})
export class ActivationLinkModule {}
