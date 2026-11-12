// Deutsch · Übersetzung von CHANGELOG.md, nach Version, ein Eintrag pro Punkt in derselben Reihenfolge.
// Das Präfix „修复：“ (Korrektur) wird als Symbol angezeigt und hier weggelassen.
// Fehlt eine Version (oder weicht die Anzahl der Punkte ab), erscheint das chinesische Original.

const changelog: Record<string, string[]> = {
  'v0.4.2': [
    "Wanmory startete nicht und lief in einer Neustartschleife, wenn der Datenordner nicht dem Benutzer im Container gehörte (z. B. nach einer Installation mit sudo oder auf einem Raspberry Pi); jetzt wird der Besitzer beim Start automatisch korrigiert, und es funktioniert auch auf USB-Laufwerken und Netzwerkfreigaben, auf denen sich der Besitzer nicht ändern lässt",
    "Installationsskript: wartet bis zu 5 Minuten, bevor es entscheidet, ob Wanmory gestartet ist; bei ständigen Neustarts werden die letzten Logzeilen angezeigt, und „Installation complete“ erscheint nicht mehr, wenn der Start fehlschlug; der Abschlusshinweis enthält kein Chinesisch mehr; zu Beginn erscheinen ein Begrüßungsbanner und die zu installierende Version",
  ],
  'v0.4.1': [
    "Zwei-Faktor-Authentifizierung: Authenticator-Apps zeigen den Eintrag jetzt als „Wanmory:Benutzername“, ohne chinesisches Präfix; wer sie schon eingeschaltet hat, muss sie aus- und wieder einschalten und neu scannen",
  ],
  'v0.4.0': [
    "Die Oberfläche gibt es jetzt in 12 Sprachen: 简体中文, 繁體中文, English, 日本語, 한국어, Deutsch, Français, Español, Português, Русский, Italiano, Tiếng Việt. Einstellbar unter Mein Konto; standardmäßig folgt sie der Browsersprache und bleibt auch bei der Anmeldung auf einem anderen Gerät gleich. Datumsangaben, Zahlen und Ortsnamen richten sich ebenfalls nach der Sprache",
    "Zwei-Faktor-Authentifizierung: unter Mein Konto per QR-Code mit einer Authenticator-App (Google Authenticator, Microsoft Authenticator, 2FAS u. a.) einschalten; bei der Anmeldung wird dann nach dem Passwort ein 6-stelliger Code abgefragt. Beim Einschalten gibt es 10 Wiederherstellungscodes für den Fall, dass das Handy nicht zur Hand ist",
    "Neue Profilbildauswahl: oben eine Zuschnittvorschau zum Verschieben und Zoomen, darunter die Wahl zwischen eigenem Bild, Foto aus der Mediathek, Standardbild oder Cartoon",
    "Alle Dialoge sehen jetzt gleich aus: zentriertes Symbol, Titel und Beschreibung, darunter zwei gleich breite Schaltflächen; das Löschen von Mitgliedern, Alben und Modellen nutzt dieselbe Löschbestätigung",
    "Bei ausgewählten Fotos gibt es unter Mehr jetzt Teilen…: über das Teilen-Menü des Systems per E-Mail senden (die Fotos sind gleich angehängt), per AirDrop oder an andere Apps; dazu muss die Mediathek über https oder localhost geöffnet sein",
    "Bei Sortierung nach Hinzufügedatum nutzen auch die Zeitleiste rechts und die Datumsgruppen über den Fotos das Hinzufügedatum",
    "Sicherheit: nach mehreren falschen Passwörtern wird die Anmeldung vorübergehend gesperrt; die Seite kann nicht in andere Websites eingebettet werden, und hochgeladene Dateien werden nie als Webseite ausgeführt; die lokale Domain lässt sich direkt in den Systemeinstellungen ändern",
    "Der Hinweis „Hochladen abgeschlossen“ verschwindet nach 10 Sekunden",
    "Der Hintergrund ruckelte beim Öffnen eines Bestätigungsdialogs",
  ],
  'v0.3.1': [
    "Die Karte unter „Orte“ lässt sich jetzt zoomen und verschieben: Zoomen mit Mausrad oder Trackpad, Doppelklick zum Vergrößern, Ziehen zum Verschieben, auf dem Smartphone mit zwei Fingern; unten rechts gibt es Schaltflächen zum Vergrößern, Verkleinern und für die ganze Welt. Ab etwa Landesgröße wechselt sie zu einer Straßenkarte (Online-Karten müssen aktiviert sein) mit Städten, Straßen und Ortsnamen, und die Foto-Stecknadeln teilen sich beim Zoomen immer weiter auf, bis hin zu einzelnen Aufnahmeorten; nach der Rückkehr aus den Fotos steht die Karte wieder an derselben Stelle",
    "Website: Der Kalender auf der Versionsseite ist jetzt ein Monatskalender mit den Versionsnummern jedes Tages, ein Klick auf eine Version springt zu ihren Hinweisen; behoben, dass Seiten bei langsamer Verbindung oder direkt nach einem Website-Update gelegentlich ganz ohne Gestaltung luden",
  ],
  'v0.3.0': [
    "Neue Website: Startseite, Architektur, Installation & Dokumentation, FAQ, Versionen und Feedback, in 12 Sprachen; standardmäßig in der Sprache Ihres Browsers, umschaltbar unten auf der Seite",
    "Installations- und Deinstallationsskript mit einem Befehl (install.sh, uninstall.sh): Bei der Installation lassen sich Port, Domain, Datenbankpasswort und -speicherort, Zeitzone, Datenverzeichnis und Fotoverzeichnis festlegen; wo Datenbank, Daten und Modelle liegen, bestimmen Sie selbst (WANMORY_DB_DIR, WANMORY_DATA_DIR, WANMORY_MODELS_DIR), und WANMORY_DOMAIN legt die Domain für den Zugriff im lokalen Netzwerk fest",
    "„Orte“ ist jetzt eine flache Weltkarte: Besuchte Länder sind in einer warmen Farbe hervorgehoben, jede Stadt hat eine Foto-Stecknadel mit Stadt- und Ländernamen, ein Klick öffnet die Fotos von dort; oben rechts gibt es nur noch „Karte / Raster“, Straßenkarte und Satelliten-Globus sind entfallen",
    "Die Albenseite zeigt große Karten: quadratische Cover mit Name und Anzahl darunter, ein Schloss auf privaten Alben und der Name der Person, die ein fremdes Album angelegt hat; Alben werden über den einheitlichen Bestätigungsdialog gelöscht, und „Fotos hinzufügen“ im Album ist jetzt eine auffällige Hauptschaltfläche",
    "Die Personenseite zeigt große Porträts im Format 3:4 mit Name und Anzahl darunter; ein Klick auf den Namen benennt direkt um. Der Kopf einer Person ist schlichter: Profilbild, Name und Alter, darunter Jahre sowie Foto- und Videoanzahl, rechts die Tabs Fotos, Entwicklung, Orte und Gemeinsam; die Karten in Entwicklung, Gemeinsam und Orte sind so groß wie auf der Personen- und Albenseite",
    "Alle Seitentitel stehen jetzt in einer Zeile: der große Titel, gefolgt von einer grauen Beschreibung",
    "Auf Smartphones und anderen schmalen Bildschirmen gibt es oben eine Logoleiste, und das Menü gleitet von rechts herein",
    "Demokonto: Das Konto mit dem Benutzernamen demo (änderbar mit WANMORY_DEMO_USER) kann weder das Passwort ändern noch andere Geräte abmelden oder etwas löschen; Hochladen ist möglich, und selbst hochgeladene Fotos und angelegte Alben lassen sich innerhalb von 30 Minuten wieder löschen",
    "Verbesserungen bei ausgewählten Erinnerungen, Anmeldeverlauf, Profilbildern, ästhetischer Bewertung, IP-Standort und mehr",
  ],
  'v0.2.9': [
    'Neues Logo: ein in einem Zug gezeichnetes „M“ in einem dünnen Kreis mit einem roten Punkt; auch Browser-Tabs zeigen jetzt ein Symbol',
    'Das linke Menü lässt sich zu einer schmalen Leiste nur mit Symbolen einklappen (Klick aufs Logo klappt es aus); es ist in drei Gruppen gegliedert: Häufig, Kategorien und Ordnen. Unter Kategorien finden sich Favoriten, Bewertung, Videos, Landschaft, Essen, Tiere und Pflanzen, Screenshots, Dokumente und Ausweise stehen unter „Mehr“',
    'Neue Kategorie „Pflanzen“, „Haustiere“ heißt jetzt „Tiere“ (Vögel und Zootiere zählen mit); die Suche nach einem Kategorienamen (Essen, Landschaft …) zeigt direkt die Fotos dieser Kategorie',
    'Neues „Mein Konto“: Über den Avatar unten links im Menü lassen sich Avatar, Name und Passwort ändern, angemeldete Geräte (Browser, IP, zuletzt genutzt) einsehen und andere Geräte abmelden; auch das Design wird hier eingestellt',
    'Die Systemeinstellungen bestehen jetzt aus Karten: Mitglieder, KI-Betriebsart (mit Verbindungstest und Hinweis, wenn keine Verbindung besteht), Rechengerät, Modellstufe (heruntergeladene Modelle lassen sich löschen), Hintergrundverarbeitung, Upload-Verzeichnis, Gastansicht, Online-Karten und Systemupdate; Modelle werden jetzt automatisch von der schnelleren Quelle geladen, Hugging Face oder ein Spiegel in China',
    'Alle Pop-up-Fenster haben jetzt einen einheitlichen durchscheinenden Milchglas-Look mit Haupt- und Nebenschaltflächen; Fehler beim Hinzufügen eines Mitglieds oder Ändern des Passworts erscheinen direkt im Fenster',
    'Die „Freigabeeinstellungen“ eines Albums heißen jetzt „Berechtigungen“: Alle, Bestimmte Mitglieder, Nur ich',
    'Dunklerer Hintergrund im Dunkelmodus; alle Schaltflächen und Segmentschalter der App haben jetzt einen einheitlichen Stil',
    'Das Symbol der Hintergrundaufgaben drehte sich nach Abschluss aller Aufgaben weiter und zeigte 0',
  ],
  'v0.2.8': [
    'Der Inhaltsbereich hat jetzt einen weißen Hintergrund (für genauere Farben), das linke Menü ist beige; die Speicheranzeige unten im Menü ist jetzt eine kleine weiße Karte',
    'Die Wiedergabetaste ist jetzt nur noch ein oranges rundes Symbol, beim Darüberfahren erscheint „Diashow“',
    'Aufgeräumter Kopfbereich der Personenseite: kein Verlauf, dünner Rahmen, oben Avatar, Name, Alter und Geburtstag, darunter vier Kennzahlen; der Geburtstag lässt sich direkt unter dem Namen setzen oder ändern, und der Kopfbereich ist auf den Tabs Fotos, Entwicklung, Orte und Gemeinsam identisch',
  ],
  'v0.2.7': [
    'Ein völlig neuer, warmer Look: cremeweißer Hintergrund, ziegeloranger Akzent und eine Serifenschrift für Seitentitel, Namen, Erinnerungen und Daten; ein neues oranges Logo',
    'Jede Seite hat oben ein Suchfeld (durchsucht die ganze Bibliothek); Kalender, Sortierung, Filter und Anzeigegröße rechts sind in einer Schaltflächengruppe zusammengefasst, und die Wiedergabe ist überall eine orange „Diashow“-Taste',
    'Fotos in Bibliothek, Favoriten, Alben und Personen sind nach Monaten gruppiert, jede Gruppe überschrieben wie „November 2026“',
    '„Heute vor …“ ist jetzt eine große Karte mit einem einzelnen Foto',
    'Neuer Kopfbereich der Personenseite: großer Avatar, Alter und Geburtstag, Kennzahlen zu Fotos, Videos, Zeitspanne in Jahren und besuchten Orten sowie die Personen, mit denen jemand oft zu sehen ist',
    'Das linke Menü bleibt immer sichtbar (es klappt beim Öffnen einer Person oder eines Albums nicht mehr ein) und zeigt unten die Speichernutzung; „Dateien hochladen“ heißt jetzt „Fotos / Videos hochladen“',
    'Ein einfacher Klick auf ein Foto öffnet es in voller Größe (⌘ / Strg- oder ⇧-Klick zur Mehrfachauswahl); beim Seitenwechsel blenden Fotos sanft ein',
    'Die Schaltflächen oben rechts und die Zeitleiste rechts sprangen beim Seitenwechsel, beim Öffnen einer Person flackerte der Bildschirm, und auf dem iPad ruckelte die Menüanimation',
    'Dialoge und Menüs haben jetzt einen deckenden weißen Hintergrund; die Aktionsleiste bei ausgewählten Fotos, die Hintergrundaufgaben und das Upload-Fenster nutzen einen hellen Milchglas-Stil',
    'Passwort vergessen (auch als einziger Admin oder wenn sogar der Name vergessen ist)? Führen Sie auf dem Rechner, auf dem die App läuft, `docker compose exec server wanmory reset-password` aus; siehe „Passwort vergessen“ im README',
  ],
  'v0.2.6': [
    'Die Titelleiste oben auf jeder Seite hat jetzt dieselbe Höhe und Position, Titel und Schaltflächen springen beim Seitenwechsel nicht mehr',
    'Beim Seitenwechsel blitzen nicht mehr kurz die Fotos der vorherigen Seite auf',
    'Im hellen Modus haben Inhaltsbereich und linkes Menü denselben Hintergrund',
    '„Abmelden“ unten im Menü hinzugefügt; das Zahnrad der Systemeinstellungen ist für Nicht-Admins ausgeblendet (Klick auf Avatar und Namen führt zu den eigenen Einstellungen)',
    'Alles Anklickbare zeigt beim Darüberfahren einen Handcursor',
  ],
  'v0.2.5': [
    'Vereinfachtes Panel der Hintergrundaufgaben: Gesichter, Inhalte und Text sind zu einer Zeile „KI-Erkennung“ zusammengefasst, Metadaten und Vorschaubilder zu „Fotos importieren“; beide zeigen den Fortschritt nach Fotoanzahl samt geschätzter Restzeit',
    'Mit der Stufe „Automatisch“ steht die Stufe schneller fest und die Verarbeitung beginnt früher, auch wenn der KI-Dienst direkt nach dem Start ausgelastet ist',
  ],
  'v0.2.4': [
    'Der KI-Dienst braucht weniger Arbeitsspeicher: Ungenutzte Modelle werden automatisch entladen (nach 5 Minuten auf Rechnern mit weniger als 8 GB, nach 30 Minuten auf größeren), nach einem Stufenwechsel werden die Modelle der alten Stufe freigegeben, und auf Rechnern mit wenig Speicher wird kein Speicherpool reserviert. Auf einem Raspberry Pi belegt der KI-Dienst kaum Speicher, solange keine Fotos verarbeitet werden',
    'Neue Stufe „Automatisch“ (Standard, solange keine Stufe gewählt wurde): gewählt nach der Hardware des KI-Servers – mit GPU „Hohe Genauigkeit“, nur mit CPU unter 6 GB Speicher „Leicht“, darüber „Ausgewogen“; sie passt sich an, wenn der KI-Server wechselt. Die KI-Verarbeitung beginnt erst, wenn die Stufe feststeht',
  ],
  'v0.2.3': [
    'Die Hintergrundaufgaben zeigten noch lange nach Ende der Uploads „KI pausiert: Fotos werden hochgeladen“. Jetzt zählen nur Uploads, die tatsächlich Daten übertragen, und die KI macht 30 Sekunden nach deren Ende weiter',
    'Die Bibliothek zeigt oben kein „In Bearbeitung / Fertig“ mehr; den Fortschritt zeigt nur noch das Aufgabensymbol oben im Menü',
  ],
  'v0.2.2': [
    'Oben im Menü steht die Versionsnummer; neu in den Einstellungen ist „Systemupdate“: zeigt die Versionen von App und KI-Dienst, meldet neue Versionen und listet deren Neuerungen auf',
    'Bei der Veröffentlichung einer neuen Version werden die Versionshinweise automatisch erzeugt',
  ],
  'v0.2.1': [
    'Die Hintergrundverarbeitung passt sich dem Rechner an: Wie viele Fotos die KI gleichzeitig bearbeitet und wie viele Threads jedes Modell nutzt, richtet sich nach Grafikkarte, Kernzahl und Arbeitsspeicher – ein Raspberry Pi hängt nicht mehr fest',
    'Zeitpunkt der KI-Verarbeitung: Im Leerlauf (Standard; pausiert, während jemand hochlädt oder Vorschaubilder entstehen), Jederzeit oder Nur nachts',
    'Neuer Bereich „Leistung“ in den Einstellungen, in dem sich all das von Hand ändern lässt; die KI-Stufe wird anhand der Server-Hardware empfohlen',
    'Symbol für Hintergrundaufgaben oben im Menü: erscheint, solange Aufgaben laufen, und zeigt beim Öffnen den Fortschritt je Aufgabentyp und ob die KI pausiert',
    'Die docker-compose.yml für die Installation enthält jetzt die Datenbank – eine einzige Datei genügt',
  ],
  'v0.2.0': [
    'Gastansicht: geteilte Fotos und Alben ohne Anmeldung nur ansehen (in den Einstellungen abschaltbar)',
    'Neues Anmeldefenster',
    'Alben können privat sein oder nur mit bestimmten Mitgliedern geteilt werden; ein privates Album kann zugleich die selbst hochgeladenen Fotos darin ausblenden',
  ],
  'v0.1.0': ['Erste Version: Bibliothek, Alben, Personen (Gesichtserkennung), Orte, Favoriten, Bewertungen, semantische Suche und Texterkennung'],
}

export default changelog
