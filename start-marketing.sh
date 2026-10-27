#!/usr/bin/env bash
# Запуск всех сервисов маркетинга (email capture + dashboard + telegram bot)
set -euo pipefail

if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

echo "=== Запуск Email Capture на порту 18901 ==="
node distribution/email-capture.js &
EMAIL_PID=$!

echo "=== Запуск Dashboard на порту 18900 ==="
# Предполагается, что dashboard уже запущен отдельно
# Если нет — раскомментируйте строку ниже:
# node distribution/distribution-hub.js &
# DASH_PID=$!

echo "=== Запуск Telegram бота ==="
if [ -z "${TELEGRAM_BOT_TOKEN:-}" ]; then
  echo "⚠ TELEGRAM_BOT_TOKEN не задан — бот не запущен"
else
  node distribution/telegram-community-bot.js &
  BOT_PID=$!
fi

echo ""
echo "Сервисы запущены:"
echo "  Email capture: http://127.0.0.1:18901"
echo "  Dashboard:     http://127.0.0.1:18900"
echo "  Telegram bot:  ${TELEGRAM_BOT_TOKEN:+запущен}${TELEGRAM_BOT_TOKEN:-не запущен (нет токена)}"
echo ""
echo "Для остановки нажмите Ctrl+C"

trap "kill $EMAIL_PID ${BOT_PID:-} 2>/dev/null" EXIT
wait
