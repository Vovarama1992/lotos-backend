import { Module, forwardRef } from "@nestjs/common";
import { PaymentService } from "./payment.service";
import { PaymentController } from "./payment.controller";
import { CryptocloudService } from "src/cryptocloud/cryptocloud.service";
import { UserService } from "src/user/user.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "src/user/entities/user.entity";
import { SocketService } from "src/gateway/gateway.service";
import { UsersModule } from "src/user/user.module";
import { TransactionModule } from "src/transaction/transaction.module";
import { RedisService } from "src/redis/redis.service";

@Module({
  imports: [forwardRef(() => UsersModule), TransactionModule],
  controllers: [PaymentController],
  providers: [PaymentService, CryptocloudService, RedisService],
})
export class PaymentModule {}
