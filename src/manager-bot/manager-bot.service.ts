import { Inject, Injectable, forwardRef } from "@nestjs/common";
import * as TelegramBot from "node-telegram-bot-api";
import { RedisService } from "src/redis/redis.service";
import {
  Transaction,
  TransactionStatus,
} from "src/transaction/entities/transaction.entity";
import { SendIncomingMessage } from "./entities/incoming-message.entity";
import * as moment from "moment";
import { SendWithdrawalMessage } from "./entities/withdrawal-message.entity";
import { AdminService } from "src/admin/admin.service";
import { TransactionService } from "src/transaction/transaction.service";
import { WithdrawHistoryService } from "src/withdraw-history/withdraw-history.service";
import { Withdraw } from "src/withdraw-history/entities/withdraw-history.entity";

const AdminSetName = "admin-usernames";

enum AdminBotCommands {
  ADD_ADMIN = "/addadmin",
  DELETE_ADMIN = "/deleteadmin",
  GET_ADMINS = "/getadmins",
  START = "/start",
}

enum CallbackType {
  ACCEPT_INCOMING,
  ACCEPT_WITHDRAWAL,
  DECLINE_INCOMING,
  DECLINE_WITHDRAWAL,
}

export enum TelegramAdminBotNotificationType {
  INCOMING = "incoming",
  WITHDRAWAL = "withdrawal",
}

enum SceneStep {
  INPUT_USERNAME,
  INPUT_DELETE_USERNAME,
}

class TelegramBotForbiddenError extends Error {
  public constructor(message: string) {
    super("User unauthorized error!");
  }
}

class TelegramBotChatNotFoundError extends Error {
  public constructor() {
    super("Chat not found error!");
  }
}

@Injectable()
export class AdminBotService {
  private sceneStep: SceneStep | null = null;
  private bot: TelegramBot;

  public constructor(
    private redisService: RedisService,
    private readonly adminService: AdminService,
    private readonly transactionService: TransactionService,
    private readonly withdrawalService: WithdrawHistoryService
  ) {
    if (process.env.ENV === "dev") return;

    const bot = new TelegramBot(process.env.TELEGRAM_ADMIN_BOT_TOKEN, {
      polling: true,
    });

    bot.on("message", async (msg) => {
      this.authMiddleware(this.handleProcessCommand, msg);
    });

    bot.on("callback_query", (query) => this.handleProcessCallbackQuery(query));

    this.bot = bot;

    //bind this to function
    this.handleProcessCommand = this.handleProcessCommand.bind(this);
  }

  private async authenticateUser(msg: TelegramBot.Message) {
    let valid = true;
    try {
      await this.adminService.getUserByTelegramUsername(msg.chat.username);
      await this.redisService.addElementToSet(AdminSetName, msg.chat.username);
    } catch (_err) {
      valid = false;
    }

    return valid;
  }

  private async authMiddleware(
    handler: (msg: TelegramBot.Message) => void,
    msg: TelegramBot.Message
  ) {
    const isAuth = await this.checkUserAuth(msg.chat.username);

    if (!isAuth) {
      const isSuccess = await this.authenticateUser(msg);
      console.log(msg);
      if (!isSuccess) {
        this.bot.sendMessage(msg.chat.id, "Доступ запрещён!");
      } else {
        try {
          await this.getChatIdByUsername(msg.chat.username);
        } catch (err) {
          if (err instanceof TelegramBotChatNotFoundError) {
            this.initChat(msg.chat.username, msg.chat.id);
          }
        }
        handler(msg);
      }
    } else {
      try {
        await this.getChatIdByUsername(msg.chat.username);
      } catch (err) {
        if (err instanceof TelegramBotChatNotFoundError) {
          this.initChat(msg.chat.username, msg.chat.id);
        }
      }

      handler(msg);
    }
  }

  private handleReceiveMessage(msg: TelegramBot.Message) {
    if (!msg.text) return;

    switch (this.sceneStep) {
      case SceneStep.INPUT_USERNAME:
        this.handleRecieveUsername(msg.text);
        break;
      case SceneStep.INPUT_DELETE_USERNAME:
        this.handleRecieveDeleteUsername(msg.text);
        break;
      default:
    }
  }

  private handleProcessCommand(msg: TelegramBot.Message) {
    switch (msg.text) {
      case AdminBotCommands.START:
        this.handleStartBot(msg);
        break;
      case AdminBotCommands.ADD_ADMIN:
        this.sendAddAdminPrompt(msg.chat.id);
        break;
      case AdminBotCommands.DELETE_ADMIN:
        this.sendDeleteAdminPrompt(msg.chat.id);
        break;
      case AdminBotCommands.GET_ADMINS:
        this.sendGetAdminsResponse(msg.chat.id);
        break;
      default:
        this.handleReceiveMessage(msg);
        break;
    }
  }

