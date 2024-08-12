import { User } from "src/user/entities/user.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

export enum TransactionLogType {
  DEPOSIT,
  WITHDRAWAL,
}

export enum TransactionLogAction {
  ACCEPT,
  DECLINE,
}

@Entity("transaction-log")
export class TransactionLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: true })
  message: string;

  @ManyToOne(() => User, (user) => user.transactionLogsAsManager, {
    onDelete: "CASCADE",
  })
  manager: User;

  @ManyToOne(() => User, (user) => user.transactionLogsAsUser, {
    onDelete: "CASCADE",
  })
  user: User;

  @Column({ type: "double precision", default: 0 })
  amount: number;

  @Column({ type: "uuid" })
  transaction_id: string;

  @Column({ enum: TransactionLogType })
  type: TransactionLogType;

  @Column({ enum: TransactionLogAction })
  action: TransactionLogAction;

  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" }) // Recommended
  timestamp: string;

  constructor(transactionLog: Partial<TransactionLog>) {
    Object.assign(this, transactionLog);
  }
}
