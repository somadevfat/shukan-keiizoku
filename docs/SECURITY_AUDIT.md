# リリース前セキュリティ監査

監査日: 2026-06-07

## 結論

現時点で、Git 履歴への実シークレット混入、SQL インジェクション、認証バイパスの本番有効化、ユーザー間の直接的なデータ参照は確認されなかった。

ただし、公開前に必ず `compose.production.yaml` を使い、OCI のネットワークで `3000` と `5432` を外部公開しないこと。従来の `compose.yaml` はローカル開発専用であり、本番利用は禁止する。

## 対応済み

- `.env*`、秘密鍵、Google OAuth credential JSON は `.gitignore` で除外されている。
- Git 履歴に実シークレットは確認されなかった。
- 本番 Compose では PostgreSQL を外部公開せず、秘密値を必須にした。
- アプリは非 root ユーザーで実行される。
- Caddy を TLS 終端・リバースプロキシとして配置し、Next.js を直接公開しない。
- `X-Content-Type-Options`、`X-Frame-Options`、`Referrer-Policy`、`Permissions-Policy`、HSTS を設定した。
- DB 接続を含むヘルスチェックを追加した。
- ゲスト開始 URL を再訪しても、有効な Cookie がある場合は匿名ユーザーを重複作成しない。
- Server Action の外部入力は Zod で検証され、更新・参照は原則 `userId` で認可されている。
- `AUTH_BYPASS_LOCAL_USER` と E2E cleanup API は `NODE_ENV=production` では動作しない。
- production 設定の危険な初期値、HTTPS 未使用、秘密情報ファイルの不適切な権限をデプロイ前に検査する。
- DB の backup / restore スクリプトを作成し、使い捨て PostgreSQL への復元を検証した。
- 本番デプロイは `main` に含まれる変更不可の SemVer タグを起点にし、version 固定 image で実行する。

## 公開前の必須対応

### ゲスト作成 API の濫用対策

`/api/guest/start` は Cookie を持たないリクエストごとに匿名ユーザーを作る。攻撃者が Cookie を保存せず繰り返すと DB 容量を消費できる。

- OCI WAF、Cloudflare、またはリバースプロキシでレート制限を行う。
- DB 容量と匿名ユーザー作成数を監視する。
- 長期間利用されていない匿名ユーザーを削除する運用を実装する。

### DB とバックアップの保護

Auth.js の `Account` には Google の access token / refresh token が保存される可能性がある。DB とバックアップを機密情報として扱う。

- OCI Block Volume の暗号化を有効にする。
- `5432` を外部公開しない。
- バックアップを暗号化し、アクセス権を限定する。
- DB パスワード、`AUTH_SECRET`、Google OAuth secret を定期的にローテーションする。

### 依存関係

`npm audit` は low 2 件、moderate 7 件、high / critical 0 件を報告した。主な対象は `postcss`、`uuid`、`cookie`、Prisma の開発用依存である。

自動修正候補が Next.js / NextAuth / Prisma の不正なダウングレードを提案するため、`npm audit fix --force` は使用しない。上流の修正版を確認しながら更新し、少なくとも週次で `npm audit` を確認する。

## Git と秘密情報

- `.env.production` は VM のみに置き、GitHub Actions Secrets にアプリ秘密値を保存しない。
- VM 上の `.env.production` とローカル `.env` は `chmod 600` にする。
- GitHub の Secret scanning、Push protection、Dependabot alerts を有効化する。
- シークレットを誤って commit した場合、履歴削除だけでなく必ず値を失効・再発行する。

## 残存リスク

- ゲスト作成 API の分散レート制限は未実装。
- backup / restore は手順のみで、復元テストは未完了。
- Content Security Policy は Next.js の nonce 対応と画面検証が必要なため未設定。
- Self-hosted Runner の Docker 権限は実質 root 相当。`production` Environment の required reviewer、`main` の branch protection、workflow変更のレビューを必須にする。
