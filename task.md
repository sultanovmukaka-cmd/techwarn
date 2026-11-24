# Техническое задание: Frontend Developer №1 (API Интеграция)

## Цель
Интеграция фронтенд-приложения WarnTech с REST API бэкенда (`http://localhost:4000/api`).

## Спецификация поддерживаемых эндпоинтов

### 1. Публичные маршруты аварий
- `GET http://localhost:4000/api/outages` — получение списка всех инцидентов.
- `GET http://localhost:4000/api/outages/:id` — получение деталей конкретной аварии по `_id`.

### 2. Действия с авариями (POST / PATCH)
- `POST http://localhost:4000/api/outages` — создание новой аварии (форма подачи заявки).
- `POST http://localhost:4000/api/outages/:id/confirm` — подтверждение факта отключения жителями (+1 к счетчику).
- `PATCH http://localhost:4000/api/outages/:id/status` — обновление статуса (`active`, `in_progress`, `resolved`).

### 3. Авторизация (POST / GET)
- `POST http://localhost:4000/api/auth/login` — вход по `email` и `password`. Сохранение Bearer-токена в `localStorage`.
- `POST http://localhost:4000/api/auth/register` — регистрация нового аккаунта.
- `GET http://localhost:4000/api/auth/me` — проверка текущего токена (`Authorization: Bearer <TOKEN>`) и получение роли.

### 4. Кабинет организации (`org@netsveta.dev` или `admin@netsveta.dev`)
- `GET http://localhost:4000/api/organizations/dashboard` — дашборд с ключевыми показателями службы.
- `GET http://localhost:4000/api/organizations/outages` — список аварий в зоне ответственности службы.
- `GET http://localhost:4000/api/organizations/export/csv` — выгрузка отчета в формате CSV.

### 5. Панель администратора (`admin@netsveta.dev`)
- `GET http://localhost:4000/api/admin/users` — список пользователей системы.
- `GET http://localhost:4000/api/admin/organizations` — реестр организаций коммунальных служб.
- `GET http://localhost:4000/api/admin/stats` — общая аналитика и статистика системы.
