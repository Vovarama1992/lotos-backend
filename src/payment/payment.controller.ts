import { Body, Controller, Get, Post, Req } from "@nestjs/common";
import { PaymentService } from "./payment.service";
import CreateCryptoInvoiceDto from "./dto/create-crypto-invoice.dto";
import { CryptocloudService } from "src/cryptocloud/cryptocloud.service";

@Controller("payment")
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly cryptoCloudService: CryptocloudService
  ) {}

  @Post("crypto")
  createCryptoInvoice(
    @Body() createCryptoInvoiceDto: CreateCryptoInvoiceDto,
    @Req() req: any
  ) {
    return this.cryptoCloudService.createInvoice(createCryptoInvoiceDto);
  }

  @Post("callback")
  receivePaymentEvent(@Body() data: any) {
    const { status, invoice_id, amount_crypto, currency, order_id, token } =
      data;

      console.log(data)
  }
}
