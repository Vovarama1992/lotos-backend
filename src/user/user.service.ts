import { Injectable } from '@nestjs/common';
import { UserResponse } from './type/userResponse';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { SendMoneyDTO } from './decorators/sendMoney.dto';
import { SocketService } from 'src/gateway/gateway.service';

@Injectable()
export class UserService {

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly socketService: SocketService
  ) { }

  async saveUser(createUserDto: Partial<User>) {
    try {
      return await this.usersRepository.save(createUserDto)
    }
    catch (e) {
      console.log(e)
    }
  }

  findAll() {
    return this.usersRepository.find();
  }

  async getBalance(id: string) {
    const user = await this.findOneById(id);
    if (!user) throw new Error('User not found');
    return user.balance;
  }

  async findOneById(id: string): Promise<UserResponse> {
    return await this.usersRepository.findOne({
      where: { id },
    });
  }

  async findOneByCredentials(email: string, phone: string): Promise<User> {
    return await this.usersRepository.findOne({
      where: [
        { email },
        { phone }
      ],
      select: ['password', 'id', 'role']
    });
  }


  async findOneSend(credentials: string): Promise<User> {
    return await this.usersRepository.findOne({
      where: [{ email: credentials }, { phone: credentials }],
      select: ['id']
    });
  }

  async findOneByEmail(email: string): Promise<User> {
    return await this.usersRepository.findOne({
      where: { email },
      select: ['password', 'id', 'role']
    });
  }


  async findOneByOneCredentials(credentials: string): Promise<User> {
    return await this.usersRepository.findOne({
      where: [{ email: credentials }, { phone: credentials }],
      select: ['password', 'id', 'role']
    });
  }

  async sendMoney(currentUser: User, transfer: SendMoneyDTO) {
    if (isNaN(transfer.cost) || transfer.cost < 0 || isNaN(currentUser.balance)) {
      throw new Error('Недостаточно средств');
    }
    const user = await this.findOneById(transfer.userId);
    if (!user) throw new Error('Пользователь не найден');
    if (isNaN(user.balance)) throw new Error('Invalid recipient balance');
    currentUser.balance -= transfer.cost;
    await this.saveUser(currentUser);
    user.balance += transfer.cost;
    await this.saveUser(user);
    return { success: true, message: "Операция выполнена успешно" };
  }

  async changeBalance(id: string, balance: number) {
    const user = await this.findOneById(id);
    user.balance = balance;
    this.saveUser(user)
    this.socketService.emitToUser(id, 'balanceUpdated', { balance: user.balance });
    return user
  }
}
