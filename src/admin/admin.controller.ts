import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
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
import { GetWithdrawHistoryResponse } from "src/withdraw-history/entities/withdraw-history.entity";
import { AdminService } from "./admin.service";
import { GetTransactionsQueryDto } from "./dto/get-transactions-query.dto";
import { GetWithdrawHistoryQueryDto } from "./dto/get-withdraw-history-query.dto";
import { ConfirmWithdrawTransactionDto } from "./dto/confirm-withdraw-transaction.dto";
import { SavePaymentDetailsDto } from "./dto/save-payment-details.dto";
import { SendMessageToUserDto } from "./dto/send-message-to-user.dto";
import { UserRole } from "src/constants";
import { CreateManagerDto } from "src/manager/dto/create-manager.dto";
import { AddGameToCategoryDto } from "./dto/add-game-to-category.dto";
import { SaveGamesPlacementDto } from "./dto/save-games-placement.dto";
import { BroadcastMessageDto } from "./dto/broadcast-message.dto";
import { AddGamesToCategoryDto } from "./dto/add-games-to-category.dto";
import { SaveAppConfigDto } from "./dto/save-app-config.dto";
import { GetFinancialStatsQueryDto } from "./dto/get-financial-stats-query.dto";

@ApiTags("admin")
@UseGuards(RolesGuard)
@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("managers")
  @Roles([UserRole.ADMIN])
  getManagers() {
    return this.adminService.getManagers();
  }

  @Delete("managers/:id")
  @Roles([UserRole.ADMIN])
  deleteManager(@Param("id") id: string) {
    return this.adminService.deleteManager(id);
  }

  @Post("add-game-to-category")
  @Roles([UserRole.ADMIN])
  addGameToCategory(@Body() addGameToCategoryDto: AddGameToCategoryDto) {
    return this.adminService.addGameToCategory(addGameToCategoryDto);
  }

  @Post("games")
  @Roles([UserRole.ADMIN])
  addGamesToCategory(@Body() addGamesToCategoryDto: AddGamesToCategoryDto) {
    return this.adminService.addGamesToCategory(addGamesToCategoryDto);
  }

  @Patch("save-games-placement")
  @Roles([UserRole.ADMIN])
  saveGamesPlacement(@Body() saveGamesPlacementDto: SaveGamesPlacementDto) {
    return this.adminService.saveGamesPlacement(saveGamesPlacementDto);
  }

  @Delete("delete-game-from-category/:id")
  @Roles([UserRole.ADMIN])
  deleteGameFromCategory(@Param("id") id: string) {
    return this.adminService.deleteGameFromCategory(id);
  }

  @Post("send-message")
  @Roles([UserRole.ADMIN])
  sendMessageToUser(@Body() sendMessageToUserDto: SendMessageToUserDto) {
    return this.adminService.sendMessageToUser(sendMessageToUserDto);
  }

  @Post("broadcast-message")
  @Roles([UserRole.ADMIN])
  broadCastMessage(@Body() broadCastMessageDto: BroadcastMessageDto) {
    return this.adminService.broadCastMessage(broadCastMessageDto);
  }

  @Post("create-manager")
  @Roles([UserRole.ADMIN])
  createManager(@Body() createManagerDto: CreateManagerDto) {
    return this.adminService.createManagerAccount(createManagerDto);
  }

  @Get("user-profile/:id")
  @Roles([UserRole.ADMIN])
  getUserProfileById(@Param("id") userId: string) {
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

  @Post("app-config")
  @Roles([UserRole.ADMIN])
  @ApiOperation({ summary: "Админ - сохранить конфигурацию сервиса" })
  @ApiResponse({
    status: 403,
    description: "Пользователь не авторизован, либо нет прав доступа",
  })
  @ApiOkResponse({
    description: "Текущая конфигурация",
    type: GetTransactionResponse,
  })
  saveAppConfig(@Body() saveAppConfigDto: SaveAppConfigDto) {
    return this.adminService.saveAppConfig(saveAppConfigDto);
  }

  @Get("app-config")
  @Roles([UserRole.ADMIN])
  @ApiOperation({ summary: "Админ - получить конфигурацию сервиса" })
  @ApiResponse({
    status: 403,
    description: "Пользователь не авторизован, либо нет прав доступа",
  })
  @ApiOkResponse({
    description: "Текущая конфигурация",
    type: GetTransactionResponse,
  })
  getAppConfig() {
    return this.adminService.getAppConfig();
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
  async cancelWithdrawMoney(
    @Body() cancelWithdrawMoneyDto: CancelWithdrawMoneyDto,
    @Req() req: any
  ) {
    const userId = req.user.id as string;
    const manager = await this.adminService.getManager({
      field: "id",
      id: userId,
    });
    return await this.adminService.cancelWithdrawTransactionWrapper(
      cancelWithdrawMoneyDto.withdraw_transaction_id,
      manager
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
  async confirmBankTransactionAsAdmin(
    @Body() confirmBankTransactionDto: ConfirmBankTransactionDto,
    @Req() req: any
  ) {
    const userId = req.user.id as string;
    const manager = await this.adminService.getManager({
      field: "id",
      id: userId,
    });

    console.log(manager);
    return await this.adminService.confirmBankTransactionWrapper(
      confirmBankTransactionDto.transaction_id,
      manager
    );
  }

  @Post("cancel-transaction")
  @Roles([UserRole.ADMIN])
  @ApiOperation({
    summary: "Админ - отклонить банковский перевод (пополнение)",
  })
  @ApiResponse({
    status: 403,
    description: "Пользователь не авторизован, либо нет прав доступа",
  })
  @ApiOkResponse({
    description: "Транзакция",
    type: Transaction,
  })
  async cancelBankTransactionAsAdmin(
    @Body() confirmBankTransactionDto: ConfirmBankTransactionDto,
    @Req() req: any
  ) {
    const userId = req.user.id as string;
    const manager = await this.adminService.getManager({
      field: "id",
      id: userId,
    });
    return await this.adminService.cancelBankTransactionWrapper(
      confirmBankTransactionDto.transaction_id,
      manager
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
  async confirmWithdrawTransaction(
    @Body() confirmWithdrawTransactionDto: ConfirmWithdrawTransactionDto,
    @Req() req: any
  ) {
    const userId = req.user.id as string;
    const manager = await this.adminService.getManager({
      field: "id",
      id: userId,
    });
    return await this.adminService.confirmWithdrawTransactionWrapper(
      confirmWithdrawTransactionDto.withdraw_transaction_id,
      manager
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

  @Get("financial-stats")
  @Roles([UserRole.ADMIN])
  getFinancialStats(@Query() query: GetFinancialStatsQueryDto) {
    return this.adminService.getFinancialStats(query);
  }

  @Get("transaction-logs")
  @Roles([UserRole.ADMIN])
  getTransactionLogs() {
    return this.adminService.getTransactionLogs();
  }
}
