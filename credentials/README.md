# Credentials Setup

## Telegram Bot (Required)

1. Open Telegram, search for **@BotFather**
2. Send `/newbot`
3. Follow instructions, copy token (format: `123456789:ABCdef...`)
4. Add bot to your group/channel
5. Get chat ID: https://api.telegram.org/bot<TOKEN>/getUpdates
6. Store in `.env`:
   ```
   TELEGRAM_BOT_TOKEN=123456789:ABCdef...
   TELEGRAM_CHAT_ID=-1001234567890
   ```

## Reddit (Required for posting)

1. Go to https://www.reddit.com/prefs/apps
2. Click "create app" → "script"
3. Fill name, description, redirect URI: `http://localhost:8080`
4. Copy `client_id` (under app name) and `client_secret`
5. Store in `.env`:
   ```
   REDDIT_CLIENT_ID=abc123...
   REDDIT_CLIENT_SECRET=secret123...
   REDDIT_USERNAME=your_username
   REDDIT_PASSWORD=your_password
   ```

## Twitter/X (Required for posting)

1. Go to https://developer.twitter.com/en/portal/dashboard
2. Create project/app
3. Get API keys: Bearer Token, API Key, API Secret, Access Token, Access Secret
4. Store in `.env`:
   ```
   TWITTER_BEARER_TOKEN=AAAAAAAA...
   TWITTER_API_KEY=abc123...
   TWITTER_API_SECRET=secret123...
   TWITTER_ACCESS_TOKEN=123456...
   TWITTER_ACCESS_SECRET=secret456...
   ```

## Hacker News (Optional)

HN uses Firebase API. Get key from Firebase console or use public API.

## Security

- Never commit `.env` to git
- Use environment variables in production
- Rotate keys regularly
