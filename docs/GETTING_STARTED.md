# Getting Started

This guide describes how to set up and run the Car Rental web frontend locally.

> **Unified system:** Web and mobile share one FastAPI backend. See [FastAPI README](../../fastapi/README.md).

## Prerequisites

- Node.js 18+
- npm
- Running FastAPI backend (`c:\Users\Acer\fastapi`) — start with `.\run.ps1`

## Install dependencies

```bash
npm install
```

## Environment variables

Create a `.env` file in the project root:

```env
VITE_API_URL=http://127.0.0.1:8000
VITE_WS_URL=ws://127.0.0.1:8000
VITE_PROXY_TARGET=http://127.0.0.1:8000
```

For production (Vercel), use the same URL as mobile:

```env
VITE_API_URL=https://fastapi-n7sg.onrender.com
VITE_WS_URL=wss://fastapi-n7sg.onrender.com
```

## Run the frontend

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
