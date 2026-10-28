# Ecosystem Architecture — Warm Palm Movement

> **Project**: «Тепло Долоні» / Warm Palm Movement  
> **Nature**: Semi-commercial activist site for elderly aid; donations fund volunteer rewards, aid stays free.  
> **Read time target**: 10 minutes.

---

## 1. Services & Ports

| Service | Tech | Port | Notes |
|---------|------|------|-------|
| `web` | Python stdlib `ThreadingHTTPServer` (`server.py`) | **8080** (TCP) | Serves static assets + REST API + SQLite in one process |
| (Optional) Reverse proxy | nginx / Cloudflare | 443 → 8080 | Fronts TLS, rate limits, HSTS |
| (Optional) LiqPay PSP | External | — | Payment webhook callback to `/api/payments/liqpay/callback` |
| (Optional) Webhook / SMTP | Slack / Discord / Telegram / SMTP | — | Outbound only on events |

**Docker Compose**: single `web` service, port `8080:8080`, named volume `wp-data` for `data/`.

---

## 2. Data Flow

```
Browser
   │
   │  HTTPS (recommended)
   ▼
[Reverse Proxy?] ──► X-Forwarded-For / X-Forwarded-Proto
   │
   ▼
Python server.py (ThreadingHTTPServer, 8080)
   │
   ├─► Static files (HTML/CSS/JS/fonts/images) — served directly
   │     └─► SSR: /news.html injects JSON-LD + noscript from DB
   │
   ├─► REST API (JSON)
   │     └─► SQLite via thread-safe RLock + WAL journal
   │
   ├─► Webhooks / SMTP (fire-and-forget on events)
   │
   └─► Backups (VACUUM INTO → data/backups/)
```

**Key paths**:
- Public read: static pages, `/api/news`, `/api/settings`, `/api/health`
- Public write: `/api/messages` (forms), `/api/donations` (intent), `/api/payments/liqpay/callback` (PSP)
- Admin: `/api/auth/*`, `/api/messages/*`, `/api/news/*`, `/api/donations`, `/api/settings`, `/api/stats`, `/api/audit`, `/api/users`

---

## 3. Database Schemas

Single SQLite file: `data/warmpalm.db` (WAL mode, foreign keys on).

### `users`
| Column | Type | Notes |
|--------|------|-------|
| `id` | INTEGER PK | |
| `username` | TEXT UNIQUE | |
| `password_hash` | TEXT | PBKDF2-SHA256, 200k iterations, `salt$hex` |
| `role` | TEXT | `admin` / `editor` / `viewer` |
| `email` | TEXT | |
| `last_login` | TEXT | ISO-8601 UTC |
| `created_at` | TEXT | ISO-8601 UTC |

### `messages`
| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | `m` + token_hex(8) |
| `type` | TEXT | `forms.help` / `forms.volunteer` / `forms.contact` / `forms.newsletter` |
| `lang` | TEXT | `uk` / `en` |
| `page` | TEXT | Origin page path |
| `ip` | TEXT | Client IP (respects proxy) |
| `user_agent` | TEXT | |
| `fields_json` | TEXT | Arbitrary validated fields |
| `status` | TEXT | `new` / `read` … |
| `notes` | TEXT | Admin notes |
| `created_at` | TEXT | ISO-8601 UTC |

### `news`
| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | `n` + token_hex(8) |
| `title_uk` | TEXT | Required |
| `title_en` | TEXT | |
| `category` | TEXT | Default `Новини` |
| `date` | TEXT | Display date |
| `excerpt_uk` / `excerpt_en` | TEXT | |
| `image` | TEXT | URL or `assets/…` |
| `published` | INTEGER | 0 / 1 |
| `created_at` / `updated_at` | TEXT | ISO-8601 UTC |

### `settings`
| Column | Type | Notes |
|--------|------|-------|
| `key` | TEXT PK | Currently `contact` |
| `value_json` | TEXT | JSON blob |
| `updated_at` | TEXT | ISO-8601 UTC |

