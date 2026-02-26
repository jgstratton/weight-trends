# PocketBase Superuser Setup

This guide explains how to create (or update) the initial PocketBase superuser account for this project.

## Prerequisites

- Docker is running
- The project services are up:

```powershell
docker compose up -d
```

## Method 1 (Recommended): CLI via Docker

Use PocketBase's `superuser upsert` command to create the account or update it if it already exists.

```powershell
docker compose exec pocketbase /pb/pocketbase superuser upsert <EMAIL> '<PASSWORD>'
```


Expected success output:

```text
Successfully saved superuser "<EMAIL>"!
```

### Notes

- `upsert` is idempotent: rerunning updates existing superuser credentials.
- Password must be at least 8 characters.
- Quote passwords that contain special characters (like `$`).

## Method 2: Web UI (First-time setup)

1. Open: `http://localhost:8090/_/`
2. If no superuser exists yet, PocketBase will show the initial account creation screen.
3. Enter email/password and submit.

If a superuser already exists, use **Method 1** to update credentials.

## Verify Login

1. Open `http://localhost:8090/_/`
2. Sign in with your superuser email and password.
3. You should land on the PocketBase dashboard.

Optional API check:

- `http://localhost:8090/api/`

## Troubleshooting

- If the UI is not reachable, check container status:

```powershell
docker compose ps
```

- If `pocketbase` is not `Up`, restart services:
 
```powershell
docker compose up -d --build
```
