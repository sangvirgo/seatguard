export default () => ({
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME || 'seatguard',
    password: process.env.DB_PASSWORD || 'seatguard_dev_2026',
    database: process.env.DB_NAME || 'seatguard_notification',
  },
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    groupId: process.env.KAFKA_GROUP_ID || 'notification-service',
  },
  websocket: {
    cors: {
      origin: process.env.WS_CORS_ORIGIN || '*',
    },
  },
});
