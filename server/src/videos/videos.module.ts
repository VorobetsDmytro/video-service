import { Module, forwardRef } from '@nestjs/common';
import { CommentsModule } from '../comments/comments.module';
import { DbModule } from '../db/db.module';
import { LogsModule } from '../logs/logs.module';
import { RolesModule } from '../roles/roles.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TokensModule } from '../tokens/tokens.module';
import { UsersModule } from '../users/users.module';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';

@Module({
  controllers: [VideosController],
  providers: [VideosService],
  imports: [
    DbModule,
    TokensModule,
    UsersModule,
    SubscriptionsModule,
    RolesModule,
    forwardRef(() => CommentsModule),
    LogsModule
  ],
  exports: [
    VideosService
  ]
})
export class VideosModule {}
