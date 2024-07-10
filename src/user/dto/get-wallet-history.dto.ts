import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsOptional } from "class-validator";

export class GetWalletHistoryQueryDto {
  @ApiProperty()
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiProperty()
  @IsOptional()
  @IsDateString()
  end_date?: string;
}
