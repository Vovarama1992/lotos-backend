import {
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/user/entities/user.entity";
import { FindOptionsWhere, In, Repository } from "typeorm";
import { CreateNotificationDto } from "./dto/create-notification.dto";
import { Notification } from "./entities/notification.entity";
import { SocketService } from "src/gateway/gateway.service";
import {
  AdminBotService,
  TelegramAdminBotNotificationType,
} from "src/manager-bot/manager-bot.service";
import { SendWithdrawalMessage } from "src/manager-bot/entities/withdrawal-message.entity";
import { SendIncomingMessage } from "src/manager-bot/entities/incoming-message.entity";

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly socketService: SocketService,
    @Inject(forwardRef(() => AdminBotService))
    private readonly adminBotService: AdminBotService
  ) {}

  async markNotificationAsRead(id: string) {
    try{
      const notification = await this.notificationRepository.findOneByOrFail({ id });
      notification.isViewed = true;
      await this.notificationRepository.save(notification);
      return;
    }catch(err){
        throw new NotFoundException("Notification not found!");
    }
  }

  async sendAdminTelegramNotifications(
    adminUserIds: string[],
    data: SendIncomingMessage | SendWithdrawalMessage
  ) {
    console.log("sendAdminTelegramNotifications");
    // find admin user usernames
    const telegramIds = (
      await this.userRepository.find({
        where: { id: In(adminUserIds) },
        select: { telegram_id: true },
      })
    )?.map((user) => user.telegram_id);

    // filter for non empty usernames
    const filteredTelegramIds = telegramIds?.filter((id) => id !== null);

    console.log("admin telegram ids: ", filteredTelegramIds);

    let dataType = TelegramAdminBotNotificationType.INCOMING;
    if (data instanceof SendWithdrawalMessage) {
      dataType = TelegramAdminBotNotificationType.WITHDRAWAL;
    }

    //send all messages
    for (let i = 0; i < filteredTelegramIds.length; i++) {
      const adminTelegramId = filteredTelegramIds[i];
      await this.sendAdminTelegramNotification(
        adminTelegramId,
        dataType,
        data
      ).catch((err) =>
        console.log(
          `Error. Error sending Telegram message to one of the admins. ${err}`
        )
      );
    }
  }

  async sendAdminTelegramNotification(
    adminTelegramId: string,
    type: TelegramAdminBotNotificationType,
    data: SendIncomingMessage | SendWithdrawalMessage
  ) {
    return this.adminBotService.sendMessageToUser(adminTelegramId, type, data);
  }

  async getNotifications(
    filter?: FindOptionsWhere<Notification> | FindOptionsWhere<Notification>[]
  ) {
    return await this.notificationRepository.findAndCount({
      where: filter,
      order: { timestamp: "DESC" },
    });
  }

  async createNotifications(
    userIds: string[],
    event: string,
    createNotificationDto: CreateNotificationDto
  ) {
    const promises = userIds.map((userId) =>
      this.createNotification(userId, createNotificationDto)
    );

    this.socketService.emitToUsers(userIds, event, {
      msg: createNotificationDto.message,
      data: createNotificationDto,
    });

    return Promise.all(promises);
  }

  async createNotification(
    userId: string,
    createNotificationDto: CreateNotificationDto
  ) {
    const user = await this.userRepository.findOneByOrFail({ id: userId });
    const notificationData = JSON.stringify(createNotificationDto.data);
    const notification = new Notification({
      ...createNotificationDto,
      data: notificationData || null,
    });
    notification.user = user;

    return await this.notificationRepository.save(notification);
  }

  async deleteNotification(notificationId: string) {
    const notification = await this.notificationRepository.findOneByOrFail({
      id: notificationId,
    });
    return await this.notificationRepository.remove(notification);
  }

  async markViewedNotification(notificationId: string) {
    const notification = await this.notificationRepository.findOneByOrFail({
      id: notificationId,
    });
    notification.isViewed = true;
    return await this.notificationRepository.save(notification);
  }
}
