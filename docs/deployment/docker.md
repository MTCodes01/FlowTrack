# Docker Deployment

## Quick Start

```bash
# Clone the repository
git clone https://github.com/flowtrack-app/flowtrack.git
cd flowtrack

# Configure environment
cp .env.example .env
# Edit .env with your values (especially the secrets!)
nano .env

# Start the stack
docker compose up -d

# Check status
docker compose ps
docker compose logs -f
```

FlowTrack will be available at **http://localhost** (or your configured domain).

---

## Default Stack

```
Nginx :80
  ├── /api  → server:8080 (Go API)
  └── /     → web:80 (Nginx serving React)
               ↑
        postgres:5432
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Description | Default |
|---|---|---|
| `POSTGRES_PASSWORD` | Database password | **required** |
| `JWT_SECRET` | JWT signing secret | **required** |
| `API_SECRET` | API signing secret | **required** |
| `POSTGRES_DB` | Database name | `flowtrack` |
| `POSTGRES_USER` | Database user | `flowtrack` |
| `REGISTRATION_ENABLED` | Allow new registrations | `true` |
| `LEADERBOARD_ENABLED` | Enable leaderboard | `true` |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost` |

Generate secure secrets:
```bash
openssl rand -hex 32   # Use once for JWT_SECRET
openssl rand -hex 32   # Use again for API_SECRET
```

---

## Two Deploy Modes

### Development (builds from source)

```bash
docker compose up
```

Uses local Dockerfiles. Changes to source require rebuilding:

```bash
docker compose build
docker compose up
```

### Production (uses published images)

```bash
docker compose -f docker-compose.prod.yml up -d
```

Uses `ghcr.io/flowtrack-app/flowtrack-server:latest` and `ghcr.io/flowtrack-app/flowtrack-web:latest`.

To pin to a specific version:
```bash
FLOWTRACK_VERSION=v1.2.0 docker compose -f docker-compose.prod.yml up -d
```

---

## Data Persistence

The PostgreSQL volume is **named** and persists across container restarts:

```
flowtrack_postgres
```

To backup:
```bash
docker exec flowtrack-postgres-1 pg_dump -U flowtrack flowtrack > backup.sql
```

To restore:
```bash
cat backup.sql | docker exec -i flowtrack-postgres-1 psql -U flowtrack flowtrack
```

---

## Updating

```bash
# Pull latest images
docker compose -f docker-compose.prod.yml pull

# Recreate containers
docker compose -f docker-compose.prod.yml up -d

# Remove old images
docker image prune -f
```

---

## Health Checks

```bash
# Stack status
docker compose ps

# API health
curl http://localhost/api/health
# → {"status":"ok","version":"1.0.0"}

# View logs
docker compose logs server
docker compose logs web
```
