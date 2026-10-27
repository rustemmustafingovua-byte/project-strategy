**Title: Perps Funding Pulse — open-source perps dashboard (funding, OI, CVD, alerts)**

Hey r/algotrading,

I built **Perps Funding Pulse**, an open-source dashboard for perpetual swaps analytics. It shows funding rates, Open Interest, Cumulative Delta Volume (CVD), and orderbook liquidity in real time — and it's completely free.

**What you get:**
- Funding rates across top-10 perps pairs
- CVD visualization (see where smart money flows)
- OI dynamics
- Orderbook depth
- Telegram alerts

**Data sources:**  
Binance, Bybit, OKX via WebSocket with REST fallback. Historical data stored in SQLite.

**Why open source?**  
Most perps analytics tools charge $30-100/month for "advanced" data. I think market transparency should be free. If traders can see how liquidity moves, they understand the market better.

**Tech stack:**  
React + TypeScript frontend, WebSocket streaming, SQLite backend, Telegram bot for alerts.

**Who is this for?**
- Scalpers monitoring funding before entries
- Position traders tracking OI and CVD
- Developers who want an open-source perps data pipeline

**Links:**
- GitHub: https://github.com/yourname/perps-funding-pulse
- Live demo: https://perpsfundingpulse.vercel.app

No paywalls, no email signups, no "pro tiers". Just data.

Happy to answer questions about the data pipeline or feature requests.

---

*Transparency > paywalls.*
