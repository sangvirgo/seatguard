import { Controller, Get, Put, Param, Query } from '@nestjs/common';
import { NotificationService } from '../services/notification.service';
import { NotificationGateway } from '../websocket/notification.gateway';

@Controller('api/notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  @Get('me')
  async getUserNotifications(
    @Query('userId') userId: string,
    @Query('page') page?: string,
    @Query('size') size?: string,
  ) {
    return this.notificationService.getUserNotifications(
      userId,
      page ? parseInt(page, 10) : 1,
      size ? parseInt(size, 10) : 20,
    );
  }

  @Put(':id/read')
  async markAsRead(@Param('id') id: string) {
    const notification = await this.notificationService.markAsRead(id);
    if (notification) {
      this.notificationGateway.sendToUser(notification.userId, {
        type: 'notification-read',
        notificationId: id,
      });
    }
    return notification;
  }

  @Get('me/unread-count')
  async getUnreadCount(@Query('userId') userId: string) {
    const count = await this.notificationService.getUnreadCount(userId);
    return { userId, unreadCount: count };
  }
}
