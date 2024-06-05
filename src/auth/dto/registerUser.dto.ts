import { ApiProperty } from "@nestjs/swagger";
import {
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
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty()
  @IsOptional()
  @IsUUID()
  referral_invitation_id?: string;

  @ApiProperty()
  @IsOptional()
  @IsUUID()
  user_referral_id?: string;
}

export class CheckUserRegister {
  email?: string;
  phone?: string;
}
