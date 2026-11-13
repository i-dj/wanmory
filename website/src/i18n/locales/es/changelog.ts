// Español · Traducción de CHANGELOG.md, por versión, una cadena por punto en el mismo orden.
// El prefijo «修复：» (Corrección) se muestra como icono y aquí se omite.
// Una versión que falte (o con distinto número de puntos) se muestra en el chino original.

const changelog: Record<string, string[]> = {
  'v0.4.7': [
    "Al subir vídeos y otros archivos grandes desde Safari, cada fragmento se atascaba decenas de segundos, con apenas una fracción de MB por segundo en la red local; ahora Safari va tan rápido como Chrome (30 vídeos, 1,9 GB, en 25 segundos en las pruebas)",
    "Ajustes → Procesamiento en segundo plano tiene «Espera tras subir»: la IA espera de 30 segundos a 4 horas después de que terminen las subidas, para no quitar recursos entre tandas; combínala con el horario nocturno para esperar a la noche",
    "Panel de tareas más sencillo arriba a la derecha: una línea corta por tarea — a la izquierda lo que hace o por qué espera, a la derecha el tiempo restante; sin modelos dice simplemente «Descarga primero los modelos en Ajustes»",
    "Mientras se sube o en pausa, la × de arriba a la derecha de la sección de subida lo cancela todo de una vez y conserva las fotos que ya terminaron; el tiempo restante ya no dice «Unos» y el panel más ancho no lo corta",
    "La frase de la página de inicio de sesión ocupa justo dos líneas en todos los idiomas; menús y diálogos son menos transparentes y se leen bien en navegadores sin desenfoque de fondo",
    "Documentación del sitio reescrita: todas las opciones y pasos del script de instalación, qué borra cada opción de desinstalación, cómo actualizar, cuándo trabaja la IA y cómo ejecutar el servicio de IA por separado con uv en macOS / Windows / Linux",
  ],
  'v0.4.6': [
    "El paso «Guardando» tras subir archivos grandes es mucho más rápido: la suma de comprobación se calcula mientras se recibe el archivo, así que ya no se vuelve a leer entero del disco (en una Raspberry Pi, un vídeo de unos cientos de MB tardaba decenas de segundos); para archivos de más de 20 MB, el registro anota la velocidad de recepción y el tiempo de guardado, para ver si el límite es la red o el disco",
    "Imágenes más pequeñas: el servidor usa ahora un ffmpeg de un solo archivo en lugar de más de 300 MB de bibliotecas que no usa, y la descarga se reduce en un tercio; la imagen del servicio de IA ya no incluye su herramienta de empaquetado",
    "«Importando fotos» en el panel de tareas va sumando en todo el lote, en vez de saltar entre 2 y 10 mientras se sube",
    "Nueva frase en la página de inicio de sesión —«Recoge los fragmentos dispersos del tiempo y téjelos en el poema de los años.»—, escrita para cada idioma; se tradujeron varios textos que nunca lo habían estado (horas nocturnas, búsqueda por contenido, cambiar el puerto, contraseña olvidada)",
  ],
  'v0.4.5': [
    "En lotes con vídeos grandes, el análisis con IA empezaba al terminar las fotos aunque los vídeos aún se estuvieran subiendo, compitiendo con la subida; ahora la IA espera mientras quede algún archivo sin terminar (una subida cancelada deja de esperarse al momento, y una sin actividad durante 10 minutos ya no la retiene)",
    "Panel de tareas de arriba a la derecha: lo que hace cada tarea y su progreso (tiempo restante, qué está esperando) van en líneas separadas y saltan de línea si hace falta, en vez de quedar cortados en pocas letras; el panel ya no se desplaza en horizontal",
  ],
  'v0.4.4': [
    "Desde la v0.4.2, Wanmory daba los archivos de la carpeta de datos al usuario del contenedor, así que el usuario del equipo (por ejemplo, un usuario de Raspberry Pi cuyo ID no es 1000) no podía borrar las fotos subidas ni las miniaturas; ahora Wanmory se ejecuta como el dueño de la carpeta de datos, todo lo que escribe le pertenece y los archivos que dejaron versiones anteriores se le devuelven",
    "Los archivos de modelos que descargaba el servicio de IA pertenecían a root y no se podían borrar en el equipo; ahora pasan al dueño de la carpeta de modelos",
    "Script de desinstalación: si un borrado normal se rechaza, borra mediante un contenedor temporal; solo si eso también falla lo indica, con el comando sudo que hay que ejecutar, en lugar de decir a la vez que falló y que se borró",
  ],
  'v0.4.3': [
    "Nueva cápsula de estado arriba a la derecha: mientras las fotos se suben, se importan o pasan por el análisis con IA, aparece a la izquierda de la barra de herramientas y dice en pocas palabras qué está pasando (Subiendo 11 %, Subida completada, Esperando el análisis con IA, Análisis con IA 3 / 674); al pulsarla se ven el progreso de la subida, cada archivo y las tareas en segundo plano. Sustituye a la ventana de subida de abajo a la izquierda y al icono de tareas de arriba del menú",
    "Las subidas siguen al cambiar de página y el progreso se ve en todas; cerrar o recargar la página mientras aún se suben fotos pide confirmación antes",
    "Una subida atascada (la red se cortó un momento, 45 segundos sin progreso) se reconecta sola y sigue desde donde se quedó",
    "Sin los modelos de IA descargados, el reconocimiento de texto integrado seguía funcionando y el progreso parecía un análisis en curso; ahora todo el análisis con IA se pausa hasta descargar los modelos, con un aviso para hacerlo en Ajustes → IA, y empieza solo después",
  ],
  'v0.4.2': [
    "Wanmory no arrancaba y se reiniciaba sin parar cuando la carpeta de datos no pertenecía al usuario del contenedor (por ejemplo, al instalar con sudo o en una Raspberry Pi); ahora corrige el propietario de la carpeta al arrancar, y también funciona en unidades USB y recursos de red donde no se puede cambiar el propietario",
    "Script de instalación: espera hasta 5 minutos antes de decidir si Wanmory arrancó; si se reinicia sin parar, muestra las últimas líneas del registro, y ya no muestra «Installation complete» cuando no arrancó; el aviso final ya no contiene chino; ahora empieza con un banner de bienvenida y la versión que se instala",
  ],
  'v0.4.1': [
    "Verificación en dos pasos: las apps de autenticación muestran ahora la entrada como «Wanmory:usuario», sin el prefijo en chino; si ya la tenías activada, desactívala y vuelve a escanear para ver el nuevo nombre",
  ],
  'v0.4.0': [
    "La interfaz ya está en 12 idiomas: 简体中文, 繁體中文, English, 日本語, 한국어, Deutsch, Français, Español, Português, Русский, Italiano, Tiếng Việt. Se elige en Mi cuenta; por defecto sigue el idioma del navegador y se mantiene al iniciar sesión en otro dispositivo. Las fechas, los números y los nombres de lugares también siguen el idioma",
    "Verificación en dos pasos: actívala en Mi cuenta escaneando un código QR con una app de autenticación (Google Authenticator, Microsoft Authenticator, 2FAS…); al iniciar sesión se pide un código de 6 dígitos después de la contraseña. Recibes 10 códigos de recuperación para cuando no tengas el móvil a mano",
    "Nuevo selector de avatar: arriba una vista previa de recorte que puedes arrastrar y ampliar, y abajo eliges entre subir una imagen, una foto de la fototeca, el avatar predeterminado o un dibujo",
    "Todos los diálogos tienen ahora el mismo aspecto: icono, título y descripción centrados, con dos botones del mismo ancho debajo; eliminar un miembro, un álbum o un modelo usa la misma confirmación",
    "Con fotos seleccionadas, Más ofrece ahora Compartir…: usa el menú de compartir del sistema para enviarlas por correo (las fotos ya van adjuntas), por AirDrop o a otras apps; la fototeca debe abrirse por https o localhost",
    "Al ordenar por fecha de adición, la línea de tiempo de la derecha y los grupos de fechas sobre las fotos también usan esa fecha",
    "Seguridad: tras varias contraseñas incorrectas se bloquea el inicio de sesión durante un rato; el sitio no puede incrustarse en otras webs y los archivos subidos nunca se ejecutan como páginas web; el dominio de la red local se cambia directamente en los ajustes del sistema",
    "El aviso de subida completada desaparece a los 10 segundos",
    "El fondo daba tirones al abrir un diálogo de confirmación",
  ],
  'v0.3.1': [
    "El mapa de Lugares ahora se puede ampliar, reducir y arrastrar: zoom con la rueda del ratón o el trackpad, doble clic para ampliar, arrastrar para moverse, pellizcar con dos dedos en el móvil, y botones abajo a la derecha para ampliar, reducir o ver el mundo entero; al acercarse a nivel de país cambia a un mapa de calles (hay que activar los mapas en línea) con ciudades, carreteras y nombres de lugares, y las chinchetas de fotos se van dividiendo al ampliar, hasta cada lugar de toma; al volver de las fotos, el mapa sigue donde estaba",
    "Sitio web: el calendario de la página de versiones ahora es un calendario mensual con los números de versión de cada día, y al hacer clic en una versión se salta a sus notas; corregido que a veces las páginas se cargaran sin estilos con conexiones lentas o justo después de actualizar el sitio",
  ],
  'v0.3.0': [
    "Nuevo sitio web: inicio, arquitectura, instalación y documentación, preguntas frecuentes, versiones y comentarios, en 12 idiomas; sigue por defecto el idioma del navegador y se puede cambiar al pie de la página",
    "Scripts de instalación y desinstalación en un solo comando (install.sh, uninstall.sh): durante la instalación puedes configurar el puerto, el dominio, la contraseña y la ubicación de la base de datos, la zona horaria, el directorio de datos y el de fotos; tú decides dónde se guardan la base de datos, los datos y los modelos (WANMORY_DB_DIR, WANMORY_DATA_DIR, WANMORY_MODELS_DIR), y WANMORY_DOMAIN define el dominio para acceder desde tu red local",
    "Lugares ahora es un mapa del mundo plano: los países visitados aparecen en un color cálido, cada ciudad tiene una chincheta con una foto y el nombre de la ciudad y el país, y al hacer clic se abren las fotos tomadas allí; arriba a la derecha solo queda Mapa / Cuadrícula, y se han eliminado el mapa de calles y el globo satelital",
    "La página de Álbumes usa tarjetas grandes: portada cuadrada con el nombre y el número de elementos debajo, un candado en los álbumes privados y el nombre de quien creó los álbumes ajenos; eliminar un álbum usa el cuadro de confirmación estándar, y Añadir fotos dentro de un álbum ahora es un botón principal destacado",
    "La página de Personas muestra retratos grandes 3:4 con el nombre y el número debajo; haz clic en un nombre para cambiarlo. La cabecera de cada persona es más sencilla: avatar, nombre y edad, con los años y el número de fotos y vídeos en la línea de abajo, y a la derecha las pestañas Fotos, Crecimiento, Lugares y Juntos; las tarjetas de Crecimiento, Juntos y Lugares tienen el mismo tamaño que en las páginas de Personas y Álbumes",
    "Todos los títulos de página ocupan ahora una sola línea: el título grande seguido de una descripción en gris",
    "En móviles y otras pantallas estrechas hay una barra con el logotipo arriba, y el menú se desliza desde la derecha",
    "Cuenta de demostración: la cuenta llamada demo (se puede cambiar con WANMORY_DEMO_USER) no puede cambiar su contraseña, cerrar sesión en otros dispositivos ni eliminar nada; sí puede subir, y eliminar las fotos que subió y los álbumes que creó en los últimos 30 minutos",
    "Mejoras en los recuerdos destacados, el historial de inicios de sesión, los avatares, la puntuación estética, la ubicación por IP y más",
  ],
  'v0.2.9': [
    'Logotipo nuevo: una «M» de un solo trazo dentro de un círculo fino, con un punto rojo; las pestañas del navegador también muestran ya un icono',
    'El menú izquierdo se puede plegar en una barra estrecha solo con iconos (pulsa el logotipo para desplegarlo); ahora se divide en tres grupos: Principal, Categorías y Organizar. Categorías incluye Favoritos, Valoración, Vídeos, Paisajes, Comida, Animales y Plantas, con Capturas, Documentos y Carnés en «Más»',
    'Nueva categoría «Plantas», y «Mascotas» pasa a llamarse «Animales» (también cuentan aves y animales del zoo); buscar el nombre de una categoría (Comida, Paisajes…) muestra directamente sus fotos',
    'Nueva página «Mi cuenta»: pulsa el avatar abajo a la izquierda del menú para cambiar avatar, nombre y contraseña, ver los dispositivos con sesión abierta (navegador, IP, último uso) y cerrar sesión en los demás; el tema también se ajusta aquí',
    'Los ajustes del sistema ahora son una serie de tarjetas: Miembros, Modo de ejecución de IA (con prueba de conexión y aviso si falla), Dispositivo de cálculo, Nivel de modelos (los modelos descargados se pueden borrar), Procesamiento en segundo plano, Carpeta de subidas, Acceso de invitados, Mapas en línea y Actualización del sistema; los modelos se descargan automáticamente de la fuente más rápida, Hugging Face o un espejo en China',
    'Todas las ventanas emergentes comparten ahora un aspecto de vidrio esmerilado translúcido, con botones principales y secundarios; los errores al añadir un miembro o cambiar la contraseña aparecen dentro de la propia ventana',
    'Los «Ajustes para compartir» de un álbum pasan a llamarse «Permisos»: Todos, Miembros concretos, Solo yo',
    'Fondo más oscuro en el modo oscuro; todos los botones y selectores segmentados de la app comparten ahora un mismo estilo',
    'El icono de tareas en segundo plano seguía girando y mostrando 0 después de terminar todas las tareas',
  ],
  'v0.2.8': [
    'La zona de contenido pasa a tener fondo blanco (para colores más fieles) y el menú izquierdo es beige; el almacenamiento al pie del menú es ahora una pequeña tarjeta blanca',
    'El botón de reproducir es ahora solo un icono redondo naranja que muestra «Presentación» al pasar el ratón',
    'Cabecera de la página de una persona más limpia: sin degradado y con un borde fino, avatar, nombre, edad y cumpleaños arriba y cuatro estadísticas debajo; el cumpleaños se fija o cambia justo debajo del nombre, y la cabecera es idéntica en las pestañas Fotos, Crecimiento, Lugares y Juntos',
  ],
  'v0.2.7': [
    'Un aspecto cálido totalmente nuevo: fondo blanco roto, acento naranja teja y una fuente con serifa para títulos, nombres, recuerdos y fechas; un logotipo naranja nuevo',
    'Todas las páginas tienen ahora un cuadro de búsqueda arriba (busca en toda la fototeca); el calendario, el orden, el filtro y el tamaño de vista de la derecha se agrupan en un solo conjunto de botones, y reproducir es ahora en todas partes un botón naranja «Presentación»',
    'Las fotos de la fototeca, los favoritos, los álbumes y las personas se agrupan por meses, con cada grupo encabezado como «Noviembre de 2026»',
    '«Un día como hoy» es ahora una tarjeta grande de una sola foto',
    'Nueva cabecera de la página de una persona: avatar grande, edad y cumpleaños, estadísticas de fotos, vídeos, años que abarca y lugares visitados, y las personas con las que suele aparecer',
    'El menú izquierdo está siempre visible (ya no se pliega al abrir una persona o un álbum) y muestra el almacenamiento usado abajo; «Subir archivos» pasa a llamarse «Subir fotos / vídeos»',
    'Un solo clic en una foto la abre a tamaño grande (clic con ⌘ / Ctrl o ⇧ para seleccionar varias); las fotos aparecen con un fundido al cambiar de página',
    'Los botones de arriba a la derecha y la cronología de la derecha saltaban al cambiar de página, la pantalla parpadeaba al abrir una persona y la animación del menú iba a tirones en el iPad',
    'Los diálogos y los menús tienen ahora fondo blanco opaco; la barra de acciones de las fotos seleccionadas, las tareas en segundo plano y la ventana de subida usan un vidrio esmerilado claro',
    '¿Olvidaste la contraseña (aunque seas el único administrador o hayas olvidado también el nombre)? En el equipo donde funciona la app, ejecuta `docker compose exec server wanmory reset-password`; consulta «Contraseña olvidada» en el README',
  ],
  'v0.2.6': [
    'La barra de título de arriba de cada página tiene ahora la misma altura y posición, así que títulos y botones ya no saltan al cambiar de página',
    'Al cambiar de página ya no se ven por un instante las fotos de la página anterior',
    'En el modo claro, la zona de contenido y el menú izquierdo comparten el mismo fondo',
    'Se añade «Cerrar sesión» al pie del menú; la rueda de ajustes del sistema se oculta a quien no es administrador (pulsa tu avatar y tu nombre para tus propios ajustes)',
    'Todo lo que se puede pulsar muestra un cursor de mano al pasar por encima',
  ],
  'v0.2.5': [
    'Panel de tareas en segundo plano simplificado: caras, contenido y texto se unen en una fila «Reconocimiento con IA», y metadatos y miniaturas en «Importar fotos»; ambas muestran el progreso por número de fotos con el tiempo restante estimado',
    'Con el nivel Automático, el nivel se decide antes y el procesamiento empieza más rápido aunque el servicio de IA esté ocupado justo después de arrancar',
  ],
  'v0.2.4': [
    'El servicio de IA usa menos memoria: los modelos sin uso se descargan solos (tras 5 minutos en equipos con menos de 8 GB, 30 minutos en los demás), los modelos del nivel anterior se liberan al cambiar de nivel y en los equipos con poca memoria no se reserva ningún bloque. En una Raspberry Pi, el servicio de IA apenas ocupa memoria mientras no procesa fotos',
    'Nuevo nivel Automático (el predeterminado si no se ha elegido nivel): se elige según el hardware del servidor de IA, Alta precisión con GPU y, solo con CPU, Ligero por debajo de 6 GB de memoria y Equilibrado por encima; cambia contigo si cambias de servidor de IA. El procesamiento de IA no empieza hasta que se decide el nivel',
  ],
  'v0.2.3': [
    'Las tareas en segundo plano seguían mostrando «IA en pausa: hay fotos subiéndose» mucho después de terminar las subidas. Ahora solo cuentan las subidas que realmente están transfiriendo datos, y la IA sigue 30 segundos después de que terminen',
    'La cabecera de la fototeca ya no muestra «Procesando / Terminado»; el progreso solo se ve en el icono de tareas de la parte superior del menú',
  ],
  'v0.2.2': [
    'El número de versión aparece arriba del menú; nueva sección «Actualización del sistema» en los ajustes: muestra las versiones de la app y del servicio de IA, avisa cuando hay una versión nueva y lista sus novedades',
    'Las notas de versión se generan automáticamente al publicar una versión nueva',
  ],
  'v0.2.1': [
    'El procesamiento en segundo plano se adapta al equipo: cuántas fotos procesa la IA a la vez y cuántos hilos usa cada modelo dependen de si hay GPU, del número de núcleos y de la memoria, así que una Raspberry Pi ya no se atasca',
    'Momento del procesamiento de IA: En reposo (por defecto; se pausa mientras alguien sube fotos o se generan miniaturas), Siempre o Solo de noche',
    'Nueva sección «Rendimiento» en los ajustes para cambiar todo lo anterior a mano; el nivel de IA se recomienda según el hardware del servidor',
    'Icono de tareas en segundo plano arriba del menú: aparece cuando hay tareas en curso y, al abrirlo, muestra el progreso de cada tipo de tarea y si la IA está en pausa',
    'El docker-compose.yml de instalación incluye ahora la base de datos, así que basta con un solo archivo para instalar',
  ],
  'v0.2.0': [
    'Acceso de invitados: ver en solo lectura las fotos y los álbumes compartidos sin iniciar sesión (se puede desactivar en los ajustes)',
    'Nueva ventana de inicio de sesión',
    'Los álbumes pueden ser privados o compartirse solo con miembros concretos; un álbum privado puede además ocultar las fotos que subiste a él',
  ],
  'v0.1.0': ['Primera versión: fototeca, álbumes, personas (reconocimiento facial), lugares, favoritos, valoraciones, búsqueda semántica y reconocimiento de texto'],
}

export default changelog
