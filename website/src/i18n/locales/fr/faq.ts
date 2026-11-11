import type { FaqDict } from '../zh/faq'

// Français · FAQ

const faq: FaqDict = {
  title: 'Questions fréquentes',
  lead: 'Les réponses aux questions qu’on nous pose le plus souvent. Vous ne trouvez pas ? Signalez un problème sur GitHub ou consultez la documentation complète de déploiement et d’utilisation.',
  readDocs: 'Lire la documentation',
  submit: 'Signaler un problème',
  categories: 'Catégories de questions',
  all: 'Toutes',
  showAll: 'Afficher les {n} questions',
  groups: [
    {
      key: 'deploy',
      label: 'Déploiement',
      items: [
        {
          q: 'Quel matériel faut-il pour Wanmory ?',
          a: 'N’importe quel appareil x86_64 ou ARM64 capable de faire tourner Docker : un NAS, un mini-PC ou un Raspberry Pi 5. Dès 4 Go de mémoire, le système choisit automatiquement les modèles légers ; à partir de 8 Go, le niveau Équilibré est disponible. Pour une grande photothèque ou un traitement IA plus rapide, le service IA peut tourner sur un ordinateur avec GPU ou un Mac Apple Silicon.',
        },
        {
          q: 'Est-ce compatible avec un NAS Synology ou QNAP ?',
          a: 'Oui. Wanmory se déploie avec Docker Compose et fonctionne sur Synology DSM, QNAP QTS, TrueNAS SCALE, Unraid et des distributions Linux comme Ubuntu et Debian. Les images existent pour amd64 et arm64, et la bonne est récupérée automatiquement.',
        },
        {
          q: 'Faut-il réimporter les photos déjà présentes sur mon NAS ?',
          a: 'Non. Montez vos dossiers photo sous /photos dans docker-compose.yml. Vous pouvez en monter plusieurs, de préférence en lecture seule (:ro). Les dossiers sont analysés toutes les 15 minutes et les nouvelles photos importées sur place, sans copier ni déplacer les originaux.',
        },
        {
          q: 'Le téléchargement des images est lent. Que faire ?',
          a: 'Définissez WANMORY_REGISTRY dans le fichier .env à côté de docker-compose.yml vers un registre accessible, puis relancez docker compose up -d.',
        },
        {
          q: 'Comment passer à une nouvelle version ?',
          a: 'Exécutez docker compose pull && docker compose up -d dans le dossier contenant docker-compose.yml. Les migrations de la base s’exécutent automatiquement au démarrage, sans toucher à vos photos, personnes et albums. « Réglages système → Mise à jour » dans l’app web indique si une nouvelle version est disponible.',
        },
        {
          q: 'Et si j’oublie le mot de passe administrateur ?',
          a: 'Sur l’hôte de l’app, allez dans le dossier contenant docker-compose.yml, exécutez docker compose exec server wanmory reset-password, puis choisissez le compte et saisissez un nouveau mot de passe comme indiqué. Les mots de passe des membres ordinaires sont réinitialisés par un administrateur dans « Réglages système → Membres ».',
        },
      ],
    },
    {
      key: 'ai',
      label: 'IA et confidentialité',
      items: [
        {
          q: 'Mes photos sont-elles envoyées dans le cloud ?',
          a: 'Non. Photos, miniatures, base de données et tous les résultats de l’IA restent sur l’appareil où tourne Wanmory. Les modèles d’IA ne sont téléchargés qu’à la première utilisation ; ensuite, reconnaissance faciale, recherche sémantique et reconnaissance de texte se font en local.',
        },
        {
          q: 'Puis-je utiliser l’IA sur un NAS peu puissant ?',
          a: 'Oui. Le service IA intégré n’utilise que le processeur. Le premier passage sur une grande photothèque prend plus de temps, puis les nouvelles photos sont traitées au fur et à mesure. Dans « Performances et ressources », vous pouvez limiter le traitement aux périodes de repos ou à la nuit pour ne pas gêner l’usage quotidien.',
        },
        {
          q: 'Le service IA peut-il tourner sur un autre ordinateur ?',
          a: 'Oui. Lancez le service IA sur un Mac ou un ordinateur avec carte graphique NVIDIA, puis choisissez « Service distant » dans « Réglages système → IA » et saisissez son adresse et son jeton d’accès. Le service IA ne reçoit que des aperçus de 1440 pixels et ne touche ni aux originaux ni à la base.',
        },
        {
          q: 'L’IA a-t-elle besoin d’une connexion Internet permanente ?',
          a: 'Non. Une fois les modèles téléchargés, tout peut fonctionner hors ligne. Seuls les cartes en ligne et le géocodage inverse nécessitent Internet, et les deux se désactivent dans les réglages ; les lieux n’affichent alors que des coordonnées.',
        },
        {
          q: 'Comment les visages sont-ils regroupés ?',
          a: 'Le système détecte les visages de chaque photo et calcule pour chacun un vecteur de caractéristiques ; les visages semblables sont automatiquement rattachés à la même personne. Une personne n’apparaît qu’à partir de 3 photos, si bien que les passants occasionnels ne sont pas ajoutés. Donnez un nom et une date de naissance pour revoir son évolution par âge.',
        },
        {
          q: 'Quels types de recherche sont pris en charge ?',
          a: 'La recherche en langage naturel en chinois, par exemple « 宝宝三岁生日的照片 » (photos du troisième anniversaire de bébé) ou « 海边的日落 » (coucher de soleil à la plage) ; vous pouvez aussi chercher le texte présent dans les photos (papiers d’identité, captures d’écran, enseignes) et le lieu de prise de vue. Les trois types de résultats sont fusionnés et classés, et seules les photos clairement pertinentes sont renvoyées.',
        },
      ],
    },
    {
      key: 'usage',
      label: 'Utilisation',
      items: [
        {
          q: 'Comment ouvrir ma photothèque sur un téléphone ?',
          a: 'Sur le même réseau local, ouvrez http://wanmory.local:8080 dans le navigateur du téléphone. iPhone, iPad, Mac et Windows ne demandent aucune configuration du routeur. Certains appareils Android ne gèrent pas les domaines .local ; utilisez alors l’adresse IP.',
        },
        {
          q: 'Quels formats de photo et de vidéo sont pris en charge ?',
          a: 'Les formats photo courants, dont JPEG, PNG, HEIC et RAW (comme DNG), ainsi que les formats vidéo courants. Les imports web reprennent après une coupure réseau ou un rechargement de la page.',
        },
        {
          q: 'Peut-on récupérer des photos supprimées ?',
          a: 'Oui. Les photos supprimées passent d’abord par « Supprimées récemment », d’où elles peuvent être restaurées à tout moment. Pour les dossiers montés en lecture seule, les fichiers d’origine sont conservés même après une suppression définitive dans l’app ; ils ne sont simplement plus affichés.',
        },
        {
          q: 'Comment trier les rafales et les doublons ?',
          a: '« Rafales et similaires » regroupe automatiquement les rafales et les photos quasi identiques et conseille la plus nette à garder ; le reste part en un clic dans « Supprimées récemment ». Les fichiers au contenu strictement identique sont listés à part dans « Doublons ».',
        },
      ],
    },
    {
      key: 'members',
      label: 'Membres et droits',
      items: [
        {
          q: 'Plusieurs personnes peuvent-elles l’utiliser ensemble ?',
          a: 'Oui. Un administrateur crée un compte pour chaque personne, et les imports de chacun se retrouvent dans une même photothèque. Les membres ne peuvent supprimer que leurs propres imports, les administrateurs gèrent tout, et l’historique des connexions enregistre l’heure, l’appareil et la position approximative de chaque connexion.',
        },
        {
          q: 'Les autres membres voient-ils les photos que je masque ?',
          a: 'Non. Les photos masquées ne sont visibles que de vous, et les albums privés que de leur créateur. Les noms et fusions de personnes sont partagés, mais le nombre de photos et les vignettes affichés à chaque membre ne tiennent compte que des photos qu’il a le droit de voir.',
        },
        {
          q: 'Qu’est-ce que l’accès invité ?',
          a: 'Avec l’accès invité activé, les visiteurs non connectés peuvent consulter les photos partagées en lecture seule ; albums privés et photos masquées restent invisibles. Si votre photothèque est accessible depuis Internet, nous recommandons de désactiver l’accès invité dans les réglages.',
        },
      ],
    },
  ],
}

export default faq
