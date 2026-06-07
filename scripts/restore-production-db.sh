#!/usr/bin/env bash
set -euo pipefail

if [[ "${CONFIRM_RESTORE:-}" != "syukan_counterを復元する" ]]; then
  echo "エラー: 復元には CONFIRM_RESTORE='syukan_counterを復元する' が必要です。" >&2
  exit 1
fi

backup_path="${1:-}"
ENV_FILE="${ENV_FILE:-.env.production}"
COMPOSE_FILE="${COMPOSE_FILE:-compose.production.yaml}"

if [[ ! -s "$backup_path" ]]; then
  echo "エラー: 有効なバックアップファイルを指定してください。" >&2
  exit 1
fi

if [[ -f "$backup_path.sha256" ]]; then
  sha256sum --check "$backup_path.sha256"
fi

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" stop app
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T db \
  pg_restore -U app -d syukan_counter --clean --if-exists --no-owner < "$backup_path"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" start app

echo "復元が完了しました。/api/health と主要データを確認してください。"
