#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env.local ]]; then
  echo "Missing .env.local"
  exit 1
fi

set -a
source .env.local
set +a

PROJECT_REF="${NEXT_PUBLIC_SUPABASE_URL#https://}"
PROJECT_REF="${PROJECT_REF%%.supabase.co}"

if [[ -z "${SUPABASE_DB_PASSWORD:-}" ]]; then
  echo "Set SUPABASE_DB_PASSWORD in .env.local (Database password from Supabase Dashboard)"
  exit 1
fi

HOST="db.${PROJECT_REF}.supabase.co"
export PGPASSWORD="$SUPABASE_DB_PASSWORD"

for f in supabase/migrations/*.sql; do
  echo "Applying $f..."
  psql "postgresql://postgres@${HOST}:5432/postgres" -v ON_ERROR_STOP=1 -f "$f"
done

echo "Verifying site_stats..."
curl -s "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/site_stats?select=id&limit=1" \
  -H "apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${NEXT_PUBLIC_SUPABASE_ANON_KEY}"

echo "\nDone. Add SUPABASE_SERVICE_ROLE_KEY to .env.local for admin registration."
