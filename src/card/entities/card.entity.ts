import {
  Entity,
  Column,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn
} from 'typeorm';
import { ApiProperty } from "@nestjs/swagger"

@Entity('card')
export class Card {

  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ApiProperty({ example: 123 })
  @Column()
  cardNumber: string

  @ApiProperty({ example: 10 })
  @Column()
  name: string

  @ApiProperty({ example: 10 })
  @Column({ default: true })
  isActive: boolean

}
