import { ApiProperty } from "@nestjs/swagger";
import { User } from "src/user/entities/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { PaymentDetails } from "./paymentDetails.entity";

@Entity("deposit-session")
export class DepositSession {
  @ApiProperty()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({ type: () => User })
  @ManyToOne(() => User, (user) => user.transactions, { onDelete: "CASCADE" })
  user: User;

  @ApiProperty()
  @Column()
  amount: number;

  @CreateDateColumn()
  created_at: Date;

  @ApiProperty()
  @ManyToOne(
    () => PaymentDetails,
    (paymentDetails) => paymentDetails.deposit_sessions,
    { onDelete: "CASCADE" }
  )
  card: PaymentDetails;

  @ApiProperty({ type: Date })
  @Column({ type: "timestamptz" })
  expiration_date: string;

  constructor(data: Partial<DepositSession>) {
    Object.assign(this, data);
  }
}
