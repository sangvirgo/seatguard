import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import appConfig from '../../config/app.config';

@WebSocketGateway({
  cors: appConfig().websocket.cors,
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private userSockets = new Map<string, Set<string>>();

  handleConnection(client: Socket) {
    const userId =
      (client.handshake.query.userId as string) ||
      (client.handshake.auth?.userId as string);

    if (!userId) {
      this.logger.warn(`Connection rejected: no userId provided (socket ${client.id})`);
      client.disconnect();
      return;
    }

    client.join(`user:${userId}`);

    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(client.id);

    this.logger.log(`Client connected: ${client.id} (user: ${userId})`);
  }

  handleDisconnect(client: Socket) {
    const userId =
      (client.handshake.query.userId as string) ||
      (client.handshake.auth?.userId as string);

    if (userId && this.userSockets.has(userId)) {
      const sockets = this.userSockets.get(userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(userId);
        }
      }
    }

    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('mark-read')
  handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { notificationId: string },
  ) {
    this.logger.log(`Mark-read request from ${client.id}: ${data.notificationId}`);
    return { event: 'mark-read-ack', data: { notificationId: data.notificationId } };
  }

  sendToUser(userId: string, data: any) {
    this.server.to(`user:${userId}`).emit('notification', data);
  }
}
