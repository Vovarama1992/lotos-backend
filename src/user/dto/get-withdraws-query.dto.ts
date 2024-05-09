import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";
import { WithdrawStatus } from "src/withdraw-history/entities/withdraw-history.entity";

export class GetWithdrawsQueryDto {
  @ApiProperty({ enum: WithdrawStatus, required: false })
  @IsEnum(WithdrawStatus)
  @IsOptional()
  status?: WithdrawStatus;
}
