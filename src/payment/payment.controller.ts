import {
  Body,
  Controller,
  ForbiddenException,
  NotFoundException,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Roles } from "src/auth/decorator/roles.decorator";
import { RolesGuard } from "src/auth/guard/role.guard";
import { CryptocloudService } from "src/cryptocloud/cryptocloud.service";
import { TransactionService } from "src/transaction/transaction.service";
import { UserService } from "src/user/user.service";
import { v4 as uuid } from "uuid";
import ConfirmBankTransactionDto from "./dto/confirm-bank-transaction.dto";
import CreateBankInvoiceDto from "./dto/create-bank-invoice.dto";
import CreateCryptoInvoiceDto from "./dto/create-crypto-invoice.dto";
import { BankInvoice } from "./entities/bankInvoice.entity";
import { PaymentService } from "./payment.service";
import {
  Transaction,
  TransactionStatus,
} from "src/transaction/entities/transaction.entity";
import {
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { GetCryptoInvoiceResponseDto } from "./dto/get-crypto-invoice-response.dto";
import { GetBankInvoiceResponseDto } from "./dto/get-bank-invoice-response.dto";
import { RedisService } from "src/redis/redis.service";
import { SocketService } from "src/gateway/gateway.service";
import { AppGateway } from "src/app.gateway";
import { NotificationService } from "src/notification/notification.service";
import {
  NotificationStatus,
  NotificationType,
} from "src/notification/entities/notification.entity";
import { SocketEvent } from "src/constants";

@ApiTags("payment")
@UseGuards(RolesGuard)
@Controller("payment")
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly cryptoCloudService: CryptocloudService,
    private readonly userService: UserService,
    private readonly transactionService: TransactionService,
    private readonly redisService: RedisService,
    private readonly socketService: SocketService,
    private readonly notificationService: NotificationService
  ) {}

  @Post("crypto")
  @ApiOperation({ summary: "Платежи - создание крипто счёта" })
  @ApiResponse({
    status: 403,
    description: "Пользователь не авторизован",
  })
  @ApiOkResponse({
    description: "Крипто счёт и транзакция",
    type: GetCryptoInvoiceResponseDto,
  })
  async createCryptoInvoice(
    @Body() createCryptoInvoiceDto: CreateCryptoInvoiceDto,
    @Req() req: any
  ) {
    const invoice = await this.cryptoCloudService.createInvoice({
      order_id: req.user.id,
      currency: "RUB",
      ...createCryptoInvoiceDto,
    });

    const transaction = await this.transactionService.addTransaction(
      req.user.id,
      {
        invoice_id: invoice.result.uuid,
        amount: createCryptoInvoiceDto.amount,
        method: "crypto",
        type: "crypto",
        status: TransactionStatus.PENDING,
      }
    );

    const adminUserIds = await this.userService.getAdminIds();
    this.notificationService.createNotifications(
      [req.user.id],
      SocketEvent.PAYMENT_CRYPTO_PENDING,
      {
        message: "Ожидание оплаты через криптоэквайринг",
        status: NotificationStatus.INFO,
        type: NotificationType.SYSTEM,
        data: {
          transaction_id: transaction.id,
        },
      }
    );

    this.notificationService.createNotifications(
      adminUserIds,
      SocketEvent.PAYMENT_CRYPTO_PENDING,
      {
        message:
          "Пользователь создал новую заявку на пополнение через криптоэквайринг",
        status: NotificationStatus.INFO,
        type: NotificationType.SYSTEM,
        data: {
          transaction_id: transaction.id,
        },
      }
    );

    return { invoice, transaction };
  }

  @Post("crypto-callback")
  async receivePaymentEvent(@Body() data: any) {
    const { status, invoice_id, token } = data;

    console.log(data);
    try {
      this.paymentService.verifyPaymentToken(token);
    } catch (err) {
      console.log("Forbidden payment event");
      throw new ForbiddenException();
    }

    const invoicesData = await this.cryptoCloudService.getInvoiceInfo([
      invoice_id,
    ]);

    if (status === "success") {
      const invoice = invoicesData.result[0];
      const amountInFiat = invoice.amount_in_fiat;
      const userId = invoice.order_id;
      const currentBalance = await this.userService.getBalance(userId);
      const newBalance = currentBalance + amountInFiat;
      const user = await this.userService.changeBalance(userId, newBalance);
      const transaction =
        await this.transactionService.completeTransactionByInvoiceId(
          invoice.uuid
        );
      const adminUserIds = await this.userService.getAdminIds();
      this.notificationService.createNotifications(
        [userId],
        SocketEvent.PAYMENT_CRYPTO_SUCCESS,
        {
          message: "Вы успешно пополнили счёт через криптоэквайринг",
          status: NotificationStatus.INFO,
          type: NotificationType.SYSTEM,
          data: {
            transaction_id: transaction.id,
          },
        }
      );

      this.notificationService.createNotifications(
        adminUserIds,
        SocketEvent.PAYMENT_CRYPTO_SUCCESS,
        {
          message: `Пользователь ${user.email} успешно пополнил счёт через криптоэквайринг`,
          status: NotificationStatus.INFO,
          type: NotificationType.SYSTEM,
          data: {
            transaction_id: transaction.id,
          },
        }
      );
    }
  }

  @Post("bank")
  @ApiOperation({
    summary: "Платежи - создание банковского счёта (карта или сбп)",
  })
  @ApiResponse({
    status: 403,
    description: "Пользователь не авторизован",
  })
  @ApiOkResponse({
    description: "Счёт и транзакция",
    type: GetBankInvoiceResponseDto,
  })
  async createBankInvoice(
    @Body() createBankInvoiceDto: CreateBankInvoiceDto,
    @Req() req: any
  ) {
    const paymentInfo =
      (await this.redisService.getJSON("admin/payment-details")) || {};

    let paymentDetails = {};
    if (createBankInvoiceDto.method === "card") {
      paymentDetails = { card: paymentInfo?.card || [] };
    } else if (createBankInvoiceDto.method === "sbp") {
      paymentDetails = { sbp: paymentInfo?.sbp || [] };
    }

    const invoice = new BankInvoice({
      ...createBankInvoiceDto,
      payment_details: paymentDetails,
      timestamp: new Date(),
    });
    const transaction = await this.transactionService.addTransaction(
      req.user.id,
      {
        invoice_id: uuid(),
        amount: createBankInvoiceDto.amount,
        method: createBankInvoiceDto.method,
        type: "bank",
        status: TransactionStatus.PENDING,
      }
    );

    const adminUserIds = await this.userService.getAdminIds();
    this.notificationService.createNotifications(
      [req.user.id],
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
        message: `Пользователь ${req.user.email} создал заявку на банковское пополнение, ожидание оплаты`,
        status: NotificationStatus.INFO,
        type: NotificationType.SYSTEM,
        data: {
          transaction_id: transaction.id,
        },
      }
    );

    return { invoice, transaction };
  }

  @Post("confirm-transaction-as-user")
  @ApiOperation({ summary: "Платежи - подтверждение оплаты пользователем" })
  @ApiResponse({
    status: 403,
    description: "Пользователь не авторизован",
  })
  @ApiResponse({
    status: 404,
    description: "Транзакция не найдена",
  })
  @ApiOkResponse({
    description: "Транзакция",
    type: Transaction,
  })
  async confirmBankTransactionAsUser(
    @Body() confirmBankTransactionDto: ConfirmBankTransactionDto,
    @Req() req: any
  ) {
    const { transaction_id } = confirmBankTransactionDto;
    try {
      const transaction =
        await this.transactionService.confirmTransactionAsUser(transaction_id);

      const adminUserIds = await this.userService.getAdminIds();
      this.notificationService.createNotifications(
        [req.user.id],
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
          message: `Пользователь ${req.user.email} ожидает вашего подтверждения платежа`,
          status: NotificationStatus.INFO,
          type: NotificationType.SYSTEM,
          data: {
            transaction_id: transaction.id,
          },
        }
      );

      return transaction;
    } catch (error) {
      console.log(error);
      throw new NotFoundException("Transaction was not found!");
    }
  }
}
