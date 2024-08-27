import { Controller, Get, Param } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { ApiOperation } from '@nestjs/swagger';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('/:id')
  @ApiOperation({ summary: "Уведомления - прочитать уведомление" })
  markNotificationAsRead(@Param("id") id: string){
    return this.notificationService.markNotificationAsRead(id);
  }

}
