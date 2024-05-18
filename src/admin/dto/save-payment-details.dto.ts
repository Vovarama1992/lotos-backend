import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsString, ValidateNested } from "class-validator";

export class SavePaymentDetailsDto {
  @ApiProperty({ type: () => CardDetails, isArray: true })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CardDetails)
  card: CardDetails[];

  @ApiProperty({ type: () => SbpDetails, isArray: true })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SbpDetails)
  sbp: SbpDetails[];
}

class CardDetails {
  @ApiProperty({ type: "string" })
  @IsString()
  @IsNotEmpty()
  bank: string;

  @ApiProperty({ type: "string" })
  @IsString()
  @IsNotEmpty()
  card: string;
}

class SbpDetails {
  @ApiProperty({ type: "string" })
  @IsString()
  @IsNotEmpty()
  bank: string;

  @ApiProperty({ type: "string" })
  @IsString()
  @IsNotEmpty()
  tel: string;
}
