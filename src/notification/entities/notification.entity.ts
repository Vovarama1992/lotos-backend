import { ApiProperty } from "@nestjs/swagger";
import { User } from "src/user/entities/user.entity";
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn
} from "typeorm";

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

  @ApiProperty({ type: Date })
  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" }) // Recommended
  timestamp: string;

  constructor(transaction: Partial<Notification>) {
    Object.assign(this, transaction);
  }
}
