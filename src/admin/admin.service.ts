import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcryptjs";
import { SocketEvent, UserRole } from "src/constants";
import { GamePlacement } from "src/games/entities/game-placement.entity";
import { SocketService } from "src/gateway/gateway.service";
import { CreateManagerDto } from "src/manager/dto/create-manager.dto";
import {
  NotificationStatus,
  NotificationType,
} from "src/notification/entities/notification.entity";
import { NotificationService } from "src/notification/notification.service";
import { RedisService } from "src/redis/redis.service";
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from "src/transaction/entities/transaction.entity";
import { TransactionService } from "src/transaction/transaction.service";
import { UserService } from "src/user/user.service";
import {
  Withdraw,
  WithdrawStatus,
} from "src/withdraw-history/entities/withdraw-history.entity";
import { WithdrawHistoryService } from "src/withdraw-history/withdraw-history.service";
import { Between, In, Not, Repository } from "typeorm";
import { AddGameToCategoryDto } from "./dto/add-game-to-category.dto";
import { GetTransactionsQueryDto } from "./dto/get-transactions-query.dto";
import { GetWithdrawHistoryQueryDto } from "./dto/get-withdraw-history-query.dto";
import { SaveGamesPlacementDto } from "./dto/save-games-placement.dto";
import { SavePaymentDetailsDto } from "./dto/save-payment-details.dto";
import { SendMessageToUserDto } from "./dto/send-message-to-user.dto";
import { User } from "src/user/entities/user.entity";
import { BroadcastMessageDto } from "./dto/broadcast-message.dto";
import { AddGamesToCategoryDto } from "./dto/add-games-to-category.dto";
import {
  PaymentDetailType,
  PaymentDetails,
} from "src/payment/entities/paymentDetails.entity";
import { SaveAppConfigDto } from "./dto/save-app-config.dto";
import { ConfigService } from "src/config/config.service";
import { GetFinancialStatsQueryDto } from "./dto/get-financial-stats-query.dto";
import { FinancialStatsService } from "src/financial-stats/financial-stats.service";
import { TransactionLogService } from "src/transaction-log/transaction-log.service";
import { CreateTransactionLogDto } from "src/transaction-log/dto/create-transaction-log.dto";
import {
  TransactionLogAction,
  TransactionLogType,
} from "src/transaction-log/entities/transaction-log.entity";

