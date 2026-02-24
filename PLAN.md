# Weight Trends — Implementation Plan

## Overview

A self-hosted web app for tracking body weight and visualizing trends over time.

**Tech Stack:** SvelteKit · PocketBase · Chart.js · Docker Compose

---

## Phase 0 — Project Scaffolding

- [ ] Initialize SvelteKit project (`create-svelte`) with TypeScript
- [ ] Add `.gitignore` for Node, SvelteKit, PocketBase data
- [ ] Create top-level `docker-compose.yml` with two services:
  - `pocketbase` — official PocketBase image, volume for `pb_data`
  - `app` — Node-based image running SvelteKit (node adapter)
- [ ] Create `Dockerfile` for the SvelteKit app (multi-stage: build → production)
- [ ] Verify `docker compose up` brings both services up and they can communicate

## Phase 1 — PocketBase Setup

- [ ] Configure PocketBase admin account (first-run setup)
- [ ] Create collections via PocketBase migration or admin UI:
  - **users** (built-in auth collection) — enable email/magic-link auth
  - **weights** — fields: `user` (relation → users), `value` (number, kg/lbs), `date` (date), `notes` (text, optional)
- [ ] Enable magic-link (OTP) authentication on the users collection
- [ ] Set collection rules so users can only CRUD their own weight records:
  - List/View: `@request.auth.id = user`
  - Create: `@request.auth.id = @request.data.user`
  - Update/Delete: `@request.auth.id = user`

## Phase 2 — SvelteKit ↔ PocketBase Integration

- [ ] Install PocketBase JS SDK (`pocketbase`)
- [ ] Create a shared PocketBase client instance (`src/lib/pocketbase.ts`)
- [ ] Add an auth store that syncs PocketBase auth state with a Svelte store
- [ ] Create a layout load function that restores auth from cookie on SSR

## Phase 3 — Authentication (Magic Link)

- [ ] Build `/login` page:
  - Email input + "Send Magic Link" button
  - Calls `pb.collection('users').requestOTP(email)`
- [ ] Build OTP verification step on the same page:
  - Code input that appears after email is sent
  - Calls `pb.collection('users').authWithOTP(otpId, code)`
- [ ] On successful auth, redirect to `/` (dashboard)
- [ ] Add logout button in nav/layout
- [ ] Protect all routes except `/login` with an auth guard (redirect if not logged in)

## Phase 4 — Weight Logging

- [ ] Build `/log` page (or inline form on dashboard):
  - Inputs: weight value (number), date (defaults to today), optional notes
  - Submit creates a record in the `weights` collection
- [ ] Build weight history list on the dashboard:
  - Fetch user's weight records sorted by date descending
  - Display as a simple table/list with date, value, notes
- [ ] Add ability to edit and delete entries from the list

## Phase 5 — Chart / Trend Visualization

- [ ] Install Chart.js and `svelte-chartjs` (or use Chart.js directly via canvas)
- [ ] Build a line chart component (`src/lib/components/WeightChart.svelte`):
  - X-axis: date
  - Y-axis: weight
  - Raw data points as scatter/line
- [ ] Add a simple moving average trend line (e.g., 7-day SMA)
- [ ] Place chart prominently on the dashboard above/beside the log list
- [ ] Make chart responsive and handle empty/sparse data gracefully

## Phase 6 — Polish & Deploy

- [ ] Basic responsive layout (mobile-friendly — most logging happens on phones)
- [ ] Loading states and error handling on all data operations
- [ ] Environment variable config (`PUBLIC_POCKETBASE_URL`, etc.)
- [ ] Final `docker-compose.yml` tuning:
  - Health checks
  - Restart policies
  - Volume mounts for PocketBase data persistence
- [ ] Add a `README.md` with setup/run instructions
- [ ] Tag as `v0.1.0` — MVP complete

---

## File Structure (Target)

```
weight-trends-2/
├── docker-compose.yml
├── Dockerfile                  # SvelteKit app image
├── app/                        # SvelteKit project root
│   ├── package.json
│   ├── svelte.config.js
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── src/
│       ├── app.html
│       ├── app.css
│       ├── lib/
│       │   ├── pocketbase.ts       # PB client + auth store
│       │   └── components/
│       │       └── WeightChart.svelte
│       └── routes/
│           ├── +layout.svelte      # Nav bar, auth guard
│           ├── +layout.server.ts   # Restore auth from cookie
│           ├── +page.svelte        # Dashboard (chart + log list)
│           ├── login/
│           │   └── +page.svelte    # Magic link login
│           └── log/
│               └── +page.svelte    # Weight entry form
├── pb_migrations/              # Optional: PocketBase migration files
└── PLAN.md                     # ← You are here
```

## Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| PocketBase auth method | Magic link (OTP via email) | Passwordless, simple UX |
| Unit system | Store in kg, display user-preference later | Single canonical unit simplifies math |
| Chart library | Chart.js | Lightweight, well-documented, good enough for MVP |
| SvelteKit adapter | `adapter-node` | Required for Docker/self-host (not static/serverless) |
| Trend algorithm | 7-day simple moving average | Easy to implement, useful default |

---

*This plan will be updated as we iterate. Check off items as they are completed.*
