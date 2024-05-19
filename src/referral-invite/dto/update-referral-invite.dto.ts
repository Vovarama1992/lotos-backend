import { PartialType } from '@nestjs/swagger';
import { CreateReferralInviteDto } from './create-referral-invite.dto';

export class UpdateReferralInviteDto extends PartialType(CreateReferralInviteDto) {}
