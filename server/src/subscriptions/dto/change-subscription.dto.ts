import { IsString, Length } from "class-validator";

export class ChangeSubscriptionDto {
    userId?: string;

    @IsString({message: 'The name must be a string.'})
    @Length(2, 20, {message: 'The name can contain: 2 min and 20 max characters.'})
    subscriptionTypeName: string;

    @IsString({message: 'The creditCardId must be a string.'})
    @Length(5, 40, {message: 'The creditCardId can contain: 5 min and 40 max characters.'})
    creditCardId: string;
}