#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${ENV_FILE:-.env.production}"
COMPOSE_FILE="${COMPOSE_FILE:-compose.production.yaml}"
BACKUP_DIR="${BACKUP_DIR:-backups}"
timestamp="$(date -u '+%Y%m%dT%H%M%SZ')"
backup_path="$BACKUP_DIR/syukan-counter-$timestamp.dump"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
umask 077

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T db \
  pg_dump -U app -d syukan_counter -Fc > "$backup_path"

test -s "$backup_path"
sha256sum "$backup_path" > "$backup_path.sha256"

echo "バックアップを作成しました: $backup_path"
