import { IsOptional, IsString, Length } from "class-validator";

export class EditVideoDto {
    @IsOptional({message: 'Incorrect title.'})
    @IsString({message: 'The title must be a string.'})
    @Length(1, 80, {message: 'The title can contain: 1 min and 80 max characters.'})
    title?: string;

    @IsOptional({message: 'Incorrect previewPath.'})
    @IsString({message: 'The previewPath must be a string.'})
    previewPath?: string;
}