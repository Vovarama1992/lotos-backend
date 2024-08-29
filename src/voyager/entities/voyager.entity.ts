import { User } from "src/user/entities/user.entity";
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("voyager")
export class Voyager {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, { cascade: true })
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  @Column({ type: "double precision" })
  amount: number;

  public constructor(data: Partial<Voyager>) {
    Object.assign(this, data);
  }
}
