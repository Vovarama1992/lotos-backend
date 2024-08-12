import { Module } from "@nestjs/common";
import { TransactionLogService } from "./transaction-log.service";
import { TransactionLog } from "./entities/transaction-log.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "src/user/entities/user.entity";

@Module({
  imports: [TypeOrmModule.forFeature([TransactionLog, User])],
  providers: [TransactionLogService],
  exports: [TransactionLogService]
})
export class TransactionLogModule {}
