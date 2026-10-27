🧵 1/ Я построил блокчейн на TypeScript. Без Go, без Rust, без магии.

Lumen Chain — это Layer-1 для IoT и edge-устройств. Вот как это было.

2/ Главная проблема: существующие L1 тяжеловесны для Raspberry Pi и встроенных систем.

Решение: TypeScript + libp2p + PoA консенсус + собственная виртуальная машина.

3/ Архитектура:
- PoA: стабильные ~2 сек блоки, предсказуемое время
- libp2p: модульная P2P сеть
- LevelDB + RocksDB для хранения
- Ethereum-совместимый JSON-RPC
- Smart contracts на собственной VM

4/ Лучшее решение: TypeScript отлично подходит для блокчейна. Статическая типизация ловит 80% ошибок до запуска.

Сеть из 7 нод на Raspberry Pi 4 даёт 500+ TPS.

5/ Текущий статус:
- Запускается на RPi4 за 5 минут
- Блок-эксплорер на React + TS
- 100% открытый код

Планы: light client protocol, zk-контракты, Flutter/React Native SDK.

6/ Если вы когда-нибудь хотели понять, как работает блокчейн "изнутри" — смотрите Lumen Chain.

GitHub: github.com/yourname/lumen-chain
Документация: docs.lumenchain.dev

⭐️ Помогает проекту расти.

#blockchain #typescript #opensource #iot
