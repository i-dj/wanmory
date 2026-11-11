import type { CommonDict } from '../zh/common'

// 日本語 · 全ページ共通の文言：ナビゲーション、フッター、ボタン、各ページの <head> メタ情報

const common: CommonDict = {
  brand: 'Wanmory',
  brandFull: 'Wanmory',
  tagline: 'プライベート AI フォトライブラリ',
  homeLabel: 'Wanmory ホーム',
  nav: {
    architecture: 'アーキテクチャ',
    docs: 'ドキュメント',
    faq: 'よくある質問',
    releases: 'リリース',
    github: 'GitHub リポジトリ',
    gitee: 'Gitee リポジトリ',
    giteeMobile: 'Gitee リポジトリ（中国向けミラー）',
    openMenu: 'メニューを開く',
    closeMenu: 'メニューを閉じる',
  },
  copy: 'コピー',
  copied: 'コピーしました',
  footer: {
    about: 'オープンソースでセルフホスト型のプライベート AI フォトライブラリ。写真は自分のディスクに、AI は自分のデバイスで動きます。',
    product: '製品',
    features: '主な特長',
    architecture: 'アーキテクチャ',
    edgeAI: 'オンデバイス AI',
    faq: 'よくある質問',
    deploy: '導入とドキュメント',
    quickInstall: 'クイックインストール',
    docs: 'ドキュメント',
    releases: 'リリース',
    remoteAI: 'AI サービスの分離運用',
    openSource: 'オープンソース',
    github: 'GitHub リポジトリ',
    gitee: 'Gitee リポジトリ',
    feedback: '問題を報告',
    license: 'AGPL-3.0 ライセンス',
    copyright: 'GNU AGPL v3.0 で公開',
    noCloud: 'クラウド不要',
    selfHosted: '100% セルフホスト',
    language: '言語',
  },
  meta: {
    home: {
      title: 'Wanmory | NAS で使えるオープンソースの AI 写真管理',
      description:
        '自宅の NAS やホームサーバーで写真を管理できる Wanmory。顔認識、AI 検索、「あの日の今日」に対応した、オープンソースのセルフホスト型写真管理です。',
      keywords: 'プライベートフォトライブラリ,セルフホスト 写真,NAS 写真管理,AI 写真管理,オープンソース 写真,顔認識,自然言語 画像検索,Docker',
      crumb: 'ホーム',
      appDescription: 'オープンソースでセルフホスト型のプライベート AI フォトライブラリ。顔のクラスタリング、自然言語検索、AI ピックアップ、旅の地図、連写の整理に対応。',
    },
    architecture: {
      title: 'AI フォトライブラリのアーキテクチャ | Wanmory',
      description:
        'Wanmory のセルフホスト構成を解説：Go バックエンド、Python の AI サービス、PostgreSQL と pgvector、バックグラウンド処理、顔認識、セマンティック検索。',
      keywords: 'フォトライブラリ アーキテクチャ,pgvector,ジョブキュー,SKIP LOCKED,Chinese-CLIP,ArcFace,顔クラスタリング,セマンティック検索,ONNX Runtime',
      crumb: 'アーキテクチャ',
    },
    docs: {
      title: 'Docker Compose で Wanmory をインストール | NAS 導入ガイド',
      description:
        'Docker Compose で Wanmory を NAS やホームサーバーに導入。写真の取り込み、ローカル／リモート AI の設定、ライブラリのバックアップ、トラブルシューティングを解説します。',
      keywords: 'Wanmory 導入,Docker Compose 写真,NAS 写真 導入,環境変数,AI サービス 導入,バックアップ 復元,リバースプロキシ',
      crumb: 'ドキュメント',
    },
    faq: {
      title: 'Wanmory よくある質問 | NAS の要件・プライバシー・ローカル AI',
      description:
        'Wanmory のハードウェア要件、NAS との互換性、写真のプライバシー、オフライン AI、リモート推論、家族のアカウント、バックアップ、アップグレードについての回答。',
      keywords: 'プライベートフォトライブラリ FAQ,NAS 写真,写真 プライバシー,オフライン AI 写真,顔認識,複数ユーザー 写真',
      crumb: 'よくある質問',
    },
    releases: {
      title: 'Wanmory リリースと更新履歴',
      description:
        'セルフホスト型 AI フォトライブラリ Wanmory のリリースノート。新機能、改善点、不具合の修正をまとめています。',
      keywords: 'Wanmory 更新履歴,Wanmory バージョン,写真管理 アップデート,リリースノート,changelog',
      crumb: 'リリース',
    },
    feedback: {
      title: 'Wanmory サポート | 不具合報告と機能リクエスト',
      description:
        'オープンソースのセルフホスト型 AI フォトライブラリ Wanmory の不具合報告、機能リクエスト、使い方の質問はこちら。',
      keywords: 'Wanmory 不具合報告,Wanmory issue,写真管理 フィードバック,機能リクエスト',
      crumb: '問題を報告',
    },
  },
}

export default common
