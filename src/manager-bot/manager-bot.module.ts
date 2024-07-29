import { Module, forwardRef } from "@nestjs/common";
import { AdminModule } from "src/admin/admin.module";
import { RedisService } from "src/redis/redis.service";
import { AdminBotService } from "./manager-bot.service";
import { TransactionModule } from "src/transaction/transaction.module";
import { WithdrawHistoryModule } from "src/withdraw-history/withdraw-history.module";
import { UsersModule } from "src/user/user.module";

@Module({
  imports: [forwardRef(() => AdminModule), forwardRef(() => UsersModule), forwardRef(() => TransactionModule), forwardRef(() => WithdrawHistoryModule)],
  providers: [AdminBotService, RedisService],
  exports: [AdminBotService],
})
export class ManagerBotModule {}
