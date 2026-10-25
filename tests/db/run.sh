#!/usr/bin/env bash
# Database security tests. Needs a reachable Postgres and psql; connection
# comes from the standard libpq variables (PGHOST, PGPORT, PGUSER, PGPASSWORD).
# Creates a throwaway database, applies the schema + every numbered
# migration, runs the tests, and drops the database again.
set -euo pipefail
cd "$(dirname "$0")/../.."

# ── Safety: this script CREATES and DROPS a database and loads test data. It
# must only ever talk to a throwaway PostgreSQL on this machine (or the CI
# service container), never to your real Supabase project.
host="${PGHOST:-localhost}"

case "$host" in
  *supabase*)
    echo "REFUSING TO RUN: PGHOST ($host) looks like Supabase."
    echo "These tests need their own disposable local database. Never point them at your project."
    exit 2
    ;;
esac

case "$host" in
  localhost|127.0.0.1|::1|/*) ;;
  *)
    if [ "${ALLOW_REMOTE_TEST_DB:-}" != "yes" ]; then
      echo "REFUSING TO RUN: PGHOST ($host) is not this machine."
      echo "If it really is a disposable test server, re-run with ALLOW_REMOTE_TEST_DB=yes."
      exit 2
    fi
    ;;
esac

# ── Prerequisites. `-w` = never prompt for a password: a prompt in the middle
# of a test run is confusing (and it is not asking for any password you have).
command -v psql >/dev/null 2>&1 || {
  echo "psql (the PostgreSQL command-line client) is not installed or not on PATH."
  echo "Skip this locally if you like: the same tests run in GitHub Actions on every push."
  exit 3
}

export PGCONNECT_TIMEOUT="${PGCONNECT_TIMEOUT:-5}"

if ! psql -X -w -q -d postgres -c "SELECT 1" >/dev/null 2>&1; then
  cat <<HELP
Could not connect to a PostgreSQL server (host=$host port=${PGPORT:-5432} user=${PGUSER:-$(whoami)}).

This test needs its OWN throwaway PostgreSQL. It is NOT your Supabase database.
It creates a temporary database called rls_test_* and deletes it afterwards.

Easiest way (needs Docker Desktop), in Git Bash:
  docker run --rm -d --name rls-pg -e POSTGRES_PASSWORD=test -p 54329:5432 postgres:16
  PGHOST=localhost PGPORT=54329 PGUSER=postgres PGPASSWORD=test npm run test:db
  docker stop rls-pg

Or in PowerShell:
  docker run --rm -d --name rls-pg -e POSTGRES_PASSWORD=test -p 54329:5432 postgres:16
  \$env:PGHOST="localhost"; \$env:PGPORT="54329"; \$env:PGUSER="postgres"; \$env:PGPASSWORD="test"; npm run test:db
  docker stop rls-pg

No Docker? You can skip this. The same tests run automatically in GitHub Actions
on every push, and that is the check that matters.
HELP
  exit 3
fi

# The bootstrap creates a BYPASSRLS role (a stand-in for Supabase's
# service_role), which only a superuser may do.
if [ "$(psql -X -w -At -d postgres -c "SELECT rolsuper FROM pg_roles WHERE rolname = current_user")" != "t" ]; then
  echo "The database user ($(psql -X -w -At -d postgres -c 'SELECT current_user')) is not a superuser."
  echo "Use the throwaway server from the Docker command above: its 'postgres' user is a superuser."
  exit 3
fi

psql -X -w -q -d postgres -c "CREATE DATABASE $DB"
cleanup() { psql -X -w -q -d postgres -c "DROP DATABASE IF EXISTS $DB" >/dev/null 2>&1 || true;

trap cleanup EXIT
export PGDATABASE="$DB"

run() { psql -X -w -q -v ON_ERROR_STOP=1 "$@"; }

echo "== bootstrap + schema.sql"
run -f tests/db/bootstrap.sql
run -f lib/supabase/schema.sql

# Migrations are meant to be re-runnable on a database that is already up to
# date, so applying all of them on top of schema.sql also proves idempotency.
for migration in lib/supabase/migrations/[0-9][0-9][0-9]_*.sql; do
  echo "== migration $(basename "$migration")"
  run -f "$migration"
done

echo "== security tests"
run -f tests/db/security.test.sql

echo "== concurrency test"
bash tests/db/race.sh

echo "== live-database verifier (all checks must be true)"
results=$(psql -X -w -At -F '|' -f lib/supabase/migrations/verify_live_db.sql | grep -E '^[0-9]{3} .*\|(t|f)$')
echo "$results" | sed 's/|t$/  ok/; s/|f$/  FAIL/'
if echo "$results" | grep -q '|f$'; then
  echo "FAIL  verify_live_db.sql reports a failing check"
  exit 1
fi
echo "ALL DATABASE TESTS PASSED"
