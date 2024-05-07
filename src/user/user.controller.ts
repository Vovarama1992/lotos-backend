import { Controller, Get, Post, Body, Param, Req, NotFoundException, UnauthorizedException, BadRequestException, BadGatewayException } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { SendMoneyDTO } from './decorators/sendMoney.dto';
import { GameHistoryService } from 'src/game-history/game-history.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService, private readonly gameHistory: GameHistoryService) { }

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Post()
  async userDataControl(@Body() data: any) {
    const cmd = data.cmd;
    const balance = await this.userService.getBalance(data.login);
    if (data.key !== process.env.HALL_KEY) return (
      {
        "status": "fail",
        "error": "ERROR CODE"
      }
    )
    if (cmd === 'getBalance') {
      const response = {
        "status": "success",
        "error": "",
        "login": data.login,
        "balance": balance.toFixed(2),
        "currency": "RUB"
      }
      console.log(response)
      return response
    }

    if (cmd === 'writeBet') {
      if (balance < data.bet) {
        return ({
          "status": "fail",
          "error": "ERROR CODE"
        })
      }
      const newBalance = balance - +data.bet + +data.win;
      this.gameHistory.changeIsStart(data.sessionId)
      this.userService.changeBalance(data.login, newBalance)
      return ({
        "status": "success",
        "error": "",
        "login": data.login,
        "balance": newBalance,
        "currency": "RUB"
      })
    }

  }

  @Get('/me')
  async getMe(@Req() req): Promise<User> {
    try {
      return req.user;
    } catch (error) {
      throw new UnauthorizedException(`Error`);
    }
  }

  @Post('/findID')
  async findOne(@Body() data){
   return await this.userService.findOneSend(data.credentials)
  }

  @Post('/populate')
  async populate(@Body() sendMoneyDTO: SendMoneyDTO) {
    return await this.userService.changeBalance(sendMoneyDTO.userId, sendMoneyDTO.cost)
  }

  @Post('/sendMoney')
  async setMoney(@Req() req, @Body() sendMoneyDTO: SendMoneyDTO) {
    if (req.user?.balance === 0 || req.user?.balance < sendMoneyDTO.cost) return new BadGatewayException(`Недостаточно средств`);
    return await this.userService.sendMoney(req.user, sendMoneyDTO);
  }

}
