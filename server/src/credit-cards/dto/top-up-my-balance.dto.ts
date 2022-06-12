import { IsNumber, IsString, Length } from "class-validator";

export class TopUpMyBalanceDto {
    @IsNumber({}, {message: 'Incorrect number'})
    money: number;

    creditCardId?: string;
}