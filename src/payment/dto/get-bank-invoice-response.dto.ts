import { Transaction } from "src/transaction/entities/transaction.entity";
import { BankInvoice } from "../entities/bankInvoice.entity";
import { ApiProperty } from "@nestjs/swagger";

export class GetBankInvoiceResponseDto {
  @ApiProperty({ type: () => BankInvoice })
  invoice: BankInvoice;
  
  @ApiProperty({ type: () => Transaction })
  transaction: Transaction;
}
