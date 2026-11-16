import type { CommonDict } from '../zh/common'

// Español · Textos comunes a todas las páginas: navegación, pie de página, botones y metadatos <head> de cada página

const common: CommonDict = {
  brand: 'Wanmory',
  brandFull: 'Wanmory',
  tagline: 'FOTOTECA PRIVADA CON IA',
  homeLabel: 'Inicio de Wanmory',
  nav: {
    architecture: 'Arquitectura',
    docs: 'Documentación',
    faq: 'Preguntas frecuentes',
    releases: 'Versiones',
    github: 'Repositorio en GitHub',
    gitee: 'Repositorio en Gitee',
    giteeMobile: 'Repositorio en Gitee (espejo para China)',
    openMenu: 'Abrir menú',
    closeMenu: 'Cerrar menú',
  },
  copy: 'Copiar',
  copied: 'Copiado',
  footer: {
    about: 'Una fototeca privada con IA, de código abierto y autoalojada. Tus fotos se quedan en tus propios discos y la IA se ejecuta en tu propio equipo.',
    product: 'Producto',
    features: 'Funciones',
    architecture: 'Arquitectura',
    edgeAI: 'IA en el dispositivo',
    faq: 'Preguntas frecuentes',
    deploy: 'Instalación y docs',
    quickInstall: 'Instalación rápida',
    docs: 'Documentación',
    releases: 'Versiones',
    remoteAI: 'Servicio de IA aparte',
    openSource: 'Código abierto',
    github: 'Repositorio en GitHub',
    gitee: 'Repositorio en Gitee',
    feedback: 'Informar de un problema',
    license: 'Licencia AGPL-3.0',
    copyright: 'Código abierto bajo GNU AGPL v3.0',
    noCloud: 'Sin depender de la nube',
    selfHosted: '100 % autoalojado',
    language: 'Idioma',
  },
  meta: {
    home: {
      title: "Wanmory | Fototeca con IA de código abierto para NAS y Docker",
      description: "Wanmory es una fototeca con IA de código abierto y autoalojada que instalas con Docker en un NAS, una Raspberry Pi o un servidor doméstico. Reconocimiento facial, búsqueda en lenguaje natural, «Tal día como hoy» y fotos compartidas en familia: la alternativa privada a Google Fotos e iCloud.",
      keywords: "gestor de fotos con IA,fototeca autoalojada,app de fotos Docker,app de fotos NAS,gestor de fotos de código abierto,copia de seguridad de fotos privada,compartir fotos en familia,reconocimiento facial,búsqueda semántica de fotos,servidor de fotos Raspberry Pi,alternativa a Google Fotos,alternativa a iCloud Fotos,alternativa a Immich,alternativa a PhotoPrism,alternativa a Synology Photos",
      crumb: 'Inicio',
      appDescription:
        'Una fototeca privada con IA, de código abierto y autoalojada, con agrupación de caras, búsqueda en lenguaje natural, selecciones de la IA, mapa de viajes y limpieza de ráfagas.',
    },
    architecture: {
      title: 'Arquitectura de una fototeca con IA | Wanmory',
      description:
        'Conoce la arquitectura autoalojada de Wanmory: backend en Go, servicio de IA en Python, PostgreSQL y pgvector, con procesamiento en segundo plano, reconocimiento facial y búsqueda semántica.',
      keywords: 'arquitectura fototeca,pgvector,cola de tareas,SKIP LOCKED,Chinese-CLIP,ArcFace,agrupación de caras,búsqueda semántica,ONNX Runtime',
      crumb: 'Arquitectura',
    },
    docs: {
      title: 'Instalar Wanmory con Docker Compose | Guía para NAS',
      description:
        'Instala Wanmory en tu NAS o servidor doméstico con Docker Compose. Aprende a importar fotos, configurar IA local o remota, hacer copias de seguridad y resolver problemas.',
      keywords: 'instalar Wanmory,fototeca Docker Compose,fotos en NAS instalación,variables de entorno,despliegue del servicio de IA,copia de seguridad restauración,proxy inverso',
      crumb: 'Documentación',
    },
    faq: {
      title: 'Preguntas frecuentes de Wanmory | Requisitos, privacidad e IA local',
      description:
        'Respuestas sobre los requisitos de hardware, la compatibilidad con NAS, la privacidad de las fotos, la IA sin conexión, la inferencia remota, las cuentas familiares, las copias de seguridad y las actualizaciones de Wanmory.',
      keywords: 'preguntas fototeca privada,fotos en NAS,privacidad de fotos,IA de fotos sin conexión,reconocimiento facial,fototeca multiusuario,Immich,PhotoPrism,Synology Photos,Google Photos,iCloud',
      crumb: 'Preguntas frecuentes',
    },
    releases: {
      title: 'Versiones y registro de cambios de Wanmory',
      description:
        'Notas de versión de Wanmory con funciones nuevas, mejoras y correcciones para tu fototeca con IA autoalojada.',
      keywords: 'registro de cambios Wanmory,versiones Wanmory,actualizaciones fototeca,notas de versión,changelog',
      crumb: 'Versiones',
    },
    feedback: {
      title: 'Soporte de Wanmory | Errores y sugerencias',
      description:
        'Informa de errores, sugiere funciones y pregunta sobre Wanmory, la fototeca con IA de código abierto y autoalojada.',
      keywords: 'informe de error Wanmory,incidencia Wanmory,comentarios fototeca,sugerencia de función',
      crumb: 'Informar de un problema',
    },
  },
}

export default common
