import type { CommonDict } from '../zh/common'

// Português (Brasil) · Textos comuns a todas as páginas: navegação, rodapé, botões e metadados <head> de cada página

const common: CommonDict = {
  brand: 'Wanmory',
  brandFull: 'Wanmory',
  tagline: 'BIBLIOTECA DE FOTOS PRIVADA COM IA',
  homeLabel: 'Página inicial do Wanmory',
  nav: {
    architecture: 'Arquitetura',
    docs: 'Documentação',
    faq: 'Perguntas frequentes',
    releases: 'Versões',
    github: 'Repositório no GitHub',
    gitee: 'Repositório no Gitee',
    giteeMobile: 'Repositório no Gitee (espelho para a China)',
    openMenu: 'Abrir menu',
    closeMenu: 'Fechar menu',
  },
  copy: 'Copiar',
  copied: 'Copiado',
  footer: {
    about: 'Uma biblioteca de fotos privada com IA, de código aberto e auto-hospedada. Suas fotos ficam nos seus próprios discos, e a IA roda no seu próprio hardware.',
    product: 'Produto',
    features: 'Recursos',
    architecture: 'Arquitetura',
    edgeAI: 'IA no dispositivo',
    faq: 'Perguntas frequentes',
    deploy: 'Instalação e docs',
    quickInstall: 'Instalação rápida',
    docs: 'Documentação',
    releases: 'Versões',
    remoteAI: 'Serviço de IA separado',
    openSource: 'Código aberto',
    github: 'Repositório no GitHub',
    gitee: 'Repositório no Gitee',
    feedback: 'Relatar um problema',
    license: 'Licença AGPL-3.0',
    copyright: 'Código aberto sob a GNU AGPL v3.0',
    noCloud: 'Sem depender da nuvem',
    selfHosted: '100% auto-hospedado',
    language: 'Idioma',
  },
  meta: {
    home: {
      title: "Wanmory | Biblioteca de fotos com IA open source para NAS e Docker",
      description: "Wanmory é uma biblioteca de fotos com IA, de código aberto e auto-hospedada, que você instala com Docker em um NAS, Raspberry Pi ou servidor doméstico. Reconhecimento facial, busca em linguagem natural, “Neste dia” e compartilhamento em família: a alternativa privada ao Google Fotos e ao iCloud.",
      keywords: "gerenciador de fotos com IA,biblioteca de fotos auto-hospedada,app de fotos Docker,app de fotos NAS,gerenciador de fotos open source,backup de fotos privado,compartilhar fotos em família,reconhecimento facial,busca semântica de fotos,servidor de fotos Raspberry Pi,alternativa ao Google Fotos,alternativa ao iCloud Fotos,alternativa ao Immich,alternativa ao PhotoPrism,alternativa ao Synology Photos",
      crumb: 'Início',
      appDescription:
        'Uma biblioteca de fotos privada com IA, de código aberto e auto-hospedada, com agrupamento de rostos, busca em linguagem natural, destaques da IA, mapa de viagens e limpeza de sequências.',
    },
    architecture: {
      title: 'Arquitetura de uma biblioteca de fotos com IA | Wanmory',
      description:
        'Conheça a arquitetura auto-hospedada do Wanmory: backend em Go, serviço de IA em Python, PostgreSQL e pgvector, com processamento em segundo plano, reconhecimento facial e busca semântica.',
      keywords: 'arquitetura de biblioteca de fotos,pgvector,fila de tarefas,SKIP LOCKED,Chinese-CLIP,ArcFace,agrupamento de rostos,busca semântica,ONNX Runtime',
      crumb: 'Arquitetura',
    },
    docs: {
      title: 'Instale o Wanmory com Docker Compose | Guia para NAS',
      description:
        'Instale o Wanmory no seu NAS ou servidor doméstico com Docker Compose. Veja como importar fotos, configurar IA local ou remota, fazer backup da biblioteca e resolver problemas.',
      keywords: 'instalar Wanmory,biblioteca de fotos Docker Compose,fotos no NAS instalação,variáveis de ambiente,implantação do serviço de IA,backup e restauração,proxy reverso',
      crumb: 'Documentação',
    },
    faq: {
      title: 'Perguntas frequentes do Wanmory | Requisitos, privacidade e IA local',
      description:
        'Respostas sobre requisitos de hardware, compatibilidade com NAS, privacidade das fotos, IA offline, inferência remota, contas da família, backups e atualizações do Wanmory.',
      keywords: 'perguntas biblioteca de fotos privada,fotos no NAS,privacidade de fotos,IA de fotos offline,reconhecimento facial,biblioteca de fotos multiusuário,Immich,PhotoPrism,Synology Photos,Google Photos,iCloud',
      crumb: 'Perguntas frequentes',
    },
    releases: {
      title: 'Versões e registro de alterações do Wanmory',
      description:
        'Notas de versão do Wanmory com recursos novos, melhorias e correções para a sua biblioteca de fotos com IA auto-hospedada.',
      keywords: 'registro de alterações Wanmory,versões Wanmory,atualizações da biblioteca de fotos,notas de versão,changelog',
      crumb: 'Versões',
    },
    feedback: {
      title: 'Suporte do Wanmory | Bugs e sugestões de recursos',
      description:
        'Relate bugs, sugira recursos e tire dúvidas sobre o Wanmory, a biblioteca de fotos com IA de código aberto e auto-hospedada.',
      keywords: 'relatório de bug Wanmory,issue Wanmory,feedback biblioteca de fotos,sugestão de recurso',
      crumb: 'Relatar um problema',
    },
  },
}

export default common
