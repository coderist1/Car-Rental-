# Getting Started

This guide describes how to set up and run the Car Rental web frontend locally.

Prerequisites
- Node.js (v18+ recommended)
- npm (bundled with Node.js)
- Optional: a running backend API (Django) for full features

Install dependencies

```bash
npm install
```

Environment variables
Create a `.env` file in the project root (same folder as `package.json`) with these values for local development:

```env
VITE_API_URL=http://127.0.0.1:8000/api
VITE_WS_URL=ws://127.0.0.1:8000/ws
# Optional: proxy target for Vite dev server
VITE_PROXY_TARGET=http://127.0.0.1:8000
```

Run the frontend

```bash
npm run dev
```

The Vite dev server will report a local URL (usually `http://localhost:3000`).

Build for production

```bash
npm run build
```

Preview a production build

```bash
npm run preview
```

Deployment
- The repository includes a `deploy` script using `gh-pages` which publishes the `dist` folder to GitHub Pages: `npm run deploy`.
- For production hosting, build (`npm run build`) and serve the `dist/` folder from a static host (Netlify, Vercel, Nginx).

Notes
- The frontend expects the backend API to expose endpoints described in `docs/API.md`.
- Realtime features require a WebSocket-capable backend (ASGI for Django Channels).
