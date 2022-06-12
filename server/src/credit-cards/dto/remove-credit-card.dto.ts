import { IsString, Length, Matches } from "class-validator";

export class RemoveCreditCardDto {
    userId?: string;

    @IsString({message: 'The creditCardId must be a string.'})
    @Length(5, 30, {message: 'The creditCardId can contain: 5 min and 30 max characters.'})
    creditCardId: string;
}