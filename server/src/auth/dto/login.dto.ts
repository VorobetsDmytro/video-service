import { IsEmail, IsString, Length } from "class-validator";

export class LoginDto{
    @IsString({message: 'The email must be a string.'})
    @IsEmail({}, {message: 'Incorrect email.'})
    @Length(5, 30, {message: 'The email can contain characters: 5 min and 30 max characters.'})
    email: string;

    @IsString({message: 'The password must be a string.'})
    @Length(3, 30, {message: 'The password can contain: 3 min and 30 max characters.'})
    password: string;
}