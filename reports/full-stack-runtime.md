# Full-Stack Runtime Report
**Date:** 2026-05-30
**Branch:** feature/seatguard-integration-hardening

## Service Health Matrix (all 10 services running simultaneously)

| Service | Port | Health | Dependencies |
|---------|------|--------|-------------|
| PostgreSQL 16 | 5432 | ✅ healthy | — |
| Redis 7 | 6379 | ✅ healthy | — |
| Kafka 3.7 (KRaft) | 9092 | ✅ healthy | — |
| api-gateway | 8080 | ✅ UP | — |
| auth-service | 8081 | ✅ UP (DB) | PostgreSQL |
| event-service | 8082 | ✅ UP (DB) | PostgreSQL |
| booking-service | 8083 | ✅ UP (DB+Redis+Kafka) | PostgreSQL, Redis, Kafka |
| ticket-service | 8084 | ✅ UP (DB+Kafka) | PostgreSQL, Kafka |
| notification-service | 3000 | ✅ ok (DB+Kafka) | PostgreSQL, Kafka |
| frontend | 3001 | ✅ HTTP 200 | — |

## RAM Usage

| State | Used | Available |
|-------|------|-----------|
| Idle | 882MB | 6.6GB |
| Infra only (3 containers) | 1.1GB | 6.3GB |
| Full stack (10 services) | 3.5GB | 3.9GB |
| During k6 (100 VUs) | ~3.8GB | ~3.6GB |
| After stop | 909MB | 6.6GB |

## Commands Run
```bash
# Start infra
docker compose -f infra/docker-compose.yml up -d

# Start all backend services
for svc in api-gateway auth-service event-service booking-service ticket-service; do
  cd /root/projects/seatguard/backend/$svc
  nohup mvn spring-boot:run -q > /root/projects/seatguard/logs/$svc.log 2>&1 &
done

# Start notification + frontend
cd /root/projects/seatguard/notification-service && node dist/main.js &
cd /root/projects/seatguard/frontend && npm run start &

# Health checks
curl -s http://localhost:8080/actuator/health
curl -s http://localhost:8081/actuator/health
curl -s http://localhost:8082/actuator/health
curl -s http://localhost:8083/actuator/health
curl -s http://localhost:8084/actuator/health
curl -s http://localhost:3000/health
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001
```

## Key Findings
- All 10 services run simultaneously on 8GB RAM
- 5 Spring Boot services: ~2.4GB
- Docker containers: ~600MB
- NestJS + Next.js: ~200MB
- k6 with 100 VUs adds ~300MB
