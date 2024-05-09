import { User } from "src/user/entities/user.entity";

export class CreateWithdrawDto {
  amount: number;
  user: User;
}
