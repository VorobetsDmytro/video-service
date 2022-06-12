import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailTransporterService {
    constructor(private mailerService: MailerService){}

    async sendEmail(to: string, subject: string, text: string){
        await this.mailerService.sendMail({
            to,
            subject,
            text
        });
    }
}
