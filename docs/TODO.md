# 開発 TODO

## 運用ルール

- 作業開始前に対象タスクを `[進行中]` にする。
- 作業完了時に完了条件を確認し、満たした場合のみ `[完了]` にする。
- 保留や仕様変更が発生した場合は、理由と次の対応を記録する。
- 新しい作業が判明した場合は、この TODO に追加してから着手する。
- 各作業単位でこのファイルを必ず更新する。

## マイルストーン 1: 開発基盤

- [完了] Next.js プロジェクトを初期構築する
  - Node.js runtime、npm、App Router、strict TypeScript を使用する。
  - 初期画面が表示できる。
- [完了] 静的解析と format を設定する
  - ESLint、Prettier、import 境界、禁止構文を検査できる。
- [完了] unit test と coverage を設定する
  - Vitest で `.ts` をテストできる。
  - `.ts` の coverage 100% を必須にする。
- [完了] Playwright を設定する
  - 初期画面の E2E テストを実行できる。
- [完了] Git hooks を設定する
  - Husky、lint-staged、commitlint が動作する。
- [完了] PostgreSQL、Prisma、Docker を設定する
  - Docker Compose で app と db を起動できる。
  - 空 DB に migration を適用できる。
- [完了] CI を設定する
  - GitHub Actions で必須品質チェックを実行できる。
  - repository 実装後に integration test job を追加する。
- [完了] 初期画面を実装する
  - スマートフォン優先の計測画面を表示できる。
  - 過剰な装飾を避け、主要情報に集中した UI にする。
- [完了] 開発基盤の全品質チェックを完了する
  - format、lint、typecheck、UT、coverage、E2E、build、Docker smoke test を通す。
- [保留] 最新実装で Docker image build を再検証する
  - npm registry への接続 timeout が繰り返し発生したため、ネットワーク回復後に再実行する。

## マイルストーン 2: 認証とユーザー

- [完了] 認証前でも主要機能が実際に動くローカル利用モードを実装する
  - タスク作成、目標設定、計測開始・停止、実績保存を DB と接続する。
  - 静的なサンプル値を画面から取り除く。
- [未着手] Auth.js と Google OAuth を設定する
- [未着手] ユーザーのタイムゾーンを保存する
- [未着手] 認証・認可の共通処理を実装する

## マイルストーン 3: 習慣タスク

- [未着手] 習慣タスクの domain と use case を TDD で実装する
- [未着手] 習慣タスクの repository を実装する
- [未着手] タスク一覧・作成・編集・アーカイブ UI を実装する

## マイルストーン 4: 計測

- [未着手] 計測開始・停止の domain と use case を TDD で実装する
- [完了] ユーザーごとの同時計測 1 件制約を実装する
  - application の検査と PostgreSQL の部分 unique index で保証する。
- [未着手] 日付をまたぐ計測の日別分割を TDD で実装する
- [未着手] ストップウォッチ UI を実装する

## マイルストーン 5: 目標とカレンダー

- [完了] 前日比計算の純粋関数を TDD で実装する
- [未着手] 今日の目標を保存・取得する use case を TDD で実装する
- [未着手] 日別実績集計を実装する
- [未着手] 月間カレンダー UI を実装する
- [未着手] 目標達成表示を実装する

## マイルストーン 6: リリース準備

- [未着手] 主要ユーザーフローの Playwright E2E を完成させる
- [未着手] Oracle Cloud Infrastructure 向け運用手順を作成する
- [未着手] backup / restore 手順を作成・検証する
- [未着手] production smoke test を作成する
- [未着手] npm audit の moderate 脆弱性を継続監視する
  - 現在は Next.js / Prisma の依存に 5 件あり、破壊的 downgrade 以外の自動修正はない。
