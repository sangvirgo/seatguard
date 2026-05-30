import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Kafka, Consumer } from 'kafkajs';
import { NotificationService } from './notification.service';
import appConfig from '../../config/app.config';

const EVENT_NOTIFICATIONS: Record<string, { title: string; messageFn: (data: any) => string }> = {
  BOOKING_HELD: {
    title: 'Booking Held',
    messageFn: (d) => `Your booking for seat ${d.seatId ?? ''} is being held. Please complete payment within the time limit.`,
  },
  BOOKING_CONFIRMED: {
    title: 'Booking Confirmed',
    messageFn: (d) => `Your booking for seat ${d.seatId ?? ''} has been confirmed!`,
  },
  BOOKING_EXPIRED: {
    title: 'Booking Expired',
    messageFn: (d) => `Your booking for seat ${d.seatId ?? ''} has expired due to payment timeout.`,
  },
  BOOKING_CANCELLED: {
    title: 'Booking Cancelled',
    messageFn: (d) => `Your booking for seat ${d.seatId ?? ''} has been cancelled.`,
  },
  BOOKING_PAYMENT_FAILED: {
    title: 'Payment Failed',
    messageFn: (d) => `Payment for your booking (seat ${d.seatId ?? ''}) has failed. Please try again.`,
  },
  TICKET_ISSUED: {
    title: 'Ticket Issued',
    messageFn: (d) => `Your ticket ${d.ticketId ?? ''} has been issued. Enjoy the event!`,
  },
  TICKET_USED: {
    title: 'Ticket Used',
    messageFn: (d) => `Your ticket ${d.ticketId ?? ''} has been used for entry.`,
  },
};

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private kafka: Kafka;
  private consumer: Consumer;
  private connected = false;

  constructor(private readonly notificationService: NotificationService) {
    const config = appConfig();
    this.kafka = new Kafka({
      clientId: 'notification-service',
      brokers: config.kafka.brokers,
    });
    this.consumer = this.kafka.consumer({ groupId: config.kafka.groupId });
  }

  async onModuleInit() {
    try {
      await this.consumer.connect();
      this.connected = true;
      this.logger.log('Kafka consumer connected');

      await this.consumer.subscribe({ topics: ['booking-events', 'ticket-events'], fromBeginning: false });

      await this.consumer.run({
        eachMessage: async ({ topic, message }) => {
          try {
            const raw = message.value?.toString();
            if (!raw) return;

            const event = JSON.parse(raw);
            const { eventType, userId, ...rest } = event;

            const config = EVENT_NOTIFICATIONS[eventType];
            if (!config) {
              this.logger.warn(`Unknown event type: ${eventType} (topic: ${topic})`);
              return;
            }

            await this.notificationService.createNotification(
              userId,
              eventType,
              config.title,
              config.messageFn(rest),
              rest,
            );

            this.logger.log(`Notification created for user ${userId}: ${eventType}`);
          } catch (err) {
            this.logger.error('Error processing Kafka message', err);
          }
        },
      });

      this.logger.log('Kafka consumer subscribed and running');
    } catch (err) {
      this.logger.error('Failed to start Kafka consumer', err);
    }
  }

  async onModuleDestroy() {
    if (this.connected) {
      await this.consumer.disconnect();
      this.logger.log('Kafka consumer disconnected');
    }
  }
}
