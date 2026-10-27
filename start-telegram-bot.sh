#!/usr/bin/env bash
# Telegram Community Bot — быстрый старт
set -euo pipefail

# Загрузить .env если есть
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

if [ -z "${TELEGRAM_BOT_TOKEN:-}" ]; then
  echo "Ошибка: TELEGRAM_BOT_TOKEN не задан"
  echo "Создайте бота у @BotFather и выполните:"
  echo "  export TELEGRAM_BOT_TOKEN=\"123:ABC\""
  exit 1
fi

echo "Запуск Telegram бота..."
node distribution/telegram-community-bot.js
