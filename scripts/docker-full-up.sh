#!/bin/bash
# Start full SeatGuard stack with Docker Compose
set -e
cd "$(dirname "$0")/../infra"
echo "Building and starting full SeatGuard stack..."
echo "This may take several minutes on first run."
echo ""
docker compose -f docker-compose.full.yml build --parallel 2>&1 | tail -5
docker compose -f docker-compose.full.yml up -d
echo ""
echo "Waiting for services to initialize..."
sleep 30
echo ""
echo "=== Service Status ==="
docker compose -f docker-compose.full.yml ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "=== Health Check ==="
for port in 8080 8081 8082 8083 8084 3000; do
  STATUS=$(curl -s --max-time 3 http://localhost:$port/actuator/health 2>/dev/null | grep -o '"status":"UP"' || curl -s --max-time 3 http://localhost:$port/health 2>/dev/null | grep -o '"status":"ok"' || echo "DOWN")
  echo "  Port $port: $STATUS"
done
echo ""
echo "Frontend: http://localhost:3001"
echo "Full stack ready!"
