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
          group: 'Script di installazione',
          items: [
            ['install-script', 'Opzioni dello script'],
            ['install-steps', 'Lo script passo per passo'],
            ['install-faq', 'Domande sull’installazione'],
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
            ['ai-schedule', 'Quando lavora l’IA'],
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
            ['update', 'Aggiornare'],
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
    'Questa documentazione è pensata per gli amministratori che ospitano Wanmory su un NAS, un server o un computer personale. Copre installazione, configurazione, servizio IA, uso quotidiano, impostazioni di sistema e manutenzione. Per la progettazione del sistema e gli algoritmi, vedi [Architettura](/architecture/).',
  blocks: [
    {
      h2: 'intro',
    },
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
    {
      h2: 'requirements',
    },
    {
      table: ['Voce', 'Minimo', 'Consigliato'],
      rows: [
        ['Architettura CPU', 'x86_64 (amd64) o ARM64', '—'],
        [
          'Processore',
          'Classe Intel N100 / Raspberry Pi 5',
          'Classe Intel i5 o superiore, oppure servizio IA su una macchina con GPU',
        ],
        ['Memoria', '4 GB (viene scelto in automatico il livello «Leggero»)', '8 GB o più (livello «Equilibrato»)'],
        [
          'Disco',
          'Circa 1–4 GB per i modelli, più lo spazio per le miniature',
          'Un SSD per data/ e per il volume del database',
        ],
        ['Software', 'Docker Engine e Docker Compose v2', '—'],
        [
          'Sistema operativo',
          'Qualsiasi distribuzione Linux che esegua Docker',
          'Synology DSM, QNAP QTS, TrueNAS SCALE, Unraid, Ubuntu / Debian',
        ],
      ],
    },
    {
      note: 'Le immagini sono pubblicate per `linux/amd64` e `linux/arm64`, e Docker scarica quella adatta alla tua architettura. I container Docker su macOS non possono usare la GPU Apple; per l’accelerazione hardware su Mac, vedi [Servizio IA su un’altra macchina](#ai-remote).',
    },
    {
      h2: 'quick-start',
    },
    {
      h3: 'Metodo 1: script di installazione (consigliato)',
    },
    {
      p: 'Da eseguire su Linux o macOS a 64 bit con Docker installato (su un NAS Synology, QNAP o simile, accedi prima via SSH):',
    },
    {
      code: 'curl -fsSL https://wanmory.com/install.sh | bash',
      lang: 'bash',
    },
    {
      p: 'Lo script fa una domanda alla volta; Invio accetta il valore predefinito tra parentesi quadre. Alla prima installazione basta premere sempre Invio. Ogni opzione è spiegata in [Opzioni dello script](#install-script), ogni messaggio in [Lo script passo per passo](#install-steps). Alla fine apri l’indirizzo mostrato, crea l’account amministratore e scarica i modelli in Impostazioni → Come funziona l’IA.',
    },
    {
      note: 'Per vedere prima cosa fa lo script, scaricalo, leggilo e poi eseguilo: `curl -fsSLO https://wanmory.com/install.sh`, poi `bash install.sh`. Con `--dry-run` controlla solo il sistema e scrive i file di configurazione, senza scaricare immagini né avviare nulla.',
    },
    {
      h3: 'Metodo 2: installazione manuale',
    },
    {
      steps: [
        {
          title: 'Crea una cartella e scarica il file Compose',
          body: [
            {
              p: 'Crea una cartella per il file Compose, i dati e i modelli, e scarica il `docker-compose.yml` ufficiale:',
            },
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
            {
              p: 'Crea un `.env` nella stessa cartella per cambiare i valori predefiniti. In produzione cambia assolutamente la password del database:',
            },
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
            {
              p: 'Il primo avvio scarica le immagini ed esegue in automatico le migrazioni del database:',
            },
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
    {
      h2: 'install-script',
    },
    {
      p: 'Uso: `curl -fsSL https://wanmory.com/install.sh | bash -s -- [opzioni]`, oppure dopo averlo scaricato `bash install.sh [opzioni]`.',
    },
    {
      h3: 'Opzioni da riga di comando',
    },
    {
      table: ['Opzione', 'Cosa fa'],
      rows: [
        [
          '`-y`, `--yes`',
          'Nessuna domanda: usa tutti i valori predefiniti (o le variabili d’ambiente qui sotto); la password del database viene generata. Succede anche automaticamente senza terminale interattivo (ad esempio da un altro script).',
        ],
        ['`--dir CARTELLA`', 'Cartella di installazione, predefinita `~/wanmory` (oppure imposta `WANMORY_DIR`).'],
        [
          '`--dry-run`',
          'Controlla solo il sistema, scrive e verifica `.env` e `docker-compose.yml`; non scarica né avvia nulla.',
        ],
        ['`-h`, `--help`', 'Mostra l’aiuto.'],
      ],
    },
    {
      h3: 'Variabili d’ambiente',
    },
    {
      p: 'Vanno scritte prima del comando. Nell’installazione interattiva diventano la risposta predefinita di ogni domanda; con `-y` vengono usate direttamente. Tutte tranne `WANMORY_DIR` e `WANMORY_PHOTOS` finiscono in `.env`.',
    },
    {
      table: ['Variabile', 'Predefinito', 'Cosa fa'],
      rows: [
        ['`WANMORY_DIR`', '~/wanmory', 'Cartella di installazione, come `--dir`.'],
        [
          '`WANMORY_PORT`',
          '8080',
          'Porta web. Se è occupata, l’installazione interattiva ne chiede un’altra; con `-y` lo script si ferma con un errore.',
        ],
        [
          '`WANMORY_DOMAIN`',
          'wanmory.local',
          'Dominio della rete locale. Deve finire con `.local` e contenere solo lettere, cifre e trattini.',
        ],
        ['`WANMORY_DB_PASSWORD`', 'generata', 'Password del database. Se è impostata, lo script non la chiede.'],
        [
          '`WANMORY_DB_DIR`',
          'vuoto (volume Docker pgdata)',
          'Una cartella di questo computer per il database; vuoto significa il volume Docker. Non usare una condivisione di rete.',
        ],
        [
          '`WANMORY_TZ`',
          'fuso orario di questo computer, altrimenti Asia/Shanghai',
          'Per le foto senza fuso orario negli EXIF. Usa il nome completo, come `Europe/Rome`; in modalità interattiva puoi anche cercare per città.',
        ],
        [
          '`WANMORY_DATA_DIR`',
          './data',
          'Cartella dati: miniature, anteprime e foto caricate dalla pagina web. I percorsi relativi partono dalla cartella di installazione.',
        ],
        ['`WANMORY_MODELS_DIR`', './models', 'Cartella dei modelli IA, servono 1–4 GB.'],
        [
          '`WANMORY_PHOTOS`',
          'vuoto',
          'Cartelle foto esistenti, separate da virgole, in sola lettura per impostazione predefinita; aggiungi `:rw` a un percorso per lettura e scrittura, ad es. `/volume1/photo,/mnt/usb:rw`.',
        ],
        [
          '`WANMORY_REGISTRY`',
          'ghcr.io/i-dj',
          'Registro delle immagini. Sostituiscilo con un mirror raggiungibile se ghcr.io è lento o bloccato.',
        ],
        [
          '`WANMORY_VERSION`',
          'latest',
          'Quale versione installare, ad es. `0.4.1`. La schermata di benvenuto mostra la versione in installazione.',
        ],
      ],
    },
    {
      code: `# Esempio: senza domande, in /opt/wanmory sulla porta 9000, due cartelle foto del NAS in sola lettura
curl -fsSL https://wanmory.com/install.sh | WANMORY_PORT=9000 WANMORY_PHOTOS=/volume1/photo,/volume2/family bash -s -- -y --dir /opt/wanmory`,
      lang: 'bash',
    },
    {
      h2: 'install-steps',
    },
    {
      p: 'I messaggi dello script sono in inglese per essere mostrati correttamente in qualsiasi terminale di NAS. Ecco ogni passaggio nell’ordine in cui compare: ✔ verde significa superato, ! giallo è un avviso (l’installazione continua), ✘ rosso è un errore che ferma lo script.',
    },
    {
      steps: [
        {
          title: 'Schermata di benvenuto',
          body: [
            {
              p: 'Mostra la scritta WANMORY e `Installing version v0.4.1`: la versione che verrà installata, cioè `WANMORY_VERSION` se impostata, altrimenti l’ultima pubblicata.',
            },
          ],
        },
        {
          title: 'Checking system',
          body: [
            {
              qa: [
                {
                  q: '`OS: Linux` / `OS: macOS`',
                  a: 'Sistema operativo. Su macOS avvisa che l’IA nei container non può usare la GPU Apple; per la velocità avvia il servizio IA direttamente sul Mac (vedi [Eseguire il servizio IA a parte](#ai-remote)). Gli altri sistemi si fermano qui.',
                },
                {
                  q: '`CPU: x86_64 (linux/amd64 images)`',
                  a: 'Architettura della CPU. Solo amd64 e arm64 a 64 bit; un sistema a 32 bit (compreso il vecchio Raspberry Pi OS con kernel a 64 bit ma spazio utente a 32) si ferma: installa un sistema a 64 bit.',
                },
                {
                  q: '`Docker 27.x`',
                  a: 'Docker funziona. Se manca, compare un link all’installazione (Synology / QNAP: Container Manager / Container Station dal centro pacchetti). Con `Permission denied` esegui con sudo oppure aggiungi l’utente al gruppo docker e rientra.',
                },
                {
                  q: '`Docker Compose v2.x`',
                  a: 'Docker Compose funziona. Con il solo vecchio docker-compose v1 consiglia di aggiornare ma continua.',
                },
                {
                  q: '`Memory: 8 GB`',
                  a: 'Memoria. Sotto i 4 GB dice `AI will use the lite model tier`: l’IA usa automaticamente il livello leggero; sotto i 2 GB avvisa che il riconoscimento potrebbe non funzionare.',
                },
              ],
            },
          ],
        },
        {
          title: 'Configuration',
          body: [
            {
              p: 'Una domanda alla volta; Invio accetta il valore predefinito tra parentesi quadre.',
            },
            {
              qa: [
                {
                  q: '`Install directory`',
                  a: 'Dove stanno `.env`, `docker-compose.yml` e, per impostazione predefinita, data e models. Poi mostra lo spazio libero del disco; sotto i 10 GB avvisa.',
                },
                {
                  q: '`Keep the existing configuration`',
                  a: 'Compare solo se esiste già un `.env` (installazione precedente). Invio (Y) mantiene porta, dominio, password del database ecc. e salta le domande seguenti; ideale per reinstallare e aggiornare. n per compilare tutto da capo. Non cambiare la password a cuor leggero dopo che il database è stato creato.',
                },
                {
                  q: '`Web port`',
                  a: 'Porta web, predefinita 8080. Se è occupata ne chiede un’altra.',
                },
                {
                  q: '`LAN domain (must end in .local)`',
                  a: 'Nome per aprire la libreria sulla rete locale, predefinito wanmory.local; va bene anche photos.local. Si può cambiare in seguito nelle impostazioni web.',
                },
                {
                  q: '`Generate a random database password`',
                  a: 'Invio genera una password casuale e la salva in `.env`; non serve ricordarla. n per digitarne una due volte (almeno 8 caratteri; niente spazi, virgolette o `$ \\ @ : / # ?`).',
                },
                {
                  q: '`Database location`',
                  a: 'Dove sta il database. Lascia vuoto e premi Invio per il volume Docker pgdata (consigliato), oppure indica una cartella locale come `/volume1/wanmory/db`. Avvisa di non usare una condivisione SMB / NFS, che può danneggiare il database.',
                },
                {
                  q: '`Time zone`',
                  a: 'Serve a datare le foto senza fuso orario negli EXIF. Digita una città o un paese, ad es. rome, milan, zurich; se corrispondono più voci, scegli per numero.',
                },
                {
                  q: '`Data directory`',
                  a: 'Cartella dati, predefinita ./data. Qui finiscono miniature, anteprime e foto caricate: lascia spazio a sufficienza.',
                },
                {
                  q: '`AI model directory (1-4 GB)`',
                  a: 'Cartella dei modelli IA, predefinita ./models.',
                },
                {
                  q: '`Add existing photo folders from a NAS or external drive`',
                  a: 'Se aggiungere cartelle foto che hai già (senza ricaricarle). Rispondi Y e inserisci un percorso; se non esiste viene chiesta conferma.',
                },
                {
                  q: '`Mount read-only`',
                  a: 'Invio monta in sola lettura: Wanmory non modifica né elimina mai gli originali (consigliato). n per lettura e scrittura: eliminare definitivamente una foto in Wanmory cancella anche il file originale.',
                },
                {
                  q: '`Add another photo folder`',
                  a: 'Aggiunge la cartella successiva; Invio (N) termina.',
                },
              ],
            },
          ],
        },
        {
          title: 'Writing configuration',
          body: [
            {
              p: 'Scrive `.env` (permessi 600, leggibile solo da te); con le cartelle foto anche `docker-compose.override.yml` (Docker Compose lo unisce automaticamente); scarica `docker-compose.yml` da GitHub o, se non riesce, da Gitee. `Configuration is valid` significa che il controllo è superato. Con `--dry-run` lo script finisce qui.',
            },
          ],
        },
        {
          title: 'Existing database found',
          body: [
            {
              p: 'Compare solo se non hai mantenuto la vecchia configurazione ma esiste ancora un database precedente (ad esempio conservato durante la disinstallazione). Invio (Y) lo mantiene: foto, album, persone e account restano, e lo script cambia la sua password con quella nuova di `.env`. n elimina il vecchio database e riparte da zero; se il database è in una cartella locale, lo script non lo elimina da solo: svuota quella cartella e riesegui lo script.',
            },
          ],
        },
        {
          title: 'Pulling images and starting',
          body: [
            {
              p: 'Scarica le immagini (qualche minuto la prima volta). Avvia prima il database e lo attende (`Waiting for the database...`), allinea la sua password a quella di `.env` (`Database ready`), poi avvia il resto.',
            },
          ],
        },
        {
          title: 'Waiting for Wanmory to start',
          body: [
            {
              p: 'Attende fino a 5 minuti; i dispositivi lenti come un Raspberry Pi impiegano di più la prima volta. Se Wanmory continua a riavviarsi, mostra le ultime 15 righe del log e si ferma; se allo scadere del tempo non risponde ancora, suggerisce di ricontrollare più tardi e indica il comando per vedere i log.',
            },
          ],
        },
        {
          title: 'Installation complete',
          body: [
            {
              p: 'Mostra `LAN address` (dominio), `IP address` e cartella di installazione. `Next` indica il passo successivo: aprire la pagina, creare l’account amministratore, poi scaricare i modelli in Impostazioni → Come funziona l’IA. Alcuni dispositivi Android non risolvono i nomi .local: usa l’indirizzo IP.',
            },
          ],
        },
      ],
    },
    {
      h2: 'install-faq',
    },
    {
      qa: [
        {
          q: 'Dopo la reinstallazione Wanmory non si collega al database (autenticazione fallita)',
          a: 'Il database usa la password di `.env` solo quando viene creato; modificare `.env` dopo non la cambia. Lo script attuale allinea la password del database a `.env` a ogni avvio, quindi basta rieseguirlo. In un’installazione manuale esegui nella cartella di installazione `docker compose exec postgres psql -U wanmory -c "ALTER USER wanmory WITH PASSWORD \'nuova-password\';"`, poi `docker compose up -d`.',
        },
        {
          q: 'A chi appartengono i file della cartella dati / non si eliminano sull’host',
          a: 'Il container di Wanmory gira come proprietario della cartella dati: se l’ha creata un utente normale (come fa lo script), caricamenti e miniature sono suoi e si gestiscono senza sudo; se la cartella è di root o è un volume Docker, gira come uid 1000. Sui file system che non permettono di cambiare proprietario (chiavette exFAT / NTFS, condivisioni SMB) gira come root. I file con proprietario sbagliato lasciati da versioni precedenti vengono corretti all’avvio.',
        },
        {
          q: 'Raspberry Pi',
          a: 'Serve un sistema a 64 bit (Raspberry Pi OS 64-bit); a 32 bit lo script si ferma. Con 4 GB di memoria viene usato automaticamente il livello leggero; il primo avvio e la prima elaborazione delle foto sono lenti, quindi tieni dati e database su un SSD.',
        },
        {
          q: 'Porta già in uso',
          a: 'Scegli un’altra porta oppure esegui lo script con `WANMORY_PORT=9000`.',
        },
        {
          q: 'Download delle immagini lento o fallito',
          a: 'Imposta `WANMORY_REGISTRY` su un mirror raggiungibile e riesegui.',
        },
      ],
    },
    {
      h2: 'compose',
    },
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
    {
      h2: 'env',
    },
    {
      h3: '.env (variabili di Compose)',
    },
    {
      p: 'Queste variabili sono usate in `docker-compose.yml`; scrivile nel `.env` della stessa cartella per applicarle:',
    },
    {
      table: ['Variabile', 'Predefinito', 'Descrizione'],
      rows: [
        [
          '`WANMORY_DB_PASSWORD`',
          'wanmory',
          'Password di PostgreSQL, usata anche nella DATABASE_URL di server. Cambiarla dopo il primo avvio richiede di cambiare anche la password dell’utente nel database.',
        ],
        ['`WANMORY_PORT`', '8080', 'Porta pubblicata sull’host, usata anche per l’indirizzo mostrato nell’app web.'],
        ['`WANMORY_TZ`', 'Asia/Shanghai', 'Fuso orario usato quando i dati EXIF non lo contengono.'],
        [
          '`WANMORY_VERSION`',
          'latest',
          'Tag dell’immagine; fissa una versione precisa per decidere tu quando aggiornare.',
        ],
        [
          '`WANMORY_REGISTRY`',
          'ghcr.io/i-dj',
          'Registro delle immagini. Sostituiscilo con uno raggiungibile se ghcr.io non lo è.',
        ],
        [
          '`WANMORY_DATA_DIR`',
          './data',
          'Cartella dei dati: originali caricati (upload/) e miniature e anteprime (thumbs/), montata su /data nel container.',
        ],
        ['`WANMORY_MODELS_DIR`', './models', 'Cartella dei modelli IA, montata su /models nel container ml.'],
        [
          '`WANMORY_DB_DIR`',
          'volume pgdata',
          'Cartella del database. Se non impostata si usa il volume Docker pgdata; con il percorso di una cartella su un disco locale, il database viene salvato direttamente lì. Non usare cartelle condivise in rete.',
        ],
        [
          '`WANMORY_DOMAIN`',
          'wanmory.local',
          'Dominio locale iniziale, deve terminare con .local. Una volta cambiato in «Impostazioni di sistema → Dominio di accesso», vale l’impostazione.',
        ],
      ],
    },
    {
      h3: 'Container server (facoltativo)',
    },
    {
      p: '`DATABASE_URL`, `WANMORY_ML_URL`, `WANMORY_MDNS` e `WANMORY_HTTP_PUBLIC_PORT` sono già impostate nel file Compose con il loro scopo annotato. Le variabili seguenti non sono nel file predefinito; aggiungile all’`environment` di `server` se servono:',
    },
    {
      table: ['Variabile', 'Predefinito', 'Descrizione'],
      rows: [
        [
          '`WANMORY_WORKERS`',
          'automatico',
          'Concorrenza predefinita dei lavori di metadati e miniature. Se non impostata, si calcola da core e memoria; regolabile in «Prestazioni» nell’app web.',
        ],
        [
          '`WANMORY_ML_TOKEN`',
          'vuoto',
          'Token di accesso del servizio IA integrato; deve coincidere con l’omonima variabile del container ml. Di solito non serve.',
        ],
        ['`WANMORY_FACE_MODEL`', 'antelopev2', 'Modello per i volti usato se non è stato scelto alcun livello.'],
        [
          '`WANMORY_CLIP_MODEL`',
          'chinese-clip-vit-h-14',
          'Modello di ricerca semantica usato se non è stato scelto alcun livello.',
        ],
        [
          '`WANMORY_STORAGE_ROOTS`',
          'cartella dei dati',
          'Cartelle che si possono sfogliare e scegliere nell’app web, separate da due punti.',
        ],
      ],
    },
    {
      h2: 'library',
    },
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
    {
      p: 'Dopo la modifica esegui `docker compose up -d`. La prima scansione parte circa 20 secondi dopo il riavvio del container.',
    },
    {
      ul: [
        '**Si consiglia il montaggio in sola lettura (:ro)**: il sistema non scrive nulla in queste cartelle. Eliminare una foto nell’app la sposta solo in «Eliminate di recente», l’eliminazione definitiva non cancella mai il file originale e le scansioni successive non lo reimportano. Per le cartelle in lettura e scrittura, l’eliminazione definitiva cancella anche il file originale.',
        'I file con contenuto identico vengono importati una sola volta (confronto tramite checksum SHA-1), compresi quelli già caricati e i duplicati tra cartelle diverse.',
        'Le cartelle nascoste e le cartelle di sistema del NAS (.xxx, @eaDir, #recycle ecc.) vengono saltate automaticamente.',
        'Le foto importate dalle cartelle non appartengono ad alcun membro; solo gli amministratori possono eliminarle.',
      ],
    },
    {
      h2: 'mdns',
    },
    {
      p: 'Il servizio `mdns` gira in modalità rete dell’host e annuncia il dominio di accesso in rete locale (predefinito `wanmory.local`). macOS, iOS, iPadOS e Windows 10 o successivi raggiungono `http://wanmory.local:8080` senza configurare il router. Il dominio si cambia in «Impostazioni di sistema → Dominio di accesso» e deve terminare con `.local`.',
    },
    {
      note: 'Alcuni dispositivi Android non risolvono i nomi mDNS; usa l’indirizzo IP. Se la porta 5353 è già occupata (ad esempio su Synology), il servizio mdns può non partire; anche in questo caso usa l’IP. Le altre funzioni non ne risentono.',
      warn: true,
    },
    {
      h2: 'proxy',
    },
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
    {
      h2: 'ai-overview',
    },
    {
      p: 'Il servizio IA è un servizio HTTP senza stato: riceve dal backend anteprime da 1440 pixel e restituisce volti, vettori e testo riconosciuto. Non accede mai al database e non salva file. Il backend prevede due modalità, che si cambiano in «Impostazioni di sistema → IA → Modalità di esecuzione IA»:',
    },
    {
      table: ['Modalità', 'Dove gira', 'Adatta a'],
      rows: [
        [
          'Integrata (solo CPU)',
          'Il container ml in Compose, raggiungibile solo dalla rete interna',
          'Pronta all’uso; NAS o mini PC con una fototeca contenuta, o se una prima elaborazione più lunga è accettabile',
        ],
        [
          'Servizio remoto',
          'Un’altra macchina in rete locale che esegue direttamente il servizio Python',
          'Mac con Apple Silicon (CoreML / MPS) o macchina con GPU NVIDIA (CUDA), per accorciare molto la prima elaborazione',
        ],
      ],
    },
    {
      p: 'Se il servizio IA non è disponibile, i lavori IA restano in coda e non vengono più presi, senza consumare tentativi; quando il servizio torna, l’elaborazione riprende da sola. Navigazione, caricamenti e il resto non ne risentono.',
    },
    {
      h2: 'ai-remote',
    },
    {
      p: 'Il container IA integrato usa solo la CPU. Se hai un computer più veloce (un Mac con chip Apple o un PC Windows / Linux con GPU NVIDIA), puoi eseguire lì direttamente il servizio IA (il programma Python della cartella `ml/` del repository) e Wanmory gli invia le foto. Python e dipendenze sono gestiti da [uv](https://docs.astral.sh/uv/), quindi non serve installare Python.',
    },
    {
      table: ['Computer', 'Accelerazione disponibile'],
      rows: [
        ['Mac con chip Apple', 'CoreML per il riconoscimento dei volti, MPS (PyTorch) per la ricerca intelligente.'],
        ['Linux + GPU NVIDIA', 'CUDA per la ricerca intelligente (PyTorch in mezza precisione, circa 1,9 GB di VRAM).'],
        [
          'Windows + GPU NVIDIA',
          'CUDA per la ricerca intelligente dopo aver installato PyTorch con CUDA (passo 3 di Windows qui sotto); volti e testo sulla CPU.',
        ],
        ['Senza GPU', 'Senza PyTorch, tutto con ONNX sulla CPU; utile su un computer molto più veloce del NAS.'],
      ],
    },
    {
      h3: 'macOS',
    },
    {
      steps: [
        {
          title: 'Installare uv',
          body: [
            {
              code: `curl -LsSf https://astral.sh/uv/install.sh | sh   # oppure: brew install uv
# poi apri un nuovo terminale`,
              lang: 'bash',
            },
          ],
        },
        {
          title: 'Scaricare il codice',
          body: [
            {
              code: `git clone https://github.com/i-dj/wanmory.git   # mirror in Cina: https://gitee.com/i-dj/wanmory.git
cd wanmory/ml`,
              lang: 'bash',
            },
            {
              p: 'Se manca git, macOS propone di installare gli strumenti da riga di comando di Xcode: accetta e segui le istruzioni.',
            },
          ],
        },
        {
          title: 'Installare le dipendenze',
          body: [
            {
              code: 'uv sync --extra torch   # la prima volta scarica Python e PyTorch, qualche minuto',
              lang: 'bash',
            },
          ],
        },
        {
          title: 'Creare un token di accesso e avviare',
          body: [
            {
              code: `export WANMORY_ML_TOKEN=$(openssl rand -hex 24)
echo $WANMORY_ML_TOKEN   # annotalo, serve a Wanmory
WANMORY_FACE_MODEL_PRELOAD=1 uv run --extra torch python -m wanmory_ml`,
              lang: 'bash',
            },
            {
              p: 'È pronto quando compare `Uvicorn running on http://0.0.0.0:3003`. Il primo avvio scarica il modello dei volti (circa 340 MB). Se macOS chiede se python può accettare connessioni in entrata, consentilo.',
            },
          ],
        },
        {
          title: 'Permettere agli altri computer di collegarsi',
          body: [
            {
              p: 'Se il firewall è attivo (Impostazioni di Sistema → Rete → Firewall), verifica che le connessioni in entrata siano consentite per python. `ipconfig getifaddr en0` mostra l’indirizzo IP del Mac.',
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
          title: 'Installare uv',
          body: [
            {
              p: 'Apri PowerShell ed esegui:',
            },
            {
              code: `powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
# oppure: winget install --id=astral-sh.uv -e
# poi apri una nuova finestra di PowerShell`,
              lang: 'powershell',
            },
          ],
        },
        {
          title: 'Scaricare il codice',
          body: [
            {
              code: `git clone https://github.com/i-dj/wanmory.git   # niente Git? winget install Git.Git
cd wanmory\\ml`,
              lang: 'powershell',
            },
            {
              p: 'Senza Git puoi anche cliccare su Code → Download ZIP su GitHub, estrarre l’archivio ed entrare nella cartella ml.',
            },
          ],
        },
        {
          title: 'Installare le dipendenze',
          body: [
            {
              code: `uv sync --extra torch
# Con una GPU NVIDIA passa a PyTorch con CUDA (il PyTorch di PyPI su Windows usa solo la CPU)
uv pip install --reinstall torch --index-url https://download.pytorch.org/whl/cu126`,
              lang: 'powershell',
            },
            {
              p: 'Dopo il passaggio alla versione CUDA, avvia con `uv run --no-sync`, altrimenti uv reinstalla la versione per CPU. Senza GPU esegui solo `uv sync` (senza PyTorch, molto più leggero) e togli `--extra torch` all’avvio.',
            },
          ],
        },
        {
          title: 'Creare un token di accesso e avviare',
          body: [
            {
              code: `$env:WANMORY_ML_TOKEN = [guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N")
echo $env:WANMORY_ML_TOKEN   # annotalo, serve a Wanmory
$env:WANMORY_FACE_MODEL_PRELOAD = "1"
uv run --extra torch python -m wanmory_ml
# con PyTorch con CUDA usa invece: uv run --no-sync python -m wanmory_ml`,
              lang: 'powershell',
            },
          ],
        },
        {
          title: 'Aprire la porta nel firewall',
          body: [
            {
              p: 'Al primo avvio Windows Firewall chiede il permesso: spunta Reti private e consenti. Oppure, in PowerShell come amministratore:',
            },
            {
              code: 'New-NetFirewallRule -DisplayName "Wanmory AI" -Direction Inbound -Protocol TCP -LocalPort 3003 -Action Allow',
              lang: 'powershell',
            },
            {
              p: '`ipconfig` mostra l’indirizzo IPv4 del PC.',
            },
          ],
        },
        {
          title: 'Avvio automatico (facoltativo)',
          body: [
            {
              p: 'Crea `start-ai.cmd` nella cartella ml:',
            },
            {
              code: `@echo off
cd /d %~dp0
set WANMORY_ML_TOKEN=il-tuo-token
uv run --extra torch python -m wanmory_ml`,
              lang: 'cmd',
            },
            {
              p: 'Premi Win+R, digita `shell:startup` e metti un collegamento a questo file nella cartella che si apre: partirà all’accesso a Windows. Per farlo girare senza accedere, crea un’attività in Utilità di pianificazione con il trigger «All’avvio» e questo start-ai.cmd come azione.',
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
uv sync --extra torch        # su Linux il PyTorch di PyPI include CUDA; senza GPU basta uv sync
export WANMORY_ML_TOKEN=$(openssl rand -hex 24)
WANMORY_FACE_MODEL_PRELOAD=1 uv run --extra torch python -m wanmory_ml
sudo ufw allow 3003/tcp      # se usi il firewall ufw`,
      lang: 'bash',
    },
    {
      p: 'Per avviarlo all’accensione scrivi un servizio systemd: il comando uv run qui sopra in `ExecStart` (con il percorso completo `~/.local/bin/uv`), la cartella ml in `WorkingDirectory` e il token in `Environment=`.',
    },
    {
      h3: 'Variabili d’ambiente principali',
    },
    {
      table: ['Variabile', 'Predefinito', 'Cosa fa'],
      rows: [
        [
          '`WANMORY_ML_HOST`',
          '0.0.0.0',
          'Indirizzo di ascolto; 0.0.0.0 permette agli altri computer della rete di collegarsi.',
        ],
        ['`WANMORY_ML_PORT`', '3003', 'Porta di ascolto.'],
        [
          '`WANMORY_ML_TOKEN`',
          'vuoto',
          'Token di accesso. Se impostato, ogni richiesta tranne il controllo di stato deve inviare `Authorization: Bearer <token>`; inserisci lo stesso valore in Wanmory.',
        ],
        [
          '`WANMORY_MODEL_DIR`',
          '~/.cache/wanmory/models',
          'Dove vengono salvati i modelli (su Windows, .cache\\wanmory\\models nella cartella utente).',
        ],
      ],
    },
    {
      p: 'Le altre sono in [Variabili d’ambiente del servizio IA](#ai-env).',
    },
    {
      h3: 'Collegarlo in Wanmory',
    },
    {
      steps: [
        {
          title: 'Scegliere il servizio remoto',
          body: [
            {
              p: 'Come amministratore apri Impostazioni e scegli Servizio remoto nella scheda Come funziona l’IA.',
            },
          ],
        },
        {
          title: 'Inserire URL e token',
          body: [
            {
              p: 'In URL del servizio inserisci l’indirizzo del computer che esegue il servizio IA, ad es. `http://192.168.1.20:3003`; in Token di accesso il token creato. Clicca Prova connessione: se riesce, mostra latenza e versione. Poi salva.',
            },
          ],
        },
        {
          title: 'Scaricare i modelli',
          body: [
            {
              p: 'Una volta collegato, se il livello è Automatico viene ricalcolato in base all’hardware di quel computer; scarica i modelli necessari in Livello del modello e l’IA inizia a elaborare le foto.',
            },
          ],
        },
      ],
    },
    {
      note: 'Usa il servizio IA remoto solo nella rete locale o tramite VPN (come Tailscale), imposta sempre un token e non esporre mai la porta 3003 direttamente su Internet. Quando il computer che lo esegue è spento o in stop, l’elaborazione IA si mette in pausa e riprende da sola al ritorno.',
      warn: true,
    },
    {
      h2: 'ai-schedule',
    },
    {
      p: 'Dopo l’importazione, la lettura dei dati e le miniature avvengono subito; quando eseguire il riconoscimento IA (volti, ricerca intelligente, testo) si imposta in Impostazioni → Elaborazione in background, e le modifiche valgono subito. In cima alla scheda è indicato se l’IA può lavorare adesso e, se no, perché.',
    },
    {
      table: ['Impostazione', 'Opzione', 'Cosa fa'],
      rows: [
        [
          'Quando elaborare',
          'Quando inattivo (predefinito)',
          'Mette in pausa l’IA mentre si caricano foto o si creano miniature, e riprende quando c’è calma.',
        ],
        [
          '',
          'Sempre',
          'Elabora senza aspettare i caricamenti, che possono rallentare. L’attesa dopo i caricamenti non si applica.',
        ],
        [
          '',
          'Di notte',
          'Elabora solo nella fascia oraria impostata (predefinita 1:00–7:00; può superare la mezzanotte, ad es. dalle 23:00 alle 7:00) ed evita i caricamenti anche in quella fascia.',
        ],
        [
          'Attesa dopo i caricamenti',
          '30 s (predefinito), 5 / 15 / 30 min, 1 / 2 / 4 h',
          'Finiti i caricamenti, l’IA aspetta questo tempo prima di iniziare, per non infilarsi tra un gruppo e l’altro. Vale per Quando inattivo e Di notte. Per rimandare a domani, scegli Di notte.',
        ],
      ],
    },
    {
      ul: [
        'Se i modelli del livello attuale non sono stati scaricati, l’IA resta in pausa qualunque sia la scelta; parte da sola quando li scarichi in Livello del modello.',
        'Finché c’è un caricamento non terminato (compresi quelli che possono riprendere dopo un’interruzione), l’IA aspetta.',
        'Durante la pausa le attività restano in coda: non si perde nulla e nulla conta come fallito.',
      ],
    },
    {
      h2: 'ai-models',
    },
    {
      p: 'Il livello determina quali modelli si usano per volti e ricerca semantica. Con «Automatico», il sistema consiglia un livello in base all’hardware della macchina del servizio IA: «Alta precisione» con una GPU utilizzabile; con sola CPU, «Leggero» sotto i 6 GB di memoria, altrimenti «Equilibrato».',
    },
    {
      table: ['Livello', 'Rilevamento + tratti dei volti', 'Ricerca semantica', 'Hardware adatto'],
      rows: [
        [
          'Alta precisione (quality)',
          'antelopev2 (SCRFD-10G + ArcFace R100)',
          'Chinese-CLIP ViT-H/14 (1024-d)',
          'Mac con Apple Silicon, GPU NVIDIA',
        ],
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
    {
      h2: 'ai-env',
    },
    {
      table: ['Variabile', 'Predefinito', 'Descrizione'],
      rows: [
        ['`WANMORY_ML_HOST`', '0.0.0.0', 'Indirizzo di ascolto.'],
        ['`WANMORY_ML_PORT`', '3003', 'Porta di ascolto.'],
        [
          '`WANMORY_ML_TOKEN`',
          'vuoto',
          'Token di accesso; se impostato, ogni richiesta deve includere Authorization: Bearer.',
        ],
        ['`WANMORY_MODEL_DIR`', '~/.cache/wanmory/models', 'Cartella dei modelli; /models nell’immagine.'],
        ['`WANMORY_AUTO_DOWNLOAD`', '0 nell’immagine', 'Se scaricare in automatico i modelli al primo uso.'],
        [
          '`WANMORY_FACE_MODEL_PRELOAD`',
          '—',
          'Con 1, carica i modelli per i volti all’avvio; Chinese-CLIP si carica in background.',
        ],
        [
          '`WANMORY_UNLOAD_AFTER`',
          '5 / 30 minuti',
          'Secondi di inattività prima di scaricare un modello per liberare memoria; 0 non lo scarica mai. Il predefinito dipende dalla memoria dell’host.',
        ],
      ],
    },
    {
      h2: 'first-run',
    },
    {
      steps: [
        {
          title: 'Crea l’amministratore',
          body: [
            {
              p: 'Al primo accesso il sistema vede che non ci sono account e guida nella creazione di un amministratore. Gli amministratori possono aggiungere membri e cambiare le impostazioni di sistema.',
            },
          ],
        },
        {
          title: 'Scarica i modelli',
          body: [
            {
              p: 'Vai in «Impostazioni di sistema → IA», conferma il livello dei modelli e scaricali. Finché non sono pronti, i lavori IA aspettano in coda.',
            },
          ],
        },
        {
          title: 'Importa le foto',
          body: [
            {
              p: 'Caricale dall’app web oppure collega le foto del NAS come descritto in [Montare cartelle di foto esistenti](#library).',
            },
          ],
        },
        {
          title: 'Aggiungi membri',
          body: [
            {
              p: 'In «Impostazioni di sistema → Membri», crea gli account delle altre persone e scegli il ruolo «Membro» o «Amministratore».',
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
        'Il caricamento web accetta foto, video, HEIC, RAW (come DNG) e altro, con selezione multipla; il caricamento avviene a blocchi con il protocollo tus e riprende dopo un’interruzione di rete o un ricaricamento della pagina.',
        'I file caricati vengono salvati per anno e mese nella cartella dei caricamenti (predefinita data/upload). La cartella si cambia in «Impostazioni di sistema → Cartella dei caricamenti» e vale solo per i nuovi caricamenti.',
        'Dopo l’importazione si eseguono nell’ordine: lettura dei metadati (ExifTool) → miniature e anteprima da 1440 pixel (libvips / FFmpeg) → vettori semantici, volti e testo (servizio IA) → geocodifica inversa.',
        'L’indicatore dei lavori in cima alla barra laterale mostra, in numero di foto, avanzamento e tempo residuo stimato di «Importazione foto» e «Riconoscimento IA».',
      ],
    },
    {
      h2: 'browse',
    },
    {
      qa: [
        {
          q: 'Libreria',
          a: 'Cronologia delle foto raggruppata per mese, con in alto il carosello delle scelte IA e «Accadde oggi».',
        },
        {
          q: 'Ricerca in linguaggio naturale',
          a: 'Scrivi una descrizione (come «foto del terzo compleanno del bimbo»); i risultati si ordinano combinando testo riconosciuto, luogo dello scatto e similarità semantica di Chinese-CLIP. Scrivere il nome di una categoria restituisce direttamente quella categoria.',
        },
        {
          q: 'Persone',
          a: 'I volti si raggruppano in automatico; una persona compare quando è presente in almeno 3 foto. Dai nomi, unisci, imposta compleanni e guarda la crescita per età, i luoghi e le foto di gruppo.',
        },
        {
          q: 'Album · Album intelligenti',
          a: 'Gli album contengono foto scelte a mano e possono essere privati; gli album intelligenti raccolgono le foto da soli per persona, luogo, data e altre condizioni.',
        },
        {
          q: 'Luoghi',
          a: 'Mostra su una mappa dove è stata scattata ogni foto grazie al GPS, con le viste Mappa, Satellite e Griglia.',
        },
        {
          q: 'Raffiche e simili',
          a: 'Raggruppa in automatico raffiche e foto simili e consiglia la migliore da tenere; «Duplicati» elenca i file con contenuto identico.',
        },
        {
          q: 'Presentazioni',
          a: 'Riproduci libreria, album, persone e ricordi; le foto verticali vengono affiancate due o tre per pagina, con musica di sottofondo e transizioni.',
        },
      ],
    },
    {
      h2: 'members-usage',
    },
    {
      table: ['Ruolo', 'Permessi'],
      rows: [
        [
          'Amministratore',
          'Aggiunge e rimuove membri, reimposta le loro password e cambia le impostazioni di sistema; può eliminare qualsiasi foto.',
        ],
        [
          'Membro',
          'Carica, sfoglia e riordina foto; può eliminare solo le proprie; non può cambiare le impostazioni di sistema.',
        ],
        [
          'Ospite',
          'Con l’accesso ospiti attivo, chi non ha effettuato l’accesso può vedere i contenuti condivisi in sola lettura; album privati e foto nascoste non sono visibili.',
        ],
      ],
    },
    {
      p: 'Le informazioni sulle persone (nomi, unioni) sono comuni a tutti i membri; numero di foto, copertine e pagine delle persone si calcolano sulle foto che ogni membro può vedere, e le foto nascoste le vede solo chi le ha nascoste.',
    },
    {
      h2: 'settings-members',
    },
    {
      ul: [
        'Membri: quando ne aggiungi uno, imposti nome, password iniziale (almeno 4 caratteri) e ruolo; puoi reimpostare la password di un membro o rimuoverlo.',
        'Cronologia accessi: registra ora, dispositivo e IP di ogni accesso, con la posizione stimata offline dall’IP (ip2region), e conserva gli ultimi sei mesi. La vedono solo gli amministratori.',
        'In «Il mio account» ogni membro può cambiare password e avatar e vedere i dispositivi su cui ha effettuato l’accesso.',
      ],
    },
    {
      h2: 'settings-ai',
    },
    {
      table: ['Impostazione', 'Opzioni', 'Descrizione'],
      rows: [
        [
          'Modalità di esecuzione IA',
          'Integrata (solo CPU) / Servizio remoto',
          'Un servizio remoto richiede indirizzo e token, e la connessione viene provata prima del cambio; se il servizio non è disponibile l’elaborazione IA si mette in pausa.',
        ],
        [
          'Dispositivo di calcolo',
          'Automatico / GPU / Solo CPU',
          'Senza scheda video utilizzabile si può scegliere solo la CPU; il cambio ricarica i modelli e l’elaborazione IA in corso riprende poco dopo.',
        ],
        [
          'Livello dei modelli',
          'Automatico / Alta precisione / Equilibrato / Leggero',
          'Dopo il cambio tutte le foto vengono rielaborate con i nuovi modelli, con l’avanzamento visibile.',
        ],
        [
          'Gestione dei modelli',
          'Scarica / Elimina',
          'Elenca dimensione e stato di ogni modello (in uso, scaricato, non scaricato).',
        ],
      ],
    },
    {
      h2: 'settings-perf',
    },
    {
      table: ['Impostazione', 'Opzioni', 'Descrizione'],
      rows: [
        [
          'Quando elaborare',
          'A riposo / Sempre / Di notte',
          'Quando inattivo: pausa dell’IA durante caricamenti e creazione di miniature; Sempre: elaborazione continua, i caricamenti possono rallentare; Di notte: solo nella fascia impostata. Vedi [Quando lavora l’IA](#ai-schedule).',
        ],
        [
          'Attesa dopo i caricamenti',
          '30 s – 4 h',
          'Quanto aspetta l’IA dopo la fine dei caricamenti; vale per Quando inattivo e Di notte.',
        ],
        [
          'Concorrenza elaborazione foto',
          'Numero',
          'Quante foto vengono lette e miniaturizzate contemporaneamente; il predefinito si calcola da core e memoria.',
        ],
        ['Concorrenza IA', 'Numero', 'Quante foto vengono inviate contemporaneamente al servizio IA.'],
        ['Thread della CPU', 'Numero', 'Thread della CPU usati da ogni modello per l’inferenza.'],
      ],
    },
    {
      p: 'In cima alla scheda si vede in tempo reale lo stato dell’IA (in funzione o motivo della pausa). Le modifiche valgono subito, senza riavvio.',
    },
    {
      h2: 'settings-general',
    },
    {
      table: ['Impostazione', 'Predefinito', 'Descrizione'],
      rows: [
        [
          'Cartella dei caricamenti',
          'data/upload',
          'I file caricati vengono salvati per anno e mese; le modifiche valgono solo per i nuovi caricamenti.',
        ],
        [
          'Accesso ospiti',
          'Attivo',
          'Permette di vedere i contenuti condivisi senza accedere. Meglio disattivarlo con l’accesso da internet.',
        ],
        [
          'Mappe online',
          'Attivo',
          'Mostra mappe, nomi dei luoghi e ricerca dei luoghi, inviando la posizione delle foto al servizio di mappe; se disattivato, si vedono solo le coordinate.',
        ],
        [
          'Fornitore delle mappe',
          'Automatico',
          'Automatico: AMap nella Cina continentale, OpenStreetMap altrove; si può anche fissarne uno.',
        ],
        ['Dominio di accesso', 'wanmory.local', 'Dominio di accesso in rete locale; deve terminare con .local.'],
      ],
    },
    {
      h2: 'settings-update',
    },
    {
      p: '«Impostazioni di sistema → Aggiornamento di sistema» mostra le versioni attuali del backend e del servizio IA e segnala quelle nuove. Per aggiornare, esegui nella cartella che contiene `docker-compose.yml`:',
    },
    {
      code: 'docker compose pull && docker compose up -d',
      lang: 'bash',
    },
    {
      p: 'Le migrazioni del database partono da sole all’avvio di server. Se hai fissato una versione con `WANMORY_VERSION`, cambia prima il tag nel `.env`.',
    },
    {
      note: 'I passaggi completi sono in [Aggiornare](#update).',
    },
    {
      h2: 'update',
    },
    {
      p: 'Quando esce una nuova versione, Impostazioni → Aggiornamento di sistema lo segnala e mostra le note di ogni versione (anche nella pagina [Versioni](/releases/)). L’aggiornamento sostituisce solo il programma; foto, database, impostazioni e modelli restano.',
    },
    {
      steps: [
        {
          title: 'Andare nella cartella di installazione',
          body: [
            {
              code: 'cd ~/wanmory   # la tua cartella di installazione (quella con docker-compose.yml e .env)',
              lang: 'bash',
            },
          ],
        },
        {
          title: 'Scaricare le nuove immagini e riavviare',
          body: [
            {
              code: `docker compose pull
docker compose up -d`,
              lang: 'bash',
            },
            {
              p: 'All’avvio Wanmory aggiorna da solo la struttura del database; ricarica la pagina dopo qualche secondo o un minuto.',
            },
          ],
        },
        {
          title: 'Eliminare le immagini vecchie (facoltativo)',
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
      note: 'Se `.env` fissa una versione con `WANMORY_VERSION`, cambiala con quella nuova (o elimina la riga per usare l’ultima) prima di eseguire i comandi. Puoi anche rieseguire lo script di installazione mantenendo la configurazione (`Keep the existing configuration` → Y): stesso risultato, e in più scarica il `docker-compose.yml` più recente.',
    },
    {
      h2: 'backup',
    },
    {
      p: 'I dati da salvare sono di tre tipi:',
    },
    {
      table: ['Dati', 'Posizione', 'Descrizione'],
      rows: [
        [
          'Database',
          'volume con nome pgdata',
          'Metadati delle foto, persone, album, impostazioni, vettori e coda dei lavori.',
        ],
        [
          'Caricamenti e miniature',
          './data',
          'Originali caricati (data/upload) e miniature (data/thumbs); le miniature si possono rigenerare.',
        ],
        [
          'Cartelle di foto',
          'cartelle montate in /photos',
          'Coperte dal piano di backup del NAS stesso; l’app non modifica mai le cartelle montate in sola lettura.',
        ],
      ],
    },
    {
      lang: 'bash',
      code: `# Esportare il database
docker compose exec -T postgres pg_dump -U wanmory -Fc wanmory > wanmory-$(date +%F).dump

# Ripristinare in una nuova installazione (prima esegui docker compose up -d postgres)
docker compose exec -T postgres pg_restore -U wanmory -d wanmory --clean < wanmory-2026-11-10.dump`,
    },
    {
      note: 'I file dei modelli in ./models non vanno salvati; si possono riscaricare dall’app web.',
    },
    {
      h2: 'reset-password',
    },
    {
      p: 'Quando un membro dimentica la password, un amministratore la reimposta in «Impostazioni di sistema → Membri». Se l’amministratore dimentica la propria, esegui sull’host dell’app, nella cartella che contiene `docker-compose.yml`:',
    },
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
    {
      h2: 'troubleshooting',
    },
    {
      qa: [
        {
          q: 'wanmory.local non raggiungibile',
          a: 'Verifica che il servizio mdns sia attivo (docker compose ps); alcuni Android non supportano mDNS, usa l’IP; controlla se la porta 5353 è occupata sull’host.',
        },
        {
          q: 'Le impostazioni IA mostrano «Connessione impossibile, elaborazione IA in pausa»',
          a: 'In modalità integrata guarda i log del container ml (docker compose logs ml); in modalità remota verifica che indirizzo, porta, firewall e token coincidano.',
        },
        {
          q: 'Nessun risultato in Persone o nella ricerca',
          a: 'Verifica che i modelli siano scaricati; in «Prestazioni» controlla se l’IA è in pausa per l’orario di elaborazione; guarda l’avanzamento del riconoscimento nell’indicatore dei lavori.',
        },
        {
          q: 'I caricamenti grandi falliscono',
          a: 'Il limite di dimensione delle richieste del reverse proxy è troppo basso; regola client_max_body_size come in «Reverse proxy e accesso da internet».',
        },
        {
          q: 'Le foto di una cartella montata non compaiono',
          a: 'Le cartelle vanno montate come sottocartelle di /photos; la prima scansione avviene circa 20 secondi dopo l’avvio, poi ogni 15 minuti; le cartelle nascoste vengono saltate.',
        },
        {
          q: 'Il download delle immagini è lento o fallisce',
          a: 'Imposta nel .env WANMORY_REGISTRY con un registro raggiungibile.',
        },
      ],
    },
    {
      p: 'I log dei servizi si vedono con `docker compose logs -f server` e `docker compose logs -f ml`. Se il problema persiste, scrivici dalla pagina [Segnala un problema](/feedback/) indicando versione e log pertinenti.',
    },
    {
      h2: 'uninstall',
    },
    {
      p: 'Da eseguire sul computer dove gira Wanmory:',
    },
    {
      code: 'curl -fsSL https://wanmory.com/uninstall.sh | bash',
      lang: 'bash',
    },
    {
      p: 'Per impostazione predefinita vengono rimossi solo i container e tutti i dati restano: chiede voce per voce, e Invio significa sempre mantenere (N). Le cartelle foto che hai montato (NAS, dischi esterni) non vengono mai eliminate.',
    },
    {
      steps: [
        {
          title: 'Locating installation',
          body: [
            {
              p: 'Chiede l’`Install directory`; Invio usa ~/wanmory. La cartella deve contenere il `docker-compose.yml` di Wanmory, altrimenti lo script si ferma. Poi elenca il numero di container, dove si trova il database, le cartelle dati e modelli con le dimensioni e le cartelle foto montate (segnate `never deleted`).',
            },
          ],
        },
        {
          title: 'Choose what to remove',
          body: [
            {
              p: 'Container e rete vengono sempre rimossi. Ogni voce qui sotto viene chiesta una volta:',
            },
            {
              qa: [
                {
                  q: '`Delete the database`',
                  a: 'Il database (volume Docker pgdata o la cartella `WANMORY_DB_DIR`): persone, album, impostazioni, risultati IA e account. Irreversibile.',
                },
                {
                  q: '`Delete the data directory`',
                  a: 'La cartella dati: miniature e **le foto originali caricate dalla pagina web**.',
                },
                {
                  q: '`Delete the AI models`',
                  a: 'La cartella dei modelli IA; si possono riscaricare dopo la reinstallazione.',
                },
                {
                  q: '`Remove the Docker images`',
                  a: 'Le immagini Docker usate da Wanmory (compresa postgres/pgvector); si possono riscaricare.',
                },
                {
                  q: '`Delete the configuration files`',
                  a: '`.env` (con la password del database), `docker-compose.yml`, `docker-compose.override.yml`; se la cartella di installazione resta vuota, viene rimossa anch’essa.',
                },
              ],
            },
          ],
        },
        {
          title: 'Summary',
          body: [
            {
              p: 'Riepiloga cosa succederà. Se hai scelto di eliminare il database o la cartella dati, devi digitare `DELETE` in maiuscolo per continuare; qualsiasi altra cosa annulla senza modificare nulla. Altrimenti chiede `Proceed` una volta. Se mantieni il database ma elimini `.env`, ricorda di annotare prima `WANMORY_DB_PASSWORD`.',
            },
          ],
        },
        {
          title: 'Removing',
          body: [
            {
              p: 'Ferma e rimuove i container, poi elimina ciò che hai scelto. I file scritti dai container possono appartenere a un altro utente (le versioni precedenti scrivevano come uid 1000 o root); se un normale rm viene rifiutato, lo script li elimina da un container temporaneo eseguito come root, e se anche questo fallisce indica `sudo rm -rf` da usare a mano. Lo script si rifiuta di eliminare percorsi che chiaramente non sono di Wanmory, come /, /home, /volume1 o la tua cartella home.',
            },
          ],
        },
      ],
    },
    {
      p: 'Se hai rimosso solo i container mantenendo dati e configurazione, rieseguire install.sh nella stessa cartella ripristina tutto.',
    },
    {
      table: ['Opzione', 'Cosa fa'],
      rows: [
        ['`--dir CARTELLA`', 'Cartella di installazione, predefinita ~/wanmory (oppure imposta `WANMORY_DIR`).'],
        [
          '`-y`, `--yes`',
          'Nessuna domanda: rimuove solo container e rete, mantiene tutti i dati e la configurazione. È anche il comportamento senza terminale interattivo.',
        ],
        [
          '`--purge`',
          'Nessuna domanda: elimina tutto ciò che è nella tabella sopra (tranne le cartelle foto) senza digitare DELETE. Usalo con cautela.',
        ],
        ['`--dry-run`', 'Mostra cosa verrebbe fatto senza modificare nulla.'],
        ['`-h`, `--help`', 'Mostra l’aiuto.'],
      ],
    },
  ],
}

export default docs
