#!/usr/bin/env node
/**
 * Social Media Poster — массовая публикация постов
 * 
 * Usage:
 *   node social-poster.js telegram "message"
 *   node social-poster.js reddit "title" "body" --sub=web3
 *   node social-poster.js twitter "message"
 *   node social-poster.js hn "title" "url" --text=comment
 */

import { spawn } from "node:child_process"
import { readFileSync, existsSync } from "node:fs"

const CRED_MANAGER = "/tmp/project-strategy/credentials/manager.js"

function getCred(service, field) {
  const { execSync } = await import("node:child_process")
  try {
    return execSync(`node ${CRED_MANAGER} get ${service}.${field}`, { encoding: "utf8" }).trim()
  } catch {
    return null
  }
}

async function postTelegram(message) {
  const token = getCred("telegram", "token")
  const chatId = getCred("telegram", "chat_id")
  
  if (!token || !chatId) {
    console.error("✗ Telegram: missing token or chat_id")
    console.error("  Run: node /tmp/project-strategy/credentials/manager.js set telegram.token \"YOUR_TOKEN\"")
    console.error("  Run: node /tmp/project-strategy/credentials/manager.js set telegram.chat_id \"YOUR_CHAT_ID\"")
    return false
  }
  
  const url = `https://api.telegram.org/bot${token}/sendMessage`
  const body = JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" })
  
  const { execSync } = await import("node:child_process")
  try {
    const result = execSync(`curl -s -X POST "${url}" -H "Content-Type: application/json" -d '${body}'`)
    const data = JSON.parse(result.toString())
    if (data.ok) {
      console.log("✓ Telegram: posted")
      return true
    } else {
      console.error("✗ Telegram:", data.description)
      return false
    }
  } catch (e) {
    console.error("✗ Telegram:", e.message)
    return false
  }
}

async function postReddit(title, body, subreddit = "web3") {
  const clientId = getCred("reddit", "client_id")
  const clientSecret = getCred("reddit", "client_secret")
  const username = getCred("reddit", "username")
  const password = getCred("reddit", "password")
  
  if (!clientId || !clientSecret || !username || !password) {
    console.error("✗ Reddit: missing credentials")
    console.error("  Set: reddit.client_id, reddit.client_secret, reddit.username, reddit.password")
    return false
  }
  
  // Get access token
  const { execSync } = await import("node:child_process")
  try {
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
    const tokenRes = execSync(`curl -s -X POST "https://www.reddit.com/api/v1/access_token" \
      -H "Authorization: Basic ${auth}" \
      -H "User-Agent: luman-chain-bot/1.0" \
      -d "grant_type=password&username=${username}&password=${password}"`)
    
    const tokenData = JSON.parse(tokenRes.toString())
    if (!tokenData.access_token) {
      console.error("✗ Reddit auth failed:", tokenData)
      return false
    }
    
    // Submit post
    const postBody = JSON.stringify({
      kind: "self",
      sr: subreddit,
      title: title,
      text: body
    })
    
    const submitRes = execSync(`curl -s -X POST "https://oauth.reddit.com/api/submit" \
      -H "Authorization: Bearer ${tokenData.access_token}" \
      -H "User-Agent: luman-chain-bot/1.0" \
      -H "Content-Type: application/json" \
      -d '${postBody}'`)
    
    const submitData = JSON.parse(submitRes.toString())
    if (submitData.json && submitData.json.data && submitData.json.data.name) {
      console.log(`✓ Reddit: posted to r/${subreddit}`)
      console.log(`  URL: https://reddit.com${submitData.json.data.permalink}`)
      return true
    } else {
      console.error("✗ Reddit post failed:", submitData)
      return false
    }
  } catch (e) {
    console.error("✗ Reddit:", e.message)
    return false
  }
}

async function postTwitter(message) {
  const apiKey = getCred("twitter", "api_key")
  const apiSecret = getCred("twitter", "api_secret")
  const accessToken = getCred("twitter", "access_token")
  const accessSecret = getCred("twitter", "access_secret")
  
  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
    console.error("✗ Twitter: missing credentials")
    console.error("  Set: twitter.api_key, twitter.api_secret, twitter.access_token, twitter.access_secret")
    return false
  }
  
  const { execSync } = await import("node:child_process")
  try {
    // OAuth1.0a signing (simplified - in production use a proper library)
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")
    const tweetBody = JSON.stringify({ text: message })
    
    const result = execSync(`curl -s -X POST "https://api.twitter.com/2/tweets" \
      -H "Authorization: Basic ${auth}" \
      -H "User-Agent: luman-chain-bot/1.0" \
      -H "Content-Type: application/json" \
      -d '${tweetBody}'`)
    
    const data = JSON.parse(result.toString())
    if (data.data && data.data.id) {
      console.log(`✓ Twitter: posted (ID: ${data.data.id})`)
      return true
    } else {
      console.error("✗ Twitter:", data)
      return false
    }
  } catch (e) {
    console.error("✗ Twitter:", e.message)
    return false
  }
}

async function postHN(title, url, text) {
  // HN uses Firebase API - simplified version
  console.log("⚠ HN: requires manual login or Firebase API key")
  return false
}

// Main
const platform = process.argv[2]
const args = process.argv.slice(3)

if (!platform) {
  console.log(`
Social Media Poster

Usage:
  node social-poster.js telegram "message"
  node social-poster.js reddit "title" "body" [--sub=web3]
  node social-poster.js twitter "message"
  node social-poster.js hn "title" "url" --text="comment"

Setup:
  node /tmp/project-strategy/credentials/manager.js set telegram.token "YOUR_TOKEN"
  node /tmp/project-strategy/credentials/manager.js set telegram.chat_id "YOUR_CHAT_ID"
  node /tmp/project-strategy/credentials/manager.js set reddit.client_id "..."
  node /tmp/project-strategy/credentials/manager.js set twitter.api_key "..."
  `)
  process.exit(0)
}

switch (platform) {
  case "telegram":
    await postTelegram(args[0])
    break
  case "reddit":
    const subIdx = args.indexOf("--sub")
    const sub = subIdx >= 0 ? args[subIdx + 1] : "web3"
    await postReddit(args[0], args[1] || "", sub)
    break
  case "twitter":
    await postTwitter(args[0])
    break
  case "hn":
    const textIdx = args.indexOf("--text")
    await postHN(args[0], args[1], textIdx >= 0 ? args[textIdx + 1] : "")
    break
  default:
    console.error(`Unknown platform: ${platform}`)
}
