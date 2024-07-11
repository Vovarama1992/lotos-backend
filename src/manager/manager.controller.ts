import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards
} from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { BroadcastMessageDto } from "src/admin/dto/broadcast-message.dto";
import { GetFinancialStatsQueryDto } from "src/admin/dto/get-financial-stats-query.dto";
import { GetTransactionsQueryDto } from "src/admin/dto/get-transactions-query.dto";
import { GetWithdrawHistoryQueryDto } from "src/admin/dto/get-withdraw-history-query.dto";
import { Roles } from "src/auth/decorator/roles.decorator";
import { RolesGuard } from "src/auth/guard/role.guard";
import { UserRole } from "src/constants";
import { GetTransactionResponse } from "src/transaction/entities/transaction.entity";
import { GetWithdrawHistoryResponse } from "src/withdraw-history/entities/withdraw-history.entity";
import { ManagerService } from "./manager.service";

@Controller("manager")
@UseGuards(RolesGuard)
export class ManagerController {
  constructor(private readonly managerService: ManagerService) {}

  @Get("financial-stats")
  @Roles([UserRole.MANAGER])
  getFinancialStats(@Query() query: GetFinancialStatsQueryDto, @Req() req: any){
    return this.managerService.getFinancialStats(req.user.id, query);
  }

  @Get("transactions")
  @Roles([UserRole.MANAGER])
  @ApiOperation({
    summary: "Менеджер - получить все транзакции рефералов на пополнение",
  })
  @ApiResponse({
    status: 403,
    description: "Пользователь не авторизован, либо нет прав доступа",
  })
  @ApiOkResponse({
    description: "Транзакции",
    type: GetTransactionResponse,
  })
  getAllTransactions(@Query() query: GetTransactionsQueryDto, @Req() req: any) {
    const { status } = query;
    return this.managerService.getTransactions(req.user.id, { status: status });
  }

  @Get("withdraw-history")
  @Roles([UserRole.MANAGER])
  @ApiOperation({ summary: "Админ - получить все транзакции на вывод средств" })
  @ApiResponse({
    status: 403,
    description: "Пользователь не авторизован, либо нет прав доступа",
  })
  @ApiOkResponse({
    description: "Транзакции на вывод",
    type: GetWithdrawHistoryResponse,
  })
  getWithdrawHistory(
    @Query() query: GetWithdrawHistoryQueryDto,
    @Req() req: any
  ) {
    return this.managerService.getAllWithdrawTransactions(req.user.id, query);
  }

  @Get("referrals")
  @Roles([UserRole.MANAGER])
  @ApiOperation({ summary: "Менеджер - получить всеx рефералов" })
  @ApiResponse({
    status: 403,
    description: "Пользователь не авторизован, либо нет прав доступа",
  })
  @ApiOkResponse({
    description: "Рефералы",
    type: GetTransactionResponse,
  })
  getAllReferrals(@Req() req: any) {
    return this.managerService.getAllReferrals(req.user.id);
  }

  @Post("broadcast-message")
  @Roles([UserRole.MANAGER])
  broadcastMessage(
    @Body() broadcastMessageDto: BroadcastMessageDto,
    @Req() req: any
  ) {
    return this.managerService.broadCastMessage(
      req.user.id,
      broadcastMessageDto
    );
  }
}
