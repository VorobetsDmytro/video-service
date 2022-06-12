import { IsString, Length } from "class-validator";

export class CreateActiovationLinkDto {
    @IsString({message: 'The link must be a string.'})
    @Length(1, 40, {message: 'The link can contain: 5 min and 30 max characters.'})
    link: string;

    @IsString({message: 'The userId must be a string.'})
    @Length(1, 40, {message: 'The userId can contain: 5 min and 30 max characters.'})
    userId: string;
}