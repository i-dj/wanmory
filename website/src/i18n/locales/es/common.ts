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
      title: 'Wanmory | Gestión de fotos con IA de código abierto para tu NAS',
      description:
        'Gestiona tus fotos en tu propio NAS o servidor doméstico con Wanmory. Gestión de fotos de código abierto y autoalojada, con reconocimiento facial, búsqueda con IA y recuerdos de «Un día como hoy».',
      keywords:
        'fototeca privada,fotos autoalojadas,fotos en NAS,gestión de fotos con IA,fototeca de código abierto,reconocimiento facial,búsqueda semántica de fotos,Docker',
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
      keywords: 'preguntas fototeca privada,fotos en NAS,privacidad de fotos,IA de fotos sin conexión,reconocimiento facial,fototeca multiusuario',
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
