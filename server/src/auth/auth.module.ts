import { Module } from '@nestjs/common';
import { TokensModule } from '../tokens/tokens.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { DbModule } from '../db/db.module';
import { ActivationLinkModule } from '../activation-links/activation-link.module';
import { LogsModule } from '../logs/logs.module';
import { ResetPasswordsModule } from '../reset-passwords/reset-passwords.module';
import { MailTransporterModule } from '../mail-transporter/mail-transporter.module';
import { SubscriptionTypesModule } from '../subscription-types/subscription-types.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { RolesModule } from '../roles/roles.module';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService
  ],
  imports: [
    DbModule,
    UsersModule,
    TokensModule,
    ActivationLinkModule,
    LogsModule,
    ResetPasswordsModule,
    MailTransporterModule,
    SubscriptionTypesModule,
    SubscriptionsModule,
    RolesModule
  ]
})
export class AuthModule {}
