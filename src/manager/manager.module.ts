import { Module, forwardRef } from "@nestjs/common";
import { ManagerService } from "./manager.service";
import { ManagerController } from "./manager.controller";
import { TransactionModule } from "src/transaction/transaction.module";
import { WithdrawHistoryModule } from "src/withdraw-history/withdraw-history.module";
import { User } from "src/user/entities/user.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NotificationModule } from "src/notification/notification.module";
import { FinancialStatsModule } from "src/financial-stats/financial-stats.module";
import { UsersModule } from "src/user/user.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    NotificationModule,
    forwardRef(() => TransactionModule),
    forwardRef(() => FinancialStatsModule),
    forwardRef(() => UsersModule),
    WithdrawHistoryModule,
  ],
  controllers: [ManagerController],
  providers: [ManagerService],
})
export class ManagerModule {}
