import { Module, forwardRef } from "@nestjs/common";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";

import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { AuthModule } from "src/auth/auth.module";
import { GameHistoryModule } from "src/game-history/game-history.module";
import { GatewayModule } from "src/gateway/gateway.module";
import { TransactionModule } from "src/transaction/transaction.module";
import { Transaction } from "src/transaction/entities/transaction.entity";
import { WithdrawHistoryModule } from "src/withdraw-history/withdraw-history.module";
import { Withdraw } from "src/withdraw-history/entities/withdraw-history.entity";
import { NotificationModule } from "src/notification/notification.module";
import { UserReferralModule } from "src/user-referral/user-referral.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Transaction, Withdraw]),
    forwardRef(() => GameHistoryModule),
    forwardRef(() => AuthModule),
    forwardRef(() => GatewayModule),
    forwardRef(() => TransactionModule),
    forwardRef(() => WithdrawHistoryModule),
    forwardRef(() => NotificationModule),
    forwardRef(() => UserReferralModule),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UsersModule {}
