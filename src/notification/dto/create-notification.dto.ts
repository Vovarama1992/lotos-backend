import { ApiProperty } from "@nestjs/swagger";
import { NotificationStatus, NotificationType } from "../entities/notification.entity";
import { IsEnum, IsNotEmpty, IsString, IsUUID } from "class-validator";

export class CreateNotificationDto {
  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @ApiProperty({ enum: NotificationStatus })
  @IsEnum(NotificationStatus)
  @IsNotEmpty()
  status: NotificationStatus;
  
  @IsString()
  @IsNotEmpty()
  message: string
}
