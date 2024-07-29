import { ApiProperty } from "@nestjs/swagger";
import { User } from "src/user/entities/user.entity";
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { DepositSession } from "./depositSession.entity";
import { DepositMode } from "src/config/entities/config.entity";
import { IsEnum } from "class-validator";
import { Transaction } from "src/transaction/entities/transaction.entity";

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

  @ApiProperty()
  @Column({ enum: DepositMode, default: DepositMode.MANUAL })
  mode: DepositMode;

  @ApiProperty()
  @Column({ default: 1 })
  priority: number;

  @ApiProperty()
  @Column({default: ""})
  recipient_name: string;

  @OneToMany(() => DepositSession, (depositSession) => depositSession.card, {
    cascade: true,
    onDelete: "CASCADE",
  })
  deposit_sessions: DepositSession[];

  @OneToMany(() => Transaction, (transaction) => transaction.payment_details, {
    cascade: true,
    onDelete: "CASCADE",
  })
  transactions: Transaction[];

  constructor(data: Partial<PaymentDetails>) {
    Object.assign(this, data);
  }
}
