import { IsString, Length } from "class-validator";

export class ActivationDto{
    @IsString({message: 'The password must be a string.'})
    @Length(3, 30, {message: 'The password can contain: 3 min and 30 max characters.'})
    password: string;
}