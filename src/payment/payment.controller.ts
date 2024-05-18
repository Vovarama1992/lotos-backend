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
    this.socketService.emitToUsers(
      [...adminUserIds, req.user.id],
      "payment.crypto.pending",
      { msg: "Ожидание оплаты через криптоэквайринг", data: transaction }
    );
    this.notificationService.createNotification(req.user.id, {
      message: "Ожидание оплаты через криптоэквайринг",
      status: NotificationStatus.INFO,
      type: NotificationType.SYSTEM,
    });

    this.notificationService.createNotifications(adminUserIds, {
      message:
        "Пользователь создал новую заявку на пополнение через криптоэквайринг",
      status: NotificationStatus.INFO,
      type: NotificationType.SYSTEM,
    });

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
      console.log(invoice);
      const amountInFiat = invoice.amount_in_fiat;
      const userId = invoice.order_id;
      const currentBalance = await this.userService.getBalance(userId);
      const newBalance = currentBalance + amountInFiat;
      await this.userService.changeBalance(userId, newBalance);
      await this.transactionService.completeTransactionByInvoiceId(
        invoice.uuid
      );
      const adminUserIds = await this.userService.getAdminIds();
      this.socketService.emitToUsers(
        [...adminUserIds, userId],
        "payment.crypto.success",
        { msg: "Успешное пополнение средств", data: invoice }
      );

      this.notificationService.createNotification(userId, {
        message: "Вы успешно пополнили счёт через криптоэквайринг",
        status: NotificationStatus.INFO,
        type: NotificationType.SYSTEM,
      });

      this.notificationService.createNotifications(adminUserIds, {
        message: "Пользователь успешно пополнил счёт через криптоэквайринг",
        status: NotificationStatus.INFO,
        type: NotificationType.SYSTEM,
      });
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
    this.socketService.emitToUsers(
      [...adminUserIds, req.user.id],
      "payment.bank.pending",
      { msg: "Ожидание оплаты через банк", data: transaction }
    );

    this.notificationService.createNotification(req.user.id, {
      message: "Ожидание оплаты через банк",
      status: NotificationStatus.INFO,
      type: NotificationType.SYSTEM,
    });

    this.notificationService.createNotifications(adminUserIds, {
      message:
        "Пользователь создал заявку на банковское пополнение, ожидание оплаты",
      status: NotificationStatus.INFO,
      type: NotificationType.SYSTEM,
    });

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
      this.socketService.emitToUsers(
        [...adminUserIds, req.user.id],
        "payment.bank.waiting-confirmation",
        { msg: "Ожидание подтверждения пополнения админом", data: transaction }
      );
      this.notificationService.createNotification(req.user.id, {
        message: "Ожидание подтверждения пополнения админом",
        status: NotificationStatus.INFO,
        type: NotificationType.SYSTEM,
      });

      this.notificationService.createNotifications(adminUserIds, {
        message:
          "Пользователь ожидает вашего подтверждения платежа",
        status: NotificationStatus.INFO,
        type: NotificationType.SYSTEM,
      });

      return transaction;
    } catch (error) {
      console.log(error);
      throw new NotFoundException("Transaction was not found!");
    }
  }
}
