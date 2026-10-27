#!/usr/bin/env bash
set -euo pipefail

echo "=== Ecosystem Status ==="
echo ""

# Check services
check_port() {
  if lsof -iTCP:"$1" -sTCP:LISTEN -P >/dev/null 2>&1; then
    echo "  ✓ $2 (port $1)"
  else
    echo "  ✗ $2 (port $1) — not running"
  fi
}

echo "Services:"
check_port 8789 "Lumen Chain"
check_port 18900 "Dashboard"
check_port 18910 "Email Capture"

echo ""
echo "GitHub Repos:"
for repo in lumen-chain agent-x402 wallet-hygiene perps-funding-pulse mcp-proxy better-driver project-strategy; do
  if gh repo view rustemmustafingovua-byte/"$repo" >/dev/null 2>&1; then
    echo "  ✓ $repo"
  else
    echo "  ✗ $repo"
  fi
done

echo ""
echo "Local APK:"
if [ -f ~/Desktop/BetterDriver-v0.1.0-release.apk ]; then
  echo "  ✓ BetterDriver APK ($(ls -lh ~/Desktop/BetterDriver-v0.1.0-release.apk | awk '{print $5}'))"
else
  echo "  ✗ BetterDriver APK not found"
fi

echo ""
echo "Tunnel:"
if [ -f /tmp/localtunnel-url.txt ]; then
  echo "  ✓ $(cat /tmp/localtunnel-url.txt)"
else
  echo "  ⚠ No active tunnel"
fi
