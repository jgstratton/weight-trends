# Weight Trends - Implementation Plan

## Overview

A self-hosted web app for tracking body weight and visualizing trends over time.

**Tech Stack:** SvelteKit - PostgreSQL - Drizzle ORM - Chart.js - Docker Compose

---

## Phase 0 - Project Scaffolding

- [x] Initialize SvelteKit project with TypeScript
- [x] Add `.gitignore` for Node, SvelteKit artifacts
- [x] Update top-level `docker-compose.yml` with two services:
  - `postgres` - official Postgres image, volume for data persistence
  - `app` - Node-based image running SvelteKit (node adapter)
- [x] Create `Dockerfile` for the SvelteKit app (multi-stage: build to production)
- [x] Verify `docker compose up` brings both services up and they can communicate

## Phase 1 - Database Setup (Drizzle + PostgreSQL)

- [x] Install dependencies: `drizzle-orm`, `postgres` (postgres.js driver), `drizzle-kit`
- [x] Create `drizzle.config.ts` at the app root pointing at the Postgres connection string
- [x] Define schema in `src/lib/db/schema.ts`:
  - **users** - `id` (uuid, pk), `email` (text, unique), `created_at`
  - **sessions** - `id` (uuid, pk), `user_id` (fk -> users), `expires_at`, `created_at`
  - **otp_tokens** - `id` (uuid, pk), `user_id` (fk -> users), `code` (text), `expires_at`, `used_at`
  - **weights** - `id` (uuid, pk), `user_id` (fk -> users), `value` (numeric), `date` (date), `notes` (text, nullable), `created_at`
- [x] Create a Drizzle client instance (`src/lib/db/index.ts`)
- [x] Generate initial migration: `drizzle-kit generate`
- [x] Apply migrations on startup (or via a separate migrate script run before the app starts)

## Phase 2 - SvelteKit <-> Database Integration

- [x] Remove PocketBase SDK and related files (`src/lib/pocketbase.ts`, `pb_migrations/`)
- [x] Create server-only DB helper module (`src/lib/db/index.ts`) - exports the Drizzle client
- [x] Update `hooks.server.ts` to validate session cookie on every request and attach `locals.user`
- [x] Update `+layout.server.ts` to pass `user` from `locals` to the client

## Phase 3 - Authentication (Manual OTP via Email)

- [x] Install email sending dependency (sendgrid)
- [x] Build `/login` page - Step 1: email entry
  - POST action: look up or create user by email, generate a 6-digit code, store hashed code + expiry in `otp_tokens`, send email with code
- [x] Build `/login` page - Step 2: code verification (shown after email is sent)
  - POST action: look up unexpired, unused token for email, compare code (constant-time), mark token as used, create a new row in `sessions`, set a signed `session_id` cookie (HttpOnly, Secure, SameSite=Strict)
- [x] On successful auth, redirect to `/` (dashboard)
- [x] Build logout action: delete session row from DB, clear cookie
- [x] Protect all routes except `/login` in `hooks.server.ts` (redirect if no valid session)

## Phase 4 - Weight Logging

- [ ] Build `/log` page (or inline form on dashboard):
  - Inputs: weight value (number), date (defaults to today), optional notes
  - POST action inserts a row into the `weights` table for `locals.user.id`
- [ ] Build weight history list on the dashboard:
  - Server load function queries `weights` for the current user, sorted by date descending
  - Display as a simple table/list with date, value, notes
- [ ] Add ability to edit and delete entries (form actions with `?/update` and `?/delete`)

## Phase 5 - Chart / Trend Visualization

- [ ] Install Chart.js and `svelte-chartjs` (or use Chart.js directly via canvas)
- [ ] Build a line chart component (`src/lib/components/WeightChart.svelte`):
  - X-axis: date
  - Y-axis: weight
  - Raw data points as scatter/line
- [ ] Add a simple moving average trend line (e.g., 7-day SMA)
- [ ] Place chart prominently on the dashboard above/beside the log list
- [ ] Make chart responsive and handle empty/sparse data gracefully

## Phase 6 - Polish & Deploy

- [ ] Basic responsive layout (mobile-friendly - most logging happens on phones)
- [ ] Loading states and error handling on all data operations
- [ ] Environment variable config:
  - `DATABASE_URL` - Postgres connection string
  - `SESSION_SECRET` - secret for signing session cookies
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` - email config
- [ ] Final `docker-compose.yml` tuning:
  - Health checks (Postgres `pg_isready`, app waits for DB)
  - Restart policies
  - Volume mount for Postgres data persistence
  - Run `drizzle-kit migrate` as part of the app entrypoint or a one-shot init container
- [ ] Add a `README.md` with setup/run instructions
- [ ] Tag as `v0.1.0` - MVP complete

---

## File Structure (Target)

```
weight-trends-2/
+-- docker-compose.yml
+-- Dockerfile                  # SvelteKit app image
+-- app/                        # SvelteKit project root
|   +-- package.json
|   +-- drizzle.config.ts       # Drizzle Kit config
|   +-- svelte.config.js
|   +-- vite.config.ts
|   +-- tsconfig.json
|   +-- drizzle/                # Generated SQL migration files (committed)
|   +-- src/
|       +-- app.html
|       +-- app.css
|       +-- hooks.server.ts     # Session validation, locals.user
|       +-- lib/
|       |   +-- db/
|       |   |   +-- index.ts        # Drizzle client instance
|       |   |   +-- schema.ts       # Table definitions
|       |   +-- components/
|       |       +-- WeightChart.svelte
|       +-- routes/
|           +-- +layout.svelte      # Nav bar, logout button
|           +-- +layout.server.ts   # Pass user to client
|           +-- +page.svelte        # Dashboard (chart + log list)
|           +-- login/
|           |   +-- +page.svelte    # OTP email login (two-step)
|           +-- log/
|               +-- +page.svelte    # Weight entry form
+-- PLAN.md                     # <- You are here
```

## Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Database | PostgreSQL | Robust, self-hostable, standard SQL |
| ORM / query builder | Drizzle ORM | TypeScript-first, lightweight, close to SQL, great migration tooling |
| Auth method | Manual OTP via email (6-digit code) | Passwordless, simple UX - no PocketBase dependency |
| Session storage | Server-side DB sessions + HttpOnly cookie | Secure, easy to invalidate |
| Unit system | Store in kg, display user-preference later | Single canonical unit simplifies math |
| Chart library | Chart.js | Lightweight, well-documented, good enough for MVP |
| SvelteKit adapter | `adapter-node` | Required for Docker/self-host (not static/serverless) |
| Trend algorithm | 7-day simple moving average | Easy to implement, useful default |

---

*This plan will be updated as we iterate. Check off items as they are completed.*
