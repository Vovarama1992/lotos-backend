import { ApiProperty } from "@nestjs/swagger";
import { User } from "src/user/entities/user.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

export enum WithdrawStatus {
  SUCCESS = "success",
  CANCELL = "cancelled",
  PENDING = "pending",
}

@Entity("withdrawHistory")
export class Withdraw {
  @ApiProperty()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({ type: () => User })
  @ManyToOne(() => User, (user) => user.transactions)
  user: User;

  @ApiProperty({ type: Date })
  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" }) // Recommended
  timestamp: string;

  @ApiProperty()
  @Column()
  amount: number;

  @ApiProperty({ enum: WithdrawStatus })
  @Column({
    type: "enum",
    enum: WithdrawStatus,
    default: WithdrawStatus.PENDING,
  })
  status: WithdrawStatus;

  constructor(transaction: Partial<Withdraw>) {
    Object.assign(this, transaction);
  }
}

export class GetWithdrawHistoryResponse {
  @ApiProperty()
  count: number;
  @ApiProperty({ type: () => Withdraw, isArray: true })
  data: Withdraw[];
}