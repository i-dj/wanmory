import type { FaqDict } from '../zh/faq'

// Deutsch · FAQ

const faq: FaqDict = {
  title: 'Häufige Fragen',
  lead: 'Antworten auf die Fragen, die uns am häufigsten erreichen. Nichts Passendes gefunden? Melden Sie ein Problem auf GitHub oder lesen Sie die vollständige Installations- und Benutzerdokumentation.',
  readDocs: 'Dokumentation lesen',
  submit: 'Problem melden',
  categories: 'Fragenkategorien',
  all: 'Alle',
  showAll: 'Alle {n} Fragen anzeigen',
  groups: [
    {
      key: 'deploy',
      label: 'Installation',
      items: [
        {
          q: 'Welche Hardware brauche ich für Wanmory?',
          a: 'Jedes x86_64- oder ARM64-Gerät, auf dem Docker läuft, etwa ein NAS, ein Mini-PC oder ein Raspberry Pi 5. Ab 4 GB Arbeitsspeicher wählt das System automatisch die leichten Modelle; ab 8 GB steht die Stufe „Ausgewogen“ zur Verfügung. Bei großen Bibliotheken oder für schnellere KI-Verarbeitung kann der KI-Dienst auf einem Rechner mit GPU oder einem Mac mit Apple Silicon laufen.',
        },
        {
          q: 'Funktioniert es auf einem Synology- oder QNAP-NAS?',
          a: 'Ja. Wanmory wird mit Docker Compose installiert und läuft auf Synology DSM, QNAP QTS, TrueNAS SCALE, Unraid sowie Linux-Distributionen wie Ubuntu und Debian. Images gibt es für amd64 und arm64; das passende wird automatisch geladen.',
        },
        {
          q: 'Muss ich die Fotos auf meinem NAS erneut hochladen?',
          a: 'Nein. Binden Sie Ihre Fotoordner in der docker-compose.yml unter /photos ein. Mehrere Ordner sind möglich, schreibgeschütztes Einbinden mit :ro wird empfohlen. Die Ordner werden alle 15 Minuten gescannt, neue Fotos an Ort und Stelle importiert – Originale werden weder kopiert noch verschoben.',
        },
        {
          q: 'Das Laden der Images ist langsam. Was tun?',
          a: 'Setzen Sie WANMORY_REGISTRY in der .env neben der docker-compose.yml auf eine erreichbare Registry und führen Sie docker compose up -d erneut aus.',
        },
        {
          q: 'Wie aktualisiere ich auf eine neue Version?',
          a: 'Führen Sie im Verzeichnis mit der docker-compose.yml docker compose pull && docker compose up -d aus. Datenbankmigrationen laufen beim Start automatisch, Fotos, Personen und Alben bleiben unberührt. Unter „Systemeinstellungen → Systemupdate“ zeigt die Web-App an, ob eine neue Version verfügbar ist.',
        },
        {
          q: 'Was tun, wenn ich das Admin-Passwort vergessen habe?',
          a: 'Wechseln Sie auf dem Host, auf dem die App läuft, in das Verzeichnis mit der docker-compose.yml, führen Sie docker compose exec server wanmory reset-password aus und folgen Sie den Anweisungen, um das Konto zu wählen und ein neues Passwort einzugeben. Passwörter normaler Mitglieder setzt ein Admin unter „Systemeinstellungen → Mitglieder“ zurück.',
        },
      ],
    },
    {
      key: 'ai',
      label: 'KI & Datenschutz',
      items: [
        {
          q: 'Werden meine Fotos in die Cloud hochgeladen?',
          a: 'Nein. Fotos, Vorschaubilder, Datenbank und alle KI-Ergebnisse bleiben auf dem Gerät, auf dem Wanmory läuft. KI-Modelle werden nur bei der ersten Nutzung heruntergeladen; danach laufen Gesichtserkennung, semantische Suche und Texterkennung lokal.',
        },
        {
          q: 'Kann ich die KI-Funktionen auf einem schwachen NAS nutzen?',
          a: 'Ja. Der integrierte KI-Dienst nutzt nur die CPU. Der erste Durchlauf über eine große Bibliothek dauert länger, neue Fotos werden danach nach und nach verarbeitet. Unter „Leistung und Ressourcen“ lässt sich die Verarbeitung auf Leerlaufzeiten oder die Nacht beschränken, damit die tägliche Nutzung nicht leidet.',
        },
        {
          q: 'Kann der KI-Dienst auf einem anderen Rechner laufen?',
          a: 'Ja. Betreiben Sie den KI-Dienst auf einem Mac oder einem Rechner mit NVIDIA-Grafikkarte, wählen Sie unter „Systemeinstellungen → KI“ „Entfernter Dienst“ und tragen Sie Adresse und Zugangstoken ein. Der KI-Dienst erhält nur Vorschauen mit 1440 Pixeln und berührt weder Originale noch Datenbank.',
        },
        {
          q: 'Brauchen die KI-Funktionen eine ständige Internetverbindung?',
          a: 'Nein. Nach dem Modell-Download läuft alles vollständig offline. Nur Online-Karten und die Ortsnamen-Rückabfrage benötigen Internet; beide lassen sich in den Systemeinstellungen abschalten, dann zeigen Orte nur Koordinaten.',
        },
        {
          q: 'Wie werden Gesichter gruppiert?',
          a: 'Das System erkennt die Gesichter in jedem Foto und berechnet für jedes einen Merkmalsvektor; ähnliche Gesichter werden automatisch derselben Person zugeordnet. Aufgeführt wird eine Person erst ab 3 Fotos, gelegentlich auftauchende Passanten werden also nicht erfasst. Mit Namen und Geburtstag lässt sich die Entwicklung nach Alter nachverfolgen.',
        },
        {
          q: 'Welche Sucharten werden unterstützt?',
          a: 'Suche in natürlicher Sprache auf Chinesisch, etwa „宝宝三岁生日的照片“ (Fotos vom dritten Geburtstag des Babys) oder „海边的日落“ (Sonnenuntergang am Meer); außerdem lassen sich Text in Fotos (Ausweise, Screenshots, Schilder) und Aufnahmeorte durchsuchen. Die drei Ergebnisarten werden zusammengeführt und gerankt, zurückgegeben werden nur eindeutig passende Fotos.',
        },
      ],
    },
    {
      key: 'usage',
      label: 'Nutzung & Funktionen',
      items: [
        {
          q: 'Wie öffne ich meine Bibliothek auf dem Handy?',
          a: 'Öffnen Sie im selben lokalen Netzwerk http://wanmory.local:8080 im Browser des Handys. iPhone, iPad, Mac und Windows brauchen keine Router-Einstellungen. Manche Android-Geräte unterstützen keine .local-Domains; nutzen Sie dann die IP-Adresse.',
        },
        {
          q: 'Welche Foto- und Videoformate werden unterstützt?',
          a: 'Gängige Fotoformate wie JPEG, PNG, HEIC und RAW (etwa DNG) sowie gängige Videoformate. Web-Uploads sind fortsetzbar und laufen nach einem Verbindungsabbruch oder dem Neuladen der Seite weiter.',
        },
        {
          q: 'Lassen sich gelöschte Fotos wiederherstellen?',
          a: 'Ja. Gelöschte Fotos landen zuerst unter „Zuletzt gelöscht“ und lassen sich jederzeit wiederherstellen. Bei schreibgeschützt eingebundenen Fotoordnern bleiben die Originaldateien selbst nach endgültigem Löschen in der App erhalten; sie werden nur nicht mehr angezeigt.',
        },
        {
          q: 'Wie räume ich Serienbilder und Duplikate auf?',
          a: '„Serien & Ähnliche“ gruppiert Serienaufnahmen und nahezu identische Fotos automatisch und empfiehlt das schärfste zum Behalten; der Rest lässt sich mit einem Klick nach „Zuletzt gelöscht“ verschieben. Inhaltlich identische Dateien stehen gesondert unter „Duplikate“.',
        },
      ],
    },
    {
      key: 'members',
      label: 'Mitglieder & Rechte',
      items: [
        {
          q: 'Können mehrere Personen es gemeinsam nutzen?',
          a: 'Ja. Ein Admin legt für jede Person ein eigenes Konto an, und die Uploads aller fließen in eine Bibliothek. Mitglieder können nur ihre eigenen Uploads löschen, Admins verwalten alles, und der Anmeldeverlauf erfasst Zeit, Gerät und ungefähren Standort jeder Anmeldung.',
        },
        {
          q: 'Sehen andere Mitglieder meine ausgeblendeten Fotos?',
          a: 'Nein. Ausgeblendete Fotos sehen nur Sie, private Alben nur ihr Ersteller. Namen und Zusammenführungen von Personen werden geteilt, aber Fotoanzahl und Titelbilder, die ein Mitglied sieht, werden nur aus den Fotos berechnet, die dieses Mitglied sehen darf.',
        },
        {
          q: 'Was ist die Gastansicht?',
          a: 'Ist die Gastansicht aktiv, können nicht angemeldete Besucher geteilte Fotos nur ansehen; private Alben und ausgeblendete Fotos bleiben unsichtbar. Ist Ihre Bibliothek aus dem Internet erreichbar, empfehlen wir, die Gastansicht in den Systemeinstellungen abzuschalten.',
        },
      ],
    },
  ],
}

export default faq
