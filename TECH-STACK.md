# Tech Stack — crazy-crypto-wallet

Стек основан на `ai-exchange-web` и максимально переиспользует его технологии при создании PIE-компонентов.

---

## Фреймворк и среда

| Технология | Версия | Заметки |
|---|---|---|
| Next.js | 16 | App Router, standalone output, SSR/CSR |
| React | 19 | + React DOM |
| TypeScript | 5.9 | strict mode |
| Bun | 1.x | пакетный менеджер + runtime (dev и Docker) |

---

## UI библиотека и стили

| Технология | Заметки |
|---|---|
| **@swarm.ing/pieui** | Основная UI-библиотека: `PieCard`, `PieTelegramRoot`, `registerPieComponent`, `useAjaxSubmit`, `UIRendererContext` |
| Tailwind CSS 4 | + `tailwind-merge` + `class-variance-authority` + `clsx` |
| styled-components 6 | Для сложных динамических стилей |
| Radix UI | `@radix-ui/react-dialog`, `radix-ui` — доступные примитивы |
| Lucide React | Основной набор иконок |
| @iconify/react | Расширенный набор иконок |
| @web3icons/react | Иконки криптовалют и сетей |
| @ledgerhq/crypto-icons | Иконки Ledger-экосистемы |

---

## Шрифты

Подключаются через `next/font/google`:

- **Bricolage Grotesque** (`font-lexa`) — display/заголовки
- **Onest** (`font-sparkling`) — основной текст, есть кириллица
- **Inter** — фолбэк для кириллицы (где Onest не покрывает)
- Geist, Geist Mono — системные/моно
- Семейство Rubik (80s Fade, Beastly, Bubbles, Burned, Dirt, Glitch, Pixels и др.) — декоративные

---

## Web3 / Blockchain

| Технология | Назначение |
|---|---|
| **Turnkey** (`@turnkey/react-wallet-kit`, `@turnkey/viem`, `@turnkey/solana`) | Кастодиальные кошельки через passkey/email. EVM + Solana. Без кастомного бэкенда через Auth Proxy |
| **viem 2** | EVM-клиент, EIP-1193 провайдер, низкоуровневые транзакции |
| **@solana/web3.js** | Solana |
| **near-api-js** | NEAR Protocol |
| **@nktkas/hyperliquid** | Hyperliquid DEX: `HttpTransport`, `InfoClient` |
| **@aurora-is-near/intents-swap-widget** | Aurora/NEAR свап-виджет (`WidgetConfigProvider`) |

---

## Реальное время / Транспорт

| Технология | Назначение |
|---|---|
| **Centrifuge** | WebSocket PubSub-сервер. Адрес через `PIE_CENTRIFUGE_SERVER`. Флаг `useCentrifugeSupport` на компоненте |
| **Socket.IO** | Альтернативный транспорт. Флаг `useSocketioSupport` на компоненте |
| **PIE API** | REST-бэкенд через `PIE_API_SERVER`. AJAX-действия через `useAjaxSubmit` |

---

## Markdown и QR

| Технология | Назначение |
|---|---|
| react-markdown + remark-gfm | Рендер Markdown в чате |
| react-qr-code | QR-коды для депозита |

---

## Мониторинг и ошибки

| Технология | Заметки |
|---|---|
| **@sentry/nextjs 10** | Error tracking + performance. Edge + server конфиги. Tunnel route `/monitoring` |

---

## Тестирование и документация

| Технология | Назначение |
|---|---|
| **Storybook 10** | `@storybook/nextjs-vite`, addon-docs, addon-a11y, addon-vitest, @chromatic-com/storybook |
| **Vitest 4** | Unit-тесты + `@vitest/browser-playwright` + `@vitest/coverage-v8` |
| **Playwright** | E2E / browser-тесты |

---

## Инструменты разработки

| Технология | Заметки |
|---|---|
| ESLint 9 | + `eslint-config-next` + `eslint-plugin-storybook` |
| Prettier | `lint` = `prettier --write ./` |
| PostCSS 8 | + `@tailwindcss/postcss` |
| Babel React Compiler | Плагин `babel-plugin-react-compiler` |
| Vite 8 | Используется Storybook-ом |

---

## Инфраструктура и деплой

| Технология | Заметки |
|---|---|
| **Docker** + docker-compose | Multi-stage build на `oven/bun:1`. Продакшн образ `bun:1-slim` |
| **Nginx** | Reverse proxy. WebSocket Upgrade. SSL-терминация |
| **GitHub Actions** | CI/CD: push to `main` → SSH → `git pull` → `docker compose up -d --build` |
| **PIE CLI** | `.pie/config.json` — регистрация проекта, `api_key`, генерация компонентов |

---

## Платформы

| Платформа | Заметки |
|---|---|
| **Telegram Mini App** | `telegram-web-app.js`, `Telegram.WebApp` API: BackButton, expand(), disableVerticalSwipes() |
| **Max (VK/Сбер)** | `max-web-app.js`, `PIE_PLATFORM=max` |

---

## Архитектурные паттерны PIE

Ключевые концепции для создания компонентов через `pie` CLI:

```
PieTelegramRoot          — корневой компонент, управляет роутингом и загрузкой страниц с сервера
registerPieComponent     — регистрация компонента в реестр PIE
PieCard                  — базовая карточка с серверными данными
useAjaxSubmit            — AJAX-действия (отправка форм, кнопки)
UIRendererContext         — контекст рендерера (доступ к событиям, навигации)
piecache.json            — статический preload кэш страниц
PieQueryOptions          — настройки React Query (staleTime, gcTime, refetch*)
useCentrifugeSupport     — real-time обновления через Centrifuge WS
useSocketioSupport       — real-time через Socket.IO
```

### Структура piecomponent:
```
piecomponents/
  MyCard/
    index.ts          ← registerPieComponent(...)
    ui/
      MyCard.tsx      ← React компонент
      MyCard.stories.tsx
    types/
      index.ts        ← типы пропсов (data, events)
    utils/
      index.ts        ← утилиты
```

### Переменные окружения:
```
PIE_API_SERVER          — REST-бэкенд
PIE_CENTRIFUGE_SERVER   — WebSocket PubSub
PIE_PLATFORM            — telegram | max
PIE_ENABLE_RENDERING_LOG
NEXT_PUBLIC_TURNKEY_ORGANIZATION_ID
NEXT_PUBLIC_TURNKEY_AUTH_PROXY_CONFIG_ID
NEXT_PUBLIC_ETH_RPC_URL
NEXT_PUBLIC_SOL_RPC_URL
SENTRY_ORG / SENTRY_PROJECT / SENTRY_AUTH_TOKEN
```
