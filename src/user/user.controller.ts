import {
  BadGatewayException,
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import { GameHistoryService } from "src/game-history/game-history.service";
import { TransactionService } from "src/transaction/transaction.service";
import { SendMoneyDTO } from "./decorators/sendMoney.dto";
import { CancelWithdrawMoneyDto } from "./dto/cancel-withdraw-money.dto";
import { WithdrawMoneyDto } from "./dto/withdraw-money.dto";
import { User } from "./entities/user.entity";
import { UserService } from "./user.service";
import {
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Withdraw } from "src/withdraw-history/entities/withdraw-history.entity";
import { GetTransactionResponse } from "src/transaction/entities/transaction.entity";
import { WithdrawHistoryService } from "src/withdraw-history/withdraw-history.service";
import { GetWithdrawsQueryDto } from "./dto/get-withdraws-query.dto";
import { UpdateUserProfileDto } from "./dto/update-user-profile.dto";
import { Notification } from "src/notification/entities/notification.entity";
import { NotificationService } from "src/notification/notification.service";

@ApiTags("user")
@Controller("user")
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly gameHistory: GameHistoryService,
    private readonly transactionService: TransactionService
  ) {}

  @Get("notifications")
  getUserNotifications(@Req() req: any, @Query() query: any) {
    const {all} = query;
    return this.userService.getNotifications(req.user.id, all);
  }

  @Delete("notifications/:id")
  markNotificationAsViewed(@Param("id") notificationId: string) {
    return this.userService.markNotificationAsViewed(notificationId);
  }

  @Get("profile")
  getUserProfile(@Req() req: any) {
    return this.userService.getProfile(req.user.id);
  }

  @Patch("profile")
  updateUserProfile(
    @Body() updateUserProfileDto: UpdateUserProfileDto,
    @Req() req: any
  ) {
    return this.userService.saveProfile(req.user.id, updateUserProfileDto);
  }

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Post()
  async userDataControl(@Body() data: any) {
    const cmd = data.cmd;
    const balance = await this.userService.getBalance(data.login);
    if (data.key !== process.env.HALL_KEY)
      return {
        status: "fail",
        error: "ERROR CODE",
      };
    if (cmd === "getBalance") {
      const response = {
        status: "success",
        error: "",
        login: data.login,
        balance: balance.toFixed(2),
        currency: "RUB",
      };
      console.log(response);
      return response;
    }

    if (cmd === "writeBet") {
      if (balance < data.bet) {
        return {
          status: "fail",
          error: "ERROR CODE",
        };
      }
      const newBalance = balance - +data.bet + +data.win;
      this.gameHistory.changeIsStart(data.sessionId);
      this.userService.changeBalance(data.login, newBalance);
      return {
        status: "success",
        error: "",
        login: data.login,
        balance: newBalance,
        currency: "RUB",
      };
    }
  }

  @Get("/me")
  async getMe(@Req() req): Promise<User> {
    try {
      return req.user;
    } catch (error) {
      throw new UnauthorizedException(`Error`);
    }
  }

  @Get("/deposits")
  @ApiOperation({
    summary: "Пользователь - получить все транзакции на пополнение",
  })
  @ApiResponse({
    status: 403,
    description: "Пользователь не авторизован",
  })
  @ApiOkResponse({
    description: "Транзакции на пополнение",
    type: GetTransactionResponse,
  })
  getDeposits(@Req() req, @Query() query: any) {
    const userId = req.user.id;
    return this.transactionService.getAllTransactions(
      {
        ...query,
        user: { id: userId },
      },
      { includeUser: false }
    );
  }

  @Get("/withdraws")
  @ApiOperation({
    summary: "Пользователь - получить все транзакции на вывод",
  })
  @ApiResponse({
    status: 403,
    description: "Пользователь не авторизован",
  })
  @ApiOkResponse({
    description: "Транзакции на вывод",
    type: GetTransactionResponse,
  })
  getWithdraws(@Req() req, @Query() query: GetWithdrawsQueryDto) {
    const userId = req.user.id;
    return this.userService.getAllWithdraws(userId, query);
  }

  @Post("/findID")
  async findOne(@Body() data) {
    return await this.userService.findOneSend(data.credentials);
  }

  @Post("/populate")
  async populate(@Body() sendMoneyDTO: SendMoneyDTO) {
    return await this.userService.changeBalance(
      sendMoneyDTO.userId,
      sendMoneyDTO.cost
    );
  }

  @Post("/sendMoney")
  async setMoney(@Req() req, @Body() sendMoneyDTO: SendMoneyDTO) {
    if (req.user?.balance === 0 || req.user?.balance < sendMoneyDTO.cost)
      return new BadGatewayException(`Недостаточно средств`);
    return await this.userService.sendMoney(req.user, sendMoneyDTO);
  }

  @Post("/withdraw")
  @ApiOperation({
    summary: "Пользователь - отправить заявку на вывод средств",
  })
  @ApiResponse({
    status: 403,
    description: "Пользователь не авторизован",
  })
  @ApiResponse({
    status: 400,
    description: "Некорретные данные или недостаточно средств",
  })
  @ApiOkResponse({
    description: "Счёт и транзакция",
    type: Withdraw,
  })
  async withdrawMoney(@Req() req, @Body() withdrawMoneyDto: WithdrawMoneyDto) {
    if (req.user?.balance === 0 || req.user?.balance < withdrawMoneyDto.amount)
      return new BadRequestException(`Недостаточно средств`, {
        cause: "low-funds",
      });
    return await this.userService.withdrawMoney(req.user, withdrawMoneyDto);
  }

  @Post("/cancel-withdraw")
  @ApiOperation({
    summary: "Пользователь - отменить заявку на вывод средств",
  })
  @ApiResponse({
    status: 403,
    description: "Пользователь не авторизован",
  })
  @ApiResponse({
    status: 400,
    description: "Некорретные данные",
  })
  @ApiOkResponse({
    description: "Транзакция на вывод средств",
    type: Withdraw,
  })
  async cancelWithdrawMoney(
    @Req() req,
    @Body() cancelWithdrawMoneyDto: CancelWithdrawMoneyDto
  ) {
    return await this.userService.cancelWithdrawMoney(
      req.user,
      cancelWithdrawMoneyDto.withdraw_transaction_id
    );
  }
}
