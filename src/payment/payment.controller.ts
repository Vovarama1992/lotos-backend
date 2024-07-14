import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { RolesGuard } from "src/auth/guard/role.guard";
import { SocketEvent } from "src/constants";
import { CryptocloudService } from "src/cryptocloud/cryptocloud.service";
import { SocketService } from "src/gateway/gateway.service";
import { SendIncomingMessage } from "src/manager-bot/entities/incoming-message.entity";
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
import { v4 as uuid } from "uuid";
import ConfirmBankTransactionDto from "./dto/confirm-bank-transaction.dto";
import CreateBankInvoiceDto from "./dto/create-bank-invoice.dto";
import CreateCryptoInvoiceDto from "./dto/create-crypto-invoice.dto";
import { GetBankInvoiceResponseDto } from "./dto/get-bank-invoice-response.dto";
import { GetCryptoInvoiceResponseDto } from "./dto/get-crypto-invoice-response.dto";
import { BankInvoice } from "./entities/bankInvoice.entity";
import { PaymentService } from "./payment.service";
import { GetPaymentDetailsQueryDto } from "./dto/get-payment-details-query.dto";

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

  // run every monday at 10am - расчитать и зачислить кэшбэк каждому юзеру
  // @Cron("0 10 * * MON")
  // depositCashBack() {
  //   console.log("Running cron job - deposit cashback to users (Monday 10 am)");
  //   this.userService.depositCashback();
  // }

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
          message: `Пользователь ${user.email || user.telegram_username || user.phone} успешно пополнил счёт через криптоэквайринг`,
          status: NotificationStatus.INFO,
          type: NotificationType.SYSTEM,
          data: {
            transaction_id: transaction.id,
          },
        }
      );
    }
  }

  @Get("details")
  @ApiOperation({
    summary: "Платежи - получить все доступные реквизиты для оплаты",
  })
  @ApiResponse({
    status: 403,
    description: "Пользователь не авторизован",
  })
  @ApiOkResponse({
    description: "Реквизиты",
    type: GetBankInvoiceResponseDto,
  })
  getPaymentDetails(@Query() query: GetPaymentDetailsQueryDto){
    const {method} = query;
    return this.paymentService.getPaymentDetails(method);
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
    return this.paymentService.createBankDepositSession(
      createBankInvoiceDto,
      req.user
    );
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
    return this.paymentService.confirmBankDepositByUser(
      confirmBankTransactionDto,
      req.user
    );
  }
}
