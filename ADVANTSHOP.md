# Сборка Redoc для AdvantShop

Форк [Redocly/redoc](https://github.com/Redocly/redoc) для документации Management API в админке
AdvantShop (`AdvantShop.Web/Areas/Admin/Views/SettingsApi/ManagementApi.cshtml`). Работа идёт в ветке
`advantshop`, она начинается от релизного тега апстрима (сейчас `redoc@3.1.0`).

## Что добавлено

Опции `init`, которых нет в исходном Redoc:

- `translations` — подписи интерфейса по ключам перевода: `{ 'responses': 'Ответы', … }`.
  Ключ без перевода остаётся английским. `{{name}}` подставляется из параметров вызова. В атрибуте
  `<redoc translations="…">` передаётся JSON.
- `hidePageActions` — скрывает меню Copy / Open in ChatGPT / Open in Claude у заголовков.
- `maxDisplayedOperations` — сколько операций раздела видно до «Show N more...», `'all'` — все.
  По умолчанию 8, как в исходном Redoc.
- `expandGroups` — все разделы сразу раскрыты, как после «+ Show». Операции при этом монтируются
  лениво, по мере прокрутки.

Вложенные поля схем раскрывает уже существующая опция `schemasExpansionLevel` (`'all'` — все уровни).

Ключи — те, что компоненты передают в `translate(…)` и в поля `*TranslationKey`. Список собирается
поиском по `src/` и `node_modules/@redocly/theme/src/`.

Код:

- `src/utils/translations.ts` — словарь, хуки `useTranslate` и `useTranslationKeys`;
- `src/RedoclyApiDocsStandalone.tsx` — хуки уходят в `ThemeDataContext`;
- `src/components/Header/HeaderPageActions.tsx` — `hidePageActions`;
- `src/components/panels/GroupPanelItem.tsx` — `maxDisplayedOperations`;
- `src/pages/EntryPage.tsx`, `src/pages/TopLevelEntryView.tsx`, `src/pages/GroupPage.tsx` — `expandGroups`;
- `src/types/options.ts`, `src/options/normalizeOptions.ts` — сами опции;
- `scripts/advantshop/build.mjs` — сборка для платформы.

## Сборка

Нужны Node.js ≥ 22 и git.

```bash
npm ci
node scripts/advantshop/build.mjs ../Advantshop_dev/AdvantShop.Web/Areas/Admin/Content/vendors/redoc
```

Скрипт собирает и минифицирует standalone-бандл (`npm run build:standalone`, `npm run minify`)
и кладёт в `bundles/`:

- `redoc.standalone.js` — с пометкой в начале: собрано из форка, ветка и коммит;
- `LICENSE` — MIT самого Redoc;
- `THIRD-PARTY-NOTICES.txt` — лицензии сторонних пакетов, вошедших в бандл.

Если передать каталог, скрипт копирует туда все три файла. Собирайте из закоммиченного состояния:
при незакоммиченных правках в пометке будет `+uncommitted`.

После копирования в платформе:

1. Пересобрать фронтенд не нужно: страница импортирует бандл напрямую.
2. Открыть «Настройки → API → Management API» и проверить, что подписи русские.
3. Закоммитить три файла в `vendors/redoc` вместе с правками словаря, если они нужны.

## Проверки

```bash
npx tsgo --noEmit --skipLibCheck
npm run lint
npm run unit
```

На Node 25 и новее у Node есть свой `localStorage`, и он ломает тесты, которые рендерят компоненты.
Запускайте их так:

```bash
NODE_OPTIONS=--no-experimental-webstorage npm run unit
```

## Обновление до нового релиза Redoc

```bash
git remote add upstream https://github.com/Redocly/redoc.git   # один раз
git fetch upstream --tags
git switch advantshop
git merge redoc@3.2.0          # нужный тег
npm ci
NODE_OPTIONS=--no-experimental-webstorage npm run unit
node scripts/advantshop/build.mjs ../Advantshop_dev/AdvantShop.Web/Areas/Admin/Content/vendors/redoc
```

Конфликты возможны только в файлах из списка выше. После обновления стоит заново пройтись по ключам:
в новом релизе могли появиться подписи, которых нет в словаре страницы.

## Что остаётся английским

- Подписи, которые Redoc пишет без ключа: «One of:», «Enum:», «Array of …», «… or null»,
  «Search endpoints, schemas, and more...», «API docs by».
- Составные подписи: «Show 4 more...», «Show 23 array properties». Слова в них переводятся по отдельности
  (`actions.show`, `array`, `properties`), и в русском из них не собрать фразу с правильным склонением.
  В админке их не видно: всё раскрыто опциями.
- Вкладка «Payload» у примеров запроса: её подпись — название «языка» в `codeSamples`, а по нему
  же находится сама вкладка.