  private handleStartBot(msg: TelegramBot.Message) {
    this.initChat(msg.chat.username, msg.chat.id);
  }

  private sendAddAdminPrompt(chatId: number) {
    this.bot.sendMessage(chatId, "Введите username нового админа:");
    this.sceneStep = SceneStep.INPUT_USERNAME;
  }

  private sendDeleteAdminPrompt(chatId: number) {
    this.bot.sendMessage(chatId, "Введите username админа для удаления:");
    this.sceneStep = SceneStep.INPUT_DELETE_USERNAME;
  }

  private async sendGetAdminsResponse(chatId: number) {
    const admins = await this.redisService.getElementsFromSet(AdminSetName);
    this.bot.sendMessage(chatId, admins.join(", ") || "Пусто");
  }

  private handleRecieveUsername(username: string) {
    this.redisService.addElementToSet(AdminSetName, username);
    this.resetSceneStep();
  }

  private handleRecieveDeleteUsername(username: string) {
    this.redisService.removeElementFromSet(AdminSetName, username);
    this.resetSceneStep();
  }

  private checkUserAuth(tgUsername: string) {
    return this.redisService.isSetMember(AdminSetName, tgUsername);
  }

  private resetSceneStep() {
    this.sceneStep = null;
  }

  private async initChat(username: string, chatId: number) {
    let chats = await this.getAdminChats();
    if (chats) {
      chats[username] = chatId;
    } else {
      chats = {};
    }
    await this.setAdminChats(chats);
  }

  private async getAdminChats() {
    return await this.redisService.getJSON("admin-telegram-chats");
  }

  private async setAdminChats(chats: any) {
    return await this.redisService.setJSON("admin-telegram-chats", chats);
  }

  private async getChatIdByUsername(username: string) {
    const chats = await this.getAdminChats();
    if (!chats[username]) throw new TelegramBotChatNotFoundError();

    return chats[username];
  }

  private getUserRowForMessage(
    data: SendIncomingMessage | SendWithdrawalMessage
  ) {
    let userRow = `<b>Email:</b>   ${data.user_email}`;
    if (!data.user_email) {
      if (data.user_tg) {
        userRow = `<b>Telegram:</b>   ${data.user_tg}`;
      } else if (data.user_tel) {
        userRow = `<b>Phone:</b>   ${data.user_tel}`;
      }
    }
    return userRow;
  }

