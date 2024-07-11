import { Module, forwardRef } from "@nestjs/common";
import { TransactionModule } from "src/transaction/transaction.module";
import { WithdrawHistoryModule } from "src/withdraw-history/withdraw-history.module";
import { FinancialStatsService } from "./financial-stats.service";

@Module({
  imports: [
    forwardRef(() => TransactionModule),
    forwardRef(() => WithdrawHistoryModule),
  ],
  exports: [FinancialStatsService],
  providers: [FinancialStatsService],
})
export class FinancialStatsModule {}
