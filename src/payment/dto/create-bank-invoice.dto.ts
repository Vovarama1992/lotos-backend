import { IsNotEmpty, IsNumber, IsString, Min, isString } from "class-validator";

export default class CreateBankInvoiceDto {
  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsNotEmpty()
  method: string;
}
