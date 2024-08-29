import { Module, forwardRef } from "@nestjs/common";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "src/auth/auth.module";
import { GameHistoryModule } from "src/game-history/game-history.module";
import { GatewayModule } from "src/gateway/gateway.module";
import { NotificationModule } from "src/notification/notification.module";
import { Transaction } from "src/transaction/entities/transaction.entity";
import { TransactionModule } from "src/transaction/transaction.module";
import { UserReferralModule } from "src/user-referral/user-referral.module";
import { Withdraw } from "src/withdraw-history/entities/withdraw-history.entity";
import { WithdrawHistoryModule } from "src/withdraw-history/withdraw-history.module";
import { User } from "./entities/user.entity";
import { ConfigModule } from "src/config/entities/config.module";
import { VoyagerModule } from "src/voyager/voyager.module";

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
    forwardRef(() => ConfigModule),
    forwardRef(() => VoyagerModule),


  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UsersModule {}
