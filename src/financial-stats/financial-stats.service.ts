import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { profile } from "console";
import {
  TransactionStatus,
  TransactionType,
} from "src/transaction/entities/transaction.entity";
import { TransactionService } from "src/transaction/transaction.service";
import { User } from "src/user/entities/user.entity";
import { WithdrawStatus } from "src/withdraw-history/entities/withdraw-history.entity";
import { WithdrawHistoryService } from "src/withdraw-history/withdraw-history.service";
import { Between, Not } from "typeorm";

@Injectable()
export class FinancialStatsService {
  constructor(
    @Inject(forwardRef(() => TransactionService))
    private readonly transactionService: TransactionService,
    @Inject(forwardRef(() => WithdrawHistoryService))
    private readonly withdrawService: WithdrawHistoryService
  ) {}

  async get(users: User[], startDate: Date, endDate: Date) {
    const result = [];
    let totalDeposit = 0;
    let totalWithrawal = 0;
    let totalProfit = 0;
    let totalCashback = 0;
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const [deposits] = await this.transactionService.getAllTransactions({
        user: { id: user.id },
        type: Not(TransactionType.CASHBACK),
        timestamp: Between(startDate.toISOString(), endDate.toISOString()),
        status: TransactionStatus.SUCCESS,
      });

      const [cashbacks] = await this.transactionService.getAllTransactions({
        user: { id: user.id },
        type: TransactionType.CASHBACK,
        timestamp: Between(startDate.toISOString(), endDate.toISOString()),
        status: TransactionStatus.SUCCESS,
      });

      const [withdrawals] =
        await this.withdrawService.getAllWithdrawTransactions({
          user: { id: user.id },
          timestamp: Between(startDate.toISOString(), endDate.toISOString()),
          status: WithdrawStatus.SUCCESS,
        });

      const depositAmount = deposits.reduce(
        (current, value) => current + value.amount,
        0
      );

      const withdrawAmount = withdrawals.reduce(
        (current, value) => current + value.amount,
        0
      );

      const cashbackAmount = cashbacks.reduce(
        (current, value) => current + value.amount,
        0
      );

      totalDeposit += depositAmount;
      totalWithrawal += withdrawAmount;
      totalProfit += depositAmount - withdrawAmount;
      totalCashback += cashbackAmount;

      result.push({
        user: user,
        cashback_amount: cashbackAmount,
        deposit_amount: depositAmount,
        withdraw_amount: withdrawAmount,
        profit: depositAmount - withdrawAmount,
      });
    }

    return {
      result,
      total: { totalDeposit, totalWithrawal, totalProfit, totalCashback },
    };
  }
}
