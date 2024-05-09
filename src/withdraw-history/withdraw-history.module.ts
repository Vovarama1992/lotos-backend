import { Module, forwardRef } from "@nestjs/common";
import { WithdrawHistoryService } from "./withdraw-history.service";
import { WithdrawHistoryController } from "./withdraw-history.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Withdraw } from "./entities/withdraw-history.entity";
import { UsersModule } from "src/user/user.module";
import { User } from "src/user/entities/user.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Withdraw])],
  controllers: [WithdrawHistoryController],
  providers: [WithdrawHistoryService],
  exports: [WithdrawHistoryService],
})
export class WithdrawHistoryModule {}
