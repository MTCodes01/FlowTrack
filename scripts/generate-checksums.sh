#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# FlowTrack — Checksum Generator
# ─────────────────────────────────────────────────────────────────────────────
# Usage:
#   ./scripts/generate-checksums.sh <release-dir>
#
# Generates SHA-256 checksums for all release artifacts in the given directory
# and writes them to checksums.txt.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

RELEASE_DIR="${1:-./release-assets}"

if [ ! -d "$RELEASE_DIR" ]; then
  echo "Error: directory '$RELEASE_DIR' does not exist"
  exit 1
fi

OUTPUT="$RELEASE_DIR/checksums.txt"

echo "# FlowTrack release checksums — SHA-256" > "$OUTPUT"
echo "# Generated: $(date -u '+%Y-%m-%dT%H:%M:%SZ')" >> "$OUTPUT"
echo "" >> "$OUTPUT"

find "$RELEASE_DIR" -maxdepth 1 -type f \
  \( -name "*.exe" -o -name "*.msi" -o -name "*.dmg" -o -name "*.AppImage" -o -name "*.deb" \) \
  | sort \
  | while read -r file; do
    sha256sum "$file" | awk '{print $1 "  " $2}' >> "$OUTPUT"
  done

echo "Checksums written to $OUTPUT"
cat "$OUTPUT"
