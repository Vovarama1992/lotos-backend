import { ApiProperty } from "@nestjs/swagger";
import { Transaction } from "src/transaction/entities/transaction.entity";
import { Withdraw } from "src/withdraw-history/entities/withdraw-history.entity";

export class GetWalletHistoryResponseDto {
  @ApiProperty({type: () => Withdraw, isArray: true})
  withdrawals: Withdraw[];
  @ApiProperty({type: () => Transaction, isArray: true})
  transactions: Transaction[];
}
