import { ApiProperty } from "@nestjs/swagger";
import { User } from "src/user/entities/user.entity";
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("referral-invite")
export class ReferralInvite {
  @ApiProperty({ example: "uuid" })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, (user) => user.referrals)
  manager: User;

  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" }) // Recommended
  created_at: Date;

  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" }) // Recommended
  expire_date: string;

  @Column({ type: "boolean", default: false })
  is_used: boolean;

  public constructor(data: Partial<ReferralInvite>) {
    Object.assign(this, data);
  }
}
