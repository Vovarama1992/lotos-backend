import {
  Entity,
  Column,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn
} from 'typeorm';
import { ApiProperty } from "@nestjs/swagger"
import { UserRole } from 'src/constants';

@Entity('user')
export class User {

  @ApiProperty({ example: 1 })
	@PrimaryGeneratedColumn('uuid')
	id: string

	@ApiProperty({ example: "Alexey" })
	@Column({nullable: true})
	name: string

	@ApiProperty({ example: 123, nullable: true })
	@Column({ nullable: true })
	referral_id: string

	@ManyToOne(() => User, { nullable: true })
	@JoinColumn({ name: "referral_id" })
	referral: User

	@ApiProperty({ example: 100 })
	@Column({ type: 'double precision', default: 200 })
	balance: number

  @ApiProperty({ example: UserRole.USER })
	@Column({ default: UserRole.USER })
	role: UserRole

	@ApiProperty({ example: 50 })
	@Column({ default: 0 })
	earned: number

	@ApiProperty({ example: "+79991234567", nullable: true })
	@Column({ nullable: true })
	phone: string

	@ApiProperty({ example: "test@gmail.com", nullable: true })
	@Column({ nullable: true })
	email: string

	@ApiProperty({ example: false })
	@Column({ default: false })
	isBan: boolean

	@ApiProperty({ example: 1532412312, nullable: true })
	@Column({
		nullable: true,
	})
	telegram_id: number

	@ApiProperty({ nullable: true })
	@Column({ nullable: true, select: false})
	password: string


	@ApiProperty({ nullable: true })
	@Column({ nullable: true, select: false })
	secretCode: string

}