`contact` JSON shape: `{ phone, email, address, iban, minDonate, maxDonate }`

### `audit_log`
| Column | Type | Notes |
|--------|------|-------|
| `id` | INTEGER PK | |
| `action` | TEXT | e.g. `login_ok`, `message_create`, `liqpay_callback` |
| `detail` | TEXT | Truncated to 500 chars |
| `ip` | TEXT | |
| `created_at` | TEXT | ISO-8601 UTC |

> **Retention**: Bounded to 10,000 newest rows by background sweep.

### `rate_limits`
| Column | Type | Notes |
|--------|------|-------|
| `bucket` | TEXT PK | IP / IP+type |
| `hits_json` | TEXT | `[timestamp, …]` array |
| `updated_at` | TEXT | ISO-8601 UTC |

> **Retention**: Deleted after 600s.

### `donations`
| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | `d` + token_hex(8) |
| `amount` | INTEGER | UAH cents/whole (stored as int) |
| `currency` | TEXT | Default `UAH` |
| `period` | TEXT | `once` / `monthly` |
| `method` | TEXT | `card` / `liqpay` / `apple` / `google` / `iban` |
| `name` / `email` / `message` | TEXT | |
| `status` | TEXT | `intent` / `paid` / `failure` / `reversed` / `sandbox` / `mismatch` |
| `ip` | TEXT | |
| `created_at` | TEXT | ISO-8601 UTC |

> **Public totals** only include `status='paid'` to avoid inflating numbers with intents or sandbox.

---

## 4. API Endpoints

All routes return JSON unless noted. Admin endpoints require valid `wp_session` cookie (admin/editor/viewer depending on endpoint).

### Public
| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/health` | Liveness / DB check |
| `POST` | `/api/auth/login` | Username + password → session cookie |
| `POST` | `/api/auth/logout` | Destroy session |
| `GET` | `/api/auth/me` | Current session info |
| `POST` | `/api/messages` | Submit contact/help/volunteer/newsletter form |
| `GET` | `/api/messages` | List messages (admin) |
| `PUT` | `/api/messages/:id` | Update message status/notes (admin/editor) |
| `DELETE` | `/api/messages/:id` | Delete single message (admin/editor) |
| `DELETE` | `/api/messages` | Bulk delete all (admin) |
| `GET` | `/api/messages/export.csv` | CSV export (admin) |
| `POST` | `/api/donations` | Create donation intent (validates amount vs settings) |
| `GET` | `/api/donations` | List + totals (admin) |
| `GET` | `/api/news` | Published news (public) |
| `GET` | `/api/settings` | Public contact config |
| `POST` | `/api/payments/liqpay/callback` | LiqPay S2S webhook (HMAC signature) |
| `POST` | `/api/csp-report` | CSP violation reports |

### Admin-only
| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/auth/password` | Change own password (re-auth + rate-limit) |
| `POST` | `/api/news` | Create article (admin/editor) |
| `GET` | `/api/news/admin` | All articles including drafts |
| `PUT` | `/api/news/:id` | Update article (admin/editor) |
| `DELETE` | `/api/news/:id` | Delete article (admin/editor) |
| `PUT` | `/api/settings` | Update contact + donation min/max (admin) |
| `GET` | `/api/stats` | Aggregated counts |
| `GET` | `/api/audit` | Last 100 audit events |
| `GET` | `/api/users` | List users (admin) |
| `POST` | `/api/users` | Create user (admin) |
| `PUT` | `/api/users/:id` | Update user (admin) |
| `DELETE` | `/api/users/:id` | Delete user (admin, guards last admin/self) |

---

## 5. Monetization Flows

1. **Donation Intent**  
   - Visitor submits `amount`, `period`, `method`, `email` via `/api/donations`.  
   - Server validates amount against `settings.minDonate` / `maxDonate`, rate-limits by IP.  
   - Record stored with `status='intent'`.  
   - Returns `id` + demo placeholder; production redirects to LiqPay/Stripe with `id` as `order_id`.

