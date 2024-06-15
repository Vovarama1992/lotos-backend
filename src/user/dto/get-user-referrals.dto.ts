import { ApiProperty } from "@nestjs/swagger";

export class UserWithLevel {
  @ApiProperty()
  id: string;
  @ApiProperty()
  username: string;
  @ApiProperty()
  name: string;
  @ApiProperty()
  email: string;
  @ApiProperty()
  totalEarned: number;
  @ApiProperty()
  lastTotalEarned: number;
  @ApiProperty()
  totalLoss: number;
  @ApiProperty()
  lastTotalLoss: number;
  @ApiProperty()
  level: number;
}

export class ReferralStats {
  @ApiProperty()
  userQuantity: number;
  @ApiProperty()
  lostAmount: number;
  @ApiProperty()
  wonAmount: number;
}

export class GetUserReferralsDto {
  @ApiProperty({ type: ReferralStats })
  stats: ReferralStats;
  @ApiProperty({ isArray: true, type: UserWithLevel })
  users: UserWithLevel[];
}
