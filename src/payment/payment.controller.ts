import {
  Body,
  Controller,
  ForbiddenException,
  Post,
  Req
} from "@nestjs/common";
import { CryptocloudService } from "src/cryptocloud/cryptocloud.service";
import { TransactionStatus } from "src/user/entities/transaction.entity";
import { UserService } from "src/user/user.service";
import CreateCryptoInvoiceDto from "./dto/create-crypto-invoice.dto";
import { PaymentService } from "./payment.service";

@Controller("payment")
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly cryptoCloudService: CryptocloudService,
    private readonly userService: UserService
  ) {}

  @Post("crypto")
  async createCryptoInvoice(
    @Body() createCryptoInvoiceDto: CreateCryptoInvoiceDto,
    @Req() req: any
  ) {
    const invoice = await this.cryptoCloudService.createInvoice({
      order_id: req.user.id,
      ...createCryptoInvoiceDto,
    });

    console.log(invoice);

    const transaction = await this.userService.addTransaction(req.user.id, {
      invoice_id: invoice.result.uuid,
      amount: createCryptoInvoiceDto.amount,
      method: "crypto",
      type: "crypto",
      status: TransactionStatus.PENDING,
    });

    return {invoice, transaction};
  }

  @Post("callback")
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
      await this.userService.completeTransaction(invoice.uuid);
    }
  }
}
