import { IsEmail, IsOptional, IsString, Length, Matches } from "class-validator";

export class ChangeProfileDto {
    @IsOptional({message: 'Incorrect login'})
    @IsString({message: 'The firstname must be a string.'})
    @Length(2, 25, {message: 'The firstname can contain: 2 min and 25 max characters.'})
    @Matches(/^[A-Z]+[a-z]+$/, {message: 'Incorrect firstname'})
    readonly firstname?: string;

    @IsOptional({message: 'Incorrect password'})
    @IsString({message: 'The lastname must be a string.'})
    @Length(2, 25, {message: 'The lastname can contain: 2 min and 25 max characters.'})
    @Matches(/^[A-Z]+[a-z]+$/, {message: 'Incorrect lastname'})
    readonly lastname?: string;

    @IsOptional({message: 'Incorrect email'})
    @IsString({message: 'The email must be a string.'})
    @IsEmail({}, {message: 'Incorrect email.'})
    @Length(5, 30, {message: 'The email can contain: 5 min and 30 max characters.'})
    readonly email?: string;
    
    @IsOptional({message: 'Incorrect avatar'})
    @IsString({message: 'The avatar must be a string.'})
    readonly avatar?: string;
}