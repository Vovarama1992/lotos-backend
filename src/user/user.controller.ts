import {
  BadGatewayException,
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { GameHistoryService } from "src/game-history/game-history.service";
import { GetTransactionResponse } from "src/transaction/entities/transaction.entity";
import { TransactionService } from "src/transaction/transaction.service";
import { Withdraw } from "src/withdraw-history/entities/withdraw-history.entity";
import { SendMoneyDTO } from "./decorators/sendMoney.dto";
import { CancelWithdrawMoneyDto } from "./dto/cancel-withdraw-money.dto";
import { GetWithdrawsQueryDto } from "./dto/get-withdraws-query.dto";
import { UpdateUserProfileDto } from "./dto/update-user-profile.dto";
import { WithdrawMoneyDto } from "./dto/withdraw-money.dto";
import { User } from "./entities/user.entity";
import { UserService } from "./user.service";
import { Cron } from "@nestjs/schedule";
import { GetUserReferralsResponse } from "src/user-referral/entities/user-referral.entity";
import { GetUserBalanceDto } from "./dto/get-user-balance.dto";
import { GetDepositsQueryDto } from "./dto/get-deposits-query.dto";
import { Between } from "typeorm";
import {
  GetUserReferralType,
  GetUserReferralsQueryDto,
} from "./dto/get-user-referrals-query.dto";
import { GetUserReferralsDto } from "./dto/get-user-referrals.dto";
import { GetWalletHistoryQueryDto } from "./dto/get-wallet-history.dto";
import { GetWalletHistoryResponseDto } from "./dto/get-wallet-history-response.dto";

@ApiTags("user")
@ApiBearerAuth("JWT")
@Controller("user")
export class UserController {
  private readonly logger = new Logger("UserController");
  constructor(
    private readonly userService: UserService,
    private readonly gameHistory: GameHistoryService,
    private readonly transactionService: TransactionService
  ) {}

  // run every monday at 10am - расчитать и зачислить кэшбэк каждому юзеру
  @Cron("0 10 * * MON")
  depositCashBack() {
    console.log("Running cron job - deposit cashback to users (Monday 10 am)");
    this.userService.depositCashback();
  }

  @Get("balance")
  @ApiOperation({
    summary:
      "Пользователь - получить текущий баланс, сумму всех поплнений и выводов в рублях",
  })
  @ApiResponse({
    status: 403,
    description: "Пользователь не авторизован",
  })
  @ApiOkResponse({
    description: "Баланс",
    type: GetUserBalanceDto,
  })
  getBalance(@Req() req: any): Promise<GetUserBalanceDto> {
    return this.userService.getFullBalance(req.user.id);
  }

  @Get("referrals")
  @ApiOperation({
    summary: "Пользователь - получить всех рефералов пользователя с их уровнем",
  })
  @ApiResponse({
    status: 403,
    description: "Пользователь не авторизован",
  })
  @ApiOkResponse({
    description: "Массив рефералов и статистика",
    type: GetUserReferralsDto,
  })
  getReferrals(@Req() req: any, @Query() query: GetUserReferralsQueryDto) {
    const { type = GetUserReferralType.ALL } = query;
    return this.userService.getReferrals(req.user.id, type);
  }

  // @Post("test")
  // test(@Body() data: any){
  //   return this.userService.depositCashback();
  // }

  @Get("notifications")
  getUserNotifications(@Req() req: any, @Query() query: any) {
    const { all } = query;
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

      this.logger.log("WRITE_BET");
      this.logger.log(data);

      if (balance < data.bet) {
        return {
          status: "fail",
          error: "ERROR CODE",
        };
      }
      const profit = +data.win - +data.bet;
      this.logger.log(`profit = ${profit}`);

      const newBalance = balance + profit;
      this.gameHistory.changeIsStart(data.sessionId);
      this.userService.changeBalance(data.login, newBalance);

      if (profit < 0) {
        await this.userService.increaseTotalLoss(data.login, +Math.abs(profit).toFixed(2));
      } else {
        await this.userService.increaseTotalEarned(data.login, +Math.abs(profit).toFixed(2));
      }

      return {
        status: "success",
        error: "",
        loss: profit < 0 ? Math.abs(profit) : 0,
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
  getDeposits(@Req() req, @Query() query: GetDepositsQueryDto) {
    const userId = req.user.id;
    const applyDateFilter = query.start_date && query.end_date;

    const dateFilter = applyDateFilter
      ? { timestamp: Between(query.start_date, query.end_date) }
      : {};

    const statusFilter = query.status ? { status: query.status } : {};

    return this.transactionService.getAllTransactions(
      {
        ...dateFilter,
        ...statusFilter,
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

  @Get("/wallet-history")
  @ApiOperation({
    summary: "Пользователь - получить депозиты и выводы в интервале времени",
  })
  @ApiResponse({
    status: 403,
    description: "Пользователь не авторизован",
  })
  @ApiResponse({
    status: 400,
    description: "Дата начала больше даты конца",
  })
  @ApiOkResponse({
    description: "Депозиты и выводы",
    type: GetWalletHistoryResponseDto,
  })
  getWalletHistory(@Query() query: GetWalletHistoryQueryDto, @Req() req: any) {
    return this.userService.getWalletHistory(req.user.id, query);
  }
}
