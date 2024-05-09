import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class ConfirmWithdrawTransactionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  withdraw_transaction_id: string;
}
