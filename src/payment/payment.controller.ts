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

@ApiTags("payment")
@UseGuards(RolesGuard)
@Controller("payment")
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly cryptoCloudService: CryptocloudService,
    private readonly userService: UserService,
    private readonly transactionService: TransactionService
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
      console.log(invoice)
      const amountInFiat = invoice.amount_in_fiat;
      const userId = invoice.order_id;
      const currentBalance = await this.userService.getBalance(userId);
      const newBalance = currentBalance + amountInFiat;
      await this.userService.changeBalance(userId, newBalance);
      await this.transactionService.completeTransaction(invoice.uuid);
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
    let paymentDetails = {};
    if (createBankInvoiceDto.method === "card") {
      paymentDetails = { card: process.env.BANK_PAYMENT_CARD };
    } else if (createBankInvoiceDto.method === "sbp") {
      paymentDetails = { sbp: process.env.BANK_PAYMENT_SBP };
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
      return await this.transactionService.confirmTransactionAsUser(
        transaction_id
      );
    } catch (error) {
      console.log(error);
      throw new NotFoundException("Transaction was not found!");
    }
  }
}
