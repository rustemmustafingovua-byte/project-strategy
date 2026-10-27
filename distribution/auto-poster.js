#!/usr/bin/env node

/**
 * Unified auto-poster for Reddit, Hacker News, and Twitter/X.
 * Reads prepared posts from /tmp/project-strategy/social-posts-ready/
 * Rate-limited: 1 post per 30s minimum.
 * Logs results to /tmp/project-strategy/distribution/posting-log.json
 *
 * Usage:
 *   node auto-poster.js [reddit|hn|twitter|all]
 *
 * Required env vars:
 *   REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USER_AGENT
 *   HN_API_KEY
 *   TWITTER_BEARER_TOKEN, TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const POSTS_DIR = path.resolve("/tmp/project-strategy/social-posts-ready");
const LOG_PATH = path.resolve("/tmp/project-strategy/distribution/posting-log.json");
const MIN_DELAY_MS = 30_000;

function loadLog() {
  try {
    return JSON.parse(fs.readFileSync(LOG_PATH, "utf8"));
  } catch {
    return { runs: [] };
  }
}

function saveLog(log) {
  fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2));
}

function appendLog(entry) {
  const log = loadLog();
  log.runs.push({ ...entry, ts: new Date().toISOString() });
  saveLog(log);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function httpsRequest(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : http;
    const req = mod.request(url, opts, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on("error", reject);
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

/* ---------- Reddit ---------- */

async function postToReddit(post) {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  const userAgent = process.env.REDDIT_USER_AGENT || "betterdriver-bot/1.0";
  if (!clientId || !clientSecret) throw new Error("Reddit credentials missing");

  // Step 1: Get access token
  const authBody = new URLSearchParams({ grant_type: "client_credentials" });
  const authRes = await httpsRequest("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      "User-Agent": userAgent,
      "Authorization": "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: authBody.toString(),
  });

  if (authRes.status !== 200) {
    throw new Error(`Reddit auth failed: ${JSON.stringify(authRes.body)}`);
  }
  const accessToken = authRes.body.access_token;

  // Step 2: Submit post
  const title = post.title || path.basename(post.file, ".md").replace(/-/g, " ");
  const content = fs.readFileSync(post.file, "utf8");
  const subreddit = "r/web3"; // default; can be overridden per-file via YAML frontmatter
  const submitBody = new URLSearchParams({
    title,
    text: content.slice(0, 40000),
    kind: "self",
    sr: subreddit,
  });

  const submitRes = await httpsRequest(`https://oauth.reddit.com/api/submit`, {
    method: "POST",
    headers: {
      "User-Agent": userAgent,
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: submitBody.toString(),
  });

  if (submitRes.status === 200 && submitRes.body.json && submitRes.body.json.errors && submitRes.body.json.errors.length) {
    throw new Error(`Reddit submit error: ${JSON.stringify(submitRes.body.json.errors)}`);
  }
  return { platform: "reddit", id: submitRes.body.json?.data?.name || submitRes.status, url: `https://reddit.com${submitRes.body.json?.data?.url || ""}` };
}

/* ---------- Hacker News (Firebase) ---------- */

async function postToHN(post) {
  const apiKey = process.env.HN_API_KEY;
  if (!apiKey) throw new Error("HN_API_KEY missing");

  const title = post.title || path.basename(post.file, ".md").replace(/-/g, " ");
  const content = fs.readFileSync(post.file, "utf8");

  // HN Algolia/submit endpoint requires title + text.
  const payload = JSON.stringify({ title, text: content, api_key: apiKey });
  const res = await httpsRequest("https://hacker-news.firebaseio.com/v0/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
  });

  if (res.status !== 200) {
    throw new Error(`HN submit failed (${res.status}): ${JSON.stringify(res.body)}`);
  }
  return { platform: "hackernews", id: res.body, url: `https://news.ycombinator.com/item?id=${res.body}` };
}

/* ---------- Twitter / X ---------- */

async function postToTwitter(post) {
  const bearer = process.env.TWITTER_BEARER_TOKEN;
  const apiKey = process.env.TWITTER_API_KEY;
  const apiSecret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret = process.env.TWITTER_ACCESS_SECRET;
  if (!bearer || !apiKey || !apiSecret || !accessToken || !accessSecret) {
    throw new Error("Twitter credentials missing");
  }

  const text = fs.readFileSync(post.file, "utf8").slice(0, 280);
  const res = await httpsRequest("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${bearer}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (res.status !== 201) {
    throw new Error(`Twitter error (${res.status}): ${JSON.stringify(res.body)}`);
  }
  return { platform: "twitter", id: res.body.data?.id, url: `https://twitter.com/i/status/${res.body.data?.id}` };
}

/* ---------- Main ---------- */

async function loadPosts(platform) {
  const map = { reddit: "reddit", hn: "hacker-news", twitter: "twitter", twitterx: "twitter" };
  const target = map[platform];
  if (!target) throw new Error(`Unknown platform: ${platform}`);

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"));
  const posts = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(POSTS_DIR, file), "utf8");
    if (content.toLowerCase().includes(target)) {
      posts.push({ file: path.join(POSTS_DIR, file), title: file.replace(".md", "") });
    }
  }
  return posts;
}

async function postForPlatform(platform, posts) {
  const runners = { reddit: postToReddit, hn: postToHN, twitter: postToTwitter };
  const runner = runners[platform];
  if (!runner) throw new Error(`Unsupported platform: ${platform}`);

  const results = [];
  for (const post of posts) {
    try {
      console.log(`[${platform}] Posting ${post.file}`);
      const result = await runner(post);
      console.log(`[${platform}] OK:`, result.url);
      results.push({ ...post, result });
    } catch (err) {
      console.error(`[${platform}] FAIL ${post.file}:`, err.message);
      results.push({ ...post, error: err.message });
    }
    await sleep(MIN_DELAY_MS);
  }
  return results;
}

async function main() {
  const target = process.argv[2] || "all";
  const platforms = target === "all" ? ["reddit", "hn", "twitter"] : [target];
  const summary = { startedAt: new Date().toISOString(), results: {} };

  for (const platform of platforms) {
    const posts = await loadPosts(platform);
    console.log(`Loaded ${posts.length} posts for ${platform}`);
    const results = await postForPlatform(platform, posts);
    summary.results[platform] = results;
  }

  summary.finishedAt = new Date().toISOString();
  appendLog(summary);
  console.log("Done. Summary:", JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
