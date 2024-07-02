import { ApiProperty } from "@nestjs/swagger";
import { User } from "src/user/entities/user.entity";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { DepositSession } from "./depositSession.entity";

export enum PaymentDetailType {
  CARD,
  SBP,
}

@Entity("payment-details")
export class PaymentDetails {
  @ApiProperty()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ enum: PaymentDetailType })
  type: PaymentDetailType;

  @ApiProperty()
  @Column()
  data: string;

  @ApiProperty()
  @Column()
  bank: string;

  @Column({default: 1})
  priority: number;

  @OneToMany(() => DepositSession, (depositSession) => depositSession.card, {
    cascade: true,
    onDelete: "CASCADE"
  })
  deposit_sessions: DepositSession[];

  constructor(data: Partial<PaymentDetails>) {
    Object.assign(this, data);
  }
}
