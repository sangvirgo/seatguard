#!/bin/bash
# Stop SeatGuard infrastructure
set -e
cd "$(dirname "$0")/.."
echo "Stopping infrastructure..."
docker compose -f infra/docker-compose.yml down
echo "Infrastructure stopped."
