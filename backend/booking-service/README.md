# Booking Service

SeatGuard Booking service. Handles seat reservations, booking lifecycle, and payment integration.

## Port

- **8083**

## Dependencies

- Spring Boot Web
- Spring Data JPA
- PostgreSQL
- Spring Data Redis
- Spring Kafka
- Spring Boot Validation
- Spring Boot Actuator

## How to Run

```bash
mvn spring-boot:run
```

## Infrastructure

- **Database:** PostgreSQL `seatguard_booking`
- **Cache:** Redis on `localhost:6379`
- **Messaging:** Kafka on `localhost:9092`

## Endpoints

- Actuator: http://localhost:8083/actuator/health
