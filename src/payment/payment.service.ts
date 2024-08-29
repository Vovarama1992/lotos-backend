import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { verify } from "jsonwebtoken";
import {
  Transaction,
  TransactionStatus,
} from "src/transaction/entities/transaction.entity";
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
import { PaymentDetailMethod } from "./dto/get-payment-details-query.dto";
import { VoyagerService } from "src/voyager/voyager.service";

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(DepositSession)
    private readonly depositSessionRepository: Repository<DepositSession>,
    @InjectRepository(PaymentDetails)
    private readonly paymentDetailsRepository: Repository<PaymentDetails>,
    @Inject(forwardRef(() => TransactionService))
    private readonly transactionService: TransactionService,

    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,

    @Inject(forwardRef(() => NotificationService))
    private readonly notificationService: NotificationService,

    @Inject(forwardRef(() => ConfigService))
    private readonly configService: ConfigService,

    @Inject(forwardRef(() => AdminService))
    private readonly adminService: AdminService,

    @Inject(forwardRef(() => VoyagerService))
    private readonly voyagerService: VoyagerService
  ) {}

  verifyPaymentToken(token: string) {
    return verify(token, process.env.CRYPTOCLOUD_SECRET_KEY);
  }

  async applyWelcomeBonusIfExists(userId: string, amount: number) {
    const user = await this.userService.findOneById(userId);
    if (!user.bonusAutoActivation) return amount;

    const { welcomeBonus, voyager=1 } = await this.configService.get();
    const amountWithBonus = amount * (1 + welcomeBonus / 100);
    user.bonusAutoActivation = false;

    //create voyager record 
    await this.voyagerService.create(userId, amount * voyager);
    
    //save user
    await this.userService.saveUser(user);

    return amountWithBonus;
  }

  private async isCardAvailable(amount: number, paymentDetailId: string) {
    const now = new Date();
    const sessions = await this.depositSessionRepository.find({
      where: {
        amount,
        expiration_date: MoreThan(now.toISOString()),
        card: { id: paymentDetailId },
      },
      relations: { card: true },
    });

    return sessions.length === 0;
  }

  private async createSession(
    userId: string,
    amount: number,
    paymentDetails: PaymentDetails
  ) {
    try {
      const isCardAvailable = await this.isCardAvailable(
        amount,
        paymentDetails.id
      );

      if (!isCardAvailable) {
        throw new ConflictException(
          "Selected card with selected amount is not available"
        );
      }

      const now = Date.now();
      const expirationDate = new Date(now + 10 * 60 * 1000);

      const session = new DepositSession({
        amount,
        card: paymentDetails,
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
    amount: number,
    paymentDetails: PaymentDetails,
    user: User,
    senderName: string
  ) {
    const invoice = new BankInvoice({
      amount,
      payment_details: paymentDetails,
      timestamp: new Date(),
    });

    const transaction = await this.transactionService.addTransaction(user.id, {
      invoice_id: uuid(),
      amount,
      method: paymentDetails.type === PaymentDetailType.CARD ? "card" : "sbp",
      type: "bank",
      status: TransactionStatus.PENDING,
      payment_details: paymentDetails,
      sender_name: senderName,
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
        message: `Пользователь ${this.userService.getUserLabel(user)} создал заявку на банковское пополнение, ожидание оплаты`,
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
    amount: number,
    paymentDetails: PaymentDetails,
    user: User,
    config: CasinoConfig
  ) {
    //create session with payment details
    const session = await this.createSession(user.id, amount, paymentDetails);

    // optionally setTimeout for 10 minutes and delete the deposit session
    if (config.deleteExpiredDepositSessions) {
      setTimeout(
        () => this.deleteExpiredSession(session.id),
        config.depositSessionDuration * 60000
      );
    }

    // create bank invoice object
    const invoice = new BankInvoice({
      amount,
      payment_details: paymentDetails,
      timestamp: new Date(),
    });

    // create transaction in db
    const transaction = await this.transactionService.addTransaction(user.id, {
      invoice_id: uuid(),
      amount: amount,
      method: paymentDetails.type === PaymentDetailType.CARD ? "card" : "sbp",
      type: "bank",
      status: TransactionStatus.PENDING,
      payment_details: paymentDetails,
    });

    return { invoice, transaction, session };
  }

  async getPaymentDetails(method: PaymentDetailMethod) {
    let type = PaymentDetailType.CARD;
    if (method === PaymentDetailMethod.SBP) {
      type = PaymentDetailType.SBP;
    }

    const data = await this.paymentDetailsRepository.find({ where: { type } });
    return data;
  }

  async createBankDepositSession(
    createBankInvoiceDto: CreateBankInvoiceDto,
    user: User
  ) {
    const { amount, sender_name, payment_detail_id } = createBankInvoiceDto;
    //choose between automatic and manual
    const appConfig = await this.configService.get();
    const paymentDetails = await this.paymentDetailsRepository.findOneByOrFail({
      id: payment_detail_id,
    });

    let result = null;
    if (paymentDetails.mode === DepositMode.AUTO) {
      result = this.createAutomaticDepositSession(
        amount,
        paymentDetails,
        user,
        appConfig
      );
    } else if (paymentDetails.mode === DepositMode.MANUAL) {
      result = this.createManualDepositSession(
        amount,
        paymentDetails,
        user,
        sender_name
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
        { httpsAgent: agent, timeout: 10000 }
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

  private async confirmManualBankDeposit(transaction: Transaction, user: User) {
    await this.transactionService.confirmTransactionAsUser(transaction.id);
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
        message: `Пользователь ${this.userService.getUserLabel(user)} ожидает вашего подтверждения платежа`,
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
        user_tg: transaction.user.telegram_username,
        user_tel: transaction.user.phone,
        type: transaction.type,
        amount: transaction.amount,
        timestamp: transaction.timestamp,
        payment_details: transaction.payment_details,
        sender_name: transaction.sender_name,
      })
    );

    return transaction;
  }

  private async confirmAutoBankDeposit(transaction: Transaction, user: User) {
    if (transaction.status !== TransactionStatus.PENDING) {
      throw new ForbiddenException("Transaction is not active");
    }

    const depositSession = await this.depositSessionRepository.findOne({
      where: {
        amount: transaction.amount,
        card: { id: transaction.payment_details.id },
        user: { id: user.id },
      },
      relations: { card: true },
    });

    if (!depositSession)
      throw new NotFoundException("Deposit session not found!");

    if (new Date() >= new Date(depositSession.expiration_date)) {
      throw new ForbiddenException("Expired deposit session!");
    }

    const isRecieved = await this.checkBankDepositStatus(depositSession);
    if (!isRecieved) {
      throw new ForbiddenException("No deposit recieved!");
    }

    await this.transactionService.confirmTransactionAsUser(transaction.id);

    return await this.adminService.confirmBankTransactionWrapper(
      transaction.id
    );
  }

  async confirmBankDepositByUser(
    confirmBankTransactionDto: ConfirmBankTransactionDto,
    user: User
  ) {
    let transaction: Transaction;
    try {
      transaction = await this.transactionService.getTransaction(
        confirmBankTransactionDto.transaction_id
      );
    } catch (error) {
      throw new NotFoundException("Transaction was not found!");
    }

    const { mode } = transaction.payment_details;

    if (mode === DepositMode.AUTO) {
      return await this.confirmAutoBankDeposit(transaction, user);
    } else {
      return await this.confirmManualBankDeposit(transaction, user);
    }
  }
}
