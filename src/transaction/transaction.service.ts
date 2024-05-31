import { Injectable } from "@nestjs/common";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { UpdateTransactionDto } from "./dto/update-transaction.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Transaction, TransactionStatus } from "./entities/transaction.entity";
import { FindOptionsWhere, Repository } from "typeorm";
import { UserService } from "src/user/user.service";
import { User } from "src/user/entities/user.entity";

@Injectable()
export class TransactionService {
  constructor(
    private readonly userService: UserService,
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>
  ) {}

  async addTransaction(userId: string, transactionData: CreateTransactionDto) {
    const user = await this.userService.findOneById(userId);
    const transaction = new Transaction({
      ...transactionData,
      user: user as User,
    });
    await this.transactionsRepository.save(transaction);
    return transaction;
  }

  async completeTransaction(transactionId: string) {
    const transaction = await this.getTransaction(transactionId);

    transaction.status = TransactionStatus.SUCCESS;
    await this.transactionsRepository.save(transaction);
  }

  async completeTransactionByInvoiceId(invoiceId: string) {
    const transaction = await this.getTransactionByInvoiceId(invoiceId);

    transaction.status = TransactionStatus.SUCCESS;
    await this.transactionsRepository.save(transaction);
  }

  async confirmTransactionAsUser(transactionId: string) {
    const transaction = await this.getTransaction(transactionId);

    transaction.status = TransactionStatus.WAITING_CONFIRMATION;
    return await this.transactionsRepository.save(transaction);
  }

  async getTransaction(transactionId: string) {
    return await this.transactionsRepository.findOneOrFail({
      where: {
        id: transactionId,
      },
      relations: { user: true },
    });
  }

  async getTransactionByInvoiceId(invoiceId: string) {
    return await this.transactionsRepository.findOneOrFail({
      where: {
        invoice_id: invoiceId,
      },
      relations: { user: true },
    });
  }

  async confirmTransactionAsAdmin(transactionId: string) {
    const transaction = await this.getTransaction(transactionId);

    transaction.status = TransactionStatus.SUCCESS;
    return await this.transactionsRepository.save(transaction);
  }

  async getAllTransactions(
    filter: FindOptionsWhere<Transaction> | FindOptionsWhere<Transaction>[],
    options?: { includeUser: boolean }
  ) {
    return await this.transactionsRepository.findAndCount({
      where: {
        ...filter,
      },
      order: {
        timestamp: "DESC",
      },
      relations: { user: options?.includeUser },
    });
  }
}
