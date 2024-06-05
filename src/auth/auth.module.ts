import { Module, forwardRef } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { UsersModule } from "src/user/user.module";
//import { MailModule } from 'src/mail/mail.module';
import { RedisService } from "src/redis/redis.service";
import { ReferralInviteModule } from "src/referral-invite/referral-invite.module";
import { UserReferralModule } from "src/user-referral/user-referral.module";
@Module({
  imports: [
    forwardRef(() => UsersModule),
    forwardRef(() => ReferralInviteModule),
    forwardRef(() => UserReferralModule),
  ],
  providers: [AuthService, RedisService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
