#!/bin/bash
# Rebuild full SeatGuard stack from scratch
set -e
cd "$(dirname "$0")/../infra"
echo "Rebuilding full SeatGuard stack..."
docker compose -f docker-compose.full.yml down -v 2>/dev/null || true
docker compose -f docker-compose.full.yml build --no-cache --parallel
docker compose -f docker-compose.full.yml up -d
echo "Rebuild complete. Run docker-full-up.sh to check status."
