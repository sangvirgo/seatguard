import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthModule } from './health/health.module';
import { NotificationModule } from './notification/notification.module';
import appConfig from './config/app.config';

const db = appConfig().database;

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: db.host,
      port: db.port,
      username: db.username,
      password: db.password,
      database: db.database,
      autoLoadEntities: true,
      synchronize: true,
    }),
    HealthModule,
    NotificationModule,
  ],
})
export class AppModule {}
