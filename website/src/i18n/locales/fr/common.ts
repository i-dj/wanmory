import type { CommonDict } from '../zh/common'

// Français · Textes communs à toutes les pages : navigation, pied de page, boutons et métadonnées <head> de chaque page

const common: CommonDict = {
  brand: 'Wanmory',
  brandFull: 'Wanmory',
  tagline: 'PHOTOTHÈQUE IA PRIVÉE',
  homeLabel: 'Accueil Wanmory',
  nav: {
    architecture: 'Architecture',
    docs: 'Documentation',
    faq: 'FAQ',
    releases: 'Versions',
    github: 'Dépôt GitHub',
    gitee: 'Dépôt Gitee',
    giteeMobile: 'Dépôt Gitee (miroir pour la Chine)',
    openMenu: 'Ouvrir le menu',
    closeMenu: 'Fermer le menu',
  },
  copy: 'Copier',
  copied: 'Copié',
  footer: {
    about: 'Une photothèque IA privée, open source et auto-hébergée. Vos photos restent sur vos propres disques, l’IA tourne sur votre propre matériel.',
    product: 'Produit',
    features: 'Fonctionnalités',
    architecture: 'Architecture',
    edgeAI: 'IA embarquée',
    faq: 'FAQ',
    deploy: 'Déploiement et docs',
    quickInstall: 'Installation rapide',
    docs: 'Documentation',
    releases: 'Versions',
    remoteAI: 'Service IA séparé',
    openSource: 'Open source',
    github: 'Dépôt GitHub',
    gitee: 'Dépôt Gitee',
    feedback: 'Signaler un problème',
    license: 'Licence AGPL-3.0',
    copyright: 'Open source sous licence GNU AGPL v3.0',
    noCloud: 'Aucun cloud requis',
    selfHosted: '100 % auto-hébergé',
    language: 'Langue',
  },
  meta: {
    home: {
      title: 'Wanmory | Gestion de photos par IA, open source, pour votre NAS',
      description:
        'Gérez vos photos sur votre propre NAS ou serveur domestique avec Wanmory. Une gestion de photos open source et auto-hébergée, avec reconnaissance faciale, recherche par IA et souvenirs « Ce jour-là ».',
      keywords:
        'photothèque privée,photos auto-hébergées,photos sur NAS,gestion de photos IA,photothèque open source,reconnaissance faciale,recherche sémantique de photos,Docker',
      crumb: 'Accueil',
      appDescription:
        'Une photothèque IA privée, open source et auto-hébergée avec regroupement des visages, recherche en langage naturel, sélections IA, carte des voyages et tri des rafales.',
    },
    architecture: {
      title: 'Architecture d’une photothèque IA | Wanmory',
      description:
        'Découvrez l’architecture auto-hébergée de Wanmory : backend Go, service IA en Python, PostgreSQL et pgvector, avec traitement en arrière-plan, reconnaissance faciale et recherche sémantique.',
      keywords: 'architecture photothèque,pgvector,file de tâches,SKIP LOCKED,Chinese-CLIP,ArcFace,regroupement des visages,recherche sémantique,ONNX Runtime',
      crumb: 'Architecture',
    },
    docs: {
      title: 'Installer Wanmory avec Docker Compose | Guide NAS',
      description:
        'Installez Wanmory sur votre NAS ou serveur domestique avec Docker Compose. Importez vos photos, configurez une IA locale ou distante, sauvegardez votre photothèque et résolvez les problèmes.',
      keywords: 'installation Wanmory,photothèque Docker Compose,déploiement photos NAS,variables d’environnement,déploiement service IA,sauvegarde restauration,proxy inverse',
      crumb: 'Documentation',
    },
    faq: {
      title: 'FAQ Wanmory | Matériel NAS, confidentialité et IA locale',
      description:
        'Réponses sur le matériel requis, la compatibilité NAS, la confidentialité des photos, l’IA hors ligne, l’inférence distante, les comptes familiaux, les sauvegardes et les mises à jour de Wanmory.',
      keywords: 'FAQ photothèque privée,photos NAS,confidentialité des photos,IA photos hors ligne,reconnaissance faciale,photothèque multi-utilisateur',
      crumb: 'FAQ',
    },
    releases: {
      title: 'Versions et journal des modifications de Wanmory',
      description:
        'Notes de version de Wanmory : nouvelles fonctionnalités, améliorations et corrections pour votre photothèque IA auto-hébergée.',
      keywords: 'journal des modifications Wanmory,versions Wanmory,mises à jour photothèque,notes de version,changelog',
      crumb: 'Versions',
    },
    feedback: {
      title: 'Support Wanmory | Bugs et demandes de fonctionnalités',
      description:
        'Signalez des bugs, proposez des fonctionnalités et posez vos questions sur Wanmory, la photothèque IA open source et auto-hébergée.',
      keywords: 'rapport de bug Wanmory,ticket Wanmory,retour photothèque,suggestion de fonctionnalité',
      crumb: 'Signaler un problème',
    },
  },
}

export default common
