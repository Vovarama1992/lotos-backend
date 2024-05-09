import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import {
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Roles } from "src/auth/decorator/roles.decorator";
import { RolesGuard } from "src/auth/guard/role.guard";
import ConfirmBankTransactionDto from "src/payment/dto/confirm-bank-transaction.dto";
import {
  GetTransactionResponse,
  Transaction,
} from "src/transaction/entities/transaction.entity";
import { CancelWithdrawMoneyDto } from "src/user/dto/cancel-withdraw-money.dto";
import {
  GetWithdrawHistoryResponse
} from "src/withdraw-history/entities/withdraw-history.entity";
import { AdminService } from "./admin.service";
import { GetTransactionsQueryDto } from "./dto/get-transactions-query.dto";
import { GetWithdrawHistoryQueryDto } from "./dto/get-withdraw-history-query.dto";
import { ConfirmWithdrawTransactionDto } from "./dto/confirm-withdraw-transaction.dto";

@ApiTags("admin")
@UseGuards(RolesGuard)
@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post("confirm-transaction")
  @Roles(["admin", "root"])
  @ApiOperation({
    summary: "Админ - подтвержить банковский перевод (пополнение)",
  })
  @ApiResponse({
    status: 403,
    description: "Пользователь не авторизован, либо нет прав доступа",
  })
  @ApiOkResponse({
    description: "Транзакция",
    type: Transaction,
  })
  confirmBankTransactionAsAdmin(
    @Body() confirmBankTransactionDto: ConfirmBankTransactionDto
  ) {
    return this.adminService.confirmBankTransaction(
      confirmBankTransactionDto.transaction_id
    );
  }

  @Post("confirm-withdraw")
  @Roles(["admin", "root"])
  @ApiOperation({
    summary: "Админ - подтвержить вывод средств пользователя",
  })
  @ApiResponse({
    status: 403,
    description: "Пользователь не авторизован, либо нет прав доступа",
  })
  @ApiOkResponse({
    description: "Транзакция",
    type: Transaction,
  })
  confirmWithdrawTransaction(
    @Body() confirmWithdrawTransactionDto: ConfirmWithdrawTransactionDto
  ) {
    return this.adminService.confirmWithdrawTransaction(
      confirmWithdrawTransactionDto.withdraw_transaction_id
    );
  }

  @Get("transactions")
  @Roles(["admin", "root"])
  @ApiOperation({ summary: "Админ - получить все транзакции на пополнение" })
  @ApiResponse({
    status: 403,
    description: "Пользователь не авторизован, либо нет прав доступа",
  })
  @ApiOkResponse({
    description: "Транзакции",
    type: GetTransactionResponse,
  })
  getAllTransactions(@Query() query: GetTransactionsQueryDto) {
    const { status } = query;
    return this.adminService.getTransactions({ status: status });
  }

  @Post("cancel-withdraw")
  @Roles(["admin", "root"])
  @ApiOperation({ summary: "Админ - отменить вывод средств" })
  @ApiResponse({
    status: 403,
    description: "Пользователь не авторизован, либо нет прав доступа",
  })
  @ApiOkResponse({
    description: "Отменённая транзакция",
    type: Transaction,
  })
  cancelWithdrawMoney(@Body() cancelWithdrawMoneyDto: CancelWithdrawMoneyDto) {
    return this.adminService.cancelWithdrawTransaction(
      cancelWithdrawMoneyDto.withdraw_transaction_id
    );
  }

  @Get("withdraw-history")
  @Roles(["admin", "root"])
  @ApiOperation({ summary: "Админ - получить все транзакции на вывод средств" })
  @ApiResponse({
    status: 403,
    description: "Пользователь не авторизован, либо нет прав доступа",
  })
  @ApiOkResponse({
    description: "Транзакции на вывод",
    type: GetWithdrawHistoryResponse,
  })
  getWithdrawHistory(@Query() query: GetWithdrawHistoryQueryDto) {
    return this.adminService.getAllWithdrawTransactions(query);
  }
}
