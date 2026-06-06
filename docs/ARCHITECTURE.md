# アーキテクチャ

## 目的

このプロジェクトは、習慣化したいタスクの実行時間をストップウォッチで記録し、タスクごとのカレンダーに可視化する「複利活用 習慣化カウンター」です。

利用者が設定した今日の目標時間と昨日の実績を比較し、日々の小さな積み上げが複利のように成長している感覚を得られることを重視します。

## 基本方針

- Next.js を使う。
- ランタイムは Node.js とする。
- パッケージ管理は npm とする。
- Docker Compose でアプリケーションと DB をまとめて起動・デプロイできる構成にする。
- 安定志向、堅牢重視の技術選定にする。
- TypeScript は strict にし、`any` を禁止する。
- ビジネスロジックは `.ts` に分離し、テストしやすくする。
- `.tsx` は UI 表現とイベント接続を中心にし、複雑なロジックを置かない。
- `.ts` ファイルは unit テストでカバーする。
- `.tsx` ファイルの画面挙動は Playwright で確認する。
- カバレッジは `.ts` ファイルのみ計測し、100% を必須にする。
- ドキュメント、コメント、ユーザー向け文言は日本語を使用する。

## 採用技術

| 項目                   | 採用                                            |
| ---------------------- | ----------------------------------------------- |
| フレームワーク         | Next.js App Router                              |
| ランタイム             | Node.js                                         |
| 言語                   | TypeScript                                      |
| パッケージ管理         | npm                                             |
| DB                     | PostgreSQL                                      |
| ORM                    | Prisma                                          |
| 認証                   | Auth.js / NextAuth.js + Google OAuth            |
| Unit テスト            | Vitest                                          |
| UI/E2E テスト          | Playwright                                      |
| Lint                   | ESLint                                          |
| Format                 | Prettier                                        |
| Git hooks              | Husky                                           |
| staged file 検査       | lint-staged                                     |
| コミットメッセージ検査 | commitlint                                      |
| バリデーション         | Zod                                             |
| コンテナ               | Docker / Docker Compose                         |
| デプロイ想定           | Oracle Cloud Infrastructure 上の Docker Compose |

## デプロイ構成

本番は Oracle Cloud Infrastructure の VM 上で Docker Compose を動かす前提にします。

最小構成:

- `app`: Next.js の standalone production server
- `db`: PostgreSQL

マイグレーションはアプリ起動時に実行します。ただし、無条件に危険な変更を実行するのではなく、以下の方針にします。

- Prisma migration を唯一のスキーマ変更手段にする。
- 起動時に `prisma migrate deploy` を実行する。
- DB が空の場合も、既存の migration に従って初期化される。
- `prisma db push` は本番で使わない。
- 破壊的 migration はレビュー必須にする。

Docker イメージは multi-stage build にします。

- 依存関係インストール stage
- build stage
- runtime stage

runtime stage には、本番実行に必要なファイルだけを含めます。

## アプリケーション境界

Next.js に依存する層を薄く保ちます。

```text
src/
  app/                  # ルーティング、layout、server actions、route handlers
  components/           # 汎用 UI コンポーネント
  features/             # 機能単位のモジュール
    habits/
      application/      # ユースケース
      domain/           # ドメインモデル、不変条件、純粋関数
      infrastructure/   # Prisma repository、外部サービス adapter
      presentation/     # 機能固有 UI
  lib/                  # 汎用ヘルパー
  server/               # server-only な composition、auth、db client、env
  test/                 # テスト用 utility、fixture
```

依存ルール:

- `domain` は React、Next.js、Prisma、環境変数を import しない。
- `application` は domain の型・interface・DTO に依存してよい。
- `infrastructure` は repository や外部 adapter を実装する。
- `app` と `presentation` はユースケースやコンポーネントを組み立てる。
- 認可チェックは server action 入口と repository 境界で行う。
- 複雑な計算、日付処理、集計は `.ts` に置く。

## 主要機能

