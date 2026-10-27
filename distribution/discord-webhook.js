#!/usr/bin/env node
/**
 * Discord Webhook Integration — отправляет уведомления в Discord.
 *
 * Использование:
 *   export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
 *   node discord-webhook.js --message="Hello from Lumen Chain"
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs"
import { join } from "node:path"

const WEBHOOK = process.env.DISCORD_WEBHOOK_URL

if (!WEBHOOK) {
  console.error("Установите DISCORD_WEBHOOK_URL")
  process.exit(1)
}

const message = process.argv[process.argv.indexOf("--message") + 1] || "🚀 Lumen Chain: новая активность"

async function send(text) {
  const res = await fetch(WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: text }),
  })
  console.log("Discord:", res.ok ? "отправлено" : res.status)
}

send(message).catch((e) => {
  console.error(e)
  process.exit(1)
})
