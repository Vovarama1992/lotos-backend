import { ApiProperty } from "@nestjs/swagger";

export class GetUserBalanceDto {
  @ApiProperty()
  balance: number;
  @ApiProperty()
  totalIncoming: number;
  @ApiProperty()
  totalWithdrawal: number;
}
