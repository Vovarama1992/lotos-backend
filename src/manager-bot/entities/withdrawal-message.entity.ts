import { PaymentDetailsDto } from "src/payment/entities/bankInvoice.entity";
import { WithdrawMethod } from "src/withdraw-history/entities/withdraw-history.entity";

export class SendWithdrawalMessage {
  withdrawal_id: string;
  user_email: string;
  method: WithdrawMethod;
  amount: number;
  timestamp: Date | string;
  payment_details: PaymentDetailsDto;
  currency?: string;

  constructor(transaction: Partial<SendWithdrawalMessage>) {
    Object.assign(this, transaction);
  }
}
