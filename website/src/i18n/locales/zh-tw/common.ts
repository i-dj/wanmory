import type { CommonDict } from '../zh/common'

// 繁體中文（台灣） · 所有頁面共用的文字：導航、頁尾、按鈕，以及每個頁面的標題和描述（<head> 裡的 SEO 資訊）
// 其他語言的同名檔案結構和這裡完全一樣（類型檢查保證），改這裡的結構時其他語言也要一起改

const common: CommonDict = {
  brand: '萬象', // 導航、側欄裡的產品名
  brandFull: '萬象 Wanmory', // 頁尾、標題裡的完整名字
  tagline: 'WANMORY · 私有 AI 相簿',
  homeLabel: '萬象 Wanmory 首頁',
  nav: {
    architecture: '功能架構',
    docs: '部署與文件',
    faq: '常見問題',
    releases: '版本發布',
    github: 'GitHub 儲存庫',
    gitee: 'Gitee 儲存庫',
    giteeMobile: 'Gitee 儲存庫（中國大陸鏡像）',
    openMenu: '開啟選單',
    closeMenu: '關閉選單',
  },
  copy: '複製',
  copied: '已複製',
  footer: {
    about: '開源、自架的私有 AI 相簿。照片留在自己的硬碟上，AI 在自己的裝置上執行。',
    product: '產品',
    features: '核心特性',
    architecture: '功能架構',
    edgeAI: '裝置端 AI',
    faq: '常見問題',
    deploy: '部署與文件',
    quickInstall: '快速安裝',
    docs: '部署與文件',
    releases: '版本發布',
    remoteAI: '獨立部署 AI',
    openSource: '開源',
    github: 'GitHub 儲存庫',
    gitee: 'Gitee 儲存庫',
    feedback: '提交問題',
    license: 'AGPL-3.0 授權',
    copyright: '基於 GNU AGPL v3.0 開源',
    noCloud: '不依賴雲端服務',
    selfHosted: '100% 自架',
    language: '語言',
  },
  // 每個頁面 <head> 裡的標題、描述、關鍵詞；crumb 是麵包屑導航裡的頁面名
  meta: {
    home: {
      title: '萬象 Wanmory | 開源 AI 相簿，部署在你自己的 NAS 上',
      description:
        '用萬象在自己的 NAS 或家用伺服器上管理照片。開源、自架的照片管理，支援人臉辨識、AI 搜尋和那年今天，照片無需上傳雲端。',
      keywords: '私有相簿,自架相簿,NAS 相簿,AI 相簿,開源相簿,人臉辨識,以文搜圖,照片管理,Docker',
      crumb: '首頁',
      appDescription: '開源、自架的私有 AI 相簿，支援人臉分群、中文自然語言搜尋、AI 精選、足跡地圖與連拍整理。',
    },
    architecture: {
      title: 'AI 相簿系統架構 | 萬象 Wanmory',
      description:
        '瞭解萬象的自架架構：Go 後端、Python AI 服務、PostgreSQL 與 pgvector，以及後台任務處理、人臉辨識和語意搜尋的實現方式。',
      keywords: '相簿架構,pgvector,任務佇列,SKIP LOCKED,Chinese-CLIP,ArcFace,人臉分群,語意搜尋,ONNX Runtime',
      crumb: '功能架構',
    },
    docs: {
      title: '用 Docker Compose 安裝萬象 | NAS 部署指南',
      description:
        '用 Docker Compose 把萬象部署到 NAS 或家用伺服器。瞭解如何匯入照片、設定本地或遠端 AI、備份相簿以及排查常見問題。',
      keywords: '萬象部署,Docker Compose 相簿,NAS 部署相簿,環境變數,AI 服務部署,備份恢復,反向代理',
      crumb: '部署與文件',
    },
    faq: {
      title: '萬象常見問題 | NAS 硬體要求、隱私與本地 AI',
      description:
        '關於萬象的常見問題：硬體要求、NAS 相容性、照片隱私、離線 AI、遠端推論、家庭多帳號、備份與升級。',
      keywords: '私有相簿常見問題,NAS 相簿,照片隱私,AI 相簿離線,人臉辨識,多使用者相簿',
      crumb: '常見問題',
    },
    releases: {
      title: '萬象版本發布與更新日誌',
      description:
        '檢視萬象每個版本的更新說明，包括新功能、改進和問題修復，適用於你的自架 AI 相簿。',
      keywords: '萬象更新日誌,Wanmory 版本,私有相簿更新,release notes,changelog',
      crumb: '版本發布',
    },
    feedback: {
      title: '萬象支援 | 問題回報與功能建議',
      description:
        '回報問題、提出功能建議或諮詢使用方法。萬象是一款開源、自架的 AI 相簿。',
      keywords: '萬象問題回報,Wanmory issue,私有相簿回報,功能建議',
      crumb: '提交問題',
    },
  },
}

export default common
