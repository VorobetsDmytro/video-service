import { Module } from '@nestjs/common';
import { CreditCardsModule } from '../credit-cards/credit-cards.module';
import { DbModule } from '../db/db.module';
import { LogsModule } from '../logs/logs.module';
import { SubscriptionTypesModule } from '../subscription-types/subscription-types.module';
import { TokensModule } from '../tokens/tokens.module';
import { UsersModule } from '../users/users.module';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  imports: [
    DbModule,
    UsersModule,
    SubscriptionTypesModule,
    CreditCardsModule,
    TokensModule,
    LogsModule
  ],
  exports: [
    SubscriptionsService
  ]
})
export class SubscriptionsModule {}
