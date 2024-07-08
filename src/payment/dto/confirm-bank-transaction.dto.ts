import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export default class ConfirmBankTransactionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  transaction_id: string;
}