- Google 認証でログインできる。
- 複数ユーザーが利用できる。
- ユーザーごとに習慣タスクを作成できる。
- タスクごとにストップウォッチで実行時間を計測できる。
- 計測セッションの開始・停止・保存ができる。
- タスクごとの日別合計時間をカレンダーに表示できる。
- 昨日の実績時間と今日の実績時間を比較できる。
- 今日の目標時間を設定できる。
- 今日の目標時間が昨日の実績から何パーセント増減しているか表示できる。
- 昨日の自分を超えた達成感を画面で表現する。
- 計測履歴を保持する。

## ドメインモデル方針

初期モデル:

- `User`
- `Account`
- `Session`
- `HabitTask`
- `MeasurementSession`
- `DailyGoal`
- `DailyHabitSummary`

履歴を保持するため、計測の実体は `MeasurementSession` として保存します。

`DailyHabitSummary` は、必要に応じて日別集計を高速化するための派生データとして扱います。最初は `MeasurementSession` から集計し、パフォーマンス要件が見えてから materialized な集計に移行してもよいです。

## 今日の目標と前日比

利用者がタスクごとに今日の目標時間を設定します。システムが成長率や目標時間を自動決定するのではなく、昨日の実績に対する前日比を自動算出します。

計算式:

```text
前日比 = (今日の目標秒数 - 昨日の実績秒数) / 昨日の実績秒数 * 100
```

仕様:

- 昨日の実績が 0 秒の場合は、前日比を算出・表示しない。
- 今日の目標時間が昨日以下の場合も、増減率を事実として表示する。
- 今日の目標を達成した後は、前日比より目標達成を優先して表示する。
- `DailyGoal` としてタスクごとの日別目標を履歴保存する。
- 前日比計算は domain の純粋関数として実装し、unit test で 100% カバーする。

## ストップウォッチ設計

- 同時に計測できるタスクは、ユーザーにつき 1 件とする。
- 計測開始時刻を DB に保存し、ブラウザを閉じても継続できるようにする。
- 日付をまたぐ計測は、ユーザーのタイムゾーンを基準に日別集計する。
- 複数端末で操作された場合は DB 上の計測状態を正とする。
- 同時計測の防止は application の検査だけでなく、DB 制約または transaction でも保証する。
- 誤った計測を修正する機能を将来追加できるよう、計測履歴は独立した record として保持する。

## UI・UX 方針

- スマートフォン優先で設計する。
- シンプルで洗練された、落ち着いた道具感を重視する。
- タスク名、今日の実績、今日の目標、計測開始・停止を中心に構成する。
- 機能と情報量を増やしすぎず、主要操作までの手順を短くする。
- 過剰なグラデーション、発光、紙吹雪、派手なアニメーションを使用しない。
- 達成状態は、色、短い文言、控えめな動きで表現する。
- 安っぽいカードの多用や、大きすぎる角丸を避ける。
- カレンダーは月表示を基本とし、各日の実績時間を読み取れるようにする。

## タイムゾーン方針

おすすめ方針として、DB には UTC で保存し、日別集計はユーザーのタイムゾーンで判定します。

理由:

- DB の保存時刻は UTC に統一すると運用が安定する。
- 習慣化アプリでは「今日」「昨日」はユーザーの生活圏の暦日で決まる。
- 海外移動やサーバー所在地に影響されにくい。

具体方針:

- DB の timestamp は UTC で保存する。
- `User` に `timeZone` を保持する。
- 初回ログイン時はブラウザの timezone を保存する。
- サーバー側の日別集計では `User.timeZone` を使って日付境界を計算する。
- 表示も `User.timeZone` を基準にする。
- デフォルトは `Asia/Tokyo` とする。

日付処理は標準 `Date` の直接操作に寄せすぎず、必要に応じて日付ライブラリを導入します。初期は安定性と軽さを見て `date-fns` と `date-fns-tz` を候補にします。

## 認証・認可

認証は Auth.js / NextAuth.js を使い、Google OAuth を最初の provider にします。

方針:

