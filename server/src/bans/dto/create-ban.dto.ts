import { IsString, Length } from "class-validator";

export class CreateBanDto {
    id?: string;
    userId?: string;

    @IsString({message: 'The banReason must be a string.'})
    @Length(2, 40, {message: 'The banReason can contain: 2 min and 40 max characters.'})
    banReason: string;

    bannedBy?: string;
    unBannedAt?: Date;
}