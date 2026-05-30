# Event Service

SeatGuard Event management service. Handles creation and management of events and venues.

## Port

- **8082**

## Dependencies

- Spring Boot Web
- Spring Data JPA
- PostgreSQL
- Spring Boot Validation
- Spring Boot Actuator

## How to Run

```bash
mvn spring-boot:run
```

## Database

Requires a PostgreSQL database named `seatguard_event`.

## Endpoints

- Actuator: http://localhost:8082/actuator/health
