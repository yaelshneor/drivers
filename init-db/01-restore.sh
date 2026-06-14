#!/bin/sh
set -e
if [ ! -f /backup/backup4 ]; then
  echo "ERROR: backup file not found at /backup/backup4"
  exit 1
fi
echo "Restoring database from stage4 backup..."
pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-acl /backup/backup4 2>/dev/null || true
echo "Restore finished."
