# Development Setup

This guide walks you through setting up a complete FlowTrack development environment.

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Go | 1.22+ | https://go.dev/dl |
| Node.js | 20 LTS | https://nodejs.org |
| Rust | stable | https://rustup.rs |
| Docker | 24+ | https://docs.docker.com/get-docker |
| Git | any | https://git-scm.com |

---

## Clone

```bash
git clone https://github.com/MTCodes01/flowtrack.git
cd flowtrack
```

---

## Backend (Server)

```bash
cd server

# Install dependencies
go mod download

# Copy env
cp ../.env.example .env.dev
# Edit .env.dev with local settings

# Start PostgreSQL
docker compose up postgres -d

# Run server
DATABASE_URL=postgres://flowtrack:flowtrack@localhost:5432/flowtrack?sslmode=disable \
JWT_SECRET=dev-secret \
API_SECRET=dev-secret \
go run ./cmd/server
```

API available at `http://localhost:8080`.

---

## Web Dashboard

```bash
cd web
npm install
npm run dev
```

Dashboard available at `http://localhost:5173`.

> The Vite dev server proxies `/api` requests to `http://localhost:8080`.

---

## Desktop App

Tauri requires Rust and platform-specific dependencies.

### Linux

```bash
sudo apt-get install -y libgtk-3-dev libwebkit2gtk-4.1-dev \
  libayatana-appindicator3-dev librsvg2-dev
```

### macOS

Xcode Command Line Tools:
```bash
xcode-select --install
```

### Windows

Install [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) with the **Desktop development with C++** workload.

### Run Desktop

```bash
cd desktop
npm install
npm run tauri:dev
```

---

## Agent

```bash
cd agent
go mod download

# Linux/macOS
go run ./cmd/agent

# Windows — requires CGO for sqlite3
go run ./cmd/agent
```

The agent reads configuration from environment variables (see `.env.example`).

---

## Running All Services Together

Using Docker Compose dev override:

```bash
# Start postgres only
docker compose up postgres -d

# In separate terminals:
cd server && go run ./cmd/server
cd web && npm run dev
cd agent && go run ./cmd/agent
```

Or with full hot-reload stack:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

---

## Testing

```bash
# Server tests (requires running postgres)
cd server && go test ./...

# Agent tests
cd agent && go test ./...

# Web type check
cd web && npm run type-check

# Web lint
cd web && npm run lint
```

---

## Project Structure

```
flowtrack/
├── agent/          Go background agent
├── desktop/        Tauri desktop app (React + Rust)
├── server/         Go REST API server
├── web/            React web dashboard
├── shared/         Shared TypeScript types
├── docker/         Nginx and Postgres config
├── scripts/        Build and release helpers
├── docs/           Documentation
└── .github/        CI/CD workflows
```
