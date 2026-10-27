#!/usr/bin/env bash
set -euo pipefail

echo "=== Starting all services ==="

# Lumen Chain
if ! lsof -iTCP:8789 -sTCP:LISTEN -P >/dev/null 2>&1; then
  echo "[lumen-chain] starting..."
  cd /tmp/lumen-chain && { npx tsx cli/lumen.ts serve --port=8789 & }
  sleep 4
else
  echo "[lumen-chain] already running"
fi

# Dashboard
if ! lsof -iTCP:18900 -sTCP:LISTEN -P >/dev/null 2>&1; then
  echo "[dashboard] starting..."
  cd /tmp/monorepo-dashboard && { node server.js & }
  sleep 2
else
  echo "[dashboard] already running"
fi

# Email Capture
if ! lsof -iTCP:18910 -sTCP:LISTEN -P >/dev/null 2>&1; then
  echo "[email-capture] starting..."
  cd /tmp/project-strategy/distribution && { node email-capture.js & }
  sleep 2
else
  echo "[email-capture] already running"
fi

echo "=== All services started ==="
echo "Lumen Chain: http://127.0.0.1:8789"
echo "Dashboard: http://127.0.0.1:18900"
echo "Email Capture: http://127.0.0.1:18910"
