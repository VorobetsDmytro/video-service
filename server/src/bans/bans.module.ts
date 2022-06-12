import { Module, forwardRef } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { LogsModule } from '../logs/logs.module';
import { TokensModule } from '../tokens/tokens.module';
import { UsersModule } from '../users/users.module';
import { BansController } from './bans.controller';
import { BansService } from './bans.service';

@Module({
  controllers: [BansController],
  providers: [BansService],
  imports: [
    DbModule,
    forwardRef(() => UsersModule),
    TokensModule,
    LogsModule
  ],
  exports: [
    BansService
  ]
})
export class BansModule {}
