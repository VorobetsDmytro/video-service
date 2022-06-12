import { IsString, Length, Matches } from "class-validator";

export class CreateCreditCardDto {
    id?: string;
    userId?: string;

    @IsString({message: 'The type must be a string.'})
    @Length(2, 20, {message: 'The type can contain: 2 min and 20 max characters.'})
    type: string;

    @IsString({message: 'The number must be a string.'})
    @Length(2, 20, {message: 'The number can contain: 2 min and 20 max characters.'})
    @Matches(/^([0-9]{4}[\s\-]){3}[0-9]{4}$/, {message: 'Incorrect number.'})
    number: string;
}