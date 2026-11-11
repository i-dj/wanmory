import type { FaqDict } from '../zh/faq'

// Italiano · Domande frequenti

const faq: FaqDict = {
  title: 'Domande frequenti',
  lead: 'Le risposte alle domande che riceviamo più spesso. Non trovi la tua? Apri una issue su GitHub o consulta la documentazione completa di installazione e uso.',
  readDocs: 'Leggi la documentazione',
  submit: 'Segnala un problema',
  categories: 'Categorie di domande',
  all: 'Tutte',
  showAll: 'Mostra tutte le {n} domande',
  groups: [
    {
      key: 'deploy',
      label: 'Installazione',
      items: [
        {
          q: 'Che hardware serve per Wanmory?',
          a: 'Va bene qualsiasi dispositivo x86_64 o ARM64 che esegua Docker: un NAS, un mini PC o un Raspberry Pi 5. Da 4 GB di memoria il sistema sceglie da solo i modelli leggeri; con 8 GB o più puoi usare il livello Equilibrato. Per fototeche grandi o un’elaborazione IA più veloce, il servizio IA può girare su un computer con GPU o su un Mac con Apple Silicon.',
        },
        {
          q: 'Funziona su un NAS Synology o QNAP?',
          a: 'Sì. Wanmory si installa con Docker Compose e funziona su Synology DSM, QNAP QTS, TrueNAS SCALE, Unraid e distribuzioni Linux come Ubuntu e Debian. Le immagini esistono per amd64 e arm64 e viene scaricata in automatico quella giusta.',
        },
        {
          q: 'Devo ricaricare le foto che sono già sul NAS?',
          a: 'No. Monta le cartelle delle foto sotto /photos in docker-compose.yml. Puoi montarne più d’una, preferibilmente in sola lettura (:ro). Le cartelle vengono scansionate ogni 15 minuti e le foto nuove importate sul posto, senza copiare né spostare gli originali.',
        },
        {
          q: 'Il download delle immagini è lento. Cosa faccio?',
          a: 'Imposta WANMORY_REGISTRY nel file .env accanto a docker-compose.yml con un registro raggiungibile, poi esegui di nuovo docker compose up -d.',
        },
        {
          q: 'Come aggiorno a una nuova versione?',
          a: 'Esegui docker compose pull && docker compose up -d nella cartella che contiene docker-compose.yml. Le migrazioni del database partono da sole all’avvio e non toccano foto, persone e album. In «Impostazioni di sistema → Aggiornamento di sistema» l’app web ti avvisa quando c’è una nuova versione.',
        },
        {
          q: 'E se dimentico la password dell’amministratore?',
          a: 'Sull’host dell’app, entra nella cartella che contiene docker-compose.yml, esegui docker compose exec server wanmory reset-password, poi scegli l’account e inserisci una nuova password seguendo le istruzioni. Le password dei membri normali le reimposta un amministratore in «Impostazioni di sistema → Membri».',
        },
      ],
    },
    {
      key: 'ai',
      label: 'IA e privacy',
      items: [
        {
          q: 'Le mie foto vengono caricate nel cloud?',
          a: 'No. Foto, miniature, database e tutti i risultati dell’IA restano sul dispositivo dove gira Wanmory. I modelli di IA si scaricano solo al primo uso; dopo, riconoscimento facciale, ricerca semantica e riconoscimento del testo avvengono in locale.',
        },
        {
          q: 'Posso usare l’IA su un NAS poco potente?',
          a: 'Sì. Il servizio IA integrato usa solo la CPU. La prima passata su una fototeca grande richiede più tempo, poi le foto nuove vengono elaborate man mano. In «Prestazioni e risorse» puoi limitare l’elaborazione ai momenti di riposo o alla notte, così non intralcia l’uso quotidiano.',
        },
        {
          q: 'Il servizio IA può girare su un altro computer?',
          a: 'Sì. Avvia il servizio IA su un Mac o su un computer con scheda video NVIDIA, poi scegli «Servizio remoto» in «Impostazioni di sistema → IA» e inserisci indirizzo e token di accesso. Il servizio IA riceve solo anteprime da 1440 pixel e non tocca mai gli originali né il database.',
        },
        {
          q: 'L’IA ha bisogno di internet sempre?',
          a: 'No. Una volta scaricati i modelli, tutto funziona completamente offline. Solo le mappe online e la ricerca inversa dei nomi dei luoghi richiedono internet, e si possono disattivare entrambe nelle impostazioni: i luoghi mostreranno solo le coordinate.',
        },
        {
          q: 'Come vengono raggruppati i volti?',
          a: 'Il sistema rileva i volti in ogni foto e calcola per ciascuno un vettore di tratti; i volti simili vengono assegnati in automatico alla stessa persona. Una persona compare solo se è presente in almeno 3 foto, quindi i passanti occasionali non vengono aggiunti. Dai un nome e un compleanno per rivedere la crescita per età.',
        },
        {
          q: 'Quali tipi di ricerca sono supportati?',
          a: 'La ricerca in linguaggio naturale in cinese, ad esempio «宝宝三岁生日的照片» (foto del terzo compleanno del bimbo) o «海边的日落» (tramonto al mare); si può cercare anche il testo presente nelle foto (documenti, screenshot, insegne) e il luogo dello scatto. I tre tipi di risultati vengono uniti e ordinati, e si restituiscono solo le foto chiaramente pertinenti.',
        },
      ],
    },
    {
      key: 'usage',
      label: 'Uso e funzioni',
      items: [
        {
          q: 'Come apro la fototeca dal telefono?',
          a: 'Nella stessa rete locale, apri http://wanmory.local:8080 nel browser del telefono. iPhone, iPad, Mac e Windows non richiedono configurazioni sul router. Alcuni dispositivi Android non supportano i domini .local: in quel caso usa l’indirizzo IP.',
        },
        {
          q: 'Quali formati di foto e video sono supportati?',
          a: 'I formati di foto più comuni, tra cui JPEG, PNG, HEIC e RAW (come DNG), più i formati video comuni. I caricamenti web riprendono dopo un’interruzione di rete o un ricaricamento della pagina.',
        },
        {
          q: 'Le foto eliminate si possono recuperare?',
          a: 'Sì. Le foto eliminate passano prima da «Eliminate di recente», da dove si possono ripristinare in qualsiasi momento. Per le cartelle montate in sola lettura, i file originali restano anche dopo l’eliminazione definitiva nell’app: semplicemente non vengono più mostrati.',
        },
        {
          q: 'Come riordino raffiche e foto duplicate?',
          a: '«Raffiche e simili» raggruppa in automatico gli scatti a raffica e le foto quasi identiche e consiglia di tenere la più nitida; le altre si spostano con un clic in «Eliminate di recente». I file dal contenuto identico compaiono a parte in «Duplicati».',
        },
      ],
    },
    {
      key: 'members',
      label: 'Membri e permessi',
      items: [
        {
          q: 'Più persone possono usarlo insieme?',
          a: 'Sì. Un amministratore crea un account per ciascuno e i caricamenti di tutti confluiscono in un’unica fototeca. I membri possono eliminare solo le proprie foto, gli amministratori gestiscono tutto e la cronologia degli accessi registra ora, dispositivo e posizione approssimativa di ogni accesso.',
        },
        {
          q: 'Gli altri membri vedono le foto che nascondo?',
          a: 'No. Le foto nascoste le vedi solo tu, e gli album privati solo chi li ha creati. Nomi e unioni delle persone sono condivisi, ma numero di foto e copertine che vede ciascun membro si calcolano solo sulle foto che quel membro può vedere.',
        },
        {
          q: 'Che cos’è l’accesso ospiti?',
          a: 'Con l’accesso ospiti attivo, chi non ha effettuato l’accesso può vedere le foto condivise in sola lettura; album privati e foto nascoste restano invisibili. Se la fototeca è raggiungibile da internet, consigliamo di disattivare l’accesso ospiti nelle impostazioni.',
        },
      ],
    },
  ],
}

export default faq
