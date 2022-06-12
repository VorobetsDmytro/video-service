import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DbModule } from '../db/db.module';
import { LogsController } from './logs.controller';
import { LogsService } from './logs.service';

@Module({
  controllers: [LogsController],
  providers: [
    LogsService
  ],
  imports: [
    DbModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'jwtsecret',
      signOptions: {
        expiresIn: '1h'
      }
    }),
  ],
  exports: [
    LogsService
  ]
})
export class LogsModule {}
