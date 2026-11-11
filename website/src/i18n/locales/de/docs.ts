import type { DocsDict } from '../zh/docs'

// Deutsch · Dokumentation

const docs: DocsDict = {
  title: 'Dokumentation',
  onThisPage: 'In diesem Abschnitt',
  reportIssue: 'Fehler in der Doku melden ↗',
  architecture: 'Architektur →',
  backToTop: 'Nach oben ↑',
  sectionLink: 'Link zu diesem Abschnitt',
  toc: [
    {
      key: 'install',
      title: 'Installation',
      groups: [
        {
          group: 'Erste Schritte',
          items: [
            ['intro', 'Einführung'],
            ['requirements', 'Systemanforderungen'],
            ['quick-start', 'Schnellinstallation'],
          ],
        },
        {
          group: 'Konfiguration',
          items: [
            ['compose', 'docker-compose.yml erklärt'],
            ['env', 'Umgebungsvariablen'],
            ['library', 'Vorhandene Fotoordner einbinden'],
            ['mdns', 'LAN-Domain (mDNS)'],
            ['proxy', 'Reverse Proxy und Internetzugang'],
          ],
        },
        {
          group: 'KI-Dienst',
          items: [
            ['ai-overview', 'Betriebsarten'],
            ['ai-remote', 'KI-Dienst separat betreiben'],
            ['ai-models', 'Modellstufen und Downloads'],
            ['ai-env', 'Umgebungsvariablen des KI-Dienstes'],
          ],
        },
      ],
    },
    {
      key: 'guide',
      title: 'Benutzerhandbuch',
      groups: [
        {
          group: 'Grundlagen',
          items: [
            ['first-run', 'Einrichtung und erste Anmeldung'],
            ['import', 'Hochladen und Importieren'],
            ['browse', 'Durchsuchen, Suchen und Ordnen'],
            ['members-usage', 'Mitglieder und Rechte'],
          ],
        },
        {
          group: 'Systemeinstellungen',
          items: [
            ['settings-members', 'Mitglieder und Anmeldeverlauf'],
            ['settings-ai', 'KI-Einstellungen'],
            ['settings-perf', 'Leistung und Ressourcen'],
            ['settings-general', 'Speicher, Gäste, Karten und Domain'],
            ['settings-update', 'Systemupdate'],
          ],
        },
      ],
    },
    {
      key: 'maintain',
      title: 'Wartung',
      groups: [
        {
          group: 'Wartung',
          items: [
            ['backup', 'Sicherung und Wiederherstellung'],
            ['reset-password', 'Admin-Passwort zurücksetzen'],
            ['troubleshooting', 'Fehlerbehebung'],
            ['uninstall', 'Deinstallation'],
          ],
        },
      ],
    },
  ],
  intro:
    'Diese Dokumentation richtet sich an Administratoren, die Wanmory auf einem NAS, Heimserver oder eigenen Rechner selbst hosten. Sie behandelt Installation, Konfiguration, den Betrieb des KI-Dienstes, die tägliche Nutzung, Systemeinstellungen und Wartung. Systemdesign und Algorithmen finden Sie unter [Architektur](/architecture/).',
  blocks: [
    { h2: 'intro' },
    {
      p: 'Wanmory ist eine quelloffene, selbst gehostete private KI-Fotobibliothek. Sie besteht aus vier Containern: dem Go-Backend (`server`), dem Python-KI-Inferenzdienst (`ml`), der Datenbank PostgreSQL + pgvector (`postgres`) und `mdns`, das die LAN-Domain bekannt gibt. Alle Fotos, Metadaten, Vektoren und die Job-Warteschlange werden lokal gespeichert, ohne Abhängigkeit von einem Cloud-Dienst.',
    },
    {
      ul: [
        'Fotoverwaltung: nach Monaten gruppierte Zeitleiste, Alben und intelligente Alben, Bereinigung von Serien- und ähnlichen Fotos, Reisekarte, Diashows.',
        'KI-Funktionen: Gesichtserkennung und -gruppierung, Suche in natürlicher Sprache (Chinese-CLIP), Texterkennung (PP-OCR), Ästhetikbewertung (KI-Auswahl).',
        'Mehrere Mitglieder: eigene Konten, Löschrechte nach Eigentümerschaft, Anmeldeverlauf.',
      ],
    },

    { h2: 'requirements' },
    {
      table: ['Komponente', 'Minimum', 'Empfohlen'],
      rows: [
        ['CPU-Architektur', 'x86_64 (amd64) oder ARM64', '—'],
        ['Prozessor', 'Klasse Intel N100 / Raspberry Pi 5', 'Klasse Intel i5 oder besser, oder KI-Dienst auf separatem GPU-Rechner'],
        ['Arbeitsspeicher', '4 GB (Stufe „Leicht“ wird automatisch gewählt)', '8 GB oder mehr (Stufe „Ausgewogen“)'],
        ['Speicherplatz', 'Etwa 1–4 GB für Modelle plus Platz für Vorschaubilder', 'SSD für data/ und das Datenbank-Volume'],
        ['Software', 'Docker Engine und Docker Compose v2', '—'],
        ['Betriebssystem', 'Jede Linux-Distribution, auf der Docker läuft', 'Synology DSM, QNAP QTS, TrueNAS SCALE, Unraid, Ubuntu / Debian'],
      ],
    },
    {
      note: 'Images gibt es für `linux/amd64` und `linux/arm64`; Docker lädt automatisch das passende. Docker-Container unter macOS können die Apple-GPU nicht nutzen; für Hardwarebeschleunigung auf einem Mac siehe [KI-Dienst separat betreiben](#ai-remote).',
    },

    { h2: 'quick-start' },
    { h3: 'Variante 1: Installationsskript (empfohlen)' },
    { p: 'Auf einem 64-Bit-Rechner mit Docker ausführen:' },
    { code: 'curl -fsSL https://wanmory.com/install.sh | bash', lang: 'bash' },
    { p: 'Das Skript erledigt nacheinander Folgendes:' },
    {
      ul: [
        'Umgebungsprüfung: CPU-Architektur (amd64 / arm64) und 64-Bit-Userland, Verfügbarkeit von Docker und Docker Compose v2, freier Arbeitsspeicher und Speicherplatz.',
        'Interaktive Konfiguration: Installationsverzeichnis (Standard ~/wanmory), Port (Standard 8080, auf Belegung geprüft), LAN-Domain (Standard wanmory.local), Datenbankpasswort (standardmäßig zufällig) und Speicherort der Datenbank (standardmäßig das Docker-Volume pgdata, alternativ ein Verzeichnis auf einer lokalen Festplatte) sowie Zeitzone (Stadt oder Region eingeben und suchen, etwa shanghai, tokyo oder 北京; bei mehreren Treffern per Nummer wählen).',
        'Speicherorte: Datenverzeichnis (Vorschaubilder, Vorschauen und hochgeladene Fotos, Standard ./data) und KI-Modellverzeichnis (Standard ./models).',
        'Abfragen und Ausgaben des Skripts sind auf Englisch, damit sie in jedem NAS-Terminal korrekt angezeigt werden.',
        'Vorhandene Fotoordner: beliebig viele Ordner nacheinander hinzufügen, jeweils schreibgeschützt (empfohlen) oder mit Schreibzugriff eingebunden.',
        'Schreibt `.env` (Rechte 600); werden Fotoordner angegeben, zusätzlich `docker-compose.override.yml`, die Docker Compose automatisch einbezieht.',
        'Lädt die offizielle docker-compose.yml herunter (bei nicht erreichbarem GitHub automatisch von Gitee), prüft die Konfiguration, zieht die Images, startet die Dienste und gibt die Adresse aus, sobald alles bereit ist.',
      ],
    },
    {
      table: ['Option / Variable', 'Beschreibung'],
      rows: [
        ['`-y`', 'Keine Rückfragen, überall Standardwerte (Datenbankpasswort zufällig). Geeignet für automatisierte Installationen.'],
        ['`--dir VERZEICHNIS`', 'Installationsverzeichnis festlegen.'],
        ['`--dry-run`', 'Nur Umgebung prüfen und Konfigurationsdateien schreiben; keine Images laden, nichts starten.'],
        [
          '`WANMORY_PORT`',
          'Legt den Port vorab fest; ebenso funktionieren WANMORY_DOMAIN, WANMORY_DB_PASSWORD, WANMORY_TZ, WANMORY_DATA_DIR, WANMORY_MODELS_DIR, WANMORY_DB_DIR, WANMORY_REGISTRY und WANMORY_VERSION.',
        ],
        ['`WANMORY_PHOTOS`', 'Fotoordner, durch Kommas getrennt, standardmäßig schreibgeschützt; :rw hinter einem Pfad erlaubt Schreibzugriff, z. B. /volume1/photo,/mnt/usb:rw.'],
      ],
    },
    {
      code: `# Beispiel: nicht interaktiv nach /opt/wanmory installieren, Port 9000, NAS-Fotoordner einbinden
curl -fsSL https://wanmory.com/install.sh | WANMORY_PORT=9000 WANMORY_PHOTOS=/volume1/photo,/volume2/family bash -s -- -y --dir /opt/wanmory`,
      lang: 'bash',
    },
    {
      note: 'Wird das Skript erneut ausgeführt und liegt im Installationsverzeichnis bereits eine .env, bleibt die bestehende Konfiguration standardmäßig erhalten (das Datenbankpasswort lässt sich nach dem ersten Start nicht einfach ändern); nur die Compose-Datei wird aktualisiert und neu gestartet – so dient es auch als Update.',
    },
    { h3: 'Variante 2: Manuelle Installation' },
    {
      steps: [
        {
          title: 'Verzeichnis anlegen und Compose-Datei holen',
          body: [
            { p: 'Legen Sie ein Verzeichnis für Compose-Datei, Daten und Modelle an und laden Sie die offizielle `docker-compose.yml` herunter:' },
            {
              code: `mkdir -p ~/wanmory && cd ~/wanmory
curl -fsSLO https://raw.githubusercontent.com/i-dj/wanmory/main/docker/docker-compose.yml`,
              lang: 'bash',
            },
          ],
        },
        {
          title: '(Optional) .env anlegen',
          body: [
            { p: 'Erstellen Sie im selben Verzeichnis eine `.env`, um Standardwerte zu überschreiben. Ändern Sie im Produktivbetrieb unbedingt das Datenbankpasswort:' },
            {
              code: `WANMORY_DB_PASSWORD=durch-zufaellige-zeichenfolge-ersetzen
WANMORY_PORT=8080
WANMORY_TZ=Europe/Berlin
WANMORY_VERSION=latest`,
              lang: '.env',
            },
          ],
        },
        {
          title: 'Dienste starten',
          body: [
            { p: 'Der erste Start lädt die Images und führt die Datenbankmigrationen automatisch aus:' },
            {
              code: `docker compose up -d
docker compose ps        # prüfen, ob alle vier Dienste running / healthy sind`,
              lang: 'bash',
            },
          ],
        },
        {
          title: 'Aufrufen und einrichten',
          body: [
            {
              p: 'Öffnen Sie `http://wanmory.local:8080` (oder `http://<Host-IP>:8080`) im Browser, legen Sie wie angezeigt das Admin-Konto an und laden Sie dann unter „Systemeinstellungen → KI“ die Modelle herunter. Danach kommen vorhandene Fotos automatisch in die KI-Warteschlange.',
            },
          ],
        },
      ],
    },

    { h2: 'compose' },
    {
      p: 'Die offizielle Compose-Datei definiert vier Dienste: die Datenbank `postgres`, das App-Backend `server`, den LAN-Domain-Dienst `mdns` und den integrierten KI-Dienst `ml`. Was jede Einstellung bewirkt, steht direkt in der Datei:',
    },
    {
      lang: 'yaml',
      code: `# Offizielle Wanmory-Compose-Datei: im Verzeichnis dieser Datei docker compose up -d ausführen
# Variablen der Form \${VAR:-Standard} werden aus .env im selben Verzeichnis gelesen; ohne Wert gilt der Standard

services:
  # ── Datenbank: PostgreSQL 17 + pgvector ──────────────────────────
  # Speichert Foto-Metadaten, Personen, Alben, Einstellungen, Job-Warteschlange und Vektoren (HNSW-Index)
  # Kein Port veröffentlicht; nur im internen Compose-Netzwerk erreichbar
  postgres:
    image: pgvector/pgvector:pg17
    environment:
      POSTGRES_USER: wanmory
      POSTGRES_PASSWORD: \${WANMORY_DB_PASSWORD:-wanmory}   # im Produktivbetrieb unbedingt in .env ändern
      POSTGRES_DB: wanmory
    volumes:
      - \${WANMORY_DB_DIR:-pgdata}:/var/lib/postgresql/data  # standardmäßig Named Volume pgdata; mit WANMORY_DB_DIR in diesem Verzeichnis. In Sicherungen aufnehmen
    healthcheck:                             # server wartet auf diesen Healthcheck und startet erst, wenn die DB bereit ist
      test: ["CMD", "pg_isready", "-U", "wanmory", "-d", "wanmory"]
      interval: 5s
      timeout: 3s
      retries: 20
    restart: unless-stopped

  # ── App-Backend: Go-Programm mit eingebetteter Web-App ───────────
  # Zuständig für API, Uploads (tus), Job-Steuerung, Vorschaubilder und Rechte; führt beim Start DB-Migrationen aus
  server:
    image: \${WANMORY_REGISTRY:-ghcr.io/i-dj}/wanmory-server:\${WANMORY_VERSION:-latest}
    environment:
      DATABASE_URL: postgres://wanmory:\${WANMORY_DB_PASSWORD:-wanmory}@postgres:5432/wanmory
      WANMORY_ML_URL: http://ml:3003         # Adresse des integrierten KI-Dienstes; ein entfernter KI-Dienst wird unter „KI-Einstellungen“ eingetragen
      TZ: \${WANMORY_TZ:-Asia/Shanghai}       # Zeitzone, wenn EXIF keine enthält
      WANMORY_MDNS: "off"                    # im Bridge-Netz kommt kein Multicast an; die Domain gibt der mdns-Dienst unten bekannt
      WANMORY_HTTP_PUBLIC_PORT: \${WANMORY_PORT:-8080}   # in der Web-App angezeigter Port, passend zur Portfreigabe
      WANMORY_DOMAIN: \${WANMORY_DOMAIN:-wanmory.local}  # anfängliche LAN-Domain; nach Änderung in den Web-Einstellungen gilt diese
    ports:
      - "\${WANMORY_PORT:-8080}:8080"         # Host-Port:Container-Port
    volumes:
      - \${WANMORY_DATA_DIR:-./data}:/data    # upload/ enthält hochgeladene Originale, thumbs/ Vorschaubilder und 1440px-Vorschauen
      # Vorhandene Fotoordner als Unterverzeichnisse von /photos einbinden, beliebig viele; :ro = schreibgeschützt; Scan alle 15 Minuten
      # - /mnt/nas/photos:/photos/nas:ro
      # - /media/usb/kamera:/photos/usb:ro
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  # ── LAN-Domain bekannt geben (mDNS) ──────────────────────────────
  # Gleiches Image wie server, startet nur den Unterbefehl mdns; gibt wanmory.local bekannt (in der Web-App änderbar)
  mdns:
    image: \${WANMORY_REGISTRY:-ghcr.io/i-dj}/wanmory-server:\${WANMORY_VERSION:-latest}
    command: ["mdns"]
    network_mode: host                       # Host-Netzwerk ist nötig, um LAN-Multicast zu senden und zu empfangen
    environment:
      WANMORY_URL: http://127.0.0.1:\${WANMORY_PORT:-8080}   # fragt server regelmäßig nach der aktuellen Domain
      WANMORY_DOMAIN: \${WANMORY_DOMAIN:-wanmory.local}  # wird bekannt gegeben, solange server nicht erreichbar ist
    depends_on:
      - server
    restart: unless-stopped

  # ── Integrierter KI-Dienst: FastAPI + ONNX Runtime, nur CPU ──────
  # Zustandslos; empfängt Vorschauen von server und liefert Gesichter, Vektoren und Text; kein Port veröffentlicht
  ml:
    image: \${WANMORY_REGISTRY:-ghcr.io/i-dj}/wanmory-ml:\${WANMORY_VERSION:-latest}
    volumes:
      - \${WANMORY_MODELS_DIR:-./models}:/models  # bewahrt Modelldateien auf, sodass ein neu erstellter Container nichts erneut lädt
    environment:
      WANMORY_MODEL_DIR: /models
      WANMORY_AUTO_DOWNLOAD: "0"             # kein automatischer Download; ein Admin bestätigt zuvor Lizenzen und Speicherbedarf in der Web-App
    restart: unless-stopped

volumes:
  pgdata:`,
    },

    { h2: 'env' },
    { h3: '.env (Compose-Variablen)' },
    { p: 'Diese Variablen werden in `docker-compose.yml` verwendet; tragen Sie sie in die `.env` im selben Verzeichnis ein:' },
    {
      table: ['Variable', 'Standard', 'Beschreibung'],
      rows: [
        ['`WANMORY_DB_PASSWORD`', 'wanmory', 'PostgreSQL-Passwort, auch für die DATABASE_URL von server. Eine Änderung nach dem ersten Start erfordert, auch das Benutzerpasswort in der Datenbank anzupassen.'],
        ['`WANMORY_PORT`', '8080', 'Portfreigabe auf dem Host, auch für die in der Web-App angezeigte Adresse.'],
        ['`WANMORY_TZ`', 'Asia/Shanghai', 'Zeitzone, wenn EXIF-Daten keine Zeitzone enthalten.'],
        ['`WANMORY_VERSION`', 'latest', 'Image-Tag; eine feste Version gibt Ihnen die Kontrolle über den Update-Zeitpunkt.'],
        ['`WANMORY_REGISTRY`', 'ghcr.io/i-dj', 'Image-Registry. Ersetzen Sie sie durch eine erreichbare Registry, falls ghcr.io nicht zugänglich ist.'],
        ['`WANMORY_DATA_DIR`', './data', 'Datenverzeichnis: hochgeladene Originale (upload/) sowie Vorschaubilder und Vorschauen (thumbs/), im Container unter /data.'],
        ['`WANMORY_MODELS_DIR`', './models', 'KI-Modellverzeichnis, im ml-Container unter /models.'],
        [
          '`WANMORY_DB_DIR`',
          'Volume pgdata',
          'Datenbankverzeichnis. Ohne Wert wird das Docker-Volume pgdata genutzt; ein Verzeichnispfad auf einer lokalen Festplatte speichert die Datenbank direkt dort. Keine Netzwerkfreigabe verwenden.',
        ],
        ['`WANMORY_DOMAIN`', 'wanmory.local', 'Anfängliche LAN-Domain, muss auf .local enden. Nach einer Änderung unter „Systemeinstellungen → Zugriffsdomain“ gilt diese.'],
      ],
    },
    { h3: 'Container server (optional)' },
    {
      p: '`DATABASE_URL`, `WANMORY_ML_URL`, `WANMORY_MDNS` und `WANMORY_HTTP_PUBLIC_PORT` sind in der Compose-Datei bereits mit Zweckangabe gesetzt. Die folgenden Variablen stehen nicht in der Standarddatei; fügen Sie sie bei Bedarf zum `environment` von `server` hinzu:',
    },
    {
      table: ['Variable', 'Standard', 'Beschreibung'],
      rows: [
        ['`WANMORY_WORKERS`', 'automatisch', 'Standard-Parallelität für Metadaten- und Vorschau-Jobs. Ohne Wert aus CPU-Kernen und Arbeitsspeicher berechnet; unter „Leistung“ in der Web-App anpassbar.'],
        ['`WANMORY_ML_TOKEN`', 'leer', 'Zugangstoken des integrierten KI-Dienstes; muss mit der gleichnamigen Variable im ml-Container übereinstimmen. Meist nicht nötig.'],
        ['`WANMORY_FACE_MODEL`', 'antelopev2', 'Gesichtsmodell, wenn keine Modellstufe gewählt wurde.'],
        ['`WANMORY_CLIP_MODEL`', 'chinese-clip-vit-h-14', 'Modell für die semantische Suche, wenn keine Modellstufe gewählt wurde.'],
        ['`WANMORY_STORAGE_ROOTS`', 'Datenverzeichnis', 'Verzeichnisse, die in der Web-App durchsucht und ausgewählt werden dürfen, durch Doppelpunkte getrennt.'],
      ],
    },

    { h2: 'library' },
    {
      p: 'Fotos, die schon auf einem NAS oder einer externen Festplatte liegen, müssen nicht hochgeladen werden. Binden Sie den Ordner als Unterverzeichnis von `/photos` im Container ein; er wird alle 15 Minuten gescannt, neue Dateien werden **an Ort und Stelle importiert** (weder kopiert noch verschoben) und anschließend wie hochgeladene Fotos mit Metadaten, Vorschaubildern und KI verarbeitet.',
    },
    {
      lang: 'yaml',
      code: `  server:
    volumes:
      - ./data:/data
      - /mnt/nas/photos:/photos/nas:ro       # :ro bindet schreibgeschützt ein
      - /media/usb/kamera:/photos/usb:ro
      - /home/ich/Bilder:/photos/pictures     # Einbindung mit Schreibzugriff`,
    },
    { p: 'Führen Sie danach `docker compose up -d` aus. Der erste Scan beginnt etwa 20 Sekunden nach dem Neustart des Containers.' },
    {
      ul: [
        '**Schreibgeschützte Einbindung (:ro) empfohlen**: Das System schreibt nichts in diese Ordner. Löschen in der App verschiebt ein Foto nur nach „Zuletzt gelöscht“, endgültiges Löschen entfernt nie die Originaldatei, und spätere Scans importieren sie nicht erneut. Bei Ordnern mit Schreibzugriff löscht endgültiges Löschen auch die Originaldatei.',
        'Inhaltlich identische Dateien werden nur einmal importiert (Abgleich per SHA-1-Prüfsumme), auch bereits hochgeladene Dateien und Duplikate über mehrere Ordner hinweg.',
        'Versteckte Ordner und NAS-Systemordner (.xxx, @eaDir, #recycle usw.) werden automatisch übersprungen.',
        'Aus Fotoordnern importierte Fotos gehören keinem Mitglied; nur Admins können sie löschen.',
      ],
    },

    { h2: 'mdns' },
    {
      p: 'Der Dienst `mdns` läuft im Host-Netzwerkmodus und gibt die Zugriffsdomain im LAN bekannt (Standard `wanmory.local`). macOS, iOS, iPadOS und Windows 10 oder neuer erreichen sie ohne Router-Konfiguration unter `http://wanmory.local:8080`. Die Domain lässt sich unter „Systemeinstellungen → Zugriffsdomain“ ändern und muss auf `.local` enden.',
    },
    {
      note: 'Manche Android-Geräte können mDNS-Namen nicht auflösen; nutzen Sie dann die IP-Adresse. Ist Port 5353 bereits belegt (etwa bei Synology), startet der mdns-Dienst eventuell nicht; auch dann einfach die IP verwenden. Andere Funktionen sind nicht betroffen.',
      warn: true,
    },

    { h2: 'proxy' },
    {
      p: 'Web-Uploads nutzen das fortsetzbare Protokoll [tus](https://tus.io) (`/api/uploads/`) mit 16-MB-Blöcken. Hinter einem Reverse Proxy müssen Sie die Begrenzung der Anfragegröße aufheben und das Request-Buffering abschalten. Nginx-Beispiel:',
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
    client_max_body_size 0;          # keine Größenbegrenzung (mindestens 20m)
    proxy_request_buffering off;     # durchreichen statt auf der Platte des Proxys zwischenspeichern
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
}`,
    },
    {
      note: 'Bevor Sie die Bibliothek ins Internet stellen: HTTPS verwenden, die Gastansicht in den Systemeinstellungen abschalten und für alle Mitglieder starke Passwörter setzen. Der kostenlose Cloudflare-Tarif begrenzt eine Anfrage auf 100 MB, 16-MB-Blöcke brauchen also keine weitere Konfiguration.',
      warn: true,
    },

    { h2: 'ai-overview' },
    {
      p: 'Der KI-Dienst ist ein zustandsloser HTTP-Dienst: Er empfängt Vorschauen mit 1440 Pixeln vom Backend und liefert Gesichter, Vektoren und erkannten Text zurück. Er greift nie auf die Datenbank zu und speichert keine Dateien. Das Backend kennt zwei Betriebsarten, umschaltbar unter „Systemeinstellungen → KI → KI-Betriebsart“:',
    },
    {
      table: ['Betriebsart', 'Wo er läuft', 'Geeignet für'],
      rows: [
        ['Integriert (nur CPU)', 'ml-Container in Compose, nur im internen Netz erreichbar', 'Sofort einsatzbereit; NAS oder Mini-PC mit überschaubarer Bibliothek oder wenn eine längere Erstverarbeitung in Ordnung ist'],
        ['Entfernter Dienst', 'Anderer Rechner im LAN, Python-Dienst direkt ausgeführt', 'Mac mit Apple Silicon (CoreML / MPS) oder Rechner mit NVIDIA-GPU (CUDA); verkürzt die Erstverarbeitung erheblich'],
      ],
    },
    { p: 'Ist der KI-Dienst nicht verfügbar, bleiben KI-Jobs in der Warteschlange und werden nicht mehr geholt, sodass keine Wiederholungen verbraucht werden; sobald der Dienst zurück ist, geht es automatisch weiter. Durchsuchen, Uploads und andere Funktionen sind nicht betroffen.' },

    { h2: 'ai-remote' },
    { h3: 'Variante 1: Direkt auf einem Mac oder GPU-Rechner (empfohlen)' },
    {
      p: 'Direkt ausgeführt nutzt der Dienst Hardwarebeschleunigung: Auf Apple Silicon verwenden die Gesichtsmodelle CoreML und Chinese-CLIP MPS; auf NVIDIA-GPUs läuft Chinese-CLIP per CUDA in halber Genauigkeit (etwa 1,9 GB VRAM / Arbeitsspeicher). Installieren Sie zuerst [uv](https://docs.astral.sh/uv/).',
    },
    {
      lang: 'bash',
      code: `git clone https://github.com/i-dj/wanmory.git
cd wanmory/ml
uv sync --extra torch                 # PyTorch-Abhängigkeiten installieren (GPU-beschleunigte semantische Suche)

# Zugangstoken erzeugen; Backend und KI-Dienst verwenden denselben Wert
export WANMORY_ML_TOKEN=$(openssl rand -hex 24)
echo $WANMORY_ML_TOKEN

WANMORY_FACE_MODEL_PRELOAD=1 uv run --extra torch python -m wanmory_ml
# lauscht standardmäßig auf 0.0.0.0:3003; änderbar mit WANMORY_ML_HOST / WANMORY_ML_PORT`,
    },
    { h3: 'Variante 2: Docker-Image auf einem anderen Rechner' },
    { p: 'Für einen leistungsstärkeren x86-Rechner ohne nutzbare GPU; das Image verwendet nur die CPU:' },
    {
      lang: 'bash',
      code: `docker run -d --name wanmory-ml --restart unless-stopped \\
  -p 3003:3003 \\
  -e WANMORY_ML_TOKEN=<Zugangstoken> \\
  -v $PWD/models:/models \\
  ghcr.io/i-dj/wanmory-ml:latest`,
    },
    { h3: 'Entfernten Dienst im Backend aktivieren' },
    {
      steps: [
        { title: 'KI-Einstellungen öffnen', body: [{ p: 'Öffnen Sie als Admin „Systemeinstellungen → KI → KI-Betriebsart“ und wählen Sie „Entfernter Dienst“.' }] },
        {
          title: 'Adresse und Token eintragen',
          body: [{ p: 'Die Adresse sieht etwa so aus: `http://192.168.1.20:3003`; als Token den im vorigen Schritt erzeugten Wert. Vor dem Speichern wird die Verbindung getestet und Latenz sowie Dienstversion angezeigt.' }],
        },
        { title: 'Stufe und Modelle bestätigen', body: [{ p: 'Nach erfolgreicher Verbindung wird eine Stufe „Automatisch“ anhand der Hardware des entfernten Rechners neu empfohlen; laden Sie unter „Modellstufe“ die benötigten Modelle herunter.' }] },
      ],
    },
    { note: 'Machen Sie einen entfernten KI-Dienst nur im LAN oder über ein VPN (etwa Tailscale) erreichbar und setzen Sie immer ein Token. Für Verbindungen über das Internet einen HTTPS-Reverse-Proxy verwenden.', warn: true },

    { h2: 'ai-models' },
    {
      p: 'Die Stufe bestimmt, welche Modelle für Gesichter und semantische Suche verwendet werden. Mit „Automatisch“ empfiehlt das System eine Stufe anhand der Hardware des Rechners, auf dem der KI-Dienst läuft: mit nutzbarer GPU „Hohe Genauigkeit“; nur mit CPU und weniger als 6 GB Arbeitsspeicher „Leicht“, sonst „Ausgewogen“.',
    },
    {
      table: ['Stufe', 'Gesichtserkennung + Merkmale', 'Semantische Suche', 'Passende Hardware'],
      rows: [
        ['Hohe Genauigkeit (quality)', 'antelopev2 (SCRFD-10G + ArcFace R100)', 'Chinese-CLIP ViT-H/14 (1024-d)', 'Mac mit Apple Silicon, NVIDIA-GPU'],
        ['Ausgewogen (balanced)', 'antelopev2', 'Chinese-CLIP ViT-L/14 (768-d)', 'NAS der Intel-i5-Klasse'],
        ['Leicht (lite)', 'buffalo_l (ArcFace R50)', 'Chinese-CLIP ViT-B/16 (512-d)', 'N100, Raspberry Pi 5'],
      ],
    },
    {
      ul: [
        'Die Texterkennung nutzt PP-OCRv6 (RapidOCR); ihre Modelle kommen mit den Abhängigkeiten und brauchen keinen eigenen Download.',
        'Nach einem Stufenwechsel werden für alle Fotos die Gesichter mit den neuen Modellen neu erkannt und die semantischen Vektoren neu berechnet; die Suche nutzt so lange die alten Vektoren, benannte Personen bleiben erhalten.',
        'Modelle werden in das eingebundene Verzeichnis ./models geladen; nicht mehr genutzte Modelle lassen sich löschen, um Platz zu schaffen (das aktive Modell nicht).',
        'Die InsightFace-Gesichtsmodelle sind nur für nicht kommerzielle Nutzung freigegeben; vor kommerzieller Nutzung ersetzen oder eine Lizenz erwerben.',
      ],
    },

    { h2: 'ai-env' },
    {
      table: ['Variable', 'Standard', 'Beschreibung'],
      rows: [
        ['`WANMORY_ML_HOST`', '0.0.0.0', 'Lauschadresse.'],
        ['`WANMORY_ML_PORT`', '3003', 'Lauschport.'],
        ['`WANMORY_ML_TOKEN`', 'leer', 'Zugangstoken; ist es gesetzt, muss jede Anfrage Authorization: Bearer enthalten.'],
        ['`WANMORY_MODEL_DIR`', '~/.cache/wanmory/models', 'Modellverzeichnis; im Image /models.'],
        ['`WANMORY_AUTO_DOWNLOAD`', 'im Image 0', 'Ob Modelle bei erster Nutzung automatisch geladen werden.'],
        ['`WANMORY_FACE_MODEL_PRELOAD`', '—', 'Auf 1 gesetzt, werden die Gesichtsmodelle beim Start geladen; Chinese-CLIP lädt im Hintergrund.'],
        ['`WANMORY_UNLOAD_AFTER`', '5 / 30 Minuten', 'Sekunden Inaktivität, bevor ein Modell entladen wird, um Speicher freizugeben; 0 entlädt nie. Der Standard hängt vom Arbeitsspeicher des Hosts ab.'],
      ],
    },

    { h2: 'first-run' },
    {
      steps: [
        { title: 'Admin anlegen', body: [{ p: 'Beim ersten Aufruf erkennt das System, dass noch kein Konto existiert, und führt durch das Anlegen eines Admins. Admins können Mitglieder hinzufügen und Systemeinstellungen ändern.' }] },
        { title: 'Modelle herunterladen', body: [{ p: 'Öffnen Sie „Systemeinstellungen → KI“, bestätigen Sie die Modellstufe und laden Sie die Modelle herunter. Bis sie bereit sind, warten KI-Jobs in der Warteschlange.' }] },
        { title: 'Fotos importieren', body: [{ p: 'Laden Sie über die Web-App hoch oder binden Sie die Fotos auf Ihrem NAS wie unter [Vorhandene Fotoordner einbinden](#library) beschrieben ein.' }] },
        { title: 'Mitglieder hinzufügen', body: [{ p: 'Legen Sie unter „Systemeinstellungen → Mitglieder“ Konten für weitere Personen an und wählen Sie die Rolle „Mitglied“ oder „Admin“.' }] },
      ],
    },

    { h2: 'import' },
    {
      ul: [
        'Web-Uploads unterstützen Fotos, Videos, HEIC, RAW (etwa DNG) und mehr, mit Mehrfachauswahl; hochgeladen wird in Blöcken über das tus-Protokoll, fortsetzbar nach Verbindungsabbruch oder Neuladen der Seite.',
        'Hochgeladene Dateien werden nach Jahr und Monat im Upload-Verzeichnis abgelegt (Standard data/upload). Das Verzeichnis lässt sich unter „Systemeinstellungen → Upload-Verzeichnis“ ändern; das gilt nur für neue Uploads.',
        'Nach dem Import laufen nacheinander: Metadaten lesen (ExifTool) → Vorschaubilder und 1440-Pixel-Vorschau erzeugen (libvips / FFmpeg) → semantische Vektoren, Gesichter und Text erkennen (KI-Dienst) → Reverse Geocoding.',
        'Die Anzeige der Hintergrundaufgaben oben in der Seitenleiste zeigt Fortschritt und geschätzte Restzeit für „Fotos importieren“ und „KI-Erkennung“, gezählt in Fotos.',
      ],
    },

    { h2: 'browse' },
    {
      table: ['Funktion', 'Beschreibung'],
      rows: [
        ['Bibliothek', 'Foto-Zeitleiste nach Monaten, oben das KI-Auswahl-Karussell und „Heute vor …“.'],
        ['Suche in natürlicher Sprache', 'Eine Beschreibung eingeben (etwa „Fotos vom dritten Geburtstag des Babys“); die Ergebnisse werden aus erkanntem Text, Aufnahmeort und semantischer Ähnlichkeit (Chinese-CLIP) gerankt. Ein Kategoriename liefert direkt diese Kategorie.'],
        ['Personen', 'Gesichter werden automatisch gruppiert; aufgeführt wird, wer auf mindestens 3 Fotos vorkommt. Benennen, zusammenführen, Geburtstag setzen und Entwicklung nach Alter, Orte und Gruppenfotos ansehen.'],
        ['Alben · Intelligente Alben', 'Alben enthalten von Hand gewählte Fotos und können privat sein; intelligente Alben sammeln Fotos automatisch nach Person, Ort, Zeit und weiteren Bedingungen.'],
        ['Orte', 'Zeigt Aufnahmeorte per GPS auf einer Karte, mit den Ansichten Karte, Satellit und Raster.'],
        ['Serien & Ähnliche', 'Gruppiert Serien- und ähnliche Fotos automatisch und empfiehlt das beste zum Behalten; „Duplikate“ listet inhaltlich identische Dateien.'],
        ['Diashows', 'Bibliothek, Alben, Personen und Erinnerungen abspielen; Hochformatfotos werden zu zweit oder dritt auf einer Seite kombiniert, mit Hintergrundmusik und Übergängen.'],
      ],
    },

    { h2: 'members-usage' },
    {
      table: ['Rolle', 'Rechte'],
      rows: [
        ['Admin', 'Mitglieder hinzufügen und entfernen, Passwörter von Mitgliedern zurücksetzen, Systemeinstellungen ändern; kann jedes Foto löschen.'],
        ['Mitglied', 'Fotos hochladen, ansehen und ordnen; kann nur eigene Uploads löschen; kann keine Systemeinstellungen ändern.'],
        ['Gast', 'Bei aktivierter Gastansicht können nicht angemeldete Besucher geteilte Inhalte nur ansehen; private Alben und ausgeblendete Fotos sind unsichtbar.'],
      ],
    },
    { p: 'Personeninformationen (Namen, Zusammenführungen) teilen sich alle Mitglieder; Fotoanzahl, Titelbilder und Personenseiten werden aus den Fotos berechnet, die das jeweilige Mitglied sehen kann, und ausgeblendete Fotos sieht nur ihr Eigentümer.' },

    { h2: 'settings-members' },
    {
      ul: [
        'Mitglieder: Beim Hinzufügen Namen, Startpasswort (mindestens 4 Zeichen) und Rolle festlegen; Passwörter lassen sich zurücksetzen und Mitglieder entfernen.',
        'Anmeldeverlauf: Erfasst Zeit, Gerät und IP jeder Anmeldung, der Standort wird offline aus der IP geschätzt (ip2region); die letzten sechs Monate bleiben erhalten. Nur für Admins sichtbar.',
        'Unter „Mein Konto“ kann jedes Mitglied Passwort und Avatar ändern und die angemeldeten Geräte sehen.',
      ],
    },

    { h2: 'settings-ai' },
    {
      table: ['Einstellung', 'Optionen', 'Beschreibung'],
      rows: [
        ['KI-Betriebsart', 'Integriert (nur CPU) / Entfernter Dienst', 'Ein entfernter Dienst braucht Adresse und Token, die Verbindung wird vor dem Wechsel geprüft; ist der Dienst nicht verfügbar, pausiert die KI-Verarbeitung.'],
        ['Rechengerät', 'Automatisch / GPU / Nur CPU', 'Ohne nutzbare Grafikkarte ist nur CPU wählbar; ein Wechsel lädt die Modelle neu, laufende KI-Verarbeitung geht kurz danach weiter.'],
        ['Modellstufe', 'Automatisch / Hohe Genauigkeit / Ausgewogen / Leicht', 'Nach einem Wechsel werden alle Fotos mit den neuen Modellen neu verarbeitet, mit Fortschrittsanzeige.'],
        ['Modellverwaltung', 'Herunterladen / Löschen', 'Zeigt Größe und Status jedes Modells (aktiv, heruntergeladen, nicht heruntergeladen).'],
      ],
    },

    { h2: 'settings-perf' },
    {
      table: ['Einstellung', 'Optionen', 'Beschreibung'],
      rows: [
        ['Verarbeitungszeitpunkt', 'Im Leerlauf / Jederzeit / Nachts', 'Im Leerlauf: KI pausiert während Uploads und Vorschauerzeugung; Jederzeit: verarbeitet durchgehend, Uploads können langsamer werden; Nachts: nur im festgelegten Zeitfenster.'],
        ['Parallele Fotoverarbeitung', 'Zahl', 'Wie viele Fotos gleichzeitig ausgelesen und mit Vorschaubildern versehen werden; Standard aus CPU-Kernen und Arbeitsspeicher berechnet.'],
        ['Parallele KI-Verarbeitung', 'Zahl', 'Wie viele Fotos gleichzeitig an den KI-Dienst gehen.'],
        ['CPU-Threads', 'Zahl', 'CPU-Threads pro Modell für die Inferenz.'],
      ],
    },
    { p: 'Oben auf der Karte steht live der Status der KI (läuft oder Grund der Pause). Änderungen wirken sofort, ohne Neustart.' },

    { h2: 'settings-general' },
    {
      table: ['Einstellung', 'Standard', 'Beschreibung'],
      rows: [
        ['Upload-Verzeichnis', 'data/upload', 'Hochgeladene Dateien nach Jahr und Monat; Änderungen gelten nur für neue Uploads.'],
        ['Gastansicht', 'Ein', 'Erlaubt nicht angemeldeten Besuchern, geteilte Inhalte anzusehen. Bei Internetzugang besser abschalten.'],
        ['Online-Karten', 'Ein', 'Zeigt Karten, Ortsnamen und Ortssuche und sendet dafür Fotostandorte an den Kartendienst; ausgeschaltet nur Koordinaten.'],
        ['Kartenanbieter', 'Automatisch', 'Automatisch: AMap in Festlandchina, OpenStreetMap anderswo; einer von beiden lässt sich auch festlegen.'],
        ['Zugriffsdomain', 'wanmory.local', 'LAN-Zugriffsdomain; muss auf .local enden.'],
      ],
    },

    { h2: 'settings-update' },
    { p: '„Systemeinstellungen → Systemupdate“ zeigt die aktuellen Versionen von Backend und KI-Dienst und meldet neue Versionen. Zum Aktualisieren im Verzeichnis mit der `docker-compose.yml` ausführen:' },
    { code: 'docker compose pull && docker compose up -d', lang: 'bash' },
    { p: 'Datenbankmigrationen laufen beim Start von server automatisch. Haben Sie mit `WANMORY_VERSION` eine Version festgelegt, ändern Sie zuerst das Tag in der `.env`.' },

    { h2: 'backup' },
    { p: 'Drei Arten von Daten sollten gesichert werden:' },
    {
      table: ['Daten', 'Ort', 'Beschreibung'],
      rows: [
        ['Datenbank', 'Named Volume pgdata', 'Foto-Metadaten, Personen, Alben, Einstellungen, Vektoren und Job-Warteschlange.'],
        ['Uploads und Vorschaubilder', './data', 'Hochgeladene Originale (data/upload) und Vorschaubilder (data/thumbs); Vorschaubilder lassen sich neu erzeugen.'],
        ['Fotoordner', 'unter /photos eingebundene Ordner', 'Über die eigene Sicherung des NAS abgedeckt; die App ändert schreibgeschützt eingebundene Ordner nie.'],
      ],
    },
    {
      lang: 'bash',
      code: `# Datenbank exportieren
docker compose exec -T postgres pg_dump -U wanmory -Fc wanmory > wanmory-$(date +%F).dump

# In eine neue Installation zurückspielen (zuerst docker compose up -d postgres ausführen)
docker compose exec -T postgres pg_restore -U wanmory -d wanmory --clean < wanmory-2026-11-10.dump`,
    },
    { note: 'Die Modelldateien in ./models müssen nicht gesichert werden; sie lassen sich in der Web-App erneut herunterladen.' },

    { h2: 'reset-password' },
    { p: 'Vergisst ein Mitglied sein Passwort, setzt ein Admin es unter „Systemeinstellungen → Mitglieder“ zurück. Vergisst der Admin sein eigenes, führen Sie auf dem Host, auf dem die App läuft, im Verzeichnis mit der `docker-compose.yml` aus:' },
    {
      lang: 'bash',
      code: `docker compose exec server wanmory reset-password            # Konten auflisten und eines wählen
docker compose exec server wanmory reset-password <Name>      # Konto direkt angeben`,
    },
    {
      ul: [
        'Der Befehl listet alle Konten (Name, Rolle, Erstellungszeit, letzte Anmeldung); per Nummer wählen und das neue Passwort zweimal eingeben.',
        'Nach dem Zurücksetzen ist das Konto auf allen Geräten abgemeldet; Fotos und Alben bleiben unberührt.',
        'Das geht nur auf dem Host, in der Web-App gibt es dafür keinen Zugang. Ohne Docker wanmory reset-password mit denselben Umgebungsvariablen wie der Server ausführen, etwa DATABASE_URL.',
      ],
    },

    { h2: 'troubleshooting' },
    {
      table: ['Symptom', 'Was zu prüfen ist'],
      rows: [
        ['wanmory.local nicht erreichbar', 'Prüfen, ob der mdns-Dienst läuft (docker compose ps); manche Android-Geräte unterstützen kein mDNS, dann die IP nutzen; prüfen, ob Port 5353 auf dem Host belegt ist.'],
        ['KI-Einstellungen zeigen „Keine Verbindung, KI-Verarbeitung pausiert“', 'Bei integriertem Betrieb die Logs des ml-Containers prüfen (docker compose logs ml); bei entferntem Betrieb Adresse, Port, Firewall und Token abgleichen.'],
        ['Keine Ergebnisse bei Personen oder Suche', 'Prüfen, ob die Modelle heruntergeladen sind; unter „Leistung“ prüfen, ob die KI durch den Verarbeitungszeitpunkt pausiert; den KI-Fortschritt in der Aufgabenanzeige ansehen.'],
        ['Große Uploads schlagen fehl', 'Die Größenbegrenzung des Reverse Proxys ist zu klein; client_max_body_size wie unter „Reverse Proxy und Internetzugang“ beschrieben anpassen.'],
        ['Fotos aus einem eingebundenen Ordner erscheinen nicht', 'Ordner müssen als Unterverzeichnisse von /photos eingebunden sein; der erste Scan läuft etwa 20 Sekunden nach dem Start, danach alle 15 Minuten; versteckte Ordner werden übersprungen.'],
        ['Images laden langsam oder gar nicht', 'In der .env WANMORY_REGISTRY auf eine erreichbare Registry setzen.'],
      ],
    },
    {
      p: 'Die Logs der Dienste zeigen `docker compose logs -f server` und `docker compose logs -f ml`. Besteht das Problem weiter, melden Sie es auf der Seite [Problem melden](/feedback/) mit Versionsnummer und den relevanten Logs.',
    },

    { h2: 'uninstall' },
    { p: 'Führen Sie auf dem Host, auf dem Wanmory läuft, das Deinstallationsskript aus:' },
    { code: 'curl -fsSL https://wanmory.com/uninstall.sh | bash', lang: 'bash' },
    {
      p: 'Das Skript liest zuerst die .env im Installationsverzeichnis und listet Container, Datenbank, Datenverzeichnis und KI-Modelle samt Speicherbedarf sowie die eingebundenen Fotoordner auf. Danach stoppt und entfernt es Container und Netzwerk und fragt für jeden Punkt einzeln, ob er gelöscht werden soll (standardmäßig bleibt alles erhalten):',
    },
    {
      table: ['Punkt', 'Beschreibung'],
      rows: [
        ['Datenbank', 'Das Docker-Volume pgdata oder das per WANMORY_DB_DIR festgelegte Verzeichnis. Einmal gelöscht, sind Personen, Alben, Einstellungen und KI-Ergebnisse nicht wiederherstellbar.'],
        ['Datenverzeichnis', 'Vorschaubilder, Vorschauen und über die Web-App hochgeladene Originalfotos.'],
        ['KI-Modelle', 'Lassen sich nach einer Neuinstallation über die Web-App erneut laden.'],
        ['Docker-Images', 'Einschließlich des postgres/pgvector-Images; lassen sich erneut laden. Von anderen Containern genutzte Images werden nicht entfernt.'],
        ['Konfigurationsdateien', '.env (mit dem Datenbankpasswort), docker-compose.yml und docker-compose.override.yml; ist das Verzeichnis danach leer, wird es mit entfernt.'],
      ],
    },
    {
      ul: [
        'Eingebundene vorhandene Fotoordner (NAS, externe Festplatten) werden nie gelöscht.',
        'Wer Datenbank oder Datenverzeichnis löschen möchte, muss zur Bestätigung DELETE eingeben.',
        'Werden nur die Container entfernt und die Daten behalten, stellt ein erneutes install.sh im selben Verzeichnis alles wieder her; löschen Sie die .env, behalten aber die Datenbank, notieren Sie vorher das darin enthaltene WANMORY_DB_PASSWORD.',
      ],
    },
    {
      table: ['Option', 'Beschreibung'],
      rows: [
        ['`--dir VERZEICHNIS`', 'Installationsverzeichnis festlegen; Standard ~/wanmory.'],
        ['`-y`', 'Nicht interaktiv: nur Container und Netzwerk entfernen, alle Daten und die Konfiguration behalten.'],
        ['`--purge`', 'Nicht interaktiv: alle Punkte der obigen Tabelle löschen (außer Fotoordnern).'],
        ['`--dry-run`', 'Nur anzeigen, was geschehen würde, ohne etwas zu ändern.'],
      ],
    },
  ],
}

export default docs
