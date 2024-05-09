import { ApiProperty } from "@nestjs/swagger";
import {
  TransactionStatus,
  TransactionType,
} from "src/transaction/entities/transaction.entity";

export class CreateTransactionDto {
  @ApiProperty()
  invoice_id: string;

  @ApiProperty({ enum: TransactionType })
  type: TransactionType;

  @ApiProperty()
  method: string;

  @ApiProperty()
  amount: number;

  @ApiProperty({ enum: TransactionStatus })
  status: TransactionStatus;

  constructor(transaction: Partial<CreateTransactionDto>) {
    Object.assign(this, transaction);
  }
}
