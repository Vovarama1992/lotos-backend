import { Injectable } from "@nestjs/common";
import { CreateManagerDto } from "./dto/create-manager.dto";
import { UpdateManagerDto } from "./dto/update-manager.dto";
import { GetTransactionsQueryDto } from "src/admin/dto/get-transactions-query.dto";
import { TransactionService } from "src/transaction/transaction.service";
import { WithdrawHistoryService } from "src/withdraw-history/withdraw-history.service";
import { GetWithdrawHistoryQueryDto } from "src/admin/dto/get-withdraw-history-query.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/user/entities/user.entity";
import { Repository } from "typeorm";

@Injectable()
export class ManagerService {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly withdrawService: WithdrawHistoryService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>
  ) {}

  async getAllReferrals(managerId: string) {
    const [data, count] = await this.usersRepository.findAndCount({
      where: { manager: { id: managerId } },
    });
    return { count, data };
  }

  async getTransactions(managerId: string, filter: GetTransactionsQueryDto) {
    const [transactions, count] =
      await this.transactionService.getAllTransactions(
        {
          ...filter,
          user: {
            manager: {
              id: managerId,
            },
          },
        },
        {
          includeUser: true,
        }
      );
    return { count, data: transactions };
  }

  async getAllWithdrawTransactions(
    managerId: string,
    filter?: GetWithdrawHistoryQueryDto
  ) {
    const [data, count] = await this.withdrawService.getAllWithdrawTransactions(
      { status: filter?.status, user: { manager: { id: managerId } } },
      { includeUser: true }
    );

    return { data, count };
  }
}
