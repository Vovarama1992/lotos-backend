import { Module, forwardRef } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { AdminController } from "./admin.controller";
import { TransactionModule } from "src/transaction/transaction.module";
import { WithdrawHistoryModule } from "src/withdraw-history/withdraw-history.module";
import { UsersModule } from "src/user/user.module";
import { RedisService } from "src/redis/redis.service";
import { NotificationModule } from "src/notification/notification.module";
import { GamePlacement } from "src/games/entities/game-placement.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "src/user/entities/user.entity";
import { PaymentDetails } from "src/payment/entities/paymentDetails.entity";
import { ConfigService } from "src/config/config.service";
import { FinancialStatsModule } from "src/financial-stats/financial-stats.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([GamePlacement, User, PaymentDetails]),
    forwardRef(()=>TransactionModule),
    forwardRef(()=>WithdrawHistoryModule),
    forwardRef(()=>UsersModule),
    forwardRef(()=>NotificationModule),
    forwardRef(()=>FinancialStatsModule),
  ],
  controllers: [AdminController],
  providers: [AdminService, RedisService, ConfigService],
  exports: [AdminService]
})
export class AdminModule {}
