import { IsNotEmpty, IsString } from "class-validator";

export default class ConfirmBankTransactionDto {
    @IsString()
    @IsNotEmpty()
    transaction_id: string;
}