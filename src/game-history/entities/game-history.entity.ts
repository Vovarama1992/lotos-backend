import {
  Entity,
  Column,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn
} from 'typeorm';
import { ApiProperty } from "@nestjs/swagger"
import { AppEntity } from 'src/base/BaseEntity';

@Entity('gameHistory')
export class GameHistory extends AppEntity {

  @ApiProperty({ example: 123 })
  @Column()
  userId: string

  @ApiProperty({ example: 10 })
  @Column()
  sessionId: number

  @Column({ default: false })
  isStarted: boolean

}
