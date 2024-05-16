import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { TransactionStatus } from "src/transaction/entities/transaction.entity";
import { TransactionService } from "src/transaction/transaction.service";
import { UserService } from "src/user/user.service";
import {
  Withdraw,
  WithdrawStatus,
} from "src/withdraw-history/entities/withdraw-history.entity";
import { WithdrawHistoryService } from "src/withdraw-history/withdraw-history.service";
import { GetWithdrawHistoryQueryDto } from "./dto/get-withdraw-history-query.dto";
import { GetTransactionsQueryDto } from "./dto/get-transactions-query.dto";
import ConfirmBankTransactionDto from "src/payment/dto/confirm-bank-transaction.dto";

@Injectable()
export class AdminService {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly withdrawService: WithdrawHistoryService,
    private readonly userService: UserService
  ) {}
  async getTransactions(filter: GetTransactionsQueryDto) {
    const [transactions, count] =
      await this.transactionService.getAllTransactions(filter);
    return { count, data: transactions };
  }

  async getAllWithdrawTransactions(filter?: GetWithdrawHistoryQueryDto) {
    const [data, count] = await this.withdrawService.getAllWithdrawTransactions(
      { status: filter?.status, user: { id: filter?.userId } },
      { includeUser: true }
    );

    return { data, count };
  }

  async confirmBankTransaction(transaction_id: string) {
    let transaction,
      error = null;
    try {
      transaction = await this.userService.getTransaction(transaction_id);
      const userId = transaction.user.id;

      if (transaction.status === TransactionStatus.WAITING_CONFIRMATION) {
        transaction =
          await this.transactionService.confirmTransactionAsAdmin(
            transaction_id
          );
        const currentBalance = await this.userService.getBalance(userId);
        const newBalance = currentBalance + transaction.amount;
        await this.userService.changeBalance(userId, newBalance);
      } else {
        error = new ForbiddenException("Can not confirm transaction! User must confirm transaction first!");
      }
    } catch (err) {
      console.log(err);
      error = new NotFoundException("Transaction was not found!");
    }

    if (error) {
      throw error;
    }

    return transaction;
  }

  async cancelWithdrawTransaction(withdrawTransactionId: string) {
    let error = null,
      withdrawTransaction: Withdraw;

    try {
      withdrawTransaction =
        await this.withdrawService.cancelWithdrawTransaction(
          withdrawTransactionId
        );
    } catch (err) {
      error = err;
    }

    if (error) {
      throw error;
    } else {
      // if no error, chnage user balance
      const userId = withdrawTransaction.user.id;
      const currentBalance = await this.userService.getBalance(userId);
      const newBalance = currentBalance + withdrawTransaction.amount;
      const updatedUser = await this.userService.changeBalance(
        userId,
        newBalance
      );
      return { ...withdrawTransaction, user: updatedUser };
    }
  }

  async confirmWithdrawTransaction(withdrawTransactionId: string) {
    let error = null,
      withdrawTransaction: Withdraw;

    try {
      withdrawTransaction =
        await this.withdrawService.confirmWithdrawTransaction(
          withdrawTransactionId
        );
    } catch (err) {
      error = err;
    }

    if (error) {
      throw error;
    } else {
      return withdrawTransaction
    }
  }
}
