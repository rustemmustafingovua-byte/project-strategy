#!/usr/bin/env node
/**
 * Email Capture — простой бэкенд для сбора email с лендингов.
 *
 * Запуск:
 *   node email-capture.js
 *
 * Endpoint:
 *   POST /api/email-capture
 *   Body: { email: "user@example.com", source: "lumen-chain" }
 */

import { createServer } from "node:http"
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs"
import { join } from "node:path"

const DATA_FILE = join(import.meta.dirname, "emails.json")
const PORT = process.env.EMAIL_CAPTURE_PORT || 18910

let emails = []
if (existsSync(DATA_FILE)) {
  try {
    emails = JSON.parse(readFileSync(DATA_FILE, "utf8"))
  } catch {}
}

const server = createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Headers", "content-type")

  if (req.method === "OPTIONS") {
    res.writeHead(204).end()
    return
  }

  if (req.url === "/api/email-capture" && req.method === "POST") {
    const chunks = []
    req.on("data", (c) => chunks.push(c))
    req.on("end", () => {
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString())
        const entry = {
          email: body.email,
          source: body.source || "unknown",
          ts: new Date().toISOString(),
        }
        emails.push(entry)
        writeFileSync(DATA_FILE, JSON.stringify(emails, null, 2))
        console.log("New email:", entry.email, "from", entry.source)
        res.writeHead(200, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ ok: true, total: emails.length }))
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ error: "invalid json" }))
      }
    })
    return
  }

  if (req.url === "/api/emails" && process.env.EMAIL_CAPTURE_ADMIN === "1") {
    res.writeHead(200, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ total: emails.length, emails }))
    return
  }

  res.writeHead(404).end("not found")
})

server.listen(PORT, () => {
  console.log(`Email capture running on http://127.0.0.1:${PORT}`)
  console.log(`POST /api/email-capture { email, source }`)
})
