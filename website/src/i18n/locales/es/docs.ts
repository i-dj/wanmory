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
    'Esta documentación es para administradores que alojan Wanmory en un NAS, un servidor doméstico o un ordenador personal. Cubre la instalación, la configuración, el despliegue del servicio de IA, el uso diario, los ajustes del sistema y el mantenimiento. Para el diseño del sistema y los algoritmos, consulta [Arquitectura](/architecture/).',
  blocks: [
    { h2: 'intro' },
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

    { h2: 'requirements' },
    {
      table: ['Elemento', 'Mínimo', 'Recomendado'],
      rows: [
        ['Arquitectura de CPU', 'x86_64 (amd64) o ARM64', '—'],
        ['Procesador', 'Clase Intel N100 / Raspberry Pi 5', 'Clase Intel i5 o superior, o el servicio de IA en otro equipo con GPU'],
        ['Memoria', '4 GB (se elige automáticamente el nivel «Ligero»)', '8 GB o más (nivel «Equilibrado»)'],
        ['Disco', 'Unos 1–4 GB para modelos, más espacio para miniaturas', 'Un SSD para data/ y el volumen de la base de datos'],
        ['Software', 'Docker Engine y Docker Compose v2', '—'],
        ['Sistema operativo', 'Cualquier distribución Linux que ejecute Docker', 'Synology DSM, QNAP QTS, TrueNAS SCALE, Unraid, Ubuntu / Debian'],
      ],
    },
    {
      note: 'Las imágenes se publican para `linux/amd64` y `linux/arm64`, y Docker descarga la que corresponde a tu arquitectura. Los contenedores Docker en macOS no pueden usar la GPU de Apple; para aceleración por hardware en un Mac, consulta [Servicio de IA en otro equipo](#ai-remote).',
    },

    { h2: 'quick-start' },
    { h3: 'Opción 1: script de instalación (recomendado)' },
    { p: 'En un equipo de 64 bits con Docker instalado, ejecuta:' },
    { code: 'curl -fsSL https://wanmory.com/install.sh | bash', lang: 'bash' },
    { p: 'El script hace lo siguiente, por orden:' },
    {
      ul: [
        'Comprobación del entorno: arquitectura de CPU (amd64 / arm64) y espacio de usuario de 64 bits, disponibilidad de Docker y Docker Compose v2, memoria y espacio en disco libres.',
        'Configuración interactiva: carpeta de instalación (por defecto ~/wanmory), puerto de acceso (por defecto 8080, comprueba si está ocupado), dominio local (por defecto wanmory.local), contraseña de la base de datos (aleatoria por defecto) y ubicación de la base de datos (por defecto el volumen Docker pgdata, o una carpeta en un disco local), y zona horaria (escribe una ciudad o región para buscarla, como shanghai, tokyo o 北京, y elige un número si hay varias coincidencias).',
        'Ubicaciones de almacenamiento: carpeta de datos (miniaturas, vistas previas y fotos subidas, por defecto ./data) y carpeta de modelos de IA (por defecto ./models).',
        'Las preguntas y mensajes del script están en inglés para que se vean bien en cualquier terminal de NAS.',
        'Carpetas de fotos existentes: añade tantas como quieras, eligiendo para cada una montaje de solo lectura (recomendado) o de lectura y escritura.',
        'Crea `.env` (permisos 600); si se indican carpetas de fotos, crea también `docker-compose.override.yml`, que Docker Compose combina automáticamente.',
        'Descarga el docker-compose.yml oficial (desde Gitee si GitHub no responde), valida la configuración, descarga las imágenes, arranca los servicios y muestra la dirección cuando todo está listo.',
      ],
    },
    {
      table: ['Opción / variable', 'Descripción'],
      rows: [
        ['`-y`', 'No pregunta nada y usa todos los valores por defecto (contraseña de la base de datos aleatoria). Para instalaciones automatizadas.'],
        ['`--dir CARPETA`', 'Define la carpeta de instalación.'],
        ['`--dry-run`', 'Solo comprueba el entorno y crea los archivos de configuración; no descarga imágenes ni arranca nada.'],
        [
          '`WANMORY_PORT`',
          'Fija el puerto de antemano; igual con WANMORY_DOMAIN, WANMORY_DB_PASSWORD, WANMORY_TZ, WANMORY_DATA_DIR, WANMORY_MODELS_DIR, WANMORY_DB_DIR, WANMORY_REGISTRY y WANMORY_VERSION.',
        ],
        ['`WANMORY_PHOTOS`', 'Carpetas de fotos separadas por comas, montadas en solo lectura por defecto; añade :rw tras una ruta para lectura y escritura, p. ej. /volume1/photo,/mnt/usb:rw.'],
      ],
    },
    {
      code: `# Ejemplo: instalación no interactiva en /opt/wanmory con el puerto 9000 y carpetas de fotos del NAS
curl -fsSL https://wanmory.com/install.sh | WANMORY_PORT=9000 WANMORY_PHOTOS=/volume1/photo,/volume2/family bash -s -- -y --dir /opt/wanmory`,
      lang: 'bash',
    },
    {
      note: 'Si vuelves a ejecutar el script y la carpeta de instalación ya tiene un .env, por defecto se mantiene la configuración existente (la contraseña de la base de datos no se puede cambiar libremente tras el primer arranque); solo se actualiza el archivo Compose y se reinician los servicios, así que también sirve para actualizar.',
    },
    { h3: 'Opción 2: instalación manual' },
    {
      steps: [
        {
          title: 'Crea una carpeta y descarga el archivo Compose',
          body: [
            { p: 'Crea una carpeta para el archivo Compose, los datos y los modelos, y descarga el `docker-compose.yml` oficial:' },
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
            { p: 'Crea un `.env` en la misma carpeta para cambiar los valores por defecto. En producción, cambia sí o sí la contraseña de la base de datos:' },
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
            { p: 'El primer arranque descarga las imágenes y ejecuta automáticamente las migraciones de la base de datos:' },
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

    { h2: 'compose' },
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

    { h2: 'env' },
    { h3: '.env (variables de Compose)' },
    { p: 'Estas variables se usan en `docker-compose.yml`; ponlas en el `.env` de la misma carpeta para aplicarlas:' },
    {
      table: ['Variable', 'Por defecto', 'Descripción'],
      rows: [
        ['`WANMORY_DB_PASSWORD`', 'wanmory', 'Contraseña de PostgreSQL, que también usa la DATABASE_URL de server. Cambiarla tras el primer arranque obliga a cambiar también la contraseña del usuario dentro de la base de datos.'],
        ['`WANMORY_PORT`', '8080', 'Puerto publicado en el equipo, usado también para la dirección que muestra la app web.'],
        ['`WANMORY_TZ`', 'Asia/Shanghai', 'Zona horaria cuando los datos EXIF no la incluyen.'],
        ['`WANMORY_VERSION`', 'latest', 'Etiqueta de la imagen; fija una versión concreta para decidir cuándo actualizar.'],
        ['`WANMORY_REGISTRY`', 'ghcr.io/i-dj', 'Registro de imágenes. Sustitúyelo por uno accesible si ghcr.io no lo es.'],
        ['`WANMORY_DATA_DIR`', './data', 'Carpeta de datos: originales subidos (upload/) y miniaturas y vistas previas (thumbs/), montada en /data del contenedor.'],
        ['`WANMORY_MODELS_DIR`', './models', 'Carpeta de modelos de IA, montada en /models del contenedor ml.'],
        [
          '`WANMORY_DB_DIR`',
          'volumen pgdata',
          'Carpeta de la base de datos. Si no se define, se usa el volumen Docker pgdata; con la ruta de una carpeta en un disco local, la base se guarda allí directamente. No uses una carpeta compartida en red.',
        ],
        ['`WANMORY_DOMAIN`', 'wanmory.local', 'Dominio local inicial; debe terminar en .local. Si se cambia en «Ajustes del sistema → Dominio de acceso» de la app web, manda el ajuste.'],
      ],
    },
    { h3: 'Contenedor server (opcional)' },
    {
      p: '`DATABASE_URL`, `WANMORY_ML_URL`, `WANMORY_MDNS` y `WANMORY_HTTP_PUBLIC_PORT` ya están en el archivo Compose con su finalidad anotada. Las siguientes variables no están en el archivo por defecto; añádelas al `environment` de `server` si las necesitas:',
    },
    {
      table: ['Variable', 'Por defecto', 'Descripción'],
      rows: [
        ['`WANMORY_WORKERS`', 'automático', 'Concurrencia por defecto de las tareas de metadatos y miniaturas. Sin valor, se calcula según núcleos y memoria; se puede ajustar en «Rendimiento» de la app web.'],
        ['`WANMORY_ML_TOKEN`', 'vacío', 'Token de acceso del servicio de IA integrado; debe coincidir con la variable del mismo nombre en el contenedor ml. Normalmente no hace falta.'],
        ['`WANMORY_FACE_MODEL`', 'antelopev2', 'Modelo de caras usado si no se ha elegido nivel.'],
        ['`WANMORY_CLIP_MODEL`', 'chinese-clip-vit-h-14', 'Modelo de búsqueda semántica usado si no se ha elegido nivel.'],
        ['`WANMORY_STORAGE_ROOTS`', 'carpeta de datos', 'Carpetas que se pueden explorar y elegir desde la app web, separadas por dos puntos.'],
      ],
    },

    { h2: 'library' },
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
    { p: 'Tras el cambio, ejecuta `docker compose up -d`. El primer escaneo empieza unos 20 segundos después de reiniciarse el contenedor.' },
    {
      ul: [
        '**Se recomienda montar en solo lectura (:ro)**: el sistema no escribe nada en esas carpetas. Borrar una foto en la app solo la mueve a «Eliminadas recientemente», el borrado definitivo nunca elimina el archivo original y los escaneos posteriores no lo vuelven a importar. En carpetas de lectura y escritura, el borrado definitivo también elimina el archivo original.',
        'Los archivos con contenido idéntico solo se importan una vez (se comparan por suma SHA-1), incluidos los ya subidos y los duplicados entre carpetas.',
        'Las carpetas ocultas y las de sistema del NAS (.xxx, @eaDir, #recycle, etc.) se omiten automáticamente.',
        'Las fotos importadas desde carpetas no pertenecen a ningún miembro; solo los administradores pueden borrarlas.',
      ],
    },

    { h2: 'mdns' },
    {
      p: 'El servicio `mdns` funciona en modo de red del equipo y anuncia el dominio de acceso en tu red local (por defecto `wanmory.local`). macOS, iOS, iPadOS y Windows 10 o posterior acceden en `http://wanmory.local:8080` sin configurar el router. El dominio se cambia en «Ajustes del sistema → Dominio de acceso» y debe terminar en `.local`.',
    },
    {
      note: 'Algunos dispositivos Android no resuelven nombres mDNS; usa la dirección IP. Si el puerto 5353 ya está ocupado (por ejemplo, en Synology), el servicio mdns puede no arrancar; en ese caso usa también la IP. Lo demás no se ve afectado.',
      warn: true,
    },

    { h2: 'proxy' },
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

    { h2: 'ai-overview' },
    {
      p: 'El servicio de IA es un servicio HTTP sin estado: recibe vistas previas de 1440 píxeles del backend y devuelve caras, vectores y texto reconocido. Nunca accede a la base de datos ni guarda archivos. El backend admite dos modos, que se cambian en «Ajustes del sistema → IA → Modo de ejecución de IA»:',
    },
    {
      table: ['Modo', 'Dónde se ejecuta', 'Adecuado para'],
      rows: [
        ['Integrado (solo CPU)', 'El contenedor ml de Compose, solo accesible en la red interna', 'Listo para usar; un NAS o mini PC con una fototeca moderada, o si se acepta un primer procesamiento más largo'],
        ['Servicio remoto', 'Otro equipo de tu red local que ejecuta directamente el servicio Python', 'Un Mac con Apple Silicon (CoreML / MPS) o un equipo con GPU NVIDIA (CUDA), que acorta mucho el primer procesamiento'],
      ],
    },
    { p: 'Si el servicio de IA no está disponible, las tareas de IA se quedan en la cola y dejan de tomarse, sin gastar reintentos; el procesamiento sigue solo cuando el servicio vuelve. Explorar, subir y lo demás no se ve afectado.' },

    { h2: 'ai-remote' },
    { h3: 'Opción 1: directamente en un Mac o equipo con GPU (recomendado)' },
    {
      p: 'Ejecutarlo directamente permite la aceleración por hardware: en Apple Silicon, los modelos de caras usan CoreML y Chinese-CLIP usa MPS; en GPU NVIDIA, Chinese-CLIP usa CUDA en media precisión (unos 1,9 GB de VRAM / memoria). Instala primero [uv](https://docs.astral.sh/uv/).',
    },
    {
      lang: 'bash',
      code: `git clone https://github.com/i-dj/wanmory.git
cd wanmory/ml
uv sync --extra torch                 # instalar las dependencias de PyTorch (búsqueda semántica acelerada por GPU)

# Genera un token de acceso; el backend y el servicio de IA usan el mismo valor
export WANMORY_ML_TOKEN=$(openssl rand -hex 24)
echo $WANMORY_ML_TOKEN

WANMORY_FACE_MODEL_PRELOAD=1 uv run --extra torch python -m wanmory_ml
# Escucha en 0.0.0.0:3003 por defecto; se cambia con WANMORY_ML_HOST / WANMORY_ML_PORT`,
    },
    { h3: 'Opción 2: la imagen Docker en otro equipo' },
    { p: 'Para un equipo x86 más potente sin GPU utilizable; la imagen usa solo la CPU:' },
    {
      lang: 'bash',
      code: `docker run -d --name wanmory-ml --restart unless-stopped \\
  -p 3003:3003 \\
  -e WANMORY_ML_TOKEN=<token-de-acceso> \\
  -v $PWD/models:/models \\
  ghcr.io/i-dj/wanmory-ml:latest`,
    },
    { h3: 'Activar el servicio remoto en el backend' },
    {
      steps: [
        { title: 'Abre los ajustes de IA', body: [{ p: 'Como administrador, ve a «Ajustes del sistema → IA → Modo de ejecución de IA» y elige «Servicio remoto».' }] },
        {
          title: 'Introduce la dirección y el token',
          body: [{ p: 'La dirección tiene la forma `http://192.168.1.20:3003`; introduce el token generado en el paso anterior. Antes de guardar se prueba la conexión y se muestran la latencia y la versión del servicio.' }],
        },
        { title: 'Confirma el nivel y los modelos', body: [{ p: 'Una vez conectado, un nivel «Automático» se vuelve a calcular según el hardware del equipo remoto; descarga los modelos necesarios en «Nivel de modelos».' }] },
      ],
    },
    { note: 'Haz que el servicio de IA remoto solo sea accesible en tu red local o mediante una VPN (como Tailscale), y define siempre un token. Si conectas a través de internet, pasa por un proxy inverso con HTTPS.', warn: true },

    { h2: 'ai-models' },
    {
      p: 'El nivel decide qué modelos se usan para las caras y la búsqueda semántica. Con «Automático», el sistema recomienda un nivel según el hardware del equipo donde está el servicio de IA: «Alta precisión» si hay una GPU utilizable; solo con CPU, «Ligero» por debajo de 6 GB de memoria y «Equilibrado» en otro caso.',
    },
    {
      table: ['Nivel', 'Detección + rasgos faciales', 'Búsqueda semántica', 'Hardware adecuado'],
      rows: [
        ['Alta precisión (quality)', 'antelopev2 (SCRFD-10G + ArcFace R100)', 'Chinese-CLIP ViT-H/14 (1024-d)', 'Mac con Apple Silicon, GPU NVIDIA'],
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

    { h2: 'ai-env' },
    {
      table: ['Variable', 'Por defecto', 'Descripción'],
      rows: [
        ['`WANMORY_ML_HOST`', '0.0.0.0', 'Dirección de escucha.'],
        ['`WANMORY_ML_PORT`', '3003', 'Puerto de escucha.'],
        ['`WANMORY_ML_TOKEN`', 'vacío', 'Token de acceso; si se define, cada petición debe incluir Authorization: Bearer.'],
        ['`WANMORY_MODEL_DIR`', '~/.cache/wanmory/models', 'Carpeta de modelos; /models dentro de la imagen.'],
        ['`WANMORY_AUTO_DOWNLOAD`', '0 en la imagen', 'Si se descargan los modelos automáticamente al usarlos por primera vez.'],
        ['`WANMORY_FACE_MODEL_PRELOAD`', '—', 'Con 1, carga los modelos de caras al arrancar; Chinese-CLIP se carga en segundo plano.'],
        ['`WANMORY_UNLOAD_AFTER`', '5 / 30 minutos', 'Segundos de inactividad antes de descargar un modelo para liberar memoria; 0 nunca lo descarga. El valor por defecto depende de la memoria del equipo.'],
      ],
    },

    { h2: 'first-run' },
    {
      steps: [
        { title: 'Crea el administrador', body: [{ p: 'En la primera visita, el sistema ve que no hay ninguna cuenta y te guía para crear un administrador. Los administradores pueden añadir miembros y cambiar los ajustes del sistema.' }] },
        { title: 'Descarga los modelos', body: [{ p: 'Ve a «Ajustes del sistema → IA», confirma el nivel de modelos y descárgalos. Las tareas de IA esperan en la cola hasta que estén listos.' }] },
        { title: 'Importa fotos', body: [{ p: 'Súbelas desde la app web o conecta las fotos de tu NAS como se explica en [Montar carpetas de fotos existentes](#library).' }] },
        { title: 'Añade miembros', body: [{ p: 'En «Ajustes del sistema → Miembros», crea cuentas para otras personas y elige el rol «Miembro» o «Administrador».' }] },
      ],
    },

    { h2: 'import' },
    {
      ul: [
        'La subida web admite fotos, vídeos, HEIC, RAW (como DNG) y más, con selección múltiple; se sube por fragmentos con el protocolo tus y se reanuda tras un corte de red o al recargar la página.',
        'Los archivos subidos se guardan por año y mes en la carpeta de subidas (por defecto data/upload). La carpeta se cambia en «Ajustes del sistema → Carpeta de subidas» y solo afecta a las nuevas subidas.',
        'Tras importar, se ejecutan por orden: lectura de metadatos (ExifTool) → miniaturas y vista previa de 1440 píxeles (libvips / FFmpeg) → vectores semánticos, caras y texto (servicio de IA) → geocodificación inversa.',
        'El indicador de tareas en la parte superior de la barra lateral muestra, en número de fotos, el progreso y el tiempo restante estimado de «Importar fotos» y «Reconocimiento con IA».',
      ],
    },

    { h2: 'browse' },
    {
      table: ['Función', 'Descripción'],
      rows: [
        ['Fototeca', 'Cronología de fotos agrupada por meses, con el carrusel de selecciones de la IA y «Un día como hoy» arriba.'],
        ['Búsqueda en lenguaje natural', 'Escribe una descripción (como «fotos del tercer cumpleaños del bebé»); los resultados se ordenan combinando el texto reconocido, el lugar de la toma y la similitud semántica de Chinese-CLIP. Escribir el nombre de una categoría la devuelve directamente.'],
        ['Personas', 'Las caras se agrupan automáticamente; una persona aparece cuando sale en al menos 3 fotos. Pon nombres, fusiona, añade cumpleaños y mira el crecimiento por edades, los lugares y las fotos en grupo.'],
        ['Álbumes · Álbumes inteligentes', 'Los álbumes contienen fotos elegidas a mano y pueden ser privados; los álbumes inteligentes reúnen fotos solos según persona, lugar, fecha y otras condiciones.'],
        ['Lugares', 'Muestra en un mapa dónde se hizo cada foto según el GPS, con vistas Mapa, Satélite y Cuadrícula.'],
        ['Ráfagas y similares', 'Agrupa automáticamente ráfagas y fotos parecidas y recomienda la mejor para conservarla; «Duplicados» lista los archivos con contenido idéntico.'],
        ['Presentaciones', 'Reproduce la fototeca, álbumes, personas y recuerdos; las fotos verticales se juntan de dos en dos o de tres en tres en una página, con música de fondo y transiciones.'],
      ],
    },

    { h2: 'members-usage' },
    {
      table: ['Rol', 'Permisos'],
      rows: [
        ['Administrador', 'Añadir y quitar miembros, restablecer sus contraseñas y cambiar los ajustes del sistema; puede borrar cualquier foto.'],
        ['Miembro', 'Subir, ver y organizar fotos; solo puede borrar las que subió; no puede cambiar los ajustes del sistema.'],
        ['Invitado', 'Con el acceso de invitados activado, quien no haya iniciado sesión puede ver el contenido compartido en solo lectura; los álbumes privados y las fotos ocultas no se ven.'],
      ],
    },
    { p: 'La información de las personas (nombres, fusiones) es común a todos los miembros; el número de fotos, las portadas y las páginas de personas se calculan con las fotos que cada miembro puede ver, y las fotos ocultas solo las ve su dueño.' },

    { h2: 'settings-members' },
    {
      ul: [
        'Miembros: al añadir uno, define nombre, contraseña inicial (mínimo 4 caracteres) y rol; puedes restablecer la contraseña de un miembro o quitarlo.',
        'Historial de accesos: registra la hora, el dispositivo y la IP de cada inicio de sesión, con la ubicación estimada sin conexión a partir de la IP (ip2region), y conserva los últimos seis meses. Solo lo ven los administradores.',
        'En «Mi cuenta», cada miembro puede cambiar su contraseña y su avatar y ver los dispositivos en los que tiene la sesión abierta.',
      ],
    },

    { h2: 'settings-ai' },
    {
      table: ['Ajuste', 'Opciones', 'Descripción'],
      rows: [
        ['Modo de ejecución de IA', 'Integrado (solo CPU) / Servicio remoto', 'Un servicio remoto necesita dirección y token, y la conexión se prueba antes de cambiar; si el servicio no está disponible, el procesamiento de IA se pausa.'],
        ['Dispositivo de cálculo', 'Automático / GPU / Solo CPU', 'Sin tarjeta gráfica utilizable solo se puede elegir CPU; al cambiar se recargan los modelos y el procesamiento de IA en curso sigue poco después.'],
        ['Nivel de modelos', 'Automático / Alta precisión / Equilibrado / Ligero', 'Tras cambiarlo, todas las fotos se vuelven a procesar con los nuevos modelos y se muestra el progreso.'],
        ['Gestión de modelos', 'Descargar / Borrar', 'Muestra el tamaño y el estado de cada modelo (en uso, descargado, no descargado).'],
      ],
    },

    { h2: 'settings-perf' },
    {
      table: ['Ajuste', 'Opciones', 'Descripción'],
      rows: [
        ['Momento de procesamiento', 'En reposo / Siempre / De noche', 'En reposo: la IA se pausa durante las subidas y la generación de miniaturas; Siempre: procesa sin parar, las subidas pueden ir más lentas; De noche: solo en la franja horaria definida.'],
        ['Concurrencia de procesamiento de fotos', 'Número', 'Cuántas fotos se leen y miniaturizan a la vez; por defecto se calcula según núcleos y memoria.'],
        ['Concurrencia de IA', 'Número', 'Cuántas fotos se envían a la vez al servicio de IA.'],
        ['Hilos de CPU', 'Número', 'Hilos de CPU que usa cada modelo en la inferencia.'],
      ],
    },
    { p: 'La parte superior de la tarjeta muestra en vivo el estado de la IA (en marcha o motivo de la pausa). Los cambios se aplican al instante, sin reiniciar.' },

    { h2: 'settings-general' },
    {
      table: ['Ajuste', 'Por defecto', 'Descripción'],
      rows: [
        ['Carpeta de subidas', 'data/upload', 'Los archivos subidos se guardan por año y mes; los cambios solo afectan a las nuevas subidas.'],
        ['Acceso de invitados', 'Activado', 'Permite ver el contenido compartido sin iniciar sesión. Se recomienda desactivarlo si hay acceso desde internet.'],
        ['Mapas en línea', 'Activado', 'Muestra mapas, nombres de lugares y búsqueda de lugares, para lo que envía la ubicación de las fotos al servicio de mapas; desactivado, solo se ven coordenadas.'],
        ['Proveedor de mapas', 'Automático', 'Automático: AMap en China continental y OpenStreetMap en el resto; también se puede fijar uno de los dos.'],
        ['Dominio de acceso', 'wanmory.local', 'Dominio de acceso en la red local; debe terminar en .local.'],
      ],
    },

    { h2: 'settings-update' },
    { p: '«Ajustes del sistema → Actualización del sistema» muestra las versiones actuales del backend y del servicio de IA y avisa de las nuevas. Para actualizar, ejecuta en la carpeta donde está `docker-compose.yml`:' },
    { code: 'docker compose pull && docker compose up -d', lang: 'bash' },
    { p: 'Las migraciones de la base de datos se ejecutan solas al arrancar server. Si fijaste una versión con `WANMORY_VERSION`, cambia antes la etiqueta en `.env`.' },

    { h2: 'backup' },
    { p: 'Hay tres tipos de datos que copiar:' },
    {
      table: ['Datos', 'Ubicación', 'Descripción'],
      rows: [
        ['Base de datos', 'volumen con nombre pgdata', 'Metadatos de fotos, personas, álbumes, ajustes, vectores y la cola de tareas.'],
        ['Subidas y miniaturas', './data', 'Originales subidos (data/upload) y miniaturas (data/thumbs); las miniaturas se pueden regenerar.'],
        ['Carpetas de fotos', 'carpetas montadas en /photos', 'Las cubre el plan de copias del propio NAS; la app nunca modifica las carpetas montadas en solo lectura.'],
      ],
    },
    {
      lang: 'bash',
      code: `# Exportar la base de datos
docker compose exec -T postgres pg_dump -U wanmory -Fc wanmory > wanmory-$(date +%F).dump

# Restaurar en una instalación nueva (ejecuta antes docker compose up -d postgres)
docker compose exec -T postgres pg_restore -U wanmory -d wanmory --clean < wanmory-2026-11-10.dump`,
    },
    { note: 'Los modelos de ./models no hace falta copiarlos; se pueden volver a descargar desde la app web.' },

    { h2: 'reset-password' },
    { p: 'Si un miembro olvida su contraseña, un administrador la restablece en «Ajustes del sistema → Miembros». Si el administrador olvida la suya, ejecuta esto en el equipo donde funciona la app, en la carpeta donde está `docker-compose.yml`:' },
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

    { h2: 'troubleshooting' },
    {
      table: ['Síntoma', 'Qué revisar'],
      rows: [
        ['No se puede abrir wanmory.local', 'Comprueba que el servicio mdns esté en marcha (docker compose ps); algunos Android no admiten mDNS, usa la IP; revisa si el puerto 5353 está ocupado en el equipo.'],
        ['Los ajustes de IA muestran «Sin conexión, procesamiento de IA en pausa»', 'En modo integrado, revisa los registros del contenedor ml (docker compose logs ml); en modo remoto, comprueba que coincidan la dirección, el puerto, el cortafuegos y el token.'],
        ['Sin resultados en Personas o en la búsqueda', 'Comprueba que los modelos estén descargados; en «Rendimiento», mira si la IA está en pausa por el momento de procesamiento; revisa el progreso del reconocimiento en el indicador de tareas.'],
        ['Fallan las subidas grandes', 'El límite de tamaño de peticiones del proxy inverso es demasiado bajo; ajusta client_max_body_size como se indica en «Proxy inverso y acceso desde internet».'],
        ['No aparecen las fotos de una carpeta montada', 'Las carpetas deben montarse como subcarpetas de /photos; el primer escaneo es unos 20 segundos tras el arranque y luego cada 15 minutos; las carpetas ocultas se omiten.'],
        ['La descarga de imágenes es lenta o falla', 'Define en .env WANMORY_REGISTRY con un registro accesible.'],
      ],
    },
    {
      p: 'Consulta los registros de cada servicio con `docker compose logs -f server` y `docker compose logs -f ml`. Si el problema sigue, cuéntanoslo en la página [Informar de un problema](/feedback/) con tu número de versión y los registros relevantes.',
    },

    { h2: 'uninstall' },
    { p: 'Ejecuta el script de desinstalación en el equipo donde funciona Wanmory:' },
    { code: 'curl -fsSL https://wanmory.com/uninstall.sh | bash', lang: 'bash' },
    {
      p: 'El script lee primero el .env de la carpeta de instalación y lista los contenedores, la base de datos, la carpeta de datos y los modelos de IA con el espacio que ocupan, además de las carpetas de fotos montadas. Después detiene y elimina los contenedores y la red, y pregunta uno a uno si quieres borrar cada elemento (por defecto se conserva todo):',
    },
    {
      table: ['Elemento', 'Descripción'],
      rows: [
        ['Base de datos', 'El volumen Docker pgdata o la carpeta indicada en WANMORY_DB_DIR. Una vez borrada, las personas, álbumes, ajustes y resultados de IA no se pueden recuperar.'],
        ['Carpeta de datos', 'Miniaturas, vistas previas y fotos originales subidas desde la app web.'],
        ['Modelos de IA', 'Se pueden volver a descargar desde la app web tras reinstalar.'],
        ['Imágenes Docker', 'Incluida la imagen postgres/pgvector; se pueden volver a descargar. Las imágenes que usan otros contenedores no se eliminan.'],
        ['Archivos de configuración', '.env (que contiene la contraseña de la base de datos), docker-compose.yml y docker-compose.override.yml; si la carpeta queda vacía, también se borra.'],
      ],
    },
    {
      ul: [
        'Las carpetas de fotos montadas (NAS, discos externos) nunca se borran.',
        'Para borrar la base de datos o la carpeta de datos hay que escribir DELETE como confirmación.',
        'Si solo eliminas los contenedores y conservas los datos, volver a ejecutar install.sh en la misma carpeta lo recupera todo; si borras .env pero conservas la base de datos, apunta antes el WANMORY_DB_PASSWORD que contiene.',
      ],
    },
    {
      table: ['Opción', 'Descripción'],
      rows: [
        ['`--dir CARPETA`', 'Define la carpeta de instalación; por defecto ~/wanmory.'],
        ['`-y`', 'No interactivo: elimina solo los contenedores y la red, y conserva todos los datos y la configuración.'],
        ['`--purge`', 'No interactivo: borra todos los elementos de la tabla anterior (salvo las carpetas de fotos).'],
        ['`--dry-run`', 'Solo muestra lo que se haría, sin cambiar nada.'],
      ],
    },
  ],
}

export default docs
