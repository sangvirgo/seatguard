#!/bin/bash
# Stop all SeatGuard backend services
echo "Stopping backend services..."
for port in 8080 8081 8082 8083 8084 3000 3001; do
  PID=$(lsof -t -i:$port 2>/dev/null)
  if [ -n "$PID" ]; then
    kill $PID 2>/dev/null && echo "  Stopped port $port (PID $PID)"
  fi
done
echo "Backend services stopped."