2. **Payment Confirmation (LiqPay example)**  
   - PSP posts callback to `/api/payments/liqpay/callback` (`application/x-www-form-urlencoded`).  
   - Server verifies HMAC-SHA1 signature using `WP_LIQPAY_PRIVATE_KEY`.  
   - Amount and currency are cross-checked against stored intent; mismatch → `mismatch` status + alert.  
   - `success` / `sandbox` → `paid` (sandbox kept separate from real totals).  
   - `failure` / `reversed` → respective status.

3. **Notification side-effects**  
   - Every donation intent, successful callback, or mismatch fires `notify()`:  
     - Appends to `notify.log`  
     - Optional Slack/Discord/Telegram webhook  
     - Optional SMTP email to `WP_SMTP_TO`

4. **Settings / IBAN**  
   - Admin configures contact block (phone, email, address, IBAN) + min/max donation via `/api/settings`.  
   - Rendered publicly on `support.html` / footer.

---

## 6. Security Model

### Perimeter & Headers
- **CSP**: `default-src 'self'`; `frame-src https://www.openstreetmap.org`; `report-uri` + `report-to` for violations.  
- **HSTS** sent only when `WP_TRUST_PROXY=1` AND `X-Forwarded-Proto: https`.  
- **Hardening headers**: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` disables geolocation/mic/camera/usb/interest-cohort/autoplay, `COOP`/`CORP` same-origin.  
- **Server version**: `WarmPalm/1.0` only; no Python runtime disclosure.

### Authentication & Session
- **Passwords**: PBKDF2-HMAC-SHA256, 200k iterations, random 16-byte salt.  
- **Login**: `POST /api/auth/login` with origin check; failure path uses dummy hash to prevent timing enumeration.  
- **Lockout**: 5 failures / 15 minutes per IP.  
- **Session cookie**: `wp_session`, `HttpOnly`, `SameSite=Strict`, `Max-Age=43200`, `Secure` only behind trusted proxy.  
- **Re-authentication**: Password change requires current password + rate-limited PBKDF2 verify.

### Input & Integrity
- **CSRF-lite**: Mutating endpoints (`POST/PUT/DELETE`) require matching `Origin` or `Referer` to `Host`.  
- **Rate limiting**: IP-bucketed sliding windows in `rate_limits` table; message forms 3/min, donations 5/min, password 5/5min, CSP reports 30/min.  
- **Honeypot**: `company` field silently drops spam.  
- **Body limits**: 64 KiB max JSON / form payload.  
- **Field sanitization**: Length caps, regex validation for phone/email, CSV formula-injection guard.

### Data & Backups
- **Static path traversal**: denylist for sensitive paths; allowlist extensions; `ROOT` escape; hidden files 404.  
- **Data directory never served**: `data/`, `server.py`, `.git`, etc. blocked even without directory listing.  
- **Database**: WAL mode + `VACUUM INTO` snapshots every 3600s, keep 24, stored in `data/backups/` (excluded from web root).  
- **Audit trail**: `audit_log` records logins, mutations, payment callbacks, errors (bounded 10k rows).

### Failures & Incident Response
- `notify()` degrades gracefully: log → webhook → SMTP, each wrapped in try/except.  
- Maintenance sweeps (rate-limit expiry, audit pruning, backups) run on every request, throttled to 300s, never propagate exceptions.  
- Static handler wraps entire inner logic so uncaught exceptions return 500 and audit, not a dropped connection.

---

## 7. Frontend & i18n

- Pure HTML/CSS/JS, no build step.  
- Bilingual: Ukrainian default; `?lang=en` or `localStorage['wp-lang']`.  
- Self-hosted fonts: Manrope + Source Serif 4 (8 woff2 files under `assets/fonts`).  
- Color tokens in CSS custom properties (`--primary: #0A6E63`, etc.).  
- Forms post JSON to `/api/*` with client-side validation parity.  
- Admin panel: `admin.html` + `js/admin.js`; works in API mode or localStorage demo mode.

