import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { UserGender } from "../entities/user.entity";

export class UpdateUserProfileDto {
  @ApiProperty({ example: "test@gmail.com", required: false })
  @IsOptional()
  @IsEmail()
  @IsNotEmpty()
  email?: string;

  @ApiProperty({ example: "Russia", required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  country?: string;

  @ApiProperty({ example: "username", required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  username?: string;

  @ApiProperty({ example: "Moscow", required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  city?: string;

  @ApiProperty({ example: "Alexey" })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiProperty({ example: "Nosov", required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  surname?: string;

  @ApiProperty({ example: "The Kremlin", required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  address?: string;

  @ApiProperty({ example: "123456", required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  zip?: string;

  @ApiProperty({ example: new Date(), required: false, type: Date })
  @IsOptional()
  @IsDateString()
  @IsNotEmpty()
  dob?: string;

  @ApiProperty({ example: "+79991234567", required: false })
  @IsOptional()
  @IsDateString()
  @IsNotEmpty()
  phone?: string;

  @ApiProperty({ example: UserGender.MALE, required: false, enum: UserGender })
  @IsOptional()
  @IsEnum(UserGender)
  @IsNotEmpty()
  gender?: UserGender;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  @IsNotEmpty()
  bonusAutoActivation?: boolean;
}