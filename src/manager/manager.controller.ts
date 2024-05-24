import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
} from "@nestjs/common";
import { ManagerService } from "./manager.service";
import { CreateManagerDto } from "./dto/create-manager.dto";
import { UpdateManagerDto } from "./dto/update-manager.dto";
import { RolesGuard } from "src/auth/guard/role.guard";
import { UserRole } from "src/constants";
import { Roles } from "src/auth/decorator/roles.decorator";
import { ApiOkResponse, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { GetTransactionResponse } from "src/transaction/entities/transaction.entity";
import { GetTransactionsQueryDto } from "src/admin/dto/get-transactions-query.dto";
import { GetWithdrawHistoryResponse } from "src/withdraw-history/entities/withdraw-history.entity";
import { GetWithdrawHistoryQueryDto } from "src/admin/dto/get-withdraw-history-query.dto";
import { BroadcastMessageDto } from "src/admin/dto/broadcast-message.dto";

@Controller("manager")
@UseGuards(RolesGuard)
export class ManagerController {
  constructor(private readonly managerService: ManagerService) {}

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
