#!/bin/bash
# Start SeatGuard infrastructure (PostgreSQL, Redis, Kafka)
set -e
cd "$(dirname "$0")/.."
echo "Starting infrastructure..."
docker compose -f infra/docker-compose.yml up -d
echo "Waiting for healthy..."
sleep 15
docker compose -f infra/docker-compose.yml ps
echo "Infrastructure ready."
