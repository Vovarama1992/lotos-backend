import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString
} from "class-validator";
import {
  NotificationStatus,
  NotificationType,
} from "../entities/notification.entity";

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
  message: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, any>;
}
