import type { DocsDict } from '../zh/docs'

// Português (Brasil) · Documentação

const docs: DocsDict = {
  title: 'Documentação',
  onThisPage: 'Nesta seção',
  reportIssue: 'Relatar erro na documentação ↗',
  architecture: 'Arquitetura →',
  backToTop: 'Voltar ao topo ↑',
  sectionLink: 'Link para esta seção',
  toc: [
    {
      key: 'install',
      title: 'Instalação',
      groups: [
        {
          group: 'Primeiros passos',
          items: [
            ['intro', 'Introdução'],
            ['requirements', 'Requisitos do sistema'],
            ['quick-start', 'Instalação rápida'],
          ],
        },
        {
          group: 'Configuração',
          items: [
            ['compose', 'docker-compose.yml explicado'],
            ['env', 'Variáveis de ambiente'],
            ['library', 'Montar pastas de fotos existentes'],
            ['mdns', 'Domínio local (mDNS)'],
            ['proxy', 'Proxy reverso e acesso pela internet'],
          ],
        },
        {
          group: 'Serviço de IA',
          items: [
            ['ai-overview', 'Modos de execução'],
            ['ai-remote', 'Serviço de IA em outra máquina'],
            ['ai-models', 'Níveis de modelos e download'],
            ['ai-env', 'Variáveis do serviço de IA'],
          ],
        },
      ],
    },
    {
      key: 'guide',
      title: 'Guia de uso',
      groups: [
        {
          group: 'O básico',
          items: [
            ['first-run', 'Configuração inicial e primeiro acesso'],
            ['import', 'Envio e importação'],
            ['browse', 'Navegar, buscar e organizar'],
            ['members-usage', 'Membros e permissões'],
          ],
        },
        {
          group: 'Configurações do sistema',
          items: [
            ['settings-members', 'Membros e histórico de acessos'],
            ['settings-ai', 'Configurações de IA'],
            ['settings-perf', 'Desempenho e recursos'],
            ['settings-general', 'Armazenamento, visitantes, mapas e domínio'],
            ['settings-update', 'Atualização do sistema'],
          ],
        },
      ],
    },
    {
      key: 'maintain',
      title: 'Manutenção',
      groups: [
        {
          group: 'Manutenção',
          items: [
            ['backup', 'Backup e restauração'],
            ['reset-password', 'Redefinir a senha de administrador'],
            ['troubleshooting', 'Solução de problemas'],
            ['uninstall', 'Desinstalação'],
          ],
        },
      ],
    },
  ],
  intro:
    'Esta documentação é para administradores que hospedam o Wanmory num NAS, servidor doméstico ou computador pessoal. Ela cobre instalação, configuração, implantação do serviço de IA, uso diário, configurações do sistema e manutenção. Para o design do sistema e os algoritmos, veja [Arquitetura](/architecture/).',
  blocks: [
    { h2: 'intro' },
    {
      p: 'O Wanmory é uma biblioteca de fotos privada com IA, de código aberto e auto-hospedada. Ele é formado por quatro contêineres: o backend em Go (`server`), o serviço de inferência de IA em Python (`ml`), o banco de dados PostgreSQL + pgvector (`postgres`) e o `mdns`, que anuncia o domínio local. Todas as fotos, metadados, vetores e a fila de tarefas ficam armazenados localmente, sem depender de nenhum serviço em nuvem.',
    },
    {
      ul: [
        'Gestão de fotos: linha do tempo agrupada por mês, álbuns e álbuns inteligentes, limpeza de sequências e fotos parecidas, mapa de viagens e apresentações de slides.',
        'Recursos de IA: detecção e agrupamento de rostos, busca em linguagem natural (Chinese-CLIP), reconhecimento de texto (PP-OCR) e nota estética (escolhas da IA).',
        'Vários membros: contas individuais, permissão de exclusão conforme quem enviou e histórico de acessos.',
      ],
    },

    { h2: 'requirements' },
    {
      table: ['Item', 'Mínimo', 'Recomendado'],
      rows: [
        ['Arquitetura da CPU', 'x86_64 (amd64) ou ARM64', '—'],
        ['Processador', 'Classe Intel N100 / Raspberry Pi 5', 'Classe Intel i5 ou superior, ou o serviço de IA numa máquina com GPU'],
        ['Memória', '4 GB (o nível "Leve" é escolhido automaticamente)', '8 GB ou mais (nível "Equilibrado")'],
        ['Disco', 'Cerca de 1–4 GB para modelos, mais espaço para miniaturas', 'Um SSD para data/ e o volume do banco de dados'],
        ['Software', 'Docker Engine e Docker Compose v2', '—'],
        ['Sistema operacional', 'Qualquer distribuição Linux que rode Docker', 'Synology DSM, QNAP QTS, TrueNAS SCALE, Unraid, Ubuntu / Debian'],
      ],
    },
    {
      note: 'As imagens são publicadas para `linux/amd64` e `linux/arm64`, e o Docker baixa a que combina com sua arquitetura. Contêineres Docker no macOS não conseguem usar a GPU da Apple; para aceleração de hardware num Mac, veja [Serviço de IA em outra máquina](#ai-remote).',
    },

    { h2: 'quick-start' },
    { h3: 'Opção 1: script de instalação (recomendado)' },
    { p: 'Numa máquina de 64 bits com Docker instalado, rode:' },
    { code: 'curl -fsSL https://wanmory.com/install.sh | bash', lang: 'bash' },
    { p: 'O script faz o seguinte, nesta ordem:' },
    {
      ul: [
        'Verificação do ambiente: arquitetura da CPU (amd64 / arm64) e espaço de usuário de 64 bits, se o Docker e o Docker Compose v2 estão disponíveis, memória e espaço em disco livres.',
        'Configuração interativa: pasta de instalação (padrão ~/wanmory), porta de acesso (padrão 8080, verifica se está ocupada), domínio local (padrão wanmory.local), senha do banco de dados (aleatória por padrão) e local do banco (padrão: volume Docker pgdata, ou uma pasta num disco local) e fuso horário (digite uma cidade ou região para buscar, como shanghai, tokyo ou 北京, e escolha um número se houver várias correspondências).',
        'Locais de armazenamento: pasta de dados (miniaturas, prévias e fotos enviadas, padrão ./data) e pasta de modelos de IA (padrão ./models).',
        'As perguntas e mensagens do script são em inglês para aparecerem corretamente em qualquer terminal de NAS.',
        'Pastas de fotos existentes: adicione quantas quiser, escolhendo para cada uma montagem só para leitura (recomendado) ou de leitura e gravação.',
        'Cria o `.env` (permissão 600); se houver pastas de fotos, cria também o `docker-compose.override.yml`, que o Docker Compose combina automaticamente.',
        'Baixa o docker-compose.yml oficial (pelo Gitee se o GitHub não responder), valida a configuração, baixa as imagens, inicia os serviços e mostra o endereço quando tudo estiver pronto.',
      ],
    },
    {
      table: ['Opção / variável', 'Descrição'],
      rows: [
        ['`-y`', 'Não pergunta nada e usa todos os valores padrão (senha do banco aleatória). Para instalações automatizadas.'],
        ['`--dir PASTA`', 'Define a pasta de instalação.'],
        ['`--dry-run`', 'Só verifica o ambiente e cria os arquivos de configuração; não baixa imagens nem inicia nada.'],
        [
          '`WANMORY_PORT`',
          'Define a porta de antemão; o mesmo vale para WANMORY_DOMAIN, WANMORY_DB_PASSWORD, WANMORY_TZ, WANMORY_DATA_DIR, WANMORY_MODELS_DIR, WANMORY_DB_DIR, WANMORY_REGISTRY e WANMORY_VERSION.',
        ],
        ['`WANMORY_PHOTOS`', 'Pastas de fotos separadas por vírgula, montadas só para leitura por padrão; acrescente :rw a um caminho para leitura e gravação, ex.: /volume1/photo,/mnt/usb:rw.'],
      ],
    },
    {
      code: `# Exemplo: instalação não interativa em /opt/wanmory, na porta 9000, com pastas de fotos do NAS
curl -fsSL https://wanmory.com/install.sh | WANMORY_PORT=9000 WANMORY_PHOTOS=/volume1/photo,/volume2/family bash -s -- -y --dir /opt/wanmory`,
      lang: 'bash',
    },
    {
      note: 'Se você rodar o script de novo e a pasta de instalação já tiver um .env, a configuração existente é mantida por padrão (a senha do banco não pode ser trocada livremente depois da primeira inicialização); só o arquivo Compose é atualizado e os serviços reiniciados, o que também serve como atualização.',
    },
    { h3: 'Opção 2: instalação manual' },
    {
      steps: [
        {
          title: 'Crie uma pasta e baixe o arquivo Compose',
          body: [
            { p: 'Crie uma pasta para o arquivo Compose, os dados e os modelos, e baixe o `docker-compose.yml` oficial:' },
            {
              code: `mkdir -p ~/wanmory && cd ~/wanmory
curl -fsSLO https://raw.githubusercontent.com/i-dj/wanmory/main/docker/docker-compose.yml`,
              lang: 'bash',
            },
          ],
        },
        {
          title: '(Opcional) Escreva um .env',
          body: [
            { p: 'Crie um `.env` na mesma pasta para mudar os valores padrão. Em produção, troque sem falta a senha do banco de dados:' },
            {
              code: `WANMORY_DB_PASSWORD=troque-por-uma-sequencia-aleatoria
WANMORY_PORT=8080
WANMORY_TZ=America/Sao_Paulo
WANMORY_VERSION=latest`,
              lang: '.env',
            },
          ],
        },
        {
          title: 'Inicie os serviços',
          body: [
            { p: 'A primeira inicialização baixa as imagens e roda as migrações do banco automaticamente:' },
            {
              code: `docker compose up -d
docker compose ps        # confira se os quatro serviços estão running / healthy`,
              lang: 'bash',
            },
          ],
        },
        {
          title: 'Acesse e configure',
          body: [
            {
              p: 'Abra `http://wanmory.local:8080` (ou `http://<IP da máquina>:8080`) no navegador, crie a conta de administrador como indicado e baixe os modelos em "Configurações do sistema → IA". Depois do download, as fotos existentes entram sozinhas na fila de IA.',
            },
          ],
        },
      ],
    },

    { h2: 'compose' },
    {
      p: 'O arquivo Compose oficial define quatro serviços: o banco de dados `postgres`, o backend `server`, o anunciador do domínio local `mdns` e o serviço de IA embutido `ml`. A função de cada configuração está anotada no próprio arquivo:',
    },
    {
      lang: 'yaml',
      code: `# Arquivo Compose oficial do Wanmory: rode docker compose up -d na pasta deste arquivo
# Variáveis no formato \${VAR:-padrão} são lidas do .env da mesma pasta; sem valor, vale o padrão

services:
  # ── Banco de dados: PostgreSQL 17 + pgvector ─────────────────────
  # Guarda metadados das fotos, pessoas, álbuns, configurações, fila de tarefas e vetores (índice HNSW)
  # Nenhuma porta publicada; acessível só pela rede interna do Compose
  postgres:
    image: pgvector/pgvector:pg17
    environment:
      POSTGRES_USER: wanmory
      POSTGRES_PASSWORD: \${WANMORY_DB_PASSWORD:-wanmory}   # em produção, troque sem falta no .env
      POSTGRES_DB: wanmory
    volumes:
      - \${WANMORY_DB_DIR:-pgdata}:/var/lib/postgresql/data  # volume nomeado pgdata por padrão; com WANMORY_DB_DIR, essa pasta. Inclua nos backups
    healthcheck:                             # o server espera esta verificação e inicia quando o banco estiver pronto
      test: ["CMD", "pg_isready", "-U", "wanmory", "-d", "wanmory"]
      interval: 5s
      timeout: 3s
      retries: 20
    restart: unless-stopped

  # ── Backend: binário Go com o app web embutido ───────────────────
  # Cuida da API, uploads (tus), agendamento de tarefas, miniaturas e permissões; migra o banco ao iniciar
  server:
    image: \${WANMORY_REGISTRY:-ghcr.io/i-dj}/wanmory-server:\${WANMORY_VERSION:-latest}
    environment:
      DATABASE_URL: postgres://wanmory:\${WANMORY_DB_PASSWORD:-wanmory}@postgres:5432/wanmory
      WANMORY_ML_URL: http://ml:3003         # endereço do serviço de IA embutido; um remoto é configurado em "Configurações de IA"
      TZ: \${WANMORY_TZ:-Asia/Shanghai}       # fuso usado quando o EXIF não informa
      WANMORY_MDNS: "off"                    # este contêiner não recebe multicast na rede bridge; o serviço mdns abaixo anuncia o domínio
      WANMORY_HTTP_PUBLIC_PORT: \${WANMORY_PORT:-8080}   # porta exibida no app web; mantenha igual ao mapeamento de portas
      WANMORY_DOMAIN: \${WANMORY_DOMAIN:-wanmory.local}  # domínio local inicial; depois de alterado nas configurações web, vale a configuração
    ports:
      - "\${WANMORY_PORT:-8080}:8080"         # porta da máquina:porta do contêiner
    volumes:
      - \${WANMORY_DATA_DIR:-./data}:/data    # upload/ guarda os originais enviados, thumbs/ as miniaturas e prévias de 1440 px
      # Monte as pastas de fotos existentes como subpastas de /photos, quantas quiser; :ro = só leitura; varridas a cada 15 minutos
      # - /mnt/nas/photos:/photos/nas:ro
      # - /media/usb/camera:/photos/usb:ro
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  # ── Anúncio do domínio local (mDNS) ──────────────────────────────
  # Mesma imagem do server, roda só o subcomando mdns; anuncia wanmory.local (pode ser alterado no app web)
  mdns:
    image: \${WANMORY_REGISTRY:-ghcr.io/i-dj}/wanmory-server:\${WANMORY_VERSION:-latest}
    command: ["mdns"]
    network_mode: host                       # é preciso a rede da máquina para enviar e receber multicast local
    environment:
      WANMORY_URL: http://127.0.0.1:\${WANMORY_PORT:-8080}   # consulta periodicamente o server sobre o domínio atual
      WANMORY_DOMAIN: \${WANMORY_DOMAIN:-wanmory.local}  # anunciado enquanto o server não responder
    depends_on:
      - server
    restart: unless-stopped

  # ── Serviço de IA embutido: FastAPI + ONNX Runtime, só CPU ───────
  # Sem estado; recebe as prévias do server e devolve rostos, vetores e texto; nenhuma porta publicada
  ml:
    image: \${WANMORY_REGISTRY:-ghcr.io/i-dj}/wanmory-ml:\${WANMORY_VERSION:-latest}
    volumes:
      - \${WANMORY_MODELS_DIR:-./models}:/models  # guarda os modelos, assim recriar o contêiner não baixa tudo de novo
    environment:
      WANMORY_MODEL_DIR: /models
      WANMORY_AUTO_DOWNLOAD: "0"             # sem download automático; um administrador confirma licenças e espaço no app web antes
    restart: unless-stopped

volumes:
  pgdata:`,
    },

    { h2: 'env' },
    { h3: '.env (variáveis do Compose)' },
    { p: 'Estas variáveis são usadas no `docker-compose.yml`; coloque-as no `.env` da mesma pasta para aplicá-las:' },
    {
      table: ['Variável', 'Padrão', 'Descrição'],
      rows: [
        ['`WANMORY_DB_PASSWORD`', 'wanmory', 'Senha do PostgreSQL, também usada na DATABASE_URL do server. Trocá-la depois da primeira inicialização exige trocar também a senha do usuário dentro do banco.'],
        ['`WANMORY_PORT`', '8080', 'Porta publicada na máquina, usada também no endereço exibido pelo app web.'],
        ['`WANMORY_TZ`', 'Asia/Shanghai', 'Fuso horário usado quando os dados EXIF não informam.'],
        ['`WANMORY_VERSION`', 'latest', 'Tag da imagem; fixe uma versão para decidir quando atualizar.'],
        ['`WANMORY_REGISTRY`', 'ghcr.io/i-dj', 'Registro de imagens. Troque por um acessível se o ghcr.io não estiver disponível.'],
        ['`WANMORY_DATA_DIR`', './data', 'Pasta de dados: originais enviados (upload/) e miniaturas e prévias (thumbs/), montada em /data no contêiner.'],
        ['`WANMORY_MODELS_DIR`', './models', 'Pasta de modelos de IA, montada em /models no contêiner ml.'],
        [
          '`WANMORY_DB_DIR`',
          'volume pgdata',
          'Pasta do banco de dados. Sem valor, usa o volume Docker pgdata; com o caminho de uma pasta num disco local, o banco fica guardado lá. Não use pastas compartilhadas em rede.',
        ],
        ['`WANMORY_DOMAIN`', 'wanmory.local', 'Domínio local inicial; precisa terminar em .local. Depois de alterado em "Configurações do sistema → Domínio de acesso", vale a configuração.'],
      ],
    },
    { h3: 'Contêiner server (opcional)' },
    {
      p: '`DATABASE_URL`, `WANMORY_ML_URL`, `WANMORY_MDNS` e `WANMORY_HTTP_PUBLIC_PORT` já estão no arquivo Compose, com a finalidade anotada. As variáveis a seguir não estão no arquivo padrão; adicione-as ao `environment` do `server` se precisar:',
    },
    {
      table: ['Variável', 'Padrão', 'Descrição'],
      rows: [
        ['`WANMORY_WORKERS`', 'automático', 'Paralelismo padrão das tarefas de metadados e miniaturas. Sem valor, é calculado pelos núcleos e pela memória; pode ser ajustado em "Desempenho" no app web.'],
        ['`WANMORY_ML_TOKEN`', 'vazio', 'Token de acesso do serviço de IA embutido; precisa ser igual à variável de mesmo nome no contêiner ml. Normalmente não é necessário.'],
        ['`WANMORY_FACE_MODEL`', 'antelopev2', 'Modelo de rostos usado quando nenhum nível foi escolhido.'],
        ['`WANMORY_CLIP_MODEL`', 'chinese-clip-vit-h-14', 'Modelo de busca semântica usado quando nenhum nível foi escolhido.'],
        ['`WANMORY_STORAGE_ROOTS`', 'pasta de dados', 'Pastas que podem ser navegadas e escolhidas no app web, separadas por dois-pontos.'],
      ],
    },

    { h2: 'library' },
    {
      p: 'Fotos que já estão num NAS ou disco externo não precisam ser enviadas. Monte a pasta como subpasta de `/photos` dentro do contêiner: ela é varrida a cada 15 minutos e os arquivos novos são **importados no lugar** (sem copiar nem mover); depois passam pela leitura de metadados, pelas miniaturas e pela IA como as fotos enviadas.',
    },
    {
      lang: 'yaml',
      code: `  server:
    volumes:
      - ./data:/data
      - /mnt/nas/photos:/photos/nas:ro       # :ro monta só para leitura
      - /media/usb/camera:/photos/usb:ro
      - /home/eu/Imagens:/photos/pictures     # montagem de leitura e gravação`,
    },
    { p: 'Depois da mudança, rode `docker compose up -d`. A primeira varredura começa cerca de 20 segundos após o reinício do contêiner.' },
    {
      ul: [
        '**Recomenda-se montar só para leitura (:ro)**: o sistema não grava nada nessas pastas. Apagar uma foto no app só a move para "Apagadas recentemente", a exclusão definitiva nunca apaga o arquivo original e as varreduras seguintes não o importam de novo. Em pastas de leitura e gravação, a exclusão definitiva também apaga o arquivo original.',
        'Arquivos com conteúdo idêntico são importados uma só vez (comparação pela soma SHA-1), incluindo arquivos já enviados e duplicatas entre pastas.',
        'Pastas ocultas e pastas de sistema do NAS (.xxx, @eaDir, #recycle etc.) são ignoradas automaticamente.',
        'Fotos importadas das pastas não pertencem a nenhum membro; só os administradores podem apagá-las.',
      ],
    },

    { h2: 'mdns' },
    {
      p: 'O serviço `mdns` roda no modo de rede da máquina e anuncia o domínio de acesso na rede local (padrão `wanmory.local`). macOS, iOS, iPadOS e Windows 10 ou posterior acessam em `http://wanmory.local:8080` sem configurar o roteador. O domínio pode ser trocado em "Configurações do sistema → Domínio de acesso" e precisa terminar em `.local`.',
    },
    {
      note: 'Alguns aparelhos Android não resolvem nomes mDNS; use o endereço IP. Se a porta 5353 já estiver ocupada (por exemplo, no Synology), o serviço mdns pode não iniciar; nesse caso, use o IP também. O restante não é afetado.',
      warn: true,
    },

    { h2: 'proxy' },
    {
      p: 'Os uploads web usam o protocolo retomável [tus](https://tus.io) (`/api/uploads/`) com blocos de 16 MB. Atrás de um proxy reverso, libere o limite de tamanho das requisições e desligue o buffer de requisições. Exemplo com Nginx:',
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
    client_max_body_size 0;          # sem limite de tamanho (no mínimo 20m)
    proxy_request_buffering off;     # repassar em fluxo, sem gravar no disco do proxy
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
}`,
    },
    {
      note: 'Antes de expor à internet: use HTTPS, desligue o acesso de visitantes nas configurações do sistema e defina senhas fortes para todos os membros. O plano gratuito da Cloudflare limita cada requisição a 100 MB, então blocos de 16 MB não exigem nada a mais.',
      warn: true,
    },

    { h2: 'ai-overview' },
    {
      p: 'O serviço de IA é um serviço HTTP sem estado: recebe prévias de 1440 pixels do backend e devolve rostos, vetores e texto reconhecido. Ele nunca acessa o banco de dados nem guarda arquivos. O backend tem dois modos, trocados em "Configurações do sistema → IA → Modo de execução da IA":',
    },
    {
      table: ['Modo', 'Onde roda', 'Indicado para'],
      rows: [
        ['Embutido (só CPU)', 'O contêiner ml do Compose, acessível só na rede interna', 'Pronto para usar; NAS ou mini PC com biblioteca moderada, ou quando um primeiro processamento mais longo é aceitável'],
        ['Serviço remoto', 'Outra máquina da rede local, rodando o serviço Python diretamente', 'Mac com Apple Silicon (CoreML / MPS) ou máquina com GPU NVIDIA (CUDA), encurtando bastante o primeiro processamento'],
      ],
    },
    { p: 'Quando o serviço de IA não está disponível, as tarefas de IA ficam na fila e deixam de ser pegas, sem gastar repetições; o processamento continua sozinho quando o serviço volta. Navegação, uploads e o resto não são afetados.' },

    { h2: 'ai-remote' },
    { h3: 'Opção 1: direto num Mac ou máquina com GPU (recomendado)' },
    {
      p: 'Rodando direto, o serviço usa aceleração de hardware: no Apple Silicon, os modelos de rosto usam CoreML e o Chinese-CLIP usa MPS; em GPUs NVIDIA, o Chinese-CLIP usa CUDA em meia precisão (cerca de 1,9 GB de VRAM / memória). Instale antes o [uv](https://docs.astral.sh/uv/).',
    },
    {
      lang: 'bash',
      code: `git clone https://github.com/i-dj/wanmory.git
cd wanmory/ml
uv sync --extra torch                 # instalar as dependências do PyTorch (busca semântica acelerada por GPU)

# Gere um token de acesso; o backend e o serviço de IA usam o mesmo valor
export WANMORY_ML_TOKEN=$(openssl rand -hex 24)
echo $WANMORY_ML_TOKEN

WANMORY_FACE_MODEL_PRELOAD=1 uv run --extra torch python -m wanmory_ml
# Escuta em 0.0.0.0:3003 por padrão; mude com WANMORY_ML_HOST / WANMORY_ML_PORT`,
    },
    { h3: 'Opção 2: a imagem Docker em outra máquina' },
    { p: 'Para uma máquina x86 mais potente sem GPU utilizável; a imagem usa só a CPU:' },
    {
      lang: 'bash',
      code: `docker run -d --name wanmory-ml --restart unless-stopped \\
  -p 3003:3003 \\
  -e WANMORY_ML_TOKEN=<token-de-acesso> \\
  -v $PWD/models:/models \\
  ghcr.io/i-dj/wanmory-ml:latest`,
    },
    { h3: 'Ativar o serviço remoto no backend' },
    {
      steps: [
        { title: 'Abra as configurações de IA', body: [{ p: 'Como administrador, vá em "Configurações do sistema → IA → Modo de execução da IA" e escolha "Serviço remoto".' }] },
        {
          title: 'Informe o endereço e o token',
          body: [{ p: 'O endereço tem o formato `http://192.168.1.20:3003`; informe o token gerado no passo anterior. Antes de salvar, a conexão é testada e a latência e a versão do serviço são exibidas.' }],
        },
        { title: 'Confirme o nível e os modelos', body: [{ p: 'Depois de conectar, um nível "Automático" é recalculado pelo hardware da máquina remota; baixe os modelos necessários em "Nível de modelos".' }] },
      ],
    },
    { note: 'Deixe o serviço de IA remoto acessível só na rede local ou por VPN (como o Tailscale) e sempre defina um token. Para conectar pela internet, use um proxy reverso com HTTPS.', warn: true },

    { h2: 'ai-models' },
    {
      p: 'O nível define quais modelos são usados para rostos e busca semântica. No "Automático", o sistema recomenda um nível conforme o hardware da máquina do serviço de IA: "Alta precisão" se houver GPU utilizável; só com CPU, "Leve" abaixo de 6 GB de memória e "Equilibrado" nos demais casos.',
    },
    {
      table: ['Nível', 'Detecção + características de rostos', 'Busca semântica', 'Hardware indicado'],
      rows: [
        ['Alta precisão (quality)', 'antelopev2 (SCRFD-10G + ArcFace R100)', 'Chinese-CLIP ViT-H/14 (1024-d)', 'Mac com Apple Silicon, GPU NVIDIA'],
        ['Equilibrado (balanced)', 'antelopev2', 'Chinese-CLIP ViT-L/14 (768-d)', 'NAS classe Intel i5'],
        ['Leve (lite)', 'buffalo_l (ArcFace R50)', 'Chinese-CLIP ViT-B/16 (512-d)', 'N100, Raspberry Pi 5'],
      ],
    },
    {
      ul: [
        'O reconhecimento de texto usa o PP-OCRv6 (RapidOCR); os modelos vêm com as dependências e não precisam ser baixados à parte.',
        'Depois de trocar o nível, os rostos de todas as fotos são detectados de novo e os vetores semânticos recalculados com os novos modelos; enquanto isso, a busca continua usando os vetores antigos, e as pessoas com nome são mantidas.',
        'Os modelos são baixados na pasta montada ./models, e os que não forem mais usados podem ser apagados para liberar espaço (o modelo em uso não pode ser apagado).',
        'Os modelos faciais do InsightFace são só para uso não comercial; troque-os ou obtenha uma licença antes de qualquer uso comercial.',
      ],
    },

    { h2: 'ai-env' },
    {
      table: ['Variável', 'Padrão', 'Descrição'],
      rows: [
        ['`WANMORY_ML_HOST`', '0.0.0.0', 'Endereço de escuta.'],
        ['`WANMORY_ML_PORT`', '3003', 'Porta de escuta.'],
        ['`WANMORY_ML_TOKEN`', 'vazio', 'Token de acesso; quando definido, toda requisição precisa incluir Authorization: Bearer.'],
        ['`WANMORY_MODEL_DIR`', '~/.cache/wanmory/models', 'Pasta dos modelos; /models dentro da imagem.'],
        ['`WANMORY_AUTO_DOWNLOAD`', '0 na imagem', 'Se os modelos são baixados automaticamente no primeiro uso.'],
        ['`WANMORY_FACE_MODEL_PRELOAD`', '—', 'Com 1, carrega os modelos de rosto ao iniciar; o Chinese-CLIP carrega em segundo plano.'],
        ['`WANMORY_UNLOAD_AFTER`', '5 / 30 minutos', 'Segundos de inatividade antes de descarregar um modelo para liberar memória; 0 nunca descarrega. O padrão depende da memória da máquina.'],
      ],
    },

    { h2: 'first-run' },
    {
      steps: [
        { title: 'Crie o administrador', body: [{ p: 'No primeiro acesso, o sistema percebe que não há contas e orienta a criação de um administrador. Administradores podem adicionar membros e mudar as configurações do sistema.' }] },
        { title: 'Baixe os modelos', body: [{ p: 'Vá em "Configurações do sistema → IA", confirme o nível de modelos e baixe-os. As tarefas de IA esperam na fila até os modelos ficarem prontos.' }] },
        { title: 'Importe fotos', body: [{ p: 'Envie pelo app web ou conecte as fotos do NAS como descrito em [Montar pastas de fotos existentes](#library).' }] },
        { title: 'Adicione membros', body: [{ p: 'Em "Configurações do sistema → Membros", crie contas para outras pessoas e escolha o papel "Membro" ou "Administrador".' }] },
      ],
    },

    { h2: 'import' },
    {
      ul: [
        'O envio web aceita fotos, vídeos, HEIC, RAW (como DNG) e mais, com seleção múltipla; o envio é feito em blocos pelo protocolo tus e retoma após uma queda de rede ou ao recarregar a página.',
        'Os arquivos enviados ficam guardados por ano e mês na pasta de envios (padrão data/upload). A pasta pode ser trocada em "Configurações do sistema → Pasta de envios" e vale só para envios novos.',
        'Depois da importação, roda nesta ordem: leitura de metadados (ExifTool) → miniaturas e prévia de 1440 pixels (libvips / FFmpeg) → vetores semânticos, rostos e texto (serviço de IA) → geocodificação reversa.',
        'O indicador de tarefas no topo da barra lateral mostra, em número de fotos, o progresso e o tempo restante estimado de "Importar fotos" e "Reconhecimento por IA".',
      ],
    },

    { h2: 'browse' },
    {
      table: ['Recurso', 'Descrição'],
      rows: [
        ['Biblioteca', 'Linha do tempo das fotos agrupada por mês, com o carrossel de escolhas da IA e "Neste dia" no topo.'],
        ['Busca em linguagem natural', 'Digite uma descrição (como "fotos do terceiro aniversário do bebê"); o resultado é ordenado combinando texto reconhecido, local da foto e similaridade semântica do Chinese-CLIP. Digitar o nome de uma categoria devolve essa categoria diretamente.'],
        ['Pessoas', 'Os rostos são agrupados automaticamente; a pessoa aparece quando está em pelo menos 3 fotos. Dê nomes, mescle, defina aniversários e veja o crescimento por idade, os lugares e as fotos em grupo.'],
        ['Álbuns · Álbuns inteligentes', 'Álbuns reúnem fotos escolhidas à mão e podem ser privados; álbuns inteligentes juntam fotos sozinhos por pessoa, lugar, data e outros critérios.'],
        ['Lugares', 'Mostra num mapa onde cada foto foi tirada pelo GPS, com as visões Mapa, Satélite e Grade.'],
        ['Sequências e parecidas', 'Agrupa sozinho sequências e fotos parecidas e recomenda a melhor para manter; "Duplicadas" lista os arquivos com conteúdo idêntico.'],
        ['Apresentações de slides', 'Reproduza a biblioteca, álbuns, pessoas e lembranças; fotos verticais são juntadas de duas ou três numa página, com música de fundo e transições.'],
      ],
    },

    { h2: 'members-usage' },
    {
      table: ['Papel', 'Permissões'],
      rows: [
        ['Administrador', 'Adicionar e remover membros, redefinir senhas de membros e mudar as configurações do sistema; pode apagar qualquer foto.'],
        ['Membro', 'Enviar, ver e organizar fotos; só pode apagar as que enviou; não pode mudar as configurações do sistema.'],
        ['Visitante', 'Com o acesso de visitantes ligado, quem não entrou pode ver o conteúdo compartilhado só para leitura; álbuns privados e fotos ocultas não aparecem.'],
      ],
    },
    { p: 'As informações de pessoas (nomes, mesclagens) são comuns a todos os membros; o número de fotos, as capas e as páginas de pessoas são calculados com as fotos que cada membro pode ver, e as fotos ocultas só aparecem para quem as ocultou.' },

    { h2: 'settings-members' },
    {
      ul: [
        'Membros: ao adicionar, defina nome, senha inicial (mínimo de 4 caracteres) e papel; é possível redefinir a senha de um membro ou removê-lo.',
        'Histórico de acessos: registra a hora, o aparelho e o IP de cada acesso, com o local estimado offline pelo IP (ip2region), e guarda os últimos seis meses. Só os administradores veem.',
        'Em "Minha conta", cada membro pode trocar a senha e o avatar e ver em quais aparelhos está conectado.',
      ],
    },

    { h2: 'settings-ai' },
    {
      table: ['Configuração', 'Opções', 'Descrição'],
      rows: [
        ['Modo de execução da IA', 'Embutido (só CPU) / Serviço remoto', 'Um serviço remoto precisa de endereço e token, e a conexão é testada antes da troca; o processamento de IA pausa enquanto o serviço estiver indisponível.'],
        ['Dispositivo de processamento', 'Automático / GPU / Só CPU', 'Sem placa de vídeo utilizável, só a CPU pode ser escolhida; a troca recarrega os modelos, e o processamento de IA em andamento continua logo depois.'],
        ['Nível de modelos', 'Automático / Alta precisão / Equilibrado / Leve', 'Depois da troca, todas as fotos são reprocessadas com os novos modelos, com o progresso exibido.'],
        ['Gerenciar modelos', 'Baixar / Apagar', 'Lista o tamanho e o estado de cada modelo (em uso, baixado, não baixado).'],
      ],
    },

    { h2: 'settings-perf' },
    {
      table: ['Configuração', 'Opções', 'Descrição'],
      rows: [
        ['Quando processar', 'Ocioso / Sempre / À noite', 'Ocioso: a IA pausa durante envios e geração de miniaturas; Sempre: processa sem parar, os envios podem ficar mais lentos; À noite: só no horário definido.'],
        ['Paralelismo do processamento de fotos', 'Número', 'Quantas fotos são lidas e miniaturizadas ao mesmo tempo; o padrão é calculado pelos núcleos e pela memória.'],
        ['Paralelismo da IA', 'Número', 'Quantas fotos são enviadas ao mesmo tempo ao serviço de IA.'],
        ['Threads de CPU', 'Número', 'Threads de CPU usadas por cada modelo na inferência.'],
      ],
    },
    { p: 'O topo do cartão mostra ao vivo o estado da IA (rodando ou o motivo da pausa). As mudanças valem na hora, sem reiniciar.' },

    { h2: 'settings-general' },
    {
      table: ['Configuração', 'Padrão', 'Descrição'],
      rows: [
        ['Pasta de envios', 'data/upload', 'Os arquivos enviados ficam por ano e mês; a mudança vale só para envios novos.'],
        ['Acesso de visitantes', 'Ligado', 'Permite ver o conteúdo compartilhado sem entrar. Recomenda-se desligar se houver acesso pela internet.'],
        ['Mapas on-line', 'Ligado', 'Mostra mapas, nomes de lugares e busca de lugares, enviando a localização das fotos ao serviço de mapas; desligado, só aparecem coordenadas.'],
        ['Provedor de mapas', 'Automático', 'Automático: AMap na China continental e OpenStreetMap no resto; também dá para fixar um dos dois.'],
        ['Domínio de acesso', 'wanmory.local', 'Domínio de acesso na rede local; precisa terminar em .local.'],
      ],
    },

    { h2: 'settings-update' },
    { p: '"Configurações do sistema → Atualização do sistema" mostra as versões atuais do backend e do serviço de IA e avisa quando há versão nova. Para atualizar, rode na pasta onde está o `docker-compose.yml`:' },
    { code: 'docker compose pull && docker compose up -d', lang: 'bash' },
    { p: 'As migrações do banco rodam sozinhas quando o server inicia. Se você fixou uma versão com `WANMORY_VERSION`, mude antes a tag no `.env`.' },

    { h2: 'backup' },
    { p: 'São três tipos de dados para guardar no backup:' },
    {
      table: ['Dados', 'Local', 'Descrição'],
      rows: [
        ['Banco de dados', 'volume nomeado pgdata', 'Metadados das fotos, pessoas, álbuns, configurações, vetores e fila de tarefas.'],
        ['Envios e miniaturas', './data', 'Originais enviados (data/upload) e miniaturas (data/thumbs); as miniaturas podem ser geradas de novo.'],
        ['Pastas de fotos', 'pastas montadas em /photos', 'Cobertas pelo plano de backup do próprio NAS; o app nunca altera pastas montadas só para leitura.'],
      ],
    },
    {
      lang: 'bash',
      code: `# Exportar o banco de dados
docker compose exec -T postgres pg_dump -U wanmory -Fc wanmory > wanmory-$(date +%F).dump

# Restaurar numa instalação nova (rode antes docker compose up -d postgres)
docker compose exec -T postgres pg_restore -U wanmory -d wanmory --clean < wanmory-2026-11-10.dump`,
    },
    { note: 'Os modelos em ./models não precisam de backup; podem ser baixados de novo pelo app web.' },

    { h2: 'reset-password' },
    { p: 'Quando um membro esquece a senha, um administrador a redefine em "Configurações do sistema → Membros". Se o administrador esquecer a própria, rode na máquina onde o app funciona, na pasta onde está o `docker-compose.yml`:' },
    {
      lang: 'bash',
      code: `docker compose exec server wanmory reset-password            # listar as contas e escolher uma
docker compose exec server wanmory reset-password <nome>      # indicar a conta diretamente`,
    },
    {
      ul: [
        'O comando lista todas as contas (nome, papel, data de criação, último acesso); escolha uma pelo número e digite a nova senha duas vezes.',
        'Depois da redefinição, a conta é desconectada de todos os aparelhos; fotos e álbuns não mudam.',
        'Isso só pode ser feito na máquina; o app web não tem essa opção. Sem Docker, rode wanmory reset-password com as mesmas variáveis de ambiente do servidor, como a DATABASE_URL.',
      ],
    },

    { h2: 'troubleshooting' },
    {
      table: ['Sintoma', 'O que verificar'],
      rows: [
        ['Não abre wanmory.local', 'Confira se o serviço mdns está rodando (docker compose ps); alguns Android não suportam mDNS, use o IP; veja se a porta 5353 está ocupada na máquina.'],
        ['As configurações de IA mostram "Sem conexão, processamento de IA pausado"', 'No modo embutido, veja os logs do contêiner ml (docker compose logs ml); no modo remoto, confira se endereço, porta, firewall e token batem.'],
        ['Sem resultados em Pessoas ou na busca', 'Confira se os modelos foram baixados; em "Desempenho", veja se a IA está pausada pelo horário de processamento; acompanhe o reconhecimento no indicador de tarefas.'],
        ['Envios grandes falham', 'O limite de tamanho de requisição do proxy reverso está baixo demais; ajuste o client_max_body_size como em "Proxy reverso e acesso pela internet".'],
        ['As fotos de uma pasta montada não aparecem', 'As pastas precisam ser montadas como subpastas de /photos; a primeira varredura acontece cerca de 20 segundos após iniciar e depois a cada 15 minutos; pastas ocultas são ignoradas.'],
        ['Download das imagens lento ou com falha', 'Defina no .env o WANMORY_REGISTRY com um registro acessível.'],
      ],
    },
    {
      p: 'Veja os logs de cada serviço com `docker compose logs -f server` e `docker compose logs -f ml`. Se o problema continuar, conte para nós na página [Relatar um problema](/feedback/), com o número da versão e os logs relevantes.',
    },

    { h2: 'uninstall' },
    { p: 'Rode o script de desinstalação na máquina onde o Wanmory funciona:' },
    { code: 'curl -fsSL https://wanmory.com/uninstall.sh | bash', lang: 'bash' },
    {
      p: 'O script lê primeiro o .env da pasta de instalação e lista os contêineres, o banco de dados, a pasta de dados e os modelos de IA com o espaço que ocupam, além das pastas de fotos montadas. Em seguida, para e remove os contêineres e a rede e pergunta, item por item, se deve apagar (por padrão, tudo é mantido):',
    },
    {
      table: ['Item', 'Descrição'],
      rows: [
        ['Banco de dados', 'O volume Docker pgdata ou a pasta definida em WANMORY_DB_DIR. Depois de apagado, pessoas, álbuns, configurações e resultados de IA não podem ser recuperados.'],
        ['Pasta de dados', 'Miniaturas, prévias e fotos originais enviadas pelo app web.'],
        ['Modelos de IA', 'Podem ser baixados de novo pelo app web depois de reinstalar.'],
        ['Imagens Docker', 'Incluindo a imagem postgres/pgvector; podem ser baixadas de novo. Imagens ainda usadas por outros contêineres não são removidas.'],
        ['Arquivos de configuração', '.env (com a senha do banco), docker-compose.yml e docker-compose.override.yml; se a pasta ficar vazia, ela também é removida.'],
      ],
    },
    {
      ul: [
        'As pastas de fotos montadas (NAS, discos externos) nunca são apagadas.',
        'Para apagar o banco de dados ou a pasta de dados, é preciso digitar DELETE para confirmar.',
        'Se você remover só os contêineres e manter os dados, rodar de novo o install.sh na mesma pasta recupera tudo; se apagar o .env mas manter o banco, anote antes o WANMORY_DB_PASSWORD que está nele.',
      ],
    },
    {
      table: ['Opção', 'Descrição'],
      rows: [
        ['`--dir PASTA`', 'Define a pasta de instalação; padrão ~/wanmory.'],
        ['`-y`', 'Não interativo: remove só os contêineres e a rede e mantém todos os dados e a configuração.'],
        ['`--purge`', 'Não interativo: apaga todos os itens da tabela acima (exceto as pastas de fotos).'],
        ['`--dry-run`', 'Só mostra o que seria feito, sem mudar nada.'],
      ],
    },
  ],
}

export default docs
