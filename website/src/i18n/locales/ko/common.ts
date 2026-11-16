import type { CommonDict } from '../zh/common'

// 한국어 · 모든 페이지 공통 문구: 내비게이션, 푸터, 버튼, 각 페이지의 <head> 메타 정보

const common: CommonDict = {
  brand: 'Wanmory',
  brandFull: 'Wanmory',
  tagline: '프라이빗 AI 사진 보관함',
  homeLabel: 'Wanmory 홈',
  nav: {
    architecture: '아키텍처',
    docs: '문서',
    faq: '자주 묻는 질문',
    releases: '릴리스',
    github: 'GitHub 저장소',
    gitee: 'Gitee 저장소',
    giteeMobile: 'Gitee 저장소 (중국 미러)',
    openMenu: '메뉴 열기',
    closeMenu: '메뉴 닫기',
  },
  copy: '복사',
  copied: '복사됨',
  footer: {
    about: '오픈 소스, 셀프 호스팅 프라이빗 AI 사진 보관함. 사진은 내 디스크에, AI는 내 기기에서 실행됩니다.',
    product: '제품',
    features: '핵심 특징',
    architecture: '아키텍처',
    edgeAI: '온디바이스 AI',
    faq: '자주 묻는 질문',
    deploy: '배포와 문서',
    quickInstall: '빠른 설치',
    docs: '문서',
    releases: '릴리스',
    remoteAI: 'AI 서비스 별도 배포',
    openSource: '오픈 소스',
    github: 'GitHub 저장소',
    gitee: 'Gitee 저장소',
    feedback: '문제 신고',
    license: 'AGPL-3.0 라이선스',
    copyright: 'GNU AGPL v3.0 오픈 소스',
    noCloud: '클라우드 불필요',
    selfHosted: '100% 셀프 호스팅',
    language: '언어',
  },
  meta: {
    home: {
      title: "Wanmory | NAS·Docker용 오픈 소스 AI 사진 보관함",
      description: "Wanmory는 NAS, 라즈베리 파이, 홈 서버에 Docker로 설치하는 오픈 소스 셀프 호스팅 AI 사진 보관함입니다. 얼굴 인식, 자연어 검색, 그해 오늘, 가족 공유를 지원하고 사진을 클라우드에 올리지 않습니다. Google 포토와 iCloud 사진을 대신할 나만의 보관함.",
      keywords: "AI 사진 관리,셀프 호스팅 사진,Docker 사진 앱,NAS 사진 앱,오픈 소스 사진 관리,사진 백업,가족 사진 공유,얼굴 인식,자연어 사진 검색,라즈베리 파이 사진 서버,Google 포토 대안,iCloud 사진 대안,Immich 대안,PhotoPrism 대안,Synology Photos 대안",
      crumb: '홈',
      appDescription: '얼굴 클러스터링, 자연어 검색, AI 추천, 여행 지도, 연사 정리를 지원하는 오픈 소스 셀프 호스팅 프라이빗 AI 사진 보관함.',
    },
    architecture: {
      title: 'AI 사진 보관함 아키텍처 | Wanmory',
      description:
        'Wanmory의 셀프 호스팅 구조를 살펴보세요. Go 백엔드, Python AI 서비스, PostgreSQL과 pgvector, 백그라운드 처리, 얼굴 인식, 시맨틱 검색.',
      keywords: '사진 보관함 아키텍처,pgvector,작업 큐,SKIP LOCKED,Chinese-CLIP,ArcFace,얼굴 클러스터링,시맨틱 검색,ONNX Runtime',
      crumb: '아키텍처',
    },
    docs: {
      title: 'Docker Compose로 Wanmory 설치 | NAS 설치 가이드',
      description:
        'Docker Compose로 Wanmory를 NAS나 홈 서버에 설치하세요. 사진 가져오기, 로컬·원격 AI 설정, 보관함 백업, 문제 해결 방법을 안내합니다.',
      keywords: 'Wanmory 설치,Docker Compose 사진,NAS 사진 배포,환경 변수,AI 서비스 배포,백업 복원,리버스 프록시',
      crumb: '문서',
    },
    faq: {
      title: 'Wanmory FAQ | NAS 요구 사항, 개인정보, 로컬 AI',
      description:
        'Wanmory의 하드웨어 요구 사항, NAS 호환성, 사진 개인정보, 오프라인 AI, 원격 추론, 가족 계정, 백업과 업그레이드에 대한 답변.',
      keywords: '프라이빗 사진 보관함 FAQ,NAS 사진,사진 개인정보,오프라인 AI 사진,얼굴 인식,다중 사용자 사진,Immich,PhotoPrism,Synology Photos,Google Photos,iCloud',
      crumb: '자주 묻는 질문',
    },
    releases: {
      title: 'Wanmory 릴리스 및 변경 내역',
      description:
        '셀프 호스팅 AI 사진 보관함 Wanmory의 릴리스 노트. 새 기능, 개선 사항, 버그 수정을 확인하세요.',
      keywords: 'Wanmory 변경 내역,Wanmory 버전,사진 관리 업데이트,릴리스 노트,changelog',
      crumb: '릴리스',
    },
    feedback: {
      title: 'Wanmory 지원 | 버그 신고 및 기능 요청',
      description:
        '오픈 소스 셀프 호스팅 AI 사진 보관함 Wanmory에 대한 버그 신고, 기능 요청, 사용 문의.',
      keywords: 'Wanmory 버그 신고,Wanmory issue,사진 관리 피드백,기능 제안',
      crumb: '문제 신고',
    },
  },
}

export default common
