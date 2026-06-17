#!/bin/sh
set -e
if [ ! -f /backup/final ]; then
  echo "ERROR: backup file not found at /backup/final"
  exit 1
fi
echo "Restoring database from stage5/final backup..."
pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-acl /backup/final 2>/dev/null || true
echo "Restore finished."
