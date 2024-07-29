import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Min,
  isString,
} from "class-validator";

export default class CreateBankInvoiceDto {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sender_name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  payment_detail_id: string;
}
