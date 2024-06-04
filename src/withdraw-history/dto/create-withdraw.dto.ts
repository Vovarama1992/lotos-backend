import { PaymentDetailsDto } from "src/payment/entities/bankInvoice.entity";
import { User } from "src/user/entities/user.entity";
import { WithdrawMethod } from "../entities/withdraw-history.entity";

export class CreateWithdrawDto {
  amount: number;
  method: WithdrawMethod;
  payment_details: PaymentDetailsDto;
  user: User;
}
