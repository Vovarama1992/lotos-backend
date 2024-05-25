import { ForbiddenException, Injectable } from "@nestjs/common";
import { CreateReferralInviteDto } from "./dto/create-referral-invite.dto";
import { UpdateReferralInviteDto } from "./dto/update-referral-invite.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/user/entities/user.entity";
import { Repository } from "typeorm";
import { ReferralInvite } from "./entities/referral-invite.entity";

@Injectable()
export class ReferralInviteService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(ReferralInvite)
    private readonly referralInviteRepository: Repository<ReferralInvite>
  ) {}

  async acceptReferralInvitation(referralInviteId: string) {
    const referralInvitation =
      await this.referralInviteRepository.findOneOrFail({
        where: {
          id: referralInviteId,
        },
        relations: { manager: true },
      });

    if (new Date() >= new Date(referralInvitation.expire_date)) {
      throw new ForbiddenException("Срок действия реферальной ссылки истёк!");
    }

    referralInvitation.is_used = true;

    return await this.referralInviteRepository.save(referralInvitation);
  }

  async create(
    managerId: string,
    createReferralInviteDto: CreateReferralInviteDto
  ) {
    const manager = await this.usersRepository.findOneByOrFail({
      id: managerId,
    });
    const referralInvite = new ReferralInvite({
      expire_date: createReferralInviteDto.expire_date,
      manager: manager,
    });

    return await this.referralInviteRepository.save(referralInvite);
  }

  async findAll(managerId: string) {
    const [data, count] = await this.referralInviteRepository.findAndCount({
      where: { manager: { id: managerId } },
      order: { created_at: "DESC" },
    });
    return { count, data };
  }

  async findOne(referralInviteId: string) {
    return await this.referralInviteRepository.findOneOrFail({
      where: {
        id: referralInviteId,
      },
      relations: { manager: true },
    });
  }

  // update(id: number, updateReferralInviteDto: UpdateReferralInviteDto) {
  //   return `This action updates a #${id} referralInvite`;
  // }

  async remove(referralInviteId: string) {
    const referralInvite = await this.findOne(referralInviteId);
    return await this.referralInviteRepository.remove(referralInvite);
  }
}
