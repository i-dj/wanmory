// Français · Traduction de CHANGELOG.md, par version, une chaîne par point dans le même ordre.
// Le préfixe « 修复： » (Correction) est affiché sous forme d’icône et omis ici.
// Une version absente (ou avec un nombre de points différent) s’affiche dans le texte chinois d’origine.

const changelog: Record<string, string[]> = {
  'v0.4.7': [
    "En envoyant des vidéos et autres gros fichiers depuis Safari, chaque morceau se bloquait des dizaines de secondes, à une fraction de Mo par seconde sur le réseau local ; Safari est désormais aussi rapide que Chrome (30 vidéos, 1,9 Go, en 25 secondes lors des tests)",
    "Réglages → Traitement en arrière-plan propose « Attente après les envois » : l'IA attend de 30 secondes à 4 heures après la fin des envois, pour ne pas prendre les ressources entre deux lots ; combinez-la avec la plage de nuit pour attendre la nuit",
    "Panneau des tâches plus simple en haut à droite : une courte ligne par tâche — ce qu'elle fait ou pourquoi elle attend à gauche, le temps restant à droite ; sans modèles, il indique simplement « Téléchargez d'abord les modèles dans Réglages »",
    "Pendant l'envoi ou en pause, le × en haut à droite de la section d'envoi annule tout d'un coup en conservant les photos déjà envoyées ; le temps restant n'affiche plus « Environ » et le panneau plus large ne le coupe plus",
    "La phrase de la page de connexion tient sur exactement deux lignes dans toutes les langues ; menus et boîtes de dialogue sont moins transparents et restent lisibles dans les navigateurs sans flou d'arrière-plan",
    "Documentation du site réécrite : toutes les options et étapes du script d'installation, ce que supprime chaque option de désinstallation, la mise à jour, le moment où l'IA travaille et l'exécution séparée du service IA avec uv sous macOS / Windows / Linux",
  ],
  'v0.4.6': [
    "L'étape « Enregistrement » après un gros envoi est bien plus rapide : la somme de contrôle est calculée pendant la réception, le fichier n'est donc plus relu entièrement depuis le disque (une vidéo de quelques centaines de Mo prenait des dizaines de secondes sur un Raspberry Pi) ; pour les fichiers de plus de 20 Mo, le journal note la vitesse de réception et la durée d'enregistrement, pour savoir si c'est le réseau ou le disque qui ralentit",
    "Images plus légères : le serveur utilise un ffmpeg en un seul fichier au lieu de plus de 300 Mo de bibliothèques inutiles, soit un téléchargement réduit d'environ un tiers ; l'image du service IA n'embarque plus son outil d'empaquetage",
    "« Import des photos » dans le panneau des tâches se cumule sur tout le lot, au lieu de sauter entre 2 et 10 pendant l'envoi",
    "Nouvelle phrase sur la page de connexion — « Rassembler les éclats épars du temps pour en tisser le poème des années. » —, formulée pour chaque langue ; plusieurs textes jamais traduits le sont désormais (heures de nuit, recherche par contenu, changement de port, mot de passe oublié)",
  ],
  'v0.4.5': [
    "Avec de grosses vidéos dans un lot, l'analyse IA démarrait dès que les photos étaient envoyées alors que les vidéos l'étaient encore, en concurrence avec l'envoi ; l'IA attend maintenant tant qu'un fichier n'est pas terminé (un envoi annulé arrête l'attente aussitôt, et un envoi sans activité depuis 10 minutes ne la bloque plus)",
    "Panneau des tâches en haut à droite : ce que fait chaque tâche et son avancement (temps restant, ce qu'elle attend) sont sur des lignes séparées et passent à la ligne si besoin, au lieu d'être réduits à quelques caractères ; le panneau ne défile plus horizontalement",
  ],
  'v0.4.4': [
    "Depuis la v0.4.2, Wanmory donnait les fichiers du dossier de données à l'utilisateur du conteneur, si bien que l'utilisateur de l'hôte (par exemple un utilisateur de Raspberry Pi dont l'ID n'est pas 1000) ne pouvait pas supprimer les photos envoyées ni les miniatures ; Wanmory s'exécute désormais en tant que propriétaire du dossier de données, tout ce qu'il écrit lui appartient, et les fichiers laissés par les anciennes versions lui sont rendus",
    "Les fichiers de modèles téléchargés par le service IA appartenaient à root et ne pouvaient pas être supprimés sur l'hôte ; ils reviennent maintenant au propriétaire du dossier des modèles",
    "Script de désinstallation : si une suppression normale est refusée, il supprime via un conteneur temporaire ; il ne signale un échec, avec la commande sudo à lancer, que si cela échoue aussi, au lieu d'annoncer à la fois l'échec et la réussite",
  ],
  'v0.4.3': [
    "Nouvelle capsule d'état en haut à droite : pendant l'envoi, l'import ou l'analyse IA des photos, elle apparaît à gauche de la barre d'outils et dit en quelques mots ce qui se passe (Envoi 11 %, Envoi terminé, En attente de l'analyse IA, Analyse IA 3 / 674) ; un clic affiche la progression de l'envoi, chaque fichier et les tâches de fond. Elle remplace la fenêtre d'envoi en bas à gauche et l'icône des tâches en haut du menu",
    "Les envois continuent quand vous changez de page, et la progression est visible partout ; fermer ou recharger la page pendant un envoi demande d'abord confirmation",
    "Un envoi bloqué (réseau coupé un instant, aucune progression pendant 45 secondes) se reconnecte automatiquement et reprend là où il s'était arrêté",
    "Sans les modèles IA téléchargés, la reconnaissance de texte intégrée tournait quand même, et la progression donnait l'impression d'une analyse en cours ; désormais toute l'analyse IA est en pause tant que les modèles ne sont pas téléchargés, avec une invite vers Réglages → IA, puis démarre automatiquement",
  ],
  'v0.4.2': [
    "Wanmory ne démarrait pas et redémarrait en boucle lorsque le dossier de données n’appartenait pas à l’utilisateur du conteneur (par exemple après une installation avec sudo, ou sur un Raspberry Pi) ; le propriétaire du dossier est maintenant corrigé au démarrage, et cela fonctionne aussi sur les clés USB et partages réseau où le propriétaire ne peut pas être changé",
    "Script d’installation : attend jusqu’à 5 minutes avant de décider si Wanmory a démarré ; en cas de redémarrages en boucle, les dernières lignes du journal s’affichent, et « Installation complete » n’apparaît plus si le démarrage a échoué ; le message final ne contient plus de chinois ; il commence par une bannière d’accueil et la version installée",
  ],
  'v0.4.1': [
    "Validation en deux étapes : les applis d’authentification affichent désormais « Wanmory:nom d’utilisateur », sans le préfixe chinois ; si elle est déjà activée, désactivez-la puis scannez à nouveau pour obtenir le nouveau nom",
  ],
  'v0.4.0': [
    "L’interface est disponible en 12 langues : 简体中文, 繁體中文, English, 日本語, 한국어, Deutsch, Français, Español, Português, Русский, Italiano, Tiếng Việt. Réglez-la dans Mon compte ; par défaut elle suit la langue du navigateur, et elle reste la même quand vous vous connectez sur un autre appareil. Les dates, les nombres et les noms de lieux suivent aussi la langue",
    "Validation en deux étapes : activez-la dans Mon compte en scannant un code QR avec une appli d’authentification (Google Authenticator, Microsoft Authenticator, 2FAS…) ; la connexion demande ensuite un code à 6 chiffres après le mot de passe. Vous recevez 10 codes de secours pour quand votre téléphone n’est pas à portée de main",
    "Nouveau choix de l’avatar : un aperçu de recadrage en haut, à déplacer et zoomer, et en dessous le choix entre envoyer une image, une photo de la photothèque, l’avatar par défaut ou un dessin",
    "Toutes les boîtes de dialogue ont désormais le même aspect : icône, titre et description centrés, et deux boutons de même largeur en bas ; la suppression d’un membre, d’un album ou d’un modèle utilise la même confirmation",
    "Avec des photos sélectionnées, Plus propose désormais Partager… : envoyez-les par e-mail via le menu de partage du système (les photos sont déjà en pièces jointes), par AirDrop ou vers d’autres applis ; la photothèque doit être ouverte en https ou sur localhost",
    "Avec le tri par date d’ajout, la frise à droite et les groupes de dates au-dessus des photos utilisent aussi la date d’ajout",
    "Sécurité : après plusieurs mauvais mots de passe, la connexion est bloquée un moment ; le site ne peut pas être intégré dans d’autres sites et les fichiers envoyés ne sont jamais exécutés comme des pages web ; le domaine local se modifie directement dans les réglages système",
    "La notification de fin d’envoi disparaît au bout de 10 secondes",
    "L’arrière-plan saccadait à l’ouverture d’une boîte de confirmation",
  ],
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
