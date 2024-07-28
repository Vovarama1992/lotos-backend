import { Module } from "@nestjs/common";

import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigService } from "src/config/config.service";
import { User } from "src/user/entities/user.entity";
import { UserReferral } from "./entities/user-referral.entity";
import { UserReferralController } from "./user-referral.controller";
import { UserReferralService } from "./user-referral.service";
import { ConfigModule } from "src/config/entities/config.module";
import { Transaction } from "src/transaction/entities/transaction.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([UserReferral, User, Transaction]),
    ConfigModule,
  ],
  controllers: [UserReferralController],
  providers: [UserReferralService],
  exports: [UserReferralService],
})
export class UserReferralModule {}
