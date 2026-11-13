import type { DocsDict } from '../zh/docs'

// Français · Documentation

const docs: DocsDict = {
  title: 'Documentation',
  onThisPage: 'Dans cette section',
  reportIssue: 'Signaler une erreur de doc ↗',
  architecture: 'Architecture →',
  backToTop: 'Haut de page ↑',
  sectionLink: 'Lien vers cette section',
  toc: [
    {
      key: 'install',
      title: 'Installation',
      groups: [
        {
          group: 'Prise en main',
          items: [
            ['intro', 'Présentation'],
            ['requirements', 'Configuration requise'],
            ['quick-start', 'Installation rapide'],
          ],
        },
        {
          group: 'Script d’installation',
          items: [
            ['install-script', 'Options du script'],
            ['install-steps', 'Le script pas à pas'],
            ['install-faq', 'FAQ d’installation'],
          ],
        },
        {
          group: 'Configuration',
          items: [
            ['compose', 'docker-compose.yml expliqué'],
            ['env', 'Variables d’environnement'],
            ['library', 'Monter des dossiers photo existants'],
            ['mdns', 'Domaine local (mDNS)'],
            ['proxy', 'Proxy inverse et accès Internet'],
          ],
        },
        {
          group: 'Service IA',
          items: [
            ['ai-overview', 'Modes d’exécution'],
            ['ai-remote', 'Service IA sur une autre machine'],
            ['ai-schedule', 'Quand l’IA travaille'],
            ['ai-models', 'Niveaux de modèles et téléchargement'],
            ['ai-env', 'Variables du service IA'],
          ],
        },
      ],
    },
    {
      key: 'guide',
      title: 'Guide d’utilisation',
      groups: [
        {
          group: 'Les bases',
          items: [
            ['first-run', 'Initialisation et première connexion'],
            ['import', 'Importer des photos'],
            ['browse', 'Parcourir, rechercher et organiser'],
            ['members-usage', 'Membres et droits'],
          ],
        },
        {
          group: 'Réglages système',
          items: [
            ['settings-members', 'Membres et historique des connexions'],
            ['settings-ai', 'Réglages IA'],
            ['settings-perf', 'Performances et ressources'],
            ['settings-general', 'Stockage, invités, cartes et domaine'],
            ['settings-update', 'Mise à jour du système'],
          ],
        },
      ],
    },
    {
      key: 'maintain',
      title: 'Maintenance',
      groups: [
        {
          group: 'Maintenance',
          items: [
            ['update', 'Mise à jour'],
            ['backup', 'Sauvegarde et restauration'],
            ['reset-password', 'Réinitialiser le mot de passe admin'],
            ['troubleshooting', 'Dépannage'],
            ['uninstall', 'Désinstallation'],
          ],
        },
      ],
    },
  ],
  intro:
    'Cette documentation s’adresse aux administrateurs qui auto-hébergent Wanmory sur un NAS, un serveur domestique ou un ordinateur personnel. Elle couvre l’installation, la configuration, le déploiement du service IA, l’usage quotidien, les réglages système et l’exploitation. Pour la conception du système et les algorithmes, voir [Architecture](/architecture/).',
  blocks: [
    {
      h2: 'intro',
    },
    {
      p: 'Wanmory est une photothèque IA privée, open source et auto-hébergée. Elle se compose de quatre conteneurs : le backend Go (`server`), le service d’inférence IA en Python (`ml`), la base PostgreSQL + pgvector (`postgres`) et `mdns`, qui annonce le domaine local. Photos, métadonnées, vecteurs et file de tâches sont tous stockés en local, sans dépendre d’aucun service cloud.',
    },
    {
      ul: [
        'Gestion des photos : chronologie groupée par mois, albums et albums intelligents, tri des rafales et photos similaires, carte des voyages, diaporamas.',
        'Fonctions IA : détection et regroupement des visages, recherche en langage naturel (Chinese-CLIP), reconnaissance de texte (PP-OCR), note esthétique (sélection IA).',
        'Plusieurs membres : comptes individuels, droits de suppression liés à la propriété, historique des connexions.',
      ],
    },
    {
      h2: 'requirements',
    },
    {
      table: ['Élément', 'Minimum', 'Recommandé'],
      rows: [
        ['Architecture CPU', 'x86_64 (amd64) ou ARM64', '—'],
        [
          'Processeur',
          'Classe Intel N100 / Raspberry Pi 5',
          'Classe Intel i5 ou mieux, ou service IA sur une machine avec GPU',
        ],
        ['Mémoire', '4 Go (niveau « Léger » choisi automatiquement)', '8 Go ou plus (niveau « Équilibré »)'],
        [
          'Disque',
          'Environ 1 à 4 Go pour les modèles, plus la place des miniatures',
          'Un SSD pour data/ et le volume de la base',
        ],
        ['Logiciels', 'Docker Engine et Docker Compose v2', '—'],
        [
          'Système',
          'Toute distribution Linux qui fait tourner Docker',
          'Synology DSM, QNAP QTS, TrueNAS SCALE, Unraid, Ubuntu / Debian',
        ],
      ],
    },
    {
      note: 'Les images sont publiées pour `linux/amd64` et `linux/arm64`, et Docker récupère celle qui correspond à votre architecture. Les conteneurs Docker sous macOS ne peuvent pas utiliser le GPU Apple ; pour l’accélération matérielle sur Mac, voir [Service IA sur une autre machine](#ai-remote).',
    },
    {
      h2: 'quick-start',
    },
    {
      h3: 'Méthode 1 : script d’installation (recommandé)',
    },
    {
      p: 'À lancer sur Linux ou macOS 64 bits avec Docker (sur un NAS Synology, QNAP ou autre, connectez-vous d’abord en SSH) :',
    },
    {
      code: 'curl -fsSL https://wanmory.com/install.sh | bash',
      lang: 'bash',
    },
    {
      p: 'Le script pose une question à la fois ; Entrée accepte la valeur par défaut entre crochets. Pour une première installation, il suffit d’appuyer sur Entrée à chaque fois. Chaque option est expliquée dans [Options du script](#install-script), et chaque message dans [Le script pas à pas](#install-steps). À la fin, ouvrez l’adresse affichée, créez le compte administrateur, puis téléchargez les modèles dans Réglages → Exécution de l’IA.',
    },
    {
      note: 'Pour voir d’abord ce que fait le script, téléchargez-le, lisez-le, puis lancez-le : `curl -fsSLO https://wanmory.com/install.sh`, puis `bash install.sh`. Avec `--dry-run`, il vérifie seulement le système et écrit les fichiers de configuration, sans télécharger d’images ni rien démarrer.',
    },
    {
      h3: 'Méthode 2 : installation manuelle',
    },
    {
      steps: [
        {
          title: 'Créer un dossier et récupérer le fichier Compose',
          body: [
            {
              p: 'Créez un dossier pour le fichier Compose, les données et les modèles, puis téléchargez le `docker-compose.yml` officiel :',
            },
            {
              code: `mkdir -p ~/wanmory && cd ~/wanmory
curl -fsSLO https://raw.githubusercontent.com/i-dj/wanmory/main/docker/docker-compose.yml`,
              lang: 'bash',
            },
          ],
        },
        {
          title: '(Facultatif) Écrire un .env',
          body: [
            {
              p: 'Créez un `.env` dans le même dossier pour remplacer les valeurs par défaut. En production, changez impérativement le mot de passe de la base :',
            },
            {
              code: `WANMORY_DB_PASSWORD=remplacez-par-une-chaine-aleatoire
WANMORY_PORT=8080
WANMORY_TZ=Europe/Paris
WANMORY_VERSION=latest`,
              lang: '.env',
            },
          ],
        },
        {
          title: 'Démarrer les services',
          body: [
            {
              p: 'Le premier démarrage télécharge les images et exécute automatiquement les migrations de la base :',
            },
            {
              code: `docker compose up -d
docker compose ps        # vérifier que les quatre services sont running / healthy`,
              lang: 'bash',
            },
          ],
        },
        {
          title: 'Ouvrir et initialiser',
          body: [
            {
              p: 'Ouvrez `http://wanmory.local:8080` (ou `http://<IP de l’hôte>:8080`) dans un navigateur, créez le compte administrateur comme indiqué, puis téléchargez les modèles dans « Réglages système → IA ». Une fois les modèles prêts, les photos existantes entrent automatiquement dans la file de traitement IA.',
            },
          ],
        },
      ],
    },
    {
      h2: 'install-script',
    },
    {
      p: 'Utilisation : `curl -fsSL https://wanmory.com/install.sh | bash -s -- [options]`, ou après téléchargement `bash install.sh [options]`.',
    },
    {
      h3: 'Options de ligne de commande',
    },
    {
      table: ['Option', 'Effet'],
      rows: [
        [
          '`-y`, `--yes`',
          'Aucune question : toutes les valeurs par défaut (ou les variables d’environnement ci-dessous) ; le mot de passe de la base est généré. C’est aussi le cas automatiquement sans terminal interactif (par exemple depuis un autre script).',
        ],
        ['`--dir DOSSIER`', 'Dossier d’installation, par défaut `~/wanmory` (ou définir `WANMORY_DIR`).'],
        [
          '`--dry-run`',
          'Vérifie seulement le système, écrit et valide `.env` et `docker-compose.yml` ; rien n’est téléchargé ni démarré.',
        ],
        ['`-h`, `--help`', 'Affiche l’aide.'],
      ],
    },
    {
      h3: 'Variables d’environnement',
    },
    {
      p: 'À placer devant la commande. En installation interactive, elles deviennent la réponse par défaut de chaque question ; avec `-y`, elles sont utilisées directement. Toutes sauf `WANMORY_DIR` et `WANMORY_PHOTOS` sont écrites dans `.env`.',
    },
    {
      table: ['Variable', 'Défaut', 'Effet'],
      rows: [
        ['`WANMORY_DIR`', '~/wanmory', 'Dossier d’installation, comme `--dir`.'],
        [
          '`WANMORY_PORT`',
          '8080',
          'Port web. S’il est occupé, l’installation interactive en demande un autre ; avec `-y`, le script s’arrête sur une erreur.',
        ],
        [
          '`WANMORY_DOMAIN`',
          'wanmory.local',
          'Domaine du réseau local. Doit finir par `.local` et ne contenir que des lettres, chiffres et tirets.',
        ],
        ['`WANMORY_DB_PASSWORD`', 'généré', 'Mot de passe de la base. S’il est défini, le script ne le demande pas.'],
        [
          '`WANMORY_DB_DIR`',
          'vide (volume Docker pgdata)',
          'Un dossier de cette machine pour la base ; vide signifie le volume Docker. N’utilisez pas de partage réseau.',
        ],
        [
          '`WANMORY_TZ`',
          'fuseau de cette machine, sinon Asia/Shanghai',
          'Pour les photos sans fuseau dans les EXIF. Nom complet comme `Europe/Paris` ; en interactif, on peut aussi chercher par ville.',
        ],
        [
          '`WANMORY_DATA_DIR`',
          './data',
          'Dossier de données : miniatures, aperçus et photos envoyées par la page web. Les chemins relatifs partent du dossier d’installation.',
        ],
        ['`WANMORY_MODELS_DIR`', './models', 'Dossier des modèles IA, 1 à 4 Go.'],
        [
          '`WANMORY_PHOTOS`',
          'vide',
          'Dossiers photo existants, séparés par des virgules, en lecture seule par défaut ; ajoutez `:rw` à un chemin pour la lecture-écriture, par ex. `/volume1/photo,/mnt/usb:rw`.',
        ],
        [
          '`WANMORY_REGISTRY`',
          'ghcr.io/i-dj',
          'Registre d’images. Remplacez-le par un miroir accessible si ghcr.io est lent ou bloqué.',
        ],
        [
          '`WANMORY_VERSION`',
          'latest',
          'Version à installer, par ex. `0.4.1`. L’écran d’accueil affiche la version installée.',
        ],
      ],
    },
    {
      code: `# Exemple : sans questions, dans /opt/wanmory sur le port 9000, deux dossiers photo du NAS en lecture seule
curl -fsSL https://wanmory.com/install.sh | WANMORY_PORT=9000 WANMORY_PHOTOS=/volume1/photo,/volume2/family bash -s -- -y --dir /opt/wanmory`,
      lang: 'bash',
    },
    {
      h2: 'install-steps',
    },
    {
      p: 'Les messages du script sont en anglais pour s’afficher correctement dans tout terminal de NAS. Voici chaque étape dans l’ordre d’apparition : ✔ vert signifie réussi, ! jaune est un avertissement (l’installation continue), ✘ rouge est une erreur qui arrête le script.',
    },
    {
      steps: [
        {
          title: 'Écran d’accueil',
          body: [
            {
              p: 'Affiche le logo WANMORY et `Installing version v0.4.1` : la version qui sera installée, c’est-à-dire `WANMORY_VERSION` s’il est défini, sinon la dernière version publiée.',
            },
          ],
        },
        {
          title: 'Checking system',
          body: [
            {
              table: ['Message', 'Signification'],
              rows: [
                [
                  '`OS: Linux` / `OS: macOS`',
                  'Système d’exploitation. Sur macOS, rappel que l’IA en conteneur ne peut pas utiliser le GPU Apple ; pour la vitesse, lancez le service IA directement sur le Mac (voir [Faire tourner le service IA à part](#ai-remote)). Les autres systèmes s’arrêtent ici.',
                ],
                [
                  '`CPU: x86_64 (linux/amd64 images)`',
                  'Architecture du processeur. Seuls amd64 et arm64 64 bits sont pris en charge ; un système 32 bits (y compris un ancien Raspberry Pi OS avec noyau 64 bits mais espace utilisateur 32 bits) s’arrête : installez un système 64 bits.',
                ],
                [
                  '`Docker 27.x`',
                  'Docker fonctionne. S’il manque, un lien d’installation s’affiche (Synology / QNAP : Container Manager / Container Station dans le centre de paquets). En cas de `Permission denied`, lancez avec sudo ou ajoutez votre utilisateur au groupe docker puis reconnectez-vous.',
                ],
                [
                  '`Docker Compose v2.x`',
                  'Docker Compose fonctionne. Avec seulement l’ancien docker-compose v1, une mise à niveau est conseillée mais l’installation continue.',
                ],
                [
                  '`Memory: 8 GB`',
                  'Mémoire. Sous 4 Go : `AI will use the lite model tier`, l’IA prend automatiquement le niveau léger ; sous 2 Go, avertissement que la reconnaissance IA risque de ne pas fonctionner.',
                ],
              ],
            },
          ],
        },
        {
          title: 'Configuration',
          body: [
            {
              p: 'Une question à la fois ; Entrée accepte la valeur par défaut entre crochets.',
            },
            {
              table: ['Question', 'Signification et conseil'],
              rows: [
                [
                  '`Install directory`',
                  'Dossier où vivent `.env`, `docker-compose.yml` et, par défaut, data et models. L’espace libre du disque s’affiche ensuite ; sous 10 Go, un avertissement apparaît.',
                ],
                [
                  '`Keep the existing configuration`',
                  'N’apparaît que si un `.env` existe déjà (installation précédente). Entrée (Y) garde le port, le domaine, le mot de passe de la base, etc. et saute les questions suivantes ; idéal pour réinstaller ou mettre à jour. n pour tout ressaisir. Ne changez pas à la légère le mot de passe une fois la base créée.',
                ],
                ['`Web port`', 'Port web, 8080 par défaut. S’il est occupé, on vous en demande un autre.'],
                [
                  '`LAN domain (must end in .local)`',
                  'Nom pour ouvrir la photothèque sur le réseau local, wanmory.local par défaut ; photos.local convient aussi. Modifiable plus tard dans les réglages web.',
                ],
                [
                  '`Generate a random database password`',
                  'Entrée génère un mot de passe aléatoire et l’enregistre dans `.env` ; inutile de le retenir. n pour en saisir un deux fois (8 caractères minimum ; ni espaces, ni guillemets, ni `$ \\ @ : / # ?`).',
                ],
                [
                  '`Database location`',
                  'Emplacement de la base. Laissez vide et Entrée pour le volume Docker pgdata (recommandé), ou indiquez un dossier local comme `/volume1/wanmory/db`. Avertit de ne pas utiliser un partage SMB / NFS, qui peut corrompre la base.',
                ],
                [
                  '`Time zone`',
                  'Sert à dater les photos sans fuseau dans les EXIF. Tapez une ville ou un pays, par ex. paris, brussels, montreal ; si plusieurs correspondent, choisissez par numéro.',
                ],
                [
                  '`Data directory`',
                  'Dossier de données, ./data par défaut. Miniatures, aperçus et photos envoyées y sont stockés : prévoyez assez de place.',
                ],
                ['`AI model directory (1-4 GB)`', 'Dossier des modèles IA, ./models par défaut.'],
                [
                  '`Add existing photo folders from a NAS or external drive`',
                  'Ajouter des dossiers photo existants (sans les renvoyer). Y puis saisissez un chemin ; s’il n’existe pas, confirmation demandée.',
                ],
                [
                  '`Mount read-only`',
                  'Entrée monte en lecture seule : Wanmory ne modifie ni ne supprime jamais les originaux (recommandé). n pour la lecture-écriture : supprimer définitivement une photo dans Wanmory supprime aussi le fichier original.',
                ],
                ['`Add another photo folder`', 'Ajouter le dossier suivant ; Entrée (N) pour terminer.'],
              ],
            },
          ],
        },
        {
          title: 'Writing configuration',
          body: [
            {
              p: 'Écrit `.env` (droits 600, lisible par vous seul) ; avec des dossiers photo, aussi `docker-compose.override.yml` (fusionné automatiquement par Docker Compose) ; télécharge `docker-compose.yml` depuis GitHub, sinon depuis Gitee. `Configuration is valid` signifie que la vérification a réussi. Avec `--dry-run`, le script s’arrête ici.',
            },
          ],
        },
        {
          title: 'Existing database found',
          body: [
            {
              p: 'N’apparaît que si vous n’avez pas gardé l’ancienne configuration mais qu’une base précédente existe encore (par exemple conservée à la désinstallation). Entrée (Y) la garde : photos, albums, personnes et comptes sont toujours là, et le script remplace son mot de passe par le nouveau de `.env`. n supprime l’ancienne base et repart de zéro ; si la base est dans un dossier local, le script ne la supprime pas lui-même : videz ce dossier puis relancez le script.',
            },
          ],
        },
        {
          title: 'Pulling images and starting',
          body: [
            {
              p: 'Télécharge les images (quelques minutes la première fois). Démarre d’abord la base et l’attend (`Waiting for the database...`), aligne son mot de passe sur celui de `.env` (`Database ready`), puis démarre le reste.',
            },
          ],
        },
        {
          title: 'Waiting for Wanmory to start',
          body: [
            {
              p: 'Attend jusqu’à 5 minutes ; les appareils lents comme un Raspberry Pi sont plus longs la première fois. Si Wanmory redémarre en boucle, les 15 dernières lignes du journal s’affichent et le script s’arrête ; s’il ne répond toujours pas à la fin du délai, il vous invite à revérifier plus tard et donne la commande pour voir les journaux.',
            },
          ],
        },
        {
          title: 'Installation complete',
          body: [
            {
              p: 'Affiche la `LAN address` (domaine), l’`IP address` et le dossier d’installation. `Next` indique la suite : ouvrir la page, créer le compte administrateur, puis télécharger les modèles dans Réglages → Exécution de l’IA. Certains appareils Android ne résolvent pas les noms .local : utilisez l’adresse IP.',
            },
          ],
        },
      ],
    },
    {
      h2: 'install-faq',
    },
    {
      table: ['Problème', 'Cause et solution'],
      rows: [
        [
          'Après réinstallation, Wanmory ne se connecte plus à la base (échec d’authentification)',
          'La base n’utilise le mot de passe de `.env` qu’à sa création ; modifier `.env` ensuite ne le change pas. Le script actuel aligne le mot de passe de la base sur `.env` à chaque démarrage : relancez-le simplement. Pour une installation manuelle, exécutez dans le dossier d’installation `docker compose exec postgres psql -U wanmory -c "ALTER USER wanmory WITH PASSWORD \'nouveau-mot-de-passe\';"`, puis `docker compose up -d`.',
        ],
        [
          'À qui appartiennent les fichiers du dossier de données / impossible de les supprimer sur l’hôte',
          'Le conteneur Wanmory s’exécute sous l’identité du propriétaire du dossier de données : créé par un utilisateur normal (comme le fait le script), les envois et miniatures lui appartiennent et se gèrent sans sudo ; si le dossier appartient à root ou est un volume Docker, il tourne en uid 1000. Sur les systèmes de fichiers qui ne gèrent pas les propriétaires (clés exFAT / NTFS, partages SMB), il tourne en root. Les fichiers mal attribués par d’anciennes versions sont corrigés au démarrage.',
        ],
        [
          'Raspberry Pi',
          'Un système 64 bits (Raspberry Pi OS 64-bit) est obligatoire ; en 32 bits le script s’arrête. Avec 4 Go de mémoire, le niveau léger est utilisé automatiquement ; le premier démarrage et le premier traitement des photos sont lents, gardez données et base sur un SSD.',
        ],
        ['Port déjà utilisé', 'Choisissez un autre port, ou lancez le script avec `WANMORY_PORT=9000`.'],
        [
          'Téléchargement des images lent ou en échec',
          'Définissez `WANMORY_REGISTRY` sur un miroir accessible et relancez.',
        ],
      ],
    },
    {
      h2: 'compose',
    },
    {
      p: 'Le fichier Compose officiel définit quatre services : la base `postgres`, le backend `server`, l’annonceur de domaine local `mdns` et le service IA intégré `ml`. Le rôle de chaque réglage est indiqué directement dans le fichier :',
    },
    {
      lang: 'yaml',
      code: `# Fichier Compose officiel de Wanmory : lancez docker compose up -d dans le dossier de ce fichier
# Les variables de la forme \${VAR:-défaut} sont lues dans le .env du même dossier ; sinon la valeur par défaut s'applique

services:
  # ── Base de données : PostgreSQL 17 + pgvector ───────────────────
  # Stocke métadonnées des photos, personnes, albums, réglages, file de tâches et vecteurs (index HNSW)
  # Aucun port publié ; joignable uniquement sur le réseau interne de Compose
  postgres:
    image: pgvector/pgvector:pg17
    environment:
      POSTGRES_USER: wanmory
      POSTGRES_PASSWORD: \${WANMORY_DB_PASSWORD:-wanmory}   # à changer impérativement dans .env en production
      POSTGRES_DB: wanmory
    volumes:
      - \${WANMORY_DB_DIR:-pgdata}:/var/lib/postgresql/data  # volume nommé pgdata par défaut ; avec WANMORY_DB_DIR, ce dossier. À inclure dans les sauvegardes
    healthcheck:                             # server attend ce contrôle de santé et démarre une fois la base prête
      test: ["CMD", "pg_isready", "-U", "wanmory", "-d", "wanmory"]
      interval: 5s
      timeout: 3s
      retries: 20
    restart: unless-stopped

  # ── Backend : binaire Go avec l'application web intégrée ─────────
  # Gère l'API, les imports (tus), l'ordonnancement, les miniatures et les droits ; migre la base au démarrage
  server:
    image: \${WANMORY_REGISTRY:-ghcr.io/i-dj}/wanmory-server:\${WANMORY_VERSION:-latest}
    environment:
      DATABASE_URL: postgres://wanmory:\${WANMORY_DB_PASSWORD:-wanmory}@postgres:5432/wanmory
      WANMORY_ML_URL: http://ml:3003         # adresse du service IA intégré ; un service distant se règle dans « Réglages IA »
      TZ: \${WANMORY_TZ:-Asia/Shanghai}       # fuseau utilisé quand l'EXIF n'en contient pas
      WANMORY_MDNS: "off"                    # ce conteneur ne reçoit pas le multicast sur le réseau bridge ; le service mdns ci-dessous annonce le domaine
      WANMORY_HTTP_PUBLIC_PORT: \${WANMORY_PORT:-8080}   # port affiché dans l'app web, à aligner sur la redirection de port
      WANMORY_DOMAIN: \${WANMORY_DOMAIN:-wanmory.local}  # domaine local initial ; une fois modifié dans les réglages web, c'est le réglage qui prime
    ports:
      - "\${WANMORY_PORT:-8080}:8080"         # port de l'hôte:port du conteneur
    volumes:
      - \${WANMORY_DATA_DIR:-./data}:/data    # upload/ contient les originaux importés, thumbs/ les miniatures et aperçus 1440 px
      # Montez les dossiers photo existants comme sous-dossiers de /photos, autant que voulu ; :ro = lecture seule ; analyse toutes les 15 minutes
      # - /mnt/nas/photos:/photos/nas:ro
      # - /media/usb/appareil:/photos/usb:ro
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  # ── Annonce du domaine local (mDNS) ──────────────────────────────
  # Même image que server, n'exécute que la sous-commande mdns ; annonce wanmory.local (modifiable dans l'app web)
  mdns:
    image: \${WANMORY_REGISTRY:-ghcr.io/i-dj}/wanmory-server:\${WANMORY_VERSION:-latest}
    command: ["mdns"]
    network_mode: host                       # le réseau de l'hôte est nécessaire pour émettre et recevoir le multicast local
    environment:
      WANMORY_URL: http://127.0.0.1:\${WANMORY_PORT:-8080}   # demande régulièrement le domaine actuel à server
      WANMORY_DOMAIN: \${WANMORY_DOMAIN:-wanmory.local}  # annoncé tant que server est injoignable
    depends_on:
      - server
    restart: unless-stopped

  # ── Service IA intégré : FastAPI + ONNX Runtime, CPU uniquement ──
  # Sans état ; reçoit les aperçus de server et renvoie visages, vecteurs et texte ; aucun port publié
  ml:
    image: \${WANMORY_REGISTRY:-ghcr.io/i-dj}/wanmory-ml:\${WANMORY_VERSION:-latest}
    volumes:
      - \${WANMORY_MODELS_DIR:-./models}:/models  # conserve les modèles : recréer le conteneur ne les retélécharge pas
    environment:
      WANMORY_MODEL_DIR: /models
      WANMORY_AUTO_DOWNLOAD: "0"             # pas de téléchargement automatique ; un admin valide d'abord licences et espace disque dans l'app web
    restart: unless-stopped

volumes:
  pgdata:`,
    },
    {
      h2: 'env',
    },
    {
      h3: '.env (variables Compose)',
    },
    {
      p: 'Ces variables sont utilisées dans `docker-compose.yml` ; placez-les dans le `.env` du même dossier pour les appliquer :',
    },
    {
      table: ['Variable', 'Défaut', 'Description'],
      rows: [
        [
          '`WANMORY_DB_PASSWORD`',
          'wanmory',
          'Mot de passe PostgreSQL, utilisé aussi dans la DATABASE_URL de server. Le changer après le premier démarrage impose de modifier aussi le mot de passe de l’utilisateur dans la base.',
        ],
        ['`WANMORY_PORT`', '8080', 'Port publié sur l’hôte, utilisé aussi pour l’adresse affichée dans l’app web.'],
        ['`WANMORY_TZ`', 'Asia/Shanghai', 'Fuseau horaire utilisé quand les données EXIF n’en contiennent pas.'],
        [
          '`WANMORY_VERSION`',
          'latest',
          'Étiquette d’image ; fixez une version précise pour choisir le moment des mises à jour.',
        ],
        [
          '`WANMORY_REGISTRY`',
          'ghcr.io/i-dj',
          'Registre d’images. Remplacez-le par un registre accessible si ghcr.io est inaccessible.',
        ],
        [
          '`WANMORY_DATA_DIR`',
          './data',
          'Dossier de données : originaux importés (upload/) et miniatures et aperçus (thumbs/), monté sur /data dans le conteneur.',
        ],
        ['`WANMORY_MODELS_DIR`', './models', 'Dossier des modèles IA, monté sur /models dans le conteneur ml.'],
        [
          '`WANMORY_DB_DIR`',
          'volume pgdata',
          'Dossier de la base. Sans valeur, le volume Docker pgdata est utilisé ; avec le chemin d’un dossier sur un disque local, la base y est stockée directement. N’utilisez pas de partage réseau.',
        ],
        [
          '`WANMORY_DOMAIN`',
          'wanmory.local',
          'Domaine local initial, doit se terminer par .local. Une fois modifié dans « Réglages système → Domaine d’accès », c’est le réglage qui prime.',
        ],
      ],
    },
    {
      h3: 'Conteneur server (facultatif)',
    },
    {
      p: '`DATABASE_URL`, `WANMORY_ML_URL`, `WANMORY_MDNS` et `WANMORY_HTTP_PUBLIC_PORT` sont déjà définis dans le fichier Compose, avec leur rôle. Les variables suivantes n’y figurent pas ; ajoutez-les au besoin dans l’`environment` de `server` :',
    },
    {
      table: ['Variable', 'Défaut', 'Description'],
      rows: [
        [
          '`WANMORY_WORKERS`',
          'auto',
          'Parallélisme par défaut des tâches de métadonnées et de miniatures. Sans valeur, calculé d’après les cœurs et la mémoire ; ajustable dans « Performances » de l’app web.',
        ],
        [
          '`WANMORY_ML_TOKEN`',
          'vide',
          'Jeton d’accès du service IA intégré ; doit correspondre à la variable du même nom dans le conteneur ml. Généralement inutile.',
        ],
        ['`WANMORY_FACE_MODEL`', 'antelopev2', 'Modèle de visages utilisé quand aucun niveau n’a été choisi.'],
        [
          '`WANMORY_CLIP_MODEL`',
          'chinese-clip-vit-h-14',
          'Modèle de recherche sémantique utilisé quand aucun niveau n’a été choisi.',
        ],
        [
          '`WANMORY_STORAGE_ROOTS`',
          'dossier de données',
          'Dossiers consultables et sélectionnables dans l’app web, séparés par des deux-points.',
        ],
      ],
    },
    {
      h2: 'library',
    },
    {
      p: 'Les photos déjà présentes sur un NAS ou un disque externe n’ont pas besoin d’être importées. Montez le dossier comme sous-dossier de `/photos` dans le conteneur : il est analysé toutes les 15 minutes, les nouveaux fichiers sont **importés sur place** (ni copiés ni déplacés), puis passent par la lecture des métadonnées, la génération des miniatures et le traitement IA comme les photos importées.',
    },
    {
      lang: 'yaml',
      code: `  server:
    volumes:
      - ./data:/data
      - /mnt/nas/photos:/photos/nas:ro       # :ro monte en lecture seule
      - /media/usb/appareil:/photos/usb:ro
      - /home/moi/Images:/photos/pictures     # montage en lecture-écriture`,
    },
    {
      p: 'Après modification, lancez `docker compose up -d`. La première analyse commence environ 20 secondes après le redémarrage du conteneur.',
    },
    {
      ul: [
        '**Le montage en lecture seule (:ro) est recommandé** : rien n’est écrit dans ces dossiers. Supprimer une photo dans l’app la déplace seulement vers « Supprimées récemment », la suppression définitive n’efface jamais le fichier d’origine, et les analyses suivantes ne le réimportent pas. Pour les dossiers en lecture-écriture, la suppression définitive efface aussi le fichier d’origine.',
        'Les fichiers au contenu identique ne sont importés qu’une fois (dédoublonnage par somme SHA-1), y compris les fichiers déjà importés et les doublons entre dossiers.',
        'Les dossiers cachés et les dossiers système de NAS (.xxx, @eaDir, #recycle, etc.) sont ignorés automatiquement.',
        'Les photos venant des dossiers photo n’appartiennent à aucun membre ; seuls les administrateurs peuvent les supprimer.',
      ],
    },
    {
      h2: 'mdns',
    },
    {
      p: 'Le service `mdns` fonctionne en mode réseau hôte et annonce le domaine d’accès sur le réseau local (par défaut `wanmory.local`). macOS, iOS, iPadOS et Windows 10 ou plus récent y accèdent via `http://wanmory.local:8080` sans configurer le routeur. Le domaine se change dans « Réglages système → Domaine d’accès » et doit se terminer par `.local`.',
    },
    {
      note: 'Certains appareils Android ne résolvent pas les noms mDNS ; utilisez alors l’adresse IP. Si le port 5353 est déjà pris (par exemple sur Synology), le service mdns peut ne pas démarrer ; utilisez là aussi l’IP. Le reste n’est pas affecté.',
      warn: true,
    },
    {
      h2: 'proxy',
    },
    {
      p: 'Les imports web utilisent le protocole avec reprise [tus](https://tus.io) (`/api/uploads/`) par blocs de 16 Mo. Derrière un proxy inverse, levez la limite de taille des requêtes et désactivez la mise en tampon. Exemple Nginx :',
    },
    {
      lang: 'nginx',
      code: `location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location /api/uploads/ {
    proxy_pass http://127.0.0.1:8080;
    client_max_body_size 0;          # aucune limite de taille (au moins 20m)
    proxy_request_buffering off;     # transmettre en flux plutôt que de tamponner sur le disque du proxy
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
}`,
    },
    {
      note: 'Avant d’ouvrir l’accès depuis Internet : utilisez HTTPS, désactivez l’accès invité dans les réglages système et imposez des mots de passe robustes à tous les membres. L’offre gratuite de Cloudflare limite une requête à 100 Mo : les blocs de 16 Mo ne demandent aucun réglage supplémentaire.',
      warn: true,
    },
    {
      h2: 'ai-overview',
    },
    {
      p: 'Le service IA est un service HTTP sans état : il reçoit des aperçus de 1440 pixels du backend et renvoie visages, vecteurs et texte reconnu. Il n’accède jamais à la base et ne stocke aucun fichier. Le backend propose deux modes, à choisir dans « Réglages système → IA → Mode d’exécution IA » :',
    },
    {
      table: ['Mode', 'Où il tourne', 'Adapté à'],
      rows: [
        [
          'Intégré (CPU uniquement)',
          'Conteneur ml dans Compose, joignable uniquement en interne',
          'Prêt à l’emploi ; NAS ou mini-PC avec une photothèque modeste, ou si un premier traitement plus long est acceptable',
        ],
        [
          'Service distant',
          'Une autre machine du réseau local, qui exécute directement le service Python',
          'Mac Apple Silicon (CoreML / MPS) ou machine avec GPU NVIDIA (CUDA), pour raccourcir nettement le premier traitement',
        ],
      ],
    },
    {
      p: 'Si le service IA est indisponible, les tâches IA restent en file et ne sont plus prises, sans consommer de relances ; le traitement reprend automatiquement au retour du service. La navigation, les imports et le reste ne sont pas affectés.',
    },
    {
      h2: 'ai-remote',
    },
    {
      p: 'Le conteneur IA intégré n’utilise que le processeur. Si vous avez un ordinateur plus rapide (Mac à puce Apple, ou PC Windows / Linux avec GPU NVIDIA), vous pouvez y faire tourner directement le service IA (le programme Python du dossier `ml/` du dépôt) et Wanmory lui envoie les photos. Python et les dépendances sont gérés par [uv](https://docs.astral.sh/uv/) : inutile d’installer Python vous-même.',
    },
    {
      table: ['Ordinateur', 'Accélération disponible'],
      rows: [
        [
          'Mac à puce Apple',
          'CoreML pour la reconnaissance des visages, MPS (PyTorch) pour la recherche intelligente.',
        ],
        [
          'Linux + GPU NVIDIA',
          'CUDA pour la recherche intelligente (PyTorch en demi-précision, environ 1,9 Go de VRAM).',
        ],
        [
          'Windows + GPU NVIDIA',
          'CUDA pour la recherche intelligente après installation de PyTorch version CUDA (étape 3 Windows ci-dessous) ; visages et texte sur le processeur.',
        ],
        [
          'Sans GPU',
          'Sans PyTorch, tout en ONNX sur le processeur ; utile sur un ordinateur bien plus rapide que le NAS.',
        ],
      ],
    },
    {
      h3: 'macOS',
    },
    {
      steps: [
        {
          title: 'Installer uv',
          body: [
            {
              code: `curl -LsSf https://astral.sh/uv/install.sh | sh   # ou : brew install uv
# puis ouvrez un nouveau terminal`,
              lang: 'bash',
            },
          ],
        },
        {
          title: 'Récupérer le code',
          body: [
            {
              code: `git clone https://github.com/i-dj/wanmory.git   # miroir en Chine : https://gitee.com/i-dj/wanmory.git
cd wanmory/ml`,
              lang: 'bash',
            },
            {
              p: 'Si git manque, macOS propose d’installer les outils en ligne de commande Xcode ; acceptez et suivez les instructions.',
            },
          ],
        },
        {
          title: 'Installer les dépendances',
          body: [
            {
              code: 'uv sync --extra torch   # la première fois, télécharge Python et PyTorch, quelques minutes',
              lang: 'bash',
            },
          ],
        },
        {
          title: 'Créer un jeton d’accès et démarrer',
          body: [
            {
              code: `export WANMORY_ML_TOKEN=$(openssl rand -hex 24)
echo $WANMORY_ML_TOKEN   # notez-le, Wanmory en a besoin
WANMORY_FACE_MODEL_PRELOAD=1 uv run --extra torch python -m wanmory_ml`,
              lang: 'bash',
            },
            {
              p: 'Prêt quand s’affiche `Uvicorn running on http://0.0.0.0:3003`. Le premier démarrage télécharge le modèle de visages (environ 340 Mo). Si macOS demande si python peut accepter les connexions entrantes, autorisez-le.',
            },
          ],
        },
        {
          title: 'Autoriser les autres ordinateurs',
          body: [
            {
              p: 'Si le pare-feu est actif (Réglages Système → Réseau → Coupe-feu), vérifiez que les connexions entrantes sont autorisées pour python. `ipconfig getifaddr en0` affiche l’adresse IP du Mac.',
            },
          ],
        },
      ],
    },
    {
      h3: 'Windows',
    },
    {
      steps: [
        {
          title: 'Installer uv',
          body: [
            {
              p: 'Ouvrez PowerShell et lancez :',
            },
            {
              code: `powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
# ou : winget install --id=astral-sh.uv -e
# puis ouvrez une nouvelle fenêtre PowerShell`,
              lang: 'powershell',
            },
          ],
        },
        {
          title: 'Récupérer le code',
          body: [
            {
              code: `git clone https://github.com/i-dj/wanmory.git   # pas de Git ? winget install Git.Git
cd wanmory\\ml`,
              lang: 'powershell',
            },
            {
              p: 'Sans Git, vous pouvez aussi cliquer sur Code → Download ZIP sur GitHub, décompresser et ouvrir le dossier ml.',
            },
          ],
        },
        {
          title: 'Installer les dépendances',
          body: [
            {
              code: `uv sync --extra torch
# Avec un GPU NVIDIA, passez à PyTorch version CUDA (le PyTorch de PyPI sous Windows est CPU uniquement)
uv pip install --reinstall torch --index-url https://download.pytorch.org/whl/cu126`,
              lang: 'powershell',
            },
            {
              p: 'Après le passage à la version CUDA, démarrez avec `uv run --no-sync`, sinon uv réinstalle la version CPU. Sans GPU, lancez seulement `uv sync` (sans PyTorch, bien plus léger) et retirez `--extra torch` au démarrage.',
            },
          ],
        },
        {
          title: 'Créer un jeton d’accès et démarrer',
          body: [
            {
              code: `$env:WANMORY_ML_TOKEN = [guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N")
echo $env:WANMORY_ML_TOKEN   # notez-le, Wanmory en a besoin
$env:WANMORY_FACE_MODEL_PRELOAD = "1"
uv run --extra torch python -m wanmory_ml
# avec PyTorch version CUDA, utilisez plutôt : uv run --no-sync python -m wanmory_ml`,
              lang: 'powershell',
            },
          ],
        },
        {
          title: 'Ouvrir le port dans le pare-feu',
          body: [
            {
              p: 'Au premier démarrage, le pare-feu Windows demande l’autorisation : cochez Réseaux privés et autorisez. Ou, dans un PowerShell administrateur :',
            },
            {
              code: 'New-NetFirewallRule -DisplayName "Wanmory AI" -Direction Inbound -Protocol TCP -LocalPort 3003 -Action Allow',
              lang: 'powershell',
            },
            {
              p: '`ipconfig` affiche l’adresse IPv4 du PC.',
            },
          ],
        },
        {
          title: 'Démarrage automatique (facultatif)',
          body: [
            {
              p: 'Créez `start-ai.cmd` dans le dossier ml :',
            },
            {
              code: `@echo off
cd /d %~dp0
set WANMORY_ML_TOKEN=votre-jeton
uv run --extra torch python -m wanmory_ml`,
              lang: 'cmd',
            },
            {
              p: 'Appuyez sur Win+R, tapez `shell:startup` et placez un raccourci vers ce fichier dans le dossier ouvert ; il démarre alors à l’ouverture de session Windows. Pour qu’il tourne sans session ouverte, créez une tâche dans le Planificateur de tâches avec le déclencheur « Au démarrage » et ce start-ai.cmd comme action.',
            },
          ],
        },
      ],
    },
    {
      h3: 'Linux',
    },
    {
      code: `curl -LsSf https://astral.sh/uv/install.sh | sh
git clone https://github.com/i-dj/wanmory.git && cd wanmory/ml
uv sync --extra torch        # sous Linux, le PyTorch de PyPI inclut CUDA ; sans GPU, uv sync suffit
export WANMORY_ML_TOKEN=$(openssl rand -hex 24)
WANMORY_FACE_MODEL_PRELOAD=1 uv run --extra torch python -m wanmory_ml
sudo ufw allow 3003/tcp      # si vous utilisez le pare-feu ufw`,
      lang: 'bash',
    },
    {
      p: 'Pour le lancer au démarrage, écrivez un service systemd : la commande uv run ci-dessus dans `ExecStart` (avec le chemin complet `~/.local/bin/uv`), le dossier ml dans `WorkingDirectory` et le jeton dans `Environment=`.',
    },
    {
      h3: 'Variables d’environnement courantes',
    },
    {
      table: ['Variable', 'Défaut', 'Effet'],
      rows: [
        [
          '`WANMORY_ML_HOST`',
          '0.0.0.0',
          'Adresse d’écoute ; 0.0.0.0 permet aux autres ordinateurs du réseau de se connecter.',
        ],
        ['`WANMORY_ML_PORT`', '3003', 'Port d’écoute.'],
        [
          '`WANMORY_ML_TOKEN`',
          'vide',
          'Jeton d’accès. S’il est défini, chaque requête sauf le contrôle de santé doit envoyer `Authorization: Bearer <jeton>` ; saisissez la même valeur dans Wanmory.',
        ],
        [
          '`WANMORY_MODEL_DIR`',
          '~/.cache/wanmory/models',
          'Emplacement des modèles (sous Windows, .cache\\wanmory\\models dans votre dossier utilisateur).',
        ],
      ],
    },
    {
      p: 'Les autres sont dans [Variables d’environnement du service IA](#ai-env).',
    },
    {
      h3: 'Le connecter dans Wanmory',
    },
    {
      steps: [
        {
          title: 'Choisir le service distant',
          body: [
            {
              p: 'En administrateur, ouvrez les Réglages et choisissez Service distant dans la carte Exécution de l’IA.',
            },
          ],
        },
        {
          title: 'Saisir l’URL et le jeton',
          body: [
            {
              p: 'Dans URL du service, indiquez l’adresse de l’ordinateur qui fait tourner le service IA, par ex. `http://192.168.1.20:3003` ; dans Jeton d’accès, le jeton créé. Cliquez sur Tester la connexion : en cas de succès, la latence et la version s’affichent. Enregistrez ensuite.',
            },
          ],
        },
        {
          title: 'Télécharger les modèles',
          body: [
            {
              p: 'Une fois connecté, si le niveau est Automatique, il est recalculé selon le matériel de cet ordinateur ; téléchargez les modèles nécessaires dans Niveau de modèle, et l’IA commence à traiter les photos.',
            },
          ],
        },
      ],
    },
    {
      note: 'N’utilisez le service IA distant que sur le réseau local ou via un VPN (comme Tailscale), définissez toujours un jeton et n’exposez jamais le port 3003 directement sur Internet. Quand l’ordinateur est éteint ou en veille, le traitement IA se met en pause puis reprend automatiquement.',
      warn: true,
    },
    {
      h2: 'ai-schedule',
    },
    {
      p: 'Après l’import, la lecture des informations et la création des miniatures se font tout de suite ; le moment où tourne la reconnaissance IA (visages, recherche intelligente, texte) se règle dans Réglages → Traitement en arrière-plan, et les changements s’appliquent aussitôt. Le haut de la carte indique si l’IA peut tourner maintenant et, sinon, pourquoi.',
    },
    {
      table: ['Réglage', 'Option', 'Effet'],
      rows: [
        [
          'Quand traiter',
          'Au repos (par défaut)',
          'Met l’IA en pause pendant les envois de photos ou la création des miniatures, et reprend quand c’est calme.',
        ],
        [
          '',
          'À tout moment',
          'Traite en continu sans attendre les envois ; ceux-ci peuvent ralentir. L’attente après les envois ne s’applique pas.',
        ],
        [
          '',
          'La nuit',
          'Uniquement pendant la plage définie (1:00–7:00 par défaut ; elle peut passer minuit, par ex. de 23:00 à 7:00), en évitant aussi les envois dans cette plage.',
        ],
        [
          'Attente après les envois',
          '30 s (par défaut), 5 / 15 / 30 min, 1 / 2 / 4 h',
          'Une fois les envois terminés, l’IA attend ce délai avant de commencer, pour ne pas s’intercaler entre deux lots. S’applique à Au repos et La nuit. Pour attendre jusqu’au lendemain, choisissez La nuit.',
        ],
      ],
    },
    {
      ul: [
        'Si les modèles du niveau actuel ne sont pas téléchargés, l’IA est en pause quel que soit le moment choisi ; elle démarre d’elle-même une fois téléchargés dans Niveau de modèle.',
        'Tant qu’un envoi n’est pas terminé (y compris un envoi qui peut reprendre après une coupure), l’IA attend.',
        'Pendant la pause, les tâches restent dans la file : rien n’est perdu et rien ne compte comme échec.',
      ],
    },
    {
      h2: 'ai-models',
    },
    {
      p: 'Le niveau détermine les modèles utilisés pour les visages et la recherche sémantique. En « Automatique », le système recommande un niveau selon le matériel de la machine du service IA : « Précision » avec un GPU exploitable ; sur processeur seul, « Léger » sous 6 Go de mémoire, sinon « Équilibré ».',
    },
    {
      table: ['Niveau', 'Détection + empreintes de visages', 'Recherche sémantique', 'Matériel adapté'],
      rows: [
        [
          'Précision (quality)',
          'antelopev2 (SCRFD-10G + ArcFace R100)',
          'Chinese-CLIP ViT-H/14 (1024-d)',
          'Mac Apple Silicon, GPU NVIDIA',
        ],
        ['Équilibré (balanced)', 'antelopev2', 'Chinese-CLIP ViT-L/14 (768-d)', 'NAS de classe Intel i5'],
        ['Léger (lite)', 'buffalo_l (ArcFace R50)', 'Chinese-CLIP ViT-B/16 (512-d)', 'N100, Raspberry Pi 5'],
      ],
    },
    {
      ul: [
        'La reconnaissance de texte utilise PP-OCRv6 (RapidOCR) ; ses modèles s’installent avec les dépendances, sans téléchargement séparé.',
        'Après un changement de niveau, les visages de toutes les photos sont redétectés et les vecteurs sémantiques recalculés avec les nouveaux modèles ; la recherche continue d’utiliser les anciens vecteurs entre-temps, et les personnes nommées sont conservées.',
        'Les modèles sont téléchargés dans le dossier ./models monté ; ceux qui ne servent plus peuvent être supprimés pour libérer de la place (sauf le modèle en cours d’utilisation).',
        'Les modèles de visages InsightFace sont réservés à un usage non commercial ; remplacez-les ou obtenez une licence avant tout usage commercial.',
      ],
    },
    {
      h2: 'ai-env',
    },
    {
      table: ['Variable', 'Défaut', 'Description'],
      rows: [
        ['`WANMORY_ML_HOST`', '0.0.0.0', 'Adresse d’écoute.'],
        ['`WANMORY_ML_PORT`', '3003', 'Port d’écoute.'],
        [
          '`WANMORY_ML_TOKEN`',
          'vide',
          'Jeton d’accès ; une fois défini, chaque requête doit inclure Authorization: Bearer.',
        ],
        ['`WANMORY_MODEL_DIR`', '~/.cache/wanmory/models', 'Dossier des modèles ; /models dans l’image.'],
        [
          '`WANMORY_AUTO_DOWNLOAD`',
          '0 dans l’image',
          'Télécharger ou non les modèles automatiquement à la première utilisation.',
        ],
        [
          '`WANMORY_FACE_MODEL_PRELOAD`',
          '—',
          'À 1, charge les modèles de visages au démarrage ; Chinese-CLIP se charge en arrière-plan.',
        ],
        [
          '`WANMORY_UNLOAD_AFTER`',
          '5 / 30 minutes',
          'Secondes d’inactivité avant de décharger un modèle pour libérer la mémoire ; 0 ne décharge jamais. La valeur par défaut dépend de la mémoire de l’hôte.',
        ],
      ],
    },
    {
      h2: 'first-run',
    },
    {
      steps: [
        {
          title: 'Créer l’administrateur',
          body: [
            {
              p: 'À la première visite, le système constate qu’aucun compte n’existe et guide la création d’un administrateur. Les administrateurs peuvent ajouter des membres et modifier les réglages système.',
            },
          ],
        },
        {
          title: 'Télécharger les modèles',
          body: [
            {
              p: 'Ouvrez « Réglages système → IA », confirmez le niveau de modèles et téléchargez-les. Les tâches IA attendent en file jusqu’à ce que les modèles soient prêts.',
            },
          ],
        },
        {
          title: 'Importer des photos',
          body: [
            {
              p: 'Importez via l’app web, ou branchez les photos de votre NAS comme décrit dans [Monter des dossiers photo existants](#library).',
            },
          ],
        },
        {
          title: 'Ajouter des membres',
          body: [
            {
              p: 'Dans « Réglages système → Membres », créez des comptes pour les autres personnes et choisissez le rôle « Membre » ou « Administrateur ».',
            },
          ],
        },
      ],
    },
    {
      h2: 'import',
    },
    {
      ul: [
        'L’import web accepte photos, vidéos, HEIC, RAW (comme DNG) et plus, en sélection multiple ; l’envoi se fait par blocs avec le protocole tus et reprend après une coupure réseau ou un rechargement de la page.',
        'Les fichiers importés sont rangés par année et par mois dans le dossier d’import (par défaut data/upload). Ce dossier se change dans « Réglages système → Dossier d’import » et ne s’applique qu’aux nouveaux imports.',
        'Après l’import, les étapes s’enchaînent : lecture des métadonnées (ExifTool) → miniatures et aperçu de 1440 pixels (libvips / FFmpeg) → vecteurs sémantiques, visages et texte (service IA) → géocodage inverse.',
        'L’indicateur de tâches en haut de la barre latérale affiche, en nombre de photos, l’avancement et le temps restant estimé pour « Importer des photos » et « Reconnaissance IA ».',
      ],
    },
    {
      h2: 'browse',
    },
    {
      table: ['Fonction', 'Description'],
      rows: [
        [
          'Photothèque',
          'Chronologie des photos groupée par mois, avec en haut le carrousel de sélection IA et « Ce jour-là ».',
        ],
        [
          'Recherche en langage naturel',
          'Saisissez une description (comme « photos du troisième anniversaire de bébé ») ; le classement combine texte reconnu, lieu de prise de vue et similarité sémantique Chinese-CLIP. Un nom de catégorie renvoie directement cette catégorie.',
        ],
        [
          'Personnes',
          'Les visages sont regroupés automatiquement ; une personne apparaît dès qu’elle figure sur au moins 3 photos. Nommer, fusionner, indiquer un anniversaire, et voir l’évolution par âge, les lieux et les photos de groupe.',
        ],
        [
          'Albums · Albums intelligents',
          'Les albums réunissent des photos choisies à la main et peuvent être privés ; les albums intelligents rassemblent automatiquement les photos selon la personne, le lieu, la date et d’autres critères.',
        ],
        ['Lieux', 'Affiche les lieux de prise de vue sur une carte d’après le GPS, en vue Carte, Satellite ou Grille.'],
        [
          'Rafales et similaires',
          'Regroupe automatiquement rafales et photos similaires et conseille la meilleure à garder ; « Doublons » liste les fichiers au contenu identique.',
        ],
        [
          'Diaporamas',
          'Lire la photothèque, les albums, les personnes et les souvenirs ; les photos en portrait sont réunies par deux ou trois sur une page, avec musique de fond et transitions.',
        ],
      ],
    },
    {
      h2: 'members-usage',
    },
    {
      table: ['Rôle', 'Droits'],
      rows: [
        [
          'Administrateur',
          'Ajouter et retirer des membres, réinitialiser leurs mots de passe, modifier les réglages système ; peut supprimer n’importe quelle photo.',
        ],
        [
          'Membre',
          'Importer, parcourir et organiser des photos ; ne peut supprimer que ses propres imports ; ne peut pas modifier les réglages système.',
        ],
        [
          'Invité',
          'Avec l’accès invité activé, les visiteurs non connectés consultent le contenu partagé en lecture seule ; albums privés et photos masquées restent invisibles.',
        ],
      ],
    },
    {
      p: 'Les informations sur les personnes (noms, fusions) sont partagées par tous les membres ; le nombre de photos, les vignettes et les pages des personnes sont calculés d’après les photos que chaque membre peut voir, et les photos masquées ne sont visibles que de leur propriétaire.',
    },
    {
      h2: 'settings-members',
    },
    {
      ul: [
        'Membres : à l’ajout, définissez un nom, un mot de passe initial (au moins 4 caractères) et un rôle ; vous pouvez réinitialiser le mot de passe d’un membre ou le retirer.',
        'Historique des connexions : enregistre l’heure, l’appareil et l’IP de chaque connexion, la position étant estimée hors ligne d’après l’IP (ip2region), et conserve les six derniers mois. Visible des administrateurs uniquement.',
        'Dans « Mon compte », chaque membre peut changer son mot de passe et son avatar et voir les appareils sur lesquels il est connecté.',
      ],
    },
    {
      h2: 'settings-ai',
    },
    {
      table: ['Réglage', 'Options', 'Description'],
      rows: [
        [
          'Mode d’exécution IA',
          'Intégré (CPU uniquement) / Service distant',
          'Un service distant demande une adresse et un jeton, et la connexion est testée avant le basculement ; le traitement IA est suspendu tant que le service est indisponible.',
        ],
        [
          'Unité de calcul',
          'Automatique / GPU / CPU uniquement',
          'Sans carte graphique exploitable, seul le CPU est proposé ; changer recharge les modèles, et le traitement IA en cours reprend peu après.',
        ],
        [
          'Niveau de modèles',
          'Automatique / Précision / Équilibré / Léger',
          'Après un changement, toutes les photos sont retraitées avec les nouveaux modèles, avec affichage de l’avancement.',
        ],
        [
          'Gestion des modèles',
          'Télécharger / Supprimer',
          'Liste la taille et l’état de chaque modèle (utilisé, téléchargé, non téléchargé).',
        ],
      ],
    },
    {
      h2: 'settings-perf',
    },
    {
      table: ['Réglage', 'Options', 'Description'],
      rows: [
        [
          'Moment du traitement',
          'Au repos / À tout moment / La nuit',
          'Au repos : pause de l’IA pendant les envois et la création des miniatures ; À tout moment : traitement continu, les envois peuvent ralentir ; La nuit : seulement pendant la plage définie. Voir [Quand l’IA travaille](#ai-schedule).',
        ],
        [
          'Attente après les envois',
          '30 s – 4 h',
          'Délai d’attente de l’IA après la fin des envois ; s’applique à Au repos et La nuit.',
        ],
        [
          'Parallélisme du traitement photo',
          'Nombre',
          'Nombre de photos lues et miniaturisées simultanément ; calculé par défaut d’après les cœurs et la mémoire.',
        ],
        ['Parallélisme IA', 'Nombre', 'Nombre de photos envoyées simultanément au service IA.'],
        ['Fils CPU', 'Nombre', 'Fils CPU utilisés par chaque modèle pour l’inférence.'],
      ],
    },
    {
      p: 'Le haut de la carte affiche en direct l’état de l’IA (en marche, ou raison de la pause). Les modifications s’appliquent immédiatement, sans redémarrage.',
    },
    {
      h2: 'settings-general',
    },
    {
      table: ['Réglage', 'Défaut', 'Description'],
      rows: [
        [
          'Dossier d’import',
          'data/upload',
          'Les fichiers importés sont rangés par année et par mois ; un changement ne s’applique qu’aux nouveaux imports.',
        ],
        [
          'Accès invité',
          'Activé',
          'Permet aux visiteurs non connectés de consulter le contenu partagé. À désactiver pour un accès depuis Internet.',
        ],
        [
          'Cartes en ligne',
          'Activé',
          'Affiche cartes, noms de lieux et recherche de lieux, ce qui envoie la position des photos au service de cartes ; désactivé, seules les coordonnées sont affichées.',
        ],
        [
          'Fournisseur de cartes',
          'Automatique',
          'Automatique : AMap en Chine continentale, OpenStreetMap ailleurs ; l’un ou l’autre peut aussi être imposé.',
        ],
        ['Domaine d’accès', 'wanmory.local', 'Domaine d’accès sur le réseau local ; doit se terminer par .local.'],
      ],
    },
    {
      h2: 'settings-update',
    },
    {
      p: '« Réglages système → Mise à jour » affiche les versions actuelles du backend et du service IA et signale les nouvelles versions. Pour mettre à jour, exécutez dans le dossier contenant `docker-compose.yml` :',
    },
    {
      code: 'docker compose pull && docker compose up -d',
      lang: 'bash',
    },
    {
      p: 'Les migrations de la base s’exécutent automatiquement au démarrage de server. Si vous avez fixé une version avec `WANMORY_VERSION`, modifiez d’abord l’étiquette dans `.env`.',
    },
    {
      note: 'Pour les étapes complètes, voir [Mise à jour](#update).',
    },
    {
      h2: 'update',
    },
    {
      p: 'Quand une nouvelle version sort, Réglages → Mise à jour du système l’indique et affiche les notes de chaque version (aussi sur la page [Versions](/releases/)). La mise à jour ne remplace que le programme ; photos, base de données, réglages et modèles sont conservés.',
    },
    {
      steps: [
        {
          title: 'Aller dans le dossier d’installation',
          body: [
            {
              code: 'cd ~/wanmory   # votre dossier d’installation (celui avec docker-compose.yml et .env)',
              lang: 'bash',
            },
          ],
        },
        {
          title: 'Télécharger les nouvelles images et redémarrer',
          body: [
            {
              code: `docker compose pull
docker compose up -d`,
              lang: 'bash',
            },
            {
              p: 'Wanmory met à jour le schéma de la base au démarrage ; rechargez la page après quelques secondes à une minute.',
            },
          ],
        },
        {
          title: 'Supprimer les anciennes images (facultatif)',
          body: [
            {
              code: 'docker image prune',
              lang: 'bash',
            },
          ],
        },
      ],
    },
    {
      note: 'Si `.env` fixe une version avec `WANMORY_VERSION`, remplacez-la par la nouvelle (ou supprimez la ligne pour la dernière) avant de lancer les commandes. Vous pouvez aussi relancer le script d’installation en gardant la configuration (`Keep the existing configuration` → Y) : même résultat, et il télécharge en plus le dernier `docker-compose.yml`.',
    },
    {
      h2: 'backup',
    },
    {
      p: 'Trois types de données sont à sauvegarder :',
    },
    {
      table: ['Données', 'Emplacement', 'Description'],
      rows: [
        [
          'Base de données',
          'volume nommé pgdata',
          'Métadonnées des photos, personnes, albums, réglages, vecteurs et file de tâches.',
        ],
        [
          'Imports et miniatures',
          './data',
          'Originaux importés (data/upload) et miniatures (data/thumbs) ; les miniatures peuvent être régénérées.',
        ],
        [
          'Dossiers photo',
          'dossiers montés sous /photos',
          'Couverts par le plan de sauvegarde du NAS lui-même ; l’app ne modifie jamais les dossiers montés en lecture seule.',
        ],
      ],
    },
    {
      lang: 'bash',
      code: `# Exporter la base de données
docker compose exec -T postgres pg_dump -U wanmory -Fc wanmory > wanmory-$(date +%F).dump

# Restaurer dans un nouveau déploiement (lancer d'abord docker compose up -d postgres)
docker compose exec -T postgres pg_restore -U wanmory -d wanmory --clean < wanmory-2026-11-10.dump`,
    },
    {
      note: 'Les fichiers de modèles dans ./models n’ont pas besoin d’être sauvegardés ; ils se retéléchargent depuis l’app web.',
    },
    {
      h2: 'reset-password',
    },
    {
      p: 'Quand un membre oublie son mot de passe, un administrateur le réinitialise dans « Réglages système → Membres ». Si l’administrateur oublie le sien, exécutez sur l’hôte de l’app, dans le dossier contenant `docker-compose.yml` :',
    },
    {
      lang: 'bash',
      code: `docker compose exec server wanmory reset-password            # lister les comptes et en choisir un
docker compose exec server wanmory reset-password <nom>       # désigner directement le compte`,
    },
    {
      ul: [
        'La commande liste tous les comptes (nom, rôle, date de création, dernière connexion) ; choisissez-en un par son numéro et saisissez deux fois le nouveau mot de passe.',
        'Après la réinitialisation, ce compte est déconnecté de tous les appareils ; photos et albums ne sont pas touchés.',
        'Cette opération ne se fait que sur l’hôte, l’app web n’en offre pas l’accès. Sans Docker, exécutez wanmory reset-password avec les mêmes variables d’environnement que le serveur, comme DATABASE_URL.',
      ],
    },
    {
      h2: 'troubleshooting',
    },
    {
      table: ['Symptôme', 'À vérifier'],
      rows: [
        [
          'wanmory.local inaccessible',
          'Vérifiez que le service mdns tourne (docker compose ps) ; certains appareils Android ne gèrent pas mDNS, utilisez l’IP ; vérifiez si le port 5353 est pris sur l’hôte.',
        ],
        [
          'Les réglages IA affichent « Connexion impossible, traitement IA suspendu »',
          'En mode intégré, consultez les journaux du conteneur ml (docker compose logs ml) ; en mode distant, vérifiez que l’adresse, le port, le pare-feu et le jeton concordent.',
        ],
        [
          'Aucun résultat dans Personnes ou la recherche',
          'Vérifiez que les modèles sont téléchargés ; dans « Performances », vérifiez si l’IA est en pause à cause du moment de traitement ; consultez l’avancement de la reconnaissance IA dans l’indicateur de tâches.',
        ],
        [
          'Les gros imports échouent',
          'La limite de taille des requêtes du proxy inverse est trop basse ; ajustez client_max_body_size comme indiqué dans « Proxy inverse et accès Internet ».',
        ],
        [
          'Les photos d’un dossier monté n’apparaissent pas',
          'Les dossiers doivent être montés comme sous-dossiers de /photos ; la première analyse a lieu environ 20 secondes après le démarrage, puis toutes les 15 minutes ; les dossiers cachés sont ignorés.',
        ],
        [
          'Téléchargement des images lent ou en échec',
          'Définissez WANMORY_REGISTRY dans .env vers un registre accessible.',
        ],
      ],
    },
    {
      p: 'Consultez les journaux de chaque service avec `docker compose logs -f server` et `docker compose logs -f ml`. Si le problème persiste, signalez-le sur la page [Signaler un problème](/feedback/) en joignant votre numéro de version et les journaux pertinents.',
    },
    {
      h2: 'uninstall',
    },
    {
      p: 'À lancer sur l’ordinateur où tourne Wanmory :',
    },
    {
      code: 'curl -fsSL https://wanmory.com/uninstall.sh | bash',
      lang: 'bash',
    },
    {
      p: 'Par défaut, seuls les conteneurs sont supprimés et toutes les données sont gardées : le script demande pour chaque élément, et Entrée signifie toujours garder (N). Les dossiers photo que vous avez montés (NAS, disques externes) ne sont jamais supprimés.',
    },
    {
      steps: [
        {
          title: 'Locating installation',
          body: [
            {
              p: 'Demande l’`Install directory` ; Entrée prend ~/wanmory. Le dossier doit contenir le `docker-compose.yml` de Wanmory, sinon le script s’arrête. Il liste ensuite le nombre de conteneurs, l’emplacement de la base, les dossiers de données et de modèles avec leur taille, et vos dossiers photo montés (marqués `never deleted`).',
            },
          ],
        },
        {
          title: 'Choose what to remove',
          body: [
            {
              p: 'Les conteneurs et le réseau sont toujours supprimés. Chaque élément ci-dessous est demandé une fois :',
            },
            {
              table: ['Question', 'Ce qui est supprimé'],
              rows: [
                [
                  '`Delete the database`',
                  'La base (volume Docker pgdata, ou le dossier `WANMORY_DB_DIR`) : personnes, albums, réglages, résultats IA et comptes. Irréversible.',
                ],
                [
                  '`Delete the data directory`',
                  'Le dossier de données : miniatures et **les photos originales envoyées par la page web**.',
                ],
                ['`Delete the AI models`', 'Le dossier des modèles IA ; ils se retéléchargent après réinstallation.'],
                [
                  '`Remove the Docker images`',
                  'Les images Docker utilisées par Wanmory (y compris postgres/pgvector) ; elles se retéléchargent.',
                ],
                [
                  '`Delete the configuration files`',
                  '`.env` (avec le mot de passe de la base), `docker-compose.yml`, `docker-compose.override.yml` ; le dossier d’installation est supprimé aussi s’il est vide.',
                ],
              ],
            },
          ],
        },
        {
          title: 'Summary',
          body: [
            {
              p: 'Récapitule ce qui va se passer. Si vous avez choisi de supprimer la base ou le dossier de données, il faut taper `DELETE` en majuscules pour continuer ; toute autre saisie annule sans rien changer. Sinon, `Proceed` est demandé une fois. Si vous gardez la base mais supprimez `.env`, le script rappelle de noter d’abord `WANMORY_DB_PASSWORD`.',
            },
          ],
        },
        {
          title: 'Removing',
          body: [
            {
              p: 'Arrête et supprime les conteneurs, puis efface ce que vous avez choisi. Les fichiers écrits par les conteneurs peuvent appartenir à un autre utilisateur (les anciennes versions écrivaient en uid 1000 ou root) ; si un simple rm est refusé, le script les supprime depuis un conteneur temporaire exécuté en root, et si cela échoue aussi, il vous indique `sudo rm -rf`. Le script refuse de supprimer des chemins qui ne sont manifestement pas à Wanmory, comme /, /home, /volume1 ou votre dossier personnel.',
            },
          ],
        },
      ],
    },
    {
      p: 'Si vous n’avez supprimé que les conteneurs en gardant données et configuration, relancer install.sh dans le même dossier remet tout en place.',
    },
    {
      table: ['Option', 'Effet'],
      rows: [
        ['`--dir DOSSIER`', 'Dossier d’installation, ~/wanmory par défaut (ou définir `WANMORY_DIR`).'],
        [
          '`-y`, `--yes`',
          'Aucune question : supprime seulement conteneurs et réseau, garde toutes les données et la configuration. C’est aussi le comportement sans terminal interactif.',
        ],
        [
          '`--purge`',
          'Aucune question : supprime tout le tableau ci-dessus (sauf vos dossiers photo) sans taper DELETE. À utiliser avec prudence.',
        ],
        ['`--dry-run`', 'Affiche ce qui serait fait sans rien modifier.'],
        ['`-h`, `--help`', 'Affiche l’aide.'],
      ],
    },
  ],
}

export default docs
