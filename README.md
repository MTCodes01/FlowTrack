<p align="center">
  <img src="app-icon.png" width="96" height="96" alt="FlowTrack Logo" />
</p>

<h1 align="center">FlowTrack</h1>

<p align="center">
  <strong>A native, lightweight application time tracker with leaderboards and self-hosted server support.</strong>
</p>

<p align="center">
  FlowTrack runs silently in your system tray, tracking which applications you use and for how long. Optionally sync to a self-hosted server to view detailed statistics and compete on leaderboards with friends or teammates.
</p>

---

## Download

### Desktop Application

| Platform | Download |
|---|---|
| 🪟 Windows (x64) | [FlowTrack-Setup.exe](https://github.com/MTCodes01/flowtrack/releases/latest) |
| 🍎 macOS (Apple Silicon) | [FlowTrack-macos-arm64.dmg](https://github.com/MTCodes01/flowtrack/releases/latest) |
| 🍎 macOS (Intel) | [FlowTrack-macos-x64.dmg](https://github.com/MTCodes01/flowtrack/releases/latest) |
| 🐧 Linux (AppImage) | [FlowTrack-linux-x64.AppImage](https://github.com/MTCodes01/flowtrack/releases/latest) |
| 🐧 Linux (DEB) | [FlowTrack-linux-x64.deb](https://github.com/MTCodes01/flowtrack/releases/latest) |

### Self-Hosted Server (Docker)

```bash
git clone https://github.com/MTCodes01/flowtrack.git
cd flowtrack
cp .env.example .env   # edit with your secrets
docker compose up -d
```

### Docker Images

```bash
docker pull ghcr.io/MTCodes01/flowtrack-server:latest
docker pull ghcr.io/MTCodes01/flowtrack-web:latest
```

---

## Architecture

```
┌─────────────────────────┐    ┌──────────────────────────┐
│   FlowTrack Desktop     │    │   FlowTrack Server       │
│  (Tauri + React)        │    │  (Docker)                │
│                         │    │                          │
│  • System tray          │    │  ┌──────────────────┐    │
│  • Dashboard UI         │◄───►  │   Go REST API    │    │
│  • Settings             │    │  └────────┬─────────┘    │
└─────────┬───────────────┘    │           │              │
          │                    │  ┌────────▼─────────┐    │
          │  HTTP Sync         │  │   PostgreSQL     │    │
          │                    │  └──────────────────┘    │
┌─────────▼───────────────┐    │                          │
│   FlowTrack Agent       │    │  ┌──────────────────┐    │
│  (Go background daemon) │    │  │   Web Dashboard  │    │
│                         │    │  │  (React + Nginx) │    │
│  • Tracks active window │    │  └──────────────────┘    │
│  • SQLite local store   │    │                          │
│  • Periodic server sync │    └──────────────────────────┘
└─────────────────────────┘
```

---

## Features

- 🎯 **Automatic tracking** - detects the active application every 5 seconds
- 💾 **Local-first** - all data stored locally in SQLite, works without a server
- 🔄 **Optional sync** - push data to your self-hosted server
- 📊 **Dashboard** - daily and weekly usage charts
- 🏆 **Leaderboards** - compete with team members on tracked time
- 🔒 **Privacy** - you control the server; no data sent to third parties
- 🪶 **Lightweight** - the agent uses < 10 MB RAM
- 🖥️ **Cross-platform** - Windows, macOS, Linux

---

## Quick Start (Desktop)

1. Download the installer for your platform above
2. Install and run - FlowTrack appears in the system tray
3. *(Optional)* Configure a server URL in Settings to enable sync and leaderboards

---

## Quick Start (Server)

```bash
# Clone
git clone https://github.com/MTCodes01/flowtrack.git
cd flowtrack

# Configure
cp .env.example .env
# Edit .env: set POSTGRES_PASSWORD, JWT_SECRET, API_SECRET

# Deploy
docker compose up -d

# Access
open http://localhost
```

See [Docker deployment docs](docs/deployment/docker.md) for full details.

---

## Documentation

| Topic | Link |
|---|---|
| Windows installation | [docs/installation/windows.md](docs/installation/windows.md) |
| macOS installation | [docs/installation/macos.md](docs/installation/macos.md) |
| Linux installation | [docs/installation/linux.md](docs/installation/linux.md) |
| Docker deployment | [docs/deployment/docker.md](docs/deployment/docker.md) |
| VPS / Cloud deployment | [docs/deployment/vps.md](docs/deployment/vps.md) |
| Development setup | [docs/development/setup.md](docs/development/setup.md) |
| Contributing | [CONTRIBUTING.md](CONTRIBUTING.md) |
| Security | [SECURITY.md](SECURITY.md) |
| Changelog | [CHANGELOG.md](CHANGELOG.md) |

---

## Release

Create a new release:

```bash
./scripts/release.sh 1.2.3
```

This tags the commit and triggers the GitHub Actions release pipeline which:

1. Runs all tests
2. Builds Windows/macOS/Linux desktop installers
3. Builds Docker images for amd64 and arm64
4. Publishes images to GHCR
5. Creates a GitHub Release with all installers attached
6. Generates and publishes `checksums.txt`

---

## License

[MIT](LICENSE) - © 2026 FlowTrack Contributors
