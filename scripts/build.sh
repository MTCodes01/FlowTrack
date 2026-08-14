#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# FlowTrack — Build Script
# ─────────────────────────────────────────────────────────────────────────────
# Usage:
#   ./scripts/build.sh [server|agent|web|desktop|all]
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

COMPONENT="${1:-all}"
VERSION=$(git describe --tags --always --dirty 2>/dev/null || echo "dev")

echo "FlowTrack build — version: $VERSION"

build_server() {
  echo "→ Building server…"
  cd server
  CGO_ENABLED=0 go build \
    -ldflags="-w -s -X main.version=${VERSION}" \
    -o bin/server \
    ./cmd/server
  echo "  ✓ server/bin/server"
  cd ..
}

build_agent() {
  echo "→ Building agent…"
  cd agent
  GOOS="${GOOS:-$(go env GOOS)}"
  CGO_ENABLED=1 go build \
    -ldflags="-w -s" \
    -o bin/flowtrack-agent \
    ./cmd/agent
  echo "  ✓ agent/bin/flowtrack-agent"
  cd ..
}

build_web() {
  echo "→ Building web dashboard…"
  cd web
  npm ci --prefer-offline
  npm run build
  echo "  ✓ web/dist/"
  cd ..
}

build_desktop() {
  echo "→ Building desktop app…"
  cd desktop
  npm ci --prefer-offline
  npm run tauri build
  echo "  ✓ desktop/src-tauri/target/release/bundle/"
  cd ..
}

case "$COMPONENT" in
  server)  build_server ;;
  agent)   build_agent ;;
  web)     build_web ;;
  desktop) build_desktop ;;
  all)
    build_server
    build_agent
    build_web
    ;;
  *)
    echo "Usage: $0 [server|agent|web|desktop|all]"
    exit 1
    ;;
esac

echo ""
echo "Build complete!"
