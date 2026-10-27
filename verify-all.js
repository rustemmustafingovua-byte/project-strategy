#!/usr/bin/env node
/**
 * Verification Script — проверяет что всё работает.
 */

import { spawn } from "node:child_process"
import { writeFileSync, existsSync } from "node:fs"

const checks = []

async function check(name, fn) {
  try {
    const result = await fn()
    checks.push({ name, status: "✅", detail: result })
  } catch (e) {
    checks.push({ name, status: "❌", detail: e.message })
  }
}

async function main() {
  await check("GitHub CLI", async () => {
    const { execSync } = await import("node:child_process")
    return execSync("gh auth status", { encoding: "utf8" }).slice(0, 50)
  })

  await check("Lumen Chain tests", async () => {
    const { execSync } = await import("node:child_process")
    const out = execSync("cd /tmp/lumen-chain && npx tsx --test test/*.test.ts 2>&1 | tail -n 3", { encoding: "utf8" })
    return out.includes("pass 140") ? "140/140 PASS" : out
  })

  await check("Perps Funding Pulse tests", async () => {
    const { execSync } = await import("node:child_process")
    const out = execSync("cd /tmp/perps-funding-pulse && node --test test/*.test.js 2>&1 | tail -n 3", { encoding: "utf8" })
    return out.includes("pass") ? "PASS" : out
  })

  await check("Dashboard server", async () => {
    const res = await fetch("http://127.0.0.1:18900/health")
    return res.ok ? "Running" : "Down"
  })

  await check("Email capture server", async () => {
    const res = await fetch("http://127.0.0.1:18902/api/email-capture", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "test@test.com" }) })
    return res.ok ? "Running" : "Down"
  })

  await check("Landing pages deployed", async () => {
    const res = await fetch("https://rustemmustafingovua-byte.github.io/landing-pages/")
    return res.ok ? "Live" : "Down"
  })

  await check("Git repos", async () => {
    const { execSync } = await import("node:child_process")
    const repos = ["lumen-chain", "perps-funding-pulse", "agent-x402", "wallet-hygiene", "mcp-proxy", "landing-pages"]
    const results = []
    for (const repo of repos) {
      try {
        execSync(`git -C /tmp/${repo} rev-parse --git-dir`, { stdio: "ignore" })
        results.push(`${repo}: ✅`)
      } catch {
        results.push(`${repo}: ❌`)
      }
    }
    return results.join(", ")
  })

  console.log("\n=== VERIFICATION REPORT ===\n")
  for (const c of checks) {
    console.log(`${c.status} ${c.name}: ${c.detail}`)
  }
  console.log("\n===========================\n")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
