🧵 1/ Perps Funding Pulse — это открытый дашборд для perpetual swaps.

Я выложил его в открытый доступ, и он уже показывает funding rates, OI, CVD и ликвидность в реальном времени.

Вот демо.

2/ Что показывает Perps Funding Pulse:

- Funding rates по топ-10 парам
- Cumulative Delta Volume (CVD) — визуально видно, где динеры
- Open Interest динамика
- Ликвидность в стакане
- Алерты на телеграм

3/ Ключевая фишка: **всё открыто, без подписок**.

Большинство подобных инструментов берут $30-100/мес за доступ к "продвинутым" данным. Perps Funding Pulse берёт $0.

4/ Как это работает:

- Стриминг данных с Binance, Bybit, OKX
- WebSocket с fallback на REST polling
- Хранилище в SQLite для исторических данных
- React + TypeScript фронтенд
- Telegram бот для алертов

5/ Кто это может использовать:

- Скальперы — мониторить funding rates перед входом
- Фундеры — отслеживать OI и CVD для позиционирования
- Разработчики — пример открытого инструмента для perps

6/ Я считаю, что **транспарентность данных** важнее, чем их продажа. Если вы видите, как динеры двигают рынок — вы лучше понимаете его.

Perps Funding Pulse даёт эту прозрачность бесплатно.

7/ Ссылки:

GitHub: github.com/yourname/perps-funding-pulse
Live Demo: perpsfundingpulse.vercel.app

#perpetuals #trading #opensource #crypto #defi
