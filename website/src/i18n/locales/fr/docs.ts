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
    { h2: 'intro' },
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

    { h2: 'requirements' },
    {
      table: ['Élément', 'Minimum', 'Recommandé'],
      rows: [
        ['Architecture CPU', 'x86_64 (amd64) ou ARM64', '—'],
        ['Processeur', 'Classe Intel N100 / Raspberry Pi 5', 'Classe Intel i5 ou mieux, ou service IA sur une machine avec GPU'],
        ['Mémoire', '4 Go (niveau « Léger » choisi automatiquement)', '8 Go ou plus (niveau « Équilibré »)'],
        ['Disque', 'Environ 1 à 4 Go pour les modèles, plus la place des miniatures', 'Un SSD pour data/ et le volume de la base'],
        ['Logiciels', 'Docker Engine et Docker Compose v2', '—'],
        ['Système', 'Toute distribution Linux qui fait tourner Docker', 'Synology DSM, QNAP QTS, TrueNAS SCALE, Unraid, Ubuntu / Debian'],
      ],
    },
    {
      note: 'Les images sont publiées pour `linux/amd64` et `linux/arm64`, et Docker récupère celle qui correspond à votre architecture. Les conteneurs Docker sous macOS ne peuvent pas utiliser le GPU Apple ; pour l’accélération matérielle sur Mac, voir [Service IA sur une autre machine](#ai-remote).',
    },

    { h2: 'quick-start' },
    { h3: 'Méthode 1 : script d’installation (recommandé)' },
    { p: 'Sur une machine 64 bits équipée de Docker, exécutez :' },
    { code: 'curl -fsSL https://wanmory.com/install.sh | bash', lang: 'bash' },
    { p: 'Le script effectue ensuite les opérations suivantes :' },
    {
      ul: [
        'Vérification de l’environnement : architecture CPU (amd64 / arm64) et espace utilisateur 64 bits, disponibilité de Docker et de Docker Compose v2, mémoire et espace disque libres.',
        'Configuration interactive : dossier d’installation (par défaut ~/wanmory), port d’accès (par défaut 8080, vérifié s’il est libre), domaine local (par défaut wanmory.local), mot de passe de la base (aléatoire par défaut) et emplacement de la base (volume Docker pgdata par défaut, ou un dossier sur un disque local), fuseau horaire (tapez une ville ou une région pour chercher, comme shanghai, tokyo ou 北京, puis choisissez un numéro s’il y a plusieurs résultats).',
        'Emplacements de stockage : dossier de données (miniatures, aperçus et photos importées, par défaut ./data) et dossier des modèles IA (par défaut ./models).',
        'Les questions et messages du script sont en anglais pour s’afficher correctement dans tous les terminaux de NAS.',
        'Dossiers photo existants : ajoutez-en autant que vous voulez, en choisissant pour chacun un montage en lecture seule (recommandé) ou en lecture-écriture.',
        'Écrit `.env` (droits 600) ; si des dossiers photo sont indiqués, il écrit aussi `docker-compose.override.yml`, que Docker Compose fusionne automatiquement.',
        'Télécharge le docker-compose.yml officiel (via Gitee si GitHub est injoignable), valide la configuration, récupère les images, démarre les services et affiche l’adresse dès que tout est prêt.',
      ],
    },
    {
      table: ['Option / variable', 'Description'],
      rows: [
        ['`-y`', 'Aucune question, toutes les valeurs par défaut (mot de passe de la base aléatoire). Idéal pour les déploiements automatisés.'],
        ['`--dir DOSSIER`', 'Définit le dossier d’installation.'],
        ['`--dry-run`', 'Vérifie seulement l’environnement et écrit les fichiers de configuration, sans télécharger d’image ni rien démarrer.'],
        [
          '`WANMORY_PORT`',
          'Prédéfinit le port ; même principe pour WANMORY_DOMAIN, WANMORY_DB_PASSWORD, WANMORY_TZ, WANMORY_DATA_DIR, WANMORY_MODELS_DIR, WANMORY_DB_DIR, WANMORY_REGISTRY et WANMORY_VERSION.',
        ],
        ['`WANMORY_PHOTOS`', 'Dossiers photo séparés par des virgules, montés en lecture seule par défaut ; ajoutez :rw après un chemin pour la lecture-écriture, par ex. /volume1/photo,/mnt/usb:rw.'],
      ],
    },
    {
      code: `# Exemple : installation non interactive dans /opt/wanmory, port 9000, avec les dossiers photo du NAS
curl -fsSL https://wanmory.com/install.sh | WANMORY_PORT=9000 WANMORY_PHOTOS=/volume1/photo,/volume2/family bash -s -- -y --dir /opt/wanmory`,
      lang: 'bash',
    },
    {
      note: 'Si vous relancez le script et qu’un .env existe déjà dans le dossier d’installation, la configuration existante est conservée par défaut (le mot de passe de la base ne peut pas être changé librement après le premier démarrage) ; seul le fichier Compose est mis à jour et les services redémarrés, ce qui sert aussi de mise à jour.',
    },
    { h3: 'Méthode 2 : installation manuelle' },
    {
      steps: [
        {
          title: 'Créer un dossier et récupérer le fichier Compose',
          body: [
            { p: 'Créez un dossier pour le fichier Compose, les données et les modèles, puis téléchargez le `docker-compose.yml` officiel :' },
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
            { p: 'Créez un `.env` dans le même dossier pour remplacer les valeurs par défaut. En production, changez impérativement le mot de passe de la base :' },
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
            { p: 'Le premier démarrage télécharge les images et exécute automatiquement les migrations de la base :' },
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

    { h2: 'compose' },
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

    { h2: 'env' },
    { h3: '.env (variables Compose)' },
    { p: 'Ces variables sont utilisées dans `docker-compose.yml` ; placez-les dans le `.env` du même dossier pour les appliquer :' },
    {
      table: ['Variable', 'Défaut', 'Description'],
      rows: [
        ['`WANMORY_DB_PASSWORD`', 'wanmory', 'Mot de passe PostgreSQL, utilisé aussi dans la DATABASE_URL de server. Le changer après le premier démarrage impose de modifier aussi le mot de passe de l’utilisateur dans la base.'],
        ['`WANMORY_PORT`', '8080', 'Port publié sur l’hôte, utilisé aussi pour l’adresse affichée dans l’app web.'],
        ['`WANMORY_TZ`', 'Asia/Shanghai', 'Fuseau horaire utilisé quand les données EXIF n’en contiennent pas.'],
        ['`WANMORY_VERSION`', 'latest', 'Étiquette d’image ; fixez une version précise pour choisir le moment des mises à jour.'],
        ['`WANMORY_REGISTRY`', 'ghcr.io/i-dj', 'Registre d’images. Remplacez-le par un registre accessible si ghcr.io est inaccessible.'],
        ['`WANMORY_DATA_DIR`', './data', 'Dossier de données : originaux importés (upload/) et miniatures et aperçus (thumbs/), monté sur /data dans le conteneur.'],
        ['`WANMORY_MODELS_DIR`', './models', 'Dossier des modèles IA, monté sur /models dans le conteneur ml.'],
        [
          '`WANMORY_DB_DIR`',
          'volume pgdata',
          'Dossier de la base. Sans valeur, le volume Docker pgdata est utilisé ; avec le chemin d’un dossier sur un disque local, la base y est stockée directement. N’utilisez pas de partage réseau.',
        ],
        ['`WANMORY_DOMAIN`', 'wanmory.local', 'Domaine local initial, doit se terminer par .local. Une fois modifié dans « Réglages système → Domaine d’accès », c’est le réglage qui prime.'],
      ],
    },
    { h3: 'Conteneur server (facultatif)' },
    {
      p: '`DATABASE_URL`, `WANMORY_ML_URL`, `WANMORY_MDNS` et `WANMORY_HTTP_PUBLIC_PORT` sont déjà définis dans le fichier Compose, avec leur rôle. Les variables suivantes n’y figurent pas ; ajoutez-les au besoin dans l’`environment` de `server` :',
    },
    {
      table: ['Variable', 'Défaut', 'Description'],
      rows: [
        ['`WANMORY_WORKERS`', 'auto', 'Parallélisme par défaut des tâches de métadonnées et de miniatures. Sans valeur, calculé d’après les cœurs et la mémoire ; ajustable dans « Performances » de l’app web.'],
        ['`WANMORY_ML_TOKEN`', 'vide', 'Jeton d’accès du service IA intégré ; doit correspondre à la variable du même nom dans le conteneur ml. Généralement inutile.'],
        ['`WANMORY_FACE_MODEL`', 'antelopev2', 'Modèle de visages utilisé quand aucun niveau n’a été choisi.'],
        ['`WANMORY_CLIP_MODEL`', 'chinese-clip-vit-h-14', 'Modèle de recherche sémantique utilisé quand aucun niveau n’a été choisi.'],
        ['`WANMORY_STORAGE_ROOTS`', 'dossier de données', 'Dossiers consultables et sélectionnables dans l’app web, séparés par des deux-points.'],
      ],
    },

    { h2: 'library' },
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
    { p: 'Après modification, lancez `docker compose up -d`. La première analyse commence environ 20 secondes après le redémarrage du conteneur.' },
    {
      ul: [
        '**Le montage en lecture seule (:ro) est recommandé** : rien n’est écrit dans ces dossiers. Supprimer une photo dans l’app la déplace seulement vers « Supprimées récemment », la suppression définitive n’efface jamais le fichier d’origine, et les analyses suivantes ne le réimportent pas. Pour les dossiers en lecture-écriture, la suppression définitive efface aussi le fichier d’origine.',
        'Les fichiers au contenu identique ne sont importés qu’une fois (dédoublonnage par somme SHA-1), y compris les fichiers déjà importés et les doublons entre dossiers.',
        'Les dossiers cachés et les dossiers système de NAS (.xxx, @eaDir, #recycle, etc.) sont ignorés automatiquement.',
        'Les photos venant des dossiers photo n’appartiennent à aucun membre ; seuls les administrateurs peuvent les supprimer.',
      ],
    },

    { h2: 'mdns' },
    {
      p: 'Le service `mdns` fonctionne en mode réseau hôte et annonce le domaine d’accès sur le réseau local (par défaut `wanmory.local`). macOS, iOS, iPadOS et Windows 10 ou plus récent y accèdent via `http://wanmory.local:8080` sans configurer le routeur. Le domaine se change dans « Réglages système → Domaine d’accès » et doit se terminer par `.local`.',
    },
    {
      note: 'Certains appareils Android ne résolvent pas les noms mDNS ; utilisez alors l’adresse IP. Si le port 5353 est déjà pris (par exemple sur Synology), le service mdns peut ne pas démarrer ; utilisez là aussi l’IP. Le reste n’est pas affecté.',
      warn: true,
    },

    { h2: 'proxy' },
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

    { h2: 'ai-overview' },
    {
      p: 'Le service IA est un service HTTP sans état : il reçoit des aperçus de 1440 pixels du backend et renvoie visages, vecteurs et texte reconnu. Il n’accède jamais à la base et ne stocke aucun fichier. Le backend propose deux modes, à choisir dans « Réglages système → IA → Mode d’exécution IA » :',
    },
    {
      table: ['Mode', 'Où il tourne', 'Adapté à'],
      rows: [
        ['Intégré (CPU uniquement)', 'Conteneur ml dans Compose, joignable uniquement en interne', 'Prêt à l’emploi ; NAS ou mini-PC avec une photothèque modeste, ou si un premier traitement plus long est acceptable'],
        ['Service distant', 'Une autre machine du réseau local, qui exécute directement le service Python', 'Mac Apple Silicon (CoreML / MPS) ou machine avec GPU NVIDIA (CUDA), pour raccourcir nettement le premier traitement'],
      ],
    },
    { p: 'Si le service IA est indisponible, les tâches IA restent en file et ne sont plus prises, sans consommer de relances ; le traitement reprend automatiquement au retour du service. La navigation, les imports et le reste ne sont pas affectés.' },

    { h2: 'ai-remote' },
    { h3: 'Méthode 1 : directement sur un Mac ou une machine avec GPU (recommandé)' },
    {
      p: 'Exécuté directement, le service profite de l’accélération matérielle : sur Apple Silicon, les modèles de visages utilisent CoreML et Chinese-CLIP utilise MPS ; sur GPU NVIDIA, Chinese-CLIP utilise CUDA en demi-précision (environ 1,9 Go de mémoire vidéo / vive). Installez d’abord [uv](https://docs.astral.sh/uv/).',
    },
    {
      lang: 'bash',
      code: `git clone https://github.com/i-dj/wanmory.git
cd wanmory/ml
uv sync --extra torch                 # installer les dépendances PyTorch (recherche sémantique accélérée par GPU)

# Générer un jeton d'accès ; le backend et le service IA utilisent la même valeur
export WANMORY_ML_TOKEN=$(openssl rand -hex 24)
echo $WANMORY_ML_TOKEN

WANMORY_FACE_MODEL_PRELOAD=1 uv run --extra torch python -m wanmory_ml
# Écoute sur 0.0.0.0:3003 par défaut ; modifiable avec WANMORY_ML_HOST / WANMORY_ML_PORT`,
    },
    { h3: 'Méthode 2 : image Docker sur une autre machine' },
    { p: 'Pour une machine x86 plus puissante sans GPU exploitable ; l’image n’utilise que le processeur :' },
    {
      lang: 'bash',
      code: `docker run -d --name wanmory-ml --restart unless-stopped \\
  -p 3003:3003 \\
  -e WANMORY_ML_TOKEN=<jeton-d-acces> \\
  -v $PWD/models:/models \\
  ghcr.io/i-dj/wanmory-ml:latest`,
    },
    { h3: 'Activer le service distant dans le backend' },
    {
      steps: [
        { title: 'Ouvrir les réglages IA', body: [{ p: 'En tant qu’administrateur, ouvrez « Réglages système → IA → Mode d’exécution IA » et choisissez « Service distant ».' }] },
        {
          title: 'Saisir l’adresse et le jeton',
          body: [{ p: 'L’adresse ressemble à `http://192.168.1.20:3003` ; saisissez le jeton généré à l’étape précédente. La connexion est testée avant l’enregistrement, avec affichage de la latence et de la version du service.' }],
        },
        { title: 'Vérifier le niveau et les modèles', body: [{ p: 'Une fois connecté, un niveau « Automatique » est réévalué selon le matériel de la machine distante ; téléchargez les modèles nécessaires dans « Niveau de modèles ».' }] },
      ],
    },
    { note: 'Ne rendez le service IA distant accessible que sur le réseau local ou via un VPN (comme Tailscale), et définissez toujours un jeton. Pour une connexion par Internet, passez par un proxy inverse HTTPS.', warn: true },

    { h2: 'ai-models' },
    {
      p: 'Le niveau détermine les modèles utilisés pour les visages et la recherche sémantique. En « Automatique », le système recommande un niveau selon le matériel de la machine du service IA : « Précision » avec un GPU exploitable ; sur processeur seul, « Léger » sous 6 Go de mémoire, sinon « Équilibré ».',
    },
    {
      table: ['Niveau', 'Détection + empreintes de visages', 'Recherche sémantique', 'Matériel adapté'],
      rows: [
        ['Précision (quality)', 'antelopev2 (SCRFD-10G + ArcFace R100)', 'Chinese-CLIP ViT-H/14 (1024-d)', 'Mac Apple Silicon, GPU NVIDIA'],
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

    { h2: 'ai-env' },
    {
      table: ['Variable', 'Défaut', 'Description'],
      rows: [
        ['`WANMORY_ML_HOST`', '0.0.0.0', 'Adresse d’écoute.'],
        ['`WANMORY_ML_PORT`', '3003', 'Port d’écoute.'],
        ['`WANMORY_ML_TOKEN`', 'vide', 'Jeton d’accès ; une fois défini, chaque requête doit inclure Authorization: Bearer.'],
        ['`WANMORY_MODEL_DIR`', '~/.cache/wanmory/models', 'Dossier des modèles ; /models dans l’image.'],
        ['`WANMORY_AUTO_DOWNLOAD`', '0 dans l’image', 'Télécharger ou non les modèles automatiquement à la première utilisation.'],
        ['`WANMORY_FACE_MODEL_PRELOAD`', '—', 'À 1, charge les modèles de visages au démarrage ; Chinese-CLIP se charge en arrière-plan.'],
        ['`WANMORY_UNLOAD_AFTER`', '5 / 30 minutes', 'Secondes d’inactivité avant de décharger un modèle pour libérer la mémoire ; 0 ne décharge jamais. La valeur par défaut dépend de la mémoire de l’hôte.'],
      ],
    },

    { h2: 'first-run' },
    {
      steps: [
        { title: 'Créer l’administrateur', body: [{ p: 'À la première visite, le système constate qu’aucun compte n’existe et guide la création d’un administrateur. Les administrateurs peuvent ajouter des membres et modifier les réglages système.' }] },
        { title: 'Télécharger les modèles', body: [{ p: 'Ouvrez « Réglages système → IA », confirmez le niveau de modèles et téléchargez-les. Les tâches IA attendent en file jusqu’à ce que les modèles soient prêts.' }] },
        { title: 'Importer des photos', body: [{ p: 'Importez via l’app web, ou branchez les photos de votre NAS comme décrit dans [Monter des dossiers photo existants](#library).' }] },
        { title: 'Ajouter des membres', body: [{ p: 'Dans « Réglages système → Membres », créez des comptes pour les autres personnes et choisissez le rôle « Membre » ou « Administrateur ».' }] },
      ],
    },

    { h2: 'import' },
    {
      ul: [
        'L’import web accepte photos, vidéos, HEIC, RAW (comme DNG) et plus, en sélection multiple ; l’envoi se fait par blocs avec le protocole tus et reprend après une coupure réseau ou un rechargement de la page.',
        'Les fichiers importés sont rangés par année et par mois dans le dossier d’import (par défaut data/upload). Ce dossier se change dans « Réglages système → Dossier d’import » et ne s’applique qu’aux nouveaux imports.',
        'Après l’import, les étapes s’enchaînent : lecture des métadonnées (ExifTool) → miniatures et aperçu de 1440 pixels (libvips / FFmpeg) → vecteurs sémantiques, visages et texte (service IA) → géocodage inverse.',
        'L’indicateur de tâches en haut de la barre latérale affiche, en nombre de photos, l’avancement et le temps restant estimé pour « Importer des photos » et « Reconnaissance IA ».',
      ],
    },

    { h2: 'browse' },
    {
      table: ['Fonction', 'Description'],
      rows: [
        ['Photothèque', 'Chronologie des photos groupée par mois, avec en haut le carrousel de sélection IA et « Ce jour-là ».'],
        ['Recherche en langage naturel', 'Saisissez une description (comme « photos du troisième anniversaire de bébé ») ; le classement combine texte reconnu, lieu de prise de vue et similarité sémantique Chinese-CLIP. Un nom de catégorie renvoie directement cette catégorie.'],
        ['Personnes', 'Les visages sont regroupés automatiquement ; une personne apparaît dès qu’elle figure sur au moins 3 photos. Nommer, fusionner, indiquer un anniversaire, et voir l’évolution par âge, les lieux et les photos de groupe.'],
        ['Albums · Albums intelligents', 'Les albums réunissent des photos choisies à la main et peuvent être privés ; les albums intelligents rassemblent automatiquement les photos selon la personne, le lieu, la date et d’autres critères.'],
        ['Lieux', 'Affiche les lieux de prise de vue sur une carte d’après le GPS, en vue Carte, Satellite ou Grille.'],
        ['Rafales et similaires', 'Regroupe automatiquement rafales et photos similaires et conseille la meilleure à garder ; « Doublons » liste les fichiers au contenu identique.'],
        ['Diaporamas', 'Lire la photothèque, les albums, les personnes et les souvenirs ; les photos en portrait sont réunies par deux ou trois sur une page, avec musique de fond et transitions.'],
      ],
    },

    { h2: 'members-usage' },
    {
      table: ['Rôle', 'Droits'],
      rows: [
        ['Administrateur', 'Ajouter et retirer des membres, réinitialiser leurs mots de passe, modifier les réglages système ; peut supprimer n’importe quelle photo.'],
        ['Membre', 'Importer, parcourir et organiser des photos ; ne peut supprimer que ses propres imports ; ne peut pas modifier les réglages système.'],
        ['Invité', 'Avec l’accès invité activé, les visiteurs non connectés consultent le contenu partagé en lecture seule ; albums privés et photos masquées restent invisibles.'],
      ],
    },
    { p: 'Les informations sur les personnes (noms, fusions) sont partagées par tous les membres ; le nombre de photos, les vignettes et les pages des personnes sont calculés d’après les photos que chaque membre peut voir, et les photos masquées ne sont visibles que de leur propriétaire.' },

    { h2: 'settings-members' },
    {
      ul: [
        'Membres : à l’ajout, définissez un nom, un mot de passe initial (au moins 4 caractères) et un rôle ; vous pouvez réinitialiser le mot de passe d’un membre ou le retirer.',
        'Historique des connexions : enregistre l’heure, l’appareil et l’IP de chaque connexion, la position étant estimée hors ligne d’après l’IP (ip2region), et conserve les six derniers mois. Visible des administrateurs uniquement.',
        'Dans « Mon compte », chaque membre peut changer son mot de passe et son avatar et voir les appareils sur lesquels il est connecté.',
      ],
    },

    { h2: 'settings-ai' },
    {
      table: ['Réglage', 'Options', 'Description'],
      rows: [
        ['Mode d’exécution IA', 'Intégré (CPU uniquement) / Service distant', 'Un service distant demande une adresse et un jeton, et la connexion est testée avant le basculement ; le traitement IA est suspendu tant que le service est indisponible.'],
        ['Unité de calcul', 'Automatique / GPU / CPU uniquement', 'Sans carte graphique exploitable, seul le CPU est proposé ; changer recharge les modèles, et le traitement IA en cours reprend peu après.'],
        ['Niveau de modèles', 'Automatique / Précision / Équilibré / Léger', 'Après un changement, toutes les photos sont retraitées avec les nouveaux modèles, avec affichage de l’avancement.'],
        ['Gestion des modèles', 'Télécharger / Supprimer', 'Liste la taille et l’état de chaque modèle (utilisé, téléchargé, non téléchargé).'],
      ],
    },

    { h2: 'settings-perf' },
    {
      table: ['Réglage', 'Options', 'Description'],
      rows: [
        ['Moment du traitement', 'Au repos / À tout moment / La nuit', 'Au repos : le traitement IA s’interrompt pendant les imports et la génération des miniatures ; À tout moment : traitement continu, les imports peuvent ralentir ; La nuit : uniquement sur la plage horaire définie.'],
        ['Parallélisme du traitement photo', 'Nombre', 'Nombre de photos lues et miniaturisées simultanément ; calculé par défaut d’après les cœurs et la mémoire.'],
        ['Parallélisme IA', 'Nombre', 'Nombre de photos envoyées simultanément au service IA.'],
        ['Fils CPU', 'Nombre', 'Fils CPU utilisés par chaque modèle pour l’inférence.'],
      ],
    },
    { p: 'Le haut de la carte affiche en direct l’état de l’IA (en marche, ou raison de la pause). Les modifications s’appliquent immédiatement, sans redémarrage.' },

    { h2: 'settings-general' },
    {
      table: ['Réglage', 'Défaut', 'Description'],
      rows: [
        ['Dossier d’import', 'data/upload', 'Les fichiers importés sont rangés par année et par mois ; un changement ne s’applique qu’aux nouveaux imports.'],
        ['Accès invité', 'Activé', 'Permet aux visiteurs non connectés de consulter le contenu partagé. À désactiver pour un accès depuis Internet.'],
        ['Cartes en ligne', 'Activé', 'Affiche cartes, noms de lieux et recherche de lieux, ce qui envoie la position des photos au service de cartes ; désactivé, seules les coordonnées sont affichées.'],
        ['Fournisseur de cartes', 'Automatique', 'Automatique : AMap en Chine continentale, OpenStreetMap ailleurs ; l’un ou l’autre peut aussi être imposé.'],
        ['Domaine d’accès', 'wanmory.local', 'Domaine d’accès sur le réseau local ; doit se terminer par .local.'],
      ],
    },

    { h2: 'settings-update' },
    { p: '« Réglages système → Mise à jour » affiche les versions actuelles du backend et du service IA et signale les nouvelles versions. Pour mettre à jour, exécutez dans le dossier contenant `docker-compose.yml` :' },
    { code: 'docker compose pull && docker compose up -d', lang: 'bash' },
    { p: 'Les migrations de la base s’exécutent automatiquement au démarrage de server. Si vous avez fixé une version avec `WANMORY_VERSION`, modifiez d’abord l’étiquette dans `.env`.' },

    { h2: 'backup' },
    { p: 'Trois types de données sont à sauvegarder :' },
    {
      table: ['Données', 'Emplacement', 'Description'],
      rows: [
        ['Base de données', 'volume nommé pgdata', 'Métadonnées des photos, personnes, albums, réglages, vecteurs et file de tâches.'],
        ['Imports et miniatures', './data', 'Originaux importés (data/upload) et miniatures (data/thumbs) ; les miniatures peuvent être régénérées.'],
        ['Dossiers photo', 'dossiers montés sous /photos', 'Couverts par le plan de sauvegarde du NAS lui-même ; l’app ne modifie jamais les dossiers montés en lecture seule.'],
      ],
    },
    {
      lang: 'bash',
      code: `# Exporter la base de données
docker compose exec -T postgres pg_dump -U wanmory -Fc wanmory > wanmory-$(date +%F).dump

# Restaurer dans un nouveau déploiement (lancer d'abord docker compose up -d postgres)
docker compose exec -T postgres pg_restore -U wanmory -d wanmory --clean < wanmory-2026-11-10.dump`,
    },
    { note: 'Les fichiers de modèles dans ./models n’ont pas besoin d’être sauvegardés ; ils se retéléchargent depuis l’app web.' },

    { h2: 'reset-password' },
    { p: 'Quand un membre oublie son mot de passe, un administrateur le réinitialise dans « Réglages système → Membres ». Si l’administrateur oublie le sien, exécutez sur l’hôte de l’app, dans le dossier contenant `docker-compose.yml` :' },
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

    { h2: 'troubleshooting' },
    {
      table: ['Symptôme', 'À vérifier'],
      rows: [
        ['wanmory.local inaccessible', 'Vérifiez que le service mdns tourne (docker compose ps) ; certains appareils Android ne gèrent pas mDNS, utilisez l’IP ; vérifiez si le port 5353 est pris sur l’hôte.'],
        ['Les réglages IA affichent « Connexion impossible, traitement IA suspendu »', 'En mode intégré, consultez les journaux du conteneur ml (docker compose logs ml) ; en mode distant, vérifiez que l’adresse, le port, le pare-feu et le jeton concordent.'],
        ['Aucun résultat dans Personnes ou la recherche', 'Vérifiez que les modèles sont téléchargés ; dans « Performances », vérifiez si l’IA est en pause à cause du moment de traitement ; consultez l’avancement de la reconnaissance IA dans l’indicateur de tâches.'],
        ['Les gros imports échouent', 'La limite de taille des requêtes du proxy inverse est trop basse ; ajustez client_max_body_size comme indiqué dans « Proxy inverse et accès Internet ».'],
        ['Les photos d’un dossier monté n’apparaissent pas', 'Les dossiers doivent être montés comme sous-dossiers de /photos ; la première analyse a lieu environ 20 secondes après le démarrage, puis toutes les 15 minutes ; les dossiers cachés sont ignorés.'],
        ['Téléchargement des images lent ou en échec', 'Définissez WANMORY_REGISTRY dans .env vers un registre accessible.'],
      ],
    },
    {
      p: 'Consultez les journaux de chaque service avec `docker compose logs -f server` et `docker compose logs -f ml`. Si le problème persiste, signalez-le sur la page [Signaler un problème](/feedback/) en joignant votre numéro de version et les journaux pertinents.',
    },

    { h2: 'uninstall' },
    { p: 'Exécutez le script de désinstallation sur l’hôte où tourne Wanmory :' },
    { code: 'curl -fsSL https://wanmory.com/uninstall.sh | bash', lang: 'bash' },
    {
      p: 'Le script lit d’abord le .env du dossier d’installation et liste les conteneurs, la base, le dossier de données et les modèles IA avec l’espace qu’ils occupent, ainsi que les dossiers photo montés. Il arrête et supprime ensuite les conteneurs et le réseau, puis demande élément par élément s’il faut supprimer (tout est conservé par défaut) :',
    },
    {
      table: ['Élément', 'Description'],
      rows: [
        ['Base de données', 'Le volume Docker pgdata, ou le dossier défini par WANMORY_DB_DIR. Une fois supprimés, personnes, albums, réglages et résultats IA sont irrécupérables.'],
        ['Dossier de données', 'Miniatures, aperçus et photos originales importées via l’app web.'],
        ['Modèles IA', 'Peuvent être retéléchargés depuis l’app web après réinstallation.'],
        ['Images Docker', 'Y compris l’image postgres/pgvector ; elles peuvent être retéléchargées. Les images encore utilisées par d’autres conteneurs ne sont pas supprimées.'],
        ['Fichiers de configuration', '.env (qui contient le mot de passe de la base), docker-compose.yml et docker-compose.override.yml ; le dossier est supprimé aussi une fois vide.'],
      ],
    },
    {
      ul: [
        'Les dossiers photo montés (NAS, disques externes) ne sont jamais supprimés.',
        'Supprimer la base ou le dossier de données exige de taper DELETE pour confirmer.',
        'Si vous ne supprimez que les conteneurs en gardant les données, relancer install.sh dans le même dossier restaure tout ; si vous supprimez .env en gardant la base, notez d’abord le WANMORY_DB_PASSWORD qu’il contient.',
      ],
    },
    {
      table: ['Option', 'Description'],
      rows: [
        ['`--dir DOSSIER`', 'Définit le dossier d’installation ; par défaut ~/wanmory.'],
        ['`-y`', 'Non interactif : supprime uniquement les conteneurs et le réseau, en conservant toutes les données et la configuration.'],
        ['`--purge`', 'Non interactif : supprime tous les éléments du tableau ci-dessus (sauf les dossiers photo).'],
        ['`--dry-run`', 'Affiche seulement ce qui serait fait, sans rien modifier.'],
      ],
    },
  ],
}

export default docs
