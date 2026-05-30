# Full-Stack Runtime Report
**Date:** 2026-05-30
**Branch:** feature/seatguard-full-integration-test

## Service Health Matrix

| Service | Port | Status | Dependencies |
|---------|------|--------|-------------|
| PostgreSQL 16 | 5432 | ✅ healthy | — |
| Redis 7 | 6379 | ✅ healthy | — |
| Kafka 3.7 (KRaft) | 9092 | ✅ healthy | — |
| api-gateway | 8080 | ✅ UP | — |
| auth-service | 8081 | ✅ UP | PostgreSQL |
| event-service | 8082 | ✅ UP | PostgreSQL |
| booking-service | 8083 | ✅ UP | PostgreSQL + Redis |
| ticket-service | 8084 | ✅ UP | PostgreSQL |
| notification-service | 3000 | ✅ UP | PostgreSQL + Kafka |
| frontend | 3001 | ✅ HTTP 200 | — |

## RAM Usage

| State | Used | Available |
|-------|------|-----------|
| Before (idle) | 831MB | 6.6GB |
| Infra only | 1.1GB | 6.3GB |
| Full stack | 3.5GB | 3.9GB |

## Key Findings
- All 10 services can run simultaneously on 8GB RAM
- 5 Spring Boot services use ~2.4GB combined
- Docker containers use ~600MB combined
- NestJS + Next.js use ~200MB combined
