#!/bin/bash
# Run SeatGuard full API smoke test
set -e
cd "$(dirname "$0")/.."
echo "Running full API smoke test..."
echo "Make sure infra and backend services are running first."
echo ""
bash tests/smoke/full-flow.sh
