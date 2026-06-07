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
  - 2026-06-07 に再実行したが、Docker 内部から npm registry への接続が `ENETUNREACH` になったため、ネットワーク回復後に再実行する。

## マイルストーン 2: 認証とユーザー

- [完了] 認証前でも主要機能が実際に動くローカル利用モードを実装する
  - タスク作成、目標設定、計測開始・停止、実績保存を DB と接続する。
  - 静的なサンプル値を画面から取り除く。
- [完了] Auth.js と Google OAuth を設定する
  - Auth.js の database session と Prisma Adapter を使用する。
  - Googleログイン画面とログアウト操作を実装する。
  - Googleプロバイダー設定と未認証リダイレクトを desktop / mobile E2E で確認する。
- [未着手] ユーザーのタイムゾーンを保存する
- [完了] 認証・認可の共通処理を実装する
  - 画面、server action、server query で共通の認証済みユーザー取得処理を使用する。
  - 本番環境ではローカル利用モードを無効にする。
- [完了] HttpOnly Cookieを使ったゲスト利用モードを実装する
  - 初回アクセス時に匿名ユーザーを作成し、HttpOnly Cookieと紐付ける。
  - ログイン画面を経由せず、タスク・履歴・メモをDBへ保存できる。
  - Googleログイン時にゲストデータを認証ユーザーへ引き継ぐ。
  - ゲスト開始と再読み込み後のデータ保持を desktop / mobile E2E で確認する。

## マイルストーン 3: 習慣タスク

- [未着手] 習慣タスクの domain と use case を TDD で実装する
- [未着手] 習慣タスクの repository を実装する
- [完了] タスク一覧・作成・編集・アーカイブ UI を実装する
  - タスク名を編集できる。
  - 削除確認後にタスクをアーカイブできる。
  - 計測中のタスクはアーカイブできない。
- [完了] タスク削除時に確認ダイアログを表示する
  - 削除実行とキャンセルを desktop / mobile E2E で確認する。

## マイルストーン 4: 計測

- [未着手] 計測開始・停止の domain と use case を TDD で実装する
- [完了] ユーザーごとの同時計測 1 件制約を実装する
  - application の検査と PostgreSQL の部分 unique index で保証する。
- [未着手] 日付をまたぐ計測の日別分割を TDD で実装する
- [完了] ストップウォッチ UI を実装する（でっかく表示するのではなく、タスク一覧に列挙される形に修正する）

## マイルストーン 5: 目標とカレンダー

- [完了] 前日比計算の純粋関数を TDD で実装する
- [未着手] 今日の目標を保存・取得する use case を TDD で実装する
- [未着手] 日別実績集計を実装する
- [未着手] 月間カレンダー UI を実装する
- [完了] 履歴カレンダーの活動量を色の濃淡で可視化する
  - 日別実績を活動なしを含む 5 段階の色で表示する。
  - 日付セルから実績時間を確認できる。
  - 実際の計測履歴が当日の色へ反映されることを desktop / mobile E2E で確認する。
- [未着手] 目標達成表示を実装する
- [完了] 継続日数（ストリーク）の計算ロジックを TDD で実装する
- [完了] 継続履歴を取得する server query を実装する
- [完了] 継続履歴を表示する新規 UI ページ (/history) を実装する
- [完了] 継続失敗対策の自己分析メモを実装する
  - つまずいたことと次回の対策をユーザーごとに保存・編集できる。
  - desktop ではメイン画面の右側、mobile ではタスク一覧の下に表示する。
  - 保存内容が再表示されることを desktop / mobile E2E で確認する。
- [完了] 自己分析メモをメイン画面へ移動し、カレンダーを月送り表示にする
  - メモを日常的に確認できるメイン画面へ配置する。
  - カレンダーは1ヶ月だけ表示し、前月・次月へ切り替えられる。
  - メモ保存と月送りを desktop / mobile E2E で確認する。
- [完了] 自己分析メモの保存完了を画面上で確認できるようにする
  - 保存後にボタン直下へ完了メッセージを表示する。
  - 完了表示と再読み込み後の永続化を desktop / mobile E2E で確認する。
- [完了] 自己分析メモを一覧・追加・編集方式へ変更する
  - メモを複数保存し、新しい順で編集画面より上に列挙する。
  - 追加ボタンまたは既存メモのクリックで編集画面を表示する。
  - 追加・一覧表示・配置順・編集を desktop / mobile E2E で確認する。

## マイルストーン 6: リリース準備

- [未着手] 主要ユーザーフローの Playwright E2E を完成させる
- [完了] リリース前セキュリティ監査を実施する
  - Git 追跡物、秘密情報、依存関係、認証・認可、データ管理、Docker、CI/CD を確認する。
  - 重大な問題を修正し、残存リスクを運用手順へ記録する。
- [完了] Oracle Cloud Infrastructure 向け運用手順を作成する
  - 初回デプロイと GitHub Actions による CD の手順を文書化する。
- [完了] SemVer タグによる本番リリース運用へ変更する
  - `vMAJOR.MINOR.PATCH` タグを起点に検査、image 発行、デプロイ、GitHub Release 作成を行う。
- [完了] CI の Prisma Client 生成漏れと Web Release 起点 CD を修正する
  - CI / Release の typecheck 前に Prisma Client を生成する。
  - GitHub Web で Release を公開したときだけ本番デプロイを開始する。
- [完了] CI と Docker build の生成用 DATABASE_URL を設定する
  - Prisma Client 生成と Next.js build にだけ使用する非機密のダミーURLを設定する。
- [完了] Docker build 用の public ディレクトリを管理する
  - 静的ファイルが未追加でも production image build が成功するようにする。
- [完了] 本番 CD を OCI Self-hosted Runner 方式へ変更する
  - GitHub-hosted Runner からの SSH を廃止し、OCI VM 内で直接デプロイする。
- [完了] production 設定の事前検査を自動化する
  - production Compose と環境変数の不足・危険な設定をデプロイ前に検出する。
- [完了] backup / restore 手順を作成・検証する
  - backup / restore スクリプトを作成し、専用 PostgreSQL で復元を検証する。
- [未着手] production smoke test を作成する
- [未着手] npm audit の脆弱性を継続監視する
  - 現在は依存パッケージに low 2件、moderate 7件がある。
