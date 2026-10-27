#!/usr/bin/env node
/**
 * RSS Feed Generator — генерирует RSS из контента.
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const BASE = join(import.meta.dirname, "..")
const OUTPUT = join(BASE, "rss.xml")

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60)
}

function mdToHtml(md) {
  return md
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
    .replace(/\*(.*?)\*/g, "<i>$1</i>")
    .replace(/`(.*?)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br>")
}

function generateRss() {
  const blogDir = join(BASE, "content", "blog")
  const files = readdirSync(blogDir).filter((f) => f.endsWith(".md"))
  const items = files.map((file) => {
    const raw = readFileSync(join(blogDir, file), "utf8")
    const lines = raw.split("\n")
    const title = lines.find((l) => l.startsWith("# "))?.slice(2) || file
    const desc = lines.slice(1).join("\n").trim().slice(0, 200)
    const link = `https://rustemmustafingovua-byte.github.io/landing-pages/blog/${slugify(title)}`
    const date = new Date().toISOString()
    return `
    <item>
      <title>${title}</title>
      <link>${link}</link>
      <description>${mdToHtml(desc)}</description>
      <pubDate>${date}</pubDate>
      <guid>${link}</guid>
    </item>`
  })

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Rustem Mustafin Projects</title>
    <link>https://rustemmustafingovua-byte.github.io/landing-pages/</link>
    <description>Web3 + AI projects by Rustem Mustafin</description>
    ${items.join("\n")}
  </channel>
</rss>`

  writeFileSync(OUTPUT, rss)
  console.log("RSS generated:", OUTPUT)
}

generateRss()
