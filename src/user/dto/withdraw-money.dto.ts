import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, Min } from "class-validator";

export class WithdrawMoneyDto {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  amount: number;
}
