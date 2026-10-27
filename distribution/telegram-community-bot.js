#!/usr/bin/env node
/**
 * Telegram Community Bot — приветствие, ссылки, оповещения.
 *
 * Запуск:
 *   export TELEGRAM_BOT_TOKEN="123:ABC"
 *   export TELEGRAM_CHAT_ID="-1001234567890"
 *   node telegram-community-bot.js
 *
 * Если CHAT_ID не указан — бот работает в polling и отвечает любому пользователю.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs"
import { join } from "node:path"

const TOKEN = process.env.TELEGRAM_BOT_TOKEN
if (!TOKEN) {
  console.error("Установите TELEGRAM_BOT_TOKEN")
  process.exit(1)
}

const API = `https://api.telegram.org/bot${TOKEN}`
const STATE_FILE = join(import.meta.dirname, "telegram-bot-state.json")

let state = { offset: 0 }
if (existsSync(STATE_FILE)) {
  try {
    state = JSON.parse(readFileSync(STATE_FILE, "utf8"))
  } catch {}
}

async function api(method, payload = {}) {
  const res = await fetch(`${API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  return res.json()
}

async function handleUpdate(update) {
  const msg = update.message
  if (!msg || !msg.text) return
  const chatId = msg.chat.id
  const text = msg.text.trim()
  const lower = text.toLowerCase()

  const reply = async (text) => {
    await api("sendMessage", { chat_id: chatId, text, parse_mode: "Markdown" })
  }

  if (lower === "/start" || lower === "/help") {
    await reply(
      `👋 Привет! Я бот сообщества Rustem Mustafin Projects.\n\n` +
        `🚀 *Проекты:*\n` +
        `• Lumen Chain — блокчейн с AMM\n` +
        `• Perps Funding Pulse — funding rates API\n` +
        `• Agent X402 — платные AI API\n` +
        `• Wallet Hygiene — аудит кошельков\n` +
        `• BetterDriver — навигация для незрячих\n\n` +
        `🔗 Ссылки:\n` +
        `• GitHub: https://github.com/rustemmustafingovua-byte\n` +
        `• Лендинги: https://rustemmustafingovua-byte.github.io/landing-pages/\n` +
        `• Дашборд: http://127.0.0.1:18900\n\n` +
        `💬 Задавайте вопросы — мы ответим!`,
    )
    return
  }

  if (lower === "/status") {
    try {
      const res = await fetch("http://127.0.0.1:18900/api/aggregated")
      const data = await res.json()
      const lines = Object.entries(data)
        .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
        .join("\n")
      await reply(`📊 *Dashboard status:*\n\`\`\`\n${lines}\n\`\`\``)
    } catch {
      await reply("Дашборд недоступен")
    }
    return
  }

  if (lower === "/links") {
    await reply(
      `🔗 *Все ссылки:*\n` +
        `• Lumen Chain: https://github.com/rustemmustafingovua-byte/lumen-chain\n` +
        `• Perps Funding Pulse: https://github.com/rustemmustafingovua-byte/perps-funding-pulse\n` +
        `• Agent X402: https://github.com/rustemmustafingovua-byte/agent-x402\n` +
        `• Wallet Hygiene: https://github.com/rustemmustafingovua-byte/wallet-hygiene\n` +
        `• BetterDriver: https://github.com/rustemmustafingovua-byte/better-driver\n` +
        `• Лендинги: https://rustemmustafingovua-byte.github.io/landing-pages/`,
    )
    return
  }

  await reply("Используйте /help для списка команд")
}

async function poll() {
  const updates = await api("getUpdates", { offset: state.offset, timeout: 30 })
  for (const update of updates.result || []) {
    state.offset = update.update_id + 1
    await handleUpdate(update)
  }
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
}

async function main() {
  console.log("Telegram community bot запущен...")
  // Send startup message if CHAT_ID is set
  if (process.env.TELEGRAM_CHAT_ID) {
    await api("sendMessage", {
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: "🚀 Marketing bot активирован",
    })
  }
  while (true) {
    try {
      await poll()
    } catch (e) {
      console.error("Poll error:", e.message)
      await new Promise((r) => setTimeout(r, 5000))
    }
  }
}

main()
