import { PaymentDetails } from "src/payment/entities/paymentDetails.entity";
import { TransactionType } from "src/transaction/entities/transaction.entity";

export class SendIncomingMessage {
  transaction_id: string;
  user_email: string | null;
  user_tg: string | null;
  user_tel: string | null;
  type: TransactionType;
  amount: number;
  timestamp: Date | string;
  recipient_payment_info: string;
  payment_details: PaymentDetails
  sender_name: string;

  constructor(transaction: Partial<SendIncomingMessage>) {
    Object.assign(this, transaction);
  }
}
