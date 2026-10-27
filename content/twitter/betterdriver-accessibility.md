🧵 1/ Я опубликовал BetterDriver — Flutter-пакет, который делает навигацию доступной из коробки.

Это не просто "wrapper around accessibility APIs". Это системное решение для инклюзивных Flutter-приложений.

Вот что это такое.

2/ Проблема:

Flutter отлично подходит для кроссплатформы, но accessibility (Screen Reader, Dynamic Type, Reduced Motion) часто игнорируется. Особенно в кастомных виджетах.

BetterDriver решает это на уровне архитектуры, а не через точечные правки.

3/ Что делает BetterDriver:

- Автоматически добавляет семантику к Material/Cupertino виджетам
- Поддерживает TalkBack (Android) и VoiceOver (iOS)
- Обрабатывает Dynamic Type без перерисовки всего UI
- Уважает `MediaQuery.of(context).disableAnimations`
- Готовые accessibility-тесты для CI

4/ Ключевой принцип: **progressive enhancement**.

Приложение работает без BetterDriver, но с ним становится доступнее. Никаких breaking changes, никаких rewrites.

5/ Почему это важно:

В мире 1 миллиарда людей с инвалидностью. Если ваше приложение не доступно — вы теряете 15% потенциальных пользователей. И это не просто "nice to have". Это бизнес-требование.

6/ BetterDriver — мой вклад в инклюзивный флоат.

Я считаю, что открытые инструменты для accessibility должны быть стандартом, а не экзотикой.

7/ Ссылки:

GitHub: github.com/yourname/better_driver
pub.dev: pub.dev/packages/better_driver

Используйте, обсуждайте, предлагайте улучшения.

#flutter #accessibility #opensource #inclusion #dart
