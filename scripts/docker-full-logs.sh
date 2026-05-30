#!/bash/bin
# Show logs for full SeatGuard stack
cd "$(dirname "$0")/../infra"
if [ -n "$1" ]; then
  docker compose -f docker-compose.full.yml logs -f "$1"
else
  echo "Usage: $0 <service-name>"
  echo "Available services:"
  echo "  postgres, redis, kafka"
  echo "  api-gateway, auth-service, event-service, booking-service, ticket-service"
  echo "  notification-service, frontend"
  echo ""
  echo "Showing last 20 lines from all services:"
  docker compose -f docker-compose.full.yml logs --tail 20
fi
