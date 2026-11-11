import type { CommonDict } from '../zh/common'

// English · shared strings: navigation, footer, buttons, and each page's <head> metadata

const common: CommonDict = {
  brand: 'Wanmory',
  brandFull: 'Wanmory',
  tagline: 'PRIVATE AI PHOTO LIBRARY',
  homeLabel: 'Wanmory home',
  nav: {
    architecture: 'Architecture',
    docs: 'Docs',
    faq: 'FAQ',
    releases: 'Releases',
    github: 'GitHub repository',
    gitee: 'Gitee repository',
    giteeMobile: 'Gitee repository (China mirror)',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
  },
  copy: 'Copy',
  copied: 'Copied',
  footer: {
    about: 'An open-source, self-hosted private AI photo library. Your photos stay on your own drives, and the AI runs on your own hardware.',
    product: 'Product',
    features: 'Features',
    architecture: 'Architecture',
    edgeAI: 'On-device AI',
    faq: 'FAQ',
    deploy: 'Deploy & Docs',
    quickInstall: 'Quick install',
    docs: 'Documentation',
    releases: 'Releases',
    remoteAI: 'Standalone AI service',
    openSource: 'Open source',
    github: 'GitHub repository',
    gitee: 'Gitee repository',
    feedback: 'Report an issue',
    license: 'AGPL-3.0 license',
    copyright: 'Open source under the GNU AGPL v3.0',
    noCloud: 'No cloud dependency',
    selfHosted: '100% self-hosted',
    language: 'Language',
  },
  meta: {
    home: {
      title: 'Wanmory | Open-Source AI Photo Management for Your NAS',
      description:
        'Manage your photos on your own NAS or home server with Wanmory. Open-source, self-hosted photo management with face recognition, AI search, and On This Day memories.',
      keywords:
        'private photo library,self-hosted photos,NAS photo app,AI photo management,open-source photo library,face recognition,semantic photo search,Docker',
      crumb: 'Home',
      appDescription:
        'An open-source, self-hosted private AI photo library with face clustering, natural-language search, AI highlights, a travel map, and burst cleanup.',
    },
    architecture: {
      title: 'AI Photo Library Architecture | Wanmory',
      description:
        'Explore Wanmory’s self-hosted architecture: a Go backend, Python AI service, PostgreSQL and pgvector, with background processing, face recognition, and semantic search.',
      keywords: 'photo library architecture,pgvector,job queue,SKIP LOCKED,Chinese-CLIP,ArcFace,face clustering,semantic search,ONNX Runtime',
      crumb: 'Architecture',
    },
    docs: {
      title: 'Install Wanmory with Docker Compose | NAS Setup Guide',
      description:
        'Set up Wanmory on your NAS or home server with Docker Compose. Learn how to import photos, configure local or remote AI, back up your library, and troubleshoot issues.',
      keywords: 'Wanmory install,Docker Compose photo library,NAS photo deployment,environment variables,AI service deployment,backup and restore,reverse proxy',
      crumb: 'Documentation',
    },
    faq: {
      title: 'Wanmory FAQ | NAS Requirements, Privacy & Local AI',
      description:
        'Find answers about Wanmory hardware requirements, NAS compatibility, photo privacy, offline AI, remote inference, family accounts, backups, and upgrades.',
      keywords: 'private photo library FAQ,NAS photos,photo privacy,offline AI photos,face recognition,multi-user photo library',
      crumb: 'FAQ',
    },
    releases: {
      title: 'Wanmory Releases & Changelog',
      description:
        'Explore Wanmory release notes, including new features, improvements, and bug fixes for your self-hosted AI photo library.',
      keywords: 'Wanmory changelog,Wanmory releases,photo library updates,release notes,changelog',
      crumb: 'Releases',
    },
    feedback: {
      title: 'Wanmory Support | Bug Reports & Feature Requests',
      description:
        'Report bugs, request features, and ask questions about Wanmory, the open-source, self-hosted AI photo library.',
      keywords: 'Wanmory bug report,Wanmory issue,photo library feedback,feature request',
      crumb: 'Report an issue',
    },
  },
}

export default common
