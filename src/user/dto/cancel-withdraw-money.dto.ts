import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CancelWithdrawMoneyDto {
  @ApiProperty({ example: "29b1962c-4d87-413f-9bdb-efbf803a864f" })
  @IsString()
  @IsNotEmpty()
  withdraw_transaction_id: string;
}
