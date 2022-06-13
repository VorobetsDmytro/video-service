import { IsString, Length } from "class-validator";

export class ChangePassDto {
    @IsString({message: 'The oldPass must be a string.'})
    @Length(3, 30, {message: 'The oldPass can contain: 3 min and 30 max characters.'})
    oldPass: string;

    @IsString({message: 'The newPass must be a string.'})
    @Length(3, 30, {message: 'The newPass can contain: 3 min and 30 max characters.'})
    newPass: string;
}