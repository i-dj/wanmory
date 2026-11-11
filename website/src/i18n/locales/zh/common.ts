// 简体中文 · 所有页面共用的文字：导航、页脚、按钮，以及每个页面的标题和描述（<head> 里的 SEO 信息）
// 其他语言的同名文件结构和这里完全一样（类型检查保证），改这里的结构时其他语言也要一起改

const common = {
  brand: '万象', // 导航、侧栏里的产品名
  brandFull: '万象 Wanmory', // 页脚、标题里的完整名字
  tagline: 'WANMORY · 私有 AI 相册',
  homeLabel: '万象 Wanmory 首页',
  nav: {
    architecture: '功能架构',
    docs: '部署与文档',
    faq: '常见问题',
    releases: '版本发布',
    github: 'GitHub 仓库',
    gitee: 'Gitee 仓库',
    giteeMobile: 'Gitee 仓库（国内）',
    openMenu: '打开菜单',
    closeMenu: '关闭菜单',
  },
  copy: '复制',
  copied: '已复制',
  footer: {
    about: '开源、自托管的私有 AI 相册。照片留在自己的硬盘上，AI 在自己的设备上运行。',
    product: '产品',
    features: '核心特性',
    architecture: '功能架构',
    edgeAI: '端侧 AI',
    faq: '常见问题',
    deploy: '部署与文档',
    quickInstall: '快速安装',
    docs: '部署与文档',
    releases: '版本发布',
    remoteAI: '独立部署 AI',
    openSource: '开源',
    github: 'GitHub 仓库',
    gitee: 'Gitee 仓库',
    feedback: '提交问题',
    license: 'AGPL-3.0 许可',
    copyright: '基于 GNU AGPL v3.0 开源',
    noCloud: '不依赖云服务',
    selfHosted: '100% 自托管',
    language: '语言',
  },
  // 每个页面 <head> 里的标题、描述、关键词；crumb 是面包屑导航里的页面名
  meta: {
    home: {
      title: '万象 Wanmory | 开源 AI 相册，部署在你自己的 NAS 上',
      description:
        '用万象在自己的 NAS 或家用服务器上管理照片。开源、自托管的照片管理，支持人脸识别、AI 搜索和那年今天，照片无需上传云端。',
      keywords: '私有相册,自托管相册,NAS 相册,AI 相册,开源相册,人脸识别,以文搜图,照片管理,Docker',
      crumb: '首页',
      appDescription: '开源、自托管的私有 AI 相册，支持人脸聚类、中文自然语言搜索、AI 精选、足迹地图与连拍整理。',
    },
    architecture: {
      title: 'AI 相册系统架构 | 万象 Wanmory',
      description:
        '了解万象的自托管架构：Go 后端、Python AI 服务、PostgreSQL 与 pgvector，以及后台任务处理、人脸识别和语义搜索的实现方式。',
      keywords: '相册架构,pgvector,任务队列,SKIP LOCKED,Chinese-CLIP,ArcFace,人脸聚类,语义搜索,ONNX Runtime',
      crumb: '功能架构',
    },
    docs: {
      title: '用 Docker Compose 安装万象 | NAS 部署指南',
      description:
        '用 Docker Compose 把万象部署到 NAS 或家用服务器。了解如何导入照片、配置本地或远程 AI、备份相册以及排查常见问题。',
      keywords: '万象部署,Docker Compose 相册,NAS 部署相册,环境变量,AI 服务部署,备份恢复,反向代理',
      crumb: '部署与文档',
    },
    faq: {
      title: '万象常见问题 | NAS 硬件要求、隐私与本地 AI',
      description:
        '关于万象的常见问题：硬件要求、NAS 兼容性、照片隐私、离线 AI、远程推理、家庭多账号、备份与升级。',
      keywords: '私有相册常见问题,NAS 相册,照片隐私,AI 相册离线,人脸识别,多用户相册',
      crumb: '常见问题',
    },
    releases: {
      title: '万象版本发布与更新日志',
      description:
        '查看万象每个版本的更新说明，包括新功能、改进和问题修复，适用于你的自托管 AI 相册。',
      keywords: '万象更新日志,Wanmory 版本,私有相册更新,release notes,changelog',
      crumb: '版本发布',
    },
    feedback: {
      title: '万象支持 | 问题反馈与功能建议',
      description:
        '反馈问题、提出功能建议或咨询使用方法。万象是一款开源、自托管的 AI 相册。',
      keywords: '万象问题反馈,Wanmory issue,私有相册反馈,功能建议',
      crumb: '提交问题',
    },
  },
}

export default common
export type CommonDict = typeof common
