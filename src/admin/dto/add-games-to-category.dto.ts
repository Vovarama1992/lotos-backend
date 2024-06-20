import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from "class-validator";

class AddGameToCategoryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  game_id: string;

  @ApiProperty()
  @IsInt()
  order: number;
}

export class AddGamesToCategoryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ type: AddGameToCategoryDto, isArray: true })
  @ValidateNested({ each: true })
  @Type(() => AddGameToCategoryDto)
  games: AddGameToCategoryDto[];
}