- multi-user 前提にする。
- 初回アクセス時は HttpOnly Cookie と DB 上の匿名ユーザーを紐付け、ログイン画面を経由せず利用を開始する。
- Auth.js の database session と Prisma Adapter を使用する。
- 本番環境ではGoogle OAuthを必須とし、ローカル利用モードを無効にする。
- ユーザーデータは必ず `userId` で所有者を分離する。
- server action の入口でログイン状態を確認する。
- repository 層でも `userId` を条件に含める。
- 他ユーザーのタスクや計測履歴を参照・更新できないようにする。

## Server Actions 方針

アプリ内部の変更操作は server actions を中心にします。

server actions の責務:

- 認証確認
- 入力値の Zod parse
- ユースケース呼び出し
- revalidate / redirect
- ユーザー向けエラーへの変換

server actions に置かないもの:

- 複雑な計算
- 集計ロジック
- ドメインルール
- DB クエリの詳細

## 型安全性

必須 TypeScript 設定:

- `strict: true`
- `noImplicitAny: true`
- `noUncheckedIndexedAccess: true`
- `exactOptionalPropertyTypes: true`
- `noImplicitOverride: true`
- `noFallthroughCasesInSwitch: true`

Lint 方針:

- `@typescript-eslint/no-explicit-any: error`
- unsafe assignment / unsafe member access / unsafe call は可能な限り error にする。
- floating promise を禁止する。
- 未使用変数は原則禁止する。
- `@ts-ignore` と `@ts-nocheck` を禁止する。
- import 境界違反と循環依存を禁止する。

外部入力:

- request body、form data、search params、環境変数は Zod で検証する。
- 外部入力は `unknown` として受け取り、parse 後に型を確定する。
- DB から得た値も、domain に渡す前に mapper を通す。

## import 境界

依存方向を静的解析で検査します。

許可する主な依存方向:

```text
presentation / app -> application -> domain
infrastructure -> application / domain
server composition -> application / infrastructure
```

禁止する主な依存:

- domain から application / infrastructure / presentation / app
- application から infrastructure / presentation / app
- presentation から Prisma client / DB module
- client component から server-only module
- feature の内部 module への別 feature からの直接 import
- 循環 import

ESLint の import 制約ルールを使って自動検査します。feature 外から参照可能な module は、各 feature の公開 API として明示します。

## エラーハンドリング

domain / application では明示的な `Result` 型を使います。

```ts
type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };
```

方針:

- 想定内の失敗は `Result` で返す。
- infrastructure 境界の予期しない失敗は例外として扱う。
- server action でユーザー向けメッセージに変換する。
- ログには原因調査に必要な情報を残す。
- ユーザーには内部情報を出さない。

## テスト戦略

### TDD 方針

domain / application のロジックは、テスト駆動開発を基本とします。

実装サイクル:

1. 期待する振る舞いを unit test で定義する。
2. テストが意図した理由で失敗することを確認する。
3. テストを通すための最小限の実装を行う。
4. テストを維持したまま責務、命名、重複を改善する。
5. lint、typecheck、unit test、coverage を確認する。

テストでは実装詳細ではなく、利用者や呼び出し元から観測できる振る舞いを定義します。正常系だけでなく、0 秒、日付境界、同時操作、認可違反などの境界条件も先に明文化します。

Unit テスト:

- Vitest を使い、unit test（UT）として実行する。
- 対象は `.ts` ファイル。
- domain、application、validator、mapper、日付計算、目標計算を重点的にテストする。
- DB が不要な設計を優先する。
- clock、ID generator、repository、transaction は依存注入できるようにする。

Integration テスト:

- repository、Prisma mapper、transaction、DB 制約を対象にする。
- CI 上の専用 PostgreSQL service container を使用する。
- unit test とは command と CI job を分離する。
- migration 適用後の DB に対して実行する。

Playwright:

- `.tsx` の画面挙動をブラウザで確認する。
- ログイン、タスク作成、ストップウォッチ開始・停止、カレンダー表示、昨日比較を主要シナリオにする。
- role / name ベースの locator を優先する。
- screenshot / trace を CI で取得できるようにする。
- Playwright エージェントは画面確認、locator 探索、失敗時の調査補助に活用する。

Coverage:

