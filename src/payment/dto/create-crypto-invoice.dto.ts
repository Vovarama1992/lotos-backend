import { ApiProperty } from "@nestjs/swagger";
import { IsNumber } from "class-validator";

export default class CreateCryptoInvoiceDto {
  @ApiProperty()
  @IsNumber()
  amount: number;

  // @IsString()
  // @IsNotEmpty()
  // currency: string;
}
