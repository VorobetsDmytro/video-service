import { IsString, Length } from "class-validator";

export class CreateVideoDto {
    id?: string;

    @IsString({message: 'The title must be a string.'})
    @Length(1, 80, {message: 'The title can contain: 1 min and 80 max characters.'})
    title: string;

    @IsString({message: 'The vieoPath must be a string.'})
    videoPath: string;

    @IsString({message: 'The previewPath must be a string.'})
    previewPath: string;

    duration?: number;
}