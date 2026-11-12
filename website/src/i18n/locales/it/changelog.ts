// Italiano · Traduzione di CHANGELOG.md, per versione, una frase per punto nello stesso ordine.
// Il prefisso «修复：» (Correzione) è mostrato come icona e qui viene omesso.
// Le versioni mancanti (o con un numero diverso di punti) compaiono nel cinese originale.

const changelog: Record<string, string[]> = {
  'v0.4.4': [
    "Dalla v0.4.2 Wanmory assegnava i file della cartella dei dati all'utente del container, quindi l'utente dell'host (per esempio un utente di Raspberry Pi con ID diverso da 1000) non poteva eliminare le foto caricate e le miniature; ora Wanmory gira come proprietario della cartella dei dati, tutto ciò che scrive gli appartiene e i file lasciati dalle versioni precedenti gli vengono restituiti",
    "I file dei modelli scaricati dal servizio IA appartenevano a root e non si potevano eliminare sull'host; ora passano al proprietario della cartella dei modelli",
    "Script di disinstallazione: se l'eliminazione normale viene rifiutata, elimina tramite un container temporaneo; segnala un errore, con il comando sudo da eseguire, solo se fallisce anche questo, invece di dire insieme che non è riuscito e che ha eliminato",
  ],
  'v0.4.3': [
    "Nuova capsula di stato in alto a destra: mentre le foto vengono caricate, importate o analizzate dall'IA compare a sinistra della barra degli strumenti e dice in poche parole cosa sta succedendo (Caricamento 11%, Caricamento completato, In attesa dell'analisi IA, Analisi IA 3 / 674); cliccandola si vedono l'avanzamento del caricamento, ogni file e le attività in background. Sostituisce la finestra di caricamento in basso a sinistra e l'icona delle attività in cima al menu",
    "I caricamenti continuano quando passi a un'altra pagina e l'avanzamento è visibile ovunque; chiudendo o ricaricando la pagina mentre ci sono ancora foto in caricamento viene chiesta conferma",
    "Un caricamento bloccato (rete caduta per un attimo, 45 secondi senza avanzamento) si riconnette da solo e riprende da dove si era fermato",
    "Senza i modelli IA scaricati, il riconoscimento del testo integrato girava comunque e l'avanzamento sembrava un'analisi in corso; ora tutta l'analisi IA resta in pausa finché i modelli non sono scaricati, con un invito a scaricarli in Impostazioni → IA, e parte da sola subito dopo",
  ],
  'v0.4.2': [
    "Wanmory non si avviava e si riavviava di continuo quando la cartella dei dati non apparteneva all’utente del container (per esempio dopo un’installazione con sudo o su un Raspberry Pi); ora il proprietario della cartella viene corretto all’avvio, e funziona anche su chiavette USB e condivisioni di rete dove il proprietario non si può cambiare",
    "Script di installazione: attende fino a 5 minuti prima di decidere se Wanmory si è avviato; se si riavvia di continuo mostra le ultime righe del log, e non scrive più «Installation complete» quando l’avvio non è riuscito; il messaggio finale non contiene più cinese; ora si apre con un banner di benvenuto e la versione che verrà installata",
  ],
  'v0.4.1': [
    "Verifica in due passaggi: le app di autenticazione ora mostrano la voce come «Wanmory:nome utente», senza il prefisso cinese; se l’avevi già attivata, disattivala e inquadra di nuovo il codice per vedere il nuovo nome",
  ],
  'v0.4.0': [
    "L’interfaccia è ora disponibile in 12 lingue: 简体中文, 繁體中文, English, 日本語, 한국어, Deutsch, Français, Español, Português, Русский, Italiano, Tiếng Việt. Si imposta in Il mio account; per impostazione predefinita segue la lingua del browser e resta la stessa quando accedi da un altro dispositivo. Anche date, numeri e nomi dei luoghi seguono la lingua",
    "Verifica in due passaggi: attivala in Il mio account inquadrando un codice QR con un’app di autenticazione (Google Authenticator, Microsoft Authenticator, 2FAS e altre); all’accesso, dopo la password, viene chiesto un codice di 6 cifre. Ricevi 10 codici di recupero per quando non hai il telefono a portata di mano",
    "Nuova scelta dell’avatar: in alto un’anteprima di ritaglio da trascinare e ingrandire, sotto la scelta tra caricare un’immagine, una foto della libreria, l’avatar predefinito o un cartone",
    "Tutte le finestre di dialogo hanno ora lo stesso aspetto: icona, titolo e descrizione centrati, con due pulsanti della stessa larghezza in basso; l’eliminazione di membri, album e modelli usa la stessa conferma",
    "Con delle foto selezionate, Altro ora offre Condividi…: usa il menu di condivisione del sistema per inviarle via email (le foto sono già allegate), con AirDrop o ad altre app; la libreria deve essere aperta via https o localhost",
    "Ordinando per data di aggiunta, anche la linea temporale a destra e i gruppi di date sopra le foto usano la data di aggiunta",
    "Sicurezza: dopo diverse password errate l’accesso viene bloccato per un po’; il sito non può essere incorporato in altri siti e i file caricati non vengono mai eseguiti come pagine web; il dominio della rete locale si modifica direttamente nelle impostazioni di sistema",
    "L’avviso di caricamento completato scompare dopo 10 secondi",
    "Lo sfondo scattava all’apertura di una finestra di conferma",
  ],
  'v0.3.1': [
    "La mappa di Luoghi ora si può ingrandire, rimpicciolire e trascinare: zoom con la rotellina o il trackpad, doppio clic per ingrandire, trascinamento per spostarsi, pizzico con due dita sul telefono, e pulsanti in basso a destra per ingrandire, rimpicciolire o vedere tutto il mondo; intorno al livello di un paese passa a una mappa stradale (servono le mappe online attive) con città, strade e nomi di luoghi, e le puntine con le foto si dividono man mano che si ingrandisce, fino ai singoli luoghi di scatto; tornando dalle foto la mappa resta dov’era",
    "Sito web: il calendario della pagina delle versioni ora è un calendario mensile con i numeri di versione di ogni giorno, e un clic su una versione porta alle sue note; corretto il problema delle pagine che a volte si caricavano senza stile con connessioni lente o subito dopo un aggiornamento del sito",
  ],
  'v0.3.0': [
    "Nuovo sito web: home, architettura, installazione e documentazione, domande frequenti, versioni e feedback, in 12 lingue; per impostazione predefinita segue la lingua del browser, e si può cambiare in fondo alla pagina",
    "Script di installazione e disinstallazione con un solo comando (install.sh, uninstall.sh): durante l’installazione puoi impostare porta, dominio, password e posizione del database, fuso orario, cartella dei dati e cartella delle foto; decidi tu dove tenere database, dati e modelli (WANMORY_DB_DIR, WANMORY_DATA_DIR, WANMORY_MODELS_DIR), e WANMORY_DOMAIN imposta il dominio usato nella rete locale",
    "Luoghi ora è una mappa del mondo piatta: i paesi visitati hanno un colore caldo, ogni città ha una puntina con una foto e il nome della città e del paese, e un clic apre le foto scattate lì; in alto a destra restano solo Mappa / Griglia, e la mappa stradale e il globo satellitare sono stati rimossi",
    "La pagina Album usa schede grandi: copertina quadrata con nome e numero di elementi sotto, un lucchetto sugli album privati e il nome di chi ha creato gli album altrui; l’eliminazione di un album usa la finestra di conferma standard, e Aggiungi foto dentro un album ora è un pulsante principale ben visibile",
    "La pagina Persone mostra grandi ritratti 3:4 con nome e numero sotto; fai clic sul nome per rinominare. L’intestazione di una persona è più semplice: avatar, nome ed età, con gli anni e il numero di foto e video nella riga sotto, e a destra le schede Foto, Crescita, Luoghi e Insieme; le schede in Crescita, Insieme e Luoghi hanno la stessa dimensione delle pagine Persone e Album",
    "Tutti i titoli di pagina ora stanno su una riga: il titolo grande seguito da una descrizione in grigio",
    "Su telefoni e altri schermi stretti, in alto c’è una barra con il logo e il menu scorre da destra",
    "Account demo: l’account chiamato demo (si può cambiare con WANMORY_DEMO_USER) non può cambiare la password, disconnettere altri dispositivi né eliminare nulla; può caricare, e può eliminare le foto caricate e gli album creati negli ultimi 30 minuti",
    "Miglioramenti a ricordi in evidenza, cronologia degli accessi, avatar, punteggio estetico, posizione da IP e altro",
  ],
  'v0.2.9': [
    'Nuovo logo: una «M» tracciata con un solo segno dentro un cerchio sottile, con un punto rosso; anche le schede del browser mostrano ora un’icona',
    'Il menu a sinistra si può ridurre a una barra stretta di sole icone (fai clic sul logo per espanderlo); ora è diviso in tre gruppi: Principali, Categorie e Riordina. Nelle categorie ci sono Preferiti, Valutazione, Video, Paesaggi, Cibo, Animali e Piante, mentre Screenshot, Documenti e Documenti d’identità stanno in «Altro»',
    'Nuova categoria «Piante», e «Animali domestici» diventa «Animali» (contano anche uccelli e animali dello zoo); cercare il nome di una categoria (Cibo, Paesaggi…) mostra subito le sue foto',
    'Nuova pagina «Il mio account»: fai clic sull’avatar in basso a sinistra nel menu per cambiare avatar, nome e password, vedere i dispositivi connessi (browser, IP, ultimo utilizzo) e disconnettere gli altri; anche il tema si imposta qui',
    'Le impostazioni di sistema sono ora una serie di schede: Membri, Modalità di esecuzione IA (con test di connessione e avviso se non si collega), Dispositivo di calcolo, Livello dei modelli (i modelli scaricati si possono eliminare), Elaborazione in background, Cartella dei caricamenti, Accesso ospiti, Mappe online e Aggiornamento di sistema; i modelli si scaricano ora in automatico dalla fonte più veloce, Hugging Face o un mirror in Cina',
    'Tutte le finestre a comparsa hanno ora lo stesso aspetto di vetro smerigliato traslucido, con pulsanti principali e secondari; gli errori nell’aggiungere un membro o nel cambiare password compaiono direttamente nella finestra',
    'Le «Impostazioni di condivisione» di un album diventano «Permessi»: Tutti, Membri specifici, Solo io',
    'Sfondo più scuro in modalità scura; tutti i pulsanti e i selettori segmentati dell’app hanno ora un unico stile',
    'L’icona dei lavori in background continuava a girare mostrando 0 anche dopo la fine di tutti i lavori',
  ],
  'v0.2.8': [
    'L’area dei contenuti ha ora lo sfondo bianco (per colori più fedeli) e il menu a sinistra è beige; lo spazio di archiviazione in fondo al menu è ora una piccola scheda bianca',
    'Il pulsante di riproduzione è ora solo un’icona rotonda arancione, che al passaggio del mouse mostra «Presentazione»',
    'Intestazione della pagina di una persona più pulita: niente sfumature, bordo sottile, sopra avatar, nome, età e compleanno, sotto quattro statistiche; il compleanno si imposta o si modifica subito sotto il nome, e l’intestazione è identica nelle schede Foto, Crescita, Luoghi e Insieme',
  ],
  'v0.2.7': [
    'Un aspetto caldo tutto nuovo: sfondo bianco panna, accento arancio mattone e un carattere con grazie per titoli, nomi, ricordi e date; un nuovo logo arancione',
    'Ogni pagina ha ora in alto una casella di ricerca (su tutta la fototeca); calendario, ordinamento, filtro e dimensione di visualizzazione a destra sono riuniti in un unico gruppo di pulsanti, e la riproduzione è ovunque un pulsante arancione «Presentazione»',
    'Le foto di libreria, preferiti, album e persone sono raggruppate per mese, con ogni gruppo intitolato come «Novembre 2026»',
    '«Accadde oggi» è ora una grande scheda con una sola foto',
    'Nuova intestazione della pagina di una persona: avatar grande, età e compleanno, statistiche su foto, video, anni coperti e luoghi visitati, e le persone con cui compare più spesso',
    'Il menu a sinistra resta sempre visibile (non si chiude più aprendo una persona o un album) e mostra in fondo lo spazio usato; «Carica file» diventa «Carica foto / video»',
    'Un solo clic su una foto la apre in grande (clic con ⌘ / Ctrl o ⇧ per selezionarne più d’una); cambiando pagina le foto compaiono in dissolvenza',
    'Cambiando pagina saltavano i pulsanti in alto a destra e la cronologia a destra, lo schermo lampeggiava aprendo una persona e l’animazione del menu scattava su iPad',
    'Finestre di dialogo e menu hanno ora lo sfondo bianco opaco; la barra delle azioni per le foto selezionate, i lavori in background e la finestra di caricamento usano un vetro smerigliato chiaro',
    'Hai dimenticato la password (anche se sei l’unico amministratore o hai dimenticato perfino il nome)? Sulla macchina dove gira l’app esegui `docker compose exec server wanmory reset-password`; vedi «Password dimenticata» nel README',
  ],
  'v0.2.6': [
    'La barra del titolo in cima a ogni pagina ha ora la stessa altezza e posizione, quindi titoli e pulsanti non saltano più cambiando pagina',
    'Cambiando pagina non si vedono più per un istante le foto della pagina precedente',
    'In modalità chiara, l’area dei contenuti e il menu a sinistra hanno lo stesso sfondo',
    'Aggiunto «Esci» in fondo al menu; l’ingranaggio delle impostazioni di sistema è nascosto a chi non è amministratore (fai clic sul tuo avatar e sul tuo nome per le tue impostazioni)',
    'Tutto ciò che è cliccabile mostra il cursore a manina al passaggio del mouse',
  ],
  'v0.2.5': [
    'Pannello dei lavori in background semplificato: volti, contenuti e testo sono uniti in un’unica riga «Riconoscimento IA», metadati e miniature in «Importazione foto»; entrambe mostrano l’avanzamento per numero di foto e il tempo residuo stimato',
    'Con il livello Automatico, il livello viene deciso prima e l’elaborazione parte più in fretta, anche quando il servizio IA è impegnato subito dopo l’avvio',
  ],
  'v0.2.4': [
    'Il servizio IA usa meno memoria: i modelli inutilizzati vengono scaricati in automatico (dopo 5 minuti sulle macchine con meno di 8 GB, 30 minuti su quelle più grandi), i modelli del livello precedente vengono liberati dopo il cambio e sulle macchine con poca memoria non si riserva alcun pool. Su un Raspberry Pi il servizio IA occupa pochissima memoria quando non elabora foto',
    'Nuovo livello Automatico (predefinito finché non si sceglie un livello): scelto in base all’hardware del server IA, Alta precisione con GPU e, con sola CPU, Leggero sotto i 6 GB di memoria ed Equilibrato sopra; si adegua se cambi server IA. L’elaborazione IA non parte finché il livello non è deciso',
  ],
  'v0.2.3': [
    'I lavori in background mostravano ancora «IA in pausa: ci sono foto in caricamento» molto dopo la fine dei caricamenti. Ora contano solo i caricamenti che trasferiscono davvero dati, e l’IA riprende 30 secondi dopo la loro fine',
    'L’intestazione della libreria non mostra più «In elaborazione / Completato»; l’avanzamento si vede solo dall’icona dei lavori in cima al menu',
  ],
  'v0.2.2': [
    'Il numero di versione compare in cima al menu; nuova sezione «Aggiornamento di sistema» nelle impostazioni: mostra le versioni dell’app e del servizio IA, avvisa quando c’è una nuova versione ed elenca le sue novità',
    'Le note di versione vengono generate in automatico alla pubblicazione di una nuova versione',
  ],
  'v0.2.1': [
    'L’elaborazione in background si adatta alla macchina: quante foto l’IA elabora insieme e quanti thread usa ogni modello dipendono dalla presenza di una GPU, dal numero di core e dalla memoria, così un Raspberry Pi non si blocca più',
    'Quando elaborare con l’IA: A riposo (predefinito; in pausa mentre qualcuno carica foto o si generano miniature), Sempre o Solo di notte',
    'Nuova sezione «Prestazioni» nelle impostazioni per cambiare tutto questo a mano; il livello IA viene consigliato in base all’hardware del server',
    'Icona dei lavori in background in cima al menu: compare quando ci sono lavori in corso e, aperta, mostra l’avanzamento per tipo di lavoro e se l’IA è in pausa',
    'Il docker-compose.yml di installazione include ora il database, quindi basta un solo file per installare',
  ],
  'v0.2.0': [
    'Accesso ospiti: vedere in sola lettura foto e album condivisi senza accedere (disattivabile nelle impostazioni)',
    'Nuova finestra di accesso',
    'Gli album possono essere privati o condivisi solo con membri specifici; un album privato può anche nascondere le foto che vi hai caricato',
  ],
  'v0.1.0': ['Prima versione: libreria, album, persone (riconoscimento facciale), luoghi, preferiti, valutazioni, ricerca semantica e riconoscimento del testo'],
}

export default changelog
