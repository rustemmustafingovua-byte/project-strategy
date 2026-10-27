#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="/tmp/project-strategy/.env"
ENV_EXAMPLE="/tmp/project-strategy/.env.example"

cat > "$ENV_FILE" <<EOF
# Reddit
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
REDDIT_USER_AGENT=betterdriver-bot/1.0

# Hacker News
HN_API_KEY=

# Twitter / X
TWITTER_BEARER_TOKEN=
TWITTER_API_KEY=
TWITTER_API_SECRET=
TWITTER_ACCESS_TOKEN=
TWITTER_ACCESS_SECRET=
EOF

check() {
  local name="$1"
  local value
  value="$(grep -E "^${name}=" "$ENV_FILE" | cut -d'=' -f2-)"
  if [[ -n "$value" ]]; then
    echo "✅ $name is set"
  else
    echo "❌ $name is missing"
  fi
}

echo "=== Credential Setup Wizard ==="
echo ""

if [[ -f "$ENV_EXAMPLE" ]]; then
  echo "Found .env.example — copy it? (y/n)"
  read -r answer
  if [[ "$answer" == "y" ]]; then
    cp "$ENV_EXAMPLE" "$ENV_FILE" || true
  fi
fi

echo ""
echo "Enter values (leave blank to skip):"
read -p "REDDIT_CLIENT_ID: " v
sed -i '' "s/^REDDIT_CLIENT_ID=.*/REDDIT_CLIENT_ID=$v/" "$ENV_FILE"
read -p "REDDIT_CLIENT_SECRET: " v
sed -i '' "s/^REDDIT_CLIENT_SECRET=.*/REDDIT_CLIENT_SECRET=$v/" "$ENV_FILE"
read -p "HN_API_KEY: " v
sed -i '' "s/^HN_API_KEY=.*/HN_API_KEY=$v/" "$ENV_FILE"
read -p "TWITTER_BEARER_TOKEN: " v
sed -i '' "s/^TWITTER_BEARER_TOKEN=.*/TWITTER_BEARER_TOKEN=$v/" "$ENV_FILE"
read -p "TWITTER_API_KEY: " v
sed -i '' "s/^TWITTER_API_KEY=.*/TWITTER_API_KEY=$v/" "$ENV_FILE"
read -p "TWITTER_API_SECRET: " v
sed -i '' "s/^TWITTER_API_SECRET=.*/TWITTER_API_SECRET=$v/" "$ENV_FILE"
read -p "TWITTER_ACCESS_TOKEN: " v
sed -i '' "s/^TWITTER_ACCESS_TOKEN=.*/TWITTER_ACCESS_TOKEN=$v/" "$ENV_FILE"
read -p "TWITTER_ACCESS_SECRET: " v
sed -i '' "s/^TWITTER_ACCESS_SECRET=.*/TWITTER_ACCESS_SECRET=$v/" "$ENV_FILE"

echo ""
echo "=== Verification ==="
check REDDIT_CLIENT_ID
check REDDIT_CLIENT_SECRET
check HN_API_KEY
check TWITTER_BEARER_TOKEN
check TWITTER_API_KEY
check TWITTER_API_SECRET
check TWITTER_ACCESS_TOKEN
check TWITTER_ACCESS_SECRET

echo ""
echo "Saved to $ENV_FILE"
