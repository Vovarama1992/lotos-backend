import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export default class CreateCryptoInvoiceDto {
    @IsNumber()
    amount: number

    // @IsString()
    // @IsNotEmpty()
    // currency: string;
}