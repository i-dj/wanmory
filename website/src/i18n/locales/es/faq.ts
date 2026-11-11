import type { FaqDict } from '../zh/faq'

// Español · Preguntas frecuentes

const faq: FaqDict = {
  title: 'Preguntas frecuentes',
  lead: 'Las respuestas a las preguntas que más nos hacen. ¿No encuentras la tuya? Abre una incidencia en GitHub o consulta la documentación completa de instalación y uso.',
  readDocs: 'Leer la documentación',
  submit: 'Informar de un problema',
  categories: 'Categorías de preguntas',
  all: 'Todas',
  showAll: 'Ver las {n} preguntas',
  groups: [
    {
      key: 'deploy',
      label: 'Instalación',
      items: [
        {
          q: '¿Qué hardware necesito para Wanmory?',
          a: 'Cualquier dispositivo x86_64 o ARM64 que ejecute Docker: un NAS, un mini PC o una Raspberry Pi 5. Desde 4 GB de memoria, el sistema elige automáticamente los modelos ligeros; con 8 GB o más puedes usar el nivel Equilibrado. Para fototecas grandes o un procesamiento de IA más rápido, el servicio de IA puede ejecutarse en un ordenador con GPU o en un Mac con Apple Silicon.',
        },
        {
          q: '¿Funciona en un NAS Synology o QNAP?',
          a: 'Sí. Wanmory se instala con Docker Compose y funciona en Synology DSM, QNAP QTS, TrueNAS SCALE, Unraid y distribuciones Linux como Ubuntu y Debian. Hay imágenes para amd64 y arm64, y se descarga automáticamente la adecuada.',
        },
        {
          q: '¿Tengo que volver a subir las fotos que ya están en mi NAS?',
          a: 'No. Monta tus carpetas de fotos bajo /photos en docker-compose.yml. Puedes montar varias, y se recomienda hacerlo en solo lectura (:ro). Las carpetas se escanean cada 15 minutos y las fotos nuevas se importan en su sitio, sin copiar ni mover los originales.',
        },
        {
          q: 'La descarga de las imágenes va lenta. ¿Qué hago?',
          a: 'Define WANMORY_REGISTRY en el archivo .env junto a docker-compose.yml con un registro al que puedas acceder y vuelve a ejecutar docker compose up -d.',
        },
        {
          q: '¿Cómo actualizo a una versión nueva?',
          a: 'Ejecuta docker compose pull && docker compose up -d en la carpeta donde está docker-compose.yml. Las migraciones de la base de datos se ejecutan solas al arrancar y tus fotos, personas y álbumes no cambian. En la app web, «Ajustes del sistema → Actualización del sistema» te avisa cuando hay una versión nueva.',
        },
        {
          q: '¿Y si olvido la contraseña de administrador?',
          a: 'En el equipo donde funciona la app, ve a la carpeta donde está docker-compose.yml, ejecuta docker compose exec server wanmory reset-password, elige la cuenta y escribe una contraseña nueva siguiendo las indicaciones. Las contraseñas de los miembros normales las restablece un administrador en «Ajustes del sistema → Miembros».',
        },
      ],
    },
    {
      key: 'ai',
      label: 'IA y privacidad',
      items: [
        {
          q: '¿Se suben mis fotos a la nube?',
          a: 'No. Las fotos, las miniaturas, la base de datos y todos los resultados de la IA se guardan en el dispositivo donde funciona Wanmory. Los modelos de IA solo se descargan la primera vez; después, el reconocimiento facial, la búsqueda semántica y el reconocimiento de texto se hacen en local.',
        },
        {
          q: '¿Puedo usar la IA en un NAS poco potente?',
          a: 'Sí. El servicio de IA integrado solo usa la CPU. La primera pasada sobre una fototeca grande tarda más, y luego las fotos nuevas se procesan según llegan. En «Rendimiento y recursos» puedes limitar el procesamiento a los ratos de reposo o a la noche para no molestar en el uso diario.',
        },
        {
          q: '¿El servicio de IA puede ir en otro ordenador?',
          a: 'Sí. Ejecuta el servicio de IA en un Mac o en un ordenador con tarjeta gráfica NVIDIA, elige «Servicio remoto» en «Ajustes del sistema → IA» e introduce su dirección y token de acceso. El servicio de IA solo recibe vistas previas de 1440 píxeles y nunca toca los originales ni la base de datos.',
        },
        {
          q: '¿La IA necesita conexión a internet todo el tiempo?',
          a: 'No. Una vez descargados los modelos, todo puede funcionar sin conexión. Solo los mapas en línea y la búsqueda inversa de nombres de lugares necesitan internet, y ambos se pueden desactivar en los ajustes; entonces los lugares muestran solo coordenadas.',
        },
        {
          q: '¿Cómo se agrupan las caras?',
          a: 'El sistema detecta las caras de cada foto y calcula un vector de rasgos de cada una; las caras parecidas se asignan automáticamente a la misma persona. Una persona solo aparece cuando sale en al menos 3 fotos, así que los transeúntes ocasionales no se añaden. Ponle nombre y cumpleaños para ver cómo ha crecido según la edad.',
        },
        {
          q: '¿Qué tipos de búsqueda admite?',
          a: 'Búsqueda en lenguaje natural en chino, por ejemplo «宝宝三岁生日的照片» (fotos del tercer cumpleaños del bebé) o «海边的日落» (atardecer en la playa); también puedes buscar el texto que aparece en las fotos (documentos, capturas de pantalla, carteles) y el lugar de la toma. Los tres tipos de resultados se combinan y ordenan, y solo se devuelven las fotos claramente relevantes.',
        },
      ],
    },
    {
      key: 'usage',
      label: 'Uso y funciones',
      items: [
        {
          q: '¿Cómo abro la fototeca en el móvil?',
          a: 'En la misma red local, abre http://wanmory.local:8080 en el navegador del móvil. iPhone, iPad, Mac y Windows no necesitan configurar el router. Algunos dispositivos Android no admiten los dominios .local; en ese caso, usa la dirección IP.',
        },
        {
          q: '¿Qué formatos de foto y vídeo admite?',
          a: 'Los formatos de foto habituales, como JPEG, PNG, HEIC y RAW (por ejemplo, DNG), además de los formatos de vídeo comunes. Las subidas web se reanudan tras un corte de red o al recargar la página.',
        },
        {
          q: '¿Se pueden recuperar las fotos borradas?',
          a: 'Sí. Las fotos borradas pasan primero a «Eliminadas recientemente», desde donde se pueden recuperar cuando quieras. En las carpetas montadas en solo lectura, los archivos originales se conservan aunque los borres definitivamente en la app; simplemente dejan de mostrarse.',
        },
        {
          q: '¿Cómo ordeno las ráfagas y las fotos duplicadas?',
          a: '«Ráfagas y similares» agrupa automáticamente las ráfagas y las fotos casi idénticas y recomienda conservar la más nítida; el resto se mueve con un clic a «Eliminadas recientemente». Los archivos con contenido exactamente igual se listan aparte en «Duplicados».',
        },
      ],
    },
    {
      key: 'members',
      label: 'Miembros y permisos',
      items: [
        {
          q: '¿Pueden usarlo varias personas a la vez?',
          a: 'Sí. Un administrador crea una cuenta para cada persona y las fotos que sube cada una se reúnen en la misma fototeca. Los miembros solo pueden borrar las fotos que subieron, los administradores gestionan todo y el historial de accesos registra la hora, el dispositivo y la ubicación aproximada de cada inicio de sesión.',
        },
        {
          q: '¿Ven otros miembros las fotos que oculto?',
          a: 'No. Las fotos ocultas solo las ves tú, y los álbumes privados solo su creador. Los nombres y las fusiones de personas son comunes, pero el número de fotos y las portadas que ve cada miembro se calculan solo con las fotos que ese miembro puede ver.',
        },
        {
          q: '¿Qué es el acceso de invitados?',
          a: 'Con el acceso de invitados activado, quien no haya iniciado sesión puede ver las fotos compartidas en solo lectura; los álbumes privados y las fotos ocultas siguen sin verse. Si tu fototeca es accesible desde internet, recomendamos desactivar el acceso de invitados en los ajustes.',
        },
      ],
    },
  ],
}

export default faq
