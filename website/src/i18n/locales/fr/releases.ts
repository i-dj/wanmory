import type { ReleasesDict } from '../zh/releases'

// Français · Versions

const releases: ReleasesDict = {
  title: 'Versions',
  lead: 'Les notes de version de chaque version de Wanmory, synchronisées avec GitHub Releases.',
  lines: 'Branches de versions',
  all: 'Toutes',
  stats: { latest: 'DERNIÈRE VERSION', released: 'PUBLIÉES', versions: 'versions', first: 'PREMIÈRE VERSION', interval: 'INTERVALLE MOYEN', days: 'jours' },
  calendar: 'Calendrier des versions',
  calendarSummary: '{n} versions sur {days} jours au cours des {weeks} dernières semaines',
  weekdays: ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'],
  months: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
  newLine: 'Nouvelle branche',
  twoLines: 'Deux branches le même jour',
  less: 'Moins',
  more: 'Plus',
  listSep: ', ',
  allVersions: 'Toutes les versions',
  latestBadge: 'Dernière',
  features: '{n} nouveautés',
  fixes: '{n} corrections',
  notesHeading: 'Notes de version de {name} {version} ({date})',
  date: '{d}/{m}/{y}',
  fix: 'Correction',
  update: 'Nouveauté',
  viewOnGitHub: 'Voir {version} sur GitHub',
  untranslated: 'Ces notes de version ne sont pas encore traduites et s’affichent dans leur version chinoise d’origine.',
}

export default releases
