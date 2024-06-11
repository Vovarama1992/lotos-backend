import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsOptional } from "class-validator";
import { WithdrawStatus } from "src/withdraw-history/entities/withdraw-history.entity";

export class GetWithdrawsQueryDto {
  @ApiProperty({ type: Date })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiProperty({ type: Date })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiProperty({ enum: WithdrawStatus, required: false })
  @IsEnum(WithdrawStatus)
  @IsOptional()
  status?: WithdrawStatus;
}
