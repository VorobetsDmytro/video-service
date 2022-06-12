import { Module, forwardRef } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { LogsModule } from '../logs/logs.module';
import { TokensModule } from '../tokens/tokens.module';
import { UsersModule } from '../users/users.module';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';

@Module({
  controllers: [RolesController],
  providers: [RolesService],
  imports: [
    DbModule,
    LogsModule,
    forwardRef(() => TokensModule),
    forwardRef(() => UsersModule)
  ],
  exports: [
    RolesService
  ]
})
export class RolesModule {}
