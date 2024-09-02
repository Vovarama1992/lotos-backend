import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { GetUserReferralType } from "src/user/dto/get-user-referrals-query.dto";
import { User } from "src/user/entities/user.entity";
import { Repository } from "typeorm";
import { UserReferral } from "./entities/user-referral.entity";
import { ConfigService } from "src/config/config.service";
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from "src/transaction/entities/transaction.entity";

@Injectable()
export class UserReferralService {
  constructor(
    @InjectRepository(UserReferral)
    private readonly userReferralRepository: Repository<UserReferral>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService
  ) {}

  async addReferral(userId: string, referralId: string) {
    const referralUser = (await this.userRepository.findOneByOrFail({
      id: referralId,
    })) as User;

    const userReferral1 = new UserReferral({
      userId: userId,
      referral: referralUser,
      level: 1,
    });
    await this.userReferralRepository.save(userReferral1);

    // найти узел на 1 выше
    const parentUserReferral = await this.userReferralRepository.findOne({
      where: { referral: { id: userId }, level: 1 },
      relations: { user: true, referral: true },
    });

    if (parentUserReferral) {
      const userReferral2 = new UserReferral({
        userId: parentUserReferral.user.id,
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
          userId: parentUserReferral1.user.id,
          referral: referralUser,
          level: 3,
        });
        this.userReferralRepository.save(userReferral3);
      }
    }
  }

  private getReferralLoss(user: User) {
    return (
      user.totalLoss -
      user.lastTotalLoss -
      (user.totalEarned - user.lastTotalEarned)
    );
  }

  async calculateUserTotalReferralCashback(userId: string) {
    if (!userId) {
      throw new InternalServerErrorException(
        "calculateUserTotalReferralCashback: userId can't be empty!"
      );
    }

    let sumOfVerifiedCashback = 0,
      sumOfAllCashback = 0;

    const cashbackTransactions = await this.transactionRepository.find({
      where: { user: { id: userId }, method: TransactionType.CASHBACK },
    });

    cashbackTransactions.forEach((transaction) => {
      if (transaction.status === TransactionStatus.SUCCESS) {
        sumOfVerifiedCashback += transaction.amount;
      }
      sumOfAllCashback += transaction.amount;
    });

    return {
      verifiedCashback: sumOfVerifiedCashback,
      totalCashback: sumOfAllCashback,
    };
  }

  async calculateUserReferralCashback(userId: string) {
    if (!userId)
      throw new InternalServerErrorException(
        "calculateUserReferralCashback: userId can't be empty!"
      );

    let totalCashback = 0;
    const usersWithLevel = [];

    // уровни кэшбэков - 10%, 5%, 3%
    const cashbackRate = [0.1, 0.05, 0.03];
    const user = await this.userRepository.findOneByOrFail({ id: userId });
    const userLoss = this.getReferralLoss(user);

    for (let level = 0; level < 3; level++) {
      const isFirstLevel = level === 0;
      const currentCashbackRate = cashbackRate[level];
      let totalCashbackInLevel = 0;

      // получаем список всех рефералов на текущем уровне
      const usersInLevel = await this.userReferralRepository.find({
        where: { user: { id: userId }, level: level + 1 },
        relations: { referral: true },
      });

      // сортируем рефералов от наивысшего проигрыша до наименьшего проигрыша за последнюю неделю
      usersInLevel.sort(
        (a, b) =>
          this.getReferralLoss(a.referral) - this.getReferralLoss(b.referral)
      );

      let endIndex = 5;

      // учитывать проигрыш самого пользователя на верхнем уровне кэшбека
      if (isFirstLevel) {
        const selfCashback = userLoss >= 0 ? userLoss * currentCashbackRate : 0;
        totalCashbackInLevel += selfCashback;
        endIndex = 4;

        usersWithLevel.push({
          ...user,
          level: 1,
          cashback: selfCashback.toFixed(2),
        });
      }

      // суммируем кэшбэк топ 5 пользователей по проигрышу на каждом уровне кэшбэков
      usersInLevel.slice(0, endIndex).forEach((el) => {
        const referralLoss = this.getReferralLoss(el.referral);
        const referralCashback =
          referralLoss >= 0 ? currentCashbackRate * referralLoss : 0;
        totalCashbackInLevel += referralCashback;
        usersWithLevel.push({
          ...el.referral,
          level: level + 1,
          cashback: +referralCashback.toFixed(2),
        });
      });

      // суммируем общий кэшбэк
      totalCashback += totalCashbackInLevel;
    }

    return { totalCashback: +totalCashback.toFixed(2), usersWithLevel };
  }

  async getReferralsWithStats(userId: string, type: GetUserReferralType) {
    const { currentDomain = process.env.FRONTEND_URL } =
      await this.configService.get();

    const referralLink = `${currentDomain}?user_referral_id=${userId}`;
    const referralTelegramLink = `https://t.me/lotoscasinobot?start=ur-${userId}`;

    const { totalCashback, usersWithLevel } =
      await this.calculateUserReferralCashback(userId);

    const lostAmount: number = usersWithLevel.reduce(
      (result, user: User) =>
        (result +=
          user.totalLoss -
          user.lastTotalLoss -
          (user.totalEarned - user.lastTotalEarned)),
      0
    );

    const stats = {
      userQuantity: usersWithLevel.length,
      lostAmount: lostAmount.toFixed(2),
      wonAmount: totalCashback.toFixed(2),
    };

    return {
      stats,
      users: usersWithLevel,
      link: { siteLink: referralLink, telegramLink: referralTelegramLink },
    };
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
