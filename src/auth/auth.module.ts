import { Module, forwardRef } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { UsersModule } from "src/user/user.module";
//import { MailModule } from 'src/mail/mail.module';
import { RedisService } from "src/redis/redis.service";
import { ReferralInviteModule } from "src/referral-invite/referral-invite.module";
import { UserReferralModule } from "src/user-referral/user-referral.module";
import { MailModule } from "src/mail/mail.module";
import { ConfigService } from "src/config/config.service";
import { ConfigModule } from "src/config/entities/config.module";
@Module({
  imports: [
    forwardRef(() => UsersModule),
    forwardRef(() => ReferralInviteModule),
    forwardRef(() => UserReferralModule),
    forwardRef(() => MailModule),
    forwardRef(() => ConfigModule),
  ],
  providers: [AuthService, RedisService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
