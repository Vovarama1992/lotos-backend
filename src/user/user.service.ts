import {
  BadRequestException,
  Inject,
  Injectable,
  forwardRef,
} from "@nestjs/common";
import { UserResponse } from "./type/userResponse";

import { InjectRepository } from "@nestjs/typeorm";
import { SocketEvent, UserRole } from "src/constants";
import { SocketService } from "src/gateway/gateway.service";
import {
  NotificationStatus,
  NotificationType,
} from "src/notification/entities/notification.entity";
import { NotificationService } from "src/notification/notification.service";
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from "src/transaction/entities/transaction.entity";
import {
  Withdraw,
  WithdrawMethod,
} from "src/withdraw-history/entities/withdraw-history.entity";
import { WithdrawHistoryService } from "src/withdraw-history/withdraw-history.service";
import { Between, FindManyOptions, Repository } from "typeorm";
import { SendMoneyDTO } from "./decorators/sendMoney.dto";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { GetWithdrawsQueryDto } from "./dto/get-withdraws-query.dto";
import { UpdateUserProfileDto } from "./dto/update-user-profile.dto";
import { WithdrawMoneyDto } from "./dto/withdraw-money.dto";
import { User } from "./entities/user.entity";
import * as moment from "moment";
import { UserReferralService } from "src/user-referral/user-referral.service";
import { v4 as uuid } from "uuid";
import { GetUserReferralType } from "./dto/get-user-referrals-query.dto";
import { AdminBotService } from "src/manager-bot/manager-bot.service";
import { SendWithdrawalMessage } from "src/manager-bot/entities/withdrawal-message.entity";
import { GetWalletHistoryQueryDto } from "./dto/get-wallet-history.dto";
import { TransactionService } from "src/transaction/transaction.service";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    private readonly socketService: SocketService,
    private readonly withdrawService: WithdrawHistoryService,
    private readonly depositService: TransactionService,
    @Inject(forwardRef(() => NotificationService))
    private readonly notificationService: NotificationService,
    private readonly userReferralService: UserReferralService
  ) {}

  async getWalletHistory(userId: string, query: GetWalletHistoryQueryDto) {
    let startDate = new Date(0);
    let endDate = new Date();
    if (query.start_date) {
      startDate = moment(query.start_date).startOf("day").toDate();
    }

    if (query.end_date) {
      endDate = moment(query.end_date).endOf("day").toDate();
    }

    if (startDate > endDate)
      throw new BadRequestException(
        "start_date should be greater than end_date"
      );

    // console.log("start date: ", startDate);
    // console.log("end date: ", endDate);

    const [withdrawals, _withdrawalCount] =
      await this.withdrawService.getAllWithdrawTransactions({
        user: {
          id: userId,
        },
        timestamp: Between(startDate.toISOString(), endDate.toISOString()),
      });

    const [transactions, _transactionCount] =
      await this.depositService.getAllTransactions({
        user: {
          id: userId,
        },
        timestamp: Between(startDate.toISOString(), endDate.toISOString()),
      });

    return { withdrawals, transactions };
  }

  async getFullBalance(userId: string) {
    let currentBalance = 0,
      totalIncoming = 0,
      totalWithdrawal = 0;
    const user = await this.usersRepository.findOneOrFail({
      where: { id: userId },
      relations: { transactions: true, withdrawHistory: true },
    });

    currentBalance = user.balance;

    user.transactions.forEach((transaction) => {
      totalIncoming += transaction.amount;
    });

    user.withdrawHistory.forEach((withdrawal) => {
      if (
        withdrawal.method === WithdrawMethod.CARD ||
        withdrawal.method === WithdrawMethod.SBP
      ) {
        totalWithdrawal += withdrawal.amount;
      }
    });

    return {
      balance: currentBalance,
      totalIncoming,
      totalWithdrawal,
    };
  }

  async getReferrals(userId: string, type: GetUserReferralType) {
    return await this.userReferralService.getReferralsWithStats(userId, type);
  }

  async depositCashback() {
    const allUsers = await this.usersRepository.find({
      where: { role: UserRole.USER },
    });

    const adminIds = await this.getAdminIds();

    for (const user of allUsers) {
      await this.depositCashbackForUser(user.id, adminIds);
    }

    allUsers.forEach((user) => {
      user.lastTotalLoss = user.totalLoss;
      user.lastTotalEarned = user.totalEarned;
    });

    await this.usersRepository.save(allUsers);
  }

  async depositCashbackForUser(userId: string, adminIds: string[]) {
    const { totalCashback: cashback } =
      await this.userReferralService.calculateUserReferralCashback(userId);

    if (!cashback) {
      console.log(`No cashback for user ${userId}`);
      return;
    }

    console.log(`Cashback (for userId: ${userId} )= ${cashback}`);
    const user = await this.findOneById(userId);

    //create new transaction
    const transaction = new Transaction({
      amount: cashback,
      method: "cashback",
      type: TransactionType.CASHBACK,
      status: TransactionStatus.WAITING_CONFIRMATION,
      user: user as User,
      invoice_id: uuid(),
    });

    await this.transactionsRepository.save(transaction);

    this.notificationService.createNotifications(
      adminIds,
      SocketEvent.PAYMENT_CASHBACK_WAITING_CONFIRMATION,
      {
        message: `Пользователь ${user.email || user.telegram_username || user.phone} ожидает подтверждения начисления кэшбэка по реферальной программе в размере ${cashback} РУБ`,
        status: NotificationStatus.INFO,
        type: NotificationType.SYSTEM,
        data: {
          transaction_id: transaction.id,
        },
      }
    );
  }

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
        throw new BadRequestException("Некорректный формат даты");
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

  findAll(options?: FindManyOptions<User>) {
    return this.usersRepository.find(options);
  }

  async getBalance(id: string) {
    const user = await this.findOneById(id);
    if (!user) throw new Error("User not found");
    return user.balance;
  }

  async findOneById(id: string): Promise<User> {
    return await this.usersRepository.findOneOrFail({
      where: { id },
    });
  }

  async findOneByTelegramUsername(username: string): Promise<UserResponse> {
    return await this.usersRepository.findOne({
      where: { telegram_username: username },
    });
  }

  async findOneByCredentials(email: string, phone: string): Promise<User> {
    const userEmail = (email || "").toLowerCase();
    return await this.usersRepository.findOne({
      where: [{ email: userEmail }, { phone }],
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

  async getLosses(id: string) {
    const user = await this.findOneById(id);
    return { totalLoss: user.totalLoss, lastTotalLoss: user.lastTotalLoss };
  }

  async setTotalLoss(id: string, value: number) {
    const user = await this.findOneById(id);
    user.totalLoss = value;
    this.saveUser(user);
    return user;
  }

  async setLastTotalLoss(id: string, value: number) {
    const user = await this.findOneById(id);
    user.lastTotalLoss = value;
    this.saveUser(user);
    return user;
  }

  async increaseTotalLoss(id: string, value: number) {
    const user = await this.findOneById(id);
    user.totalLoss += value;
    this.saveUser(user);
    return user;
  }

  async increaseTotalEarned(id: string, value: number) {
    const user = await this.findOneById(id);
    console.log("totalEarned = ", user.totalEarned)
    console.log("value = ", value)
    user.totalEarned += value;
    console.log(user)
    
    this.saveUser(user);
    return user;
  }

  async increaseLastTotalLoss(id: string, value: number) {
    const user = await this.findOneById(id);
    user.lastTotalLoss += value;
    this.saveUser(user);
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
        message: `Новая заявка на вывод средств от ${user.email || user.telegram_username || user.phone}`,
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

    this.notificationService.sendAdminTelegramNotifications(
      adminUserIds,
      new SendWithdrawalMessage({
        withdrawal_id: withdrawTransaction.id,
        user_email: withdrawTransaction.user.email,
        amount: withdrawTransaction.amount,
        method: withdrawTransaction.method,
        timestamp: withdrawTransaction.timestamp,
        payment_details: {
          card: withdrawTransaction.card,
          crypto_address: withdrawTransaction.crypto_address,
          sbp: withdrawTransaction.sbp,
        },
        currency: withdrawTransaction.currency,
      })
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
          message: `Заявка на вывод средств от ${user.email || user.telegram_username || user.phone} была отменена`,
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
    const applyDateFilter = filter.start_date && filter.end_date;

    const dateFilter = applyDateFilter
      ? { timestamp: Between(filter.start_date, filter.end_date) }
      : {};

    const statusFilter = filter.status ? { status: filter.status } : {};

    return await this.withdrawService.getAllWithdrawTransactions(
      {
        ...dateFilter,
        ...statusFilter,
        user: { id: userId },
      },
      { includeUser: false }
    );
  }
}
