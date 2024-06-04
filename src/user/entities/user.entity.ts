import {
  Entity,
  Column,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
  OneToMany,
  ManyToMany,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { UserRole } from "src/constants";
import { Transaction } from "src/transaction/entities/transaction.entity";
import { Withdraw } from "src/withdraw-history/entities/withdraw-history.entity";
import { Notification } from "src/notification/entities/notification.entity";

export enum UserGender {
  MALE = "male",
  FEMALE = "female",
}

@Entity("user")
export class User {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({ example: "username" })
  @Column({ nullable: true })
  username: string;

  @ApiProperty({ example: "Alexey" })
  @Column({ nullable: true })
  name: string;

  @ApiProperty({ example: "Nosov", nullable: true })
  @Column({ nullable: true })
  surname: string;

  @ApiProperty({ example: new Date(), nullable: true, type: Date })
  @Column({ nullable: true, type: "date" })
  dob: string;

  @ApiProperty({ example: UserGender.MALE, nullable: true, enum: UserGender })
  @Column({ nullable: true, enum: UserGender })
  gender: UserGender;

  @ApiProperty({ example: "Russia", nullable: true })
  @Column({ nullable: true, type: "varchar" })
  country: string;

  @ApiProperty({ example: "Moscow", nullable: true })
  @Column({ nullable: true })
  city: string;

  @ApiProperty({ example: "The Kremlin", nullable: true })
  @Column({ nullable: true })
  address: string;

  @ApiProperty({ example: "123456", nullable: true })
  @Column({ nullable: true })
  zip: string;

  @ApiProperty({ example: 123, nullable: true })
  @ManyToOne(() => User, (user) => user.referrals, {
    cascade: true,
  })
  manager: User;

  @OneToMany(() => User, (user) => user.manager)
  referrals: User[];

  @ApiProperty({ example: 100 })
  @Column({ type: "double precision", default: 200 })
  balance: number;

  @ApiProperty({ example: UserRole.USER })
  @Column({ default: UserRole.USER })
  role: UserRole;

  @ApiProperty({ example: 50 })
  @Column({ default: 0 })
  earned: number;

  @ApiProperty({ example: 50 })
  @Column({ default: 0, type: "double precision" })
  totalLoss: number;

  @ApiProperty({ example: 50 })
  @Column({ default: 0, type: "double precision" })
  lastTotalLoss: number;

  @ApiProperty({ example: "+79991234567", nullable: true })
  @Column({ nullable: true })
  phone: string;

  @ApiProperty({ example: "test@gmail.com", nullable: true })
  @Column({ nullable: true, unique: true })
  email: string;

  @ApiProperty({ example: false })
  @Column({ default: false })
  isBan: boolean;

  @ApiProperty({ example: 1532412312, nullable: true })
  @Column({
    nullable: true,
  })
  telegram_id: number;

  @ApiProperty({ nullable: true })
  @Column({ nullable: true, select: false })
  password: string;

  @ApiProperty({ nullable: true })
  @Column({ nullable: true, select: false })
  secretCode: string;

  @ApiProperty({ nullable: true })
  @Column({ default: false, nullable: true })
  bonusAutoActivation: boolean;

  @ApiProperty({ type: () => Transaction, isArray: true })
  @OneToMany(() => Transaction, (transaction) => transaction.user, {
    cascade: true,
  })
  transactions: Transaction[];

  @ApiProperty({ type: () => Withdraw, isArray: true })
  @OneToMany(() => Withdraw, (withdraw) => withdraw.user, { cascade: true })
  withdrawHistory: Withdraw[];

  @ApiProperty({ type: () => Notification, isArray: true })
  @OneToMany(() => Notification, (notification) => notification.user, {
    cascade: true,
    onDelete: "CASCADE",
  })
  notifications: Notification[];
}
