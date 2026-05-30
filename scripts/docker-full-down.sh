#!/bin/bash
# Stop full SeatGuard stack
set -e
cd "$(dirname "$0")/../infra"
echo "Stopping full SeatGuard stack..."
docker compose -f docker-compose.full.yml down
echo "Stack stopped."
