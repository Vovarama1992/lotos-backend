import { Module, forwardRef } from "@nestjs/common";
import { NotificationService } from "./notification.service";
import { NotificationController } from "./notification.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Notification } from "./entities/notification.entity";
import { User } from "src/user/entities/user.entity";
import { ManagerBotModule } from "src/manager-bot/manager-bot.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, User]),
    forwardRef(() => ManagerBotModule),
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