- domain / application に属する `src/**/*.ts` の純粋ロジックを計測する。
- `*.tsx` は coverage 対象外にする。
- generated file、test utility、型定義ファイル、Next.js / DB / 外部サービスとの接続境界は除外する。
- statements、branches、functions、lines をすべて 100% 必須にする。
- coverage 100% は品質そのものの証明ではなく、到達不能、未使用、冗長なコードや不要な分岐を残さないための設計制約とする。
- coverage を満たせないコードは、必要性、責務分離、依存関係、分岐設計を見直す。
- 数値を満たすためだけの無意味なテストや、テスト対象の安易な除外を禁止する。
- TDD の Red / Green 中は一時的な coverage 不足を許容するが、コミット時点では 100% を必須とする。

## CI

GitHub Actions を使用し、pull request と main branch への push で実行します。

### PR の必須チェック

- `format`: Prettier の差分検査
- `lint`: ESLint、import 境界、循環依存、禁止構文の検査
- `typecheck`: TypeScript の型検査
- `unit-test`: Vitest による unit test
- `coverage`: `.ts` の statements / branches / functions / lines 100%
- `integration-test`: PostgreSQL を使った repository / migration / DB 制約の検査
- `e2e-test`: Playwright による主要ユーザーフローの検査
- `build`: Next.js production build
- `docker-build`: production Docker image の build
- `migration-check`: 空 DB に全 migration を適用できることの検査
- `dependency-audit`: npm audit による既知脆弱性の検査

推奨 command:

```text
npm run format:check
npm run lint
npm run typecheck
npm run test:unit
npm run test:unit:coverage
npm run test:integration
npm run test:e2e
npm run build
npm run db:migrate:deploy
npm audit --audit-level=high
docker compose build
```

### CI の実行方針

- 独立した job は並列実行する。
- `integration-test` と `migration-check` は専用 PostgreSQL service container を使う。
- `e2e-test` は production build または本番相当 server に対して実行する。
- Playwright の失敗時は screenshot、trace、video を artifact として保存する。
- unit test の coverage report を artifact として保存する。
- Node.js と npm の依存関係 cache を使用する。
- lockfile に基づく `npm ci` を使用する。
- CI の必須チェックを通過しない変更は main branch に merge できないよう branch protection を設定する。

### 定期実行

PR ごとの実行に加え、定期実行で以下を確認します。

- dependency audit
- Docker Compose を使った本番相当 smoke test
- DB backup / restore 手順の検証
- 必要に応じた全ブラウザ Playwright test

## Git hooks とコミット制約

Husky を使い、品質検査を通過しない変更は通常の手順ではコミット・push できないようにします。

### pre-commit

lint-staged を使い、staged file のみに対して高速な検査を行います。

- Prettier による format
- ESLint による lint
- `any`、`as any`、`@ts-ignore`、`@ts-nocheck` の禁止
- import 境界、循環依存、server/client 境界の検査

### commit-msg

commitlint で Conventional Commits を検査します。

許可する主な type:

- `feat`
- `fix`
- `docs`
- `refactor`
- `test`
- `chore`
- `build`
- `ci`
- `perf`
- `revert`

### pre-push

リポジトリ全体に対して以下を実行します。

- typecheck
- lint
- unit test
- `.ts` coverage 100%

Playwright と production build は実行時間を考慮し、CI の必須チェックにします。

Git hooks は開発者の早期フィードバック用であり、最終的な品質保証は CI でも同じルールを再検査します。

## 環境変数

環境変数は server-only な module で Zod parse します。

想定:

- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `AUTH_TRUST_HOST`
- `APP_BASE_URL`
- `NODE_ENV`

方針:

- アプリ全体で直接 `process.env` を読まない。
- `.env.example` を必ず管理する。
- secret は Git に含めない。
- Oracle Cloud 上では VM の `.env` または Docker Compose の env file で管理する。

## 未決事項

- Google 以外の認証 provider を増やすか。
- タスクのアーカイブ、削除、復元の仕様。
- カレンダーの表示粒度。
- 計測履歴の手動追加、修正、論理削除を初期リリースに含めるか。
- 今日の目標時間の入力単位と入力 UI。
- 通知、リマインダー、PWA 対応の有無。
- データ export / import の有無。
- Oracle Cloud の具体構成。
