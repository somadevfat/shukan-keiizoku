#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env.production}"
COMPOSE_FILE="${2:-compose.production.yaml}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "エラー: $ENV_FILE が見つかりません。" >&2
  exit 1
fi

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "エラー: $COMPOSE_FILE が見つかりません。" >&2
  exit 1
fi

permissions="$(stat -c '%a' "$ENV_FILE")"
if [[ "$permissions" != "600" ]]; then
  echo "エラー: $ENV_FILE の権限を 600 にしてください。現在: $permissions" >&2
  exit 1
fi

if grep -Eq 'replace-with|example\.com|POSTGRES_PASSWORD="?app"?$|AUTH_SECRET="?test' "$ENV_FILE"; then
  echo "エラー: $ENV_FILE に初期値またはテスト値が残っています。" >&2
  exit 1
fi

if ! grep -Eq '^NEXTAUTH_URL="?https://' "$ENV_FILE"; then
  echo "エラー: NEXTAUTH_URL は https:// で始めてください。" >&2
  exit 1
fi

if ! grep -Eq '^APP_DOMAIN="?[^"./: ]+\.[^"/: ]+' "$ENV_FILE"; then
  echo "エラー: APP_DOMAIN に有効なドメインを設定してください。" >&2
  exit 1
fi

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" config --quiet
echo "production設定の検査に成功しました。"
