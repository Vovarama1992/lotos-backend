import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { GetUserReferralType } from "src/user/dto/get-user-referrals-query.dto";
import { User } from "src/user/entities/user.entity";
import { Repository } from "typeorm";
import { UserReferral } from "./entities/user-referral.entity";

@Injectable()
export class UserReferralService {
  constructor(
    @InjectRepository(UserReferral)
    private readonly userReferralRepository: Repository<UserReferral>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  private getUserLoss(user: User, type: GetUserReferralType) {
    let result = user.totalLoss;

    if (type === GetUserReferralType.WEEK) {
      result = user.totalLoss - user.lastTotalLoss;
    }

    return result;
  }

  private getUserEarned(user: User, type: GetUserReferralType) {
    let result = user.totalEarned;

    if (type === GetUserReferralType.WEEK) {
      result = user.totalEarned - user.lastTotalEarned;
    }

    return result;
  }

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
    if(!userId) throw new InternalServerErrorException("calculateUserReferralCashback: userId can't be empty!")

    let totalCashback = 0;
    // уровни кэшбэков - 10%, 5%, 3%
    const cashbackRate = [0.1, 0.05, 0.03];
    const user = await this.userRepository.findOneByOrFail({ id: userId });
    const userLoss = user.totalLoss - user.lastTotalLoss;

    for (let level = 0; level < 3; level++) {
      const isFirstLevel = level === 0;
      const currentCashbackRate = cashbackRate[level];
      let totalCashbackInLevel = 0;

      // получаем список всех рефералов на текущем уровне
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

      // сортируем рефералов от наивысшего проигрыша до наименьшего проигрыша за последнюю неделю
      usersInLevel.sort(
        (a, b) =>
          a.referral.totalLoss -
          a.referral.lastTotalLoss -
          (b.referral.totalLoss - b.referral.lastTotalLoss)
      );

      let endIndex = 5;

      // учитывать проигрыш самого пользователя на верхнем уровне кэшбека
      if (isFirstLevel) {
        totalCashbackInLevel += userLoss * currentCashbackRate;
        endIndex = 4;
      }

      // суммируем кэшбэк топ 5 пользователей по проигрышу на каждом уровне кэшбэков
      usersInLevel.slice(0, endIndex).forEach((el) => {
        const referralLoss = el.referral.totalLoss - el.referral.lastTotalLoss;
        totalCashbackInLevel += currentCashbackRate * referralLoss;
      });

      // суммируем общий кэшбэк
      totalCashback += totalCashbackInLevel;
    }

    return totalCashback;
  }

  private sortUsersByLoss(
    users: User[],
    type: GetUserReferralType,
    order?: "asc" | "desc"
  ) {
    const orderFlag = order === "asc" ? 1 : -1;

    users.sort((user1, user2) => {
      if (this.getUserLoss(user1, type) > this.getUserLoss(user2, type))
        return orderFlag;
      return -orderFlag;
    });
  }

  async getReferralsWithStats(userId: string, type: GetUserReferralType) {
    let users = [] as User[];

    for (let i = 0; i < 3; i++) {
      const level = await this.userReferralRepository.find({
        where: { user: { id: userId }, level: i + 1 },
        relations: {
          user: true,
        },
      });
      const userInLevel = level.map((el) => ({ ...el.user, level: el.level }));
      //sort users
      this.sortUsersByLoss(userInLevel, type, "desc");
      // limit users to top 5
      userInLevel.splice(5);

      users = [...users, ...userInLevel];
    }

    const stats = {
      userQuantity: users.length,
      lostAmount: users.reduce(
        (result, user) => (result += this.getUserLoss(user, type)),
        0
      ),
      wonAmount: users.reduce(
        (result, user) => (result += this.getUserEarned(user, type)),
        0
      ),
    };

    return { stats, users };
  }

  async getReferrals(userId: string, type: GetUserReferralType) {
    return await this.userReferralRepository.find({
      where: { user: { id: userId } },
      relations: {
        user: true,
      },
    });
  }
}
