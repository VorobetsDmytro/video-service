import { IsString, Length } from "class-validator";

export class CreateBanDto {
    id?: string;
    userId?: string;

    @IsString({message: 'The banReason must be a string.'})
    @Length(2, 40, {message: 'The login can contain 2 characters minimum and 40 characters maximum'})
    banReason: string;

    bannedBy?: string;
    unBannedAt?: Date;
}