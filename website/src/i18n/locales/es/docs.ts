import type { DocsDict } from '../zh/docs'

// Español · Documentación

const docs: DocsDict = {
  title: 'Documentación',
  onThisPage: 'En esta sección',
  reportIssue: 'Informar de un error en la doc ↗',
  architecture: 'Arquitectura →',
  backToTop: 'Volver arriba ↑',
  sectionLink: 'Enlace a esta sección',
  toc: [
    {
      key: 'install',
      title: 'Instalación',
      groups: [
        {
          group: 'Primeros pasos',
          items: [
            ['intro', 'Introducción'],
            ['requirements', 'Requisitos del sistema'],
            ['quick-start', 'Instalación rápida'],
          ],
        },
        {
          group: 'Script de instalación',
          items: [
            ['install-script', 'Opciones del script'],
            ['install-steps', 'El script paso a paso'],
            ['install-faq', 'Preguntas de instalación'],
          ],
        },
        {
          group: 'Configuración',
          items: [
            ['compose', 'docker-compose.yml explicado'],
            ['env', 'Variables de entorno'],
            ['library', 'Montar carpetas de fotos existentes'],
            ['mdns', 'Dominio local (mDNS)'],
            ['proxy', 'Proxy inverso y acceso desde internet'],
          ],
        },
        {
          group: 'Servicio de IA',
          items: [
            ['ai-overview', 'Modos de ejecución'],
            ['ai-remote', 'Servicio de IA en otro equipo'],
            ['ai-schedule', 'Cuándo trabaja la IA'],
            ['ai-models', 'Niveles de modelos y descarga'],
            ['ai-env', 'Variables del servicio de IA'],
          ],
        },
      ],
    },
    {
      key: 'guide',
      title: 'Guía de uso',
      groups: [
        {
          group: 'Lo básico',
          items: [
            ['first-run', 'Configuración inicial y primer acceso'],
            ['import', 'Subir e importar'],
            ['browse', 'Explorar, buscar y organizar'],
            ['members-usage', 'Miembros y permisos'],
          ],
        },
        {
          group: 'Ajustes del sistema',
          items: [
            ['settings-members', 'Miembros e historial de accesos'],
            ['settings-ai', 'Ajustes de IA'],
            ['settings-perf', 'Rendimiento y recursos'],
            ['settings-general', 'Almacenamiento, invitados, mapas y dominio'],
            ['settings-update', 'Actualización del sistema'],
          ],
        },
      ],
    },
    {
      key: 'maintain',
      title: 'Mantenimiento',
      groups: [
        {
          group: 'Mantenimiento',
          items: [
            ['update', 'Actualizar'],
            ['backup', 'Copia de seguridad y restauración'],
            ['reset-password', 'Restablecer la contraseña de administrador'],
            ['troubleshooting', 'Solución de problemas'],
            ['uninstall', 'Desinstalación'],
          ],
        },
      ],
    },
  ],
  intro:
    'Esta documentación es para administradores que alojan Wanmory en un NAS, un servidor o un ordenador personal. Cubre la instalación, la configuración, el despliegue del servicio de IA, el uso diario, los ajustes del sistema y el mantenimiento. Para el diseño del sistema y los algoritmos, consulta [Arquitectura](/architecture/).',
  blocks: [
    {
      h2: 'intro',
    },
    {
      p: 'Wanmory es una fototeca privada con IA, de código abierto y autoalojada. Se compone de cuatro contenedores: el backend en Go (`server`), el servicio de inferencia de IA en Python (`ml`), la base de datos PostgreSQL + pgvector (`postgres`) y `mdns`, que anuncia el dominio local. Todas las fotos, metadatos, vectores y la cola de tareas se guardan en local, sin depender de ningún servicio en la nube.',
    },
    {
      ul: [
        'Gestión de fotos: cronología agrupada por meses, álbumes y álbumes inteligentes, limpieza de ráfagas y fotos similares, mapa de viajes y presentaciones.',
        'Funciones de IA: detección y agrupación de caras, búsqueda en lenguaje natural (Chinese-CLIP), reconocimiento de texto (PP-OCR) y puntuación estética (selección IA).',
        'Varios miembros: cuentas individuales, permisos de borrado según quién subió cada foto e historial de accesos.',
      ],
    },
    {
      h2: 'requirements',
    },
    {
      table: ['Elemento', 'Mínimo', 'Recomendado'],
      rows: [
        ['Arquitectura de CPU', 'x86_64 (amd64) o ARM64', '—'],
        [
          'Procesador',
          'Clase Intel N100 / Raspberry Pi 5',
          'Clase Intel i5 o superior, o el servicio de IA en otro equipo con GPU',
        ],
        ['Memoria', '4 GB (se elige automáticamente el nivel «Ligero»)', '8 GB o más (nivel «Equilibrado»)'],
        [
          'Disco',
          'Unos 1–4 GB para modelos, más espacio para miniaturas',
          'Un SSD para data/ y el volumen de la base de datos',
        ],
        ['Software', 'Docker Engine y Docker Compose v2', '—'],
        [
          'Sistema operativo',
          'Cualquier distribución Linux que ejecute Docker',
          'Synology DSM, QNAP QTS, TrueNAS SCALE, Unraid, Ubuntu / Debian',
        ],
      ],
    },
    {
      note: 'Las imágenes se publican para `linux/amd64` y `linux/arm64`, y Docker descarga la que corresponde a tu arquitectura. Los contenedores Docker en macOS no pueden usar la GPU de Apple; para aceleración por hardware en un Mac, consulta [Servicio de IA en otro equipo](#ai-remote).',
    },
    {
      h2: 'quick-start',
    },
    {
      h3: 'Opción 1: script de instalación (recomendado)',
    },
    {
      p: 'Ejecútalo en Linux o macOS de 64 bits con Docker instalado (en un NAS Synology, QNAP o similar, entra antes por SSH):',
    },
    {
      code: 'curl -fsSL https://wanmory.com/install.sh | bash',
      lang: 'bash',
    },
    {
      p: 'El script hace una pregunta cada vez; Intro acepta el valor por defecto entre corchetes. En una primera instalación basta con pulsar Intro en todas. Cada opción se explica en [Opciones del script](#install-script) y cada mensaje en [El script paso a paso](#install-steps). Al terminar, abre la dirección que muestra, crea la cuenta de administrador y descarga los modelos en Ajustes → Cómo se ejecuta la IA.',
    },
    {
      note: 'Si quieres ver primero qué hace el script, descárgalo, léelo y ejecútalo: `curl -fsSLO https://wanmory.com/install.sh` y después `bash install.sh`. Con `--dry-run` solo comprueba el sistema y escribe los archivos de configuración, sin descargar imágenes ni arrancar nada.',
    },
    {
      h3: 'Opción 2: instalación manual',
    },
    {
      steps: [
        {
          title: 'Crea una carpeta y descarga el archivo Compose',
          body: [
            {
              p: 'Crea una carpeta para el archivo Compose, los datos y los modelos, y descarga el `docker-compose.yml` oficial:',
            },
            {
              code: `mkdir -p ~/wanmory && cd ~/wanmory
curl -fsSLO https://raw.githubusercontent.com/i-dj/wanmory/main/docker/docker-compose.yml`,
              lang: 'bash',
            },
          ],
        },
        {
          title: '(Opcional) Escribe un .env',
          body: [
            {
              p: 'Crea un `.env` en la misma carpeta para cambiar los valores por defecto. En producción, cambia sí o sí la contraseña de la base de datos:',
            },
            {
              code: `WANMORY_DB_PASSWORD=cambia-esto-por-una-cadena-aleatoria
WANMORY_PORT=8080
WANMORY_TZ=Europe/Madrid
WANMORY_VERSION=latest`,
              lang: '.env',
            },
          ],
        },
        {
          title: 'Arranca los servicios',
          body: [
            {
              p: 'El primer arranque descarga las imágenes y ejecuta automáticamente las migraciones de la base de datos:',
            },
            {
              code: `docker compose up -d
docker compose ps        # comprueba que los cuatro servicios estén running / healthy`,
              lang: 'bash',
            },
          ],
        },
        {
          title: 'Abre y configura',
          body: [
            {
              p: 'Abre `http://wanmory.local:8080` (o `http://<IP del equipo>:8080`) en el navegador, crea la cuenta de administrador según las indicaciones y descarga los modelos en «Ajustes del sistema → IA». Cuando terminen de descargarse, las fotos existentes entran solas en la cola de IA.',
            },
          ],
        },
      ],
    },
    {
      h2: 'install-script',
    },
    {
      p: 'Uso: `curl -fsSL https://wanmory.com/install.sh | bash -s -- [opciones]`, o tras descargarlo, `bash install.sh [opciones]`.',
    },
    {
      h3: 'Opciones de línea de comandos',
    },
    {
      table: ['Opción', 'Qué hace'],
      rows: [
        [
          '`-y`, `--yes`',
          'Sin preguntas: usa todos los valores por defecto (o las variables de entorno de abajo); la contraseña de la base de datos se genera. También ocurre automáticamente si no hay terminal interactiva (por ejemplo, desde otro script).',
        ],
        ['`--dir CARPETA`', 'Carpeta de instalación, por defecto `~/wanmory` (o define `WANMORY_DIR`).'],
        [
          '`--dry-run`',
          'Solo comprueba el sistema, escribe y valida `.env` y `docker-compose.yml`; no descarga ni arranca nada.',
        ],
        ['`-h`, `--help`', 'Muestra la ayuda.'],
      ],
    },
    {
      h3: 'Variables de entorno',
    },
    {
      p: 'Escríbelas delante del comando. En la instalación interactiva pasan a ser la respuesta por defecto de cada pregunta; con `-y` se usan directamente. Todas salvo `WANMORY_DIR` y `WANMORY_PHOTOS` se guardan en `.env`.',
    },
    {
      table: ['Variable', 'Por defecto', 'Qué hace'],
      rows: [
        ['`WANMORY_DIR`', '~/wanmory', 'Carpeta de instalación, igual que `--dir`.'],
        [
          '`WANMORY_PORT`',
          '8080',
          'Puerto web. Si está ocupado, la instalación interactiva pide otro; con `-y` el script se detiene con error.',
        ],
        [
          '`WANMORY_DOMAIN`',
          'wanmory.local',
          'Dominio de la red local. Debe terminar en `.local` y solo admite letras, números y guiones.',
        ],
        ['`WANMORY_DB_PASSWORD`', 'generada', 'Contraseña de la base de datos. Si la defines, no se pregunta.'],
        [
          '`WANMORY_DB_DIR`',
          'vacío (volumen Docker pgdata)',
          'Una carpeta de este equipo para la base de datos; vacío significa el volumen Docker. No uses una carpeta compartida en red.',
        ],
        [
          '`WANMORY_TZ`',
          'zona horaria de este equipo, o Asia/Shanghai si no se detecta',
          'Para fotos cuyo EXIF no tiene zona horaria. Usa el nombre completo, como `Europe/Madrid`; en modo interactivo también puedes buscar por ciudad.',
        ],
        [
          '`WANMORY_DATA_DIR`',
          './data',
          'Carpeta de datos: miniaturas, vistas previas y fotos subidas desde la web. Las rutas relativas parten de la carpeta de instalación.',
        ],
        ['`WANMORY_MODELS_DIR`', './models', 'Carpeta de modelos de IA, necesita 1–4 GB.'],
        [
          '`WANMORY_PHOTOS`',
          'vacío',
          'Carpetas de fotos existentes, separadas por comas, de solo lectura por defecto; añade `:rw` a una ruta para lectura y escritura, p. ej. `/volume1/photo,/mnt/usb:rw`.',
        ],
        [
          '`WANMORY_REGISTRY`',
          'ghcr.io/i-dj',
          'Registro de imágenes. Cámbialo por un espejo accesible si ghcr.io va lento o está bloqueado.',
        ],
        [
          '`WANMORY_VERSION`',
          'latest',
          'Qué versión instalar, p. ej. `0.4.1`. La pantalla de bienvenida muestra la versión que se instala.',
        ],
      ],
    },
    {
      code: `# Ejemplo: sin preguntas, en /opt/wanmory con el puerto 9000 y dos carpetas de fotos del NAS en solo lectura
curl -fsSL https://wanmory.com/install.sh | WANMORY_PORT=9000 WANMORY_PHOTOS=/volume1/photo,/volume2/family bash -s -- -y --dir /opt/wanmory`,
      lang: 'bash',
    },
    {
      h2: 'install-steps',
    },
    {
      p: 'Los mensajes del script están en inglés para que se vean bien en cualquier terminal de NAS. Este es cada paso en el orden en que aparece: ✔ verde es correcto, ! amarillo es un aviso (la instalación sigue) y ✘ rojo es un error que detiene el script.',
    },
    {
      steps: [
        {
          title: 'Pantalla de bienvenida',
          body: [
            {
              p: 'Muestra el logotipo WANMORY y `Installing version v0.4.1`: la versión que se va a instalar, es decir, `WANMORY_VERSION` si está definida o, si no, la última publicada.',
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
                  a: 'Sistema operativo. En macOS avisa de que la IA en contenedores no puede usar la GPU de Apple; para más velocidad, ejecuta el servicio de IA directamente en el Mac (ver [Ejecutar el servicio de IA aparte](#ai-remote)). Otros sistemas se detienen aquí.',
                },
                {
                  q: '`CPU: x86_64 (linux/amd64 images)`',
                  a: 'Arquitectura de CPU. Solo amd64 y arm64 de 64 bits; un sistema de 32 bits (incluido Raspberry Pi OS antiguo con núcleo de 64 bits y espacio de usuario de 32) se detiene: instala un sistema de 64 bits.',
                },
                {
                  q: '`Docker 27.x`',
                  a: 'Docker funciona. Si falta, muestra un enlace de instalación (Synology / QNAP: Container Manager / Container Station desde el centro de paquetes). Con `Permission denied`, ejecuta con sudo o añade tu usuario al grupo docker y vuelve a iniciar sesión.',
                },
                {
                  q: '`Docker Compose v2.x`',
                  a: 'Docker Compose funciona. Si solo está el antiguo docker-compose v1, recomienda actualizar pero continúa.',
                },
                {
                  q: '`Memory: 8 GB`',
                  a: 'Memoria. Con menos de 4 GB dice `AI will use the lite model tier`: la IA usa el nivel ligero automáticamente; con menos de 2 GB avisa de que el reconocimiento puede no funcionar.',
                },
              ],
            },
          ],
        },
        {
          title: 'Configuration',
          body: [
            {
              p: 'Una pregunta cada vez; Intro acepta el valor por defecto entre corchetes.',
            },
            {
              qa: [
                {
                  q: '`Install directory`',
                  a: 'Dónde van `.env`, `docker-compose.yml` y, por defecto, data y models. Luego muestra el espacio libre del disco; con menos de 10 GB avisa.',
                },
                {
                  q: '`Keep the existing configuration`',
                  a: 'Solo aparece si ya hay un `.env` (instalación anterior). Intro (Y) mantiene puerto, dominio, contraseña de la base de datos, etc. y se salta las preguntas siguientes; ideal para reinstalar y actualizar. n para volver a rellenarlo todo. No cambies a la ligera la contraseña una vez creada la base de datos.',
                },
                {
                  q: '`Web port`',
                  a: 'Puerto web, 8080 por defecto. Si está ocupado, se pide otro.',
                },
                {
                  q: '`LAN domain (must end in .local)`',
                  a: 'Nombre para abrir la fototeca en la red local, wanmory.local por defecto; también vale photos.local. Se puede cambiar después en los ajustes web.',
                },
                {
                  q: '`Generate a random database password`',
                  a: 'Intro genera una contraseña aleatoria y la guarda en `.env`; no hace falta recordarla. n para escribir una dos veces (mínimo 8 caracteres; sin espacios, comillas ni `$ \\ @ : / # ?`).',
                },
                {
                  q: '`Database location`',
                  a: 'Dónde va la base de datos. Deja vacío y pulsa Intro para el volumen Docker pgdata (recomendado), o indica una carpeta local como `/volume1/wanmory/db`. Avisa de no usar una carpeta compartida SMB / NFS, que puede dañar la base de datos.',
                },
                {
                  q: '`Time zone`',
                  a: 'Sirve para fechar fotos cuyo EXIF no tiene zona horaria. Escribe una ciudad o un país, p. ej. madrid, mexico_city, buenos_aires; si coinciden varias, elige por número.',
                },
                {
                  q: '`Data directory`',
                  a: 'Carpeta de datos, ./data por defecto. Aquí se guardan miniaturas, vistas previas y fotos subidas; deja espacio suficiente.',
                },
                {
                  q: '`AI model directory (1-4 GB)`',
                  a: 'Carpeta de modelos de IA, ./models por defecto.',
                },
                {
                  q: '`Add existing photo folders from a NAS or external drive`',
                  a: 'Si quieres añadir carpetas de fotos que ya tienes (sin volver a subirlas). Responde Y e introduce una ruta; si no existe, se pide confirmación.',
                },
                {
                  q: '`Mount read-only`',
                  a: 'Intro la monta en solo lectura: Wanmory nunca modifica ni borra los originales (recomendado). n para lectura y escritura: eliminar definitivamente una foto en Wanmory borra también el archivo original.',
                },
                {
                  q: '`Add another photo folder`',
                  a: 'Añade la siguiente carpeta; Intro (N) termina.',
                },
              ],
            },
          ],
        },
        {
          title: 'Writing configuration',
          body: [
            {
              p: 'Escribe `.env` (permisos 600, solo tú puedes leerlo); con carpetas de fotos, también `docker-compose.override.yml` (Docker Compose lo combina automáticamente); descarga `docker-compose.yml` de GitHub o, si falla, de Gitee. `Configuration is valid` significa que la comprobación pasó. Con `--dry-run`, el script termina aquí.',
            },
          ],
        },
        {
          title: 'Existing database found',
          body: [
            {
              p: 'Solo aparece si no mantuviste la configuración anterior pero sigue habiendo una base de datos previa (por ejemplo, la conservaste al desinstalar). Intro (Y) la conserva: fotos, álbumes, personas y cuentas siguen ahí, y el script cambia su contraseña por la nueva de `.env`. n borra la base de datos anterior y empieza de cero; si está en una carpeta local, el script no la borra por ti: vacía esa carpeta y vuelve a ejecutar el script.',
            },
          ],
        },
        {
          title: 'Pulling images and starting',
          body: [
            {
              p: 'Descarga las imágenes (unos minutos la primera vez). Arranca primero la base de datos y la espera (`Waiting for the database...`), ajusta su contraseña a la de `.env` (`Database ready`) y después arranca el resto.',
            },
          ],
        },
        {
          title: 'Waiting for Wanmory to start',
          body: [
            {
              p: 'Espera hasta 5 minutos; los equipos lentos como una Raspberry Pi tardan más la primera vez. Si Wanmory se reinicia una y otra vez, muestra las 15 últimas líneas del registro y se detiene; si se acaba el tiempo sin respuesta, te sugiere comprobarlo más tarde y te da el comando para ver los registros.',
            },
          ],
        },
        {
          title: 'Installation complete',
          body: [
            {
              p: 'Muestra la `LAN address` (dominio), la `IP address` y la carpeta de instalación. `Next` indica el siguiente paso: abrir la página, crear la cuenta de administrador y descargar los modelos en Ajustes → Cómo se ejecuta la IA. Algunos Android no resuelven nombres .local; usa la dirección IP.',
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
          q: 'Tras reinstalar, Wanmory no conecta con la base de datos (falla la autenticación)',
          a: 'La base de datos solo usa la contraseña de `.env` al crearse; cambiar `.env` después no la cambia. El script actual ajusta la contraseña de la base de datos a `.env` en cada arranque, así que basta con volver a ejecutarlo. En una instalación manual, ejecuta en la carpeta de instalación `docker compose exec postgres psql -U wanmory -c "ALTER USER wanmory WITH PASSWORD \'nueva-contraseña\';"` y luego `docker compose up -d`.',
        },
        {
          q: 'De quién son los archivos de la carpeta de datos / no se pueden borrar en el anfitrión',
          a: 'El contenedor de Wanmory se ejecuta como el propietario de la carpeta de datos: si la creó un usuario normal (como hace el script), las subidas y miniaturas son suyas y se gestionan sin sudo; si pertenece a root o es un volumen Docker, se ejecuta como uid 1000. En sistemas de archivos que no permiten cambiar propietario (USB exFAT / NTFS, carpetas SMB) se ejecuta como root. Los archivos con propietario incorrecto que dejaron versiones antiguas se corrigen al arrancar.',
        },
        {
          q: 'Raspberry Pi',
          a: 'Hace falta un sistema de 64 bits (Raspberry Pi OS 64-bit); en 32 bits el script se detiene. Con 4 GB de memoria se usa el nivel ligero automáticamente; el primer arranque y el primer procesado de fotos son lentos, mejor tener datos y base de datos en un SSD.',
        },
        {
          q: 'Puerto ocupado',
          a: 'Elige otro puerto o ejecuta el script con `WANMORY_PORT=9000`.',
        },
        {
          q: 'Descargar imágenes va lento o falla',
          a: 'Define `WANMORY_REGISTRY` con un espejo accesible y vuelve a ejecutarlo.',
        },
      ],
    },
    {
      h2: 'compose',
    },
    {
      p: 'El archivo Compose oficial define cuatro servicios: la base de datos `postgres`, el backend `server`, el anunciador del dominio local `mdns` y el servicio de IA integrado `ml`. Para qué sirve cada ajuste está anotado en el propio archivo:',
    },
    {
      lang: 'yaml',
      code: `# Archivo Compose oficial de Wanmory: ejecuta docker compose up -d en la carpeta de este archivo
# Las variables con forma \${VAR:-defecto} se leen del .env de la misma carpeta; si no existen, se usa el valor por defecto

services:
  # ── Base de datos: PostgreSQL 17 + pgvector ──────────────────────
  # Guarda metadatos de fotos, personas, álbumes, ajustes, la cola de tareas y los vectores (índice HNSW)
  # No publica puertos; solo accesible en la red interna de Compose
  postgres:
    image: pgvector/pgvector:pg17
    environment:
      POSTGRES_USER: wanmory
      POSTGRES_PASSWORD: \${WANMORY_DB_PASSWORD:-wanmory}   # cámbiala en .env sí o sí en producción
      POSTGRES_DB: wanmory
    volumes:
      - \${WANMORY_DB_DIR:-pgdata}:/var/lib/postgresql/data  # volumen con nombre pgdata por defecto; con WANMORY_DB_DIR, esa carpeta. Inclúyela en las copias de seguridad
    healthcheck:                             # server espera a esta comprobación y arranca cuando la base de datos está lista
      test: ["CMD", "pg_isready", "-U", "wanmory", "-d", "wanmory"]
      interval: 5s
      timeout: 3s
      retries: 20
    restart: unless-stopped

  # ── Backend: binario Go con la app web incrustada ────────────────
  # Se encarga de la API, subidas (tus), planificación de tareas, miniaturas y permisos; migra la base de datos al arrancar
  server:
    image: \${WANMORY_REGISTRY:-ghcr.io/i-dj}/wanmory-server:\${WANMORY_VERSION:-latest}
    environment:
      DATABASE_URL: postgres://wanmory:\${WANMORY_DB_PASSWORD:-wanmory}@postgres:5432/wanmory
      WANMORY_ML_URL: http://ml:3003         # dirección del servicio de IA integrado; uno remoto se configura en «Ajustes de IA»
      TZ: \${WANMORY_TZ:-Asia/Shanghai}       # zona horaria si el EXIF no la indica
      WANMORY_MDNS: "off"                    # este contenedor no recibe multidifusión en la red bridge; el servicio mdns de abajo anuncia el dominio
      WANMORY_HTTP_PUBLIC_PORT: \${WANMORY_PORT:-8080}   # puerto que muestra la app web; debe coincidir con el mapeo de puertos
      WANMORY_DOMAIN: \${WANMORY_DOMAIN:-wanmory.local}  # dominio local inicial; si se cambia en los ajustes web, manda el ajuste
    ports:
      - "\${WANMORY_PORT:-8080}:8080"         # puerto del equipo:puerto del contenedor
    volumes:
      - \${WANMORY_DATA_DIR:-./data}:/data    # upload/ guarda los originales subidos, thumbs/ las miniaturas y vistas de 1440 px
      # Monta las carpetas de fotos existentes como subcarpetas de /photos, tantas como quieras; :ro = solo lectura; se escanean cada 15 minutos
      # - /mnt/nas/photos:/photos/nas:ro
      # - /media/usb/camara:/photos/usb:ro
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  # ── Anuncio del dominio local (mDNS) ─────────────────────────────
  # Misma imagen que server, solo ejecuta el subcomando mdns; anuncia wanmory.local (se puede cambiar en la app web)
  mdns:
    image: \${WANMORY_REGISTRY:-ghcr.io/i-dj}/wanmory-server:\${WANMORY_VERSION:-latest}
    command: ["mdns"]
    network_mode: host                       # hace falta la red del equipo para enviar y recibir multidifusión local
    environment:
      WANMORY_URL: http://127.0.0.1:\${WANMORY_PORT:-8080}   # pregunta periódicamente a server el dominio actual
      WANMORY_DOMAIN: \${WANMORY_DOMAIN:-wanmory.local}  # se anuncia mientras server no responda
    depends_on:
      - server
    restart: unless-stopped

  # ── Servicio de IA integrado: FastAPI + ONNX Runtime, solo CPU ───
  # Sin estado; recibe las vistas previas de server y devuelve caras, vectores y texto; no publica puertos
  ml:
    image: \${WANMORY_REGISTRY:-ghcr.io/i-dj}/wanmory-ml:\${WANMORY_VERSION:-latest}
    volumes:
      - \${WANMORY_MODELS_DIR:-./models}:/models  # conserva los modelos: recrear el contenedor no los vuelve a descargar
    environment:
      WANMORY_MODEL_DIR: /models
      WANMORY_AUTO_DOWNLOAD: "0"             # sin descarga automática; un administrador confirma licencias y espacio en la app web
    restart: unless-stopped

volumes:
  pgdata:`,
    },
    {
      h2: 'env',
    },
    {
      h3: '.env (variables de Compose)',
    },
    {
      p: 'Estas variables se usan en `docker-compose.yml`; ponlas en el `.env` de la misma carpeta para aplicarlas:',
    },
    {
      table: ['Variable', 'Por defecto', 'Descripción'],
      rows: [
        [
          '`WANMORY_DB_PASSWORD`',
          'wanmory',
          'Contraseña de PostgreSQL, que también usa la DATABASE_URL de server. Cambiarla tras el primer arranque obliga a cambiar también la contraseña del usuario dentro de la base de datos.',
        ],
        [
          '`WANMORY_PORT`',
          '8080',
          'Puerto publicado en el equipo, usado también para la dirección que muestra la app web.',
        ],
        ['`WANMORY_TZ`', 'Asia/Shanghai', 'Zona horaria cuando los datos EXIF no la incluyen.'],
        [
          '`WANMORY_VERSION`',
          'latest',
          'Etiqueta de la imagen; fija una versión concreta para decidir cuándo actualizar.',
        ],
        [
          '`WANMORY_REGISTRY`',
          'ghcr.io/i-dj',
          'Registro de imágenes. Sustitúyelo por uno accesible si ghcr.io no lo es.',
        ],
        [
          '`WANMORY_DATA_DIR`',
          './data',
          'Carpeta de datos: originales subidos (upload/) y miniaturas y vistas previas (thumbs/), montada en /data del contenedor.',
        ],
        ['`WANMORY_MODELS_DIR`', './models', 'Carpeta de modelos de IA, montada en /models del contenedor ml.'],
        [
          '`WANMORY_DB_DIR`',
          'volumen pgdata',
          'Carpeta de la base de datos. Si no se define, se usa el volumen Docker pgdata; con la ruta de una carpeta en un disco local, la base se guarda allí directamente. No uses una carpeta compartida en red.',
        ],
        [
          '`WANMORY_DOMAIN`',
          'wanmory.local',
          'Dominio local inicial; debe terminar en .local. Si se cambia en «Ajustes del sistema → Dominio de acceso» de la app web, manda el ajuste.',
        ],
      ],
    },
    {
      h3: 'Contenedor server (opcional)',
    },
    {
      p: '`DATABASE_URL`, `WANMORY_ML_URL`, `WANMORY_MDNS` y `WANMORY_HTTP_PUBLIC_PORT` ya están en el archivo Compose con su finalidad anotada. Las siguientes variables no están en el archivo por defecto; añádelas al `environment` de `server` si las necesitas:',
    },
    {
      table: ['Variable', 'Por defecto', 'Descripción'],
      rows: [
        [
          '`WANMORY_WORKERS`',
          'automático',
          'Concurrencia por defecto de las tareas de metadatos y miniaturas. Sin valor, se calcula según núcleos y memoria; se puede ajustar en «Rendimiento» de la app web.',
        ],
        [
          '`WANMORY_ML_TOKEN`',
          'vacío',
          'Token de acceso del servicio de IA integrado; debe coincidir con la variable del mismo nombre en el contenedor ml. Normalmente no hace falta.',
        ],
        ['`WANMORY_FACE_MODEL`', 'antelopev2', 'Modelo de caras usado si no se ha elegido nivel.'],
        [
          '`WANMORY_CLIP_MODEL`',
          'chinese-clip-vit-h-14',
          'Modelo de búsqueda semántica usado si no se ha elegido nivel.',
        ],
        [
          '`WANMORY_STORAGE_ROOTS`',
          'carpeta de datos',
          'Carpetas que se pueden explorar y elegir desde la app web, separadas por dos puntos.',
        ],
      ],
    },
    {
      h2: 'library',
    },
    {
      p: 'Las fotos que ya están en un NAS o un disco externo no hace falta subirlas. Monta la carpeta como subcarpeta de `/photos` dentro del contenedor: se escanea cada 15 minutos y los archivos nuevos se **importan en su sitio** (sin copiarlos ni moverlos); después pasan por la lectura de metadatos, las miniaturas y la IA igual que las fotos subidas.',
    },
    {
      lang: 'yaml',
      code: `  server:
    volumes:
      - ./data:/data
      - /mnt/nas/photos:/photos/nas:ro       # :ro monta en solo lectura
      - /media/usb/camara:/photos/usb:ro
      - /home/yo/Imagenes:/photos/pictures    # montaje de lectura y escritura`,
    },
    {
      p: 'Tras el cambio, ejecuta `docker compose up -d`. El primer escaneo empieza unos 20 segundos después de reiniciarse el contenedor.',
    },
    {
      ul: [
        '**Se recomienda montar en solo lectura (:ro)**: el sistema no escribe nada en esas carpetas. Borrar una foto en la app solo la mueve a «Eliminadas recientemente», el borrado definitivo nunca elimina el archivo original y los escaneos posteriores no lo vuelven a importar. En carpetas de lectura y escritura, el borrado definitivo también elimina el archivo original.',
        'Los archivos con contenido idéntico solo se importan una vez (se comparan por suma SHA-1), incluidos los ya subidos y los duplicados entre carpetas.',
        'Las carpetas ocultas y las de sistema del NAS (.xxx, @eaDir, #recycle, etc.) se omiten automáticamente.',
        'Las fotos importadas desde carpetas no pertenecen a ningún miembro; solo los administradores pueden borrarlas.',
      ],
    },
    {
      h2: 'mdns',
    },
    {
      p: 'El servicio `mdns` funciona en modo de red del equipo y anuncia el dominio de acceso en tu red local (por defecto `wanmory.local`). macOS, iOS, iPadOS y Windows 10 o posterior acceden en `http://wanmory.local:8080` sin configurar el router. El dominio se cambia en «Ajustes del sistema → Dominio de acceso» y debe terminar en `.local`.',
    },
    {
      note: 'Algunos dispositivos Android no resuelven nombres mDNS; usa la dirección IP. Si el puerto 5353 ya está ocupado (por ejemplo, en Synology), el servicio mdns puede no arrancar; en ese caso usa también la IP. Lo demás no se ve afectado.',
      warn: true,
    },
    {
      h2: 'proxy',
    },
    {
      p: 'Las subidas web usan el protocolo reanudable [tus](https://tus.io) (`/api/uploads/`) con fragmentos de 16 MB. Detrás de un proxy inverso, quita el límite de tamaño de las peticiones y desactiva el búfer de peticiones. Ejemplo con Nginx:',
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
    client_max_body_size 0;          # sin límite de tamaño (como mínimo 20m)
    proxy_request_buffering off;     # transmitir en flujo sin guardar en el disco del proxy
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
}`,
    },
    {
      note: 'Antes de exponerlo a internet: usa HTTPS, desactiva el acceso de invitados en los ajustes del sistema y pon contraseñas seguras a todos los miembros. El plan gratuito de Cloudflare limita cada petición a 100 MB, así que los fragmentos de 16 MB no requieren nada más.',
      warn: true,
    },
    {
      h2: 'ai-overview',
    },
    {
      p: 'El servicio de IA es un servicio HTTP sin estado: recibe vistas previas de 1440 píxeles del backend y devuelve caras, vectores y texto reconocido. Nunca accede a la base de datos ni guarda archivos. El backend admite dos modos, que se cambian en «Ajustes del sistema → IA → Modo de ejecución de IA»:',
    },
    {
      table: ['Modo', 'Dónde se ejecuta', 'Adecuado para'],
      rows: [
        [
          'Integrado (solo CPU)',
          'El contenedor ml de Compose, solo accesible en la red interna',
          'Listo para usar; un NAS o mini PC con una fototeca moderada, o si se acepta un primer procesamiento más largo',
        ],
        [
          'Servicio remoto',
          'Otro equipo de tu red local que ejecuta directamente el servicio Python',
          'Un Mac con Apple Silicon (CoreML / MPS) o un equipo con GPU NVIDIA (CUDA), que acorta mucho el primer procesamiento',
        ],
      ],
    },
    {
      p: 'Si el servicio de IA no está disponible, las tareas de IA se quedan en la cola y dejan de tomarse, sin gastar reintentos; el procesamiento sigue solo cuando el servicio vuelve. Explorar, subir y lo demás no se ve afectado.',
    },
    {
      h2: 'ai-remote',
    },
    {
      p: 'El contenedor de IA integrado solo usa la CPU. Si tienes un ordenador más rápido (un Mac con chip de Apple o un PC Windows / Linux con GPU NVIDIA), puedes ejecutar allí directamente el servicio de IA (el programa en Python de la carpeta `ml/` del repositorio) y Wanmory le envía las fotos. Python y las dependencias los gestiona [uv](https://docs.astral.sh/uv/), así que no necesitas instalar Python.',
    },
    {
      table: ['Ordenador', 'Aceleración disponible'],
      rows: [
        ['Mac con chip de Apple', 'CoreML para el reconocimiento facial, MPS (PyTorch) para la búsqueda inteligente.'],
        ['Linux + GPU NVIDIA', 'CUDA para la búsqueda inteligente (PyTorch en media precisión, unos 1,9 GB de VRAM).'],
        [
          'Windows + GPU NVIDIA',
          'CUDA para la búsqueda inteligente tras instalar PyTorch con CUDA (paso 3 de Windows, abajo); caras y texto en la CPU.',
        ],
        [
          'Sin GPU',
          'Sin PyTorch, todo con ONNX en la CPU; merece la pena en un ordenador mucho más rápido que el NAS.',
        ],
      ],
    },
    {
      h3: 'macOS',
    },
    {
      steps: [
        {
          title: 'Instalar uv',
          body: [
            {
              code: `curl -LsSf https://astral.sh/uv/install.sh | sh   # o: brew install uv
# después abre una terminal nueva`,
              lang: 'bash',
            },
          ],
        },
        {
          title: 'Obtener el código',
          body: [
            {
              code: `git clone https://github.com/i-dj/wanmory.git   # espejo en China: https://gitee.com/i-dj/wanmory.git
cd wanmory/ml`,
              lang: 'bash',
            },
            {
              p: 'Si falta git, macOS ofrece instalar las herramientas de línea de comandos de Xcode; acepta y sigue las indicaciones.',
            },
          ],
        },
        {
          title: 'Instalar dependencias',
          body: [
            {
              code: 'uv sync --extra torch   # la primera vez descarga Python y PyTorch, unos minutos',
              lang: 'bash',
            },
          ],
        },
        {
          title: 'Crear un token de acceso y arrancar',
          body: [
            {
              code: `export WANMORY_ML_TOKEN=$(openssl rand -hex 24)
echo $WANMORY_ML_TOKEN   # apúntalo, Wanmory lo necesita
WANMORY_FACE_MODEL_PRELOAD=1 uv run --extra torch python -m wanmory_ml`,
              lang: 'bash',
            },
            {
              p: 'Está listo cuando aparece `Uvicorn running on http://0.0.0.0:3003`. El primer arranque descarga el modelo facial (unos 340 MB). Si macOS pregunta si python puede aceptar conexiones entrantes, permítelo.',
            },
          ],
        },
        {
          title: 'Permitir que otros ordenadores se conecten',
          body: [
            {
              p: 'Si el cortafuegos está activo (Ajustes del Sistema → Red → Firewall), comprueba que python puede recibir conexiones entrantes. `ipconfig getifaddr en0` muestra la IP del Mac.',
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
          title: 'Instalar uv',
          body: [
            {
              p: 'Abre PowerShell y ejecuta:',
            },
            {
              code: `powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
# o: winget install --id=astral-sh.uv -e
# después abre una ventana nueva de PowerShell`,
              lang: 'powershell',
            },
          ],
        },
        {
          title: 'Obtener el código',
          body: [
            {
              code: `git clone https://github.com/i-dj/wanmory.git   # ¿sin Git? winget install Git.Git
cd wanmory\\ml`,
              lang: 'powershell',
            },
            {
              p: 'Sin Git también puedes pulsar Code → Download ZIP en GitHub, descomprimir y entrar en la carpeta ml.',
            },
          ],
        },
        {
          title: 'Instalar dependencias',
          body: [
            {
              code: `uv sync --extra torch
# Con GPU NVIDIA, cambia a PyTorch con CUDA (el PyTorch de PyPI en Windows solo usa CPU)
uv pip install --reinstall torch --index-url https://download.pytorch.org/whl/cu126`,
              lang: 'powershell',
            },
            {
              p: 'Tras cambiar a la versión con CUDA, arranca con `uv run --no-sync`; si no, uv vuelve a instalar la versión de CPU. Sin GPU, ejecuta solo `uv sync` (sin PyTorch, mucho más ligero) y quita `--extra torch` al arrancar.',
            },
          ],
        },
        {
          title: 'Crear un token de acceso y arrancar',
          body: [
            {
              code: `$env:WANMORY_ML_TOKEN = [guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N")
echo $env:WANMORY_ML_TOKEN   # apúntalo, Wanmory lo necesita
$env:WANMORY_FACE_MODEL_PRELOAD = "1"
uv run --extra torch python -m wanmory_ml
# con PyTorch con CUDA, usa en su lugar: uv run --no-sync python -m wanmory_ml`,
              lang: 'powershell',
            },
          ],
        },
        {
          title: 'Abrir el puerto en el cortafuegos',
          body: [
            {
              p: 'En el primer arranque, el Firewall de Windows pide permiso: marca Redes privadas y permite. O, en PowerShell como administrador:',
            },
            {
              code: 'New-NetFirewallRule -DisplayName "Wanmory AI" -Direction Inbound -Protocol TCP -LocalPort 3003 -Action Allow',
              lang: 'powershell',
            },
            {
              p: '`ipconfig` muestra la dirección IPv4 del PC.',
            },
          ],
        },
        {
          title: 'Arranque automático (opcional)',
          body: [
            {
              p: 'Crea `start-ai.cmd` en la carpeta ml:',
            },
            {
              code: `@echo off
cd /d %~dp0
set WANMORY_ML_TOKEN=tu-token
uv run --extra torch python -m wanmory_ml`,
              lang: 'cmd',
            },
            {
              p: 'Pulsa Win+R, escribe `shell:startup` y pon un acceso directo a este archivo en la carpeta que se abre; arrancará al iniciar sesión en Windows. Para que funcione sin iniciar sesión, crea una tarea en el Programador de tareas con el desencadenador «Al iniciar el sistema» y este start-ai.cmd como acción.',
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
uv sync --extra torch        # en Linux el PyTorch de PyPI incluye CUDA; sin GPU basta con uv sync
export WANMORY_ML_TOKEN=$(openssl rand -hex 24)
WANMORY_FACE_MODEL_PRELOAD=1 uv run --extra torch python -m wanmory_ml
sudo ufw allow 3003/tcp      # si usas el cortafuegos ufw`,
      lang: 'bash',
    },
    {
      p: 'Para arrancarlo al encender, escribe un servicio systemd: el comando uv run de arriba en `ExecStart` (con la ruta completa `~/.local/bin/uv`), la carpeta ml en `WorkingDirectory` y el token en `Environment=`.',
    },
    {
      h3: 'Variables de entorno habituales',
    },
    {
      table: ['Variable', 'Por defecto', 'Qué hace'],
      rows: [
        [
          '`WANMORY_ML_HOST`',
          '0.0.0.0',
          'Dirección de escucha; 0.0.0.0 permite que se conecten otros equipos de la red.',
        ],
        ['`WANMORY_ML_PORT`', '3003', 'Puerto de escucha.'],
        [
          '`WANMORY_ML_TOKEN`',
          'vacío',
          'Token de acceso. Si está definido, toda petición salvo la comprobación de estado debe enviar `Authorization: Bearer <token>`; introduce el mismo valor en Wanmory.',
        ],
        [
          '`WANMORY_MODEL_DIR`',
          '~/.cache/wanmory/models',
          'Dónde se guardan los modelos (en Windows, .cache\\wanmory\\models en tu carpeta de usuario).',
        ],
      ],
    },
    {
      p: 'El resto, en [Variables de entorno del servicio de IA](#ai-env).',
    },
    {
      h3: 'Conectarlo en Wanmory',
    },
    {
      steps: [
        {
          title: 'Elegir el servicio remoto',
          body: [
            {
              p: 'Como administrador, abre Ajustes y elige Servicio remoto en la tarjeta Cómo se ejecuta la IA.',
            },
          ],
        },
        {
          title: 'Introducir URL y token',
          body: [
            {
              p: 'En URL del servicio, la dirección del ordenador que ejecuta el servicio de IA, p. ej. `http://192.168.1.20:3003`; en Token de acceso, el token que creaste. Pulsa Probar conexión; si pasa, muestra la latencia y la versión. Luego guarda.',
            },
          ],
        },
        {
          title: 'Descargar modelos',
          body: [
            {
              p: 'Al conectar, si el nivel es Automático se vuelve a recomendar según el hardware de ese ordenador; descarga los modelos que necesites en Nivel de modelo y la IA empieza a procesar las fotos.',
            },
          ],
        },
      ],
    },
    {
      note: 'Usa el servicio de IA remoto solo en tu red local o por VPN (como Tailscale), define siempre un token y nunca expongas el puerto 3003 directamente a Internet. Si el ordenador que lo ejecuta se apaga o suspende, el procesado se pausa y continúa solo al volver.',
      warn: true,
    },
    {
      h2: 'ai-schedule',
    },
    {
      p: 'Tras importar fotos, la lectura de datos y las miniaturas se hacen enseguida; cuándo se ejecuta el reconocimiento de IA (caras, búsqueda inteligente, texto) se configura en Ajustes → Procesamiento en segundo plano, y los cambios se aplican al momento. Arriba de la tarjeta se indica si la IA puede ejecutarse ahora y, si no, por qué.',
    },
    {
      table: ['Ajuste', 'Opción', 'Qué hace'],
      rows: [
        [
          'Cuándo procesar',
          'En reposo (por defecto)',
          'Pausa la IA mientras se suben fotos o se crean miniaturas, y sigue cuando hay calma.',
        ],
        [
          '',
          'En cualquier momento',
          'Procesa sin esperar a las subidas; estas pueden ir más lentas. La espera tras subir no se aplica.',
        ],
        [
          '',
          'De noche',
          'Solo procesa en el horario que fijes (1:00–7:00 por defecto; puede pasar de medianoche, p. ej. de 23:00 a 7:00) y también evita las subidas en ese horario.',
        ],
        [
          'Espera tras subir',
          '30 s (por defecto), 5 / 15 / 30 min, 1 / 2 / 4 h',
          'Al terminar de subir fotos, la IA espera este tiempo antes de empezar, para no meterse entre tandas. Se aplica a En reposo y De noche. Para dejarlo hasta mañana, elige De noche.',
        ],
      ],
    },
    {
      ul: [
        'Si los modelos del nivel actual no están descargados, la IA está en pausa sea cual sea el momento elegido; empieza sola cuando los descargas en Nivel de modelo.',
        'Mientras haya una subida sin terminar (incluidas las que pueden reanudarse tras un corte), la IA espera.',
        'Durante la pausa, las tareas siguen en la cola: no se pierde nada ni cuenta como fallo.',
      ],
    },
    {
      h2: 'ai-models',
    },
    {
      p: 'El nivel decide qué modelos se usan para las caras y la búsqueda semántica. Con «Automático», el sistema recomienda un nivel según el hardware del equipo donde está el servicio de IA: «Alta precisión» si hay una GPU utilizable; solo con CPU, «Ligero» por debajo de 6 GB de memoria y «Equilibrado» en otro caso.',
    },
    {
      table: ['Nivel', 'Detección + rasgos faciales', 'Búsqueda semántica', 'Hardware adecuado'],
      rows: [
        [
          'Alta precisión (quality)',
          'antelopev2 (SCRFD-10G + ArcFace R100)',
          'Chinese-CLIP ViT-H/14 (1024-d)',
          'Mac con Apple Silicon, GPU NVIDIA',
        ],
        ['Equilibrado (balanced)', 'antelopev2', 'Chinese-CLIP ViT-L/14 (768-d)', 'NAS de clase Intel i5'],
        ['Ligero (lite)', 'buffalo_l (ArcFace R50)', 'Chinese-CLIP ViT-B/16 (512-d)', 'N100, Raspberry Pi 5'],
      ],
    },
    {
      ul: [
        'El reconocimiento de texto usa PP-OCRv6 (RapidOCR); sus modelos se instalan con las dependencias y no hay que descargarlos aparte.',
        'Tras cambiar de nivel, se vuelven a detectar las caras y a calcular los vectores semánticos de todas las fotos con los nuevos modelos; mientras tanto, la búsqueda sigue usando los vectores antiguos y las personas con nombre se conservan.',
        'Los modelos se descargan en la carpeta montada ./models, y puedes borrar los que ya no uses para liberar espacio (el que está en uso no se puede borrar).',
        'Los modelos faciales de InsightFace son solo para uso no comercial; sustitúyelos u obtén una licencia antes de cualquier uso comercial.',
      ],
    },
    {
      h2: 'ai-env',
    },
    {
      table: ['Variable', 'Por defecto', 'Descripción'],
      rows: [
        ['`WANMORY_ML_HOST`', '0.0.0.0', 'Dirección de escucha.'],
        ['`WANMORY_ML_PORT`', '3003', 'Puerto de escucha.'],
        [
          '`WANMORY_ML_TOKEN`',
          'vacío',
          'Token de acceso; si se define, cada petición debe incluir Authorization: Bearer.',
        ],
        ['`WANMORY_MODEL_DIR`', '~/.cache/wanmory/models', 'Carpeta de modelos; /models dentro de la imagen.'],
        [
          '`WANMORY_AUTO_DOWNLOAD`',
          '0 en la imagen',
          'Si se descargan los modelos automáticamente al usarlos por primera vez.',
        ],
        [
          '`WANMORY_FACE_MODEL_PRELOAD`',
          '—',
          'Con 1, carga los modelos de caras al arrancar; Chinese-CLIP se carga en segundo plano.',
        ],
        [
          '`WANMORY_UNLOAD_AFTER`',
          '5 / 30 minutos',
          'Segundos de inactividad antes de descargar un modelo para liberar memoria; 0 nunca lo descarga. El valor por defecto depende de la memoria del equipo.',
        ],
      ],
    },
    {
      h2: 'first-run',
    },
    {
      steps: [
        {
          title: 'Crea el administrador',
          body: [
            {
              p: 'En la primera visita, el sistema ve que no hay ninguna cuenta y te guía para crear un administrador. Los administradores pueden añadir miembros y cambiar los ajustes del sistema.',
            },
          ],
        },
        {
          title: 'Descarga los modelos',
          body: [
            {
              p: 'Ve a «Ajustes del sistema → IA», confirma el nivel de modelos y descárgalos. Las tareas de IA esperan en la cola hasta que estén listos.',
            },
          ],
        },
        {
          title: 'Importa fotos',
          body: [
            {
              p: 'Súbelas desde la app web o conecta las fotos de tu NAS como se explica en [Montar carpetas de fotos existentes](#library).',
            },
          ],
        },
        {
          title: 'Añade miembros',
          body: [
            {
              p: 'En «Ajustes del sistema → Miembros», crea cuentas para otras personas y elige el rol «Miembro» o «Administrador».',
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
        'La subida web admite fotos, vídeos, HEIC, RAW (como DNG) y más, con selección múltiple; se sube por fragmentos con el protocolo tus y se reanuda tras un corte de red o al recargar la página.',
        'Los archivos subidos se guardan por año y mes en la carpeta de subidas (por defecto data/upload). La carpeta se cambia en «Ajustes del sistema → Carpeta de subidas» y solo afecta a las nuevas subidas.',
        'Tras importar, se ejecutan por orden: lectura de metadatos (ExifTool) → miniaturas y vista previa de 1440 píxeles (libvips / FFmpeg) → vectores semánticos, caras y texto (servicio de IA) → geocodificación inversa.',
        'El indicador de tareas en la parte superior de la barra lateral muestra, en número de fotos, el progreso y el tiempo restante estimado de «Importar fotos» y «Reconocimiento con IA».',
      ],
    },
    {
      h2: 'browse',
    },
    {
      qa: [
        {
          q: 'Fototeca',
          a: 'Cronología de fotos agrupada por meses, con el carrusel de selecciones de la IA y «Un día como hoy» arriba.',
        },
        {
          q: 'Búsqueda en lenguaje natural',
          a: 'Escribe una descripción (como «fotos del tercer cumpleaños del bebé»); los resultados se ordenan combinando el texto reconocido, el lugar de la toma y la similitud semántica de Chinese-CLIP. Escribir el nombre de una categoría la devuelve directamente.',
        },
        {
          q: 'Personas',
          a: 'Las caras se agrupan automáticamente; una persona aparece cuando sale en al menos 3 fotos. Pon nombres, fusiona, añade cumpleaños y mira el crecimiento por edades, los lugares y las fotos en grupo.',
        },
        {
          q: 'Álbumes · Álbumes inteligentes',
          a: 'Los álbumes contienen fotos elegidas a mano y pueden ser privados; los álbumes inteligentes reúnen fotos solos según persona, lugar, fecha y otras condiciones.',
        },
        {
          q: 'Lugares',
          a: 'Muestra en un mapa dónde se hizo cada foto según el GPS, con vistas Mapa, Satélite y Cuadrícula.',
        },
        {
          q: 'Ráfagas y similares',
          a: 'Agrupa automáticamente ráfagas y fotos parecidas y recomienda la mejor para conservarla; «Duplicados» lista los archivos con contenido idéntico.',
        },
        {
          q: 'Presentaciones',
          a: 'Reproduce la fototeca, álbumes, personas y recuerdos; las fotos verticales se juntan de dos en dos o de tres en tres en una página, con música de fondo y transiciones.',
        },
      ],
    },
    {
      h2: 'members-usage',
    },
    {
      table: ['Rol', 'Permisos'],
      rows: [
        [
          'Administrador',
          'Añadir y quitar miembros, restablecer sus contraseñas y cambiar los ajustes del sistema; puede borrar cualquier foto.',
        ],
        [
          'Miembro',
          'Subir, ver y organizar fotos; solo puede borrar las que subió; no puede cambiar los ajustes del sistema.',
        ],
        [
          'Invitado',
          'Con el acceso de invitados activado, quien no haya iniciado sesión puede ver el contenido compartido en solo lectura; los álbumes privados y las fotos ocultas no se ven.',
        ],
      ],
    },
    {
      p: 'La información de las personas (nombres, fusiones) es común a todos los miembros; el número de fotos, las portadas y las páginas de personas se calculan con las fotos que cada miembro puede ver, y las fotos ocultas solo las ve su dueño.',
    },
    {
      h2: 'settings-members',
    },
    {
      ul: [
        'Miembros: al añadir uno, define nombre, contraseña inicial (mínimo 4 caracteres) y rol; puedes restablecer la contraseña de un miembro o quitarlo.',
        'Historial de accesos: registra la hora, el dispositivo y la IP de cada inicio de sesión, con la ubicación estimada sin conexión a partir de la IP (ip2region), y conserva los últimos seis meses. Solo lo ven los administradores.',
        'En «Mi cuenta», cada miembro puede cambiar su contraseña y su avatar y ver los dispositivos en los que tiene la sesión abierta.',
      ],
    },
    {
      h2: 'settings-ai',
    },
    {
      table: ['Ajuste', 'Opciones', 'Descripción'],
      rows: [
        [
          'Modo de ejecución de IA',
          'Integrado (solo CPU) / Servicio remoto',
          'Un servicio remoto necesita dirección y token, y la conexión se prueba antes de cambiar; si el servicio no está disponible, el procesamiento de IA se pausa.',
        ],
        [
          'Dispositivo de cálculo',
          'Automático / GPU / Solo CPU',
          'Sin tarjeta gráfica utilizable solo se puede elegir CPU; al cambiar se recargan los modelos y el procesamiento de IA en curso sigue poco después.',
        ],
        [
          'Nivel de modelos',
          'Automático / Alta precisión / Equilibrado / Ligero',
          'Tras cambiarlo, todas las fotos se vuelven a procesar con los nuevos modelos y se muestra el progreso.',
        ],
        [
          'Gestión de modelos',
          'Descargar / Borrar',
          'Muestra el tamaño y el estado de cada modelo (en uso, descargado, no descargado).',
        ],
      ],
    },
    {
      h2: 'settings-perf',
    },
    {
      table: ['Ajuste', 'Opciones', 'Descripción'],
      rows: [
        [
          'Momento de procesamiento',
          'En reposo / Siempre / De noche',
          'En reposo: pausa la IA durante subidas y creación de miniaturas; En cualquier momento: procesa sin parar, las subidas pueden ir más lentas; De noche: solo en el horario fijado. Ver [Cuándo trabaja la IA](#ai-schedule).',
        ],
        [
          'Espera tras subir',
          '30 s – 4 h',
          'Cuánto espera la IA tras terminar las subidas; se aplica a En reposo y De noche.',
        ],
        [
          'Concurrencia de procesamiento de fotos',
          'Número',
          'Cuántas fotos se leen y miniaturizan a la vez; por defecto se calcula según núcleos y memoria.',
        ],
        ['Concurrencia de IA', 'Número', 'Cuántas fotos se envían a la vez al servicio de IA.'],
        ['Hilos de CPU', 'Número', 'Hilos de CPU que usa cada modelo en la inferencia.'],
      ],
    },
    {
      p: 'La parte superior de la tarjeta muestra en vivo el estado de la IA (en marcha o motivo de la pausa). Los cambios se aplican al instante, sin reiniciar.',
    },
    {
      h2: 'settings-general',
    },
    {
      table: ['Ajuste', 'Por defecto', 'Descripción'],
      rows: [
        [
          'Carpeta de subidas',
          'data/upload',
          'Los archivos subidos se guardan por año y mes; los cambios solo afectan a las nuevas subidas.',
        ],
        [
          'Acceso de invitados',
          'Activado',
          'Permite ver el contenido compartido sin iniciar sesión. Se recomienda desactivarlo si hay acceso desde internet.',
        ],
        [
          'Mapas en línea',
          'Activado',
          'Muestra mapas, nombres de lugares y búsqueda de lugares, para lo que envía la ubicación de las fotos al servicio de mapas; desactivado, solo se ven coordenadas.',
        ],
        [
          'Proveedor de mapas',
          'Automático',
          'Automático: AMap en China continental y OpenStreetMap en el resto; también se puede fijar uno de los dos.',
        ],
        ['Dominio de acceso', 'wanmory.local', 'Dominio de acceso en la red local; debe terminar en .local.'],
      ],
    },
    {
      h2: 'settings-update',
    },
    {
      p: '«Ajustes del sistema → Actualización del sistema» muestra las versiones actuales del backend y del servicio de IA y avisa de las nuevas. Para actualizar, ejecuta en la carpeta donde está `docker-compose.yml`:',
    },
    {
      code: 'docker compose pull && docker compose up -d',
      lang: 'bash',
    },
    {
      p: 'Las migraciones de la base de datos se ejecutan solas al arrancar server. Si fijaste una versión con `WANMORY_VERSION`, cambia antes la etiqueta en `.env`.',
    },
    {
      note: 'Los pasos completos están en [Actualizar](#update).',
    },
    {
      h2: 'update',
    },
    {
      p: 'Cuando sale una versión nueva, Ajustes → Actualización del sistema lo indica y muestra las notas de cada versión (también en la página [Versiones](/releases/)). Actualizar solo cambia el programa; fotos, base de datos, ajustes y modelos se conservan.',
    },
    {
      steps: [
        {
          title: 'Ir a la carpeta de instalación',
          body: [
            {
              code: 'cd ~/wanmory   # tu carpeta de instalación (la que tiene docker-compose.yml y .env)',
              lang: 'bash',
            },
          ],
        },
        {
          title: 'Descargar las imágenes nuevas y reiniciar',
          body: [
            {
              code: `docker compose pull
docker compose up -d`,
              lang: 'bash',
            },
            {
              p: 'Wanmory actualiza el esquema de la base de datos al arrancar; recarga la página tras unos segundos o un minuto.',
            },
          ],
        },
        {
          title: 'Borrar imágenes antiguas (opcional)',
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
      note: 'Si `.env` fija una versión con `WANMORY_VERSION`, cámbiala por la nueva (o borra la línea para usar la última) antes de ejecutar los comandos. También puedes volver a ejecutar el script de instalación y mantener la configuración (`Keep the existing configuration` → Y): el resultado es el mismo y además descarga el `docker-compose.yml` más reciente.',
    },
    {
      h2: 'backup',
    },
    {
      p: 'Hay tres tipos de datos que copiar:',
    },
    {
      table: ['Datos', 'Ubicación', 'Descripción'],
      rows: [
        [
          'Base de datos',
          'volumen con nombre pgdata',
          'Metadatos de fotos, personas, álbumes, ajustes, vectores y la cola de tareas.',
        ],
        [
          'Subidas y miniaturas',
          './data',
          'Originales subidos (data/upload) y miniaturas (data/thumbs); las miniaturas se pueden regenerar.',
        ],
        [
          'Carpetas de fotos',
          'carpetas montadas en /photos',
          'Las cubre el plan de copias del propio NAS; la app nunca modifica las carpetas montadas en solo lectura.',
        ],
      ],
    },
    {
      lang: 'bash',
      code: `# Exportar la base de datos
docker compose exec -T postgres pg_dump -U wanmory -Fc wanmory > wanmory-$(date +%F).dump

# Restaurar en una instalación nueva (ejecuta antes docker compose up -d postgres)
docker compose exec -T postgres pg_restore -U wanmory -d wanmory --clean < wanmory-2026-11-10.dump`,
    },
    {
      note: 'Los modelos de ./models no hace falta copiarlos; se pueden volver a descargar desde la app web.',
    },
    {
      h2: 'reset-password',
    },
    {
      p: 'Si un miembro olvida su contraseña, un administrador la restablece en «Ajustes del sistema → Miembros». Si el administrador olvida la suya, ejecuta esto en el equipo donde funciona la app, en la carpeta donde está `docker-compose.yml`:',
    },
    {
      lang: 'bash',
      code: `docker compose exec server wanmory reset-password            # listar las cuentas y elegir una
docker compose exec server wanmory reset-password <nombre>    # indicar la cuenta directamente`,
    },
    {
      ul: [
        'El comando lista todas las cuentas (nombre, rol, fecha de creación, último acceso); elige una por su número y escribe dos veces la nueva contraseña.',
        'Tras restablecerla, esa cuenta se cierra en todos los dispositivos; las fotos y los álbumes no cambian.',
        'Solo se puede hacer en el equipo; la app web no tiene opción para ello. Sin Docker, ejecuta wanmory reset-password con las mismas variables de entorno que el servidor, como DATABASE_URL.',
      ],
    },
    {
      h2: 'troubleshooting',
    },
    {
      qa: [
        {
          q: 'No se puede abrir wanmory.local',
          a: 'Comprueba que el servicio mdns esté en marcha (docker compose ps); algunos Android no admiten mDNS, usa la IP; revisa si el puerto 5353 está ocupado en el equipo.',
        },
        {
          q: 'Los ajustes de IA muestran «Sin conexión, procesamiento de IA en pausa»',
          a: 'En modo integrado, revisa los registros del contenedor ml (docker compose logs ml); en modo remoto, comprueba que coincidan la dirección, el puerto, el cortafuegos y el token.',
        },
        {
          q: 'Sin resultados en Personas o en la búsqueda',
          a: 'Comprueba que los modelos estén descargados; en «Rendimiento», mira si la IA está en pausa por el momento de procesamiento; revisa el progreso del reconocimiento en el indicador de tareas.',
        },
        {
          q: 'Fallan las subidas grandes',
          a: 'El límite de tamaño de peticiones del proxy inverso es demasiado bajo; ajusta client_max_body_size como se indica en «Proxy inverso y acceso desde internet».',
        },
        {
          q: 'No aparecen las fotos de una carpeta montada',
          a: 'Las carpetas deben montarse como subcarpetas de /photos; el primer escaneo es unos 20 segundos tras el arranque y luego cada 15 minutos; las carpetas ocultas se omiten.',
        },
        {
          q: 'La descarga de imágenes es lenta o falla',
          a: 'Define en .env WANMORY_REGISTRY con un registro accesible.',
        },
      ],
    },
    {
      p: 'Consulta los registros de cada servicio con `docker compose logs -f server` y `docker compose logs -f ml`. Si el problema sigue, cuéntanoslo en la página [Informar de un problema](/feedback/) con tu número de versión y los registros relevantes.',
    },
    {
      h2: 'uninstall',
    },
    {
      p: 'Ejecútalo en el equipo donde funciona Wanmory:',
    },
    {
      code: 'curl -fsSL https://wanmory.com/uninstall.sh | bash',
      lang: 'bash',
    },
    {
      p: 'Por defecto solo se eliminan los contenedores y se conservan todos los datos: pregunta por cada elemento, e Intro siempre significa conservar (N). Las carpetas de fotos que montaste (NAS, discos externos) nunca se borran.',
    },
    {
      steps: [
        {
          title: 'Locating installation',
          body: [
            {
              p: 'Pregunta el `Install directory`; Intro usa ~/wanmory. La carpeta debe contener el `docker-compose.yml` de Wanmory o el script se detiene. Después muestra el número de contenedores, dónde está la base de datos, las carpetas de datos y de modelos con su tamaño y tus carpetas de fotos montadas (marcadas `never deleted`).',
            },
          ],
        },
        {
          title: 'Choose what to remove',
          body: [
            {
              p: 'Los contenedores y la red se eliminan siempre. Cada elemento siguiente se pregunta una vez:',
            },
            {
              qa: [
                {
                  q: '`Delete the database`',
                  a: 'La base de datos (volumen Docker pgdata o la carpeta de `WANMORY_DB_DIR`): personas, álbumes, ajustes, resultados de IA y cuentas. No se puede deshacer.',
                },
                {
                  q: '`Delete the data directory`',
                  a: 'La carpeta de datos: miniaturas y **las fotos originales subidas desde la web**.',
                },
                {
                  q: '`Delete the AI models`',
                  a: 'La carpeta de modelos de IA; se pueden volver a descargar tras reinstalar.',
                },
                {
                  q: '`Remove the Docker images`',
                  a: 'Las imágenes Docker que usa Wanmory (incluida postgres/pgvector); se pueden volver a descargar.',
                },
                {
                  q: '`Delete the configuration files`',
                  a: '`.env` (con la contraseña de la base de datos), `docker-compose.yml`, `docker-compose.override.yml`; si la carpeta de instalación queda vacía, también se elimina.',
                },
              ],
            },
          ],
        },
        {
          title: 'Summary',
          body: [
            {
              p: 'Resume lo que va a pasar. Si elegiste borrar la base de datos o la carpeta de datos, hay que escribir `DELETE` en mayúsculas para continuar; cualquier otra cosa cancela sin cambiar nada. Si no, pregunta `Proceed` una vez. Si conservas la base de datos pero borras `.env`, recuerda apuntar antes `WANMORY_DB_PASSWORD`.',
            },
          ],
        },
        {
          title: 'Removing',
          body: [
            {
              p: 'Detiene y elimina los contenedores y después borra lo elegido. Los archivos escritos por los contenedores pueden pertenecer a otro usuario (versiones antiguas escribían como uid 1000 o root); si un rm normal no puede, el script los borra desde un contenedor temporal que se ejecuta como root, y si tampoco, te indica que uses `sudo rm -rf`. El script se niega a borrar rutas que claramente no son de Wanmory, como /, /home, /volume1 o tu carpeta personal.',
            },
          ],
        },
      ],
    },
    {
      p: 'Si solo eliminaste los contenedores y conservaste datos y configuración, ejecutar de nuevo install.sh en la misma carpeta lo recupera todo.',
    },
    {
      table: ['Opción', 'Qué hace'],
      rows: [
        ['`--dir CARPETA`', 'Carpeta de instalación, ~/wanmory por defecto (o define `WANMORY_DIR`).'],
        [
          '`-y`, `--yes`',
          'Sin preguntas: elimina solo contenedores y red, conserva todos los datos y la configuración. Es también el comportamiento sin terminal interactiva.',
        ],
        [
          '`--purge`',
          'Sin preguntas: borra todo lo de la tabla anterior (salvo tus carpetas de fotos) sin escribir DELETE. Úsalo con cuidado.',
        ],
        ['`--dry-run`', 'Muestra lo que haría sin cambiar nada.'],
        ['`-h`, `--help`', 'Muestra la ayuda.'],
      ],
    },
  ],
}

export default docs
