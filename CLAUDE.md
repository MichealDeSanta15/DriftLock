# DriftLock — CLAUDE.md

This file tells Claude Code who you are, what your project is, and how to behave. Customize the brackets.

## # Project

**DriftLock** is a web scraper resilience service that automatically repairs broken selectors when websites redesign. Stack: Next.js + Supabase for the control plane, Python backend for detection and repair logic, PostgreSQL for selector versioning and outcome tracking.

## # Conventions

- TypeScript strict. No any. Tailwind for styling. Components in `src/components/`. Pages in `src/app/` (Next.js App Router). API routes in `src/app/api/`. Supabase client utilities in `src/lib/supabase.ts`.
- Python backend follows PEP 8. Detection logic in `backend/detection/`, repair logic in `backend/repair/`, database models in `backend/models/`.
- No environment variables hardcoded. Use `.env.local` (Next.js) and `.env` (Python) with examples in `.env.example`.
- Commit messages: `feat: add selector cache`, `fix: repair logic timeout`, `refactor: consolidate detection signals`.

## # Testing

Run `npm test` for integration tests. Every new feature that touches selector repair or detection must have at least one test in `__tests__/`. Python backend uses pytest in `backend/tests/`. Test new scrapers with at least two real sites before shipping.

## # Git workflow

Branch per feature: `feat/api-endpoint`, `fix/detection-race-condition`, `refactor/repair-algorithm`. Commit early, message is descriptive. Never push to main; open PR, get review, squash and merge.

## # Boundaries

- Do not delete files without asking.
- Do not change `.env` or environment variables without confirming first.
- Do not install new packages without confirming—check `package.json` and `requirements.txt` first.
- Do not commit secrets, API keys, or test credentials.

## # Why this matters

Without CLAUDE.md, every session starts from zero. With it, Claude Code already knows your stack, your rules, and your style. Write it once, save hours every day.
