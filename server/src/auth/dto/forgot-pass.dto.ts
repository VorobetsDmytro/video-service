import { IsEmail, IsString } from "class-validator";

export class ForgotPassDto {
    @IsString({message: 'The email must be a string'})
    @IsEmail({}, {message: 'Incorrect email'})
    email: string;
}