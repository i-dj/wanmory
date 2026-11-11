// Français · Traduction de CHANGELOG.md, par version, une chaîne par point dans le même ordre.
// Le préfixe « 修复： » (Correction) est affiché sous forme d’icône et omis ici.
// Une version absente (ou avec un nombre de points différent) s’affiche dans le texte chinois d’origine.

const changelog: Record<string, string[]> = {
  'v0.3.1': [
    "La carte de Lieux peut maintenant être zoomée et déplacée : zoom à la molette ou au pavé tactile, double-clic pour agrandir, glisser pour se déplacer, pincement à deux doigts sur téléphone, et des boutons en bas à droite pour agrandir, réduire ou afficher le monde entier ; vers l’échelle d’un pays, elle passe à une carte routière (les cartes en ligne doivent être activées) avec villes, routes et noms de lieux, et les épingles photo se divisent au fil du zoom jusqu’aux lieux de prise de vue ; au retour des photos, la carte reste là où vous étiez",
    "Site web : le calendrier de la page des versions devient un calendrier mensuel indiquant les numéros de version de chaque jour, et un clic sur une version mène à ses notes ; correction des pages qui s’affichaient parfois sans mise en forme sur une connexion lente ou juste après une mise à jour du site",
  ],
  'v0.3.0': [
    "Nouveau site web : accueil, architecture, installation et documentation, FAQ, versions et retours, en 12 langues ; il suit par défaut la langue de votre navigateur, et vous pouvez en changer en bas de page",
    "Scripts d’installation et de désinstallation en une commande (install.sh, uninstall.sh) : à l’installation, choisissez le port, le domaine, le mot de passe et l’emplacement de la base de données, le fuseau horaire, le répertoire des données et celui des photos ; vous décidez où se trouvent la base de données, les données et les modèles (WANMORY_DB_DIR, WANMORY_DATA_DIR, WANMORY_MODELS_DIR), et WANMORY_DOMAIN définit le domaine utilisé sur votre réseau local",
    "Lieux devient une carte du monde à plat : les pays visités apparaissent dans une couleur chaude, chaque ville porte une épingle photo avec le nom de la ville et du pays, et un clic ouvre les photos prises sur place ; en haut à droite, il ne reste que Carte / Grille, la carte routière et le globe satellite ont été retirés",
    "La page Albums passe aux grandes cartes : couverture carrée avec le nom et le nombre d’éléments en dessous, un cadenas sur les albums privés et le nom de la personne qui a créé l’album s’il n’est pas le vôtre ; la suppression d’un album utilise la boîte de confirmation standard, et Ajouter des photos dans un album devient un bouton principal bien visible",
    "La page Personnes affiche de grands portraits 3:4 avec le nom et le nombre en dessous ; cliquez sur un nom pour le modifier. L’en-tête d’une personne est plus épuré : avatar, nom et âge, puis les années et le nombre de photos et de vidéos sur la ligne suivante, avec à droite les onglets Photos, Croissance, Lieux et Ensemble ; les cartes de Croissance, Ensemble et Lieux ont la même taille que sur les pages Personnes et Albums",
    "Tous les titres de page tiennent désormais sur une ligne : le grand titre suivi d’une description en gris",
    "Sur téléphone et autres écrans étroits, une barre avec le logo s’affiche en haut, et le menu glisse depuis la droite",
    "Compte de démonstration : le compte nommé demo (modifiable avec WANMORY_DEMO_USER) ne peut ni changer son mot de passe, ni déconnecter d’autres appareils, ni rien supprimer ; il peut téléverser, et supprimer les photos qu’il a téléversées et les albums qu’il a créés dans les 30 dernières minutes",
    "Améliorations des souvenirs mis en avant, de l’historique de connexion, des avatars, de la note esthétique, de la localisation IP et plus encore",
  ],
  'v0.2.9': [
    'Nouveau logo : un « M » tracé d’un seul trait dans un cercle fin, avec un point rouge ; les onglets du navigateur affichent aussi une icône',
    'Le menu de gauche peut se replier en une barre étroite d’icônes (cliquez sur le logo pour le déplier) ; il est réparti en trois groupes : Principal, Catégories et Organiser. Les catégories comprennent Favoris, Note, Vidéos, Paysages, Cuisine, Animaux et Plantes, avec Captures d’écran, Documents et Papiers d’identité sous « Plus »',
    'Nouvelle catégorie « Plantes », et « Animaux de compagnie » devient « Animaux » (oiseaux et animaux de zoo compris) ; rechercher un nom de catégorie (Cuisine, Paysages…) affiche directement ses photos',
    'Nouvelle page « Mon compte » : cliquez sur l’avatar en bas à gauche du menu pour changer d’avatar, de nom et de mot de passe, voir les appareils connectés (navigateur, IP, dernière utilisation) et déconnecter les autres ; le thème se règle aussi ici',
    'Les réglages système sont désormais une série de cartes : Membres, Mode d’exécution IA (avec test de connexion et alerte en cas d’échec), Unité de calcul, Niveau de modèles (les modèles téléchargés peuvent être supprimés), Traitement en arrière-plan, Dossier d’import, Accès invité, Cartes en ligne et Mise à jour ; les modèles se téléchargent automatiquement depuis la source la plus rapide, Hugging Face ou un miroir en Chine',
    'Toutes les fenêtres surgissantes adoptent un même aspect de verre dépoli translucide, avec boutons principaux et secondaires ; les erreurs lors de l’ajout d’un membre ou du changement de mot de passe s’affichent directement dans la fenêtre',
    'Les « Réglages de partage » d’un album deviennent « Droits » : Tout le monde, Membres choisis, Moi seulement',
    'Fond plus sombre en mode sombre ; tous les boutons et sélecteurs segmentés de l’app partagent désormais un même style',
    'L’icône des tâches de fond continuait de tourner en affichant 0 une fois toutes les tâches terminées',
  ],
  'v0.2.8': [
    'La zone de contenu passe sur fond blanc (pour des couleurs plus fidèles) et le menu de gauche en beige ; l’espace de stockage en bas du menu devient une petite carte blanche',
    'Le bouton de lecture n’est plus qu’une icône ronde orange, qui affiche « Diaporama » au survol',
    'En-tête de la page d’une personne épuré : sans dégradé, avec une bordure fine, avatar, nom, âge et anniversaire en haut et quatre statistiques en dessous ; l’anniversaire se définit ou se modifie juste sous le nom, et l’en-tête est identique dans les onglets Photos, Évolution, Lieux et Ensemble',
  ],
  'v0.2.7': [
    'Un tout nouvel aspect chaleureux : fond blanc cassé, accent orange brique et police à empattements pour les titres, noms, souvenirs et dates ; un nouveau logo orange',
    'Chaque page a désormais un champ de recherche en haut (sur toute la photothèque) ; calendrier, tri, filtre et taille d’affichage à droite sont réunis en un groupe de boutons, et la lecture devient partout un bouton orange « Diaporama »',
    'Les photos de la photothèque, des favoris, des albums et des personnes sont groupées par mois, chaque groupe titré comme « Novembre 2026 »',
    '« Ce jour-là » devient une grande carte à photo unique',
    'Nouvel en-tête de la page d’une personne : grand avatar, âge et anniversaire, statistiques de photos, vidéos, années couvertes et lieux visités, et les personnes avec qui elle apparaît souvent',
    'Le menu de gauche reste toujours visible (il ne se replie plus à l’ouverture d’une personne ou d’un album) et affiche l’espace utilisé en bas ; « Importer des fichiers » devient « Importer photos / vidéos »',
    'Un simple clic sur une photo l’ouvre en grand (clic avec ⌘ / Ctrl ou ⇧ pour une sélection multiple) ; les photos apparaissent en fondu au changement de page',
    'Les boutons en haut à droite et la chronologie à droite sautaient au changement de page, l’écran clignotait à l’ouverture d’une personne, et l’animation du menu saccadait sur iPad',
    'Les boîtes de dialogue et les menus passent sur fond blanc opaque ; la barre d’actions des photos sélectionnées, les tâches de fond et la fenêtre d’import adoptent un verre dépoli clair',
    'Mot de passe oublié (même pour l’unique administrateur, ou si vous avez aussi oublié le nom) ? Sur la machine qui fait tourner l’app, exécutez `docker compose exec server wanmory reset-password` ; voir « Mot de passe oublié » dans le README',
  ],
  'v0.2.6': [
    'La barre de titre en haut de chaque page a désormais la même hauteur et la même position : titres et boutons ne sautent plus au changement de page',
    'Changer de page n’affiche plus brièvement les photos de la page précédente',
    'En mode clair, la zone de contenu et le menu de gauche partagent le même fond',
    'Ajout de « Se déconnecter » en bas du menu ; la roue dentée des réglages système est masquée pour les non-administrateurs (cliquez sur votre avatar et votre nom pour vos propres réglages)',
    'Tout ce qui est cliquable affiche un curseur en forme de main au survol',
  ],
  'v0.2.5': [
    'Panneau des tâches de fond simplifié : visages, contenu et texte sont fusionnés en une ligne « Reconnaissance IA », métadonnées et miniatures en « Importer des photos » ; les deux indiquent l’avancement en nombre de photos et le temps restant estimé',
    'Avec le niveau Automatique, le niveau est fixé plus vite et le traitement commence plus tôt, même quand le service IA est très sollicité juste après son démarrage',
  ],
  'v0.2.4': [
    'Le service IA consomme moins de mémoire : les modèles inutilisés sont déchargés automatiquement (après 5 minutes sur les machines de moins de 8 Go, 30 minutes au-delà), les modèles de l’ancien niveau sont libérés après un changement, et aucune réserve de mémoire n’est allouée sur les machines modestes. Sur un Raspberry Pi, le service IA n’occupe presque plus de mémoire quand il ne traite pas de photos',
    'Nouveau niveau Automatique (par défaut si aucun niveau n’a été choisi) : choisi selon le matériel du serveur IA – Précision avec un GPU, sur processeur seul Léger sous 6 Go de mémoire et Équilibré au-delà ; il suit si vous changez de serveur IA. Le traitement IA ne démarre qu’une fois le niveau fixé',
  ],
  'v0.2.3': [
    'Les tâches de fond affichaient encore « IA en pause : des photos sont en cours d’import » longtemps après la fin des imports. Désormais, seuls les imports qui transfèrent réellement des données comptent, et l’IA reprend 30 secondes après leur fin',
    'L’en-tête de la photothèque n’affiche plus « En cours / Terminé » ; l’avancement est indiqué uniquement par l’icône des tâches en haut du menu',
  ],
  'v0.2.2': [
    'Le numéro de version s’affiche en haut du menu ; nouvelle section « Mise à jour » dans les réglages : versions de l’app et du service IA, alerte quand une nouvelle version sort et liste de ses nouveautés',
    'Les notes de version sont générées automatiquement à la publication d’une nouvelle version',
  ],
  'v0.2.1': [
    'Le traitement en arrière-plan s’adapte à la machine : le nombre de photos traitées en même temps par l’IA et le nombre de fils par modèle dépendent de la présence d’un GPU, du nombre de cœurs et de la mémoire ; un Raspberry Pi ne se bloque plus',
    'Moment du traitement IA : Au repos (par défaut ; en pause pendant un import ou la génération de miniatures), À tout moment, ou La nuit uniquement',
    'Nouvelle section « Performances » dans les réglages pour modifier tout cela à la main ; le niveau IA est recommandé selon le matériel du serveur',
    'Icône des tâches de fond en haut du menu : elle apparaît quand des tâches tournent et, une fois ouverte, montre l’avancement par type de tâche et si l’IA est en pause',
    'Le docker-compose.yml de déploiement inclut désormais la base de données : un seul fichier suffit pour installer',
  ],
  'v0.2.0': [
    'Accès invité : consulter en lecture seule les photos et albums partagés sans se connecter (désactivable dans les réglages)',
    'Nouvelle fenêtre de connexion',
    'Les albums peuvent être privés ou partagés avec certains membres seulement ; un album privé peut aussi masquer les photos que vous y avez importées',
  ],
  'v0.1.0': ['Première version : photothèque, albums, personnes (reconnaissance faciale), lieux, favoris, notes, recherche sémantique et reconnaissance de texte'],
}

export default changelog
