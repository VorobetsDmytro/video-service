import { IsString, Length } from "class-validator";

export class EditCommentDto {
    @IsString({message: 'The text must be a string.'})
    @Length(1, 300, {message: 'The text can contain: 1 min and 300 max characters.'})
    text: string;
}