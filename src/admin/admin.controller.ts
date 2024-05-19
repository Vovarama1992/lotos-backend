import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
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
import { SavePaymentDetailsDto } from "./dto/save-payment-details.dto";
import { SendMessageToUserDto } from "./dto/send-message-to-user.dto";
import { UserRole } from "src/constants";
import { CreateManagerDto } from "src/manager/dto/create-manager.dto";

@ApiTags("admin")
@UseGuards(RolesGuard)
@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}


  @Post('send-message')
  @Roles([UserRole.ADMIN])
  sendMessageToUser(@Body() sendMessageToUserDto: SendMessageToUserDto){
    return this.adminService.sendMessageToUser(sendMessageToUserDto);
  }

  @Post('create-manager')
  @Roles([UserRole.ADMIN])
  createManager(@Body() createManagerDto: CreateManagerDto){
    return this.adminService.createManagerAccount(createManagerDto);
  }

  @Get("user-profile/:id")
  @Roles([UserRole.ADMIN])
  getUserProfileById(@Param('id') userId: string){
    return this.adminService.getUserProfileById(userId);
  }

  // только для администартора
  @Get("payment-details")
  @Roles([UserRole.ADMIN])
  @ApiOperation({ summary: "Админ - получить данные для оплаты" })
  @ApiResponse({
    status: 403,
    description: "Пользователь не авторизован, либо нет прав доступа",
  })
  @ApiOkResponse({
    description: "Данные для оплаты",
    type: GetTransactionResponse,
  })
  getPaymentDetails() {
    return this.adminService.getPaymentDetails();
  }

  // только для администартора
  @Post("payment-details")
  @Roles([UserRole.ADMIN])
  @ApiOperation({ summary: "Админ - получить данные для оплаты" })
  @ApiResponse({
    status: 403,
    description: "Пользователь не авторизован, либо нет прав доступа",
  })
  @ApiOkResponse({
    description: "Данные для оплаты",
    type: GetTransactionResponse,
  })
  setPaymentDetails(@Body() savePaymentDetailsDto: SavePaymentDetailsDto) {
    return this.adminService.setPaymentDetails(savePaymentDetailsDto);
  }

  @Post("cancel-withdraw")
  @Roles([UserRole.ADMIN])
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

  @Post("confirm-transaction")
  @Roles([UserRole.ADMIN])
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
  @Roles([UserRole.ADMIN])
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
  @Roles([UserRole.ADMIN])
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

  @Get("withdraw-history")
  @Roles([UserRole.ADMIN])
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
