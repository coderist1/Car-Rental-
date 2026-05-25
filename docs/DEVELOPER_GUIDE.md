# Developer Guide

This guide collects developer commands, lint/build/test notes, and deployment tips.

Scripts (from `package.json`)
- `npm run dev` — start Vite dev server
- `npm run build` — produce production build under `dist/`
- `npm run preview` — preview a built `dist/` locally
- `npm run deploy` — (configured) deploy `dist/` to GitHub Pages using `gh-pages`

Standard workflow
1. Create a branch for your work.
2. Implement component/state changes in `src/`.
3. Update or add styles in `src/styles/`.
4. Run `npm run dev` to test locally.
5. Update docs in `docs/` to reflect changes.

Testing & validation
- There are no automated tests in this repository by default. Add your preferred test runner (Jest + React Testing Library) if you want to maintain unit tests.
- Manual checks:
  - Run the app and exercise authentication flows, booking flows, and the damage report workflows.
  - Verify realtime updates by running two browser windows and performing an action (e.g., submit a damage report) and confirming both windows update.

Style & formatting
- The project uses plain CSS files. Keep styles scoped to components and pages under `src/styles/components/` and `src/styles/pages/`.

Adding new components
1. Add the component file under `src/components/` and its CSS under `src/styles/components/`.
2. Export it from `src/components/index.js` for convenient imports.
3. Add usage examples to `docs/COMPONENTS.md` if it is a shared, reusable component.

Deployment notes
- For production, ensure `VITE_API_URL` and `VITE_WS_URL` point to production backends (use `https://` and `wss://`).
- Frontend can be served from any static host; backend must support ASGI (for WebSockets) behind a proxy.

Further work
- Add automated tests and continuous integration.
- Add type checking (TypeScript or PropTypes) for better maintainability.
