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

  @ManyToOne(() => User, (user) => user.referrals, { onDelete: "CASCADE" })
  manager: User;

  @ApiProperty()
  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" }) // Recommended
  created_at: Date;

  @ApiProperty()
  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" }) // Recommended
  expire_date: string;

  @ApiProperty()
  @Column({ type: "boolean", default: false })
  is_used: boolean;

  @ApiProperty()
  link: string;

  @ApiProperty()
  tg_link: string;

  public constructor(data: Partial<ReferralInvite>) {
    Object.assign(this, data);
  }
}
