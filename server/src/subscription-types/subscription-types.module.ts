import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { LogsModule } from '../logs/logs.module';
import { TokensModule } from '../tokens/tokens.module';
import { UsersModule } from '../users/users.module';
import { SubscriptionTypesController } from './subscription-types.controller';
import { SubscriptionTypesService } from './subscription-types.service';

@Module({
  controllers: [SubscriptionTypesController],
  providers: [SubscriptionTypesService],
  imports: [
    DbModule,
    TokensModule,
    LogsModule,
    UsersModule
  ],
  exports: [
    SubscriptionTypesService
  ]
})
export class SubscriptionTypesModule {}
