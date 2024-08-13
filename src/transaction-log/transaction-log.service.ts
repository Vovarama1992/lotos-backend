import { Injectable } from "@nestjs/common";
import { CreateTransactionLogDto } from "./dto/create-transaction-log.dto";
import { UpdateTransactionLogDto } from "./dto/update-transaction-log.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TransactionLog } from "./entities/transaction-log.entity";
import { User } from "src/user/entities/user.entity";

@Injectable()
export class TransactionLogService {
  constructor(
    @InjectRepository(TransactionLog)
    private readonly transactionLogRepository: Repository<TransactionLog>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async create(createTransactionLogDto: CreateTransactionLogDto) {
    const { manager, user, action, type, message, transactionId, transactionTimestamp, amount } =
      createTransactionLogDto;

    const transactionLog = new TransactionLog({
      manager,
      user,
      amount,
      action,
      type,
      message,
      transaction_id: transactionId,
      transaction_timestamp: transactionTimestamp
    });

    return await this.transactionLogRepository.save(transactionLog);
  }

  async findAll() {
    return await this.transactionLogRepository.find({
      order: { timestamp: "DESC" },
      relations: {manager: true, user: true},
      select: {
        id: true,
        action: true,
        message: true,
        type: true,
        timestamp: true,
        transaction_id: true,
        transaction_timestamp: true,
        amount: true,
        user: {
          id: true,
          name: true,
          surname: true,
          telegram_id: true,
          email: true,
          phone: true
        },
        manager: {
          id: true,
          name: true,
          surname: true,
          telegram_id: true,
          email: true,
          phone: true
        }
      }
    });
  }
}
