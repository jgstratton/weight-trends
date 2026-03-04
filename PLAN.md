# Weight Trends - Implementation Plan

## Overview

A self-hosted web app for tracking body weight and visualizing trends over time.

**Tech Stack:** SvelteKit - PostgreSQL - Drizzle ORM - Chart.js - Docker Compose

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