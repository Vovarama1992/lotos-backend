import { BadRequestException, Injectable } from "@nestjs/common";
import { UserResponse } from "./type/userResponse";

import { InjectRepository } from "@nestjs/typeorm";
import { UserRole } from "src/constants";
import { SocketService } from "src/gateway/gateway.service";
import {
  NotificationStatus,
  NotificationType,
} from "src/notification/entities/notification.entity";
import { NotificationService } from "src/notification/notification.service";
import {
  Transaction,
  TransactionStatus,
} from "src/transaction/entities/transaction.entity";
import { Withdraw } from "src/withdraw-history/entities/withdraw-history.entity";
import { WithdrawHistoryService } from "src/withdraw-history/withdraw-history.service";
import { Repository } from "typeorm";
import { SendMoneyDTO } from "./decorators/sendMoney.dto";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { GetWithdrawsQueryDto } from "./dto/get-withdraws-query.dto";
import { UpdateUserProfileDto } from "./dto/update-user-profile.dto";
import { WithdrawMoneyDto } from "./dto/withdraw-money.dto";
import { User } from "./entities/user.entity";
import * as moment from "moment";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    private readonly socketService: SocketService,
    private readonly withdrawService: WithdrawHistoryService,
    private readonly notificationService: NotificationService
  ) {}

  async markNotificationAsViewed(notificationId: string) {
    return this.notificationService.markViewedNotification(notificationId);
  }

  async getNotifications(userId: string, all?: boolean) {
    const isViewedFilter = !all ? { isViewed: false } : {};

    const [data, count] = await this.notificationService.getNotifications({
      ...isViewedFilter,
      user: { id: userId },
    });
    return { count, data };
  }

  async getAdminIds() {
    const res = await this.usersRepository.find({
      where: { role: UserRole.ADMIN },
      select: { id: true },
    });
    return res.map((el) => el.id);
  }

  async getProfile(userId: string) {
    return await this.usersRepository.findOneByOrFail({ id: userId });
  }

  async saveProfile(
    userId: string,
    updateUserProfileDto: UpdateUserProfileDto
  ) {
    const user = await this.usersRepository.findOneByOrFail({ id: userId });
    let parsedDob = null;
    if (updateUserProfileDto.dob) {
      parsedDob = moment(updateUserProfileDto.dob);
      if (!(parsedDob as moment.Moment).isValid()) {
        throw new BadRequestException('Некорректный формат даты');
      } else {
        parsedDob = (parsedDob as moment.Moment).toISOString();
      }
    }

    const updatedUser: User = { ...user, ...updateUserProfileDto };
    if (parsedDob) {
      updatedUser.dob = parsedDob;
    }
    return await this.usersRepository.save(updatedUser);
  }

  async saveUser(createUserDto: Partial<User>): Promise<User> {
    try {
      return await this.usersRepository.save({
        ...createUserDto,
      });
    } catch (e) {
      console.log(e);
    }
  }

  findAll() {
    return this.usersRepository.find();
  }

  async getBalance(id: string) {
    const user = await this.findOneById(id);
    if (!user) throw new Error("User not found");
    return user.balance;
  }

  async findOneById(id: string): Promise<UserResponse> {
    return await this.usersRepository.findOneOrFail({
      where: { id },
    });
  }

  async findOneByCredentials(email: string, phone: string): Promise<User> {
    return await this.usersRepository.findOne({
      where: [{ email }, { phone }],
      select: ["password", "id", "role"],
    });
  }

  async addTransaction(userId: string, transactionData: CreateTransactionDto) {
    const transaction = new Transaction(transactionData);
    const user = await this.usersRepository.findOneOrFail({
      where: { id: userId },
      relations: { transactions: true },
    });
    console.log(user);
    user.transactions.push(transaction);
    await this.usersRepository.save(user);
    return transaction;
  }

  async completeTransaction(transactionId: string) {
    const transaction = await this.getTransaction(transactionId);

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

  async findOneSend(credentials: string): Promise<User> {
    return await this.usersRepository.findOne({
      where: [{ email: credentials }, { phone: credentials }],
      select: ["id"],
    });
  }

  async findOneByEmail(email: string): Promise<User> {
    return await this.usersRepository.findOne({
      where: { email },
      select: ["password", "id", "role"],
    });
  }

  async findOneByOneCredentials(credentials: string): Promise<User> {
    return await this.usersRepository.findOne({
      where: [{ email: credentials }, { phone: credentials }],
      select: ["password", "id", "role"],
    });
  }

  async sendMoney(currentUser: User, transfer: SendMoneyDTO) {
    if (
      isNaN(transfer.cost) ||
      transfer.cost < 0 ||
      isNaN(currentUser.balance)
    ) {
      throw new Error("Недостаточно средств");
    }
    const user = await this.findOneById(transfer.userId);
    if (!user) throw new Error("Пользователь не найден");
    if (isNaN(user.balance)) throw new Error("Invalid recipient balance");
    currentUser.balance -= transfer.cost;
    await this.saveUser(currentUser);
    user.balance += transfer.cost;
    await this.saveUser(user);
    return { success: true, message: "Операция выполнена успешно" };
  }

  async changeBalance(id: string, balance: number) {
    const user = await this.findOneById(id);
    user.balance = balance;
    this.saveUser(user);
    this.socketService.emitToUser(id, "balanceUpdated", {
      balance: user.balance,
    });
    return user;
  }

  async withdrawMoney(user: User, withdrawMoneyDto: WithdrawMoneyDto) {
    const withdrawTransaction =
      await this.withdrawService.createWithdrawTransaction({
        ...withdrawMoneyDto,
        user,
      });

    const currentBalance = await this.getBalance(user.id);
    const newBalance = currentBalance - withdrawTransaction.amount;
    const updatedUser = await this.changeBalance(user.id, newBalance);

    const adminUserIds = await this.getAdminIds();

    this.notificationService.createNotifications(
      adminUserIds,
      "withdraw.pending",
      {
        message: `Новая заявка на вывод средств от ${user.email}`,
        status: NotificationStatus.INFO,
        type: NotificationType.SYSTEM,
      }
    );

    this.notificationService.createNotifications(
      [user.id],
      "withdraw.pending",
      {
        message: "Вы создали заявку на вывод средств",
        status: NotificationStatus.INFO,
        type: NotificationType.SYSTEM,
      }
    );

    return { ...withdrawTransaction, user: updatedUser };
  }

  async cancelWithdrawMoney(user: User, withdrawTransactionId: string) {
    let error = null,
      withdrawTransaction: Withdraw,
      updatedUser: UserResponse;

    try {
      withdrawTransaction =
        await this.withdrawService.cancelWithdrawTransaction(
          withdrawTransactionId
        );
    } catch (err) {
      error = err;
    }

    if (!error) {
      const currentBalance = await this.getBalance(user.id);
      const newBalance = currentBalance + withdrawTransaction.amount;
      updatedUser = await this.changeBalance(user.id, newBalance);

      const adminUserIds = await this.getAdminIds();
      this.notificationService.createNotifications(
        adminUserIds,
        "withdraw.cancelled",
        {
          message: `Заявка на вывод средств от ${user.email} была отменена`,
          status: NotificationStatus.INFO,
          type: NotificationType.SYSTEM,
        }
      );

      this.notificationService.createNotifications(
        [user.id],
        "withdraw.cancelled",
        {
          message: "Вы отменили заявку на вывод средств",
          status: NotificationStatus.INFO,
          type: NotificationType.SYSTEM,
        }
      );
    } else {
      throw error;
    }

    return { ...withdrawTransaction, user: updatedUser };
  }

  async getAllWithdraws(userId: string, filter: GetWithdrawsQueryDto) {
    return await this.withdrawService.getAllWithdrawTransactions(
      {
        ...filter,
        user: { id: userId },
      },
      { includeUser: false }
    );
  }
}
