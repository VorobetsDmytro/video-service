import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { LogsModule } from '../logs/logs.module';
import { MailTransporterModule } from '../mail-transporter/mail-transporter.module';
import { RolesModule } from '../roles/roles.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TokensModule } from '../tokens/tokens.module';
import { UsersModule } from '../users/users.module';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';

@Module({
  controllers: [ProfilesController],
  providers: [ProfilesService],
  imports: [
    DbModule,
    UsersModule,
    TokensModule,
    RolesModule,
    MailTransporterModule,
    SubscriptionsModule,
    LogsModule
  ],
  exports: [
    ProfilesService
  ]
})
export class ProfilesModule {}
