import { Module, forwardRef } from "@nestjs/common";
import { PaymentService } from "./payment.service";
import { PaymentController } from "./payment.controller";
import { CryptocloudService } from "src/cryptocloud/cryptocloud.service";
import { UserService } from "src/user/user.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "src/user/entities/user.entity";
import { SocketService } from "src/gateway/gateway.service";
import { UsersModule } from "src/user/user.module";

@Module({
  imports: [forwardRef(() => UsersModule)],
  controllers: [PaymentController],
  providers: [PaymentService, CryptocloudService],
})
export class PaymentModule {}
