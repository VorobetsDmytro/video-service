import { IsString, Length } from "class-validator";

export class CreateRoleDto {
    id?: string;

    @IsString({message: 'The value must be a string.'})
    @Length(2, 20, {message: 'The value can contain: 2 min and 20 max characters.'})
    value: string;
}