@Injectable()
export class AdminService {
  constructor(
    @Inject(forwardRef(() => TransactionLogService))
    private readonly transactionLogService: TransactionLogService,
    @Inject(forwardRef(() => TransactionService))
    private readonly transactionService: TransactionService,
    @Inject(forwardRef(() => WithdrawHistoryService))
    private readonly withdrawService: WithdrawHistoryService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => RedisService))
    private readonly redisService: RedisService,
    @Inject(forwardRef(() => SocketService))
    private readonly socketService: SocketService,
    @Inject(forwardRef(() => NotificationService))
    private readonly notificationService: NotificationService,
    @InjectRepository(GamePlacement)
    private readonly gamePlacementRepository: Repository<GamePlacement>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(PaymentDetails)
    private readonly paymentDetailsRepository: Repository<PaymentDetails>,
    private readonly configService: ConfigService,
    private readonly financialStatsService: FinancialStatsService
  ) {}

  async getFinancialStats(query: GetFinancialStatsQueryDto) {
    let startDate = new Date(0);
    let endDate = new Date();
    if (query.start_date) {
      startDate = new Date(query.start_date);
    }

    if (query.end_date) {
      endDate = new Date(query.end_date);
    }

    if (startDate > endDate) {
      throw new BadRequestException(
        "start_date should be greater than end_date"
      );
    }

    let allUsers = [] as User[];
    if (query.user_id) {
      try {
        allUsers = [await this.userService.findOneById(query.user_id)];
      } catch (error) {
        throw new NotFoundException("User not found!");
      }
    } else {
      allUsers = await this.userService.findAll();
    }

    return this.financialStatsService.get(allUsers, startDate, endDate);
  }

  async saveAppConfig(saveAppConfigDto: SaveAppConfigDto) {
    return await this.configService.save(saveAppConfigDto);
  }

  async getAppConfig() {
    return await this.configService.get();
  }

  async broadCastMessage(broadCastMessageDto: BroadcastMessageDto) {
    const userIds = (
      await this.userRepository.find({ select: { id: true } })
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

  async deleteManager(userId: string) {
    const user = await this.userRepository.findOneByOrFail({ id: userId });
    return this.userRepository.remove(user);
  }

  async getManagers() {
    const [data, count] = await this.userRepository.findAndCount({
      where: { role: UserRole.MANAGER },
    });
    return { count, data };
  }

  async saveGamesPlacement(saveGamesPlacementDto: SaveGamesPlacementDto) {
    const category = saveGamesPlacementDto.category;
    let error = false;

    const games = await this.gamePlacementRepository.find({
      where: { category },
    });

    saveGamesPlacementDto.games.forEach((game) => {
      const idx = games.findIndex((el) => el.id === game.game_placement_id);
      if (idx === -1) {
        error = true;
      } else {
        (game as any).id = games[idx].id;
      }
    });

    if (error) throw new BadRequestException("Одной из игр не существует");

    const savePromises = saveGamesPlacementDto.games.map((game) => {
      console.log(game);
      const gamePlacement = new GamePlacement({ ...game, category });
      return this.gamePlacementRepository.save(gamePlacement);
    });

    return Promise.all(savePromises);
  }

  async addGameToCategory(addGameToCategoryDto: AddGameToCategoryDto) {
    const gamePlacement = new GamePlacement(addGameToCategoryDto);
    const existingPlacement = await this.gamePlacementRepository.find({
      where: {
        ...addGameToCategoryDto,
      },
    });

    if (existingPlacement.length > 0) {
      throw new BadRequestException("Такая запись уже есть!");
    }

    return await this.gamePlacementRepository.save(gamePlacement);
  }

  async addGamesToCategory(addGamesToCategoryDto: AddGamesToCategoryDto) {
    const currentGamesInCategory = await this.gamePlacementRepository.find({
      where: {
        category: addGamesToCategoryDto.category,
      },
    });

    let currentMaxOrder = -1;
    if (currentGamesInCategory.length > 0) {
      currentMaxOrder = Math.max(
        ...currentGamesInCategory.map((game) => game.order)
      );
    }

    const currentGamesSet = new Set(
      currentGamesInCategory.map((game) => game.game_id)
    );

    const newGamesInCategory = addGamesToCategoryDto.games.filter(
      (game) => !currentGamesSet.has(game.game_id)
    );

    const gamePlacements = newGamesInCategory.map(
      (game) =>
        new GamePlacement({
          ...game,
          category: addGamesToCategoryDto.category,
          order: game.order + currentMaxOrder + 1,
        })
    );

    console.log(
      currentGamesInCategory.map((game) => game.order),
      gamePlacements
    );

    return await this.gamePlacementRepository.save(gamePlacements);
  }

  async deleteGameFromCategory(gamePlacementId: string) {
    const existingGamePlacement =
      await this.gamePlacementRepository.findOneByOrFail({
        id: gamePlacementId,
      });

    if (!existingGamePlacement) {
      throw new NotFoundException("Такой записи нет!");
    }

    return await this.gamePlacementRepository.remove(existingGamePlacement);
  }

  async createManagerAccount(createManagerDto: CreateManagerDto) {
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(
      createManagerDto.password,
      saltRounds
    );
    return await this.userService.saveUser({
      role: UserRole.MANAGER,
      email: createManagerDto.email,
      password: hashedPassword,
    });
  }

  async sendMessageToUser(sendMessageToUserDto: SendMessageToUserDto) {
    this.socketService.emitToUsers(
      [sendMessageToUserDto.user_id],
      "admin-message",
      sendMessageToUserDto.message
    );

    await this.notificationService.createNotification(
      sendMessageToUserDto.user_id,
      {
        status: NotificationStatus.INFO,
        type: NotificationType.ADMIN,
        message: sendMessageToUserDto.message,
      }
    );
  }

  async getUserProfileById(userId: string) {
    return await this.userService.getProfile(userId);
  }

  async getUserByTelegramUsername(tgUsername: string) {
    return await this.userRepository.findOneByOrFail({
      telegram_username: tgUsername,
    });
  }

  async getPaymentDetails() {
    const data = await this.paymentDetailsRepository.find();
    return data;
  }

  async setPaymentDetails(setPaymentDetailsDto: SavePaymentDetailsDto) {
    setPaymentDetailsDto.data.forEach((dataItem) => {
      if (dataItem.id.includes("new-")) {
        delete dataItem.id;
      }
    });

    const updatedRecords = setPaymentDetailsDto.data.filter(
      (el) => !el.id?.includes("del-") || !el.id
    );

    const removedRecords = setPaymentDetailsDto.data.filter((el) =>
      el.id?.includes("del-")
    );

    const res = await this.paymentDetailsRepository.save(updatedRecords);

    const removedRecordIds = removedRecords.map((el) => el.id);

    for (const id of removedRecordIds) {
      await this.paymentDetailsRepository.delete({
        id: id.replace("del-", ""),
      });
    }

    return res;
  }

  async getTransactions(filter: GetTransactionsQueryDto) {
    const [transactions, count] =
      await this.transactionService.getAllTransactions(filter, {
        includeUser: true,
      });
    return { count, data: transactions };
  }

  async getAllWithdrawTransactions(filter?: GetWithdrawHistoryQueryDto) {
    const [data, count] = await this.withdrawService.getAllWithdrawTransactions(
      { status: filter?.status, user: { id: filter?.userId } },
      { includeUser: true }
    );

    return { data, count };
  }

  async getManager(props: { field: "id" | "telegram_id"; id: string }) {
    let user = null as User;
    if (props.field === "id") {
      user = await this.userService.findOneById(props.id);
    } else {
      user = await this.userService.findOneByTelegramId(props.id);
    }

    return user;
  }

  async confirmBankTransactionWrapper(transactionId: string, manager?: User) {
    const data = await this.confirmBankTransaction(transactionId) as Transaction;
    if (manager) {
      //create log
      await this.transactionLogService.create({
        manager: manager,
        user: data.user,
        amount: data.amount,
        action: TransactionLogAction.ACCEPT,
        type: TransactionLogType.DEPOSIT,
        transactionId: transactionId,
      });
    }

    return data;
  }

  async cancelBankTransactionWrapper(transactionId: string, manager?: User) {
    const data = await this.cancelBankTransaction(transactionId) as Transaction;
    if (manager) {
      //create log
      await this.transactionLogService.create({
        manager: manager,
        user: data.user,
        amount: data.amount,
        action: TransactionLogAction.DECLINE,
        type: TransactionLogType.DEPOSIT,
        transactionId: transactionId,
      });
    }

    return data;
  }

  async cancelWithdrawTransactionWrapper(
    transactionId: string,
    manager?: User
  ) {
    const data = await this.cancelWithdrawTransaction(transactionId) as Withdraw;

    if (manager) {
      //create log
      await this.transactionLogService.create({
        manager: manager,
        user: data.user,
        amount: data.amount,
        action: TransactionLogAction.DECLINE,
        type: TransactionLogType.WITHDRAWAL,
        transactionId: transactionId,
      });
    }

    return data;
  }

  async confirmWithdrawTransactionWrapper(
    transactionId: string,
    manager?: User
  ) {
    const data = await this.confirmWithdrawTransaction(transactionId) as Withdraw;
    if (manager) {
      //create log
      await this.transactionLogService.create({
        manager: manager,
        user: data.user,
        amount: data.amount,
        action: TransactionLogAction.ACCEPT,
        type: TransactionLogType.WITHDRAWAL,
        transactionId: transactionId,
      });
    }

    return data;
  }

  private async confirmBankTransaction(transaction_id: string) {
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

        await this.notificationService.createNotifications(
          [userId],
          SocketEvent.PAYMENT_BANK_SUCCESS,
          {
            status: NotificationStatus.INFO,
            type: NotificationType.SYSTEM,
            message: `Вы успешно пополнили свой баланс на ${(transaction as Transaction).amount} RUB`,
            data: {
              transaction_id: transaction_id,
            },
          }
        );
      } else {
        error = new ForbiddenException(
          "Can not confirm transaction! User must confirm transaction first!"
        );
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

  private async cancelBankTransaction(transaction_id: string, manager?: User) {
    let transaction,
      error = null;
    try {
      transaction = await this.userService.getTransaction(transaction_id);
      const userId = transaction.user.id;

      transaction =
        await this.transactionService.cancelTransaction(transaction_id);

      await this.notificationService.createNotifications(
        [userId],
        SocketEvent.PAYMENT_BANK_CANCELLED,
        {
          status: NotificationStatus.INFO,
          type: NotificationType.SYSTEM,
          message: `Пополнение баланса отклонено. Сумма ${(transaction as Transaction).amount} RUB`,
          data: {
            transaction_id: transaction_id,
          },
        }
      );
    } catch (err) {
      console.log(err);
      error = new NotFoundException("Transaction was not found!");
    }

    if (error) {
      throw error;
    }

    return transaction;
  }

  private async cancelWithdrawTransaction(withdrawTransactionId: string) {
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

      await this.notificationService.createNotifications(
        [userId],
        SocketEvent.WITHDRAW_CANCELLED,
        {
          status: NotificationStatus.INFO,
          type: NotificationType.SYSTEM,
          message: `Не удалось вывести деньги. Ваша заявка была отклонена.`,
          data: {
            withdraw_transaction_id: withdrawTransactionId,
          },
        }
      );

      return { ...withdrawTransaction, user: updatedUser };
    }
  }

  private async confirmWithdrawTransaction(withdrawTransactionId: string) {
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
      const userId = withdrawTransaction.user.id;

      await this.notificationService.createNotifications(
        [userId],
        SocketEvent.WITHDRAW_SUCCESS,
        {
          status: NotificationStatus.INFO,
          type: NotificationType.SYSTEM,
          message: `Заявка на вывод средств была исполнена. Выведено ${withdrawTransaction.amount} RUB`,
          data: {
            withdraw_transaction_id: withdrawTransactionId,
          },
        }
      );

      return withdrawTransaction;
    }
  }

  async getTransactionLogs(){
    return await this.transactionLogService.findAll();
  }
}
