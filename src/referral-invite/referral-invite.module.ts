import { Module } from "@nestjs/common";
import { ReferralInviteService } from "./referral-invite.service";
import { ReferralInviteController } from "./referral-invite.controller";
import { User } from "src/user/entities/user.entity";
import { ReferralInvite } from "./entities/referral-invite.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "src/config/entities/config.module";

@Module({
  imports: [TypeOrmModule.forFeature([User, ReferralInvite]), ConfigModule],
  controllers: [ReferralInviteController],
  providers: [ReferralInviteService],
  exports: [ReferralInviteService]
})
export class ReferralInviteModule {}
