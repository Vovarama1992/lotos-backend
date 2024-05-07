import { TransactionStatus } from "../entities/transaction.entity";

export class CreateTransactionDto {
  invoice_id: string;
  type: string;
  method: string;
  amount: number;
  status: TransactionStatus;

  constructor(transaction: Partial<CreateTransactionDto>) {
    Object.assign(this, transaction);
  }
}
