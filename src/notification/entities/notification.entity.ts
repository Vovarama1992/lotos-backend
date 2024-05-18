import {
  Entity,
  Column,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { UserRole } from "src/constants";
import { Transaction } from "src/transaction/entities/transaction.entity";
import { Withdraw } from "src/withdraw-history/entities/withdraw-history.entity";
import { User } from "src/user/entities/user.entity";

export enum NotificationType {
  SYSTEM = "system",
  ADMIN = "admin",
}

export enum NotificationStatus {
  SUCCESS = "system",
  DANGER = "admin",
  WARNING = "warning",
  INFO = "info",
}

@Entity("notification")
export class Notification {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "boolean", default: false })
  isViewed: boolean;

  @ApiProperty({ enum: NotificationType })
  @Column({ enum: NotificationType, default: NotificationType.SYSTEM })
  type: NotificationType;

  @ApiProperty({ type: "string" })
  @Column()
  message: string;

  @ApiProperty({ enum: NotificationStatus })
  @Column({ enum: NotificationStatus })
  status: NotificationStatus;

  @ApiProperty({ type: () => User })
  @ManyToOne(() => User, (user) => user.notifications)
  user: User;

  constructor(transaction: Partial<Notification>) {
    Object.assign(this, transaction);
  }
}