  private sendIncomingNotification(chatId: number, data: SendIncomingMessage) {
    const jsonDataAccept = JSON.stringify({
      type: CallbackType.ACCEPT_INCOMING,
      id: data.transaction_id,
    });
    const jsonDataDecline = JSON.stringify({
      type: CallbackType.DECLINE_INCOMING,
      id: data.transaction_id,
    });

    const userRow = this.getUserRowForMessage(data);

    this.bot.sendMessage(
      chatId,
      `<b>Новое пополнение средств</b>

${userRow}
<b>Метод:</b>   ${data.type}
<b>Реквизиты получателя: </b>
${data.recipient_payment_info}
<b>Сумма:</b>   ${data.amount} RUB
<b>Дата:</b>   ${moment(data.timestamp).format("DD.MM.YYYY, hh:mm:ss")}

<b>Статус:</b>  в обработке`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "Отклонить ⛔️", callback_data: jsonDataDecline },
              { text: "Принять ✅", callback_data: jsonDataAccept },
            ],
          ],
        },
      }
    );
  }

  private sendWithdrawalNotification(
    chatId: number,
    data: SendWithdrawalMessage
  ) {
    const jsonDataAccept = JSON.stringify({
      type: CallbackType.ACCEPT_WITHDRAWAL,
      id: data.withdrawal_id,
    });
    const jsonDataDecline = JSON.stringify({
      type: CallbackType.DECLINE_WITHDRAWAL,
      id: data.withdrawal_id,
    });

    const formattedPaymentDetails = Object.values(data.payment_details)
      .filter((val) => !!val)
      .join(", ");

    const userRow = this.getUserRowForMessage(data);

    this.bot.sendMessage(
      chatId,
      `<b>Новый вывод средств</b>

${userRow}
<b>Метод:</b>   ${data.method}
<b>Реквизиты: </b>   ${formattedPaymentDetails}
<b>Сумма:</b>   ${data.amount} ${data.currency}
<b>Дата:</b>   ${moment(data.timestamp).format("DD.MM.YYYY, hh:mm:ss")}

<b>Статус:</b>  в обработке`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "Отклонить ⛔️", callback_data: jsonDataDecline },
              { text: "Принять ✅", callback_data: jsonDataAccept },
            ],
          ],
        },
      }
    );
  }

  async sendMessageToUser(
    username: string,
    type: TelegramAdminBotNotificationType,
    data: any
  ) {
    const chatId = await this.getChatIdByUsername(username);

    if (type === TelegramAdminBotNotificationType.INCOMING) {
      this.sendIncomingNotification(chatId, data as SendIncomingMessage);
    } else if (type === TelegramAdminBotNotificationType.WITHDRAWAL) {
      this.sendWithdrawalNotification(chatId, data as SendWithdrawalMessage);
    }
  }

  private async handleProcessCallbackQuery(query: TelegramBot.CallbackQuery) {
    const data = JSON.parse(query.data);

    console.log(data);

    switch (data.type) {
      case CallbackType.ACCEPT_INCOMING:
        this.handleAcceptIncoming(query, data.id);
        break;
      case CallbackType.DECLINE_INCOMING:
        this.handleDeclineIncoming(query, data.id);
        break;
      case CallbackType.ACCEPT_WITHDRAWAL:
        this.handleAcceptWithdrawal(query, data.id);
        break;
      case CallbackType.DECLINE_WITHDRAWAL:
        this.handleDeclineWithdrawal(query, data.id);
        break;
      default:
        break;
    }
  }

  private async changeChatMessageStatus(
    message: TelegramBot.Message,
    data: { type: TelegramAdminBotNotificationType; id: string }
  ) {
    let transaction: null | Transaction | Withdraw = null;

    if (data.type === TelegramAdminBotNotificationType.INCOMING) {
      transaction = await this.transactionService.getTransaction(data.id);
    } else if (data.type === TelegramAdminBotNotificationType.WITHDRAWAL) {
      transaction = await this.withdrawalService.getWithdrawTransactionById(
        data.id
      );
    }

    let statusSymbol = "ошибка";
    if (transaction.status === TransactionStatus.CANCELLED) {
      statusSymbol = "⛔️";
    } else if (transaction.status === TransactionStatus.SUCCESS) {
      statusSymbol = "✅";
    }

    const newText = message.text.replace(
      "Статус:  в обработке",
      `<b>Статус:</b>  ${statusSymbol}`
    );

    await this.bot.editMessageText(newText, {
      chat_id: message.chat.id,
      message_id: message.message_id,
      parse_mode: "HTML",
    });
  }

  private async handleAcceptIncoming(
    query: TelegramBot.CallbackQuery,
    transactionId: string
  ) {
    try {
      await this.adminService.confirmBankTransaction(transactionId);
    } catch (err) {
      this.bot.sendMessage(query.message.chat.id, `Ошибка! ${err}`);
    }

    await this.changeChatMessageStatus(query.message, {
      type: TelegramAdminBotNotificationType.INCOMING,
      id: transactionId,
    });
  }

  private async handleDeclineIncoming(
    query: TelegramBot.CallbackQuery,
    transactionId: string
  ) {
    try {
      await this.adminService.cancelBankTransaction(transactionId);
    } catch (err) {
      this.bot.sendMessage(query.message.chat.id, `Ошибка! ${err}`);
    }

    await this.changeChatMessageStatus(query.message, {
      type: TelegramAdminBotNotificationType.INCOMING,
      id: transactionId,
    });
  }

  private async handleAcceptWithdrawal(
    query: TelegramBot.CallbackQuery,
    withdrawalId: string
  ) {
    try {
      await this.adminService.confirmWithdrawTransaction(withdrawalId);
    } catch (err) {
      this.bot.sendMessage(query.message.chat.id, `Ошибка! ${err}`);
    }

    await this.changeChatMessageStatus(query.message, {
      type: TelegramAdminBotNotificationType.WITHDRAWAL,
      id: withdrawalId,
    });
  }

  private async handleDeclineWithdrawal(
    query: TelegramBot.CallbackQuery,
    withdrawalId: string
  ) {
    try {
      await this.adminService.cancelWithdrawTransaction(withdrawalId);
    } catch (err) {
      this.bot.sendMessage(query.message.chat.id, `Ошибка! ${err}`);
    }

    await this.changeChatMessageStatus(query.message, {
      type: TelegramAdminBotNotificationType.WITHDRAWAL,
      id: withdrawalId,
    });
  }
}
