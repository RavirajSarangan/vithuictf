#!/usr/bin/env bash
# Concatenate all migrations for paste into Supabase SQL Editor (one-time bootstrap).
# Prefer: npx supabase login && npx supabase link --project-ref YOUR_REF && npx supabase db push
# Or: bash scripts/supabase-bootstrap.sh (requires SUPABASE_DB_PASSWORD in .env.local)

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/supabase/all-migrations-combined.sql"

{
  echo "-- ICTF SLMP combined migrations (generated $(date -u +%Y-%m-%dT%H:%M:%SZ))"
  echo "-- Run in Supabase Dashboard → SQL Editor if CLI is unavailable"
  echo ""
  for f in "$ROOT"/supabase/migrations/*.sql; do
    echo "-- >>> BEGIN $(basename "$f")"
    cat "$f"
    echo ""
    echo "-- >>> END $(basename "$f")"
    echo ""
  done
} > "$OUT"

echo "Wrote $OUT"
wc -l "$OUT"
