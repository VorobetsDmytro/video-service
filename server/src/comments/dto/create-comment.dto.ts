import { IsString, Length } from "class-validator";

export class CreateCommentDto {
    id?: string;
    userId?: string;

    @IsString({message: 'The videoId must be a string.'})
    @Length(5, 40, {message: 'The videoId can contain: 5 min and 40 max characters.'})
    videoId: string;

    @IsString({message: 'The text must be a string.'})
    @Length(1, 300, {message: 'The text can contain: 1 min and 300 max characters.'})
    text: string;
}