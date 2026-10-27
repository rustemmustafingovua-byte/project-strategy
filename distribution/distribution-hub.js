#!/usr/bin/env node
/**
 * Distribution Hub — отправка контента во все каналы.
 *
 * Использование:
 *   node distribution-hub.js --platform=twitter --content=twitter/lumen-chain-launch.md
 *   node distribution-hub.js --platform=reddit --content=reddit/lumen-chain-web3.md
 *   node distribution-hub.js --platform=telegram --content=blog/lumen-chain.md
 *
 * Требует переменные окружения:
 *   TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID
 *   DISCORD_WEBHOOK_URL
 *   TWITTER_API_KEY + TWITTER_API_SECRET + TWITTER_ACCESS_TOKEN + TWITTER_ACCESS_SECRET
 *   REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET + REDDIT_USERNAME + REDDIT_PASSWORD
 */

import { readFileSync } from "node:fs"
import { join } from "node:path"

const BASE = join(import.meta.dirname, "..")

function loadContent(path) {
  const full = join(BASE, path)
  return readFileSync(full, "utf8")
}

async function postTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) {
    console.error("Нужны TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID")
    return
  }
  const url = `https://api.telegram.org/bot${token}/sendMessage`
  const body = new URLSearchParams({ chat_id: chatId, text, parse_mode: "Markdown" })
  const res = await fetch(url, { method: "POST", body })
  const json = await res.json()
  console.log("Telegram:", json.ok ? "отправлено" : json.description)
}

async function postDiscord(text) {
  const url = process.env.DISCORD_WEBHOOK_URL
  if (!url) {
    console.error("Нужен DISCORD_WEBHOOK_URL")
    return
  }
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: text }),
  })
  console.log("Discord:", res.ok ? "отправлено" : res.status)
}

async function postTwitter(text) {
  // Twitter API v2 requires OAuth 1.0a user context
  const { TwitterApi } = await import("twitter-api-v2").catch(() => ({}))
  if (!TwitterApi) {
    console.error("Установи: npm i twitter-api-v2")
    return
  }
  const client = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET,
  })
  try {
    await client.v2.tweet(text.slice(0, 280))
    console.log("Twitter: опубликовано")
  } catch (e) {
    console.error("Twitter:", e.message)
  }
}

async function postReddit(title, body, subreddit) {
  // Simple Reddit OAuth2 script flow
  const clientId = process.env.REDDIT_CLIENT_ID
  const secret = process.env.REDDIT_CLIENT_SECRET
  const username = process.env.REDDIT_USERNAME
  const password = process.env.REDDIT_PASSWORD
  if (!clientId || !secret || !username || !password) {
    console.error("Нужны REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD")
    return
  }
  const auth = Buffer.from(`${clientId}:${secret}`).toString("base64")
  const tokenRes = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "User-Agent": "lumen-distribution/1.0",
    },
    body: new URLSearchParams({
      grant_type: "password",
      username,
      password,
    }),
  })
  const tokenJson = await tokenRes.json()
  if (!tokenJson.access_token) {
    console.error("Reddit auth failed:", tokenJson)
    return
  }
  const submit = await fetch(`https://oauth.reddit.com/api/submit`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokenJson.access_token}`,
      "User-Agent": "lumen-distribution/1.0",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      sr: subreddit,
      kind: "self",
      title,
      text: body,
    }),
  })
  const submitJson = await submit.json()
  console.log("Reddit:", submitJson.json?.errors?.length ? submitJson.json.errors : "опубликовано")
}

async function main() {
  const platform = process.argv[process.argv.indexOf("--platform") + 1]
  const contentPath = process.argv[process.argv.indexOf("--content") + 1]
  const subreddit = process.argv[process.argv.indexOf("--subreddit") + 1] || "web3"

  if (!platform || !contentPath) {
    console.log("Usage: node distribution-hub.js --platform=<telegram|discord|twitter|reddit> --content=<path> [--subreddit=<name>]")
    process.exit(1)
  }

  const raw = loadContent(contentPath)
  const lines = raw.split("\n")
  const title = lines.find(l => l.startsWith("# "))?.slice(2) || "Lumen Chain"
  const body = lines.slice(1).join("\n").trim()

  switch (platform) {
    case "telegram":
      await postTelegram(body)
      break
    case "discord":
      await postDiscord(body)
      break
    case "twitter":
      await postTwitter(body)
      break
    case "reddit":
      await postReddit(title, body, subreddit)
      break
    default:
      console.error("Unknown platform:", platform)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
