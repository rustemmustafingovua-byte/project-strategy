#!/usr/bin/env node
/**
 * Credentials Manager — безопасное хранение и использование credentials
 * 
 * Usage:
 *   node manager.js set telegram.token "123:ABC"
 *   node manager.js get telegram.token
 *   node manager.js list
 *   node manager.js export > .env
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs"
import { homedir, join } from "node:path"

const CRED_DIR = join(homedir(), ".project-strategy", "credentials")
const CRED_FILE = join(CRED_DIR, "credentials.json")

function ensureCredDir() {
  if (!existsSync(CRED_DIR)) {
    import("node:fs").then(fs => fs.mkdir(CRED_DIR, { recursive: true }))
  }
}

function loadCreds() {
  ensureCredDir()
  if (!existsSync(CRED_FILE)) return {}
  try {
    return JSON.parse(readFileSync(CRED_FILE, "utf8"))
  } catch {
    return {}
  }
}

function saveCreds(creds) {
  ensureCredDir()
  writeFileSync(CRED_FILE, JSON.stringify(creds, null, 2), { mode: 0o600 })
}

const args = process.argv.slice(2)
const cmd = args[0]
const key = args[1]
const value = args[2]

if (cmd === "set" && key && value) {
  const creds = loadCreds()
  const [service, field] = key.split(".")
  if (!creds[service]) creds[service] = {}
  creds[service][field] = value
  saveCreds(creds)
  console.log(`✓ Saved ${key}`)
} else if (cmd === "get" && key) {
  const creds = loadCreds()
  const [service, field] = key.split(".")
  const val = creds[service]?.[field]
  if (val) {
    console.log(val)
  } else {
    console.error(`✗ Not found: ${key}`)
    process.exit(1)
  }
} else if (cmd === "list") {
  const creds = loadCreds()
  for (const [service, fields] of Object.entries(creds)) {
    console.log(`\n[${service}]`)
    for (const [field, value] of Object.entries(fields)) {
      const masked = value.length > 8 ? value.slice(0, 4) + "****" : "****"
      console.log(`  ${field}: ${masked}`)
    }
  }
} else if (cmd === "export") {
  const creds = loadCreds()
  const lines = []
  for (const [service, fields] of Object.entries(creds)) {
    for (const [field, value] of Object.entries(fields)) {
      const envKey = `${service.toUpperCase()}_${field.toUpperCase()}`
      lines.push(`${envKey}=${value}`)
    }
  }
  console.log(lines.join("\n"))
} else {
  console.log(`
Credentials Manager

Commands:
  set <service.field> <value>   Save credential
  get <service.field>           Retrieve credential
  list                          List all (masked)
  export                        Export as .env format

Examples:
  node manager.js set telegram.token "123:ABC"
  node manager.js get telegram.token
  node manager.js export > .env
  `)
}
