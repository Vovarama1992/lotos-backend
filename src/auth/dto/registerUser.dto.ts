import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from "class-validator";

export class RegisterUserDto {
  @ApiProperty()
  @IsOptional()
  @IsEmail()
  @IsNotEmpty()
  email?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  phone?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  password?: string;

  @ApiProperty()
  @IsOptional()
  @IsUUID()
  referral_invitation_id?: string;

  @ApiProperty()
  @IsOptional()
  @IsUUID()
  user_referral_id?: string;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  welcome_bonus_activation?: boolean
}

export class CheckUserRegister {
  email?: string;
  phone?: string;
}
