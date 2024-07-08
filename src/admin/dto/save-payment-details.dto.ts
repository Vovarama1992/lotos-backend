import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from "class-validator";
import { DepositMode } from "src/config/entities/config.entity";
import { PaymentDetailType } from "src/payment/entities/paymentDetails.entity";

export class SavePaymentDetailsDto {
  @ApiProperty({ type: () => PaymentDetailsDto, isArray: true })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentDetailsDto)
  data: PaymentDetailsDto[];
}

class PaymentDetailsDto {
  @ApiProperty({ type: "string" })
  @IsOptional()
  @IsString()
  //@IsUUID()
  id: string;

  @ApiProperty({ type: "string" })
  @IsString()
  @IsNotEmpty()
  bank: string;

  @ApiProperty({ type: "string" })
  @IsString()
  @IsNotEmpty()
  data: string;

  @ApiProperty()
  @IsOptional()
  @IsEnum(DepositMode)
  mode?: DepositMode;

  @ApiProperty({ enum: PaymentDetailType })
  @IsEnum(PaymentDetailType)
  type: PaymentDetailType;
}

// class CardDetails {
//   @ApiProperty({ type: "string" })
//   @IsOptional()
//   @IsUUID()
//   id: string;

//   @ApiProperty({ type: "string" })
//   @IsString()
//   @IsNotEmpty()
//   bank: string;

//   @ApiProperty({ type: "string" })
//   @IsString()
//   @IsNotEmpty()
//   card: string;
// }

// class SbpDetails {
//   @ApiProperty({ type: "string" })
//   @IsOptional()
//   @IsUUID()
//   id: string;

//   @ApiProperty({ type: "string" })
//   @IsString()
//   @IsNotEmpty()
//   bank: string;

//   @ApiProperty({ type: "string" })
//   @IsString()
//   @IsNotEmpty()
//   tel: string;
// }
