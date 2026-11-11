import type { CommonDict } from '../zh/common'

// Deutsch · Gemeinsame Texte aller Seiten: Navigation, Fußzeile, Schaltflächen und <head>-Metadaten jeder Seite

const common: CommonDict = {
  brand: 'Wanmory',
  brandFull: 'Wanmory',
  tagline: 'PRIVATE KI-FOTOBIBLIOTHEK',
  homeLabel: 'Wanmory Startseite',
  nav: {
    architecture: 'Architektur',
    docs: 'Dokumentation',
    faq: 'FAQ',
    releases: 'Releases',
    github: 'GitHub-Repository',
    gitee: 'Gitee-Repository',
    giteeMobile: 'Gitee-Repository (China-Spiegel)',
    openMenu: 'Menü öffnen',
    closeMenu: 'Menü schließen',
  },
  copy: 'Kopieren',
  copied: 'Kopiert',
  footer: {
    about: 'Eine quelloffene, selbst gehostete private KI-Fotobibliothek. Ihre Fotos bleiben auf Ihren eigenen Festplatten, die KI läuft auf Ihrer eigenen Hardware.',
    product: 'Produkt',
    features: 'Funktionen',
    architecture: 'Architektur',
    edgeAI: 'KI auf dem Gerät',
    faq: 'FAQ',
    deploy: 'Installation & Doku',
    quickInstall: 'Schnellinstallation',
    docs: 'Dokumentation',
    releases: 'Releases',
    remoteAI: 'KI-Dienst separat betreiben',
    openSource: 'Open Source',
    github: 'GitHub-Repository',
    gitee: 'Gitee-Repository',
    feedback: 'Problem melden',
    license: 'AGPL-3.0-Lizenz',
    copyright: 'Open Source unter der GNU AGPL v3.0',
    noCloud: 'Keine Cloud nötig',
    selfHosted: '100 % selbst gehostet',
    language: 'Sprache',
  },
  meta: {
    home: {
      title: 'Wanmory | Open-Source-KI-Fotoverwaltung für Ihr NAS',
      description:
        'Verwalten Sie Ihre Fotos auf Ihrem eigenen NAS oder Heimserver mit Wanmory. Quelloffene, selbst gehostete Fotoverwaltung mit Gesichtserkennung, KI-Suche und „Heute vor …“-Erinnerungen.',
      keywords:
        'private Fotobibliothek,Fotos selbst hosten,NAS Fotoverwaltung,KI Fotoverwaltung,Open-Source Fotobibliothek,Gesichtserkennung,semantische Fotosuche,Docker',
      crumb: 'Startseite',
      appDescription:
        'Eine quelloffene, selbst gehostete private KI-Fotobibliothek mit Gesichtsgruppierung, Suche in natürlicher Sprache, KI-Highlights, Reisekarte und Serienbild-Bereinigung.',
    },
    architecture: {
      title: 'Architektur einer KI-Fotobibliothek | Wanmory',
      description:
        'Die selbst gehostete Architektur von Wanmory: Go-Backend, Python-KI-Dienst, PostgreSQL und pgvector, mit Hintergrundverarbeitung, Gesichtserkennung und semantischer Suche.',
      keywords: 'Fotobibliothek Architektur,pgvector,Job-Warteschlange,SKIP LOCKED,Chinese-CLIP,ArcFace,Gesichtsgruppierung,semantische Suche,ONNX Runtime',
      crumb: 'Architektur',
    },
    docs: {
      title: 'Wanmory mit Docker Compose installieren | NAS-Anleitung',
      description:
        'Richten Sie Wanmory mit Docker Compose auf Ihrem NAS oder Heimserver ein. So importieren Sie Fotos, konfigurieren lokale oder entfernte KI, sichern Ihre Bibliothek und beheben Probleme.',
      keywords: 'Wanmory Installation,Docker Compose Fotobibliothek,NAS Fotos installieren,Umgebungsvariablen,KI-Dienst einrichten,Sicherung Wiederherstellung,Reverse Proxy',
      crumb: 'Dokumentation',
    },
    faq: {
      title: 'Wanmory FAQ | NAS-Anforderungen, Datenschutz & lokale KI',
      description:
        'Antworten zu Hardwareanforderungen, NAS-Kompatibilität, Datenschutz bei Fotos, Offline-KI, entfernter Inferenz, Familienkonten, Sicherungen und Updates von Wanmory.',
      keywords: 'private Fotobibliothek FAQ,NAS Fotos,Datenschutz Fotos,KI Fotos offline,Gesichtserkennung,Fotobibliothek mehrere Benutzer',
      crumb: 'FAQ',
    },
    releases: {
      title: 'Wanmory Releases & Änderungsprotokoll',
      description:
        'Versionshinweise zu Wanmory mit neuen Funktionen, Verbesserungen und Fehlerbehebungen für Ihre selbst gehostete KI-Fotobibliothek.',
      keywords: 'Wanmory Änderungsprotokoll,Wanmory Versionen,Fotobibliothek Updates,Versionshinweise,Changelog',
      crumb: 'Releases',
    },
    feedback: {
      title: 'Wanmory Support | Fehlerberichte & Funktionswünsche',
      description:
        'Melden Sie Fehler, wünschen Sie sich Funktionen und stellen Sie Fragen zu Wanmory, der quelloffenen, selbst gehosteten KI-Fotobibliothek.',
      keywords: 'Wanmory Fehlerbericht,Wanmory Issue,Fotobibliothek Feedback,Funktionswunsch',
      crumb: 'Problem melden',
    },
  },
}

export default common
