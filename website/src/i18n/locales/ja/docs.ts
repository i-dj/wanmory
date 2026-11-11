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
    'このドキュメントは、NAS、家庭用サーバー、個人の PC で Wanmory をセルフホストする管理者向けです。インストール、設定、AI サービスの導入、日常の使い方、システム設定、運用までを扱います。システム構成とアルゴリズムの詳細は[アーキテクチャ](/architecture/)をご覧ください。',
  blocks: [
    { h2: 'intro' },
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

    { h2: 'requirements' },
    {
      table: ['項目', '最低', '推奨'],
      rows: [
        ['CPU アーキテクチャ', 'x86_64（amd64）または ARM64', '—'],
        ['プロセッサ', 'Intel N100 / Raspberry Pi 5 クラス', 'Intel i5 クラス以上、または GPU 搭載マシンへの分離配置'],
        ['メモリ', '4 GB（「軽量」ティアを自動選択）', '8 GB 以上（「バランス」ティア）'],
        ['ディスク', 'モデルに約 1〜4 GB、加えてサムネイル用の容量', 'data/ とデータベースのボリュームは SSD に'],
        ['ソフトウェア', 'Docker Engine と Docker Compose v2', '—'],
        ['OS', 'Docker が動く任意の Linux ディストリビューション', 'Synology DSM、QNAP QTS、TrueNAS SCALE、Unraid、Ubuntu / Debian'],
      ],
    },
    {
      note: 'イメージは `linux/amd64` と `linux/arm64` の両方を提供しており、Docker が現在のアーキテクチャに合うものを自動で取得します。macOS 上の Docker コンテナは Apple の GPU を使えないため、Mac でハードウェアアクセラレーションを使う場合は[AI サービスの分離運用](#ai-remote)を参照してください。',
    },

    { h2: 'quick-start' },
    { h3: '方法 1：インストールスクリプト（推奨）' },
    { p: 'Docker をインストール済みの 64 ビットマシンで実行します：' },
    { code: 'curl -fsSL https://wanmory.com/install.sh | bash', lang: 'bash' },
    { p: 'スクリプトは次の作業を順に行います：' },
    {
      ul: [
        '環境チェック：CPU アーキテクチャ（amd64 / arm64）と 64 ビットのユーザー空間、Docker と Docker Compose v2 が使えるか、メモリとディスクの空き容量。',
        '対話式の設定：インストール先（初期値 ~/wanmory）、アクセス用ポート（初期値 8080、使用中かを自動確認）、LAN ドメイン（初期値 wanmory.local）、データベースのパスワード（初期値はランダム生成）と保存場所（初期値は Docker ボリューム pgdata、ローカルディスク上のディレクトリも指定可）、タイムゾーン（都市名や地域名を入力して検索。shanghai、tokyo、北京 など。複数一致したら番号で選択）。',
        '保存場所：データディレクトリ（サムネイル、プレビュー、アップロードした写真。初期値 ./data）、AI モデルディレクトリ（初期値 ./models）。',
        'スクリプトの案内と出力は英語です。さまざまな NAS の端末で正しく表示できるようにするためです。',
        '既存の写真フォルダー：複数のフォルダーを 1 つずつ追加でき、フォルダーごとに読み取り専用（推奨）か読み書き可能なマウントかを選べます。',
        '`.env`（パーミッション 600）を作成します。写真フォルダーを指定した場合は `docker-compose.override.yml` も作成し、Docker Compose がこれを自動でマージします。',
        '公式の docker-compose.yml をダウンロードし（GitHub に接続できない場合は自動で Gitee を使用）、設定を検証してからイメージを取得・起動し、サービスの準備が整うとアクセス先を表示します。',
      ],
    },
    {
      table: ['オプション / 変数', '説明'],
      rows: [
        ['`-y`', '質問せずすべて初期値を使用（データベースのパスワードはランダム生成）。自動化された導入向け。'],
        ['`--dir ディレクトリ`', 'インストール先を指定します。'],
        ['`--dry-run`', '環境のチェックと設定ファイルの作成だけを行い、イメージの取得や起動はしません。'],
        [
          '`WANMORY_PORT`',
          'ポートなどの設定を事前に指定。同様に WANMORY_DOMAIN、WANMORY_DB_PASSWORD、WANMORY_TZ、WANMORY_DATA_DIR、WANMORY_MODELS_DIR、WANMORY_DB_DIR、WANMORY_REGISTRY、WANMORY_VERSION も使えます。',
        ],
        ['`WANMORY_PHOTOS`', '写真フォルダー。複数はカンマ区切りで、初期値は読み取り専用マウント。パスの後ろに :rw を付けると読み書き可能になります（例：/volume1/photo,/mnt/usb:rw）。'],
      ],
    },
    {
      code: `# 例：/opt/wanmory に非対話でインストールし、ポート 9000 を使い、NAS の写真フォルダーをマウント
curl -fsSL https://wanmory.com/install.sh | WANMORY_PORT=9000 WANMORY_PHOTOS=/volume1/photo,/volume2/family bash -s -- -y --dir /opt/wanmory`,
      lang: 'bash',
    },
    {
      note: 'スクリプトを再実行したとき、インストール先にすでに .env があれば、初期設定では既存の設定をそのまま使い（データベースのパスワードは初回起動後に自由には変更できません）、Compose ファイルだけを更新して再起動します。アップグレードにも使えます。',
    },
    { h3: '方法 2：手動インストール' },
    {
      steps: [
        {
          title: '導入用ディレクトリを作成し、Compose ファイルを取得',
          body: [
            { p: 'Compose ファイル、データ、モデルを置くディレクトリを作成し、公式の `docker-compose.yml` をダウンロードします：' },
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
            { p: '同じディレクトリに `.env` を作成して初期値を上書きします。本番環境では必ずデータベースのパスワードを変更してください：' },
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
            { p: '初回起動時はイメージを取得し、データベースのマイグレーションを自動で実行します：' },
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

    { h2: 'compose' },
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

    { h2: 'env' },
    { h3: '.env（Compose の変数）' },
    { p: '次の変数は `docker-compose.yml` から参照されます。同じディレクトリの `.env` に書けば反映されます：' },
    {
      table: ['変数', '初期値', '説明'],
      rows: [
        ['`WANMORY_DB_PASSWORD`', 'wanmory', 'PostgreSQL のパスワード。server の DATABASE_URL にも使われます。初回起動後に変更する場合は、データベース内のユーザーのパスワードも合わせて変更する必要があります。'],
        ['`WANMORY_PORT`', '8080', 'ホスト側の公開ポート。Web 上に表示するアクセス先にも使われます。'],
        ['`WANMORY_TZ`', 'Asia/Shanghai', 'EXIF にタイムゾーン情報がない場合に使うタイムゾーン。'],
        ['`WANMORY_VERSION`', 'latest', 'イメージのタグ。特定のバージョンに固定すればアップグレードの時期を管理できます。'],
        ['`WANMORY_REGISTRY`', 'ghcr.io/i-dj', 'イメージのレジストリ。ghcr.io にアクセスできない場合は利用可能なレジストリに置き換えます。'],
        ['`WANMORY_DATA_DIR`', './data', 'データディレクトリ：アップロードした原本（upload/）とサムネイル・プレビュー（thumbs/）。コンテナの /data にマウントされます。'],
        ['`WANMORY_MODELS_DIR`', './models', 'AI モデルのディレクトリ。ml コンテナの /models にマウントされます。'],
        [
          '`WANMORY_DB_DIR`',
          'ボリューム pgdata',
          'データベースのディレクトリ。未設定なら Docker ボリューム pgdata を使用し、ローカルディスク上のディレクトリのパスを指定するとそこに直接保存します。ネットワーク共有フォルダーは使わないでください。',
        ],
        ['`WANMORY_DOMAIN`', 'wanmory.local', 'LAN ドメインの初期値。.local で終わる必要があります。Web の「システム設定 → アクセス用ドメイン」で変更した後はそちらが優先されます。'],
      ],
    },
    { h3: 'server コンテナ（任意）' },
    {
      p: '`DATABASE_URL`、`WANMORY_ML_URL`、`WANMORY_MDNS`、`WANMORY_HTTP_PUBLIC_PORT` は Compose ファイルで設定済みで、用途も記載しています。次の変数は既定の Compose ファイルには含まれていないため、必要に応じて `server` の `environment` に追加します：',
    },
    {
      table: ['変数', '初期値', '説明'],
      rows: [
        ['`WANMORY_WORKERS`', '自動', 'メタデータとサムネイルのジョブの既定の並列数。未設定なら CPU コア数とメモリから自動計算し、Web の「パフォーマンス」で調整できます。'],
        ['`WANMORY_ML_TOKEN`', '空', '内蔵 AI サービスのアクセストークン。ml コンテナの同名の変数と一致させる必要があります。通常は設定不要です。'],
        ['`WANMORY_FACE_MODEL`', 'antelopev2', 'モデルティアを選んでいないときに使う顔認識モデル。'],
        ['`WANMORY_CLIP_MODEL`', 'chinese-clip-vit-h-14', 'モデルティアを選んでいないときに使うセマンティック検索モデル。'],
        ['`WANMORY_STORAGE_ROOTS`', 'データディレクトリ', 'Web で閲覧・選択できるディレクトリの範囲。複数はコロン区切り。'],
      ],
    },

    { h2: 'library' },
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
    { p: '変更後に `docker compose up -d` を実行すると、コンテナの再起動から約 20 秒後に最初のスキャンが始まります。' },
    {
      ul: [
        '**読み取り専用マウント（:ro）を推奨**：システムはこれらのフォルダーに書き込みません。アプリで写真を削除しても「最近削除」に移るだけで、完全に削除しても原本ファイルは消えず、その後のスキャンで再び取り込まれることもありません。読み書き可能なフォルダーでは、完全に削除すると原本ファイルも削除されます。',
        '内容がまったく同じファイルは 1 つだけ取り込みます（SHA-1 チェックサムで判定）。すでにアップロード済みのファイルや、複数のフォルダー間の重複も含みます。',
        '隠しフォルダーや NAS のシステムフォルダー（.xxx、@eaDir、#recycle など）は自動でスキップします。',
        '写真フォルダーから取り込んだ写真はどのメンバーにも属さず、削除できるのは管理者だけです。',
      ],
    },

    { h2: 'mdns' },
    {
      p: '`mdns` サービスはホストネットワークモードで動作し、LAN 内にアクセス用ドメイン（初期値 `wanmory.local`）を告知します。macOS、iOS、iPadOS、Windows 10 以降なら、ルーターの設定なしで `http://wanmory.local:8080` にアクセスできます。ドメインは「システム設定 → アクセス用ドメイン」で変更でき、`.local` で終わる必要があります。',
    },
    {
      note: '一部の Android 端末は mDNS の名前解決に対応していないため、IP アドレスでアクセスしてください。Synology などで 5353 番ポートがすでに使われていると mdns サービスが起動できない場合がありますが、その場合も IP でアクセスすれば問題なく、ほかの機能には影響しません。',
      warn: true,
    },

    { h2: 'proxy' },
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

    { h2: 'ai-overview' },
    {
      p: 'AI サービスはステートレスな HTTP サービスです。バックエンドから送られる 1440 ピクセルのプレビューを受け取り、顔、ベクトル、文字認識の結果を返します。データベースにはアクセスせず、ファイルも保存しません。バックエンドは 2 つの実行方式に対応しており、「システム設定 → AI 設定 → AI の実行方式」で切り替えます：',
    },
    {
      table: ['方式', '配置場所', '向いている用途'],
      rows: [
        ['内蔵（CPU のみ）', 'Compose 内の ml コンテナ、内部ネットワークからのみ到達可能', 'すぐに使える。NAS やミニ PC で写真が多くない場合、または初回処理に時間がかかっても構わない場合'],
        ['リモートサービス', 'LAN 内の別のマシンで Python サービスを直接実行', 'Apple シリコン Mac（CoreML / MPS）や NVIDIA GPU 搭載マシン（CUDA）で、初回処理の時間を大幅に短縮'],
      ],
    },
    { p: 'AI サービスが使えないときは、AI ジョブはキューに残ったまま取得が止まり、再試行回数は消費されません。サービスが復旧すると自動で再開します。写真の閲覧やアップロードなどの機能には影響しません。' },

    { h2: 'ai-remote' },
    { h3: '方法 1：Mac または GPU マシンで直接実行（推奨）' },
    {
      p: '直接実行するとハードウェアアクセラレーションが使えます。Apple シリコンでは顔認識モデルが CoreML、Chinese-CLIP が MPS を使い、NVIDIA GPU では Chinese-CLIP が CUDA を使って半精度で動作します（VRAM / メモリ約 1.9 GB）。事前に [uv](https://docs.astral.sh/uv/) をインストールしてください。',
    },
    {
      lang: 'bash',
      code: `git clone https://github.com/i-dj/wanmory.git
cd wanmory/ml
uv sync --extra torch                 # PyTorch 版の依存関係をインストール（GPU でセマンティック検索を高速化）

# アクセストークンを生成。バックエンドと AI サービスで同じ値を使う
export WANMORY_ML_TOKEN=$(openssl rand -hex 24)
echo $WANMORY_ML_TOKEN

WANMORY_FACE_MODEL_PRELOAD=1 uv run --extra torch python -m wanmory_ml
# 既定では 0.0.0.0:3003 で待ち受け。WANMORY_ML_HOST / WANMORY_ML_PORT で変更可`,
    },
    { h3: '方法 2：別のマシンで Docker イメージを実行' },
    { p: '性能は高いものの使える GPU がない x86 マシン向けです。イメージは CPU のみを使います：' },
    {
      lang: 'bash',
      code: `docker run -d --name wanmory-ml --restart unless-stopped \\
  -p 3003:3003 \\
  -e WANMORY_ML_TOKEN=<アクセストークン> \\
  -v $PWD/models:/models \\
  ghcr.io/i-dj/wanmory-ml:latest`,
    },
    { h3: 'バックエンドでリモートサービスを有効にする' },
    {
      steps: [
        { title: 'AI 設定を開く', body: [{ p: '管理者として「システム設定 → AI 設定 → AI の実行方式」を開き、「リモートサービス」を選びます。' }] },
        {
          title: 'アドレスとトークンを入力',
          body: [{ p: 'アドレスは `http://192.168.1.20:3003` のような形式で、トークンには前の手順で生成した値を入力します。保存前に接続テストが行われ、遅延とサービスのバージョンが表示されます。' }],
        },
        { title: 'ティアとモデルを確認', body: [{ p: '接続に成功すると、ティアが「自動」の場合はリモートマシンのハードウェアに基づいて推奨し直されます。「モデルティア」で必要なモデルをダウンロードします。' }] },
      ],
    },
    { note: 'リモート AI サービスへのアクセスは LAN 内または VPN（Tailscale など）に限定し、必ずトークンを設定してください。インターネット越しに接続する場合は HTTPS のリバースプロキシを経由してください。', warn: true },

    { h2: 'ai-models' },
    {
      p: 'ティアによって、顔認識とセマンティック検索に使うモデルの組み合わせが決まります。「自動」を選ぶと、AI サービスが動くマシンのハードウェアから推奨します。使える GPU があれば「高精度」、CPU のみでメモリが 6 GB 未満なら「軽量」、それ以外は「バランス」です。',
    },
    {
      table: ['ティア', '顔検出 + 特徴量', 'セマンティック検索', '適したハードウェア'],
      rows: [
        ['高精度 quality', 'antelopev2（SCRFD-10G + ArcFace R100）', 'Chinese-CLIP ViT-H/14（1024 次元）', 'Apple シリコン Mac、NVIDIA GPU'],
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

    { h2: 'ai-env' },
    {
      table: ['変数', '初期値', '説明'],
      rows: [
        ['`WANMORY_ML_HOST`', '0.0.0.0', '待ち受けアドレス。'],
        ['`WANMORY_ML_PORT`', '3003', '待ち受けポート。'],
        ['`WANMORY_ML_TOKEN`', '空', 'アクセストークン。設定するとすべてのリクエストに Authorization: Bearer が必要になります。'],
        ['`WANMORY_MODEL_DIR`', '~/.cache/wanmory/models', 'モデルの保存先。イメージ内では /models。'],
        ['`WANMORY_AUTO_DOWNLOAD`', 'イメージ内では 0', '初回使用時にモデルを自動でダウンロードするかどうか。'],
        ['`WANMORY_FACE_MODEL_PRELOAD`', '—', '1 にすると起動時に顔認識モデルを読み込み、Chinese-CLIP はバックグラウンドで読み込みます。'],
        ['`WANMORY_UNLOAD_AFTER`', '5 / 30 分', 'モデルが何秒間使われなければメモリ解放のためにアンロードするか。0 ならアンロードしません。既定値はホストのメモリ量で決まります。'],
      ],
    },

    { h2: 'first-run' },
    {
      steps: [
        { title: '管理者を作成', body: [{ p: '初回アクセス時にアカウントがまだないことを検出し、管理者の作成を案内します。管理者はメンバーの追加やシステム設定の変更ができます。' }] },
        { title: 'モデルをダウンロード', body: [{ p: '「システム設定 → AI 設定」でモデルティアを確認し、モデルをダウンロードします。モデルの準備ができるまで、AI ジョブはキューで待機します。' }] },
        { title: '写真を取り込む', body: [{ p: 'Web からアップロードするか、[既存の写真フォルダーのマウント](#library)の手順で NAS の写真を接続します。' }] },
        { title: 'メンバーを追加', body: [{ p: '「システム設定 → メンバー」でほかの利用者のアカウントを作成し、「メンバー」か「管理者」のロールを選びます。' }] },
      ],
    },

    { h2: 'import' },
    {
      ul: [
        'Web アップロードは写真、動画、HEIC、RAW（DNG など）などの形式に対応し、複数選択も可能です。tus プロトコルで分割アップロードするため、回線が切れたりページを再読み込みしたりしても続きから再開できます。',
        'アップロードしたファイルはアップロード先ディレクトリ（初期値 data/upload）に年月ごとに保存されます。ディレクトリは「システム設定 → アップロード先」で変更でき、新しくアップロードするファイルにのみ適用されます。',
        '取り込み後は次の順に処理されます：メタデータの読み込み（ExifTool）→ サムネイルと 1440 ピクセルのプレビューの生成（libvips / FFmpeg）→ セマンティックベクトル、顔、文字の認識（AI サービス）→ 逆ジオコーディング。',
        'サイドバー上部のバックグラウンドタスク表示で、「写真の取り込み」と「AI による写真の認識」の進捗と残り時間の目安を写真の枚数単位で確認できます。',
      ],
    },

    { h2: 'browse' },
    {
      table: ['機能', '説明'],
      rows: [
        ['ライブラリ', '月ごとにまとめた写真のタイムライン。上部に AI ピックアップのカルーセルと「あの日の今日」。'],
        ['自然言語検索', '「赤ちゃんの 3 歳の誕生日の写真」のような説明を入力すると、文字認識の結果、撮影場所、Chinese-CLIP の意味的な類似度を総合して並べ替えます。カテゴリ名を入力するとそのカテゴリをそのまま返します。'],
        ['人物', '顔を自動でクラスタリングし、3 枚以上の写真に写っている人を個別に表示します。名前を付ける、統合する、誕生日を設定するといった操作ができ、年齢ごとの成長、足跡、集合写真を見られます。'],
        ['アルバム · スマートアルバム', 'アルバムは写真を手動で選び、プライベートにもできます。スマートアルバムは人物、場所、日時などの条件で自動的に写真を集めます。'],
        ['足跡', 'GPS をもとに撮影場所を地図上に表示します。地図、衛星、グリッドの 3 種類の表示に対応。'],
        ['連写の整理', '連写と類似写真を自動でグループ化し、最良の 1 枚を残すよう推奨します。「重複」には内容がまったく同じファイルを表示します。'],
        ['スライドショー', 'ライブラリ、アルバム、人物、思い出を再生できます。縦向きの写真は 2〜3 枚を自動で 1 ページにまとめ、BGM とトランジションにも対応。'],
      ],
    },

    { h2: 'members-usage' },
    {
      table: ['ロール', '権限'],
      rows: [
        ['管理者', 'メンバーの追加・削除、メンバーのパスワードのリセット、システム設定の変更。どの写真も削除できます。'],
        ['メンバー', '写真のアップロード、閲覧、整理。削除できるのは自分がアップロードした写真だけで、システム設定は変更できません。'],
        ['ゲスト', 'ゲスト閲覧がオンのとき、ログインしていないユーザーが共有コンテンツを読み取り専用で閲覧できます。プライベートアルバムと非表示の写真は見えません。'],
      ],
    },
    { p: '人物の情報（名前、統合関係）は全メンバーで共有されます。写真の枚数、人物のカバー写真、人物ページは各メンバーが見られる写真だけで計算され、非表示の写真は本人にしか見えません。' },

    { h2: 'settings-members' },
    {
      ul: [
        'メンバー：追加時に名前、初期パスワード（4 文字以上）、ロールを設定します。メンバーのパスワードのリセットやメンバーの削除もできます。',
        'ログイン履歴：ログインごとの日時、デバイス、IP を記録し、位置は IP からオフラインで推定します（ip2region）。直近半年分を保存し、閲覧できるのは管理者だけです。',
        '「マイアカウント」では、各メンバーが自分のパスワードとアバターを変更し、現在ログインしているデバイスを確認できます。',
      ],
    },

    { h2: 'settings-ai' },
    {
      table: ['設定項目', '選択肢', '説明'],
      rows: [
        ['AI の実行方式', '内蔵（CPU のみ）/ リモートサービス', 'リモートサービスにはアドレスとトークンが必要で、切り替え前に接続を確認します。サービスが使えない間は AI 処理が一時停止します。'],
        ['計算デバイス', '自動 / GPU / CPU のみ', '使える GPU がなければ CPU のみ選択可能。切り替えるとモデルを読み込み直し、処理中の AI ジョブは少し後に再開します。'],
        ['モデルティア', '自動 / 高精度 / バランス / 軽量', '切り替えるとすべての写真を新しいモデルで処理し直し、再計算の進捗を表示します。'],
        ['モデル管理', 'ダウンロード / 削除', '各モデルのサイズと状態（使用中、ダウンロード済み、未ダウンロード）を一覧表示します。'],
      ],
    },

    { h2: 'settings-perf' },
    {
      table: ['設定項目', '選択肢', '説明'],
      rows: [
        ['処理のタイミング', 'アイドル時 / 常時 / 夜間', 'アイドル時：アップロードとサムネイル生成の間は AI 処理を一時停止。常時：処理を続けるため、アップロードが遅くなることがあります。夜間：設定した時間帯にのみ処理。'],
        ['写真処理の並列数', '数値', '情報の読み込みとサムネイル生成を同時に行う写真の枚数。既定値は CPU コア数とメモリから算出します。'],
        ['AI 処理の並列数', '数値', 'AI サービスに同時に送る写真の枚数。'],
        ['CPU スレッド数', '数値', '各モデルの推論に使う CPU スレッド数。'],
      ],
    },
    { p: 'カードの上部には AI の現在の状態（実行可能か、一時停止の理由）がリアルタイムに表示されます。変更はすぐに反映され、再起動は不要です。' },

    { h2: 'settings-general' },
    {
      table: ['設定項目', '初期値', '説明'],
      rows: [
        ['アップロード先', 'data/upload', 'アップロードしたファイルを年月ごとに保存します。変更は新しくアップロードするファイルにのみ適用されます。'],
        ['ゲスト閲覧', 'オン', 'ログインしていないユーザーに共有コンテンツの閲覧を許可します。インターネットからアクセスする場合はオフを推奨します。'],
        ['オンライン地図', 'オン', '地図、地名、場所の検索を表示します。写真の位置情報が地図サービスに送られます。オフにすると座標のみ表示します。'],
        ['地図の提供元', '自動', '自動：中国本土では高徳地図（AMap）、それ以外の地域では OpenStreetMap を使用。どちらかに固定することもできます。'],
        ['アクセス用ドメイン', 'wanmory.local', 'LAN でのアクセス用ドメイン。.local で終わる必要があります。'],
      ],
    },

    { h2: 'settings-update' },
    { p: '「システム設定 → システム更新」には、バックエンドと AI サービスの現在のバージョンが表示され、新しいバージョンがあれば通知されます。更新するには `docker-compose.yml` のあるディレクトリで次を実行します：' },
    { code: 'docker compose pull && docker compose up -d', lang: 'bash' },
    { p: 'データベースのマイグレーションは server の起動時に自動で実行されます。`WANMORY_VERSION` でバージョンを固定している場合は、先に `.env` のタグを変更してください。' },

    { h2: 'backup' },
    { p: 'バックアップが必要なデータは 3 種類です：' },
    {
      table: ['データ', '場所', '説明'],
      rows: [
        ['データベース', '名前付きボリューム pgdata', '写真のメタデータ、人物、アルバム、設定、ベクトル、ジョブキュー。'],
        ['アップロードとサムネイル', './data', 'アップロードした原本（data/upload）とサムネイル（data/thumbs）。サムネイルは再生成できます。'],
        ['写真フォルダー', '/photos にマウントしたフォルダー', 'NAS 自体のバックアップ計画で保護してください。読み取り専用でマウントしたフォルダーをアプリが変更することはありません。'],
      ],
    },
    {
      lang: 'bash',
      code: `# データベースをエクスポート
docker compose exec -T postgres pg_dump -U wanmory -Fc wanmory > wanmory-$(date +%F).dump

# 新しい環境に復元（先に docker compose up -d postgres を実行）
docker compose exec -T postgres pg_restore -U wanmory -d wanmory --clean < wanmory-2026-11-10.dump`,
    },
    { note: './models のモデルファイルはバックアップ不要です。Web から再ダウンロードできます。' },

    { h2: 'reset-password' },
    { p: 'メンバーがパスワードを忘れた場合は、管理者が「システム設定 → メンバー」でリセットします。管理者自身がパスワードを忘れた場合は、アプリを動かしているホスト上で、`docker-compose.yml` のあるディレクトリで次を実行します：' },
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

    { h2: 'troubleshooting' },
    {
      table: ['症状', '確認すること'],
      rows: [
        ['wanmory.local でアクセスできない', 'mdns サービスが動いているか確認します（docker compose ps）。一部の Android 端末は mDNS 非対応なので IP を使います。ホストの 5353 番ポートが使われていないか確認します。'],
        ['AI 設定に「接続できません。AI 処理を一時停止しました」と表示される', '内蔵モードなら ml コンテナのログ（docker compose logs ml）を確認します。リモートモードならアドレス、ポート、ファイアウォール、トークンが一致しているか確認します。'],
        ['人物や検索で結果が出ない', 'モデルがダウンロード済みか確認します。「パフォーマンス」で処理のタイミングの設定により AI が一時停止していないか、タスク表示で AI 認識の進捗を確認します。'],
        ['大きなファイルのアップロードに失敗する', 'リバースプロキシのリクエストボディの上限が小さすぎます。「リバースプロキシとインターネット公開」を参考に client_max_body_size を調整します。'],
        ['マウントしたフォルダーの写真が表示されない', 'フォルダーは /photos 配下のサブディレクトリにマウントする必要があります。最初のスキャンは起動から約 20 秒後、その後は 15 分ごとです。隠しフォルダーはスキップされます。'],
        ['イメージの取得が遅い、または失敗する', '.env の WANMORY_REGISTRY に、アクセスできるレジストリのアドレスを設定します。'],
      ],
    },
    {
      p: '各サービスのログは `docker compose logs -f server`、`docker compose logs -f ml` で確認できます。それでも解決しない場合は、バージョン番号と関連するログを添えて[問題を報告](/feedback/)ページからお知らせください。',
    },

    { h2: 'uninstall' },
    { p: 'Wanmory を動かしているホストでアンインストールスクリプトを実行します：' },
    { code: 'curl -fsSL https://wanmory.com/uninstall.sh | bash', lang: 'bash' },
    {
      p: 'スクリプトはまずインストール先の .env を読み込み、コンテナ、データベース、データディレクトリ、AI モデルとその使用容量、マウントしている写真フォルダーを一覧表示します。続いてコンテナとネットワークを停止・削除し、各項目について削除するかを 1 つずつ確認します（すべて初期値は残す）：',
    },
    {
      table: ['項目', '説明'],
      rows: [
        ['データベース', 'Docker ボリューム pgdata、または WANMORY_DB_DIR で指定したディレクトリ。削除すると人物、アルバム、設定、AI の結果は復元できません。'],
        ['データディレクトリ', 'サムネイル、プレビュー、Web からアップロードした元の写真。'],
        ['AI モデル', '再インストール後に Web から再びダウンロードできます。'],
        ['Docker イメージ', 'postgres/pgvector のイメージを含みます。再取得できます。ほかのコンテナで使われているイメージは削除しません。'],
        ['設定ファイル', '.env（データベースのパスワードを含む）、docker-compose.yml、docker-compose.override.yml。ディレクトリが空になればディレクトリごと削除します。'],
      ],
    },
    {
      ul: [
        'マウントしている既存の写真フォルダー（NAS、外付けドライブ）は決して削除しません。',
        'データベースまたはデータディレクトリの削除を選ぶと、確認のため DELETE の入力を求められます。',
        'コンテナだけを削除してデータを残した場合は、同じディレクトリで install.sh を再実行すればすべて元どおりになります。.env を削除してデータベースを残す場合は、先に中の WANMORY_DB_PASSWORD を控えておいてください。',
      ],
    },
    {
      table: ['オプション', '説明'],
      rows: [
        ['`--dir ディレクトリ`', 'インストール先を指定します。初期値は ~/wanmory。'],
        ['`-y`', '非対話：コンテナとネットワークだけを削除し、データと設定はすべて残します。'],
        ['`--purge`', '非対話：上の表の項目をすべて削除します（写真フォルダーを除く）。'],
        ['`--dry-run`', '実行予定の操作を表示するだけで、何も変更しません。'],
      ],
    },
  ],
}

export default docs
