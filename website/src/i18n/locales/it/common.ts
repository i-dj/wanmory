import type { CommonDict } from '../zh/common'

// Italiano · Testi comuni a tutte le pagine: navigazione, piè di pagina, pulsanti e metadati <head> di ogni pagina

const common: CommonDict = {
  brand: 'Wanmory',
  brandFull: 'Wanmory',
  tagline: 'FOTOTECA PRIVATA CON IA',
  homeLabel: 'Home di Wanmory',
  nav: {
    architecture: 'Architettura',
    docs: 'Documentazione',
    faq: 'Domande frequenti',
    releases: 'Versioni',
    github: 'Repository GitHub',
    gitee: 'Repository Gitee',
    giteeMobile: 'Repository Gitee (mirror per la Cina)',
    openMenu: 'Apri menu',
    closeMenu: 'Chiudi menu',
  },
  copy: 'Copia',
  copied: 'Copiato',
  footer: {
    about: 'Una fototeca privata con IA, open source e self-hosted. Le foto restano sui tuoi dischi e l’IA gira sul tuo hardware.',
    product: 'Prodotto',
    features: 'Funzionalità',
    architecture: 'Architettura',
    edgeAI: 'IA sul dispositivo',
    faq: 'Domande frequenti',
    deploy: 'Installazione e documentazione',
    quickInstall: 'Installazione rapida',
    docs: 'Documentazione',
    releases: 'Versioni',
    remoteAI: 'Servizio IA separato',
    openSource: 'Open source',
    github: 'Repository GitHub',
    gitee: 'Repository Gitee',
    feedback: 'Segnala un problema',
    license: 'Licenza AGPL-3.0',
    copyright: 'Open source con licenza GNU AGPL v3.0',
    noCloud: 'Nessun cloud richiesto',
    selfHosted: '100% self-hosted',
    language: 'Lingua',
  },
  meta: {
    home: {
      title: "Wanmory | Fototeca con IA open source per NAS e Docker",
      description: "Wanmory è una fototeca con IA open source e self-hosted da installare con Docker su NAS, Raspberry Pi o server di casa. Riconoscimento facciale, ricerca in linguaggio naturale, «Accadde oggi» e condivisione in famiglia: l’alternativa privata a Google Foto e iCloud.",
      keywords: "gestione foto con IA,fototeca self-hosted,app foto Docker,app foto NAS,gestione foto open source,backup foto privato,condividere foto in famiglia,riconoscimento facciale,ricerca semantica foto,server foto Raspberry Pi,alternativa a Google Foto,alternativa a iCloud Foto,alternativa a Immich,alternativa a PhotoPrism,alternativa a Synology Photos",
      crumb: 'Home',
      appDescription:
        'Una fototeca privata con IA, open source e self-hosted, con raggruppamento dei volti, ricerca in linguaggio naturale, selezioni dell’IA, mappa dei viaggi e riordino delle raffiche.',
    },
    architecture: {
      title: 'Architettura di una fototeca con IA | Wanmory',
      description:
        'Scopri l’architettura self-hosted di Wanmory: backend in Go, servizio IA in Python, PostgreSQL e pgvector, con elaborazione in background, riconoscimento facciale e ricerca semantica.',
      keywords: 'architettura fototeca,pgvector,coda di lavori,SKIP LOCKED,Chinese-CLIP,ArcFace,raggruppamento dei volti,ricerca semantica,ONNX Runtime',
      crumb: 'Architettura',
    },
    docs: {
      title: 'Installa Wanmory con Docker Compose | Guida per NAS',
      description:
        'Installa Wanmory sul tuo NAS o server domestico con Docker Compose. Scopri come importare le foto, configurare l’IA locale o remota, fare il backup della fototeca e risolvere i problemi.',
      keywords: 'installare Wanmory,fototeca Docker Compose,foto su NAS installazione,variabili d’ambiente,servizio IA,backup e ripristino,reverse proxy',
      crumb: 'Documentazione',
    },
    faq: {
      title: 'Domande frequenti su Wanmory | Requisiti NAS, privacy e IA locale',
      description:
        'Risposte su requisiti hardware, compatibilità con i NAS, privacy delle foto, IA offline, inferenza remota, account di famiglia, backup e aggiornamenti di Wanmory.',
      keywords: 'domande fototeca privata,foto su NAS,privacy delle foto,IA per foto offline,riconoscimento facciale,fototeca multiutente,Immich,PhotoPrism,Synology Photos,Google Photos,iCloud',
      crumb: 'Domande frequenti',
    },
    releases: {
      title: 'Versioni e registro delle modifiche di Wanmory',
      description:
        'Note di rilascio di Wanmory con nuove funzionalità, miglioramenti e correzioni per la tua fototeca con IA self-hosted.',
      keywords: 'registro modifiche Wanmory,versioni Wanmory,aggiornamenti fototeca,note di rilascio,changelog',
      crumb: 'Versioni',
    },
    feedback: {
      title: 'Supporto Wanmory | Bug e richieste di funzionalità',
      description:
        'Segnala bug, richiedi funzionalità e fai domande su Wanmory, la fototeca con IA open source e self-hosted.',
      keywords: 'segnalazione bug Wanmory,issue Wanmory,feedback fototeca,proposta di funzionalità',
      crumb: 'Segnala un problema',
    },
  },
}

export default common
