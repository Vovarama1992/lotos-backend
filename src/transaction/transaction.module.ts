import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersModule } from "src/user/user.module";
import { Transaction } from "./entities/transaction.entity";
import { TransactionController } from "./transaction.controller";
import { TransactionService } from "./transaction.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction]),
    forwardRef(() => UsersModule),
  ],
  controllers: [TransactionController],
  providers: [TransactionService],
  exports: [TransactionService],
})
export class TransactionModule {}
