#!/usr/bin/env node
// UTM Builder — generates UTM-tagged URLs for all platforms
// Usage: node utm-builder.js <base-url> <campaign> [medium] [content]

const BASE_PARAMS = {
  utm_source: 'social',
  utm_medium: 'organic',
  utm_campaign: 'launch-2026',
};

const PLATFORM_PRESETS = {
  reddit: { utm_source: 'reddit', utm_medium: 'social' },
  twitter: { utm_source: 'twitter', utm_medium: 'social' },
  hn: { utm_source: 'hackernews', utm_medium: 'social' },
  linkedin: { utm_source: 'linkedin', utm_medium: 'social' },
  email: { utm_source: 'newsletter', utm_medium: 'email' },
  blog: { utm_source: 'blog', utm_medium: 'referral' },
  docs: { utm_source: 'docs', utm_medium: 'referral' },
};

function buildUrl(baseUrl, platform, overrides = {}) {
  const url = new URL(baseUrl);
  const params = { ...BASE_PARAMS, ...PLATFORM_PRESETS[platform], ...overrides };
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return url.toString();
}

function generateBatch(baseUrl) {
  const entries = [
    { platform: 'reddit', content: 'r-web3-post-1' },
    { platform: 'reddit', content: 'r-crypto-post-1' },
    { platform: 'reddit', content: 'r-blockchain-post-1' },
    { platform: 'reddit', content: 'r-technology-post-1' },
    { platform: 'reddit', content: 'r-selfhosted-post-1' },
    { platform: 'twitter', content: 'thread-1' },
    { platform: 'twitter', content: 'single-1' },
    { platform: 'twitter', content: 'thread-2' },
    { platform: 'twitter', content: 'single-2' },
    { platform: 'twitter', content: 'thread-3' },
    { platform: 'hn', content: 'show-hn-1' },
    { platform: 'hn', content: 'ask-hn-1' },
    { platform: 'hn', content: 'show-hn-2' },
    { platform: 'hn', content: 'ask-hn-2' },
    { platform: 'hn', content: 'show-hn-3' },
    { platform: 'linkedin', content: 'post-1' },
    { platform: 'linkedin', content: 'post-2' },
    { platform: 'linkedin', content: 'post-3' },
    { platform: 'linkedin', content: 'post-4' },
    { platform: 'linkedin', content: 'post-5' },
  ];

  const results = [];
  entries.forEach(({ platform, content }) => {
    const url = buildUrl(baseUrl, platform, { utm_content: content });
    results.push({ platform, content, url });
  });
  return results;
}

// CLI
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node utm-builder.js <base-url>');
  process.exit(1);
}

const base = args[0];
const batch = generateBatch(base);
batch.forEach((entry) => {
  console.log(`${entry.platform}\t${entry.content}\t${entry.url}`);
});

module.exports = { buildUrl, generateBatch };
