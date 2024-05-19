import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  ValidateNested,
} from "class-validator";

class SaveGamePlacement {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  game_placement_id: string;

  @ApiProperty()
  @IsNumber()
  @IsInt()
  order: number;
}

export class SaveGamesPlacementDto {
  @IsString()
  @IsNotEmpty()
  category: string;
  
  @ApiProperty({ type: SaveGamePlacement, isArray: true })
  @ValidateNested({ each: true })
  @Type(() => SaveGamePlacement)
  games: SaveGamePlacement[];
}
