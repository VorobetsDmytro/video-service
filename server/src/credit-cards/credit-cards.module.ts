import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { LogsModule } from '../logs/logs.module';
import { TokensModule } from '../tokens/tokens.module';
import { UsersModule } from '../users/users.module';
import { CreditCardsController } from './credit-cards.controller';
import { CreditCardsService } from './credit-cards.service';

@Module({
  controllers: [CreditCardsController],
  providers: [CreditCardsService],
  imports: [
    DbModule,
    TokensModule,
    UsersModule,
    LogsModule
  ],
  exports: [
    CreditCardsService
  ]
})
export class CreditCardsModule {}
