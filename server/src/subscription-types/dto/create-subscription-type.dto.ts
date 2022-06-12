import { IsBoolean, IsNumber, IsString, Length } from "class-validator";

export class CreateSubscriptionTypeDto {
    id?: string;

    @IsString({message: 'The name must be a string.'})
    @Length(2, 20, {message: 'The name can contain: 2 min and 20 max characters.'})
    name: string;

    @IsNumber({}, {message: 'Incorrect maxDownloads'})
    maxDownloads: number;

    @IsNumber({}, {message: 'Incorrect maxViews'})
    maxViews: number;

    @IsBoolean({message: 'Incorrect canAddComments'})
    canAddComments: boolean;

    @IsNumber({}, {message: 'Incorrect price'})
    price: number;

    @IsNumber({}, {message: 'Incorrect duration'})
    duration: number;
}