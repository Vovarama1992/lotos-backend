import { ApiProperty } from "@nestjs/swagger";
import { User } from "src/user/entities/user.entity";
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("user-referral")
export class UserReferral {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, { cascade: true })
  @JoinColumn()
  user: User;

  @ManyToOne(() => User, { cascade: true })
  @JoinColumn()
  referral: User;

  @ApiProperty({ example: 1 })
  @Column()
  level: number;

  public constructor(data: Partial<UserReferral>) {
    Object.assign(this, data);
  }
}

export class GetUserReferralsResponse {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 1, description: "1,2 or 3" })
  level: number;

  @ApiProperty({type: User})
  user: User;
}
