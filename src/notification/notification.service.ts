import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/user/entities/user.entity";
import { FindOptionsWhere, Repository } from "typeorm";
import { CreateNotificationDto } from "./dto/create-notification.dto";
import { Notification } from "./entities/notification.entity";
import { SocketService } from "src/gateway/gateway.service";

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly socketService: SocketService
  ) {}

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
