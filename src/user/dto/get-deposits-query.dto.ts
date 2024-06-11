import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsOptional } from "class-validator";
import { TransactionStatus } from "src/transaction/entities/transaction.entity";

export class GetDepositsQueryDto {
  @ApiProperty({ type: Date })
  @IsOptional()
  @IsDateString()
  start_date: string;

  @ApiProperty({ type: Date })
  @IsOptional()
  @IsDateString()
  end_date: string;

  @ApiProperty({ enum: TransactionStatus })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status: TransactionStatus;
}
