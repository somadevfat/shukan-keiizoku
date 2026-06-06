<!-- BEGIN:nextjs-agent-rules -->

# Next.js 固有ルール

このプロジェクトで使用する Next.js には破壊的変更が含まれる可能性がある。Next.js の API、規約、ファイル構成を扱う前に `node_modules/next/dist/docs/` の該当ガイドを確認し、非推奨の案内に従うこと。

<!-- END:nextjs-agent-rules -->

# プロジェクトルール

## 言語

- ドキュメント、コードコメント、ユーザー向け文言は日本語で書く。
- ライブラリ名、API 名、識別子など、英語が自然なものは英語のままでよい。

## TODO 管理

- 作業開始前に `docs/TODO.md` の対象タスクを `[進行中]` にする。
- 作業の完了、保留、仕様変更が発生するたびに `docs/TODO.md` を必ず更新する。
- 新しい作業が判明した場合は、着手前に `docs/TODO.md` へ追加する。
- 完了条件を満たしていないタスクを完了扱いにしない。

## 開発方針

- 安定志向、堅牢重視で実装する。
- 既存の設計とディレクトリ構成を優先する。
- 機能と画面内の情報量を増やしすぎず、主要な体験に集中する。
- ビジネスロジックは `.ts` に分離し、React / Next.js への依存を避ける。
- `.tsx` は表示とユーザー操作の接続に集中させる。
- DB、認証、外部入力の境界では必ず validation と認可を行う。

## UI・UX

- スマートフォンを優先して設計する。
- シンプルで洗練された、落ち着いた道具感を重視する。
- 過剰なグラデーション、発光、紙吹雪、派手なアニメーションを使用しない。
- 安っぽいカードの多用や、大きすぎる角丸を避ける。
- 達成表現は色、短い文言、控えめな動きを使う。

## TypeScript

- `any`、`as any`、`@ts-ignore`、`@ts-nocheck` を禁止する。
- 外部入力は `unknown` として受け、Zod などで parse する。
- `strict` 前提で型を設計し、不要な型アサーションを避ける。
- domain 層から React、Next.js、Prisma、環境変数を参照しない。

## TDD とテスト

- domain / application のロジックは TDD を基本とする。
- 実装前に期待する振る舞いを unit test として定義し、Red、Green、Refactor の短いサイクルで実装する。
- `.ts` のロジックは Vitest で unit test を書く。
- domain / application の純粋な `.ts` ロジックは coverage 100% を維持する。
- Next.js、DB、外部サービスとの接続境界は coverage 対象外とし、integration test / Playwright で検証する。
- coverage 100% は、到達不能、未使用、冗長なロジックや不要な分岐を残さないための制約として扱う。
- coverage のためだけの無意味なテストや、安易な対象除外を禁止する。
- TDD 中の一時的な失敗は許容するが、コミット時点では全テスト成功と coverage 100% を必須とする。
- `.tsx` の画面挙動は Playwright で確認する。
- DB や repository は専用 PostgreSQL を使った integration test で確認する。

## import ルール

- domain 層は application、infrastructure、presentation、`app` を import しない。
- application 層は infrastructure、presentation、`app` を import しない。
- presentation 層から Prisma client や DB module を直接 import しない。
- client component から server-only module を import しない。
- feature 間の内部 module を直接 import せず、公開 API を経由する。
- 循環 import を禁止する。
- 深すぎる相対 import を避け、設定済み alias を使用する。

## Git hooks とコミット

- Git hooks は Husky、staged file の検査は lint-staged、コミットメッセージ検査は commitlint で管理する。
- コミットメッセージは Conventional Commits に従う。
- `pre-commit` では staged file の format と lint を行う。
- `pre-push` では typecheck、lint、unit test、coverage 100% を検査する。
- hook を無効化してコミット・push しない。
- lint error、型エラー、テスト失敗、coverage 不足がある状態でコミットしない。

## DB・認証・日時

- DB は PostgreSQL、ORM は Prisma を使う。
- schema 変更は Prisma migration で管理し、本番で `prisma db push` は使わない。
- アプリ起動時に `prisma migrate deploy` を実行する。
- 認証は Auth.js / NextAuth.js と Google OAuth を使い、multi-user 前提で実装する。
- ユーザーデータは `userId` で必ず分離する。
- DB には UTC で保存し、「今日」「昨日」はユーザーのタイムゾーンで判定する。
- デフォルトタイムゾーンは `Asia/Tokyo` とする。

## Docker・CI

- Docker Compose でアプリと DB をまとめて動かせるようにする。
- デプロイ先は Oracle Cloud Infrastructure を想定する。
- production image は multi-stage build にする。
- CI では format、lint、typecheck、unit test、coverage、integration test、Playwright E2E、production build、Docker build、migration、依存関係監査を行う。
