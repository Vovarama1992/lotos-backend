import { ApiProperty } from "@nestjs/swagger";
import { PaymentDetails } from "src/payment/entities/paymentDetails.entity";
import { User } from "src/user/entities/user.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

export enum TransactionStatus {
  SUCCESS = "success",
  FAILED = "failed",
  PENDING = "pending",
  WAITING_CONFIRMATION = "waiting_confirmation",
  CANCELLED = "cancelled",
}

export enum TransactionType {
  CARD = "card",
  SBP = "sbp",
  CRYPTO = "crypto",
  CASHBACK = "cashback",
}

@Entity("transaction")
export class Transaction {
  @ApiProperty()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty()
  @Column({ unique: true })
  invoice_id: string;

  @ApiProperty({ type: () => User })
  @ManyToOne(() => User, (user) => user.transactions, { onDelete: "CASCADE" })
  user: User;

  @ApiProperty({ type: Date })
  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" }) // Recommended
  timestamp: string;

  @ApiProperty({ enum: TransactionType })
  @Column({ enum: TransactionType })
  type: TransactionType;

  @ApiProperty()
  @Column()
  method: string;

  @ApiProperty()
  @Column({ type: "double precision", default: 0 })
  amount: number;

  @ApiProperty()
  @Column({ nullable: false, default: "" })
  sender_name: string;

  @ApiProperty()
  @Column({ nullable: true })
  recipient_payment_info: string;

  @ApiProperty()
  @ManyToOne(() => PaymentDetails, (p) => p.transactions, {
    onDelete: "SET NULL",
    nullable: true,
  })
  payment_details: PaymentDetails;

  @ApiProperty({ enum: TransactionStatus })
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

export class GetTransactionResponse {
  @ApiProperty()
  count: number;

  @ApiProperty({ type: () => Transaction, isArray: true })
  data: Transaction[];
}
