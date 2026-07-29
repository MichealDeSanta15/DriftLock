# DriftLock

**DriftLock automatically repairs broken web scraper selectors when the websites they target redesign.**

Web scrapers rely on CSS selectors (`h1.product-title`, `div.price`) to pull data out of a page. When a site redesigns — even a small class rename — every scraper pointed at it breaks silently. DriftLock monitors your target pages, detects when a tracked selector stops matching, and automatically finds and applies the closest replacement, with a full audit trail of every detection and repair.

**Live demo:**
- App: https://drift-lock.vercel.app
- Backend API docs: https://driftlock-backend.onrender.com/docs

> The backend runs on Render's free tier and sleeps after 15 minutes of inactivity — the first request after idle can take 30–60s to wake up.

## Features

- Add sites to monitor with an optional CSS selector to track
- On-demand drift detection: snapshots a page, diffs it against the last known-good version
- Automatic selector repair when drift is detected, with confidence scoring and method tracking
- Live dashboard updates via Supabase realtime subscriptions (no polling)
- Repair/change history, API key management, and a billing/plans overview
- Email/password authentication with protected dashboard routes

## Architecture

```
Next.js (Vercel)  ──►  Next.js API routes  ──►  FastAPI backend (Render)  ──►  Postgres (Supabase)
       │
       └──► Firebase Auth (login/signup)
       └──► Supabase client (realtime subscriptions + direct data reads)
```

- **Frontend** — Next.js 14 (App Router), TypeScript (strict), Tailwind CSS. Pages in `src/app/`, components in `src/components/`, API routes in `src/app/api/`.
- **Backend** — Python/FastAPI in `backend/`. Detection logic in `backend/detection/`, repair logic in `backend/repair/`, SQLAlchemy models in `backend/models/`, migrations via Alembic in `backend/alembic/`.
- **Auth** — Firebase Authentication (email/password). See `src/lib/auth.ts` and `src/lib/AuthContext.tsx`.
- **Database** — Supabase-hosted PostgreSQL. Supabase is used for the data layer only (sites, selectors, repair outcomes, change logs) — not for auth.

## Tech stack

| Layer      | Tech |
|------------|------|
| Frontend   | Next.js 14, React 18, TypeScript, Tailwind CSS, Framer Motion, Recharts |
| Backend    | Python 3.11, FastAPI, SQLAlchemy, Alembic, BeautifulSoup4 |
| Database   | PostgreSQL (Supabase) |
| Auth       | Firebase Authentication |
| Hosting    | Vercel (frontend), Render (backend), Supabase (database), Firebase (auth) |
| Testing    | Jest + Testing Library (frontend), pytest (backend) |

## Requirements

- Node.js 18+ and npm
- Python 3.11
- A Supabase project (free tier) — for the Postgres database
- A Firebase project (free tier) — for authentication, with Email/Password sign-in enabled

## Setup

1. **Clone and install dependencies**

   ```bash
   git clone https://github.com/MichealDeSanta15/DriftLock.git
   cd DriftLock
   npm install
   pip install -r backend/requirements.txt
   ```

2. **Configure environment variables**

   Copy the example files and fill in your own project values:

   ```bash
   cp .env.example .env.local
   cp backend/.env.example backend/.env
   ```

   - `.env.local` needs your Supabase project URL/anon key, your Firebase web config (from Firebase Console → Project Settings → Your apps), and `PYTHON_API_URL` (defaults to `http://localhost:8000` for local dev).
   - `backend/.env` needs `DATABASE_URL` pointing at your Supabase Postgres connection string (use the connection pooler string, and percent-encode any special characters in the password).

3. **Run database migrations**

   ```bash
   cd backend
   alembic upgrade head
   cd ..
   ```

4. **Run the app locally**

   In two terminals:

   ```bash
   # Terminal 1 — backend
   python -m uvicorn backend.api:app --host 0.0.0.0 --port 8000

   # Terminal 2 — frontend
   npm run dev
   ```

   Then open http://localhost:3000. The backend API docs are at http://localhost:8000/docs.

   On Windows, `scripts/start-dev.ps1` will start both plus a local static demo page in separate windows (note: it points the backend at a local SQLite file rather than your `backend/.env`, which is convenient for offline dev but means it won't use your Supabase database).

## Testing

```bash
# Frontend
npm test

# Backend
cd backend
pytest
```

## Deployment

The app is deployed across four free-tier services:

- **Vercel** — imports this repo directly, framework auto-detected as Next.js. Requires the same env vars as `.env.local`, plus `PYTHON_API_URL` set to your deployed backend URL (server-side only, not prefixed with `NEXT_PUBLIC_`).
- **Render** — deploys from the `render.yaml` blueprint at the repo root (New → Blueprint in the Render dashboard). Requires `DATABASE_URL` (Supabase connection string) and `FRONTEND_URL` (your Vercel URL, for CORS) set as environment variables on the service.
- **Supabase** — hosts the Postgres database; run `alembic upgrade head` against it once before first use.
- **Firebase** — hosts authentication; enable Email/Password sign-in under Authentication → Sign-in method.

## Project structure

```
src/
  app/            Next.js App Router pages and API routes
  components/     React components (dashboard, settings, common)
  lib/            Client utilities: Supabase client, Firebase auth, API helpers
backend/
  api.py          FastAPI app and route handlers
  detection/      Page snapshotting and drift detection
  repair/         Selector repair logic
  models/         SQLAlchemy models
  alembic/        Database migrations
  tests/          pytest suite
```

## Contributing

- Branch per feature/fix (`feat/...`, `fix/...`, `refactor/...`), open a PR into `main`, get it reviewed, then merge. Direct pushes to `main` are not used on this project.
- TypeScript is strict (no `any`); Python follows PEP 8.
- New features touching selector repair or detection should include a test in `backend/tests/` or `__tests__/`.
