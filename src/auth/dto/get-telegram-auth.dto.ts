import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsUUID } from "class-validator";

export class GetTelegramAuthDto {
  @ApiProperty()
  id: number;
  @ApiProperty()
  first_name: string;
  @ApiProperty()
  last_name: string;
  @ApiProperty()
  username: string;
  @ApiProperty()
  photo_url: string;
  @ApiProperty()
  auth_date: number;
  @ApiProperty()
  hash: string;

  @ApiProperty()
  @IsOptional()
  @IsUUID()
  referral_invitation_id?: string;

  @ApiProperty()
  @IsOptional()
  @IsUUID()
  user_referral_id?: string;
}
