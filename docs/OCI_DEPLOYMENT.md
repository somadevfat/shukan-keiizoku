# OCI 初回デプロイと CD

## 構成

初回リリースでは OCI Compute 1 台で次を動かす。

- Caddy: `80` / `443` を公開し、TLS を自動更新する。
- Next.js: Docker 内部の `3000` のみで待ち受ける。
- PostgreSQL: Docker 内部の `5432` のみで待ち受ける。
- GitHub Actions: CI 成功後に GHCR へ image を push し、SSH で OCI Compute を更新する。

単一 VM 構成のため、VM 障害中は停止する。利用者や重要度が増えたら PostgreSQL を OCI Database 等へ分離する。

## 1. OCI と DNS

1. OCI Compute instance を作成する。Ubuntu 24.04 LTS を推奨する。
2. 予約 Public IP を割り当て、ドメインの A レコードをその IP に向ける。
3. Network Security Group の ingress を次だけ許可する。

| Port      | Source              | 用途                            |
| --------- | ------------------- | ------------------------------- |
| `22/tcp`  | 自分の固定 IP       | SSH                             |
| `80/tcp`  | `0.0.0.0/0`、`::/0` | HTTPS 証明書取得・HTTP redirect |
| `443/tcp` | `0.0.0.0/0`、`::/0` | HTTPS                           |

`3000` と `5432` は許可しない。OCI 側だけでなく、VM の host firewall でも同じ制限を行う。

## 2. VM の準備

Docker Engine と Docker Compose plugin を公式手順でインストールし、専用デプロイユーザーを作る。

```bash
sudo adduser deploy
sudo usermod -aG docker deploy
sudo install -d -o deploy -g deploy -m 700 /opt/syukan-counter-todo
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow from <自分の固定IP> to any port 22 proto tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

`deploy` ユーザー用の専用 SSH 公開鍵を `~deploy/.ssh/authorized_keys` に登録する。通常の管理鍵とは分ける。

## 3. 本番環境変数

VM の `/opt/syukan-counter-todo/.env.production` を作成する。雛形は `.env.production.example` を使う。

```bash
cd /opt/syukan-counter-todo
umask 077
openssl rand -hex 32
openssl rand -base64 32
vi .env.production
chmod 600 .env.production
./validate-production-config.sh
```

- 1 つ目の hex 値を `POSTGRES_PASSWORD` と `DATABASE_URL` の password に同じ値で設定する。
- 2 つ目の base64 値を `AUTH_SECRET` に設定する。
- `NEXTAUTH_URL` は `https://<APP_DOMAIN>` と完全一致させる。
- `APP_IMAGE` は `ghcr.io/<GitHub owner>/<repository>:latest` にする。
- Google OAuth の承認済みリダイレクト URI に `https://<APP_DOMAIN>/api/auth/callback/google` を登録する。

GHCR package を private にする場合、read-only package token で VM を一度ログインさせる。

```bash
docker login ghcr.io
```

## 4. GitHub の設定

GitHub repository の `production` Environment を作り、必要なら required reviewer を設定する。次の Environment secrets を登録する。

| Secret                | 内容                                 |
| --------------------- | ------------------------------------ |
| `OCI_HOST`            | Compute の Public IP または hostname |
| `OCI_USER`            | `deploy`                             |
| `OCI_SSH_PRIVATE_KEY` | デプロイ専用秘密鍵                   |
| `OCI_SSH_KNOWN_HOSTS` | 検証済み host key                    |

host key は管理端末から取得し、OCI console 等で fingerprint を照合してから登録する。

```bash
ssh-keyscan -H <OCI_HOST>
```

GitHub Actions の workflow permission で packages への write を許可する。GHCR package を private にする場合は、repository から package への Actions access も許可する。

## 5. 初回デプロイ

`main` へ push し、CI が成功すると `.github/workflows/deploy.yml` が次を自動実行する。

1. commit SHA 固定 tag と `latest` tag の image を GHCR へ push する。
2. OCI Compute へ production Compose と Caddy 設定を転送する。
3. image を pull し、migration を適用して起動する。
4. DB 接続を含む `/api/health` が成功するまで待つ。

起動後に確認する。

```bash
curl --fail --show-error https://<APP_DOMAIN>/api/health
curl --head https://<APP_DOMAIN>
```

Google ログイン、ゲスト作成、タスク作成、計測開始・停止、再ログイン後のデータ分離を手動確認する。

## 6. ロールバック

GitHub Packages に残っている正常な commit SHA tag を指定して戻す。

```bash
cd /opt/syukan-counter-todo
APP_IMAGE=ghcr.io/<owner>/<repository>:<正常なcommit SHA> \
  docker compose --env-file .env.production -f compose.production.yaml \
  up -d --pull always --remove-orphans --wait --wait-timeout 180
```

破壊的 migration を含むリリースは image のロールバックだけでは戻せない。expand / migrate / contract の段階的 migration を使う。

## 7. バックアップ

最低でも毎日 `pg_dump` を取得し、VM 外の暗号化された保存先へ転送する。

```bash
cd /opt/syukan-counter-todo
BACKUP_DIR=/暗号化された保存先 ./scripts/backup-production-db.sh
```

復元は既存DBを置き換えるため、対象とバックアップを確認してから実行する。

```bash
cd /opt/syukan-counter-todo
CONFIRM_RESTORE='syukan_counterを復元する' \
  ./scripts/restore-production-db.sh /暗号化された保存先/backup.dump
```

別 DB への restore を定期的に実行し、アプリが起動して主要データを参照できることまで確認する。復元確認前のバックアップは未検証として扱う。
