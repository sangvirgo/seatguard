# Ticket Service

SeatGuard Ticket service. Handles ticket generation, QR codes, and ticket validation.

## Port

- **8084**

## Dependencies

- Spring Boot Web
- Spring Data JPA
- PostgreSQL
- Spring Kafka
- Spring Boot Validation
- Spring Boot Actuator

## How to Run

```bash
mvn spring-boot:run
```

## Infrastructure

- **Database:** PostgreSQL `seatguard_ticket`
- **Messaging:** Kafka on `localhost:9092`

## Endpoints

- Actuator: http://localhost:8084/actuator/health
