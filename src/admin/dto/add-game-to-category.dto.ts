import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class AddGameToCategoryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  game_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty()
  @IsNumber()
  @IsInt()
  order: number;
}
