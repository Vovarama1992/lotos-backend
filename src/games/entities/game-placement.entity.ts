import { ApiProperty } from "@nestjs/swagger";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("game-placement")
export class GamePlacement {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: false })
  category: string;

  @Column({ nullable: false })
  game_id: string;

  @Column({ type: "bigint" })
  order: number;

  constructor(data: Partial<GamePlacement>) {
    Object.assign(this, data);
  }
}
