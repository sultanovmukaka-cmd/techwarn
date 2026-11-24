# Отчёт о выполнении (Done)

## Статус интеграции REST API (http://localhost:4000/api)
- [x] **Создан API-слой (`src/api/index.js`)**:
  - Полная поддержка заголовка `Authorization: Bearer <TOKEN>`.
  - Управление токеном и данными пользователя в `localStorage`.
  - Нормализация данных (`_id`, координаты `[lat, lng]` / GeoJSON, типы `water/gas/electricity`, статусы).
  - Безотказный режим (offline fallback): если бэкенд временно не запущен, приложение сохраняет полную работоспособность на кэшированных данных с понятным индикатором статуса сети.

- [x] **Реализованы эндпоинты**:
  - `GET /api/outages` — автоматическая загрузка аварий при старте;
  - `GET /api/outages/:id` — выборка единичного инцидента;
  - `POST /api/outages` — создание инцидента через модальное окно подачи заявки;
  - `POST /api/outages/:id/confirm` — кнопка быстрого подтверждения жителями на карточках и в модальном окне;
  - `PATCH /api/outages/:id/status` — смена статуса для диспетчеров и администраторов;
  - `POST /api/auth/login` и `POST /api/auth/register` — авторизация пользователей;
  - `GET /api/auth/me` — проверка токена текущей сессии;
  - `GET /api/organizations/dashboard` — дашборд службы ЖКХ;
  - `GET /api/organizations/outages` — таблица подведомственных инцидентов;
  - `GET /api/organizations/export/csv` — скачивание выгрузки в CSV;
  - `GET /api/admin/users` — управление пользователями;
  - `GET /api/admin/organizations` — реестр служб;
  - `GET /api/admin/stats` — общая аналитика платформы.

- [x] **UI компоненты авторизации и кабинетов**:
  - `AuthModal.jsx` — форма входа с быстрыми пресетами для `org@netsveta.dev` и `admin@netsveta.dev`;
  - `CabinetModal.jsx` — кабинет службы с вкладками дашборда, заявок, выгрузки CSV и админ-панели;
  - `Navbar.jsx` — индикатор статуса соединения с API (`API Онлайн` / `API Офлайн`) с кнопкой мгновенного реконнекта;
  - `IncidentSidebar.jsx` & `IncidentModal.jsx` — кнопки подтверждения `+1` и селектор изменения статуса `PATCH`.

- [x] **Сборка проекта**:
  - Успешно проверена командой `npm run build`.
