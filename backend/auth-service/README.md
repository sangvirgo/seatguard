# Auth Service

SeatGuard Authentication and Authorization service. Handles user registration, login, and token management.

## Port

- **8081**

## Dependencies

- Spring Boot Web
- Spring Security
- Spring Data JPA
- PostgreSQL
- Spring Boot Validation
- Spring Boot Actuator

## How to Run

```bash
mvn spring-boot:run
```

## Database

Requires a PostgreSQL database named `seatguard_auth`.

## Endpoints

- Actuator: http://localhost:8081/actuator/health
