# Car Rental Web App

React + Vite frontend for the Car Rental System (IT323 Final Project).

> **Full system docs:** [FastAPI SYSTEM_DOCUMENTATION.md](../fastapi/SYSTEM_DOCUMENTATION.md)

## Team

| Name | Role |
|------|------|
| Polinar, Mathew Jhon K. | Backend, Database, Deployment |
| Dequino, Lovely C. | Web Application |
| Baquiro, Coneybelle L. | Mobile Application |
| Camense, Angela G. | UI/UX, Documentation, Testing |

## Quick Start

```powershell
npm install
npm run dev
```

Open: http://localhost:3000

## Backend Connection

Both web and mobile must point to the **same backend URL**.

**Local development** (`.env`):

```env
VITE_API_URL=http://127.0.0.1:8000
VITE_WS_URL=ws://127.0.0.1:8000
VITE_PROXY_TARGET=http://127.0.0.1:8000
```

**Production** (Vercel env vars):

```env
VITE_API_URL=https://fastapi-n7sg.onrender.com
VITE_WS_URL=wss://fastapi-n7sg.onrender.com
```

Start the backend first:

```powershell
cd c:\Users\Acer\fastapi
.\run.ps1
```

## Features

- Role-based auth (Owner, Renter, Admin)
- Vehicle management and booking workflow
- Damage / log reports with real-time WebSocket sync
- Bearer token auth for cross-origin production (Vercel → Render)

## Deploy

```powershell
npm run build
vercel --prod
```

See [docs/DEPLOY_VERCEL.md](docs/DEPLOY_VERCEL.md) and [.env.production.example](.env.production.example).

## Test Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@gmail.com | Admin123 | admin |
| matowner1@gmail.com | Owner123 | owner |
| matrenter1@gmail.com | admin123 | renter |

## Documentation

- [docs/README.md](docs/README.md) — developer docs index
- [docs/GETTING_STARTED.md](docs/GETTING_STARTED.md) — setup guide
- [../fastapi/README.md](../fastapi/README.md) — unified system architecture
