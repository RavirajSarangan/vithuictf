#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env.local ]]; then
  echo "Missing .env.local"
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env.local
set +a

POOLER_URL="$(cat supabase/.temp/pooler-url 2>/dev/null || true)"
PROJECT_REF="${NEXT_PUBLIC_SUPABASE_URL#https://}"
PROJECT_REF="${PROJECT_REF%%.supabase.co}"

if [[ -z "${SUPABASE_DB_PASSWORD:-}" ]]; then
  echo "SUPABASE_DB_PASSWORD not set — cannot auto-apply migrations."
  echo "Add it to .env.local from Supabase Dashboard → Project Settings → Database."
  echo ""
  echo "Pending SQL files (paste each in Supabase SQL Editor, or set password and re-run):"
  echo "---"
  for f in supabase/migrations/*.sql; do
    echo ""
    echo "-- File: $(basename "$f")"
    cat "$f"
    echo ""
  done
  exit 1
fi

if [[ -z "$POOLER_URL" ]]; then
  HOST="db.${PROJECT_REF}.supabase.co"
  CONN="postgresql://postgres:${SUPABASE_DB_PASSWORD}@${HOST}:5432/postgres"
else
  CONN="${POOLER_URL/postgres./postgres:${SUPABASE_DB_PASSWORD}@}"
fi

export PGPASSWORD="$SUPABASE_DB_PASSWORD"

echo "Applying pending migrations…"
for f in supabase/migrations/*.sql; do
  echo "→ $f"
  psql "$CONN" -v ON_ERROR_STOP=1 -f "$f" || {
    echo "Migration failed: $f"
    exit 1
  }
done

echo "Verifying students.nic_number…"
psql "$CONN" -v ON_ERROR_STOP=1 -c \
  "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'students' AND column_name = 'nic_number';"

echo "Done."
