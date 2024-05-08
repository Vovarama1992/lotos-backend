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
import { TransactionStatus } from "src/user/entities/transaction.entity";
import { UserService } from "src/user/user.service";
import { v4 as uuid } from "uuid";
import ConfirmBankTransactionDto from "./dto/confirm-bank-transaction.dto";
import CreateBankInvoiceDto from "./dto/create-bank-invoice.dto";
import CreateCryptoInvoiceDto from "./dto/create-crypto-invoice.dto";
import { BankInvoice } from "./entities/bankInvoice.entity";
import { PaymentService } from "./payment.service";

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
  async createCryptoInvoice(
    @Body() createCryptoInvoiceDto: CreateCryptoInvoiceDto,
    @Req() req: any
  ) {
    const invoice = await this.cryptoCloudService.createInvoice({
      order_id: req.user.id,
      currency: "RUB",
      ...createCryptoInvoiceDto,
    });

    console.log(invoice);

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

    // console.log(data);
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
      await this.userService.changeBalance(userId, newBalance);
      await this.transactionService.completeTransaction(invoice.uuid);
    }
  }

  @Post("bank")
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
  async confirmBankTransactionByUser(
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

  @Post("confirm-transaction-as-admin")
  @Roles(["admin", "root"])
  async confirmBankTransactionAsAdmin(
    @Body() confirmBankTransactionDto: ConfirmBankTransactionDto
  ) {
    const { transaction_id } = confirmBankTransactionDto;
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
      } else {
        error = new ForbiddenException("Can not confirm transaction!");
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
}
