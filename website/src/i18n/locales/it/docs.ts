import type { DocsDict } from '../zh/docs'

// Italiano · Documentazione

const docs: DocsDict = {
  title: 'Documentazione',
  onThisPage: 'In questa sezione',
  reportIssue: 'Segnala un errore nella documentazione ↗',
  architecture: 'Architettura →',
  backToTop: 'Torna su ↑',
  sectionLink: 'Link a questa sezione',
  toc: [
    {
      key: 'install',
      title: 'Installazione',
      groups: [
        {
          group: 'Per iniziare',
          items: [
            ['intro', 'Introduzione'],
            ['requirements', 'Requisiti di sistema'],
            ['quick-start', 'Installazione rapida'],
          ],
        },
        {
          group: 'Configurazione',
          items: [
            ['compose', 'docker-compose.yml spiegato'],
            ['env', 'Variabili d’ambiente'],
            ['library', 'Montare cartelle di foto esistenti'],
            ['mdns', 'Dominio locale (mDNS)'],
            ['proxy', 'Reverse proxy e accesso da internet'],
          ],
        },
        {
          group: 'Servizio IA',
          items: [
            ['ai-overview', 'Modalità di esecuzione'],
            ['ai-remote', 'Servizio IA su un’altra macchina'],
            ['ai-models', 'Livelli dei modelli e download'],
            ['ai-env', 'Variabili del servizio IA'],
          ],
        },
      ],
    },
    {
      key: 'guide',
      title: 'Guida all’uso',
      groups: [
        {
          group: 'Le basi',
          items: [
            ['first-run', 'Configurazione iniziale e primo accesso'],
            ['import', 'Caricamento e importazione'],
            ['browse', 'Sfogliare, cercare e riordinare'],
            ['members-usage', 'Membri e permessi'],
          ],
        },
        {
          group: 'Impostazioni di sistema',
          items: [
            ['settings-members', 'Membri e cronologia accessi'],
            ['settings-ai', 'Impostazioni IA'],
            ['settings-perf', 'Prestazioni e risorse'],
            ['settings-general', 'Spazio, ospiti, mappe e dominio'],
            ['settings-update', 'Aggiornamento di sistema'],
          ],
        },
      ],
    },
    {
      key: 'maintain',
      title: 'Manutenzione',
      groups: [
        {
          group: 'Manutenzione',
          items: [
            ['backup', 'Backup e ripristino'],
            ['reset-password', 'Reimpostare la password dell’amministratore'],
            ['troubleshooting', 'Risoluzione dei problemi'],
            ['uninstall', 'Disinstallazione'],
          ],
        },
      ],
    },
  ],
  intro:
    'Questa documentazione è pensata per gli amministratori che ospitano Wanmory su un NAS, un server domestico o un computer personale. Copre installazione, configurazione, servizio IA, uso quotidiano, impostazioni di sistema e manutenzione. Per la progettazione del sistema e gli algoritmi, vedi [Architettura](/architecture/).',
  blocks: [
    { h2: 'intro' },
    {
      p: 'Wanmory è una fototeca privata con IA, open source e self-hosted. È composta da quattro container: il backend in Go (`server`), il servizio di inferenza IA in Python (`ml`), il database PostgreSQL + pgvector (`postgres`) e `mdns`, che annuncia il dominio locale. Foto, metadati, vettori e coda dei lavori sono tutti salvati in locale, senza dipendere da alcun servizio cloud.',
    },
    {
      ul: [
        'Gestione foto: cronologia raggruppata per mese, album e album intelligenti, riordino di raffiche e foto simili, mappa dei viaggi e presentazioni.',
        'Funzioni IA: rilevamento e raggruppamento dei volti, ricerca in linguaggio naturale (Chinese-CLIP), riconoscimento del testo (PP-OCR) e valutazione estetica (scelte dell’IA).',
        'Più membri: account individuali, permessi di eliminazione in base a chi ha caricato e cronologia degli accessi.',
      ],
    },

    { h2: 'requirements' },
    {
      table: ['Voce', 'Minimo', 'Consigliato'],
      rows: [
        ['Architettura CPU', 'x86_64 (amd64) o ARM64', '—'],
        ['Processore', 'Classe Intel N100 / Raspberry Pi 5', 'Classe Intel i5 o superiore, oppure servizio IA su una macchina con GPU'],
        ['Memoria', '4 GB (viene scelto in automatico il livello «Leggero»)', '8 GB o più (livello «Equilibrato»)'],
        ['Disco', 'Circa 1–4 GB per i modelli, più lo spazio per le miniature', 'Un SSD per data/ e per il volume del database'],
        ['Software', 'Docker Engine e Docker Compose v2', '—'],
        ['Sistema operativo', 'Qualsiasi distribuzione Linux che esegua Docker', 'Synology DSM, QNAP QTS, TrueNAS SCALE, Unraid, Ubuntu / Debian'],
      ],
    },
    {
      note: 'Le immagini sono pubblicate per `linux/amd64` e `linux/arm64`, e Docker scarica quella adatta alla tua architettura. I container Docker su macOS non possono usare la GPU Apple; per l’accelerazione hardware su Mac, vedi [Servizio IA su un’altra macchina](#ai-remote).',
    },

    { h2: 'quick-start' },
    { h3: 'Metodo 1: script di installazione (consigliato)' },
    { p: 'Su una macchina a 64 bit con Docker installato, esegui:' },
    { code: 'curl -fsSL https://wanmory.com/install.sh | bash', lang: 'bash' },
    { p: 'Lo script fa quanto segue, nell’ordine:' },
    {
      ul: [
        'Controllo dell’ambiente: architettura CPU (amd64 / arm64) e userland a 64 bit, disponibilità di Docker e Docker Compose v2, memoria e spazio su disco liberi.',
        'Configurazione interattiva: cartella di installazione (predefinita ~/wanmory), porta di accesso (predefinita 8080, controlla se è occupata), dominio locale (predefinito wanmory.local), password del database (casuale per impostazione predefinita) e posizione del database (volume Docker pgdata per impostazione predefinita, oppure una cartella su un disco locale), fuso orario (scrivi una città o una regione per cercarla, come shanghai, tokyo o 北京, e scegli un numero se ci sono più risultati).',
        'Posizioni di archiviazione: cartella dei dati (miniature, anteprime e foto caricate, predefinita ./data) e cartella dei modelli IA (predefinita ./models).',
        'Le domande e i messaggi dello script sono in inglese, così si vedono correttamente in qualsiasi terminale di NAS.',
        'Cartelle di foto esistenti: aggiungine quante vuoi, scegliendo per ciascuna il montaggio in sola lettura (consigliato) o in lettura e scrittura.',
        'Crea `.env` (permessi 600); se indichi cartelle di foto, crea anche `docker-compose.override.yml`, che Docker Compose unisce automaticamente.',
        'Scarica il docker-compose.yml ufficiale (da Gitee se GitHub non risponde), verifica la configurazione, scarica le immagini, avvia i servizi e mostra l’indirizzo quando tutto è pronto.',
      ],
    },
    {
      table: ['Opzione / variabile', 'Descrizione'],
      rows: [
        ['`-y`', 'Nessuna domanda, tutti i valori predefiniti (password del database casuale). Adatto alle installazioni automatiche.'],
        ['`--dir CARTELLA`', 'Imposta la cartella di installazione.'],
        ['`--dry-run`', 'Controlla solo l’ambiente e crea i file di configurazione, senza scaricare immagini né avviare nulla.'],
        [
          '`WANMORY_PORT`',
          'Imposta in anticipo la porta; allo stesso modo funzionano WANMORY_DOMAIN, WANMORY_DB_PASSWORD, WANMORY_TZ, WANMORY_DATA_DIR, WANMORY_MODELS_DIR, WANMORY_DB_DIR, WANMORY_REGISTRY e WANMORY_VERSION.',
        ],
        ['`WANMORY_PHOTOS`', 'Cartelle di foto separate da virgole, montate in sola lettura per impostazione predefinita; aggiungi :rw dopo un percorso per lettura e scrittura, ad es. /volume1/photo,/mnt/usb:rw.'],
      ],
    },
    {
      code: `# Esempio: installazione non interattiva in /opt/wanmory sulla porta 9000, con le cartelle foto del NAS
curl -fsSL https://wanmory.com/install.sh | WANMORY_PORT=9000 WANMORY_PHOTOS=/volume1/photo,/volume2/family bash -s -- -y --dir /opt/wanmory`,
      lang: 'bash',
    },
    {
      note: 'Se esegui di nuovo lo script e nella cartella di installazione c’è già un .env, per impostazione predefinita la configurazione esistente viene mantenuta (la password del database non si può cambiare liberamente dopo il primo avvio); viene aggiornato solo il file Compose e i servizi ripartono, quindi funziona anche come aggiornamento.',
    },
    { h3: 'Metodo 2: installazione manuale' },
    {
      steps: [
        {
          title: 'Crea una cartella e scarica il file Compose',
          body: [
            { p: 'Crea una cartella per il file Compose, i dati e i modelli, e scarica il `docker-compose.yml` ufficiale:' },
            {
              code: `mkdir -p ~/wanmory && cd ~/wanmory
curl -fsSLO https://raw.githubusercontent.com/i-dj/wanmory/main/docker/docker-compose.yml`,
              lang: 'bash',
            },
          ],
        },
        {
          title: '(Facoltativo) Scrivi un .env',
          body: [
            { p: 'Crea un `.env` nella stessa cartella per cambiare i valori predefiniti. In produzione cambia assolutamente la password del database:' },
            {
              code: `WANMORY_DB_PASSWORD=sostituisci-con-una-stringa-casuale
WANMORY_PORT=8080
WANMORY_TZ=Europe/Rome
WANMORY_VERSION=latest`,
              lang: '.env',
            },
          ],
        },
        {
          title: 'Avvia i servizi',
          body: [
            { p: 'Il primo avvio scarica le immagini ed esegue in automatico le migrazioni del database:' },
            {
              code: `docker compose up -d
docker compose ps        # verifica che tutti e quattro i servizi siano running / healthy`,
              lang: 'bash',
            },
          ],
        },
        {
          title: 'Apri e configura',
          body: [
            {
              p: 'Apri `http://wanmory.local:8080` (o `http://<IP dell’host>:8080`) nel browser, crea l’account amministratore come indicato, poi scarica i modelli in «Impostazioni di sistema → IA». Una volta scaricati, le foto esistenti entrano da sole nella coda IA.',
            },
          ],
        },
      ],
    },

    { h2: 'compose' },
    {
      p: 'Il file Compose ufficiale definisce quattro servizi: il database `postgres`, il backend `server`, l’annuncio del dominio locale `mdns` e il servizio IA integrato `ml`. Il ruolo di ogni impostazione è annotato direttamente nel file:',
    },
    {
      lang: 'yaml',
      code: `# File Compose ufficiale di Wanmory: esegui docker compose up -d nella cartella di questo file
# Le variabili nella forma \${VAR:-predefinito} si leggono dal .env nella stessa cartella; se mancano, vale il predefinito

services:
  # ── Database: PostgreSQL 17 + pgvector ───────────────────────────
  # Conserva metadati delle foto, persone, album, impostazioni, coda dei lavori e vettori (indice HNSW)
  # Nessuna porta pubblicata; raggiungibile solo dalla rete interna di Compose
  postgres:
    image: pgvector/pgvector:pg17
    environment:
      POSTGRES_USER: wanmory
      POSTGRES_PASSWORD: \${WANMORY_DB_PASSWORD:-wanmory}   # in produzione cambiala assolutamente nel .env
      POSTGRES_DB: wanmory
    volumes:
      - \${WANMORY_DB_DIR:-pgdata}:/var/lib/postgresql/data  # volume con nome pgdata per impostazione predefinita; con WANMORY_DB_DIR, quella cartella. Includila nei backup
    healthcheck:                             # server attende questo controllo e parte quando il database è pronto
      test: ["CMD", "pg_isready", "-U", "wanmory", "-d", "wanmory"]
      interval: 5s
      timeout: 3s
      retries: 20
    restart: unless-stopped

  # ── Backend: programma Go con l'app web incorporata ──────────────
  # Gestisce API, caricamenti (tus), pianificazione dei lavori, miniature e permessi; migra il database all'avvio
  server:
    image: \${WANMORY_REGISTRY:-ghcr.io/i-dj}/wanmory-server:\${WANMORY_VERSION:-latest}
    environment:
      DATABASE_URL: postgres://wanmory:\${WANMORY_DB_PASSWORD:-wanmory}@postgres:5432/wanmory
      WANMORY_ML_URL: http://ml:3003         # indirizzo del servizio IA integrato; uno remoto si imposta in «Impostazioni IA»
      TZ: \${WANMORY_TZ:-Asia/Shanghai}       # fuso orario usato se l'EXIF non lo indica
      WANMORY_MDNS: "off"                    # sulla rete bridge questo container non riceve il multicast; il dominio lo annuncia il servizio mdns qui sotto
      WANMORY_HTTP_PUBLIC_PORT: \${WANMORY_PORT:-8080}   # porta mostrata nell'app web; deve coincidere con la mappatura delle porte
      WANMORY_DOMAIN: \${WANMORY_DOMAIN:-wanmory.local}  # dominio locale iniziale; una volta cambiato nelle impostazioni web, vale l'impostazione
    ports:
      - "\${WANMORY_PORT:-8080}:8080"         # porta dell'host:porta del container
    volumes:
      - \${WANMORY_DATA_DIR:-./data}:/data    # upload/ contiene gli originali caricati, thumbs/ le miniature e le anteprime da 1440 px
      # Monta le cartelle di foto esistenti come sottocartelle di /photos, quante vuoi; :ro = sola lettura; scansionate ogni 15 minuti
      # - /mnt/nas/photos:/photos/nas:ro
      # - /media/usb/fotocamera:/photos/usb:ro
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  # ── Annuncio del dominio locale (mDNS) ───────────────────────────
  # Stessa immagine di server, esegue solo il sottocomando mdns; annuncia wanmory.local (modificabile nell'app web)
  mdns:
    image: \${WANMORY_REGISTRY:-ghcr.io/i-dj}/wanmory-server:\${WANMORY_VERSION:-latest}
    command: ["mdns"]
    network_mode: host                       # serve la rete dell'host per inviare e ricevere multicast in rete locale
    environment:
      WANMORY_URL: http://127.0.0.1:\${WANMORY_PORT:-8080}   # chiede periodicamente a server il dominio attuale
      WANMORY_DOMAIN: \${WANMORY_DOMAIN:-wanmory.local}  # annunciato finché server non risponde
    depends_on:
      - server
    restart: unless-stopped

  # ── Servizio IA integrato: FastAPI + ONNX Runtime, solo CPU ──────
  # Senza stato; riceve le anteprime da server e restituisce volti, vettori e testo; nessuna porta pubblicata
  ml:
    image: \${WANMORY_REGISTRY:-ghcr.io/i-dj}/wanmory-ml:\${WANMORY_VERSION:-latest}
    volumes:
      - \${WANMORY_MODELS_DIR:-./models}:/models  # conserva i modelli: ricreare il container non li riscarica
    environment:
      WANMORY_MODEL_DIR: /models
      WANMORY_AUTO_DOWNLOAD: "0"             # nessun download automatico; un amministratore conferma prima licenze e spazio nell'app web
    restart: unless-stopped

volumes:
  pgdata:`,
    },

    { h2: 'env' },
    { h3: '.env (variabili di Compose)' },
    { p: 'Queste variabili sono usate in `docker-compose.yml`; scrivile nel `.env` della stessa cartella per applicarle:' },
    {
      table: ['Variabile', 'Predefinito', 'Descrizione'],
      rows: [
        ['`WANMORY_DB_PASSWORD`', 'wanmory', 'Password di PostgreSQL, usata anche nella DATABASE_URL di server. Cambiarla dopo il primo avvio richiede di cambiare anche la password dell’utente nel database.'],
        ['`WANMORY_PORT`', '8080', 'Porta pubblicata sull’host, usata anche per l’indirizzo mostrato nell’app web.'],
        ['`WANMORY_TZ`', 'Asia/Shanghai', 'Fuso orario usato quando i dati EXIF non lo contengono.'],
        ['`WANMORY_VERSION`', 'latest', 'Tag dell’immagine; fissa una versione precisa per decidere tu quando aggiornare.'],
        ['`WANMORY_REGISTRY`', 'ghcr.io/i-dj', 'Registro delle immagini. Sostituiscilo con uno raggiungibile se ghcr.io non lo è.'],
        ['`WANMORY_DATA_DIR`', './data', 'Cartella dei dati: originali caricati (upload/) e miniature e anteprime (thumbs/), montata su /data nel container.'],
        ['`WANMORY_MODELS_DIR`', './models', 'Cartella dei modelli IA, montata su /models nel container ml.'],
        [
          '`WANMORY_DB_DIR`',
          'volume pgdata',
          'Cartella del database. Se non impostata si usa il volume Docker pgdata; con il percorso di una cartella su un disco locale, il database viene salvato direttamente lì. Non usare cartelle condivise in rete.',
        ],
        ['`WANMORY_DOMAIN`', 'wanmory.local', 'Dominio locale iniziale, deve terminare con .local. Una volta cambiato in «Impostazioni di sistema → Dominio di accesso», vale l’impostazione.'],
      ],
    },
    { h3: 'Container server (facoltativo)' },
    {
      p: '`DATABASE_URL`, `WANMORY_ML_URL`, `WANMORY_MDNS` e `WANMORY_HTTP_PUBLIC_PORT` sono già impostate nel file Compose con il loro scopo annotato. Le variabili seguenti non sono nel file predefinito; aggiungile all’`environment` di `server` se servono:',
    },
    {
      table: ['Variabile', 'Predefinito', 'Descrizione'],
      rows: [
        ['`WANMORY_WORKERS`', 'automatico', 'Concorrenza predefinita dei lavori di metadati e miniature. Se non impostata, si calcola da core e memoria; regolabile in «Prestazioni» nell’app web.'],
        ['`WANMORY_ML_TOKEN`', 'vuoto', 'Token di accesso del servizio IA integrato; deve coincidere con l’omonima variabile del container ml. Di solito non serve.'],
        ['`WANMORY_FACE_MODEL`', 'antelopev2', 'Modello per i volti usato se non è stato scelto alcun livello.'],
        ['`WANMORY_CLIP_MODEL`', 'chinese-clip-vit-h-14', 'Modello di ricerca semantica usato se non è stato scelto alcun livello.'],
        ['`WANMORY_STORAGE_ROOTS`', 'cartella dei dati', 'Cartelle che si possono sfogliare e scegliere nell’app web, separate da due punti.'],
      ],
    },

    { h2: 'library' },
    {
      p: 'Le foto già presenti su un NAS o un disco esterno non vanno caricate. Monta la cartella come sottocartella di `/photos` nel container: viene scansionata ogni 15 minuti e i nuovi file vengono **importati sul posto** (senza copiarli né spostarli), poi passano per metadati, miniature ed elaborazione IA come le foto caricate.',
    },
    {
      lang: 'yaml',
      code: `  server:
    volumes:
      - ./data:/data
      - /mnt/nas/photos:/photos/nas:ro       # :ro monta in sola lettura
      - /media/usb/fotocamera:/photos/usb:ro
      - /home/io/Immagini:/photos/pictures    # montaggio in lettura e scrittura`,
    },
    { p: 'Dopo la modifica esegui `docker compose up -d`. La prima scansione parte circa 20 secondi dopo il riavvio del container.' },
    {
      ul: [
        '**Si consiglia il montaggio in sola lettura (:ro)**: il sistema non scrive nulla in queste cartelle. Eliminare una foto nell’app la sposta solo in «Eliminate di recente», l’eliminazione definitiva non cancella mai il file originale e le scansioni successive non lo reimportano. Per le cartelle in lettura e scrittura, l’eliminazione definitiva cancella anche il file originale.',
        'I file con contenuto identico vengono importati una sola volta (confronto tramite checksum SHA-1), compresi quelli già caricati e i duplicati tra cartelle diverse.',
        'Le cartelle nascoste e le cartelle di sistema del NAS (.xxx, @eaDir, #recycle ecc.) vengono saltate automaticamente.',
        'Le foto importate dalle cartelle non appartengono ad alcun membro; solo gli amministratori possono eliminarle.',
      ],
    },

    { h2: 'mdns' },
    {
      p: 'Il servizio `mdns` gira in modalità rete dell’host e annuncia il dominio di accesso in rete locale (predefinito `wanmory.local`). macOS, iOS, iPadOS e Windows 10 o successivi raggiungono `http://wanmory.local:8080` senza configurare il router. Il dominio si cambia in «Impostazioni di sistema → Dominio di accesso» e deve terminare con `.local`.',
    },
    {
      note: 'Alcuni dispositivi Android non risolvono i nomi mDNS; usa l’indirizzo IP. Se la porta 5353 è già occupata (ad esempio su Synology), il servizio mdns può non partire; anche in questo caso usa l’IP. Le altre funzioni non ne risentono.',
      warn: true,
    },

    { h2: 'proxy' },
    {
      p: 'I caricamenti web usano il protocollo riprendibile [tus](https://tus.io) (`/api/uploads/`) con blocchi da 16 MB. Dietro un reverse proxy, togli il limite di dimensione delle richieste e disattiva il buffering delle richieste. Esempio Nginx:',
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
    client_max_body_size 0;          # nessun limite di dimensione (almeno 20m)
    proxy_request_buffering off;     # inoltro in streaming, senza salvare sul disco del proxy
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
}`,
    },
    {
      note: 'Prima di esporlo su internet: usa HTTPS, disattiva l’accesso ospiti nelle impostazioni di sistema e imposta password robuste per tutti i membri. Il piano gratuito di Cloudflare limita ogni richiesta a 100 MB, quindi i blocchi da 16 MB non richiedono altro.',
      warn: true,
    },

    { h2: 'ai-overview' },
    {
      p: 'Il servizio IA è un servizio HTTP senza stato: riceve dal backend anteprime da 1440 pixel e restituisce volti, vettori e testo riconosciuto. Non accede mai al database e non salva file. Il backend prevede due modalità, che si cambiano in «Impostazioni di sistema → IA → Modalità di esecuzione IA»:',
    },
    {
      table: ['Modalità', 'Dove gira', 'Adatta a'],
      rows: [
        ['Integrata (solo CPU)', 'Il container ml in Compose, raggiungibile solo dalla rete interna', 'Pronta all’uso; NAS o mini PC con una fototeca contenuta, o se una prima elaborazione più lunga è accettabile'],
        ['Servizio remoto', 'Un’altra macchina in rete locale che esegue direttamente il servizio Python', 'Mac con Apple Silicon (CoreML / MPS) o macchina con GPU NVIDIA (CUDA), per accorciare molto la prima elaborazione'],
      ],
    },
    { p: 'Se il servizio IA non è disponibile, i lavori IA restano in coda e non vengono più presi, senza consumare tentativi; quando il servizio torna, l’elaborazione riprende da sola. Navigazione, caricamenti e il resto non ne risentono.' },

    { h2: 'ai-remote' },
    { h3: 'Metodo 1: direttamente su un Mac o una macchina con GPU (consigliato)' },
    {
      p: 'Eseguito direttamente, il servizio sfrutta l’accelerazione hardware: su Apple Silicon i modelli per i volti usano CoreML e Chinese-CLIP usa MPS; sulle GPU NVIDIA Chinese-CLIP usa CUDA a mezza precisione (circa 1,9 GB di VRAM / memoria). Installa prima [uv](https://docs.astral.sh/uv/).',
    },
    {
      lang: 'bash',
      code: `git clone https://github.com/i-dj/wanmory.git
cd wanmory/ml
uv sync --extra torch                 # installa le dipendenze PyTorch (ricerca semantica accelerata da GPU)

# Genera un token di accesso; backend e servizio IA usano lo stesso valore
export WANMORY_ML_TOKEN=$(openssl rand -hex 24)
echo $WANMORY_ML_TOKEN

WANMORY_FACE_MODEL_PRELOAD=1 uv run --extra torch python -m wanmory_ml
# Ascolta su 0.0.0.0:3003 per impostazione predefinita; si cambia con WANMORY_ML_HOST / WANMORY_ML_PORT`,
    },
    { h3: 'Metodo 2: l’immagine Docker su un’altra macchina' },
    { p: 'Per una macchina x86 più potente senza GPU utilizzabile; l’immagine usa solo la CPU:' },
    {
      lang: 'bash',
      code: `docker run -d --name wanmory-ml --restart unless-stopped \\
  -p 3003:3003 \\
  -e WANMORY_ML_TOKEN=<token-di-accesso> \\
  -v $PWD/models:/models \\
  ghcr.io/i-dj/wanmory-ml:latest`,
    },
    { h3: 'Attivare il servizio remoto nel backend' },
    {
      steps: [
        { title: 'Apri le impostazioni IA', body: [{ p: 'Come amministratore, vai in «Impostazioni di sistema → IA → Modalità di esecuzione IA» e scegli «Servizio remoto».' }] },
        {
          title: 'Inserisci indirizzo e token',
          body: [{ p: 'L’indirizzo ha la forma `http://192.168.1.20:3003`; inserisci il token generato al passaggio precedente. Prima di salvare la connessione viene provata, con latenza e versione del servizio.' }],
        },
        { title: 'Conferma livello e modelli', body: [{ p: 'Una volta connesso, un livello «Automatico» viene ricalcolato in base all’hardware della macchina remota; scarica i modelli necessari in «Livello dei modelli».' }] },
      ],
    },
    { note: 'Rendi il servizio IA remoto raggiungibile solo in rete locale o tramite VPN (come Tailscale) e imposta sempre un token. Per collegarti via internet, passa da un reverse proxy con HTTPS.', warn: true },

    { h2: 'ai-models' },
    {
      p: 'Il livello determina quali modelli si usano per volti e ricerca semantica. Con «Automatico», il sistema consiglia un livello in base all’hardware della macchina del servizio IA: «Alta precisione» con una GPU utilizzabile; con sola CPU, «Leggero» sotto i 6 GB di memoria, altrimenti «Equilibrato».',
    },
    {
      table: ['Livello', 'Rilevamento + tratti dei volti', 'Ricerca semantica', 'Hardware adatto'],
      rows: [
        ['Alta precisione (quality)', 'antelopev2 (SCRFD-10G + ArcFace R100)', 'Chinese-CLIP ViT-H/14 (1024-d)', 'Mac con Apple Silicon, GPU NVIDIA'],
        ['Equilibrato (balanced)', 'antelopev2', 'Chinese-CLIP ViT-L/14 (768-d)', 'NAS classe Intel i5'],
        ['Leggero (lite)', 'buffalo_l (ArcFace R50)', 'Chinese-CLIP ViT-B/16 (512-d)', 'N100, Raspberry Pi 5'],
      ],
    },
    {
      ul: [
        'Il riconoscimento del testo usa PP-OCRv6 (RapidOCR); i suoi modelli si installano con le dipendenze, senza download a parte.',
        'Dopo il cambio di livello, i volti di tutte le foto vengono rilevati di nuovo e i vettori semantici ricalcolati con i nuovi modelli; nel frattempo la ricerca continua con i vettori vecchi e le persone con nome restano.',
        'I modelli vengono scaricati nella cartella montata ./models, e quelli non più usati si possono eliminare per liberare spazio (il modello in uso non si può eliminare).',
        'I modelli per i volti InsightFace sono solo per uso non commerciale; sostituiscili o ottieni una licenza prima di qualsiasi uso commerciale.',
      ],
    },

    { h2: 'ai-env' },
    {
      table: ['Variabile', 'Predefinito', 'Descrizione'],
      rows: [
        ['`WANMORY_ML_HOST`', '0.0.0.0', 'Indirizzo di ascolto.'],
        ['`WANMORY_ML_PORT`', '3003', 'Porta di ascolto.'],
        ['`WANMORY_ML_TOKEN`', 'vuoto', 'Token di accesso; se impostato, ogni richiesta deve includere Authorization: Bearer.'],
        ['`WANMORY_MODEL_DIR`', '~/.cache/wanmory/models', 'Cartella dei modelli; /models nell’immagine.'],
        ['`WANMORY_AUTO_DOWNLOAD`', '0 nell’immagine', 'Se scaricare in automatico i modelli al primo uso.'],
        ['`WANMORY_FACE_MODEL_PRELOAD`', '—', 'Con 1, carica i modelli per i volti all’avvio; Chinese-CLIP si carica in background.'],
        ['`WANMORY_UNLOAD_AFTER`', '5 / 30 minuti', 'Secondi di inattività prima di scaricare un modello per liberare memoria; 0 non lo scarica mai. Il predefinito dipende dalla memoria dell’host.'],
      ],
    },

    { h2: 'first-run' },
    {
      steps: [
        { title: 'Crea l’amministratore', body: [{ p: 'Al primo accesso il sistema vede che non ci sono account e guida nella creazione di un amministratore. Gli amministratori possono aggiungere membri e cambiare le impostazioni di sistema.' }] },
        { title: 'Scarica i modelli', body: [{ p: 'Vai in «Impostazioni di sistema → IA», conferma il livello dei modelli e scaricali. Finché non sono pronti, i lavori IA aspettano in coda.' }] },
        { title: 'Importa le foto', body: [{ p: 'Caricale dall’app web oppure collega le foto del NAS come descritto in [Montare cartelle di foto esistenti](#library).' }] },
        { title: 'Aggiungi membri', body: [{ p: 'In «Impostazioni di sistema → Membri», crea gli account delle altre persone e scegli il ruolo «Membro» o «Amministratore».' }] },
      ],
    },

    { h2: 'import' },
    {
      ul: [
        'Il caricamento web accetta foto, video, HEIC, RAW (come DNG) e altro, con selezione multipla; il caricamento avviene a blocchi con il protocollo tus e riprende dopo un’interruzione di rete o un ricaricamento della pagina.',
        'I file caricati vengono salvati per anno e mese nella cartella dei caricamenti (predefinita data/upload). La cartella si cambia in «Impostazioni di sistema → Cartella dei caricamenti» e vale solo per i nuovi caricamenti.',
        'Dopo l’importazione si eseguono nell’ordine: lettura dei metadati (ExifTool) → miniature e anteprima da 1440 pixel (libvips / FFmpeg) → vettori semantici, volti e testo (servizio IA) → geocodifica inversa.',
        'L’indicatore dei lavori in cima alla barra laterale mostra, in numero di foto, avanzamento e tempo residuo stimato di «Importazione foto» e «Riconoscimento IA».',
      ],
    },

    { h2: 'browse' },
    {
      table: ['Funzione', 'Descrizione'],
      rows: [
        ['Libreria', 'Cronologia delle foto raggruppata per mese, con in alto il carosello delle scelte IA e «Accadde oggi».'],
        ['Ricerca in linguaggio naturale', 'Scrivi una descrizione (come «foto del terzo compleanno del bimbo»); i risultati si ordinano combinando testo riconosciuto, luogo dello scatto e similarità semantica di Chinese-CLIP. Scrivere il nome di una categoria restituisce direttamente quella categoria.'],
        ['Persone', 'I volti si raggruppano in automatico; una persona compare quando è presente in almeno 3 foto. Dai nomi, unisci, imposta compleanni e guarda la crescita per età, i luoghi e le foto di gruppo.'],
        ['Album · Album intelligenti', 'Gli album contengono foto scelte a mano e possono essere privati; gli album intelligenti raccolgono le foto da soli per persona, luogo, data e altre condizioni.'],
        ['Luoghi', 'Mostra su una mappa dove è stata scattata ogni foto grazie al GPS, con le viste Mappa, Satellite e Griglia.'],
        ['Raffiche e simili', 'Raggruppa in automatico raffiche e foto simili e consiglia la migliore da tenere; «Duplicati» elenca i file con contenuto identico.'],
        ['Presentazioni', 'Riproduci libreria, album, persone e ricordi; le foto verticali vengono affiancate due o tre per pagina, con musica di sottofondo e transizioni.'],
      ],
    },

    { h2: 'members-usage' },
    {
      table: ['Ruolo', 'Permessi'],
      rows: [
        ['Amministratore', 'Aggiunge e rimuove membri, reimposta le loro password e cambia le impostazioni di sistema; può eliminare qualsiasi foto.'],
        ['Membro', 'Carica, sfoglia e riordina foto; può eliminare solo le proprie; non può cambiare le impostazioni di sistema.'],
        ['Ospite', 'Con l’accesso ospiti attivo, chi non ha effettuato l’accesso può vedere i contenuti condivisi in sola lettura; album privati e foto nascoste non sono visibili.'],
      ],
    },
    { p: 'Le informazioni sulle persone (nomi, unioni) sono comuni a tutti i membri; numero di foto, copertine e pagine delle persone si calcolano sulle foto che ogni membro può vedere, e le foto nascoste le vede solo chi le ha nascoste.' },

    { h2: 'settings-members' },
    {
      ul: [
        'Membri: quando ne aggiungi uno, imposti nome, password iniziale (almeno 4 caratteri) e ruolo; puoi reimpostare la password di un membro o rimuoverlo.',
        'Cronologia accessi: registra ora, dispositivo e IP di ogni accesso, con la posizione stimata offline dall’IP (ip2region), e conserva gli ultimi sei mesi. La vedono solo gli amministratori.',
        'In «Il mio account» ogni membro può cambiare password e avatar e vedere i dispositivi su cui ha effettuato l’accesso.',
      ],
    },

    { h2: 'settings-ai' },
    {
      table: ['Impostazione', 'Opzioni', 'Descrizione'],
      rows: [
        ['Modalità di esecuzione IA', 'Integrata (solo CPU) / Servizio remoto', 'Un servizio remoto richiede indirizzo e token, e la connessione viene provata prima del cambio; se il servizio non è disponibile l’elaborazione IA si mette in pausa.'],
        ['Dispositivo di calcolo', 'Automatico / GPU / Solo CPU', 'Senza scheda video utilizzabile si può scegliere solo la CPU; il cambio ricarica i modelli e l’elaborazione IA in corso riprende poco dopo.'],
        ['Livello dei modelli', 'Automatico / Alta precisione / Equilibrato / Leggero', 'Dopo il cambio tutte le foto vengono rielaborate con i nuovi modelli, con l’avanzamento visibile.'],
        ['Gestione dei modelli', 'Scarica / Elimina', 'Elenca dimensione e stato di ogni modello (in uso, scaricato, non scaricato).'],
      ],
    },

    { h2: 'settings-perf' },
    {
      table: ['Impostazione', 'Opzioni', 'Descrizione'],
      rows: [
        ['Quando elaborare', 'A riposo / Sempre / Di notte', 'A riposo: l’IA si mette in pausa durante caricamenti e generazione delle miniature; Sempre: elabora di continuo, i caricamenti possono rallentare; Di notte: solo nella fascia oraria impostata.'],
        ['Concorrenza elaborazione foto', 'Numero', 'Quante foto vengono lette e miniaturizzate contemporaneamente; il predefinito si calcola da core e memoria.'],
        ['Concorrenza IA', 'Numero', 'Quante foto vengono inviate contemporaneamente al servizio IA.'],
        ['Thread della CPU', 'Numero', 'Thread della CPU usati da ogni modello per l’inferenza.'],
      ],
    },
    { p: 'In cima alla scheda si vede in tempo reale lo stato dell’IA (in funzione o motivo della pausa). Le modifiche valgono subito, senza riavvio.' },

    { h2: 'settings-general' },
    {
      table: ['Impostazione', 'Predefinito', 'Descrizione'],
      rows: [
        ['Cartella dei caricamenti', 'data/upload', 'I file caricati vengono salvati per anno e mese; le modifiche valgono solo per i nuovi caricamenti.'],
        ['Accesso ospiti', 'Attivo', 'Permette di vedere i contenuti condivisi senza accedere. Meglio disattivarlo con l’accesso da internet.'],
        ['Mappe online', 'Attivo', 'Mostra mappe, nomi dei luoghi e ricerca dei luoghi, inviando la posizione delle foto al servizio di mappe; se disattivato, si vedono solo le coordinate.'],
        ['Fornitore delle mappe', 'Automatico', 'Automatico: AMap nella Cina continentale, OpenStreetMap altrove; si può anche fissarne uno.'],
        ['Dominio di accesso', 'wanmory.local', 'Dominio di accesso in rete locale; deve terminare con .local.'],
      ],
    },

    { h2: 'settings-update' },
    { p: '«Impostazioni di sistema → Aggiornamento di sistema» mostra le versioni attuali del backend e del servizio IA e segnala quelle nuove. Per aggiornare, esegui nella cartella che contiene `docker-compose.yml`:' },
    { code: 'docker compose pull && docker compose up -d', lang: 'bash' },
    { p: 'Le migrazioni del database partono da sole all’avvio di server. Se hai fissato una versione con `WANMORY_VERSION`, cambia prima il tag nel `.env`.' },

    { h2: 'backup' },
    { p: 'I dati da salvare sono di tre tipi:' },
    {
      table: ['Dati', 'Posizione', 'Descrizione'],
      rows: [
        ['Database', 'volume con nome pgdata', 'Metadati delle foto, persone, album, impostazioni, vettori e coda dei lavori.'],
        ['Caricamenti e miniature', './data', 'Originali caricati (data/upload) e miniature (data/thumbs); le miniature si possono rigenerare.'],
        ['Cartelle di foto', 'cartelle montate in /photos', 'Coperte dal piano di backup del NAS stesso; l’app non modifica mai le cartelle montate in sola lettura.'],
      ],
    },
    {
      lang: 'bash',
      code: `# Esportare il database
docker compose exec -T postgres pg_dump -U wanmory -Fc wanmory > wanmory-$(date +%F).dump

# Ripristinare in una nuova installazione (prima esegui docker compose up -d postgres)
docker compose exec -T postgres pg_restore -U wanmory -d wanmory --clean < wanmory-2026-11-10.dump`,
    },
    { note: 'I file dei modelli in ./models non vanno salvati; si possono riscaricare dall’app web.' },

    { h2: 'reset-password' },
    { p: 'Quando un membro dimentica la password, un amministratore la reimposta in «Impostazioni di sistema → Membri». Se l’amministratore dimentica la propria, esegui sull’host dell’app, nella cartella che contiene `docker-compose.yml`:' },
    {
      lang: 'bash',
      code: `docker compose exec server wanmory reset-password            # elenca gli account e scegline uno
docker compose exec server wanmory reset-password <nome>      # indica direttamente l'account`,
    },
    {
      ul: [
        'Il comando elenca tutti gli account (nome, ruolo, data di creazione, ultimo accesso); scegline uno con il numero e inserisci due volte la nuova password.',
        'Dopo la reimpostazione l’account viene disconnesso da tutti i dispositivi; foto e album non cambiano.',
        'Si può fare solo sull’host, l’app web non lo prevede. Senza Docker, esegui wanmory reset-password con le stesse variabili d’ambiente del server, come DATABASE_URL.',
      ],
    },

    { h2: 'troubleshooting' },
    {
      table: ['Sintomo', 'Cosa controllare'],
      rows: [
        ['wanmory.local non raggiungibile', 'Verifica che il servizio mdns sia attivo (docker compose ps); alcuni Android non supportano mDNS, usa l’IP; controlla se la porta 5353 è occupata sull’host.'],
        ['Le impostazioni IA mostrano «Connessione impossibile, elaborazione IA in pausa»', 'In modalità integrata guarda i log del container ml (docker compose logs ml); in modalità remota verifica che indirizzo, porta, firewall e token coincidano.'],
        ['Nessun risultato in Persone o nella ricerca', 'Verifica che i modelli siano scaricati; in «Prestazioni» controlla se l’IA è in pausa per l’orario di elaborazione; guarda l’avanzamento del riconoscimento nell’indicatore dei lavori.'],
        ['I caricamenti grandi falliscono', 'Il limite di dimensione delle richieste del reverse proxy è troppo basso; regola client_max_body_size come in «Reverse proxy e accesso da internet».'],
        ['Le foto di una cartella montata non compaiono', 'Le cartelle vanno montate come sottocartelle di /photos; la prima scansione avviene circa 20 secondi dopo l’avvio, poi ogni 15 minuti; le cartelle nascoste vengono saltate.'],
        ['Il download delle immagini è lento o fallisce', 'Imposta nel .env WANMORY_REGISTRY con un registro raggiungibile.'],
      ],
    },
    {
      p: 'I log dei servizi si vedono con `docker compose logs -f server` e `docker compose logs -f ml`. Se il problema persiste, scrivici dalla pagina [Segnala un problema](/feedback/) indicando versione e log pertinenti.',
    },

    { h2: 'uninstall' },
    { p: 'Esegui lo script di disinstallazione sull’host dove gira Wanmory:' },
    { code: 'curl -fsSL https://wanmory.com/uninstall.sh | bash', lang: 'bash' },
    {
      p: 'Lo script legge prima il .env nella cartella di installazione ed elenca container, database, cartella dei dati e modelli IA con lo spazio occupato, oltre alle cartelle di foto montate. Poi ferma e rimuove container e rete e chiede, voce per voce, se eliminare (per impostazione predefinita si tiene tutto):',
    },
    {
      table: ['Voce', 'Descrizione'],
      rows: [
        ['Database', 'Il volume Docker pgdata o la cartella indicata da WANMORY_DB_DIR. Una volta eliminati, persone, album, impostazioni e risultati IA non si recuperano.'],
        ['Cartella dei dati', 'Miniature, anteprime e foto originali caricate dall’app web.'],
        ['Modelli IA', 'Si possono riscaricare dall’app web dopo la reinstallazione.'],
        ['Immagini Docker', 'Compresa l’immagine postgres/pgvector; si possono riscaricare. Le immagini ancora usate da altri container non vengono rimosse.'],
        ['File di configurazione', '.env (con la password del database), docker-compose.yml e docker-compose.override.yml; se la cartella resta vuota, viene rimossa anch’essa.'],
      ],
    },
    {
      ul: [
        'Le cartelle di foto montate (NAS, dischi esterni) non vengono mai eliminate.',
        'Per eliminare il database o la cartella dei dati bisogna digitare DELETE come conferma.',
        'Se rimuovi solo i container e tieni i dati, rieseguire install.sh nella stessa cartella ripristina tutto; se elimini il .env ma tieni il database, annota prima il WANMORY_DB_PASSWORD che contiene.',
      ],
    },
    {
      table: ['Opzione', 'Descrizione'],
      rows: [
        ['`--dir CARTELLA`', 'Imposta la cartella di installazione; predefinita ~/wanmory.'],
        ['`-y`', 'Non interattivo: rimuove solo container e rete, mantenendo tutti i dati e la configurazione.'],
        ['`--purge`', 'Non interattivo: elimina tutte le voci della tabella sopra (tranne le cartelle di foto).'],
        ['`--dry-run`', 'Mostra solo cosa verrebbe fatto, senza modificare nulla.'],
      ],
    },
  ],
}

export default docs
