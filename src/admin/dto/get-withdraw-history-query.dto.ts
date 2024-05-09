import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { TransactionStatus } from "src/transaction/entities/transaction.entity";
import { WithdrawStatus } from "src/withdraw-history/entities/withdraw-history.entity";

export class GetWithdrawHistoryQueryDto {
  @ApiProperty({ enum: WithdrawStatus, required: false })
  @IsOptional()
  @IsEnum(WithdrawStatus)
  status?: WithdrawStatus;

  @ApiProperty({ example: "29b1962c-4d87-413f-9bdb-efbf803a864f", required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  userId?: string;
}
