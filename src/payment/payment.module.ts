import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CryptocloudService } from "src/cryptocloud/cryptocloud.service";
import { GatewayModule } from "src/gateway/gateway.module";
import { NotificationModule } from "src/notification/notification.module";
import { RedisService } from "src/redis/redis.service";
import { TransactionModule } from "src/transaction/transaction.module";
import { UsersModule } from "src/user/user.module";
import { DepositSession } from "./entities/depositSession.entity";
import { PaymentDetails } from "./entities/paymentDetails.entity";
import { PaymentController } from "./payment.controller";
import { PaymentService } from "./payment.service";
import { ConfigService } from "src/config/config.service";
import { AdminModule } from "src/admin/admin.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([DepositSession, PaymentDetails]),
    forwardRef(() => UsersModule),
    forwardRef(() => AdminModule),
    TransactionModule,
    GatewayModule,
    NotificationModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService, CryptocloudService, RedisService, ConfigService],
})
export class PaymentModule {}
