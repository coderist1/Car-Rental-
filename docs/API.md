# API & Realtime

This document explains how the frontend interacts with the backend and the expectations for API endpoints and WebSocket events.

API base
- The frontend reads `VITE_API_URL` for the API base URL. `src/lib/api.js` sets `API_BASE` accordingly.
- Requests are made via `apiRequest(path, options)` which wraps `fetch` and handles JSON/form-data and CSRF for mutating requests.

Important endpoints (frontend expectations)

- Authentication
  - `POST /api/login/` — login, returns user/session info
  - `POST /api/register/` — register new user
  - `GET /api/users/` — admin: list users

- Vehicles & Bookings
  - `GET /api/cars/` — list vehicles
  - `POST /api/cars/` — create vehicle
  - `PATCH /api/cars/{id}/` — update vehicle
  - `DELETE /api/cars/{id}/` — delete vehicle
  - `GET /api/bookings/` — list bookings (user-scoped)
  - `POST /api/bookings/` — create booking
  - `PATCH /api/bookings/{id}/` — update booking

- Damage Reporting
  - `POST /api/damage-reports/` — create report (multipart/form-data for photos)
  - `GET /api/damage-reports/` — list reports
  - `GET /api/damage-reports/{id}/` — detail
  - `PATCH /api/damage-reports/{id}/` — update (drafts)
  - `DELETE /api/damage-reports/{id}/` — delete
  - `POST /api/damage-reports/{id}/photos/` — upload photo for a report
  - `POST /api/damage-reports/{id}/acknowledge/` — owner acknowledges
  - `POST /api/damage-reports/{id}/resolve/` — owner resolves

WebSocket / Realtime
- `src/lib/api.js` builds a `WS_BASE` from `VITE_WS_URL` or by converting `VITE_API_URL`.
- The frontend expects a WebSocket path: `${WS_BASE}/ws/sync/`.
- The `RealtimeManager` exposed in `src/lib/api.js` provides `connect()`, `disconnect()`, and `on(type, callback)` to subscribe to event types.

Event shapes (examples)

Create event
```json
{
  "type": "damage_reported",
  "action": "create",
  "id": "123",
  "payload": { /* full report object */ }
}
```

Update event
```json
{
  "type": "damage_updated",
  "action": "update",
  "id": "123",
  "payload": { /* updated fields */ }
}
```

Delete event
```json
{
  "type": "damage_deleted",
  "action": "delete",
  "id": "123"
}
```

Notes & best practices
- Keep realtime event `type` values stable; contexts subscribe by `type` (e.g., `vehicle_created`, `booking_updated`, `damage_reported`).
- Use `credentials: 'include'` for fetch requests (cookies/CSRF).
- Mutating requests include `X-CSRFToken` header fetched from cookies via `getCsrfToken()` in `api.js`.
