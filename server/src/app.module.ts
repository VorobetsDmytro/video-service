import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TokensModule } from './tokens/tokens.module';
import { DbModule } from './db/db.module';
import { ActivationLinkModule } from './activation-links/activation-link.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { RolesModule } from './roles/roles.module';
import { LogsModule } from './logs/logs.module';
import { ResetPasswordsModule } from './reset-passwords/reset-passwords.module';
import { ProfilesModule } from './profiles/profiles.module';
import { MailTransporterModule } from './mail-transporter/mail-transporter.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { SubscriptionTypesModule } from './subscription-types/subscription-types.module';
import { CreditCardsModule } from './credit-cards/credit-cards.module';
import { BansModule } from './bans/bans.module';
import { VideosModule } from './videos/videos.module';
import { SocketsGateway } from './sockets/sockets.gateway';
import { CommentsModule } from './comments/comments.module';

@Module({
  controllers: [],
  providers: [SocketsGateway],
  imports: [
    ConfigModule.forRoot({
      envFilePath: process.env.ENV_FILE || '.env'
    }),
    MailerModule.forRoot({
      transport: {
        host: process.env.EMAIL_HOST || 'host',
        port: process.env.EMAIL_PORT || 587,
        auth: {
          user: process.env.EMAIL_USER || 'user',
          pass: process.env.EMAIL_PASS || 'pass',
        },
      },
      defaults: {
        from: `Email helper <${process.env.EMAIL_USER || 'user'}>`,
      }
    }),
    UsersModule,
    AuthModule,
    TokensModule,
    DbModule,
    ActivationLinkModule,
    RolesModule,
    LogsModule,
    ResetPasswordsModule,
    ProfilesModule,
    MailTransporterModule,
    SubscriptionsModule,
    SubscriptionTypesModule,
    CreditCardsModule,
    BansModule,
    VideosModule,
    CommentsModule
  ]
})
export class AppModule {}
