# 積み上げ

昨日の自分を少しだけ超えるための、習慣化カウンターです。

## 必要な環境

- Node.js 24 以上
- npm 11.6.2
- Docker / Docker Compose

## ローカル開発

依存関係をインストールします。

```bash
npm ci
```

PostgreSQL を起動し、migration を適用します。

```bash
docker compose up -d db
cp .env.example .env
npm run db:migrate:deploy
```

開発サーバーを起動します。

```bash
npm run dev
```

## Docker 起動

アプリと DB をまとめて起動します。アプリ起動時に migration が適用されます。

```bash
docker compose up --build
```

## 品質チェック

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test:unit:coverage
npm run test:e2e
npm run build
docker compose build
```

設計と要件は [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) と [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) を参照してください。作業状況は [docs/TODO.md](docs/TODO.md) で管理します。
