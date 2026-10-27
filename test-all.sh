#!/usr/bin/env bash
set -euo pipefail

echo "=== Running all test suites ==="
FAILED=0

# lumen-chain
echo "[lumen-chain] testing..."
cd /tmp/lumen-chain
if npm run test > /tmp/test-results/lumen-chain.txt 2>&1; then
  echo "  ✓ PASS"
else
  echo "  ✗ FAIL"
  FAILED=1
fi

# agent-x402
echo "[agent-x402] testing..."
cd /tmp/agent-x402
if npm test > /tmp/test-results/agent-x402.txt 2>&1; then
  echo "  ✓ PASS"
else
  echo "  ✗ FAIL"
  FAILED=1
fi

# wallet-hygiene
echo "[wallet-hygiene] testing..."
cd /tmp/wallet-hygiene
if npm test > /tmp/test-results/wallet-hygiene.txt 2>&1; then
  echo "  ✓ PASS"
else
  echo "  ✗ FAIL"
  FAILED=1
fi

# perps-funding-pulse
echo "[perps-funding-pulse] testing..."
cd /tmp/perps-funding-pulse
if npm test > /tmp/test-results/perps-funding-pulse.txt 2>&1; then
  echo "  ✓ PASS"
else
  echo "  ✗ FAIL"
  FAILED=1
fi

# mcp-proxy
echo "[mcp-proxy] testing..."
cd /tmp/mcp-proxy
if npm test > /tmp/test-results/mcp-proxy.txt 2>&1; then
  echo "  ✓ PASS"
else
  echo "  ✗ FAIL"
  FAILED=1
fi

# better-driver
echo "[better-driver] testing..."
cd /Users/admin/better_driver
if flutter test > /tmp/test-results/better-driver.txt 2>&1; then
  echo "  ✓ PASS"
else
  echo "  ✗ FAIL"
  FAILED=1
fi

echo ""
if [ $FAILED -eq 0 ]; then
  echo "=== ALL TESTS PASSED ==="
else
  echo "=== SOME TESTS FAILED ==="
  echo "Check /tmp/test-results/ for details"
  exit 1
fi
