import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class GetGamesQuesryDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  provider: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  name: string;
}
