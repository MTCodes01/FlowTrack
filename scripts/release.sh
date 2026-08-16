#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# FlowTrack - Release Tagging Script
# ─────────────────────────────────────────────────────────────────────────────
# Usage:
#   ./scripts/release.sh 1.2.3
#
# This script:
#   1. Validates the version is semver
#   2. Ensures working tree is clean
#   3. Creates and pushes a signed git tag
#   GitHub Actions picks up the tag and runs the release workflow.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

VERSION="${1:-}"

if [ -z "$VERSION" ]; then
  echo "Usage: $0 <version>  (e.g. $0 1.2.3)"
  exit 1
fi

# Strip leading v if provided
VERSION="${VERSION#v}"
TAG="v${VERSION}"

# Validate semver pattern
if ! echo "$VERSION" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$'; then
  echo "Error: '$VERSION' is not a valid semantic version (e.g. 1.2.3 or 1.2.3-beta.1)"
  exit 1
fi

# Ensure working tree is clean
if ! git diff-index --quiet HEAD --; then
  echo "Error: Working tree has uncommitted changes. Commit or stash them first."
  exit 1
fi

# Ensure we're on main
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ]; then
  echo "Warning: you are on branch '$BRANCH', not 'main'. Continue? [y/N]"
  read -r confirm
  [ "$confirm" = "y" ] || exit 1
fi

echo "Creating release tag $TAG…"
git tag -s "$TAG" -m "Release $TAG" 2>/dev/null || git tag "$TAG" -m "Release $TAG"
git push origin "$TAG"

echo ""
echo "✓ Tag $TAG pushed. GitHub Actions will build and publish the release."
echo "  Monitor: https://github.com/MTCodes01/flowtrack/actions"
