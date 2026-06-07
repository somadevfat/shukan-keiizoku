# OCI 初回デプロイと CD

## 構成

初回リリースでは OCI Compute 1 台で次を動かす。

- Caddy: `80` / `443` を公開し、TLS を自動更新する。
- Next.js: Docker 内部の `3000` のみで待ち受ける。
- PostgreSQL: Docker 内部の `5432` のみで待ち受ける。
- GitHub Actions Self-hosted Runner: OCI VM 内で動作し、SemVer Release を起点に検査、GHCR への image push、同一 VM の更新を行う。

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

Docker Engine と Docker Compose plugin を公式手順でインストールし、GitHub Actions Self-hosted Runner 専用ユーザーを作る。

```bash
sudo adduser --disabled-password --gecos "" github-runner
sudo usermod -aG docker github-runner
sudo install -d -o github-runner -g github-runner -m 700 /opt/actions-runner
sudo install -d -o github-runner -g github-runner -m 700 /opt/syukan-counter-todo
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow from <自分の固定IP> to any port 22 proto tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

GitHub repository の `Settings` → `Actions` → `Runners` から Linux Runner を追加し、`github-runner` ユーザーで `/opt/actions-runner` にインストールする。Runner には `production` ラベルを設定し、systemd service として起動する。

```bash
sudo -iu github-runner docker version
sudo -iu github-runner docker compose version
sudo ./svc.sh status
```

Runner は外向き通信で GitHub に接続するため、GitHub Actions 用に `22/tcp` を公開する必要はない。

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

`.env.production` とデプロイ先は Runner が読み書きできる必要がある。初回だけ管理ユーザーで確認する。

```bash
sudo chown -R github-runner:github-runner /opt/syukan-counter-todo
sudo chmod 700 /opt/syukan-counter-todo
sudo chmod 600 /opt/syukan-counter-todo/.env.production
```

- 1 つ目の hex 値を `POSTGRES_PASSWORD` と `DATABASE_URL` の password に同じ値で設定する。
- 2 つ目の base64 値を `AUTH_SECRET` に設定する。
- `NEXTAUTH_URL` は `https://<APP_DOMAIN>` と完全一致させる。
- `APP_IMAGE` は初回リリース予定の `ghcr.io/<GitHub owner>/<repository>:v1.0.0` にする。デプロイ時は workflow が対象タグで上書きする。
- Google OAuth の承認済みリダイレクト URI に `https://<APP_DOMAIN>/api/auth/callback/google` を登録する。

GHCR package を private にする場合、read-only package token で VM を一度ログインさせる。

```bash
docker login ghcr.io
```

## 4. GitHub の設定

GitHub repository の `production` Environment を作り、required reviewer を設定する。Self-hosted Runner は Docker 操作権限を持つため、意図しない workflow が本番 Runner で動かないように、`main` の branch protection と CODEOWNERS による `.github/workflows/**` のレビューも設定する。

Self-hosted Runner 方式では `OCI_HOST`、`OCI_USER`、SSH秘密鍵、known hosts の GitHub Secrets は不要になる。登録済みの場合は削除する。

GitHub Actions の workflow permission で packages への write を許可する。GHCR package を private にする場合は、repository から package への Actions access も許可する。

## 5. リリース運用

リリースタグは Semantic Versioning の `vMAJOR.MINOR.PATCH` 形式を使用する。

| 変更内容                         | 更新例              |
| -------------------------------- | ------------------- |
| 後方互換性のあるバグ修正         | `v1.2.3` → `v1.2.4` |
| 後方互換性のある機能追加         | `v1.2.3` → `v1.3.0` |
| 互換性を壊す変更・大きな仕様変更 | `v1.2.3` → `v2.0.0` |

通常の開発では `main` へ merge し、CI 成功と動作確認後にGitHub WebからReleaseを公開する。一度公開したリリースタグを移動・再利用しない。

1. GitHub repository の `Releases` を開く。
2. `Draft a new release` を選ぶ。
3. `Choose a tag` で `v1.0.0` のような新しいSemVerタグを入力し、`Create new tag on publish` を選ぶ。
4. Target が `main` であることを確認する。
5. タイトルとリリースノートを入力する。
6. `Set as a pre-release` を無効にする。
7. `Publish release` を実行する。

`.github/workflows/deploy.yml` はGitHub WebでReleaseが公開された後に次を実行する。タグをCLIからpushしただけではデプロイしない。Draft ReleaseとPre-releaseもデプロイしない。

1. タグが正しいSemVer形式であり、対象commitが`main`に含まれることを検証する。
2. format、lint、typecheck、unit test、coverage、audit、production buildを再検査する。
3. `v1.0.0`、commit SHA、`latest`の3タグで同一imageをGHCRへpushする。
4. OCI VM 内の Self-hosted Runner が production Compose、Caddy、運用スクリプトを配置する。
5. 同一 VM 上で version 固定 image を pull し、migrationを適用して起動する。
6. DB接続を含む`/api/health`が成功するまで待つ。
   Release公開後にworkflowが失敗した場合、そのタグは修正せず、原因を修正して次のPATCH versionを公開する。

起動後に確認する。

```bash
curl --fail --show-error https://<APP_DOMAIN>/api/health
curl --head https://<APP_DOMAIN>
```

Google ログイン、ゲスト作成、タスク作成、計測開始・停止、再ログイン後のデータ分離を手動確認する。

## 6. ロールバック

GitHub Packages に残っている正常なversion tagを指定して戻す。`latest`は使用しない。

```bash
cd /opt/syukan-counter-todo
APP_IMAGE=ghcr.io/<owner>/<repository>:<正常なversion、例: v1.2.3> \
  docker compose --env-file .env.production -f compose.production.yaml \
  up -d --pull always --remove-orphans --wait --wait-timeout 180
```

破壊的 migration を含むリリースは image のロールバックだけでは戻せない。expand / migrate / contract の段階的 migration を使う。

## 7. タグの確認

```bash
git tag --list 'v*' --sort=-version:refname
gh release list
```

公開済みReleaseとタグの削除・移動は、Release、Docker image、稼働versionの対応関係を壊すため原則禁止する。

## 8. バックアップ

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
