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
} from "src/transaction/entities/transaction.entity";
import { TransactionService } from "src/transaction/transaction.service";
import { UserService } from "src/user/user.service";
import { Withdraw } from "src/withdraw-history/entities/withdraw-history.entity";
import { WithdrawHistoryService } from "src/withdraw-history/withdraw-history.service";
import { Repository } from "typeorm";
import { AddGameToCategoryDto } from "./dto/add-game-to-category.dto";
import { GetTransactionsQueryDto } from "./dto/get-transactions-query.dto";
import { GetWithdrawHistoryQueryDto } from "./dto/get-withdraw-history-query.dto";
import { SaveGamesPlacementDto } from "./dto/save-games-placement.dto";
import { SavePaymentDetailsDto } from "./dto/save-payment-details.dto";
import { SendMessageToUserDto } from "./dto/send-message-to-user.dto";
import { User } from "src/user/entities/user.entity";
import { BroadcastMessageDto } from "./dto/broadcast-message.dto";

@Injectable()
export class AdminService {
  constructor(
    @Inject(forwardRef(()=>TransactionService))
    private readonly transactionService: TransactionService,
    @Inject(forwardRef(()=>WithdrawHistoryService))
    private readonly withdrawService: WithdrawHistoryService,
    @Inject(forwardRef(()=>UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(()=>RedisService))
    private readonly redisService: RedisService,
    @Inject(forwardRef(()=>SocketService))
    private readonly socketService: SocketService,
    @Inject(forwardRef(()=>NotificationService))
    private readonly notificationService: NotificationService,
    @InjectRepository(GamePlacement)
    private readonly gamePlacementRepository: Repository<GamePlacement>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

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

  async getPaymentDetails() {
    let response = {
      card: [],
      sbp: [],
    };
    const data = await this.redisService.getJSON("admin/payment-details");
    if (data) {
      response = data;
    }

    return response;
  }

  async setPaymentDetails(setPaymentDetailsDto: SavePaymentDetailsDto) {
    return this.redisService.setJSON(
      "admin/payment-details",
      setPaymentDetailsDto
    );
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

  async cancelBankTransaction(transaction_id: string) {
    let transaction,
      error = null;
    try {
      transaction = await this.userService.getTransaction(transaction_id);
      const userId = transaction.user.id;

      transaction =
        await this.transactionService.cancelTransaction(transaction_id);

      await this.notificationService.createNotifications(
        [userId],
        SocketEvent.PAYMENT_BANK_SUCCESS,
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
}
