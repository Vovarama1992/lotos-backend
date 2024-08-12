import { User } from "src/user/entities/user.entity";
import {
  TransactionLogAction,
  TransactionLogType,
} from "../entities/transaction-log.entity";

export class CreateTransactionLogDto {
  manager: User;
  user: User;
  action: TransactionLogAction;
  type: TransactionLogType;
  message?: string;
  transactionId: string;
  amount: number;
}
