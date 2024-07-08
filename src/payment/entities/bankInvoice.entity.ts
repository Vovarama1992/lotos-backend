import { ApiProperty } from "@nestjs/swagger";
import { PaymentDetails } from "./paymentDetails.entity";

export class PaymentDetailsDto {
  @ApiProperty({ required: false })
  card?: string;

  @ApiProperty({ required: false })
  sbp?: string;
  
  @ApiProperty({ required: false })
  crypto_address?: string;
}

export class BankInvoice {
  @ApiProperty()
  amount: number;

  @ApiProperty({ type: Date })
  timestamp: Date;

  @ApiProperty()
  currency: string;

  @ApiProperty({ type: () => PaymentDetails })
  payment_details: PaymentDetails;

  constructor(invoice: Partial<BankInvoice>) {
    Object.assign(this, invoice);
  }
}
