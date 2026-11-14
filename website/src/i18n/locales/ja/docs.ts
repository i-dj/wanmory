import type { DocsDict } from '../zh/docs'

// 日本語 · ドキュメントページ

const docs: DocsDict = {
  title: 'ドキュメント',
  onThisPage: 'このセクション',
  reportIssue: 'ドキュメントの問題を報告 ↗',
  architecture: 'アーキテクチャ →',
  backToTop: 'ページの先頭へ ↑',
  sectionLink: 'このセクションへのリンク',
  toc: [
    {
      key: 'install',
      title: 'インストール',
      groups: [
        {
          group: 'はじめに',
          items: [
            ['intro', '概要'],
            ['requirements', 'システム要件'],
            ['quick-start', 'クイックインストール'],
          ],
        },
        {
          group: 'インストールスクリプト',
          items: [
            ['install-script', 'スクリプトのオプション'],
            ['install-steps', 'スクリプトの各ステップ'],
            ['install-faq', 'インストールの FAQ'],
          ],
        },
        {
          group: '導入設定',
          items: [
            ['compose', 'docker-compose.yml の解説'],
            ['env', '環境変数'],
            ['library', '既存の写真フォルダーのマウント'],
            ['mdns', 'LAN ドメイン（mDNS）'],
            ['proxy', 'リバースプロキシとインターネット公開'],
          ],
        },
        {
          group: 'AI サービス',
          items: [
            ['ai-overview', '実行方式'],
            ['ai-remote', 'AI サービスの分離運用'],
            ['ai-schedule', 'AI の処理タイミング'],
            ['ai-models', 'モデルティアとダウンロード'],
            ['ai-env', 'AI サービスの環境変数'],
          ],
        },
      ],
    },
    {
      key: 'guide',
      title: '使い方ガイド',
      groups: [
        {
          group: '基本操作',
          items: [
            ['first-run', '初期設定と初回ログイン'],
            ['import', 'アップロードと取り込み'],
            ['browse', '閲覧・検索・整理'],
            ['members-usage', '複数メンバーと権限'],
          ],
        },
        {
          group: 'システム設定',
          items: [
            ['settings-members', 'メンバーとログイン履歴'],
            ['settings-ai', 'AI 設定'],
            ['settings-perf', 'パフォーマンスとリソース配分'],
            ['settings-general', 'ストレージ・ゲスト・地図・ドメイン'],
            ['settings-update', 'システム更新'],
          ],
        },
      ],
    },
    {
      key: 'maintain',
      title: 'メンテナンス',
      groups: [
        {
          group: 'メンテナンス',
          items: [
            ['update', 'アップデート'],
            ['backup', 'バックアップと復元'],
            ['reset-password', '管理者パスワードのリセット'],
            ['troubleshooting', 'トラブルシューティング'],
            ['uninstall', 'アンインストール'],
          ],
        },
      ],
    },
  ],
  intro:
    'このドキュメントは、NAS、サーバー、個人の PC で Wanmory をセルフホストする管理者向けです。インストール、設定、AI サービスの導入、日常の使い方、システム設定、運用までを扱います。システム構成とアルゴリズムの詳細は[アーキテクチャ](/architecture/)をご覧ください。',
  blocks: [
    {
      h2: 'intro',
    },
    {
      p: 'Wanmory はオープンソースでセルフホスト型のプライベート AI フォトライブラリです。システムは 4 つのコンテナで構成されます：Go バックエンド（`server`）、Python の AI 推論サービス（`ml`）、PostgreSQL + pgvector データベース（`postgres`）、そして LAN ドメインを告知する `mdns`。写真、メタデータ、ベクトル、ジョブキューはすべてローカルに保存され、クラウドサービスには一切依存しません。',
    },
    {
      ul: [
        '写真管理：月ごとにまとめたタイムライン、アルバムとスマートアルバム、連写・類似写真の整理、旅の地図、スライドショー。',
        'AI 機能：顔の検出とクラスタリング、自然言語検索（Chinese-CLIP）、文字認識（PP-OCR）、美的スコア（AI ピックアップ）。',
        '複数メンバー：個別のアカウント、所有者に基づく削除権限、ログイン履歴。',
      ],
    },
    {
      h2: 'requirements',
    },
    {
      table: ['項目', '最低', '推奨'],
      rows: [
        ['CPU アーキテクチャ', 'x86_64（amd64）または ARM64', '—'],
        ['プロセッサ', 'Intel N100 / Raspberry Pi 5 クラス', 'Intel i5 クラス以上、または GPU 搭載マシンへの分離配置'],
        ['メモリ', '4 GB（「軽量」ティアを自動選択）', '8 GB 以上（「バランス」ティア）'],
        ['ディスク', 'モデルに約 1〜4 GB、加えてサムネイル用の容量', 'data/ とデータベースのボリュームは SSD に'],
        ['ソフトウェア', 'Docker Engine と Docker Compose v2', '—'],
        [
          'OS',
          'Docker が動く任意の Linux ディストリビューション',
          'Synology DSM、QNAP QTS、TrueNAS SCALE、Unraid、Ubuntu / Debian',
        ],
      ],
    },
    {
      note: 'イメージは `linux/amd64` と `linux/arm64` の両方を提供しており、Docker が現在のアーキテクチャに合うものを自動で取得します。macOS 上の Docker コンテナは Apple の GPU を使えないため、Mac でハードウェアアクセラレーションを使う場合は[AI サービスの分離運用](#ai-remote)を参照してください。',
    },
    {
      h2: 'quick-start',
    },
    {
      h3: '方法 1：インストールスクリプト（推奨）',
    },
    {
      p: 'Docker を入れた 64 ビットの Linux または macOS で実行します（Synology、QNAP などの NAS では先に SSH でログイン）：',
    },
    {
      code: 'curl -fsSL https://wanmory.com/install.sh | bash',
      lang: 'bash',
    },
    {
      p: 'スクリプトは 1 問ずつ質問し、Enter を押すと角かっこ内の既定値になります。初回は Enter を押し続けるだけでかまいません。各オプションの意味は[スクリプトのオプション](#install-script)、各メッセージの意味は[スクリプトの各ステップ](#install-steps)を参照してください。終わったら表示されたアドレスをブラウザーで開き、管理者を作成してから「設定 → AI の実行方法」でモデルをダウンロードします。',
    },
    {
      note: '先に中身を確認したい場合は、ダウンロードしてから実行します：`curl -fsSLO https://wanmory.com/install.sh` で取得し、確認後に `bash install.sh`。`--dry-run` を付けると環境チェックと設定ファイルの作成だけを行い、イメージの取得や起動はしません。',
    },
    {
      h3: '方法 2：手動インストール',
    },
    {
      steps: [
        {
          title: '導入用ディレクトリを作成し、Compose ファイルを取得',
          body: [
            {
              p: 'Compose ファイル、データ、モデルを置くディレクトリを作成し、公式の `docker-compose.yml` をダウンロードします：',
            },
            {
              code: `mkdir -p ~/wanmory && cd ~/wanmory
curl -fsSLO https://raw.githubusercontent.com/i-dj/wanmory/main/docker/docker-compose.yml`,
              lang: 'bash',
            },
          ],
        },
        {
          title: '（任意）.env を作成',
          body: [
            {
              p: '同じディレクトリに `.env` を作成して初期値を上書きします。本番環境では必ずデータベースのパスワードを変更してください：',
            },
            {
              code: `WANMORY_DB_PASSWORD=ランダムな文字列に置き換えてください
WANMORY_PORT=8080
WANMORY_TZ=Asia/Tokyo
WANMORY_VERSION=latest`,
              lang: '.env',
            },
          ],
        },
        {
          title: 'サービスを起動',
          body: [
            {
              p: '初回起動時はイメージを取得し、データベースのマイグレーションを自動で実行します：',
            },
            {
              code: `docker compose up -d
docker compose ps        # 4 つのサービスがすべて running / healthy であることを確認`,
              lang: 'bash',
            },
          ],
        },
        {
          title: 'アクセスして初期設定',
          body: [
            {
              p: 'ブラウザで `http://wanmory.local:8080`（または `http://<ホストの IP>:8080`）を開き、案内に従って管理者アカウントを作成し、「システム設定 → AI 設定」でモデルをダウンロードします。モデルのダウンロードが終わると、既存の写真は自動で AI 処理キューに入ります。',
            },
          ],
        },
      ],
    },
    {
      h2: 'install-script',
    },
    {
      p: '使い方：`curl -fsSL https://wanmory.com/install.sh | bash -s -- [オプション]`、またはダウンロード後に `bash install.sh [オプション]`。',
    },
    {
      h3: 'コマンドラインオプション',
    },
    {
      table: ['オプション', '働き'],
      rows: [
        [
          '`-y`、`--yes`',
          '質問せず、すべて既定値（または下の環境変数の値）を使います。データベースのパスワードは自動生成。対話できる端末がないとき（別のスクリプトから呼ぶ場合など）も自動でこうなります。',
        ],
        ['`--dir ディレクトリ`', 'インストール先。既定は `~/wanmory`（環境変数 `WANMORY_DIR` でも指定可）。'],
        [
          '`--dry-run`',
          '環境をチェックし、`.env` と `docker-compose.yml` を作成・検証するだけ。イメージの取得も起動もしません。',
        ],
        ['`-h`、`--help`', 'ヘルプを表示。'],
      ],
    },
    {
      h3: '環境変数',
    },
    {
      p: 'コマンドの前に書きます。対話インストールでは各質問の既定値になり、`-y` のときはそのまま使われます。`WANMORY_DIR` と `WANMORY_PHOTOS` 以外は `.env` に書き込まれます。',
    },
    {
      table: ['変数', '既定値', '働き'],
      rows: [
        ['`WANMORY_DIR`', '~/wanmory', 'インストール先。`--dir` と同じ。'],
        [
          '`WANMORY_PORT`',
          '8080',
          'Web ポート。使用中なら対話インストールでは別の番号を聞かれ、`-y` ではエラーで終了します。',
        ],
        [
          '`WANMORY_DOMAIN`',
          'wanmory.local',
          'LAN 内で使うドメイン。`.local` で終わり、英数字とハイフンだけにします。',
        ],
        ['`WANMORY_DB_PASSWORD`', '自動生成', 'データベースのパスワード。設定すると質問されません。'],
        [
          '`WANMORY_DB_DIR`',
          '空（Docker ボリューム pgdata）',
          'データベースを置くこのマシン上のディレクトリ。空なら Docker ボリューム。ネットワーク共有は使わないでください。',
        ],
        [
          '`WANMORY_TZ`',
          'このマシンのタイムゾーン（不明なら Asia/Shanghai）',
          'EXIF にタイムゾーンがない写真に使います。`Asia/Tokyo` のような正式名で指定。対話インストールでは都市名で検索もできます。',
        ],
        [
          '`WANMORY_DATA_DIR`',
          './data',
          'データディレクトリ：サムネイル、プレビュー、Web からアップロードした元の写真。相対パスはインストール先から。',
        ],
        ['`WANMORY_MODELS_DIR`', './models', 'AI モデルのディレクトリ。1〜4 GB 必要。'],
        [
          '`WANMORY_PHOTOS`',
          '空',
          '既存の写真フォルダー。カンマ区切りで複数指定、既定は読み取り専用。パスの後に `:rw` で読み書き可（例：`/volume1/photo,/mnt/usb:rw`）。',
        ],
        [
          '`WANMORY_REGISTRY`',
          'ghcr.io/i-dj',
          'イメージのレジストリ。ghcr.io が遅い・つながらないときは利用できるミラーに変更。',
        ],
        [
          '`WANMORY_VERSION`',
          'latest（最新版）',
          'インストールするバージョン（例：`0.4.1`）。ようこそ画面にインストールするバージョンが表示されます。',
        ],
      ],
    },
    {
      code: `# 例：質問なしで /opt/wanmory にインストール、ポート 9000、NAS の写真フォルダー 2 つを読み取り専用でマウント
curl -fsSL https://wanmory.com/install.sh | WANMORY_PORT=9000 WANMORY_PHOTOS=/volume1/photo,/volume2/family bash -s -- -y --dir /opt/wanmory`,
      lang: 'bash',
    },
    {
      h2: 'install-steps',
    },
    {
      p: 'スクリプトのメッセージは、どの NAS の端末でも正しく表示されるよう英語です。表示される順に各ステップを説明します。緑の ✔ は合格、黄色の ! は注意（続行します）、赤の ✘ はエラーで終了です。',
    },
    {
      steps: [
        {
          title: 'ようこそ画面',
          body: [
            {
              p: 'WANMORY のロゴと `Installing version v0.4.1` を表示します。インストールするバージョンで、`WANMORY_VERSION` を設定していればその値、なければ最新リリースです。',
            },
          ],
        },
        {
          title: 'Checking system（システムチェック）',
          body: [
            {
              qa: [
                {
                  q: '`OS: Linux` / `OS: macOS`',
                  a: 'OS。macOS では、コンテナ内の AI は Apple の GPU を使えないので、速くしたいなら Mac で AI サービスを直接動かすよう案内します（[AI サービスを別に動かす](#ai-remote)を参照）。それ以外の OS は終了します。',
                },
                {
                  q: '`CPU: x86_64 (linux/amd64 images)`',
                  a: 'CPU アーキテクチャ。64 ビットの amd64 と arm64 のみ対応。32 ビット環境（64 ビットカーネルに 32 ビットユーザーランドの古い Raspberry Pi OS を含む）は終了するので、64 ビット OS を入れてください。',
                },
                {
                  q: '`Docker 27.x`',
                  a: 'Docker が使えます。未インストールならインストール手順のリンクを表示（Synology / QNAP はパッケージセンターから Container Manager / Container Station）。`Permission denied` のときは sudo で実行するか、ユーザーを docker グループに追加して再ログイン。',
                },
                {
                  q: '`Docker Compose v2.x`',
                  a: 'Docker Compose が使えます。古い docker-compose v1 しかない場合はアップグレードを勧めますが続行します。',
                },
                {
                  q: '`Memory: 8 GB`',
                  a: 'メモリ。4 GB 未満なら `AI will use the lite model tier`（AI は自動で軽量レベルを使用）、2 GB 未満なら AI 認識が動かない可能性を警告します。',
                },
              ],
            },
          ],
        },
        {
          title: 'Configuration（設定）',
          body: [
            {
              p: '1 問ずつ質問します。Enter で角かっこ内の既定値になります。',
            },
            {
              qa: [
                {
                  q: '`Install directory`',
                  a: 'インストール先。`.env`、`docker-compose.yml`、既定では data と models もここに置きます。続いてそのディスクの空き容量を表示し、10 GB 未満なら警告します。',
                },
                {
                  q: '`Keep the existing configuration`',
                  a: 'ディレクトリに `.env` がある（以前インストールした）ときだけ表示。Enter（Y）でポート、ドメイン、データベースのパスワードなどをそのまま使い、以下の質問を飛ばします。再インストールやアップグレード向け。n で入力し直し。データベース作成後にパスワードを安易に変えないでください。',
                },
                {
                  q: '`Web port`',
                  a: 'Web ポート、既定 8080。使用中なら別の番号を聞かれます。',
                },
                {
                  q: '`LAN domain (must end in .local)`',
                  a: 'LAN 内でライブラリを開くドメイン。既定は wanmory.local、photos.local なども可。あとで Web の設定からも変更できます。',
                },
                {
                  q: '`Generate a random database password`',
                  a: 'Enter でランダムなパスワードを生成して `.env` に保存。覚える必要はありません。n なら自分で 2 回入力（8 文字以上、空白・引用符・`$ \\ @ : / # ?` は不可）。',
                },
                {
                  q: '`Database location`',
                  a: 'データベースの置き場所。空のまま Enter で Docker ボリューム pgdata（推奨）、または `/volume1/wanmory/db` のようなローカルディレクトリ。SMB / NFS のネットワーク共有は壊れるおそれがあると警告します。',
                },
                {
                  q: '`Time zone`',
                  a: 'タイムゾーン。EXIF にタイムゾーンがない写真の日時に使います。tokyo、shanghai、london など都市や国で検索でき、複数一致すると番号で選びます。',
                },
                {
                  q: '`Data directory`',
                  a: 'データディレクトリ、既定 ./data。サムネイル、プレビュー、Web からアップロードした元の写真を保存するので、十分な空きを。',
                },
                {
                  q: '`AI model directory (1-4 GB)`',
                  a: 'AI モデルのディレクトリ、既定 ./models。',
                },
                {
                  q: '`Add existing photo folders from a NAS or external drive`',
                  a: '既存の写真フォルダーを追加するか（再アップロード不要）。Y でパスを入力。存在しない場合はもう一度確認します。',
                },
                {
                  q: '`Mount read-only`',
                  a: 'Enter で読み取り専用：元のファイルを変更・削除することは一切ありません（推奨）。n で読み書き可：Wanmory で写真を完全に削除すると元のファイルも削除されます。',
                },
                {
                  q: '`Add another photo folder`',
                  a: '次のフォルダーを追加。Enter（N）で終了。',
                },
              ],
            },
          ],
        },
        {
          title: 'Writing configuration（設定の書き込み）',
          body: [
            {
              p: '`.env`（権限 600、あなただけが読める）を書き込み、写真フォルダーを追加した場合は `docker-compose.override.yml`（Docker Compose が自動で統合）も作成。`docker-compose.yml` を GitHub から、だめなら Gitee からダウンロードします。`Configuration is valid` は設定チェック合格の意味。`--dry-run` ならここで終了です。',
            },
          ],
        },
        {
          title: 'Existing database found（既存のデータベース）',
          body: [
            {
              p: '以前の設定を使わなかったのに、以前のデータベースが残っているとき（アンインストール時にデータベースを残した場合など）だけ表示。Enter（Y）で残す：写真、アルバム、人物、アカウントはそのままで、データベースのパスワードは `.env` の新しい値に変更されます。n で古いデータベースを削除して最初から。データベースがローカルディレクトリにある場合は自動では削除しないので、自分で空にしてから再実行してください。',
            },
          ],
        },
        {
          title: 'Pulling images and starting（イメージ取得と起動）',
          body: [
            {
              p: 'イメージを取得します（初回は数分）。先にデータベースを起動して準備を待ち（`Waiting for the database...`）、データベースのパスワードを `.env` の値に合わせて（`Database ready`）から、残りのサービスを起動します。',
            },
          ],
        },
        {
          title: 'Waiting for Wanmory to start（起動待ち）',
          body: [
            {
              p: '最大 5 分待ちます。Raspberry Pi など遅い機器では初回に時間がかかります。起動しては落ちる状態なら最後の 15 行のログを表示して終了。時間切れでも応答がなければ、少し後に確認するよう案内し、ログを見るコマンドを表示します。',
            },
          ],
        },
        {
          title: 'Installation complete（インストール完了）',
          body: [
            {
              p: '`LAN address`（ドメインのアドレス）、`IP address`（IP アドレス）、インストール先を表示。`Next` は次の手順：ページを開いて管理者を作成し、「設定 → AI の実行方法」でモデルをダウンロード。一部の Android 端末は .local を解決できないので IP アドレスで開いてください。',
            },
          ],
        },
      ],
    },
    {
      h2: 'install-faq',
    },
    {
      qa: [
        {
          q: '再インストール後、データベースに接続できない（パスワード認証失敗）',
          a: 'データベースは最初に作られたときだけ `.env` のパスワードを使い、あとで `.env` を変えても変わりません。現在のスクリプトは起動時にデータベースのパスワードを `.env` に合わせるので、スクリプトをもう一度実行すれば直ります。手動インストールの場合は、インストール先で `docker compose exec postgres psql -U wanmory -c "ALTER USER wanmory WITH PASSWORD \'新しいパスワード\';"` を実行してから `docker compose up -d`。',
        },
        {
          q: 'データディレクトリのファイルの所有者／ホストで削除できない',
          a: 'Wanmory のコンテナはデータディレクトリの所有者として動きます。一般ユーザーが作ったディレクトリ（スクリプトはそうします）なら、アップロードやサムネイルはそのユーザーのものになり、ホストで sudo なしに管理できます。ディレクトリが root のものや Docker ボリュームなら uid 1000 で動きます。exFAT / NTFS の USB ドライブや SMB 共有など所有者を変えられないファイルシステムでは root で動きます。古いバージョンが残した所有者の違うファイルは起動時に直します。',
        },
        {
          q: 'Raspberry Pi',
          a: '64 ビット OS（Raspberry Pi OS 64-bit）が必要で、32 ビットではスクリプトが終了します。メモリ 4 GB なら自動で軽量レベル。初回起動と最初の写真処理は遅いので、データとデータベースは SSD に置くのがおすすめです。',
        },
        {
          q: 'ポートが使用中',
          a: '別のポートにするか、`WANMORY_PORT=9000` を付けてスクリプトを実行。',
        },
        {
          q: 'イメージの取得が遅い・失敗する',
          a: '`WANMORY_REGISTRY` を利用できるミラーに設定して再実行。',
        },
      ],
    },
    {
      h2: 'compose',
    },
    {
      p: '公式の Compose ファイルには 4 つのサービスが定義されています：データベース `postgres`、アプリのバックエンド `server`、LAN ドメインを告知する `mdns`、内蔵 AI サービス `ml`。各設定項目の役割はファイル内に直接記載しています：',
    },
    {
      lang: 'yaml',
      code: `# Wanmory 公式 Compose ファイル：このファイルのあるディレクトリで docker compose up -d を実行
# \${VAR:-初期値} 形式の変数は同じディレクトリの .env から読み込み、未設定なら初期値を使う

services:
  # ── データベース：PostgreSQL 17 + pgvector ───────────────────────
  # 写真のメタデータ、人物、アルバム、設定、ジョブキュー、ベクトル（HNSW 索引）を保存
  # ポートは公開せず、Compose の内部ネットワークからのみ到達可能
  postgres:
    image: pgvector/pgvector:pg17
    environment:
      POSTGRES_USER: wanmory
      POSTGRES_PASSWORD: \${WANMORY_DB_PASSWORD:-wanmory}   # 本番環境では必ず .env で変更すること
      POSTGRES_DB: wanmory
    volumes:
      - \${WANMORY_DB_DIR:-pgdata}:/var/lib/postgresql/data  # 初期値は名前付きボリューム pgdata、WANMORY_DB_DIR を設定するとそのディレクトリに保存。バックアップ対象
    healthcheck:                             # server はこのヘルスチェックを待ち、DB の準備ができてから起動する
      test: ["CMD", "pg_isready", "-U", "wanmory", "-d", "wanmory"]
      interval: 5s
      timeout: 3s
      retries: 20
    restart: unless-stopped

  # ── アプリのバックエンド：Web アプリを内蔵した Go バイナリ ───────
  # API、アップロード（tus）、ジョブスケジューリング、サムネイル、権限を担当。起動時に DB マイグレーションを自動実行
  server:
    image: \${WANMORY_REGISTRY:-ghcr.io/i-dj}/wanmory-server:\${WANMORY_VERSION:-latest}
    environment:
      DATABASE_URL: postgres://wanmory:\${WANMORY_DB_PASSWORD:-wanmory}@postgres:5432/wanmory
      WANMORY_ML_URL: http://ml:3003         # 内蔵 AI サービスのアドレス。リモート AI サービスは Web の「AI 設定」で指定
      TZ: \${WANMORY_TZ:-Asia/Shanghai}       # EXIF にタイムゾーンがない場合に使うタイムゾーン
      WANMORY_MDNS: "off"                    # このコンテナはブリッジネットワークでマルチキャストを受信できないため、告知は下の mdns サービスに任せる
      WANMORY_HTTP_PUBLIC_PORT: \${WANMORY_PORT:-8080}   # Web 上に表示するアクセス用ポート。ポートの割り当てと揃えること
      WANMORY_DOMAIN: \${WANMORY_DOMAIN:-wanmory.local}  # LAN ドメインの初期値。Web の設定で変更した後はそちらが優先
    ports:
      - "\${WANMORY_PORT:-8080}:8080"         # ホストのポート:コンテナのポート
    volumes:
      - \${WANMORY_DATA_DIR:-./data}:/data    # upload/ にアップロードした原本、thumbs/ にサムネイルと 1440px プレビュー
      # 既存の写真フォルダーは /photos 配下のサブディレクトリにマウント（複数可）。:ro は読み取り専用、15 分ごとにスキャン
      # - /mnt/nas/photos:/photos/nas:ro
      # - /media/usb/camera:/photos/usb:ro
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  # ── LAN ドメインの告知（mDNS）────────────────────────────────────
  # server と同じイメージで mdns サブコマンドだけを実行し、wanmory.local を告知（Web で変更可）
  mdns:
    image: \${WANMORY_REGISTRY:-ghcr.io/i-dj}/wanmory-server:\${WANMORY_VERSION:-latest}
    command: ["mdns"]
    network_mode: host                       # LAN のマルチキャストを送受信するにはホストネットワークが必須
    environment:
      WANMORY_URL: http://127.0.0.1:\${WANMORY_PORT:-8080}   # 定期的に server へ現在のドメインを問い合わせる
      WANMORY_DOMAIN: \${WANMORY_DOMAIN:-wanmory.local}  # 問い合わせできない間はこのドメインを告知
    depends_on:
      - server
    restart: unless-stopped

  # ── 内蔵 AI サービス：FastAPI + ONNX Runtime、CPU のみ ──────────
  # ステートレス。server から送られたプレビューを受け取り、顔・ベクトル・文字を返す。ポートは公開しない
  ml:
    image: \${WANMORY_REGISTRY:-ghcr.io/i-dj}/wanmory-ml:\${WANMORY_VERSION:-latest}
    volumes:
      - \${WANMORY_MODELS_DIR:-./models}:/models  # モデルファイルを永続化し、コンテナを作り直しても再ダウンロード不要
    environment:
      WANMORY_MODEL_DIR: /models
      WANMORY_AUTO_DOWNLOAD: "0"             # 自動ダウンロードはせず、管理者が Web でライセンスとディスク使用量を確認してからダウンロード
    restart: unless-stopped

volumes:
  pgdata:`,
    },
    {
      h2: 'env',
    },
    {
      h3: '.env（Compose の変数）',
    },
    {
      p: '次の変数は `docker-compose.yml` から参照されます。同じディレクトリの `.env` に書けば反映されます：',
    },
    {
      table: ['変数', '初期値', '説明'],
      rows: [
        [
          '`WANMORY_DB_PASSWORD`',
          'wanmory',
          'PostgreSQL のパスワード。server の DATABASE_URL にも使われます。初回起動後に変更する場合は、データベース内のユーザーのパスワードも合わせて変更する必要があります。',
        ],
        ['`WANMORY_PORT`', '8080', 'ホスト側の公開ポート。Web 上に表示するアクセス先にも使われます。'],
        ['`WANMORY_TZ`', 'Asia/Shanghai', 'EXIF にタイムゾーン情報がない場合に使うタイムゾーン。'],
        [
          '`WANMORY_VERSION`',
          'latest',
          'イメージのタグ。特定のバージョンに固定すればアップグレードの時期を管理できます。',
        ],
        [
          '`WANMORY_REGISTRY`',
          'ghcr.io/i-dj',
          'イメージのレジストリ。ghcr.io にアクセスできない場合は利用可能なレジストリに置き換えます。',
        ],
        [
          '`WANMORY_DATA_DIR`',
          './data',
          'データディレクトリ：アップロードした原本（upload/）とサムネイル・プレビュー（thumbs/）。コンテナの /data にマウントされます。',
        ],
        ['`WANMORY_MODELS_DIR`', './models', 'AI モデルのディレクトリ。ml コンテナの /models にマウントされます。'],
        [
          '`WANMORY_DB_DIR`',
          'ボリューム pgdata',
          'データベースのディレクトリ。未設定なら Docker ボリューム pgdata を使用し、ローカルディスク上のディレクトリのパスを指定するとそこに直接保存します。ネットワーク共有フォルダーは使わないでください。',
        ],
        [
          '`WANMORY_DOMAIN`',
          'wanmory.local',
          'LAN ドメインの初期値。.local で終わる必要があります。Web の「システム設定 → アクセス用ドメイン」で変更した後はそちらが優先されます。',
        ],
      ],
    },
    {
      h3: 'server コンテナ（任意）',
    },
    {
      p: '`DATABASE_URL`、`WANMORY_ML_URL`、`WANMORY_MDNS`、`WANMORY_HTTP_PUBLIC_PORT` は Compose ファイルで設定済みで、用途も記載しています。次の変数は既定の Compose ファイルには含まれていないため、必要に応じて `server` の `environment` に追加します：',
    },
    {
      table: ['変数', '初期値', '説明'],
      rows: [
        [
          '`WANMORY_WORKERS`',
          '自動',
          'メタデータとサムネイルのジョブの既定の並列数。未設定なら CPU コア数とメモリから自動計算し、Web の「パフォーマンス」で調整できます。',
        ],
        [
          '`WANMORY_ML_TOKEN`',
          '空',
          '内蔵 AI サービスのアクセストークン。ml コンテナの同名の変数と一致させる必要があります。通常は設定不要です。',
        ],
        ['`WANMORY_FACE_MODEL`', 'antelopev2', 'モデルティアを選んでいないときに使う顔認識モデル。'],
        [
          '`WANMORY_CLIP_MODEL`',
          'chinese-clip-vit-h-14',
          'モデルティアを選んでいないときに使うセマンティック検索モデル。',
        ],
        [
          '`WANMORY_STORAGE_ROOTS`',
          'データディレクトリ',
          'Web で閲覧・選択できるディレクトリの範囲。複数はコロン区切り。',
        ],
      ],
    },
    {
      h2: 'library',
    },
    {
      p: 'NAS や外付けドライブにすでにある写真は、アップロードし直す必要はありません。フォルダーをコンテナ内の `/photos` 配下のサブディレクトリにマウントすれば、15 分ごとにスキャンされ、新しいファイルは**その場で取り込まれ**（コピーも移動もしません）、その後はアップロードした写真と同じようにメタデータの読み込み、サムネイル生成、AI 処理が行われます。',
    },
    {
      lang: 'yaml',
      code: `  server:
    volumes:
      - ./data:/data
      - /mnt/nas/photos:/photos/nas:ro       # :ro は読み取り専用マウント
      - /media/usb/camera:/photos/usb:ro
      - /home/me/Pictures:/photos/pictures    # 読み書き可能なマウント`,
    },
    {
      p: '変更後に `docker compose up -d` を実行すると、コンテナの再起動から約 20 秒後に最初のスキャンが始まります。',
    },
    {
      ul: [
        '**読み取り専用マウント（:ro）を推奨**：システムはこれらのフォルダーに書き込みません。アプリで写真を削除しても「最近削除」に移るだけで、完全に削除しても原本ファイルは消えず、その後のスキャンで再び取り込まれることもありません。読み書き可能なフォルダーでは、完全に削除すると原本ファイルも削除されます。',
        '内容がまったく同じファイルは 1 つだけ取り込みます（SHA-1 チェックサムで判定）。すでにアップロード済みのファイルや、複数のフォルダー間の重複も含みます。',
        '隠しフォルダーや NAS のシステムフォルダー（.xxx、@eaDir、#recycle など）は自動でスキップします。',
        '写真フォルダーから取り込んだ写真はどのメンバーにも属さず、削除できるのは管理者だけです。',
      ],
    },
    {
      h2: 'mdns',
    },
    {
      p: '`mdns` サービスはホストネットワークモードで動作し、LAN 内にアクセス用ドメイン（初期値 `wanmory.local`）を告知します。macOS、iOS、iPadOS、Windows 10 以降なら、ルーターの設定なしで `http://wanmory.local:8080` にアクセスできます。ドメインは「システム設定 → アクセス用ドメイン」で変更でき、`.local` で終わる必要があります。',
    },
    {
      note: '一部の Android 端末は mDNS の名前解決に対応していないため、IP アドレスでアクセスしてください。Synology などで 5353 番ポートがすでに使われていると mdns サービスが起動できない場合がありますが、その場合も IP でアクセスすれば問題なく、ほかの機能には影響しません。',
      warn: true,
    },
    {
      h2: 'proxy',
    },
    {
      p: 'Web アップロードは再開可能な [tus](https://tus.io) プロトコル（`/api/uploads/`）を使い、チャンクサイズは 16 MB です。リバースプロキシの背後に置く場合は、1 リクエストあたりのボディサイズ制限を緩め、リクエストのバッファリングを無効にする必要があります。Nginx の例：',
    },
    {
      lang: 'nginx',
      code: `location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location /api/uploads/ {
    proxy_pass http://127.0.0.1:8080;
    client_max_body_size 0;          # リクエストボディのサイズを制限しない（最低でも 20m）
    proxy_request_buffering off;     # ストリーミングで転送し、プロキシ側のディスクに書き出さない
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
}`,
    },
    {
      note: 'インターネットに公開する前に、HTTPS を使う、「システム設定」でゲスト閲覧をオフにする、全メンバーに強力なパスワードを設定する、の 3 点を行ってください。Cloudflare の無料プランは 1 リクエスト 100 MB までなので、16 MB のチャンクなら追加の設定は不要です。',
      warn: true,
    },
    {
      h2: 'ai-overview',
    },
    {
      p: 'AI サービスはステートレスな HTTP サービスです。バックエンドから送られる 1440 ピクセルのプレビューを受け取り、顔、ベクトル、文字認識の結果を返します。データベースにはアクセスせず、ファイルも保存しません。バックエンドは 2 つの実行方式に対応しており、「システム設定 → AI 設定 → AI の実行方式」で切り替えます：',
    },
    {
      table: ['方式', '配置場所', '向いている用途'],
      rows: [
        [
          '内蔵（CPU のみ）',
          'Compose 内の ml コンテナ、内部ネットワークからのみ到達可能',
          'すぐに使える。NAS やミニ PC で写真が多くない場合、または初回処理に時間がかかっても構わない場合',
        ],
        [
          'リモートサービス',
          'LAN 内の別のマシンで Python サービスを直接実行',
          'Apple シリコン Mac（CoreML / MPS）や NVIDIA GPU 搭載マシン（CUDA）で、初回処理の時間を大幅に短縮',
        ],
      ],
    },
    {
      p: 'AI サービスが使えないときは、AI ジョブはキューに残ったまま取得が止まり、再試行回数は消費されません。サービスが復旧すると自動で再開します。写真の閲覧やアップロードなどの機能には影響しません。',
    },
    {
      h2: 'ai-remote',
    },
    {
      p: '内蔵の AI コンテナは CPU だけを使います。もっと速いコンピューター（Apple シリコンの Mac、NVIDIA GPU 付きの Windows / Linux PC）があれば、そこで AI サービス（リポジトリの `ml/` フォルダーの Python プログラム）を直接動かし、Wanmory から写真を送って計算させられます。Python と依存関係は [uv](https://docs.astral.sh/uv/) が管理するので、Python を自分で入れる必要はありません。',
    },
    {
      table: ['コンピューター', '利用できる高速化'],
      rows: [
        ['Apple シリコンの Mac', '顔認識は CoreML、スマート検索は MPS（PyTorch）。'],
        ['Linux + NVIDIA GPU', 'スマート検索は CUDA（PyTorch の半精度、VRAM 約 1.9 GB）。'],
        [
          'Windows + NVIDIA GPU',
          'CUDA 版 PyTorch を入れるとスマート検索が CUDA に（下の Windows 手順 3）。顔と文字認識は CPU。',
        ],
        ['GPU なし', 'PyTorch を入れず、すべて ONNX で CPU 計算。NAS よりずっと速い PC なら効果があります。'],
      ],
    },
    {
      h3: 'macOS',
    },
    {
      steps: [
        {
          title: 'uv をインストール',
          body: [
            {
              code: `curl -LsSf https://astral.sh/uv/install.sh | sh   # または brew install uv
# インストール後、ターミナルを開き直す`,
              lang: 'bash',
            },
          ],
        },
        {
          title: 'コードを取得',
          body: [
            {
              code: `git clone https://github.com/i-dj/wanmory.git   # 中国国内ミラー：https://gitee.com/i-dj/wanmory.git
cd wanmory/ml`,
              lang: 'bash',
            },
            {
              p: 'git がない場合、macOS が Xcode コマンドラインツールのインストールを提案するので、指示に従って入れてください。',
            },
          ],
        },
        {
          title: '依存関係をインストール',
          body: [
            {
              code: 'uv sync --extra torch   # 初回は Python と PyTorch をダウンロード、数分かかります',
              lang: 'bash',
            },
          ],
        },
        {
          title: 'アクセストークンを作って起動',
          body: [
            {
              code: `export WANMORY_ML_TOKEN=$(openssl rand -hex 24)
echo $WANMORY_ML_TOKEN   # 控えておく（Wanmory に入力します）
WANMORY_FACE_MODEL_PRELOAD=1 uv run --extra torch python -m wanmory_ml`,
              lang: 'bash',
            },
            {
              p: '`Uvicorn running on http://0.0.0.0:3003` と出れば起動完了。初回は顔モデル（約 340 MB）を先にダウンロードします。python の受信接続を許可するか聞かれたら許可してください。',
            },
          ],
        },
        {
          title: 'ほかのコンピューターからの接続を許可',
          body: [
            {
              p: 'ファイアウォール（システム設定 → ネットワーク → ファイアウォール）がオンなら、python の受信接続が許可されていることを確認。`ipconfig getifaddr en0` でこの Mac の IP アドレスがわかります。',
            },
          ],
        },
      ],
    },
    {
      h3: 'Windows',
    },
    {
      steps: [
        {
          title: 'uv をインストール',
          body: [
            {
              p: 'PowerShell を開いて実行：',
            },
            {
              code: `powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
# または winget install --id=astral-sh.uv -e
# インストール後、PowerShell を開き直す`,
              lang: 'powershell',
            },
          ],
        },
        {
          title: 'コードを取得',
          body: [
            {
              code: `git clone https://github.com/i-dj/wanmory.git   # Git がなければ winget install Git.Git
cd wanmory\\ml`,
              lang: 'powershell',
            },
            {
              p: 'Git を入れたくなければ、GitHub のページで Code → Download ZIP を押し、展開して ml フォルダーに入ってもかまいません。',
            },
          ],
        },
        {
          title: '依存関係をインストール',
          body: [
            {
              code: `uv sync --extra torch
# NVIDIA GPU がある場合は CUDA 版 PyTorch に入れ替え（PyPI の Windows 版 PyTorch は CPU 専用）
uv pip install --reinstall torch --index-url https://download.pytorch.org/whl/cu126`,
              lang: 'powershell',
            },
            {
              p: 'CUDA 版に入れ替えたら、起動は `uv run --no-sync` で。そうしないと uv が CPU 版に戻してしまいます。GPU がなければ `uv sync` だけ（PyTorch なしでずっと小さい）にし、起動時の `--extra torch` も外します。',
            },
          ],
        },
        {
          title: 'アクセストークンを作って起動',
          body: [
            {
              code: `$env:WANMORY_ML_TOKEN = [guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N")
echo $env:WANMORY_ML_TOKEN   # 控えておく（Wanmory に入力します）
$env:WANMORY_FACE_MODEL_PRELOAD = "1"
uv run --extra torch python -m wanmory_ml
# CUDA 版 PyTorch を入れた場合：uv run --no-sync python -m wanmory_ml`,
              lang: 'powershell',
            },
          ],
        },
        {
          title: 'ファイアウォールでポートを開ける',
          body: [
            {
              p: '初回起動時に Windows ファイアウォールの確認が出たら「プライベート ネットワーク」にチェックして許可。管理者として開いた PowerShell で次を実行してもかまいません：',
            },
            {
              code: 'New-NetFirewallRule -DisplayName "Wanmory AI" -Direction Inbound -Protocol TCP -LocalPort 3003 -Action Allow',
              lang: 'powershell',
            },
            {
              p: '`ipconfig` でこの PC の IPv4 アドレスがわかります。',
            },
          ],
        },
        {
          title: '自動起動（任意）',
          body: [
            {
              p: 'ml フォルダーに `start-ai.cmd` を作ります：',
            },
            {
              code: `@echo off
cd /d %~dp0
set WANMORY_ML_TOKEN=あなたのトークン
uv run --extra torch python -m wanmory_ml`,
              lang: 'cmd',
            },
            {
              p: 'Win+R で `shell:startup` と入力し、開いたフォルダーにこのファイルのショートカットを置くと、Windows にサインインしたときに起動します。サインインせずに動かしたい場合は、タスク スケジューラで「コンピューターの起動時」をトリガー、この start-ai.cmd を操作にしたタスクを作成します。',
            },
          ],
        },
      ],
    },
    {
      h3: 'Linux',
    },
    {
      code: `curl -LsSf https://astral.sh/uv/install.sh | sh
git clone https://github.com/i-dj/wanmory.git && cd wanmory/ml
uv sync --extra torch        # Linux の PyPI 版 PyTorch は CUDA 入り。GPU がなければ uv sync だけ
export WANMORY_ML_TOKEN=$(openssl rand -hex 24)
WANMORY_FACE_MODEL_PRELOAD=1 uv run --extra torch python -m wanmory_ml
sudo ufw allow 3003/tcp      # ufw を使っている場合`,
      lang: 'bash',
    },
    {
      p: '起動時に自動で動かすなら systemd サービスを作ります。`ExecStart` に上の uv run コマンド（uv はフルパス `~/.local/bin/uv`）、`WorkingDirectory` に ml フォルダー、`Environment=` にトークンを書きます。',
    },
    {
      h3: '主な環境変数',
    },
    {
      table: ['変数', '既定値', '働き'],
      rows: [
        ['`WANMORY_ML_HOST`', '0.0.0.0', '待ち受けアドレス。0.0.0.0 なら LAN のほかのコンピューターから接続できます。'],
        ['`WANMORY_ML_PORT`', '3003', '待ち受けポート。'],
        [
          '`WANMORY_ML_TOKEN`',
          '空',
          'アクセストークン。設定すると、ヘルスチェック以外のリクエストには `Authorization: Bearer トークン` が必要。Wanmory にも同じ値を入力します。',
        ],
        [
          '`WANMORY_MODEL_DIR`',
          '~/.cache/wanmory/models',
          'モデルの保存先（Windows ではユーザーフォルダーの .cache\\wanmory\\models）。',
        ],
      ],
    },
    {
      p: 'そのほかは [AI サービスの環境変数](#ai-env)を参照。',
    },
    {
      h3: 'Wanmory から接続する',
    },
    {
      steps: [
        {
          title: 'リモートサービスを選ぶ',
          body: [
            {
              p: '管理者で「設定」を開き、「AI の実行方法」カードで「リモートサービス」を選びます。',
            },
          ],
        },
        {
          title: 'URL とトークンを入力',
          body: [
            {
              p: '「サービス URL」に AI サービスを動かしているコンピューターのアドレス（例：`http://192.168.1.20:3003`）、「アクセストークン」に作ったトークンを入力。「接続テスト」が通ると遅延とバージョンが表示されるので、保存します。',
            },
          ],
        },
        {
          title: 'モデルをダウンロード',
          body: [
            {
              p: '接続後、レベルが「自動」ならそのコンピューターのハードウェアに合わせて推奨し直します。「モデルのレベル」で必要なモデルをダウンロードすると、AI が写真の処理を始めます。',
            },
          ],
        },
      ],
    },
    {
      note: 'リモート AI サービスは LAN か VPN（Tailscale など）の中だけで使い、必ずトークンを設定してください。ポート 3003 をインターネットに直接公開しないこと。AI サービスを動かすコンピューターの電源が切れたりスリープしたりすると AI 処理は一時停止し、戻ると自動で再開します。',
      warn: true,
    },
    {
      h2: 'ai-schedule',
    },
    {
      p: '写真を取り込むと、情報の読み取りとサムネイル作成はすぐに行います。AI 認識（顔、スマート検索、文字）をいつ行うかは「設定 → バックグラウンド処理」で設定し、変更はすぐ反映されます。カードの上部に、いま AI が動けるか、動けないならその理由が表示されます。',
    },
    {
      table: ['設定', '選択肢', '働き'],
      rows: [
        [
          '処理のタイミング',
          'アイドル時（既定）',
          '写真のアップロード中やサムネイル作成中は AI を止め、落ち着いてから処理します。',
        ],
        [
          '',
          '常時',
          'アップロードを待たずに処理し続けます。アップロードが遅くなることがあります。「アップロード後の待ち時間」は効きません。',
        ],
        [
          '',
          '夜間',
          '設定した時間帯だけ処理（既定 1:00〜7:00。23:00〜翌 7:00 のように日付をまたいでも可）。時間帯の中でもアップロードは避けます。',
        ],
        [
          'アップロード後の待ち時間',
          '30 秒（既定）、5 / 15 / 30 分、1 / 2 / 4 時間',
          '写真のアップロードが終わってから、この時間待って AI を始めます。続けてアップロードするときに割り込みません。「アイドル時」と「夜間」で有効。明日まで待ちたいなら「夜間」を選びます。',
        ],
      ],
    },
    {
      ul: [
        '現在のレベルのモデルがまだダウンロードされていなければ、タイミングに関係なく AI は止まります。「モデルのレベル」でダウンロードすると自動で始まります。',
        '終わっていないアップロード（回線が切れても再開できるものを含む）があるあいだ、AI は待ち続けます。',
        'AI が止まっているあいだもタスクはキューに残り、失われたり失敗扱いになったりしません。',
      ],
    },
    {
      h2: 'ai-models',
    },
    {
      p: 'ティアによって、顔認識とセマンティック検索に使うモデルの組み合わせが決まります。「自動」を選ぶと、AI サービスが動くマシンのハードウェアから推奨します。使える GPU があれば「高精度」、CPU のみでメモリが 6 GB 未満なら「軽量」、それ以外は「バランス」です。',
    },
    {
      table: ['ティア', '顔検出 + 特徴量', 'セマンティック検索', '適したハードウェア'],
      rows: [
        [
          '高精度 quality',
          'antelopev2（SCRFD-10G + ArcFace R100）',
          'Chinese-CLIP ViT-H/14（1024 次元）',
          'Apple シリコン Mac、NVIDIA GPU',
        ],
        ['バランス balanced', 'antelopev2', 'Chinese-CLIP ViT-L/14（768 次元）', 'Intel i5 クラスの NAS'],
        ['軽量 lite', 'buffalo_l（ArcFace R50）', 'Chinese-CLIP ViT-B/16（512 次元）', 'N100、Raspberry Pi 5'],
      ],
    },
    {
      ul: [
        '文字認識には PP-OCRv6（RapidOCR）を使います。モデルは依存関係と一緒にインストールされるため、個別のダウンロードは不要です。',
        'ティアを切り替えると、すべての写真について新しいモデルで顔を検出し直し、セマンティックベクトルを再計算します。その間も検索は古いベクトルで動き、名前を付けた人物は保持されます。',
        'モデルはマウントした ./models ディレクトリにダウンロードされ、使わなくなったモデルを削除して容量を空けられます（使用中のモデルは削除できません）。',
        'InsightFace の顔認識モデルは非商用利用に限られます。商用で使う前に、別のモデルに置き換えるかライセンスを取得してください。',
      ],
    },
    {
      h2: 'ai-env',
    },
    {
      table: ['変数', '初期値', '説明'],
      rows: [
        ['`WANMORY_ML_HOST`', '0.0.0.0', '待ち受けアドレス。'],
        ['`WANMORY_ML_PORT`', '3003', '待ち受けポート。'],
        [
          '`WANMORY_ML_TOKEN`',
          '空',
          'アクセストークン。設定するとすべてのリクエストに Authorization: Bearer が必要になります。',
        ],
        ['`WANMORY_MODEL_DIR`', '~/.cache/wanmory/models', 'モデルの保存先。イメージ内では /models。'],
        ['`WANMORY_AUTO_DOWNLOAD`', 'イメージ内では 0', '初回使用時にモデルを自動でダウンロードするかどうか。'],
        [
          '`WANMORY_FACE_MODEL_PRELOAD`',
          '—',
          '1 にすると起動時に顔認識モデルを読み込み、Chinese-CLIP はバックグラウンドで読み込みます。',
        ],
        [
          '`WANMORY_UNLOAD_AFTER`',
          '5 / 30 分',
          'モデルが何秒間使われなければメモリ解放のためにアンロードするか。0 ならアンロードしません。既定値はホストのメモリ量で決まります。',
        ],
      ],
    },
    {
      h2: 'first-run',
    },
    {
      steps: [
        {
          title: '管理者を作成',
          body: [
            {
              p: '初回アクセス時にアカウントがまだないことを検出し、管理者の作成を案内します。管理者はメンバーの追加やシステム設定の変更ができます。',
            },
          ],
        },
        {
          title: 'モデルをダウンロード',
          body: [
            {
              p: '「システム設定 → AI 設定」でモデルティアを確認し、モデルをダウンロードします。モデルの準備ができるまで、AI ジョブはキューで待機します。',
            },
          ],
        },
        {
          title: '写真を取り込む',
          body: [
            {
              p: 'Web からアップロードするか、[既存の写真フォルダーのマウント](#library)の手順で NAS の写真を接続します。',
            },
          ],
        },
        {
          title: 'メンバーを追加',
          body: [
            {
              p: '「システム設定 → メンバー」でほかの利用者のアカウントを作成し、「メンバー」か「管理者」のロールを選びます。',
            },
          ],
        },
      ],
    },
    {
      h2: 'import',
    },
    {
      ul: [
        'Web アップロードは写真、動画、HEIC、RAW（DNG など）などの形式に対応し、複数選択も可能です。tus プロトコルで分割アップロードするため、回線が切れたりページを再読み込みしたりしても続きから再開できます。',
        'アップロードしたファイルはアップロード先ディレクトリ（初期値 data/upload）に年月ごとに保存されます。ディレクトリは「システム設定 → アップロード先」で変更でき、新しくアップロードするファイルにのみ適用されます。',
        '取り込み後は次の順に処理されます：メタデータの読み込み（ExifTool）→ サムネイルと 1440 ピクセルのプレビューの生成（libvips / FFmpeg）→ セマンティックベクトル、顔、文字の認識（AI サービス）→ 逆ジオコーディング。',
        'サイドバー上部のバックグラウンドタスク表示で、「写真の取り込み」と「AI による写真の認識」の進捗と残り時間の目安を写真の枚数単位で確認できます。',
      ],
    },
    {
      h2: 'browse',
    },
    {
      qa: [
        {
          q: 'ライブラリ',
          a: '月ごとにまとめた写真のタイムライン。上部に AI ピックアップのカルーセルと「あの日の今日」。',
        },
        {
          q: '自然言語検索',
          a: '「赤ちゃんの 3 歳の誕生日の写真」のような説明を入力すると、文字認識の結果、撮影場所、Chinese-CLIP の意味的な類似度を総合して並べ替えます。カテゴリ名を入力するとそのカテゴリをそのまま返します。',
        },
        {
          q: '人物',
          a: '顔を自動でクラスタリングし、3 枚以上の写真に写っている人を個別に表示します。名前を付ける、統合する、誕生日を設定するといった操作ができ、年齢ごとの成長、足跡、集合写真を見られます。',
        },
        {
          q: 'アルバム · スマートアルバム',
          a: 'アルバムは写真を手動で選び、プライベートにもできます。スマートアルバムは人物、場所、日時などの条件で自動的に写真を集めます。',
        },
        {
          q: '足跡',
          a: 'GPS をもとに撮影場所を地図上に表示します。地図、衛星、グリッドの 3 種類の表示に対応。',
        },
        {
          q: '連写の整理',
          a: '連写と類似写真を自動でグループ化し、最良の 1 枚を残すよう推奨します。「重複」には内容がまったく同じファイルを表示します。',
        },
        {
          q: 'スライドショー',
          a: 'ライブラリ、アルバム、人物、思い出を再生できます。縦向きの写真は 2〜3 枚を自動で 1 ページにまとめ、BGM とトランジションにも対応。',
        },
      ],
    },
    {
      h2: 'members-usage',
    },
    {
      table: ['ロール', '権限'],
      rows: [
        [
          '管理者',
          'メンバーの追加・削除、メンバーのパスワードのリセット、システム設定の変更。どの写真も削除できます。',
        ],
        [
          'メンバー',
          '写真のアップロード、閲覧、整理。削除できるのは自分がアップロードした写真だけで、システム設定は変更できません。',
        ],
        [
          'ゲスト',
          'ゲスト閲覧がオンのとき、ログインしていないユーザーが共有コンテンツを読み取り専用で閲覧できます。プライベートアルバムと非表示の写真は見えません。',
        ],
      ],
    },
    {
      p: '人物の情報（名前、統合関係）は全メンバーで共有されます。写真の枚数、人物のカバー写真、人物ページは各メンバーが見られる写真だけで計算され、非表示の写真は本人にしか見えません。',
    },
    {
      h2: 'settings-members',
    },
    {
      ul: [
        'メンバー：追加時に名前、初期パスワード（4 文字以上）、ロールを設定します。メンバーのパスワードのリセットやメンバーの削除もできます。',
        'ログイン履歴：ログインごとの日時、デバイス、IP を記録し、位置は IP からオフラインで推定します（ip2region）。直近半年分を保存し、閲覧できるのは管理者だけです。',
        '「マイアカウント」では、各メンバーが自分のパスワードとアバターを変更し、現在ログインしているデバイスを確認できます。',
      ],
    },
    {
      h2: 'settings-ai',
    },
    {
      table: ['設定項目', '選択肢', '説明'],
      rows: [
        [
          'AI の実行方式',
          '内蔵（CPU のみ）/ リモートサービス',
          'リモートサービスにはアドレスとトークンが必要で、切り替え前に接続を確認します。サービスが使えない間は AI 処理が一時停止します。',
        ],
        [
          '計算デバイス',
          '自動 / GPU / CPU のみ',
          '使える GPU がなければ CPU のみ選択可能。切り替えるとモデルを読み込み直し、処理中の AI ジョブは少し後に再開します。',
        ],
        [
          'モデルティア',
          '自動 / 高精度 / バランス / 軽量',
          '切り替えるとすべての写真を新しいモデルで処理し直し、再計算の進捗を表示します。',
        ],
        [
          'モデル管理',
          'ダウンロード / 削除',
          '各モデルのサイズと状態（使用中、ダウンロード済み、未ダウンロード）を一覧表示します。',
        ],
      ],
    },
    {
      h2: 'settings-perf',
    },
    {
      table: ['設定項目', '選択肢', '説明'],
      rows: [
        [
          '処理のタイミング',
          'アイドル時 / 常時 / 夜間',
          'アイドル時：アップロードとサムネイル作成のあいだ AI を止める。常時：処理し続ける（アップロードが遅くなることも）。夜間：設定した時間帯だけ。詳しくは [AI の処理タイミング](#ai-schedule)。',
        ],
        [
          'アップロード後の待ち時間',
          '30 秒〜4 時間',
          '写真のアップロード後、AI を始めるまで待つ時間。「アイドル時」と「夜間」で有効。',
        ],
        [
          '写真処理の並列数',
          '数値',
          '情報の読み込みとサムネイル生成を同時に行う写真の枚数。既定値は CPU コア数とメモリから算出します。',
        ],
        ['AI 処理の並列数', '数値', 'AI サービスに同時に送る写真の枚数。'],
        ['CPU スレッド数', '数値', '各モデルの推論に使う CPU スレッド数。'],
      ],
    },
    {
      p: 'カードの上部には AI の現在の状態（実行可能か、一時停止の理由）がリアルタイムに表示されます。変更はすぐに反映され、再起動は不要です。',
    },
    {
      h2: 'settings-general',
    },
    {
      table: ['設定項目', '初期値', '説明'],
      rows: [
        [
          'アップロード先',
          'data/upload',
          'アップロードしたファイルを年月ごとに保存します。変更は新しくアップロードするファイルにのみ適用されます。',
        ],
        [
          'ゲスト閲覧',
          'オン',
          'ログインしていないユーザーに共有コンテンツの閲覧を許可します。インターネットからアクセスする場合はオフを推奨します。',
        ],
        [
          'オンライン地図',
          'オン',
          '地図、地名、場所の検索を表示します。写真の位置情報が地図サービスに送られます。オフにすると座標のみ表示します。',
        ],
        [
          '地図の提供元',
          '自動',
          '自動：中国本土では高徳地図（AMap）、それ以外の地域では OpenStreetMap を使用。どちらかに固定することもできます。',
        ],
        ['アクセス用ドメイン', 'wanmory.local', 'LAN でのアクセス用ドメイン。.local で終わる必要があります。'],
      ],
    },
    {
      h2: 'settings-update',
    },
    {
      p: '「システム設定 → システム更新」には、バックエンドと AI サービスの現在のバージョンが表示され、新しいバージョンがあれば通知されます。更新するには `docker-compose.yml` のあるディレクトリで次を実行します：',
    },
    {
      code: 'docker compose pull && docker compose up -d',
      lang: 'bash',
    },
    {
      p: 'データベースのマイグレーションは server の起動時に自動で実行されます。`WANMORY_VERSION` でバージョンを固定している場合は、先に `.env` のタグを変更してください。',
    },
    {
      note: 'アップデートの詳しい手順は[アップデート](#update)を参照。',
    },
    {
      h2: 'update',
    },
    {
      p: '新しいバージョンが出ると「設定 → システムアップデート」に表示され、各バージョンの更新内容も読めます（公式サイトの[リリース](/releases/)でも確認できます）。アップデートで入れ替わるのはプログラムだけで、写真、データベース、設定、モデルはそのまま残ります。',
    },
    {
      steps: [
        {
          title: 'インストール先に移動',
          body: [
            {
              code: 'cd ~/wanmory   # あなたのインストール先（docker-compose.yml と .env がある場所）',
              lang: 'bash',
            },
          ],
        },
        {
          title: '新しいイメージを取得して再起動',
          body: [
            {
              code: `docker compose pull
docker compose up -d`,
              lang: 'bash',
            },
            {
              p: '起動時にデータベースの構造を自動で更新します。数秒〜1 分後にページを再読み込みしてください。',
            },
          ],
        },
        {
          title: '古いイメージを削除（任意）',
          body: [
            {
              code: 'docker image prune',
              lang: 'bash',
            },
          ],
        },
      ],
    },
    {
      note: '`.env` で `WANMORY_VERSION` を固定している場合は、先に新しいバージョン番号に変える（または行を消して最新版にする）から上のコマンドを実行してください。インストールスクリプトをもう一度実行して既存の設定を使う（`Keep the existing configuration` → Y）方法でも同じ結果になり、最新の `docker-compose.yml` もダウンロードされます。',
    },
    {
      h2: 'backup',
    },
    {
      p: 'バックアップが必要なデータは 3 種類です：',
    },
    {
      table: ['データ', '場所', '説明'],
      rows: [
        [
          'データベース',
          '名前付きボリューム pgdata',
          '写真のメタデータ、人物、アルバム、設定、ベクトル、ジョブキュー。',
        ],
        [
          'アップロードとサムネイル',
          './data',
          'アップロードした原本（data/upload）とサムネイル（data/thumbs）。サムネイルは再生成できます。',
        ],
        [
          '写真フォルダー',
          '/photos にマウントしたフォルダー',
          'NAS 自体のバックアップ計画で保護してください。読み取り専用でマウントしたフォルダーをアプリが変更することはありません。',
        ],
      ],
    },
    {
      lang: 'bash',
      code: `# データベースをエクスポート
docker compose exec -T postgres pg_dump -U wanmory -Fc wanmory > wanmory-$(date +%F).dump

# 新しい環境に復元（先に docker compose up -d postgres を実行）
docker compose exec -T postgres pg_restore -U wanmory -d wanmory --clean < wanmory-2026-11-10.dump`,
    },
    {
      note: './models のモデルファイルはバックアップ不要です。Web から再ダウンロードできます。',
    },
    {
      h2: 'reset-password',
    },
    {
      p: 'メンバーがパスワードを忘れた場合は、管理者が「システム設定 → メンバー」でリセットします。管理者自身がパスワードを忘れた場合は、アプリを動かしているホスト上で、`docker-compose.yml` のあるディレクトリで次を実行します：',
    },
    {
      lang: 'bash',
      code: `docker compose exec server wanmory reset-password            # アカウントを一覧表示して選択
docker compose exec server wanmory reset-password <名前>     # アカウントを直接指定`,
    },
    {
      ul: [
        'コマンドはすべてのアカウント（名前、ロール、作成日時、最終ログイン）を一覧表示します。番号で選び、新しいパスワードを 2 回入力します。',
        'リセット後、そのアカウントはすべてのデバイスでログアウトされます。写真とアルバムには影響しません。',
        'この操作はホスト上でのみ実行でき、Web には入口がありません。Docker を使っていない場合は、実行時と同じ DATABASE_URL などの環境変数を付けて wanmory reset-password を実行します。',
      ],
    },
    {
      h2: 'troubleshooting',
    },
    {
      qa: [
        {
          q: 'wanmory.local でアクセスできない',
          a: 'mdns サービスが動いているか確認します（docker compose ps）。一部の Android 端末は mDNS 非対応なので IP を使います。ホストの 5353 番ポートが使われていないか確認します。',
        },
        {
          q: 'AI 設定に「接続できません。AI 処理を一時停止しました」と表示される',
          a: '内蔵モードなら ml コンテナのログ（docker compose logs ml）を確認します。リモートモードならアドレス、ポート、ファイアウォール、トークンが一致しているか確認します。',
        },
        {
          q: '人物や検索で結果が出ない',
          a: 'モデルがダウンロード済みか確認します。「パフォーマンス」で処理のタイミングの設定により AI が一時停止していないか、タスク表示で AI 認識の進捗を確認します。',
        },
        {
          q: '大きなファイルのアップロードに失敗する',
          a: 'リバースプロキシのリクエストボディの上限が小さすぎます。「リバースプロキシとインターネット公開」を参考に client_max_body_size を調整します。',
        },
        {
          q: 'マウントしたフォルダーの写真が表示されない',
          a: 'フォルダーは /photos 配下のサブディレクトリにマウントする必要があります。最初のスキャンは起動から約 20 秒後、その後は 15 分ごとです。隠しフォルダーはスキップされます。',
        },
        {
          q: 'イメージの取得が遅い、または失敗する',
          a: '.env の WANMORY_REGISTRY に、アクセスできるレジストリのアドレスを設定します。',
        },
      ],
    },
    {
      p: '各サービスのログは `docker compose logs -f server`、`docker compose logs -f ml` で確認できます。それでも解決しない場合は、バージョン番号と関連するログを添えて[問題を報告](/feedback/)ページからお知らせください。',
    },
    {
      h2: 'uninstall',
    },
    {
      p: 'Wanmory を動かしているコンピューターで実行します：',
    },
    {
      code: 'curl -fsSL https://wanmory.com/uninstall.sh | bash',
      lang: 'bash',
    },
    {
      p: '既定ではコンテナだけを削除し、データはすべて残します。何を削除するかは 1 項目ずつ聞かれ、Enter はいつも「残す」（N）です。マウントした既存の写真フォルダー（NAS、外付けドライブ）はどんな場合も削除しません。',
    },
    {
      steps: [
        {
          title: 'Locating installation（インストール先の確認）',
          body: [
            {
              p: '`Install directory` を聞きます。Enter で ~/wanmory。Wanmory の `docker-compose.yml` がなければ終了します。続いてコンテナ数、データベースの場所、データと AI モデルのディレクトリとサイズ、マウントした写真フォルダー（`never deleted` と表示）を一覧にします。',
            },
          ],
        },
        {
          title: 'Choose what to remove（削除する項目の選択）',
          body: [
            {
              p: 'コンテナとネットワークは常に削除します。以下は 1 項目ずつ聞かれます：',
            },
            {
              qa: [
                {
                  q: '`Delete the database`',
                  a: 'データベース（Docker ボリューム pgdata、または `WANMORY_DB_DIR` のディレクトリ）：人物、アルバム、設定、AI の結果、アカウント。元に戻せません。',
                },
                {
                  q: '`Delete the data directory`',
                  a: 'データディレクトリ：サムネイルと **Web からアップロードした元の写真**。',
                },
                {
                  q: '`Delete the AI models`',
                  a: 'AI モデルのディレクトリ。再インストール後に再ダウンロードできます。',
                },
                {
                  q: '`Remove the Docker images`',
                  a: 'Wanmory が使う Docker イメージ（postgres/pgvector を含む）。再取得できます。',
                },
                {
                  q: '`Delete the configuration files`',
                  a: '`.env`（データベースのパスワード入り）、`docker-compose.yml`、`docker-compose.override.yml`。空になったインストール先も削除します。',
                },
              ],
            },
          ],
        },
        {
          title: 'Summary（確認）',
          body: [
            {
              p: '実行内容を一覧にします。データベースかデータディレクトリの削除を選んだ場合は、大文字で `DELETE` と入力しないと続行しません。それ以外の入力なら何も変えずに中止。ほかの項目だけなら `Proceed` を 1 回聞きます。データベースを残して `.env` を消す場合は、先に `WANMORY_DB_PASSWORD` を控えるよう注意します。',
            },
          ],
        },
        {
          title: 'Removing（削除の実行）',
          body: [
            {
              p: 'コンテナを止めて削除し、選んだ項目を削除します。コンテナが書いたファイルは別のユーザーのもの（古いバージョンは uid 1000 や root で書き込み）の場合があり、通常の rm で消せないときは root で動く一時コンテナを使って削除します。それでも消せなければ `sudo rm -rf` で手動削除するよう案内します。/、/home、/volume1、ホームディレクトリなど明らかに Wanmory のものでないパスは削除しません。',
            },
          ],
        },
      ],
    },
    {
      p: 'コンテナだけを削除してデータと設定を残した場合は、同じディレクトリで install.sh を再実行すればすべて元に戻ります。',
    },
    {
      table: ['オプション', '働き'],
      rows: [
        ['`--dir ディレクトリ`', 'インストール先。既定は ~/wanmory（`WANMORY_DIR` でも可）。'],
        [
          '`-y`、`--yes`',
          '質問なし：コンテナとネットワークだけ削除し、データと設定はすべて残します。対話できる端末がないときもこの動作です。',
        ],
        [
          '`--purge`',
          '質問なし：上の表の項目をすべて削除（写真フォルダーを除く）。DELETE の入力も不要なので注意して使ってください。',
        ],
        ['`--dry-run`', '何をするかを表示するだけで、何も変更しません。'],
        ['`-h`、`--help`', 'ヘルプを表示。'],
      ],
    },
  ],
}

export default docs
