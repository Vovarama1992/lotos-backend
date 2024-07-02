import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { verify } from "jsonwebtoken";
import { TransactionStatus } from "src/transaction/entities/transaction.entity";
import { TransactionService } from "src/transaction/transaction.service";
import { MoreThan, Repository } from "typeorm";
import { v4 as uuid } from "uuid";
import CreateBankInvoiceDto from "./dto/create-bank-invoice.dto";
import { BankInvoice } from "./entities/bankInvoice.entity";
import { DepositSession } from "./entities/depositSession.entity";
import {
  PaymentDetailType,
  PaymentDetails,
} from "./entities/paymentDetails.entity";
import { SocketEvent } from "src/constants";
import { UserService } from "src/user/user.service";
import { NotificationService } from "src/notification/notification.service";
import {
  NotificationStatus,
  NotificationType,
} from "src/notification/entities/notification.entity";
import { User } from "src/user/entities/user.entity";
import { ConfigService } from "src/config/config.service";
import { CasinoConfig, DepositMode } from "src/config/entities/config.entity";
import ConfirmBankTransactionDto from "./dto/confirm-bank-transaction.dto";
import { SendIncomingMessage } from "src/manager-bot/entities/incoming-message.entity";
import axios from "axios";
import * as https from "https";
import { AdminService } from "src/admin/admin.service";

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(DepositSession)
    private readonly depositSessionRepository: Repository<DepositSession>,
    @InjectRepository(PaymentDetails)
    private readonly paymentDetailsRepository: Repository<PaymentDetails>,
    private readonly transactionService: TransactionService,
    private readonly userService: UserService,
    private readonly notificationService: NotificationService,
    private readonly configService: ConfigService,
    private readonly adminService: AdminService
  ) {}

  verifyPaymentToken(token: string) {
    return verify(token, process.env.CRYPTOCLOUD_SECRET_KEY);
  }

  private selectCardWithHighestPriority(cards: PaymentDetails[]) {
    if (!cards.length) throw new Error("No available cards");
    let selectedCard = cards[0];
    let maxPriority = cards[0].priority;

    for (let i = 0; i < cards.length; i++) {
      if (cards[i].priority > maxPriority) {
        maxPriority = cards[i].priority;
        selectedCard = cards[i];
      }
    }

    return selectedCard;
  }

  private async findNonReservedCard(reservedCardIds: string[]) {
    const paymentInfo = await this.paymentDetailsRepository.find();
    const cards = paymentInfo.filter((p) => p.type === PaymentDetailType.CARD);

    const availableCards = [] as PaymentDetails[];
    cards.forEach((card, idx) => {
      if (!reservedCardIds.includes(card.id)) {
        availableCards.push(card);
      }
    });

    return availableCards;
  }

  private async findAvailableCard(amount: number) {
    const now = new Date();
    const sessions = await this.depositSessionRepository.find({
      where: { amount, expiration_date: MoreThan(now.toISOString()) },
      relations: { card: true },
    });

    const reservedCardIds = sessions.map((session) => session.card.id);

    const availableCards = await this.findNonReservedCard(reservedCardIds);
    if (!availableCards.length) throw new Error("No available cards");

    return this.selectCardWithHighestPriority(availableCards);
  }

  private async createSession(userId: string, amount: number) {
    try {
      const card = await this.findAvailableCard(amount);
      const now = Date.now();
      const expirationDate = new Date(now + 10 * 60 * 1000);

      const session = new DepositSession({
        amount,
        card: card as any,
        expiration_date: expirationDate.toISOString(),
        user: { id: userId } as any,
      });
      console.log(session);
      await this.depositSessionRepository.save(session);

      return session;
    } catch (err) {
      throw new ConflictException(err.message);
    }
  }

  private async createManualDepositSession(
    createBankInvoiceDto: CreateBankInvoiceDto,
    user: User,
    config: CasinoConfig
  ) {
    let paymentDetailType: PaymentDetailType;
    if (createBankInvoiceDto.method === "card") {
      paymentDetailType = PaymentDetailType.CARD;
    } else if (createBankInvoiceDto.method === "sbp") {
      paymentDetailType = PaymentDetailType.SBP;
    }

    const paymentInfo = await this.paymentDetailsRepository.find({
      where: { type: paymentDetailType },
    });

    if (!paymentInfo.length)
      throw new InternalServerErrorException("No payment methods available!");

    let paymentDetails = {};
    if (createBankInvoiceDto.method === "card") {
      paymentDetails = { card: paymentInfo };
    } else if (createBankInvoiceDto.method === "sbp") {
      paymentDetails = { sbp: paymentInfo };
    }

    const invoice = new BankInvoice({
      ...createBankInvoiceDto,
      payment_details: paymentDetails,
      timestamp: new Date(),
    });
    const transaction = await this.transactionService.addTransaction(user.id, {
      invoice_id: uuid(),
      amount: createBankInvoiceDto.amount,
      method: createBankInvoiceDto.method,
      type: "bank",
      status: TransactionStatus.PENDING,
    });

    const adminUserIds = await this.userService.getAdminIds();
    this.notificationService.createNotifications(
      [user.id],
      SocketEvent.PAYMENT_BANK_PENDING,
      {
        message: "Вы создали заявку на банковское пополнение, ожидание оплаты",
        status: NotificationStatus.INFO,
        type: NotificationType.SYSTEM,
        data: {
          transaction_id: transaction.id,
        },
      }
    );

    this.notificationService.createNotifications(
      adminUserIds,
      SocketEvent.PAYMENT_BANK_PENDING,
      {
        message: `Пользователь ${user.email} создал заявку на банковское пополнение, ожидание оплаты`,
        status: NotificationStatus.INFO,
        type: NotificationType.SYSTEM,
        data: {
          transaction_id: transaction.id,
        },
      }
    );

    return { invoice, transaction };
  }

  // function for deleting deposit session by id
  private deleteExpiredSession(sessionId: string) {
    this.depositSessionRepository.delete({ id: sessionId });
  }

  private async createAutomaticDepositSession(
    createBankInvoiceDto: CreateBankInvoiceDto,
    user: User,
    config: CasinoConfig
  ) {
    //create session with payment details
    const session = await this.createSession(
      user.id,
      createBankInvoiceDto.amount
    );

    // optionally setTimeout for 10 minutes and delete the deposit session
    if (config.deleteExpiredDepositSessions) {
      setTimeout(
        () => this.deleteExpiredSession(session.id),
        config.depositSessionDuration * 60000
      );
    }

    // create bank invoice object
    const invoice = new BankInvoice({
      ...createBankInvoiceDto,
      payment_details: { card: session.card.data },
      timestamp: new Date(),
    });

    // create transaction in db
    const transaction = await this.transactionService.addTransaction(user.id, {
      invoice_id: uuid(),
      amount: createBankInvoiceDto.amount,
      method: createBankInvoiceDto.method,
      type: "bank",
      status: TransactionStatus.PENDING,
    });

    return { invoice, transaction, session };
  }

  async createBankDepositSession(
    createBankInvoiceDto: CreateBankInvoiceDto,
    user: User
  ) {
    //choose between automatic and manual
    const appConfig = await this.configService.get();

    let result = null;
    if (appConfig.depositMode === DepositMode.AUTO) {
      result = this.createAutomaticDepositSession(
        createBankInvoiceDto,
        user,
        appConfig
      );
    } else if (appConfig.depositMode === DepositMode.MANUAL) {
      result = this.createManualDepositSession(
        createBankInvoiceDto,
        user,
        appConfig
      );
    }

    return result;
  }

  private async checkBankDepositStatus(depositSession: DepositSession) {
    const cardNum = depositSession.card.data;
    const amount = depositSession.amount;

    const startDate = new Date(depositSession.created_at);
    const endDate = new Date(depositSession.expiration_date);

    try {
      const agent = new https.Agent({
        rejectUnauthorized: false,
      });

      const resp = await axios.post(
        "https://109.207.173.180:8081/api/v1/get",
        {
          authkey: "db7c57860b8dfda7e90a0f3ec6cc9319",
          seen: true,
          toCardNum: cardNum.slice(cardNum.length - 4),
          operationAmount: amount,
        },
        { httpsAgent: agent }
      );

      console.log("rows");
      console.log(resp.data.rows);

      const transactions = resp.data.rows?.filter((el) => {
        const date = new Date(el.date);
        console.log(startDate, date, endDate);
        return date > startDate && date < endDate;
      });

      console.log(transactions);

      return transactions.length > 0;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  private async confirmManualBankDeposit(
    confirmBankTransactionDto: ConfirmBankTransactionDto,
    user: User
  ) {
    const { transaction_id } = confirmBankTransactionDto;

    try {
      const transaction =
        await this.transactionService.confirmTransactionAsUser(
          transaction_id,
          confirmBankTransactionDto.recipient_payment_info
        );

      const adminUserIds = await this.userService.getAdminIds();
      this.notificationService.createNotifications(
        [user.id],
        SocketEvent.PAYMENT_BANK_WAITING_CONFIRMATION,
        {
          message: "Ожидание подтверждения пополнения админом",
          status: NotificationStatus.INFO,
          type: NotificationType.SYSTEM,
          data: {
            transaction_id: transaction.id,
          },
        }
      );

      this.notificationService.createNotifications(
        adminUserIds,
        SocketEvent.PAYMENT_BANK_WAITING_CONFIRMATION,
        {
          message: `Пользователь ${user.email} ожидает вашего подтверждения платежа`,
          status: NotificationStatus.INFO,
          type: NotificationType.SYSTEM,
          data: {
            transaction_id: transaction.id,
          },
        }
      );

      this.notificationService.sendAdminTelegramNotifications(
        adminUserIds,
        new SendIncomingMessage({
          transaction_id: transaction.id,
          user_email: transaction.user.email,
          type: transaction.type,
          amount: transaction.amount,
          timestamp: transaction.timestamp,
          recipient_payment_info:
            confirmBankTransactionDto.recipient_payment_info,
        })
      );

      return transaction;
    } catch (error) {
      console.log(error);
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new NotFoundException("Transaction was not found!");
    }
  }

  private async confirmAutoBankDeposit(
    confirmBankTransactionDto: ConfirmBankTransactionDto,
    user: User
  ) {
    const { transaction_id } = confirmBankTransactionDto;

    const transaction =
      await this.transactionService.getTransaction(transaction_id);

    if (transaction.status !== TransactionStatus.PENDING) {
      throw new ForbiddenException("Transaction is not active");
    }

    const depositSession = await this.depositSessionRepository.findOneOrFail({
      where: {
        amount: transaction.amount,
        card: { data: confirmBankTransactionDto.recipient_payment_info },
        user: { id: user.id },
      },
      relations: { card: true },
    });

    if (new Date() >= new Date(depositSession.expiration_date)) {
      throw new ForbiddenException("Expired deposit session!");
    }

    const isRecieved = await this.checkBankDepositStatus(depositSession);
    if (!isRecieved) {
      throw new ForbiddenException("No deposit recieved!");
    }

    await this.transactionService.confirmTransactionAsUser(
      transaction_id,
      confirmBankTransactionDto.recipient_payment_info
    );

    return await this.adminService.confirmBankTransaction(transaction_id);
  }

  async confirmBankDepositByUser(
    confirmBankTransactionDto: ConfirmBankTransactionDto,
    user: User
  ) {
    const { depositMode } = await this.configService.get();
    if (depositMode === DepositMode.AUTO) {
      return await this.confirmAutoBankDeposit(confirmBankTransactionDto, user);
    } else {
      return await this.confirmManualBankDeposit(
        confirmBankTransactionDto,
        user
      );
    }
  }
}