---

## 8. Testing

| Suite | Focus | Count |
|-------|-------|-------|
| `tests/test_api.py` | Security, RBAC, CSRF, cache, static serving, load, proxy, SSR, backups, WCAG, token balance, PWA, sitemap/hreflang, CSP, re-auth, `.env` coverage, palette/manifest, dynamic SQL, LiqPay trust | 217 |
| `tests/test_liqpay.py` | LiqPay webhook signature, amount, statuses | 19 |
| `tests/test_presets.py` | Frontend donation modal + form submission (macOS `osascript`) | 29 |
| `tests/test_i18n_meta.py` | Language meta tags, canonical, URL sync | 30 |

Run: `python3 tests/test_api.py` (spawns `server.py` on a random port).

---

## 9. Deployment Topology

```
Internet
   │
   ▼
[CDN / Reverse Proxy] (nginx / Cloudflare)
   │  TLS termination, HSTS, rate-limit, WAF
   ▼
Docker: python:3.12-alpine + server.py
   │  wp-data volume → data/warmpalm.db
   ▼
Optional outbound:
   - LiqPay HTTPS callback receiver
   - Slack / Telegram webhook
   - SMTP (STARTTLS)
```

- **No external database** — SQLite file on volume.  
- **Stateless workers** — not applicable; single-threaded-with-threads server. Scale horizontally via multiple containers behind proxy with shared volume (acceptable for low write volume).  
- **Backup/restore**: `kill server → cp backup → rm -f -wal/-shm → start`.

---

## 10. Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `WP_HOST` | No | `127.0.0.1` | Bind address |
| `WP_PORT` | No | `8080` | Port |
| `WP_ADMIN_USER` | No | `admin` | Admin login |
| `WP_ADMIN_PASS` | **Yes** | — | Admin password (min 12 chars) |
| `WP_DB` | No | `data/warmpalm.db` | SQLite path |
| `WP_TRUST_PROXY` | No | `0` | Honor `X-Forwarded-*` |
| `WP_RATE_MSG` | No | `3` | Form rate limit per minute |
| `WP_WEBHOOK_URL` | No | — | Slack/Discord/Telegram webhook |
| `WP_SMTP_*` | No | — | SMTP host/port/user/pass/from/to |
| `WP_LIQPAY_PRIVATE_KEY` | No | — | LiqPay HMAC verification |
| `WP_BACKUP_DIR` | No | `data/backups` | Snapshot directory |
| `WP_BACKUP_KEEP` | No | `24` | Retain N snapshots (0=off) |
| `WP_BACKUP_INTERVAL` | No | `3600` | Seconds between snapshots |

---

## 11. Key Design Decisions

- **One file, stdlib only** (`server.py`, ~1964 lines) — no framework, minimal attack surface.  
- **Monolithic static+API** — avoids CORS and multi-service orchestration for a low-traffic site.  
- **WAL + VACUUM INTO backups** — production-safe snapshots without pausing writes.  
- **Server-rendered news JSON-LD** — SEO without client-side hydration.  
- **Self-hosted fonts + no Google calls** — privacy + no external render-blocking.  
- **Dummy PBKDF2 hash on missing user** — prevents username enumeration via timing.  
- **Rightmost X-Forwarded-For** — client cannot prepend fake IPs to bypass rate limits.

---

## 12. Known External Integrations

| Integration | Direction | Auth |
|-------------|-----------|------|
| LiqPay callback | Inbound POST | HMAC-SHA1 `signature` + `data` |
| Webhook (Slack/Discord/Telegram) | Outbound POST | URL secret via env |
| SMTP email | Outbound STARTTLS | User/pass via env |
| OpenStreetMap iframe | Outbound embed | None (public) |

No OAuth, no third-party JS, no cookies beyond `wp_session`.

---

*Generated from source review of `/Users/admin/warm-palm-foundation` (server.py, docker-compose.yml, Dockerfile, tests, SECURITY.md, .env.example, nginx.conf).*
