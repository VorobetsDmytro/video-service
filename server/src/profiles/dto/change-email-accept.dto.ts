import { IsString, Length } from "class-validator";

export class ChangeEmailAcceptDto {
    @IsString({message: 'The password must be a string.'})
    @Length(3, 30, {message: 'The password can contain 3 characters minimum and 30 characters maximum'})
    readonly password: string;
}