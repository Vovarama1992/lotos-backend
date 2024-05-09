import { ApiProperty } from "@nestjs/swagger";

export class PaymentDetailsDto {
  @ApiProperty({ required: false })
  card?: string;

  @ApiProperty({ required: false })
  sbp?: string;
}

export class BankInvoice {
  @ApiProperty()
  amount: number;

  @ApiProperty({ type: Date })
  timestamp: Date;

  @ApiProperty()
  currency: string;

  @ApiProperty({ type: () => PaymentDetailsDto })
  payment_details: PaymentDetailsDto;

  constructor(invoice: Partial<BankInvoice>) {
    Object.assign(this, invoice);
  }
}
