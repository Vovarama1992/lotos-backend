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
import { BroadcastMessageDto } from "src/admin/dto/broadcast-message.dto";
import { NotificationService } from "src/notification/notification.service";
import {
  NotificationStatus,
  NotificationType,
} from "src/notification/entities/notification.entity";

@Injectable()
export class ManagerService {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly withdrawService: WithdrawHistoryService,
    private readonly notificationService: NotificationService,

    @InjectRepository(User)
    private readonly usersRepository: Repository<User>
  ) {}

  async broadCastMessage(
    managerId: string,
    broadCastMessageDto: BroadcastMessageDto
  ) {
    const userIds = (
      await this.usersRepository.find({
        where: { manager: { id: managerId } },
      })
    ).map((user) => user.id);

    await this.notificationService.createNotifications(
      userIds,
      "admin-message",
      {
        status: NotificationStatus.INFO,
        type: NotificationType.ADMIN,
        message: broadCastMessageDto.message,
      }
    );
  }

  async getAllReferrals(managerId: string) {
    const [data, count] = await this.usersRepository.findAndCount({
      where: { manager: { id: managerId } },
    });
    return data;
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
