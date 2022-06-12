import { IsEmail, IsString, Length, Matches } from "class-validator";

export class RegisterUserDto {
    id?: string;

    @IsString({message: 'The email must be a string.'})
    @IsEmail({}, {message: 'Incorrect email.'})
    @Length(5, 30, {message: 'The email can contain: 5 min and 30 max characters.'})
    email: string;

    @IsString({message: 'The firstname must be a string.'})
    @Length(2, 25, {message: 'The firstname can contain: 2 min and 25 max characters.'})
    @Matches(/^[A-Z]+[a-z]+$/, {message: 'Incorrect firstname'})
    firstname: string;

    @IsString({message: 'The lastname must be a string.'})
    @Length(2, 25, {message: 'The lastname can contain: 2 min and 25 max characters.'})
    @Matches(/^[A-Z]+[a-z]+$/, {message: 'Incorrect lastname'})
    lastname: string;

    subscriptionId?: string | null;

    @IsString({message: 'The password must be a string.'})
    @Length(3, 30, {message: 'The password can contain: 3 min and 30 max characters.'})
    password: string;
}