# Project Structure

Top-level files and purpose

- `package.json` — npm scripts and dependencies
- `vite.config.js` — Vite configuration
- `index.html` — SPA entry
- `src/` — application source code (see breakdown below)

Key `src/` folders

- `src/components/` — Reusable UI components and small widgets. Exports found in `src/components/index.js`.
- `src/context/` — React Context providers for global state (Auth, Vehicles, DamageReports, LogReports).
- `src/hooks/` — Custom hooks that encapsulate logic and side-effects (useAuth, useVehicles, useDamageReportForm, etc.).
- `src/pages/` — Route page components (Dashboard, Login, Register, Admin pages, etc.).
- `src/lib/` — Low-level helpers; `api.js` centralizes API requests and realtime manager.
- `src/styles/` — Global and component CSS (page-based organization in `styles/pages/`).
- `src/utils/` — Small utilities (photo handling, helpers).

Important files

- `src/App.jsx` — Top-level app and provider composition (wraps context providers and routes).
- `src/main.jsx` — Vite entry that mounts React.
- `src/components/index.js` — Barrel exports for components (Modal, ConfirmModal, ProfileMenu, VehicleCard, DamageReport form/inbox).
- `src/lib/api.js` — API request wrapper and `RealtimeManager` for WebSocket connectivity.

Where to make changes
- UI changes: `src/components/` and `src/styles/`
- State and data flows: `src/context/` and `src/hooks/`
- API changes: `src/lib/api.js` and `src/context/*` that call API endpoints

When adding new features
1. Add component(s) under `src/components/` and styles under `src/styles/components/`.
2. Add state or behaviour in `src/context/` or create a new context/hook.
3. Wire routes in `src/App.jsx` or the navigation router.
4. Update docs in `docs/` accordingly.
