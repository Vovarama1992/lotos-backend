import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from "@nestjs/common";
import { ReferralInviteService } from "./referral-invite.service";
import { CreateReferralInviteDto } from "./dto/create-referral-invite.dto";
import { UpdateReferralInviteDto } from "./dto/update-referral-invite.dto";
import { RolesGuard } from "src/auth/guard/role.guard";
import { UserRole } from "src/constants";
import { Roles } from "src/auth/decorator/roles.decorator";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { ReferralInvite } from "./entities/referral-invite.entity";

@UseGuards(RolesGuard)
@Controller("referral-invite")
export class ReferralInviteController {
  constructor(private readonly referralInviteService: ReferralInviteService) {}

  @Post()
  @Roles([UserRole.MANAGER])
  create(
    @Body() createReferralInviteDto: CreateReferralInviteDto,
    @Req() req: any
  ) {
    return this.referralInviteService.create(
      req.user.id,
      createReferralInviteDto
    );
  }

  @Post(":id")
  acceptReferralInvitation(@Param("id") id: string) {
    return this.referralInviteService.acceptReferralInvitation(id);
  }

  @Get()
  @ApiOperation({description: "Получение всех реферальных ссылок"})
  @ApiOkResponse({type: ReferralInvite, isArray: true})
  @Roles([UserRole.MANAGER])
  findAll(@Req() req: any) {
    return this.referralInviteService.findAll(req.user.id);
  }

  @Get(":id")
  @Roles([UserRole.MANAGER])
  findOne(@Param("id") id: string) {
    return this.referralInviteService.findOne(id);
  }

  // @Patch(":id")
  // update(
  //   @Param("id") id: string,
  //   @Body() updateReferralInviteDto: UpdateReferralInviteDto
  // ) {
  //   return this.referralInviteService.update(+id, updateReferralInviteDto);
  // }

  @Delete(":id")
  @Roles([UserRole.MANAGER])
  remove(@Param("id") id: string) {
    return this.referralInviteService.remove(id);
  }
}
