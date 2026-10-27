#!/usr/bin/env node
/**
 * Marketing Bot — отправляет уведомления в Telegram о событиях.
 *
 * События:
 *   - Новый блок в Lumen Chain
 *   - Новый scan в Wallet Hygiene
 *   - Новый x402 запрос
 *   - Funding rate обновление
 *
 * Использование:
 *   node marketing-bot.js
 *
 * Требует: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs"
import { join } from "node:path"

const TOKEN = process.env.TELEGRAM_BOT_TOKEN
const CHAT_ID = process.env.TELEGRAM_CHAT_ID
const STATE_FILE = join(import.meta.dirname, "marketing-bot-state.json")

if (!TOKEN || !CHAT_ID) {
  console.error("Установите TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID")
  process.exit(1)
}

let state = { lastBlock: 0, lastScan: 0, lastX402: 0, lastFunding: 0 }
if (existsSync(STATE_FILE)) {
  try {
    state = JSON.parse(readFileSync(STATE_FILE, "utf8"))
  } catch {}
}

async function send(text) {
  const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`
  const body = new URLSearchParams({ chat_id: CHAT_ID, text, parse_mode: "Markdown" })
  const res = await fetch(url, { method: "POST", body })
  const json = await res.json()
  if (!json.ok) console.error("Telegram error:", json.description)
}

async function checkLumen() {
  try {
    const res = await fetch("http://127.0.0.1:8789/api/state")
    if (!res.ok) return
    const data = await res.json()
    if (data.height > state.lastBlock) {
      state.lastBlock = data.height
      await send(`🔗 *Lumen Chain* новый блок #${data.height}\nВалидаторов: ${data.validators}\nСтейк: ${data.totalStake} LMN`)
    }
  } catch {}
}

async function checkDashboard() {
  try {
    const res = await fetch("http://127.0.0.1:18900/api/aggregated")
    if (!res.ok) return
    const data = await res.json()
    // Notify on any new activity
    const total = Object.values(data).reduce((sum, p) => sum + (p.requests || p.scans || 0), 0)
    if (total > state.lastX402) {
      state.lastX402 = total
      await send(`📊 *Dashboard* активность: ${total} событий`)
    }
  } catch {}
}

async function loop() {
  await checkLumen()
  await checkDashboard()
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
}

async function main() {
  console.log("Marketing bot запущен...")
  await send("🚀 Marketing bot активирован")
  setInterval(loop, 60000) // Check every minute
  await loop()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
