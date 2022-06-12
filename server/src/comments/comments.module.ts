import { Module, forwardRef } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { LogsModule } from '../logs/logs.module';
import { RolesModule } from '../roles/roles.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TokensModule } from '../tokens/tokens.module';
import { UsersModule } from '../users/users.module';
import { VideosModule } from '../videos/videos.module';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

@Module({
  controllers: [CommentsController],
  providers: [CommentsService],
  imports: [
    DbModule,
    TokensModule,
    UsersModule,
    forwardRef(() => VideosModule),
    SubscriptionsModule,
    RolesModule,
    LogsModule
  ],
  exports: [
    CommentsService
  ]
})
export class CommentsModule {}
