import { Module } from '@nestjs/common';
import { MailTransporterService } from './mail-transporter.service';

@Module({
  providers: [MailTransporterService],
  exports: [
    MailTransporterService
  ]
})
export class MailTransporterModule {}
