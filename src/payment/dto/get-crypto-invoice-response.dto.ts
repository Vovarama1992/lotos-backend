import { ApiProperty } from "@nestjs/swagger";
import { Transaction } from "src/transaction/entities/transaction.entity";
import { CryptoInvoiceDto } from "./crypto-invoice.dto";

export class GetCryptoInvoiceResponseDto {
  @ApiProperty({ type: () => CryptoInvoiceDto })
  invoice: CryptoInvoiceDto;
  
  @ApiProperty({ type: () => Transaction })
  transaction: Transaction;
}
