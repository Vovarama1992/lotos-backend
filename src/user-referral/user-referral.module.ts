import { Module, forwardRef } from "@nestjs/common";

import { TypeOrmModule } from "@nestjs/typeorm";
import { UserReferral } from "./entities/user-referral.entity";
import { UserReferralService } from "./user-referral.service";
import { UsersModule } from "src/user/user.module";
import { UserReferralController } from "./user-referral.controller";
import { User } from "src/user/entities/user.entity";

@Module({
  imports: [TypeOrmModule.forFeature([UserReferral, User])],
  controllers: [UserReferralController],
  providers: [UserReferralService],
  exports: [UserReferralService],
})
export class UserReferralModule {}
