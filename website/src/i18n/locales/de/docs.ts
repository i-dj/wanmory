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
          group: 'Installationsskript',
          items: [
            ['install-script', 'Skriptoptionen'],
            ['install-steps', 'Das Skript Schritt für Schritt'],
            ['install-faq', 'Installations-FAQ'],
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
            ['ai-schedule', 'Wann die KI arbeitet'],
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
            ['update', 'Aktualisieren'],
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
    'Diese Dokumentation richtet sich an Administratoren, die Wanmory auf einem NAS, Server oder eigenen Rechner selbst hosten. Sie behandelt Installation, Konfiguration, den Betrieb des KI-Dienstes, die tägliche Nutzung, Systemeinstellungen und Wartung. Systemdesign und Algorithmen finden Sie unter [Architektur](/architecture/).',
  blocks: [
    {
      h2: 'intro',
    },
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
    {
      h2: 'requirements',
    },
    {
      table: ['Komponente', 'Minimum', 'Empfohlen'],
      rows: [
        ['CPU-Architektur', 'x86_64 (amd64) oder ARM64', '—'],
        [
          'Prozessor',
          'Klasse Intel N100 / Raspberry Pi 5',
          'Klasse Intel i5 oder besser, oder KI-Dienst auf separatem GPU-Rechner',
        ],
        ['Arbeitsspeicher', '4 GB (Stufe „Leicht“ wird automatisch gewählt)', '8 GB oder mehr (Stufe „Ausgewogen“)'],
        [
          'Speicherplatz',
          'Etwa 1–4 GB für Modelle plus Platz für Vorschaubilder',
          'SSD für data/ und das Datenbank-Volume',
        ],
        ['Software', 'Docker Engine und Docker Compose v2', '—'],
        [
          'Betriebssystem',
          'Jede Linux-Distribution, auf der Docker läuft',
          'Synology DSM, QNAP QTS, TrueNAS SCALE, Unraid, Ubuntu / Debian',
        ],
      ],
    },
    {
      note: 'Images gibt es für `linux/amd64` und `linux/arm64`; Docker lädt automatisch das passende. Docker-Container unter macOS können die Apple-GPU nicht nutzen; für Hardwarebeschleunigung auf einem Mac siehe [KI-Dienst separat betreiben](#ai-remote).',
    },
    {
      h2: 'quick-start',
    },
    {
      h3: 'Variante 1: Installationsskript (empfohlen)',
    },
    {
      p: 'Auf 64-Bit-Linux oder macOS mit Docker ausführen (auf einem Synology-, QNAP- oder ähnlichen NAS zuerst per SSH anmelden):',
    },
    {
      code: 'curl -fsSL https://wanmory.com/install.sh | bash',
      lang: 'bash',
    },
    {
      p: 'Das Skript stellt eine Frage nach der anderen; Enter übernimmt den Standardwert in eckigen Klammern. Bei der ersten Installation kannst du einfach jedes Mal Enter drücken. Jede Option ist unter [Skriptoptionen](#install-script) erklärt, jede Meldung unter [Das Skript Schritt für Schritt](#install-steps). Danach die angezeigte Adresse im Browser öffnen, das Admin-Konto anlegen und unter Einstellungen → Wie die KI läuft die Modelle herunterladen.',
    },
    {
      note: 'Wer zuerst sehen will, was das Skript tut, lädt es herunter, liest es und startet es dann: `curl -fsSLO https://wanmory.com/install.sh`, danach `bash install.sh`. Mit `--dry-run` prüft es nur das System und schreibt die Konfigurationsdateien, ohne Images zu laden oder etwas zu starten.',
    },
    {
      h3: 'Variante 2: Manuelle Installation',
    },
    {
      steps: [
        {
          title: 'Verzeichnis anlegen und Compose-Datei holen',
          body: [
            {
              p: 'Legen Sie ein Verzeichnis für Compose-Datei, Daten und Modelle an und laden Sie die offizielle `docker-compose.yml` herunter:',
            },
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
            {
              p: 'Erstellen Sie im selben Verzeichnis eine `.env`, um Standardwerte zu überschreiben. Ändern Sie im Produktivbetrieb unbedingt das Datenbankpasswort:',
            },
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
            {
              p: 'Der erste Start lädt die Images und führt die Datenbankmigrationen automatisch aus:',
            },
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
    {
      h2: 'install-script',
    },
    {
      p: 'Aufruf: `curl -fsSL https://wanmory.com/install.sh | bash -s -- [Optionen]` oder nach dem Herunterladen `bash install.sh [Optionen]`.',
    },
    {
      h3: 'Kommandozeilenoptionen',
    },
    {
      table: ['Option', 'Wirkung'],
      rows: [
        [
          '`-y`, `--yes`',
          'Keine Fragen: alle Standardwerte (bzw. die Umgebungsvariablen unten) verwenden; das Datenbankpasswort wird erzeugt. Passiert auch automatisch ohne interaktives Terminal (z. B. aus einem anderen Skript heraus).',
        ],
        ['`--dir VERZ`', 'Installationsverzeichnis, Standard `~/wanmory` (oder `WANMORY_DIR` setzen).'],
        [
          '`--dry-run`',
          'Nur System prüfen, `.env` und `docker-compose.yml` schreiben und prüfen; nichts wird geladen oder gestartet.',
        ],
        ['`-h`, `--help`', 'Hilfe anzeigen.'],
      ],
    },
    {
      h3: 'Umgebungsvariablen',
    },
    {
      p: 'Vor den Befehl schreiben. Bei der interaktiven Installation werden sie zur Standardantwort jeder Frage, mit `-y` direkt verwendet. Alle außer `WANMORY_DIR` und `WANMORY_PHOTOS` landen in `.env`.',
    },
    {
      table: ['Variable', 'Standard', 'Wirkung'],
      rows: [
        ['`WANMORY_DIR`', '~/wanmory', 'Installationsverzeichnis, wie `--dir`.'],
        [
          '`WANMORY_PORT`',
          '8080',
          'Web-Port. Ist er belegt, fragt die interaktive Installation nach einem anderen; mit `-y` bricht das Skript mit Fehler ab.',
        ],
        [
          '`WANMORY_DOMAIN`',
          'wanmory.local',
          'Domain im lokalen Netz. Muss auf `.local` enden und darf nur Buchstaben, Ziffern und Bindestriche enthalten.',
        ],
        ['`WANMORY_DB_PASSWORD`', 'erzeugt', 'Datenbankpasswort. Ist es gesetzt, fragt das Skript nicht.'],
        [
          '`WANMORY_DB_DIR`',
          'leer (Docker-Volume pgdata)',
          'Ein Verzeichnis auf diesem Rechner für die Datenbank; leer bedeutet Docker-Volume. Keine Netzwerkfreigabe verwenden.',
        ],
        [
          '`WANMORY_TZ`',
          'Zeitzone dieses Rechners, sonst Asia/Shanghai',
          'Für Fotos ohne Zeitzone in den EXIF-Daten. Vollständigen Namen wie `Europe/Berlin` angeben; interaktiv kann man auch nach einer Stadt suchen.',
        ],
        [
          '`WANMORY_DATA_DIR`',
          './data',
          'Datenverzeichnis: Miniaturen, Vorschauen und über die Webseite hochgeladene Fotos. Relative Pfade gelten ab dem Installationsverzeichnis.',
        ],
        ['`WANMORY_MODELS_DIR`', './models', 'KI-Modellverzeichnis, braucht 1–4 GB.'],
        [
          '`WANMORY_PHOTOS`',
          'leer',
          'Vorhandene Fotoordner, durch Kommas getrennt, standardmäßig schreibgeschützt; `:rw` hinter einem Pfad für Lesen und Schreiben, z. B. `/volume1/photo,/mnt/usb:rw`.',
        ],
        [
          '`WANMORY_REGISTRY`',
          'ghcr.io/i-dj',
          'Image-Registry. Auf einen erreichbaren Mirror ändern, wenn ghcr.io langsam oder gesperrt ist.',
        ],
        [
          '`WANMORY_VERSION`',
          'latest',
          'Welche Version installiert wird, z. B. `0.4.1`. Der Startbildschirm zeigt die Version an.',
        ],
      ],
    },
    {
      code: `# Beispiel: ohne Fragen nach /opt/wanmory auf Port 9000, zwei NAS-Fotoordner schreibgeschützt einbinden
curl -fsSL https://wanmory.com/install.sh | WANMORY_PORT=9000 WANMORY_PHOTOS=/volume1/photo,/volume2/family bash -s -- -y --dir /opt/wanmory`,
      lang: 'bash',
    },
    {
      h2: 'install-steps',
    },
    {
      p: 'Die Meldungen des Skripts sind englisch, damit sie in jedem NAS-Terminal korrekt angezeigt werden. Hier jeder Schritt in der Reihenfolge des Auftretens: grünes ✔ heißt bestanden, gelbes ! ist ein Hinweis (es geht weiter), rotes ✘ ist ein Fehler, der das Skript beendet.',
    },
    {
      steps: [
        {
          title: 'Startbildschirm',
          body: [
            {
              p: 'Zeigt den WANMORY-Schriftzug und `Installing version v0.4.1`: die zu installierende Version – `WANMORY_VERSION`, falls gesetzt, sonst die neueste Veröffentlichung.',
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
                  a: 'Betriebssystem. Unter macOS der Hinweis, dass KI im Container die Apple-GPU nicht nutzen kann; für Tempo den KI-Dienst direkt auf dem Mac starten (siehe [KI-Dienst separat betreiben](#ai-remote)). Andere Systeme brechen hier ab.',
                },
                {
                  q: '`CPU: x86_64 (linux/amd64 images)`',
                  a: 'CPU-Architektur. Nur 64-Bit amd64 und arm64; ein 32-Bit-System (auch älteres Raspberry Pi OS mit 64-Bit-Kernel, aber 32-Bit-Userland) bricht ab – bitte ein 64-Bit-System installieren.',
                },
                {
                  q: '`Docker 27.x`',
                  a: 'Docker funktioniert. Fehlt es, kommt ein Installationslink (Synology / QNAP: Container Manager / Container Station im Paketzentrum). Bei `Permission denied` mit sudo starten oder den Benutzer zur Gruppe docker hinzufügen und neu anmelden.',
                },
                {
                  q: '`Docker Compose v2.x`',
                  a: 'Docker Compose funktioniert. Mit nur dem alten docker-compose v1 wird ein Upgrade empfohlen, es geht aber weiter.',
                },
                {
                  q: '`Memory: 8 GB`',
                  a: 'Arbeitsspeicher. Unter 4 GB: `AI will use the lite model tier` – die KI nimmt automatisch die leichte Stufe; unter 2 GB die Warnung, dass die KI-Erkennung womöglich nicht läuft.',
                },
              ],
            },
          ],
        },
        {
          title: 'Configuration',
          body: [
            {
              p: 'Eine Frage nach der anderen; Enter übernimmt den Standardwert in eckigen Klammern.',
            },
            {
              qa: [
                {
                  q: '`Install directory`',
                  a: 'Wo `.env`, `docker-compose.yml` und standardmäßig data und models liegen. Danach wird der freie Platz auf dem Datenträger angezeigt; unter 10 GB gibt es eine Warnung.',
                },
                {
                  q: '`Keep the existing configuration`',
                  a: 'Erscheint nur, wenn schon eine `.env` existiert (frühere Installation). Enter (Y) behält Port, Domain, Datenbankpasswort usw. und überspringt die folgenden Fragen – ideal für Neuinstallation und Upgrade. n füllt alles neu aus. Das Datenbankpasswort nach dem Anlegen der Datenbank nicht leichtfertig ändern.',
                },
                {
                  q: '`Web port`',
                  a: 'Web-Port, Standard 8080. Ist er belegt, wird nach einem anderen gefragt.',
                },
                {
                  q: '`LAN domain (must end in .local)`',
                  a: 'Name, unter dem die Mediathek im lokalen Netz erreichbar ist, Standard wanmory.local; photos.local geht auch. Später auch in den Web-Einstellungen änderbar.',
                },
                {
                  q: '`Generate a random database password`',
                  a: 'Enter erzeugt ein Zufallspasswort und speichert es in `.env`; merken muss man es sich nicht. Mit n selbst zweimal eingeben (mindestens 8 Zeichen; keine Leerzeichen, Anführungszeichen oder `$ \\ @ : / # ?`).',
                },
                {
                  q: '`Database location`',
                  a: 'Speicherort der Datenbank. Leer lassen und Enter für das Docker-Volume pgdata (empfohlen), oder ein lokales Verzeichnis wie `/volume1/wanmory/db`. Warnt davor, eine SMB-/NFS-Freigabe zu verwenden, das kann die Datenbank beschädigen.',
                },
                {
                  q: '`Time zone`',
                  a: 'Zum Datieren von Fotos ohne Zeitzone in den EXIF-Daten. Stadt oder Land eintippen, z. B. berlin, vienna, zurich; bei mehreren Treffern per Nummer wählen.',
                },
                {
                  q: '`Data directory`',
                  a: 'Datenverzeichnis, Standard ./data. Hier liegen Miniaturen, Vorschauen und hochgeladene Fotos – genug Platz einplanen.',
                },
                {
                  q: '`AI model directory (1-4 GB)`',
                  a: 'KI-Modellverzeichnis, Standard ./models.',
                },
                {
                  q: '`Add existing photo folders from a NAS or external drive`',
                  a: 'Vorhandene Fotoordner einbinden (kein erneutes Hochladen). Y und Pfad eingeben; existiert er nicht, wird nachgefragt.',
                },
                {
                  q: '`Mount read-only`',
                  a: 'Enter bindet schreibgeschützt ein: Wanmory verändert oder löscht nie die Originale (empfohlen). Mit n Lesen und Schreiben: endgültiges Löschen in Wanmory löscht auch die Originaldatei.',
                },
                {
                  q: '`Add another photo folder`',
                  a: 'Nächsten Ordner hinzufügen; Enter (N) beendet.',
                },
              ],
            },
          ],
        },
        {
          title: 'Writing configuration',
          body: [
            {
              p: 'Schreibt `.env` (Rechte 600, nur für dich lesbar); mit Fotoordnern auch `docker-compose.override.yml` (Docker Compose führt sie automatisch zusammen); lädt `docker-compose.yml` von GitHub, ersatzweise von Gitee. `Configuration is valid` heißt, die Prüfung ist bestanden. Mit `--dry-run` endet das Skript hier.',
            },
          ],
        },
        {
          title: 'Existing database found',
          body: [
            {
              p: 'Erscheint nur, wenn die alte Konfiguration nicht behalten wurde, aber noch eine frühere Datenbank existiert (z. B. beim Deinstallieren behalten). Enter (Y) behält sie: Fotos, Alben, Personen und Konten bleiben erhalten, und das Skript setzt das Datenbankpasswort auf das neue aus `.env`. n löscht die alte Datenbank und beginnt neu; liegt sie in einem lokalen Verzeichnis, löscht das Skript sie nicht selbst – das Verzeichnis selbst leeren und das Skript erneut starten.',
            },
          ],
        },
        {
          title: 'Pulling images and starting',
          body: [
            {
              p: 'Lädt die Images, beim ersten Mal einige Minuten. Startet zuerst die Datenbank und wartet auf sie (`Waiting for the database...`), gleicht das Datenbankpasswort an `.env` an (`Database ready`) und startet dann den Rest.',
            },
          ],
        },
        {
          title: 'Waiting for Wanmory to start',
          body: [
            {
              p: 'Wartet bis zu 5 Minuten; langsame Geräte wie ein Raspberry Pi brauchen beim ersten Mal länger. Startet Wanmory ständig neu, werden die letzten 15 Logzeilen gezeigt und das Skript endet; antwortet es nach Ablauf der Zeit noch nicht, gibt es den Hinweis, später nachzusehen, und den Befehl für die Logs.',
            },
          ],
        },
        {
          title: 'Installation complete',
          body: [
            {
              p: 'Zeigt `LAN address` (Domain), `IP address` und das Installationsverzeichnis. `Next` nennt den nächsten Schritt: Seite öffnen, Admin-Konto anlegen, dann unter Einstellungen → Wie die KI läuft die Modelle herunterladen. Manche Android-Geräte lösen .local-Namen nicht auf; dort die IP-Adresse verwenden.',
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
          q: 'Nach Neuinstallation keine Verbindung zur Datenbank (Passwort-Authentifizierung fehlgeschlagen)',
          a: 'Die Datenbank übernimmt das Passwort aus `.env` nur beim ersten Anlegen; spätere Änderungen an `.env` ändern es nicht. Das aktuelle Installationsskript gleicht das Datenbankpasswort bei jedem Start an `.env` an – einfach erneut ausführen. Bei manueller Installation im Installationsverzeichnis `docker compose exec postgres psql -U wanmory -c "ALTER USER wanmory WITH PASSWORD \'neues-passwort\';"` ausführen, dann `docker compose up -d`.',
        },
        {
          q: 'Wem die Dateien im Datenverzeichnis gehören / auf dem Host nicht löschbar',
          a: 'Der Wanmory-Container läuft als Eigentümer des Datenverzeichnisses: Hat ein normaler Benutzer es angelegt (wie das Skript), gehören Uploads und Miniaturen diesem Benutzer und lassen sich ohne sudo verwalten; gehört es root oder ist es ein Docker-Volume, läuft er als uid 1000. Auf Dateisystemen ohne Besitzerwechsel (exFAT-/NTFS-USB-Laufwerke, SMB-Freigaben) läuft er als root. Von älteren Versionen falsch zugeordnete Dateien werden beim Start korrigiert.',
        },
        {
          q: 'Raspberry Pi',
          a: 'Ein 64-Bit-System (Raspberry Pi OS 64-bit) ist Pflicht; auf 32 Bit bricht das Skript ab. Mit 4 GB RAM wird automatisch die leichte Stufe genutzt; erster Start und erste Fotoverarbeitung dauern, daher Daten und Datenbank am besten auf eine SSD legen.',
        },
        {
          q: 'Port belegt',
          a: 'Anderen Port wählen oder das Skript mit `WANMORY_PORT=9000` starten.',
        },
        {
          q: 'Images laden langsam oder gar nicht',
          a: '`WANMORY_REGISTRY` auf einen erreichbaren Mirror setzen und erneut ausführen.',
        },
      ],
    },
    {
      h2: 'compose',
    },
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
    {
      h2: 'env',
    },
    {
      h3: '.env (Compose-Variablen)',
    },
    {
      p: 'Diese Variablen werden in `docker-compose.yml` verwendet; tragen Sie sie in die `.env` im selben Verzeichnis ein:',
    },
    {
      table: ['Variable', 'Standard', 'Beschreibung'],
      rows: [
        [
          '`WANMORY_DB_PASSWORD`',
          'wanmory',
          'PostgreSQL-Passwort, auch für die DATABASE_URL von server. Eine Änderung nach dem ersten Start erfordert, auch das Benutzerpasswort in der Datenbank anzupassen.',
        ],
        ['`WANMORY_PORT`', '8080', 'Portfreigabe auf dem Host, auch für die in der Web-App angezeigte Adresse.'],
        ['`WANMORY_TZ`', 'Asia/Shanghai', 'Zeitzone, wenn EXIF-Daten keine Zeitzone enthalten.'],
        [
          '`WANMORY_VERSION`',
          'latest',
          'Image-Tag; eine feste Version gibt Ihnen die Kontrolle über den Update-Zeitpunkt.',
        ],
        [
          '`WANMORY_REGISTRY`',
          'ghcr.io/i-dj',
          'Image-Registry. Ersetzen Sie sie durch eine erreichbare Registry, falls ghcr.io nicht zugänglich ist.',
        ],
        [
          '`WANMORY_DATA_DIR`',
          './data',
          'Datenverzeichnis: hochgeladene Originale (upload/) sowie Vorschaubilder und Vorschauen (thumbs/), im Container unter /data.',
        ],
        ['`WANMORY_MODELS_DIR`', './models', 'KI-Modellverzeichnis, im ml-Container unter /models.'],
        [
          '`WANMORY_DB_DIR`',
          'Volume pgdata',
          'Datenbankverzeichnis. Ohne Wert wird das Docker-Volume pgdata genutzt; ein Verzeichnispfad auf einer lokalen Festplatte speichert die Datenbank direkt dort. Keine Netzwerkfreigabe verwenden.',
        ],
        [
          '`WANMORY_DOMAIN`',
          'wanmory.local',
          'Anfängliche LAN-Domain, muss auf .local enden. Nach einer Änderung unter „Systemeinstellungen → Zugriffsdomain“ gilt diese.',
        ],
      ],
    },
    {
      h3: 'Container server (optional)',
    },
    {
      p: '`DATABASE_URL`, `WANMORY_ML_URL`, `WANMORY_MDNS` und `WANMORY_HTTP_PUBLIC_PORT` sind in der Compose-Datei bereits mit Zweckangabe gesetzt. Die folgenden Variablen stehen nicht in der Standarddatei; fügen Sie sie bei Bedarf zum `environment` von `server` hinzu:',
    },
    {
      table: ['Variable', 'Standard', 'Beschreibung'],
      rows: [
        [
          '`WANMORY_WORKERS`',
          'automatisch',
          'Standard-Parallelität für Metadaten- und Vorschau-Jobs. Ohne Wert aus CPU-Kernen und Arbeitsspeicher berechnet; unter „Leistung“ in der Web-App anpassbar.',
        ],
        [
          '`WANMORY_ML_TOKEN`',
          'leer',
          'Zugangstoken des integrierten KI-Dienstes; muss mit der gleichnamigen Variable im ml-Container übereinstimmen. Meist nicht nötig.',
        ],
        ['`WANMORY_FACE_MODEL`', 'antelopev2', 'Gesichtsmodell, wenn keine Modellstufe gewählt wurde.'],
        [
          '`WANMORY_CLIP_MODEL`',
          'chinese-clip-vit-h-14',
          'Modell für die semantische Suche, wenn keine Modellstufe gewählt wurde.',
        ],
        [
          '`WANMORY_STORAGE_ROOTS`',
          'Datenverzeichnis',
          'Verzeichnisse, die in der Web-App durchsucht und ausgewählt werden dürfen, durch Doppelpunkte getrennt.',
        ],
      ],
    },
    {
      h2: 'library',
    },
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
    {
      p: 'Führen Sie danach `docker compose up -d` aus. Der erste Scan beginnt etwa 20 Sekunden nach dem Neustart des Containers.',
    },
    {
      ul: [
        '**Schreibgeschützte Einbindung (:ro) empfohlen**: Das System schreibt nichts in diese Ordner. Löschen in der App verschiebt ein Foto nur nach „Zuletzt gelöscht“, endgültiges Löschen entfernt nie die Originaldatei, und spätere Scans importieren sie nicht erneut. Bei Ordnern mit Schreibzugriff löscht endgültiges Löschen auch die Originaldatei.',
        'Inhaltlich identische Dateien werden nur einmal importiert (Abgleich per SHA-1-Prüfsumme), auch bereits hochgeladene Dateien und Duplikate über mehrere Ordner hinweg.',
        'Versteckte Ordner und NAS-Systemordner (.xxx, @eaDir, #recycle usw.) werden automatisch übersprungen.',
        'Aus Fotoordnern importierte Fotos gehören keinem Mitglied; nur Admins können sie löschen.',
      ],
    },
    {
      h2: 'mdns',
    },
    {
      p: 'Der Dienst `mdns` läuft im Host-Netzwerkmodus und gibt die Zugriffsdomain im LAN bekannt (Standard `wanmory.local`). macOS, iOS, iPadOS und Windows 10 oder neuer erreichen sie ohne Router-Konfiguration unter `http://wanmory.local:8080`. Die Domain lässt sich unter „Systemeinstellungen → Zugriffsdomain“ ändern und muss auf `.local` enden.',
    },
    {
      note: 'Manche Android-Geräte können mDNS-Namen nicht auflösen; nutzen Sie dann die IP-Adresse. Ist Port 5353 bereits belegt (etwa bei Synology), startet der mdns-Dienst eventuell nicht; auch dann einfach die IP verwenden. Andere Funktionen sind nicht betroffen.',
      warn: true,
    },
    {
      h2: 'proxy',
    },
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
    {
      h2: 'ai-overview',
    },
    {
      p: 'Der KI-Dienst ist ein zustandsloser HTTP-Dienst: Er empfängt Vorschauen mit 1440 Pixeln vom Backend und liefert Gesichter, Vektoren und erkannten Text zurück. Er greift nie auf die Datenbank zu und speichert keine Dateien. Das Backend kennt zwei Betriebsarten, umschaltbar unter „Systemeinstellungen → KI → KI-Betriebsart“:',
    },
    {
      table: ['Betriebsart', 'Wo er läuft', 'Geeignet für'],
      rows: [
        [
          'Integriert (nur CPU)',
          'ml-Container in Compose, nur im internen Netz erreichbar',
          'Sofort einsatzbereit; NAS oder Mini-PC mit überschaubarer Bibliothek oder wenn eine längere Erstverarbeitung in Ordnung ist',
        ],
        [
          'Entfernter Dienst',
          'Anderer Rechner im LAN, Python-Dienst direkt ausgeführt',
          'Mac mit Apple Silicon (CoreML / MPS) oder Rechner mit NVIDIA-GPU (CUDA); verkürzt die Erstverarbeitung erheblich',
        ],
      ],
    },
    {
      p: 'Ist der KI-Dienst nicht verfügbar, bleiben KI-Jobs in der Warteschlange und werden nicht mehr geholt, sodass keine Wiederholungen verbraucht werden; sobald der Dienst zurück ist, geht es automatisch weiter. Durchsuchen, Uploads und andere Funktionen sind nicht betroffen.',
    },
    {
      h2: 'ai-remote',
    },
    {
      p: 'Der eingebaute KI-Container nutzt nur die CPU. Gibt es einen schnelleren Rechner (Mac mit Apple-Chip oder Windows-/Linux-PC mit NVIDIA-GPU), lässt sich der KI-Dienst (das Python-Programm im Ordner `ml/` des Repositorys) direkt dort betreiben, und Wanmory schickt ihm die Fotos. Python und alle Abhängigkeiten verwaltet [uv](https://docs.astral.sh/uv/); Python muss man nicht selbst installieren.',
    },
    {
      table: ['Rechner', 'Verfügbare Beschleunigung'],
      rows: [
        ['Mac mit Apple-Chip', 'CoreML für die Gesichtserkennung, MPS (PyTorch) für die intelligente Suche.'],
        ['Linux + NVIDIA-GPU', 'CUDA für die intelligente Suche (PyTorch in halber Genauigkeit, etwa 1,9 GB VRAM).'],
        [
          'Windows + NVIDIA-GPU',
          'CUDA für die intelligente Suche nach Installation des CUDA-Builds von PyTorch (Windows-Schritt 3 unten); Gesichter und Texterkennung über die CPU.',
        ],
        [
          'Ohne GPU',
          'Ohne PyTorch, alles per ONNX auf der CPU; lohnt sich auf einem Rechner, der deutlich schneller ist als das NAS.',
        ],
      ],
    },
    {
      h3: 'macOS',
    },
    {
      steps: [
        {
          title: 'uv installieren',
          body: [
            {
              code: `curl -LsSf https://astral.sh/uv/install.sh | sh   # oder: brew install uv
# danach ein neues Terminal öffnen`,
              lang: 'bash',
            },
          ],
        },
        {
          title: 'Code holen',
          body: [
            {
              code: `git clone https://github.com/i-dj/wanmory.git   # Mirror in China: https://gitee.com/i-dj/wanmory.git
cd wanmory/ml`,
              lang: 'bash',
            },
            {
              p: 'Fehlt git, bietet macOS die Installation der Xcode-Befehlszeilentools an; einfach den Hinweisen folgen.',
            },
          ],
        },
        {
          title: 'Abhängigkeiten installieren',
          body: [
            {
              code: 'uv sync --extra torch   # beim ersten Mal werden Python und PyTorch geladen, einige Minuten',
              lang: 'bash',
            },
          ],
        },
        {
          title: 'Zugangstoken erzeugen und starten',
          body: [
            {
              code: `export WANMORY_ML_TOKEN=$(openssl rand -hex 24)
echo $WANMORY_ML_TOKEN   # notieren, Wanmory braucht es
WANMORY_FACE_MODEL_PRELOAD=1 uv run --extra torch python -m wanmory_ml`,
              lang: 'bash',
            },
            {
              p: 'Bereit, sobald `Uvicorn running on http://0.0.0.0:3003` erscheint. Beim ersten Start wird das Gesichtsmodell (etwa 340 MB) geladen. Fragt macOS, ob python eingehende Verbindungen annehmen darf, erlauben.',
            },
          ],
        },
        {
          title: 'Andere Rechner verbinden lassen',
          body: [
            {
              p: 'Bei aktiver Firewall (Systemeinstellungen → Netzwerk → Firewall) sicherstellen, dass eingehende Verbindungen für python erlaubt sind. `ipconfig getifaddr en0` zeigt die IP-Adresse des Macs.',
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
          title: 'uv installieren',
          body: [
            {
              p: 'PowerShell öffnen und ausführen:',
            },
            {
              code: `powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
# oder: winget install --id=astral-sh.uv -e
# danach ein neues PowerShell-Fenster öffnen`,
              lang: 'powershell',
            },
          ],
        },
        {
          title: 'Code holen',
          body: [
            {
              code: `git clone https://github.com/i-dj/wanmory.git   # kein Git? winget install Git.Git
cd wanmory\\ml`,
              lang: 'powershell',
            },
            {
              p: 'Ohne Git geht auch: auf GitHub Code → Download ZIP, entpacken und in den Ordner ml wechseln.',
            },
          ],
        },
        {
          title: 'Abhängigkeiten installieren',
          body: [
            {
              code: `uv sync --extra torch
# Mit NVIDIA-GPU auf den CUDA-Build von PyTorch wechseln (PyTorch von PyPI ist unter Windows nur CPU)
uv pip install --reinstall torch --index-url https://download.pytorch.org/whl/cu126`,
              lang: 'powershell',
            },
            {
              p: 'Nach dem Wechsel zum CUDA-Build mit `uv run --no-sync` starten, sonst installiert uv wieder den CPU-Build. Ohne GPU nur `uv sync` ausführen (ohne PyTorch, viel kleiner) und beim Start `--extra torch` weglassen.',
            },
          ],
        },
        {
          title: 'Zugangstoken erzeugen und starten',
          body: [
            {
              code: `$env:WANMORY_ML_TOKEN = [guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N")
echo $env:WANMORY_ML_TOKEN   # notieren, Wanmory braucht es
$env:WANMORY_FACE_MODEL_PRELOAD = "1"
uv run --extra torch python -m wanmory_ml
# mit dem CUDA-Build von PyTorch stattdessen: uv run --no-sync python -m wanmory_ml`,
              lang: 'powershell',
            },
          ],
        },
        {
          title: 'Port in der Firewall freigeben',
          body: [
            {
              p: 'Beim ersten Start fragt die Windows-Firewall nach; „Private Netzwerke“ ankreuzen und zulassen. Oder in einer PowerShell als Administrator:',
            },
            {
              code: 'New-NetFirewallRule -DisplayName "Wanmory AI" -Direction Inbound -Protocol TCP -LocalPort 3003 -Action Allow',
              lang: 'powershell',
            },
            {
              p: '`ipconfig` zeigt die IPv4-Adresse dieses PCs.',
            },
          ],
        },
        {
          title: 'Automatisch starten (optional)',
          body: [
            {
              p: 'Im Ordner ml die Datei `start-ai.cmd` anlegen:',
            },
            {
              code: `@echo off
cd /d %~dp0
set WANMORY_ML_TOKEN=dein-token
uv run --extra torch python -m wanmory_ml`,
              lang: 'cmd',
            },
            {
              p: 'Win+R drücken, `shell:startup` eingeben und eine Verknüpfung zu dieser Datei in den geöffneten Ordner legen; sie startet dann bei der Windows-Anmeldung. Soll sie ohne Anmeldung laufen, in der Aufgabenplanung eine Aufgabe mit dem Trigger „Beim Start“ und dieser start-ai.cmd als Aktion anlegen.',
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
uv sync --extra torch        # PyTorch von PyPI enthält unter Linux CUDA; ohne GPU reicht uv sync
export WANMORY_ML_TOKEN=$(openssl rand -hex 24)
WANMORY_FACE_MODEL_PRELOAD=1 uv run --extra torch python -m wanmory_ml
sudo ufw allow 3003/tcp      # falls die ufw-Firewall aktiv ist`,
      lang: 'bash',
    },
    {
      p: 'Für den Start beim Booten einen systemd-Dienst schreiben: den uv-run-Befehl oben in `ExecStart` (mit vollem Pfad `~/.local/bin/uv`), den Ordner ml in `WorkingDirectory` und das Token in `Environment=`.',
    },
    {
      h3: 'Wichtige Umgebungsvariablen',
    },
    {
      table: ['Variable', 'Standard', 'Wirkung'],
      rows: [
        ['`WANMORY_ML_HOST`', '0.0.0.0', 'Lauschadresse; mit 0.0.0.0 können andere Rechner im Netz verbinden.'],
        ['`WANMORY_ML_PORT`', '3003', 'Lauschport.'],
        [
          '`WANMORY_ML_TOKEN`',
          'leer',
          'Zugangstoken. Ist es gesetzt, braucht jede Anfrage außer dem Health-Check `Authorization: Bearer <Token>`; in Wanmory denselben Wert eintragen.',
        ],
        [
          '`WANMORY_MODEL_DIR`',
          '~/.cache/wanmory/models',
          'Speicherort der Modelle (unter Windows .cache\\wanmory\\models im Benutzerordner).',
        ],
      ],
    },
    {
      p: 'Alle übrigen unter [Umgebungsvariablen des KI-Dienstes](#ai-env).',
    },
    {
      h3: 'In Wanmory verbinden',
    },
    {
      steps: [
        {
          title: 'Remote-Dienst wählen',
          body: [
            {
              p: 'Als Admin die Einstellungen öffnen und in der Karte „Wie die KI läuft“ den Remote-Dienst wählen.',
            },
          ],
        },
        {
          title: 'URL und Token eintragen',
          body: [
            {
              p: 'Unter Dienst-URL die Adresse des Rechners mit dem KI-Dienst eintragen, z. B. `http://192.168.1.20:3003`, unter Zugangstoken das erzeugte Token. „Verbindung testen“ klicken; bei Erfolg werden Latenz und Version angezeigt. Dann speichern.',
            },
          ],
        },
        {
          title: 'Modelle herunterladen',
          body: [
            {
              p: 'Nach dem Verbinden wird bei Stufe „Automatisch“ neu passend zur Hardware des Rechners empfohlen; unter Modellstufe die nötigen Modelle laden, dann beginnt die KI mit den Fotos.',
            },
          ],
        },
      ],
    },
    {
      note: 'Den Remote-KI-Dienst nur im lokalen Netz oder über ein VPN (z. B. Tailscale) nutzen, immer ein Token setzen und Port 3003 nie direkt ins Internet freigeben. Ist der Rechner aus oder im Ruhezustand, pausiert die KI-Verarbeitung und läuft danach automatisch weiter.',
      warn: true,
    },
    {
      h2: 'ai-schedule',
    },
    {
      p: 'Nach dem Import werden Fotodetails gelesen und Miniaturen sofort erstellt; wann die KI-Erkennung (Gesichter, intelligente Suche, Text) läuft, legt man unter Einstellungen → Hintergrundverarbeitung fest, Änderungen gelten sofort. Oben auf der Karte steht, ob die KI gerade laufen kann, und wenn nicht, warum.',
    },
    {
      table: ['Einstellung', 'Option', 'Wirkung'],
      rows: [
        [
          'Wann verarbeiten',
          'Im Leerlauf (Standard)',
          'Pausiert die KI, solange Fotos hochgeladen oder Miniaturen erstellt werden, und macht weiter, wenn Ruhe ist.',
        ],
        [
          '',
          'Jederzeit',
          'Verarbeitet ohne auf Uploads zu warten; Uploads können langsamer werden. „Wartezeit nach Uploads“ wirkt hier nicht.',
        ],
        [
          '',
          'Nachts',
          'Nur im eingestellten Zeitfenster (Standard 1:00–7:00, auch über Mitternacht, z. B. 23:00 bis 7:00), dort ebenfalls mit Rücksicht auf Uploads.',
        ],
        [
          'Wartezeit nach Uploads',
          '30 Sek. (Standard), 5 / 15 / 30 Min., 1 / 2 / 4 Std.',
          'Nach dem Hochladen wartet die KI so lange, bevor sie anfängt, damit sie nicht zwischen zwei Upload-Stapeln dazwischenfunkt. Gilt für „Im Leerlauf“ und „Nachts“. Soll es bis morgen warten, „Nachts“ wählen.',
        ],
      ],
    },
    {
      ul: [
        'Sind die Modelle der aktuellen Stufe noch nicht heruntergeladen, pausiert die KI unabhängig vom Zeitpunkt; nach dem Download unter Modellstufe geht es automatisch los.',
        'Solange ein Upload nicht abgeschlossen ist (auch einer, der nach Verbindungsabbruch fortgesetzt werden kann), wartet die KI.',
        'Während die KI pausiert, bleiben die Aufgaben in der Warteschlange; nichts geht verloren, nichts zählt als fehlgeschlagen.',
      ],
    },
    {
      h2: 'ai-models',
    },
    {
      p: 'Die Stufe bestimmt, welche Modelle für Gesichter und semantische Suche verwendet werden. Mit „Automatisch“ empfiehlt das System eine Stufe anhand der Hardware des Rechners, auf dem der KI-Dienst läuft: mit nutzbarer GPU „Hohe Genauigkeit“; nur mit CPU und weniger als 6 GB Arbeitsspeicher „Leicht“, sonst „Ausgewogen“.',
    },
    {
      table: ['Stufe', 'Gesichtserkennung + Merkmale', 'Semantische Suche', 'Passende Hardware'],
      rows: [
        [
          'Hohe Genauigkeit (quality)',
          'antelopev2 (SCRFD-10G + ArcFace R100)',
          'Chinese-CLIP ViT-H/14 (1024-d)',
          'Mac mit Apple Silicon, NVIDIA-GPU',
        ],
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
    {
      h2: 'ai-env',
    },
    {
      table: ['Variable', 'Standard', 'Beschreibung'],
      rows: [
        ['`WANMORY_ML_HOST`', '0.0.0.0', 'Lauschadresse.'],
        ['`WANMORY_ML_PORT`', '3003', 'Lauschport.'],
        [
          '`WANMORY_ML_TOKEN`',
          'leer',
          'Zugangstoken; ist es gesetzt, muss jede Anfrage Authorization: Bearer enthalten.',
        ],
        ['`WANMORY_MODEL_DIR`', '~/.cache/wanmory/models', 'Modellverzeichnis; im Image /models.'],
        ['`WANMORY_AUTO_DOWNLOAD`', 'im Image 0', 'Ob Modelle bei erster Nutzung automatisch geladen werden.'],
        [
          '`WANMORY_FACE_MODEL_PRELOAD`',
          '—',
          'Auf 1 gesetzt, werden die Gesichtsmodelle beim Start geladen; Chinese-CLIP lädt im Hintergrund.',
        ],
        [
          '`WANMORY_UNLOAD_AFTER`',
          '5 / 30 Minuten',
          'Sekunden Inaktivität, bevor ein Modell entladen wird, um Speicher freizugeben; 0 entlädt nie. Der Standard hängt vom Arbeitsspeicher des Hosts ab.',
        ],
      ],
    },
    {
      h2: 'first-run',
    },
    {
      steps: [
        {
          title: 'Admin anlegen',
          body: [
            {
              p: 'Beim ersten Aufruf erkennt das System, dass noch kein Konto existiert, und führt durch das Anlegen eines Admins. Admins können Mitglieder hinzufügen und Systemeinstellungen ändern.',
            },
          ],
        },
        {
          title: 'Modelle herunterladen',
          body: [
            {
              p: 'Öffnen Sie „Systemeinstellungen → KI“, bestätigen Sie die Modellstufe und laden Sie die Modelle herunter. Bis sie bereit sind, warten KI-Jobs in der Warteschlange.',
            },
          ],
        },
        {
          title: 'Fotos importieren',
          body: [
            {
              p: 'Laden Sie über die Web-App hoch oder binden Sie die Fotos auf Ihrem NAS wie unter [Vorhandene Fotoordner einbinden](#library) beschrieben ein.',
            },
          ],
        },
        {
          title: 'Mitglieder hinzufügen',
          body: [
            {
              p: 'Legen Sie unter „Systemeinstellungen → Mitglieder“ Konten für weitere Personen an und wählen Sie die Rolle „Mitglied“ oder „Admin“.',
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
        'Web-Uploads unterstützen Fotos, Videos, HEIC, RAW (etwa DNG) und mehr, mit Mehrfachauswahl; hochgeladen wird in Blöcken über das tus-Protokoll, fortsetzbar nach Verbindungsabbruch oder Neuladen der Seite.',
        'Hochgeladene Dateien werden nach Jahr und Monat im Upload-Verzeichnis abgelegt (Standard data/upload). Das Verzeichnis lässt sich unter „Systemeinstellungen → Upload-Verzeichnis“ ändern; das gilt nur für neue Uploads.',
        'Nach dem Import laufen nacheinander: Metadaten lesen (ExifTool) → Vorschaubilder und 1440-Pixel-Vorschau erzeugen (libvips / FFmpeg) → semantische Vektoren, Gesichter und Text erkennen (KI-Dienst) → Reverse Geocoding.',
        'Die Anzeige der Hintergrundaufgaben oben in der Seitenleiste zeigt Fortschritt und geschätzte Restzeit für „Fotos importieren“ und „KI-Erkennung“, gezählt in Fotos.',
      ],
    },
    {
      h2: 'browse',
    },
    {
      qa: [
        {
          q: 'Bibliothek',
          a: 'Foto-Zeitleiste nach Monaten, oben das KI-Auswahl-Karussell und „Heute vor …“.',
        },
        {
          q: 'Suche in natürlicher Sprache',
          a: 'Eine Beschreibung eingeben (etwa „Fotos vom dritten Geburtstag des Babys“); die Ergebnisse werden aus erkanntem Text, Aufnahmeort und semantischer Ähnlichkeit (Chinese-CLIP) gerankt. Ein Kategoriename liefert direkt diese Kategorie.',
        },
        {
          q: 'Personen',
          a: 'Gesichter werden automatisch gruppiert; aufgeführt wird, wer auf mindestens 3 Fotos vorkommt. Benennen, zusammenführen, Geburtstag setzen und Entwicklung nach Alter, Orte und Gruppenfotos ansehen.',
        },
        {
          q: 'Alben · Intelligente Alben',
          a: 'Alben enthalten von Hand gewählte Fotos und können privat sein; intelligente Alben sammeln Fotos automatisch nach Person, Ort, Zeit und weiteren Bedingungen.',
        },
        {
          q: 'Orte',
          a: 'Zeigt Aufnahmeorte per GPS auf einer Karte, mit den Ansichten Karte, Satellit und Raster.',
        },
        {
          q: 'Serien & Ähnliche',
          a: 'Gruppiert Serien- und ähnliche Fotos automatisch und empfiehlt das beste zum Behalten; „Duplikate“ listet inhaltlich identische Dateien.',
        },
        {
          q: 'Diashows',
          a: 'Bibliothek, Alben, Personen und Erinnerungen abspielen; Hochformatfotos werden zu zweit oder dritt auf einer Seite kombiniert, mit Hintergrundmusik und Übergängen.',
        },
      ],
    },
    {
      h2: 'members-usage',
    },
    {
      table: ['Rolle', 'Rechte'],
      rows: [
        [
          'Admin',
          'Mitglieder hinzufügen und entfernen, Passwörter von Mitgliedern zurücksetzen, Systemeinstellungen ändern; kann jedes Foto löschen.',
        ],
        [
          'Mitglied',
          'Fotos hochladen, ansehen und ordnen; kann nur eigene Uploads löschen; kann keine Systemeinstellungen ändern.',
        ],
        [
          'Gast',
          'Bei aktivierter Gastansicht können nicht angemeldete Besucher geteilte Inhalte nur ansehen; private Alben und ausgeblendete Fotos sind unsichtbar.',
        ],
      ],
    },
    {
      p: 'Personeninformationen (Namen, Zusammenführungen) teilen sich alle Mitglieder; Fotoanzahl, Titelbilder und Personenseiten werden aus den Fotos berechnet, die das jeweilige Mitglied sehen kann, und ausgeblendete Fotos sieht nur ihr Eigentümer.',
    },
    {
      h2: 'settings-members',
    },
    {
      ul: [
        'Mitglieder: Beim Hinzufügen Namen, Startpasswort (mindestens 4 Zeichen) und Rolle festlegen; Passwörter lassen sich zurücksetzen und Mitglieder entfernen.',
        'Anmeldeverlauf: Erfasst Zeit, Gerät und IP jeder Anmeldung, der Standort wird offline aus der IP geschätzt (ip2region); die letzten sechs Monate bleiben erhalten. Nur für Admins sichtbar.',
        'Unter „Mein Konto“ kann jedes Mitglied Passwort und Avatar ändern und die angemeldeten Geräte sehen.',
      ],
    },
    {
      h2: 'settings-ai',
    },
    {
      table: ['Einstellung', 'Optionen', 'Beschreibung'],
      rows: [
        [
          'KI-Betriebsart',
          'Integriert (nur CPU) / Entfernter Dienst',
          'Ein entfernter Dienst braucht Adresse und Token, die Verbindung wird vor dem Wechsel geprüft; ist der Dienst nicht verfügbar, pausiert die KI-Verarbeitung.',
        ],
        [
          'Rechengerät',
          'Automatisch / GPU / Nur CPU',
          'Ohne nutzbare Grafikkarte ist nur CPU wählbar; ein Wechsel lädt die Modelle neu, laufende KI-Verarbeitung geht kurz danach weiter.',
        ],
        [
          'Modellstufe',
          'Automatisch / Hohe Genauigkeit / Ausgewogen / Leicht',
          'Nach einem Wechsel werden alle Fotos mit den neuen Modellen neu verarbeitet, mit Fortschrittsanzeige.',
        ],
        [
          'Modellverwaltung',
          'Herunterladen / Löschen',
          'Zeigt Größe und Status jedes Modells (aktiv, heruntergeladen, nicht heruntergeladen).',
        ],
      ],
    },
    {
      h2: 'settings-perf',
    },
    {
      table: ['Einstellung', 'Optionen', 'Beschreibung'],
      rows: [
        [
          'Verarbeitungszeitpunkt',
          'Im Leerlauf / Jederzeit / Nachts',
          'Im Leerlauf: KI pausiert beim Hochladen und Erstellen von Miniaturen; Jederzeit: verarbeitet durchgehend, Uploads können langsamer werden; Nachts: nur im eingestellten Zeitfenster. Siehe [Wann die KI arbeitet](#ai-schedule).',
        ],
        [
          'Wartezeit nach Uploads',
          '30 Sek. – 4 Std.',
          'Wie lange die KI nach dem Hochladen wartet; gilt für „Im Leerlauf“ und „Nachts“.',
        ],
        [
          'Parallele Fotoverarbeitung',
          'Zahl',
          'Wie viele Fotos gleichzeitig ausgelesen und mit Vorschaubildern versehen werden; Standard aus CPU-Kernen und Arbeitsspeicher berechnet.',
        ],
        ['Parallele KI-Verarbeitung', 'Zahl', 'Wie viele Fotos gleichzeitig an den KI-Dienst gehen.'],
        ['CPU-Threads', 'Zahl', 'CPU-Threads pro Modell für die Inferenz.'],
      ],
    },
    {
      p: 'Oben auf der Karte steht live der Status der KI (läuft oder Grund der Pause). Änderungen wirken sofort, ohne Neustart.',
    },
    {
      h2: 'settings-general',
    },
    {
      table: ['Einstellung', 'Standard', 'Beschreibung'],
      rows: [
        [
          'Upload-Verzeichnis',
          'data/upload',
          'Hochgeladene Dateien nach Jahr und Monat; Änderungen gelten nur für neue Uploads.',
        ],
        [
          'Gastansicht',
          'Ein',
          'Erlaubt nicht angemeldeten Besuchern, geteilte Inhalte anzusehen. Bei Internetzugang besser abschalten.',
        ],
        [
          'Online-Karten',
          'Ein',
          'Zeigt Karten, Ortsnamen und Ortssuche und sendet dafür Fotostandorte an den Kartendienst; ausgeschaltet nur Koordinaten.',
        ],
        [
          'Kartenanbieter',
          'Automatisch',
          'Automatisch: AMap in Festlandchina, OpenStreetMap anderswo; einer von beiden lässt sich auch festlegen.',
        ],
        ['Zugriffsdomain', 'wanmory.local', 'LAN-Zugriffsdomain; muss auf .local enden.'],
      ],
    },
    {
      h2: 'settings-update',
    },
    {
      p: '„Systemeinstellungen → Systemupdate“ zeigt die aktuellen Versionen von Backend und KI-Dienst und meldet neue Versionen. Zum Aktualisieren im Verzeichnis mit der `docker-compose.yml` ausführen:',
    },
    {
      code: 'docker compose pull && docker compose up -d',
      lang: 'bash',
    },
    {
      p: 'Datenbankmigrationen laufen beim Start von server automatisch. Haben Sie mit `WANMORY_VERSION` eine Version festgelegt, ändern Sie zuerst das Tag in der `.env`.',
    },
    {
      note: 'Die vollständigen Schritte stehen unter [Aktualisieren](#update).',
    },
    {
      h2: 'update',
    },
    {
      p: 'Ist eine neue Version erschienen, zeigt Einstellungen → Systemupdate das an, samt den Hinweisen zu jeder Version (auch auf der Seite [Versionen](/releases/)). Ein Update ersetzt nur das Programm; Fotos, Datenbank, Einstellungen und Modelle bleiben erhalten.',
    },
    {
      steps: [
        {
          title: 'Ins Installationsverzeichnis wechseln',
          body: [
            {
              code: 'cd ~/wanmory   # dein Installationsverzeichnis (mit docker-compose.yml und .env)',
              lang: 'bash',
            },
          ],
        },
        {
          title: 'Neue Images laden und neu starten',
          body: [
            {
              code: `docker compose pull
docker compose up -d`,
              lang: 'bash',
            },
            {
              p: 'Wanmory aktualisiert das Datenbankschema beim Start; nach einigen Sekunden bis einer Minute die Seite neu laden.',
            },
          ],
        },
        {
          title: 'Alte Images entfernen (optional)',
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
      note: 'Ist in `.env` eine Version per `WANMORY_VERSION` festgelegt, diese zuerst auf die neue Version ändern (oder die Zeile löschen, um die neueste zu verwenden) und dann die Befehle ausführen. Alternativ das Installationsskript erneut starten und die vorhandene Konfiguration behalten (`Keep the existing configuration` → Y): gleiches Ergebnis, zusätzlich wird die neueste `docker-compose.yml` geladen.',
    },
    {
      h2: 'backup',
    },
    {
      p: 'Drei Arten von Daten sollten gesichert werden:',
    },
    {
      table: ['Daten', 'Ort', 'Beschreibung'],
      rows: [
        [
          'Datenbank',
          'Named Volume pgdata',
          'Foto-Metadaten, Personen, Alben, Einstellungen, Vektoren und Job-Warteschlange.',
        ],
        [
          'Uploads und Vorschaubilder',
          './data',
          'Hochgeladene Originale (data/upload) und Vorschaubilder (data/thumbs); Vorschaubilder lassen sich neu erzeugen.',
        ],
        [
          'Fotoordner',
          'unter /photos eingebundene Ordner',
          'Über die eigene Sicherung des NAS abgedeckt; die App ändert schreibgeschützt eingebundene Ordner nie.',
        ],
      ],
    },
    {
      lang: 'bash',
      code: `# Datenbank exportieren
docker compose exec -T postgres pg_dump -U wanmory -Fc wanmory > wanmory-$(date +%F).dump

# In eine neue Installation zurückspielen (zuerst docker compose up -d postgres ausführen)
docker compose exec -T postgres pg_restore -U wanmory -d wanmory --clean < wanmory-2026-11-10.dump`,
    },
    {
      note: 'Die Modelldateien in ./models müssen nicht gesichert werden; sie lassen sich in der Web-App erneut herunterladen.',
    },
    {
      h2: 'reset-password',
    },
    {
      p: 'Vergisst ein Mitglied sein Passwort, setzt ein Admin es unter „Systemeinstellungen → Mitglieder“ zurück. Vergisst der Admin sein eigenes, führen Sie auf dem Host, auf dem die App läuft, im Verzeichnis mit der `docker-compose.yml` aus:',
    },
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
    {
      h2: 'troubleshooting',
    },
    {
      qa: [
        {
          q: 'wanmory.local nicht erreichbar',
          a: 'Prüfen, ob der mdns-Dienst läuft (docker compose ps); manche Android-Geräte unterstützen kein mDNS, dann die IP nutzen; prüfen, ob Port 5353 auf dem Host belegt ist.',
        },
        {
          q: 'KI-Einstellungen zeigen „Keine Verbindung, KI-Verarbeitung pausiert“',
          a: 'Bei integriertem Betrieb die Logs des ml-Containers prüfen (docker compose logs ml); bei entferntem Betrieb Adresse, Port, Firewall und Token abgleichen.',
        },
        {
          q: 'Keine Ergebnisse bei Personen oder Suche',
          a: 'Prüfen, ob die Modelle heruntergeladen sind; unter „Leistung“ prüfen, ob die KI durch den Verarbeitungszeitpunkt pausiert; den KI-Fortschritt in der Aufgabenanzeige ansehen.',
        },
        {
          q: 'Große Uploads schlagen fehl',
          a: 'Die Größenbegrenzung des Reverse Proxys ist zu klein; client_max_body_size wie unter „Reverse Proxy und Internetzugang“ beschrieben anpassen.',
        },
        {
          q: 'Fotos aus einem eingebundenen Ordner erscheinen nicht',
          a: 'Ordner müssen als Unterverzeichnisse von /photos eingebunden sein; der erste Scan läuft etwa 20 Sekunden nach dem Start, danach alle 15 Minuten; versteckte Ordner werden übersprungen.',
        },
        {
          q: 'Images laden langsam oder gar nicht',
          a: 'In der .env WANMORY_REGISTRY auf eine erreichbare Registry setzen.',
        },
      ],
    },
    {
      p: 'Die Logs der Dienste zeigen `docker compose logs -f server` und `docker compose logs -f ml`. Besteht das Problem weiter, melden Sie es auf der Seite [Problem melden](/feedback/) mit Versionsnummer und den relevanten Logs.',
    },
    {
      h2: 'uninstall',
    },
    {
      p: 'Auf dem Rechner ausführen, auf dem Wanmory läuft:',
    },
    {
      code: 'curl -fsSL https://wanmory.com/uninstall.sh | bash',
      lang: 'bash',
    },
    {
      p: 'Standardmäßig werden nur die Container entfernt, alle Daten bleiben: Das Skript fragt zu jedem Punkt, Enter bedeutet immer behalten (N). Eingebundene Fotoordner (NAS, externe Laufwerke) werden nie gelöscht.',
    },
    {
      steps: [
        {
          title: 'Locating installation',
          body: [
            {
              p: 'Fragt nach dem `Install directory`; Enter nimmt ~/wanmory. Im Verzeichnis muss Wanmorys `docker-compose.yml` liegen, sonst bricht das Skript ab. Dann listet es Anzahl der Container, Ort der Datenbank, Daten- und KI-Modellverzeichnis mit Größe sowie die eingebundenen Fotoordner (markiert mit `never deleted`).',
            },
          ],
        },
        {
          title: 'Choose what to remove',
          body: [
            {
              p: 'Container und Netzwerk werden immer entfernt. Jeder der folgenden Punkte wird einmal abgefragt:',
            },
            {
              qa: [
                {
                  q: '`Delete the database`',
                  a: 'Die Datenbank (Docker-Volume pgdata oder das Verzeichnis aus `WANMORY_DB_DIR`): Personen, Alben, Einstellungen, KI-Ergebnisse und Konten. Nicht rückgängig zu machen.',
                },
                {
                  q: '`Delete the data directory`',
                  a: 'Das Datenverzeichnis: Miniaturen und **die über die Webseite hochgeladenen Originalfotos**.',
                },
                {
                  q: '`Delete the AI models`',
                  a: 'Das KI-Modellverzeichnis; nach einer Neuinstallation erneut ladbar.',
                },
                {
                  q: '`Remove the Docker images`',
                  a: 'Die von Wanmory genutzten Docker-Images (inklusive postgres/pgvector); erneut ladbar.',
                },
                {
                  q: '`Delete the configuration files`',
                  a: '`.env` (mit Datenbankpasswort), `docker-compose.yml`, `docker-compose.override.yml`; ist das Installationsverzeichnis danach leer, wird es ebenfalls entfernt.',
                },
              ],
            },
          ],
        },
        {
          title: 'Summary',
          body: [
            {
              p: 'Listet, was passieren wird. Wurde das Löschen der Datenbank oder des Datenverzeichnisses gewählt, muss man `DELETE` in Großbuchstaben eintippen; jede andere Eingabe bricht ab, ohne etwas zu ändern. Sonst wird einmal `Proceed` gefragt. Bleibt die Datenbank, wird `.env` aber gelöscht, erinnert das Skript daran, vorher `WANMORY_DB_PASSWORD` zu notieren.',
            },
          ],
        },
        {
          title: 'Removing',
          body: [
            {
              p: 'Stoppt und entfernt die Container und löscht dann die gewählten Punkte. Von Containern geschriebene Dateien können einem anderen Benutzer gehören (ältere Versionen schrieben als uid 1000 oder root); verweigert ein normales rm das Löschen, erledigt das Skript es aus einem temporären Container als root, und klappt auch das nicht, nennt es `sudo rm -rf` zum manuellen Löschen. Pfade, die offensichtlich nicht zu Wanmory gehören, wie /, /home, /volume1 oder das Home-Verzeichnis, löscht das Skript nicht.',
            },
          ],
        },
      ],
    },
    {
      p: 'Wurden nur die Container entfernt und Daten und Konfiguration behalten, stellt ein erneutes install.sh im selben Verzeichnis alles wieder her.',
    },
    {
      table: ['Option', 'Wirkung'],
      rows: [
        ['`--dir VERZ`', 'Installationsverzeichnis, Standard ~/wanmory (oder `WANMORY_DIR` setzen).'],
        [
          '`-y`, `--yes`',
          'Keine Fragen: nur Container und Netzwerk entfernen, alle Daten und Konfiguration behalten. So verhält es sich auch ohne interaktives Terminal.',
        ],
        [
          '`--purge`',
          'Keine Fragen: alles aus der Tabelle oben löschen (außer den Fotoordnern), ohne DELETE einzutippen. Mit Vorsicht verwenden.',
        ],
        ['`--dry-run`', 'Nur anzeigen, was passieren würde, ohne etwas zu ändern.'],
        ['`-h`, `--help`', 'Hilfe anzeigen.'],
      ],
    },
  ],
}

export default docs
