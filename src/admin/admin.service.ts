import { Injectable } from "@nestjs/common";
import { TransactionStatus } from "src/transaction/entities/transaction.entity";
import { TransactionService } from "src/transaction/transaction.service";

export type GetTransactionsFilter = {
  status?: TransactionStatus;
};
@Injectable()
export class AdminService {
  constructor(private readonly transactionService: TransactionService) {}
  async getTransactions(filter: GetTransactionsFilter) {
    const [transactions, count] =
      await this.transactionService.getAllTransactions(filter);
    return { count, data: transactions };
  }
}
