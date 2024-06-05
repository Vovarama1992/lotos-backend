import {
    Body,
    Controller,
    Get,
    Post
} from "@nestjs/common";
import {
    ApiTags
} from "@nestjs/swagger";
import { UserReferralService } from "./user-referral.service";

@Controller("user-referral")
export class UserReferralController {
  constructor(private readonly userReferralService: UserReferralService) {}

  @Post("test")
  addUserReferral(@Body() data: any){
    return this.userReferralService.addReferral(data.userId, data.referralId);
  }

  // @Get("get-levels")
  // getLevels(@Body() data: any){
  //   return this.userReferralService.test(data.userId);
  // }
}
