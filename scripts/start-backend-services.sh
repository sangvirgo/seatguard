#!/bin/bash
# Start all SeatGuard backend services
set -e
cd "$(dirname "$0")/.."
mkdir -p logs

echo "Starting backend services..."
for svc in api-gateway auth-service event-service booking-service ticket-service; do
  echo "  Starting $svc..."
  (cd backend/$svc && nohup mvn spring-boot:run -q > ../../logs/$svc.log 2>&1 &)
done

echo "Waiting 35s for services to initialize..."
sleep 35

echo "Checking health..."
for port in 8080 8081 8082 8083 8084; do
  STATUS=$(curl -s --max-time 3 http://localhost:$port/actuator/health 2>/dev/null | grep -o '"status":"UP"' || echo "DOWN")
  if [ "$STATUS" = '"status":"UP"' ]; then
    echo "  Port $port: UP"
  else
    echo "  Port $port: DOWN (check logs/)"
  fi
done
echo "Backend services started."
