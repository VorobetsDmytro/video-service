import { Test, TestingModule } from "@nestjs/testing";
import { MailTransporterService } from "./mail-transporter.service";
import { MailerService } from "@nestjs-modules/mailer";

describe('MailTransporterService', () => {
    let service: MailTransporterService;
    const mocksMailerService = {
        sendMail: jest.fn().mockImplementation((dto) => {})
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MailTransporterService,
                { provide: MailerService, useValue: mocksMailerService },
            ]
        }).compile();

        service = module.get<MailTransporterService>(MailTransporterService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should send a message to the email', async () => {
        const to = 'to';
        const subject = 'subject';
        const text = 'text';
        expect(await service.sendEmail(to, subject, text));
    });
})