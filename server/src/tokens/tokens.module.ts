import { Module , forwardRef} from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DbModule } from '../db/db.module';
import { LogsModule } from '../logs/logs.module';
import { RolesModule } from '../roles/roles.module';
import { UsersModule } from '../users/users.module';
import { TokensController } from './tokens.controller';
import { TokensService } from './tokens.service';

@Module({
  controllers: [TokensController],
  providers: [TokensService],
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'jwtsecret',
      signOptions: {
        expiresIn: '1h'
      }
    }),
    DbModule,
    forwardRef(() => RolesModule),
    forwardRef(() => LogsModule),
    forwardRef(() => UsersModule)
  ],
  exports: [
    TokensService,
    JwtModule
  ]
})
export class TokensModule {}
