import {
  Column,
  Entity,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./user.entity";

export enum TransactionStatus {
  SUCCESS = "success",
  FAILED = "failed",
  PENDING = "pending",
}

@Entity("transaction")
export class Transaction {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({unique: true})
  invoice_id: string;

  @ManyToOne(() => User, (user) => user.transactions)
  user: User;

  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" }) // Recommended
  timestamp: string;

  @Column()
  type: string;

  @Column()
  method: string;

  @Column()
  amount: number;

  @Column({
    type: "enum",
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  constructor(transaction: Partial<Transaction>) {
    Object.assign(this, transaction);
  }
}
