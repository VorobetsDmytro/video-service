import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { LogsModule } from '../logs/logs.module';
import { TokensModule } from '../tokens/tokens.module';
import { UsersModule } from '../users/users.module';
import { ResetPasswordsController } from './reset-passwords.controller';
import { ResetPasswordsService } from './reset-passwords.service';

@Module({
  controllers: [ResetPasswordsController],
  providers: [ResetPasswordsService],
  imports: [
    DbModule,
    LogsModule,
    TokensModule,
    UsersModule
  ],
  exports: [
    ResetPasswordsService
  ]
})
export class ResetPasswordsModule {}
