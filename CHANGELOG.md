# Changelog

All notable changes to FlowTrack will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Initial project setup

---

## [1.0.0] - 2026-08-14

### Added
- Background agent for Windows, macOS, and Linux
- Local SQLite storage with WAL mode
- Periodic HTTP sync to self-hosted server
- Go REST API server (Gin + GORM + PostgreSQL)
- JWT authentication (register / login / me)
- Batch session upload endpoint
- Daily and weekly stats aggregation
- Weekly leaderboard (top users by total tracked time)
- React web dashboard with dark theme
- Dashboard page: stat tiles, top-apps bars, weekly bar chart
- Leaderboard page with gold/silver/bronze rank styling
- Settings page with server URL configuration
- Tauri desktop application (system tray, close-to-tray, single-instance)
- Tauri autostart plugin
- Multi-stage Dockerfile for Go server (scratch final image)
- Multi-stage Dockerfile for React dashboard (Nginx Alpine)
- Docker Compose: base, dev override, production override
- Nginx reverse proxy with rate limiting and security headers
- GitHub Actions: CI, tests (with Postgres service), Docker publish, release
- Cross-platform release matrix: Windows NSIS/MSI, macOS DMG, Linux AppImage/DEB
- Checksums generation for all release artifacts
- GHCR Docker image publishing with semver tags (latest, v1.0.0, 1.0, 1)
- Installation documentation for Windows, macOS, Linux
- Docker and VPS deployment documentation
- Development setup guide
- CONTRIBUTING, SECURITY, CHANGELOG

[Unreleased]: https://github.com/flowtrack-app/flowtrack/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/flowtrack-app/flowtrack/releases/tag/v1.0.0
