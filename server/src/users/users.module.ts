import { Module, forwardRef } from '@nestjs/common';
import { BansModule } from '../bans/bans.module';
import { DbModule } from '../db/db.module';
import { LogsModule } from '../logs/logs.module';
import { RolesModule } from '../roles/roles.module';
import { TokensModule } from '../tokens/tokens.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService
  ],
  imports: [
    DbModule,
    RolesModule,
    LogsModule,
    TokensModule,
    forwardRef(() => BansModule)
  ],
  exports: [
    UsersService
  ]
})
export class UsersModule {}
