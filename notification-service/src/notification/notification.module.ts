import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationService } from './services/notification.service';
import { KafkaConsumerService } from './services/kafka-consumer.service';
import { NotificationController } from './controllers/notification.controller';
import { NotificationGateway } from './websocket/notification.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  providers: [NotificationService, KafkaConsumerService, NotificationGateway],
  controllers: [NotificationController],
  exports: [NotificationService],
})
export class NotificationModule {}
