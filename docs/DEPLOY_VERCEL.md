# Deploying to Vercel

Follow these steps to deploy the Car Rental frontend to Vercel.

1) Connect your repo
- Log in to https://vercel.com and create a new project by importing your GitHub (or GitLab/Bitbucket) repository.

2) Build settings (when prompted or in Project Settings)
- **Framework Preset:** Vite (auto-detected) or "Other"
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

3) Add environment variables (Project Settings → Environment Variables)
- `VITE_API_URL` — the backend API base URL (e.g. `https://api.example.com/api`)
- `VITE_WS_URL` — the WebSocket base (e.g. `wss://api.example.com/ws`)
- Optional: `VITE_PROXY_TARGET` is not required in production (used for local dev proxy)

4) SPA routing
- The repository includes `vercel.json` with a rewrite that serves `index.html` for all routes. No extra configuration required.

5) WebSocket requirements
- Ensure your backend is deployed with a secure WebSocket endpoint (`wss://`) and allows connections from your Vercel domain (CORS/origin rules). Vercel serves over HTTPS, so use `wss://` for `VITE_WS_URL`.

6) Deploy
- Save settings and trigger a deploy via the Vercel dashboard. Alternatively push to your repo's default branch and Vercel will build automatically.

7) Verify
- After deployment, open your Vercel URL and test the app flows: login, browse vehicles, submit a damage report, and verify real-time updates across two browser windows.

Local test (build + preview)

```bash
npm run build
npm run preview
```

Troubleshooting
- If the app can't reach the API: verify `VITE_API_URL` and that the backend accepts requests from your Vercel domain.
- If realtime doesn't connect: ensure `VITE_WS_URL` uses `wss://` and that your backend is reachable from production.

Security notes
- Do not embed backend secrets in client-side env vars — only public API URLs belong in `VITE_*` env vars. Keep any server-side secrets on your backend.
