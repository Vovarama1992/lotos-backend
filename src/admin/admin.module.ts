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

@Module({
  imports: [
    TypeOrmModule.forFeature([GamePlacement, User]),
    forwardRef(()=>TransactionModule),
    forwardRef(()=>WithdrawHistoryModule),
    forwardRef(()=>UsersModule),
    forwardRef(()=>NotificationModule),
  ],
  controllers: [AdminController],
  providers: [AdminService, RedisService],
  exports: [AdminService]
})
export class AdminModule {}
