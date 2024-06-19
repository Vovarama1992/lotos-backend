import { TransactionType } from "src/transaction/entities/transaction.entity";

export class SendIncomingMessage {
  transaction_id: string;
  user_email: string;
  type: TransactionType;
  amount: number;
  timestamp: Date | string;
  recipient_payment_info: string;
  
  constructor(transaction: Partial<SendIncomingMessage>) {
    Object.assign(this, transaction);
  }
}
