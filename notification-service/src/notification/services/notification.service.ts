import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  async createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    data?: Record<string, any>,
  ): Promise<Notification> {
    const notification = this.notificationRepo.create({
      userId,
      type,
      title,
      message,
      data,
    });
    return this.notificationRepo.save(notification);
  }

  async getUserNotifications(
    userId: string,
    page: number = 1,
    size: number = 20,
  ): Promise<{ items: Notification[]; total: number; page: number; size: number }> {
    const [items, total] = await this.notificationRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * size,
      take: size,
    });
    return { items, total, page, size };
  }

  async markAsRead(notificationId: string): Promise<Notification> {
    await this.notificationRepo.update(notificationId, { isRead: true });
    return this.notificationRepo.findOneBy({ id: notificationId });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepo.count({
      where: { userId, isRead: false },
    });
  }
}
