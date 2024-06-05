import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOptionsWhere, Repository } from "typeorm";
import { CreateWithdrawDto } from "./dto/create-withdraw.dto";
import { Withdraw, WithdrawStatus } from "./entities/withdraw-history.entity";

@Injectable()
export class WithdrawHistoryService {
  constructor(
    @InjectRepository(Withdraw)
    private readonly withdrawRepository: Repository<Withdraw>
  ) {}

  async createWithdrawTransaction(createWithdrawDto: CreateWithdrawDto) {
    const { payment_details, ...data } = createWithdrawDto;
    const withdraw = new Withdraw({
      ...data,
      card: payment_details?.card,
      sbp: payment_details?.sbp,
      crypto_address: payment_details?.crypto_address,
    });
    return await this.withdrawRepository.save(withdraw);
  }

  async confirmWithdrawTransaction(withdrawTransactionId: string) {
    const withdraw = await this.getWithdrawTransactionById(
      withdrawTransactionId,
      { includeUser: true }
    );

    if (withdraw.status !== WithdrawStatus.PENDING) {
      throw new BadRequestException("Withdraw transaction is not active");
    }

    withdraw.status = WithdrawStatus.SUCCESS;
    return await this.withdrawRepository.save(withdraw);
  }

  async getWithdrawTransactionById(
    withdrawTransactionId: string,
    options?: { includeUser: boolean }
  ) {
    return await this.withdrawRepository.findOneOrFail({
      where: { id: withdrawTransactionId },
      relations: { user: options?.includeUser },
    });
  }

  async cancelWithdrawTransaction(withdrawTransactionId: string) {
    const withdraw = await this.getWithdrawTransactionById(
      withdrawTransactionId,
      { includeUser: true }
    );

    if (withdraw.status !== WithdrawStatus.PENDING) {
      throw new BadRequestException("Withdraw transaction is not active");
    }

    withdraw.status = WithdrawStatus.CANCELL;
    return await this.withdrawRepository.save(withdraw);
  }

  async getAllWithdrawTransactions(
    filter: FindOptionsWhere<Withdraw> | FindOptionsWhere<Withdraw>[],
    options?: { includeUser: boolean }
  ) {
    return await this.withdrawRepository.findAndCount({
      where: { ...filter },
      relations: { user: options.includeUser },
    });
  }
}
