import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { UserReferral } from "./entities/user-referral.entity";
import { Repository } from "typeorm";
import { UserService } from "src/user/user.service";
import { User } from "src/user/entities/user.entity";

@Injectable()
export class UserReferralService {
  constructor(
    @InjectRepository(UserReferral)
    private readonly userReferralRepository: Repository<UserReferral>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async addReferral(userId: string, referralId: string) {
    const referralUser = (await this.userRepository.findOneByOrFail({
      id: referralId,
    })) as User;
    const userReferral1 = new UserReferral({
      user: (await this.userRepository.findOneByOrFail({ id: userId })) as User,
      referral: referralUser,
      level: 1,
    });
    this.userReferralRepository.save(userReferral1);

    // найти узел на 1 выше
    const parentUserReferral = await this.userReferralRepository.findOne({
      where: { referral: { id: userId }, level: 1 },
      relations: { user: true, referral: true },
    });

    if (parentUserReferral) {
      const userReferral2 = new UserReferral({
        user: (await this.userRepository.findOneByOrFail({
          id: parentUserReferral.user.id,
        })) as User,
        referral: referralUser,
        level: 2,
      });
      this.userReferralRepository.save(userReferral2);

      const parentUserReferral1 = await this.userReferralRepository.findOne({
        where: { referral: { id: parentUserReferral.user.id }, level: 1 },
        relations: { user: true, referral: true },
      });

      if (parentUserReferral1) {
        const userReferral3 = new UserReferral({
          user: (await this.userRepository.findOneByOrFail({
            id: parentUserReferral1.user.id,
          })) as User,
          referral: referralUser,
          level: 3,
        });
        this.userReferralRepository.save(userReferral3);
      }
    }
  }

  async calculateUserReferralCashback(userId: string) {
    let totalCashback = 0;

    const cashbackRate = [0.1, 0.05, 0.03];

    for (let level = 0; level < 3; level++) {
      const currentCashbackRate = cashbackRate[level];
      let totalCashbackInLevel = 0;
      const usersInLevel = await this.userReferralRepository.find({
        where: { user: { id: userId }, level: level + 1 },
        relations: { referral: true },
        select: {
          referral: {
            totalLoss: true,
            lastTotalLoss: true,
          },
        },
      });

      usersInLevel.sort(
        (a, b) =>
          a.referral.totalLoss -
          a.referral.lastTotalLoss -
          (b.referral.totalLoss - b.referral.lastTotalLoss)
      );

      usersInLevel.slice(0, 5).forEach((el) => {
        const referralLoss = el.referral.totalLoss - el.referral.lastTotalLoss;
        totalCashbackInLevel += currentCashbackRate * referralLoss;
      });

      totalCashback += totalCashbackInLevel;
    }

    return totalCashback;
  }

  async getReferrals(userId: string) {
    return await this.userReferralRepository.find({
      where: { user: { id: userId } },
      relations: {
        user: true,
      },
    });
  }
}
