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
          group: 'Script de instalação',
          items: [
            ['install-script', 'Opções do script'],
            ['install-steps', 'O script passo a passo'],
            ['install-faq', 'Dúvidas de instalação'],
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
            ['ai-schedule', 'Quando a IA trabalha'],
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
            ['update', 'Atualizar'],
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
    {
      h2: 'intro',
    },
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
    {
      h2: 'requirements',
    },
    {
      table: ['Item', 'Mínimo', 'Recomendado'],
      rows: [
        ['Arquitetura da CPU', 'x86_64 (amd64) ou ARM64', '—'],
        [
          'Processador',
          'Classe Intel N100 / Raspberry Pi 5',
          'Classe Intel i5 ou superior, ou o serviço de IA numa máquina com GPU',
        ],
        ['Memória', '4 GB (o nível "Leve" é escolhido automaticamente)', '8 GB ou mais (nível "Equilibrado")'],
        [
          'Disco',
          'Cerca de 1–4 GB para modelos, mais espaço para miniaturas',
          'Um SSD para data/ e o volume do banco de dados',
        ],
        ['Software', 'Docker Engine e Docker Compose v2', '—'],
        [
          'Sistema operacional',
          'Qualquer distribuição Linux que rode Docker',
          'Synology DSM, QNAP QTS, TrueNAS SCALE, Unraid, Ubuntu / Debian',
        ],
      ],
    },
    {
      note: 'As imagens são publicadas para `linux/amd64` e `linux/arm64`, e o Docker baixa a que combina com sua arquitetura. Contêineres Docker no macOS não conseguem usar a GPU da Apple; para aceleração de hardware num Mac, veja [Serviço de IA em outra máquina](#ai-remote).',
    },
    {
      h2: 'quick-start',
    },
    {
      h3: 'Opção 1: script de instalação (recomendado)',
    },
    {
      p: 'Execute em Linux ou macOS de 64 bits com Docker instalado (em um NAS Synology, QNAP ou parecido, entre primeiro por SSH):',
    },
    {
      code: 'curl -fsSL https://wanmory.com/install.sh | bash',
      lang: 'bash',
    },
    {
      p: 'O script faz uma pergunta por vez; Enter aceita o valor padrão entre colchetes. Na primeira instalação basta apertar Enter em todas. Cada opção está explicada em [Opções do script](#install-script) e cada mensagem em [O script passo a passo](#install-steps). No fim, abra o endereço mostrado, crie a conta de administrador e baixe os modelos em Configurações → Como a IA é executada.',
    },
    {
      note: 'Para ver antes o que o script faz, baixe, leia e depois execute: `curl -fsSLO https://wanmory.com/install.sh` e então `bash install.sh`. Com `--dry-run` ele só verifica o sistema e grava os arquivos de configuração, sem baixar imagens nem iniciar nada.',
    },
    {
      h3: 'Opção 2: instalação manual',
    },
    {
      steps: [
        {
          title: 'Crie uma pasta e baixe o arquivo Compose',
          body: [
            {
              p: 'Crie uma pasta para o arquivo Compose, os dados e os modelos, e baixe o `docker-compose.yml` oficial:',
            },
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
            {
              p: 'Crie um `.env` na mesma pasta para mudar os valores padrão. Em produção, troque sem falta a senha do banco de dados:',
            },
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
            {
              p: 'A primeira inicialização baixa as imagens e roda as migrações do banco automaticamente:',
            },
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
    {
      h2: 'install-script',
    },
    {
      p: 'Uso: `curl -fsSL https://wanmory.com/install.sh | bash -s -- [opções]`, ou depois de baixar, `bash install.sh [opções]`.',
    },
    {
      h3: 'Opções de linha de comando',
    },
    {
      table: ['Opção', 'O que faz'],
      rows: [
        [
          '`-y`, `--yes`',
          'Sem perguntas: usa todos os padrões (ou as variáveis de ambiente abaixo); a senha do banco de dados é gerada. Também acontece sozinho quando não há terminal interativo (por exemplo, chamado de outro script).',
        ],
        ['`--dir PASTA`', 'Pasta de instalação, padrão `~/wanmory` (ou defina `WANMORY_DIR`).'],
        [
          '`--dry-run`',
          'Só verifica o sistema, grava e valida `.env` e `docker-compose.yml`; nada é baixado nem iniciado.',
        ],
        ['`-h`, `--help`', 'Mostra a ajuda.'],
      ],
    },
    {
      h3: 'Variáveis de ambiente',
    },
    {
      p: 'Coloque-as antes do comando. Na instalação interativa viram a resposta padrão de cada pergunta; com `-y` são usadas diretamente. Todas, exceto `WANMORY_DIR` e `WANMORY_PHOTOS`, são gravadas em `.env`.',
    },
    {
      table: ['Variável', 'Padrão', 'O que faz'],
      rows: [
        ['`WANMORY_DIR`', '~/wanmory', 'Pasta de instalação, igual a `--dir`.'],
        [
          '`WANMORY_PORT`',
          '8080',
          'Porta web. Se estiver ocupada, a instalação interativa pede outra; com `-y` o script para com erro.',
        ],
        [
          '`WANMORY_DOMAIN`',
          'wanmory.local',
          'Domínio da rede local. Precisa terminar em `.local` e ter só letras, números e hífens.',
        ],
        ['`WANMORY_DB_PASSWORD`', 'gerada', 'Senha do banco de dados. Se definida, o script não pergunta.'],
        [
          '`WANMORY_DB_DIR`',
          'vazio (volume Docker pgdata)',
          'Uma pasta deste computador para o banco de dados; vazio significa o volume Docker. Não use compartilhamento de rede.',
        ],
        [
          '`WANMORY_TZ`',
          'fuso deste computador, ou Asia/Shanghai se não detectar',
          'Para fotos cujo EXIF não tem fuso. Use o nome completo, como `America/Sao_Paulo`; na instalação interativa dá para buscar pela cidade.',
        ],
        [
          '`WANMORY_DATA_DIR`',
          './data',
          'Pasta de dados: miniaturas, prévias e fotos enviadas pela página. Caminhos relativos partem da pasta de instalação.',
        ],
        ['`WANMORY_MODELS_DIR`', './models', 'Pasta dos modelos de IA, precisa de 1–4 GB.'],
        [
          '`WANMORY_PHOTOS`',
          'vazio',
          'Pastas de fotos existentes, separadas por vírgula, somente leitura por padrão; acrescente `:rw` a um caminho para leitura e escrita, ex. `/volume1/photo,/mnt/usb:rw`.',
        ],
        [
          '`WANMORY_REGISTRY`',
          'ghcr.io/i-dj',
          'Registro de imagens. Troque por um espelho acessível se o ghcr.io estiver lento ou bloqueado.',
        ],
        [
          '`WANMORY_VERSION`',
          'latest',
          'Qual versão instalar, ex. `0.4.1`. A tela de boas-vindas mostra a versão que será instalada.',
        ],
      ],
    },
    {
      code: `# Exemplo: sem perguntas, em /opt/wanmory na porta 9000, duas pastas de fotos do NAS somente leitura
curl -fsSL https://wanmory.com/install.sh | WANMORY_PORT=9000 WANMORY_PHOTOS=/volume1/photo,/volume2/family bash -s -- -y --dir /opt/wanmory`,
      lang: 'bash',
    },
    {
      h2: 'install-steps',
    },
    {
      p: 'As mensagens do script são em inglês para aparecer corretamente em qualquer terminal de NAS. Aqui está cada etapa na ordem em que aparece: ✔ verde é aprovado, ! amarelo é um aviso (a instalação continua) e ✘ vermelho é um erro que encerra o script.',
    },
    {
      steps: [
        {
          title: 'Tela de boas-vindas',
          body: [
            {
              p: 'Mostra o logotipo WANMORY e `Installing version v0.4.1`: a versão que será instalada, ou seja, `WANMORY_VERSION` se definida, senão a última lançada.',
            },
          ],
        },
        {
          title: 'Checking system',
          body: [
            {
              table: ['Mensagem', 'Significado'],
              rows: [
                [
                  '`OS: Linux` / `OS: macOS`',
                  'Sistema operacional. No macOS avisa que a IA em contêineres não usa a GPU da Apple; para ganhar velocidade, rode o serviço de IA direto no Mac (veja [Rodar o serviço de IA à parte](#ai-remote)). Outros sistemas param aqui.',
                ],
                [
                  '`CPU: x86_64 (linux/amd64 images)`',
                  'Arquitetura da CPU. Só amd64 e arm64 de 64 bits; sistemas de 32 bits (incluindo o Raspberry Pi OS antigo com kernel de 64 bits e espaço de usuário de 32) param: instale um sistema de 64 bits.',
                ],
                [
                  '`Docker 27.x`',
                  'Docker funcionando. Se faltar, mostra um link de instalação (Synology / QNAP: Container Manager / Container Station na central de pacotes). Com `Permission denied`, rode com sudo ou adicione seu usuário ao grupo docker e entre de novo.',
                ],
                [
                  '`Docker Compose v2.x`',
                  'Docker Compose funcionando. Se só houver o antigo docker-compose v1, recomenda atualizar mas continua.',
                ],
                [
                  '`Memory: 8 GB`',
                  'Memória. Abaixo de 4 GB diz `AI will use the lite model tier`: a IA usa o nível leve automaticamente; abaixo de 2 GB avisa que o reconhecimento pode não funcionar.',
                ],
              ],
            },
          ],
        },
        {
          title: 'Configuration',
          body: [
            {
              p: 'Uma pergunta por vez; Enter aceita o valor padrão entre colchetes.',
            },
            {
              table: ['Pergunta', 'Significado e dica'],
              rows: [
                [
                  '`Install directory`',
                  'Onde ficam `.env`, `docker-compose.yml` e, por padrão, data e models. Em seguida mostra o espaço livre do disco; abaixo de 10 GB avisa.',
                ],
                [
                  '`Keep the existing configuration`',
                  'Só aparece se já existir um `.env` (instalação anterior). Enter (Y) mantém porta, domínio, senha do banco etc. e pula as perguntas seguintes; ideal para reinstalar e atualizar. n para preencher tudo de novo. Não troque a senha à toa depois que o banco foi criado.',
                ],
                ['`Web port`', 'Porta web, padrão 8080. Se estiver ocupada, pede outra.'],
                [
                  '`LAN domain (must end in .local)`',
                  'Nome para abrir a biblioteca na rede local, padrão wanmory.local; photos.local também serve. Dá para mudar depois nas configurações da página.',
                ],
                [
                  '`Generate a random database password`',
                  'Enter gera uma senha aleatória e guarda em `.env`; não precisa decorar. n para digitar uma duas vezes (mínimo 8 caracteres; sem espaços, aspas ou `$ \\ @ : / # ?`).',
                ],
                [
                  '`Database location`',
                  'Onde fica o banco de dados. Deixe vazio e aperte Enter para o volume Docker pgdata (recomendado), ou informe uma pasta local como `/volume1/wanmory/db`. Avisa para não usar compartilhamento SMB / NFS, que pode corromper o banco.',
                ],
                [
                  '`Time zone`',
                  'Serve para datar fotos cujo EXIF não tem fuso. Digite uma cidade ou país, ex. sao_paulo, lisbon, recife; se vários combinarem, escolha pelo número.',
                ],
                [
                  '`Data directory`',
                  'Pasta de dados, padrão ./data. Miniaturas, prévias e fotos enviadas ficam aqui; reserve espaço suficiente.',
                ],
                ['`AI model directory (1-4 GB)`', 'Pasta dos modelos de IA, padrão ./models.'],
                [
                  '`Add existing photo folders from a NAS or external drive`',
                  'Se quer adicionar pastas de fotos que você já tem (sem reenviar). Responda Y e informe um caminho; se não existir, pede confirmação.',
                ],
                [
                  '`Mount read-only`',
                  'Enter monta somente leitura: o Wanmory nunca altera nem apaga os originais (recomendado). n para leitura e escrita: excluir uma foto definitivamente no Wanmory apaga também o arquivo original.',
                ],
                ['`Add another photo folder`', 'Adiciona a próxima pasta; Enter (N) encerra.'],
              ],
            },
          ],
        },
        {
          title: 'Writing configuration',
          body: [
            {
              p: 'Grava `.env` (permissão 600, só você lê); com pastas de fotos, também `docker-compose.override.yml` (o Docker Compose junta automaticamente); baixa o `docker-compose.yml` do GitHub ou, se falhar, do Gitee. `Configuration is valid` quer dizer que a verificação passou. Com `--dry-run`, o script termina aqui.',
            },
          ],
        },
        {
          title: 'Existing database found',
          body: [
            {
              p: 'Só aparece se você não manteve a configuração antiga mas ainda existe um banco anterior (por exemplo, guardado ao desinstalar). Enter (Y) mantém: fotos, álbuns, pessoas e contas continuam lá, e o script troca a senha do banco pela nova do `.env`. n apaga o banco antigo e começa do zero; se o banco estiver numa pasta local, o script não apaga por você: esvazie essa pasta e rode o script de novo.',
            },
          ],
        },
        {
          title: 'Pulling images and starting',
          body: [
            {
              p: 'Baixa as imagens (alguns minutos na primeira vez). Inicia primeiro o banco e espera ele ficar pronto (`Waiting for the database...`), ajusta a senha do banco para a do `.env` (`Database ready`) e então inicia o resto.',
            },
          ],
        },
        {
          title: 'Waiting for Wanmory to start',
          body: [
            {
              p: 'Espera até 5 minutos; aparelhos lentos como um Raspberry Pi demoram mais na primeira vez. Se o Wanmory ficar reiniciando, mostra as últimas 15 linhas do log e para; se o tempo acabar sem resposta, sugere conferir depois e mostra o comando para ver os logs.',
            },
          ],
        },
        {
          title: 'Installation complete',
          body: [
            {
              p: 'Mostra o `LAN address` (domínio), o `IP address` e a pasta de instalação. `Next` diz o próximo passo: abrir a página, criar a conta de administrador e baixar os modelos em Configurações → Como a IA é executada. Alguns Android não resolvem nomes .local; use o endereço IP.',
            },
          ],
        },
      ],
    },
    {
      h2: 'install-faq',
    },
    {
      table: ['Problema', 'Causa e solução'],
      rows: [
        [
          'Depois de reinstalar, o Wanmory não conecta ao banco (falha de autenticação)',
          'O banco só usa a senha do `.env` quando é criado; mudar o `.env` depois não muda a senha. O script atual ajusta a senha do banco ao `.env` a cada início, então basta rodá-lo de novo. Numa instalação manual, execute na pasta de instalação `docker compose exec postgres psql -U wanmory -c "ALTER USER wanmory WITH PASSWORD \'nova-senha\';"` e depois `docker compose up -d`.',
        ],
        [
          'De quem são os arquivos da pasta de dados / não consigo apagar no host',
          'O contêiner do Wanmory roda como o dono da pasta de dados: se um usuário comum a criou (como faz o script), envios e miniaturas são dele e dá para gerenciar sem sudo; se a pasta for do root ou um volume Docker, roda como uid 1000. Em sistemas de arquivos que não trocam dono (pendrive exFAT / NTFS, compartilhamento SMB) roda como root. Arquivos com dono errado deixados por versões antigas são corrigidos ao iniciar.',
        ],
        [
          'Raspberry Pi',
          'Precisa de sistema de 64 bits (Raspberry Pi OS 64-bit); em 32 bits o script para. Com 4 GB de memória o nível leve é usado automaticamente; a primeira inicialização e o primeiro processamento das fotos são lentos, então deixe dados e banco num SSD.',
        ],
        ['Porta em uso', 'Escolha outra porta ou rode o script com `WANMORY_PORT=9000`.'],
        ['Baixar imagens é lento ou falha', 'Defina `WANMORY_REGISTRY` com um espelho acessível e rode de novo.'],
      ],
    },
    {
      h2: 'compose',
    },
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
    {
      h2: 'env',
    },
    {
      h3: '.env (variáveis do Compose)',
    },
    {
      p: 'Estas variáveis são usadas no `docker-compose.yml`; coloque-as no `.env` da mesma pasta para aplicá-las:',
    },
    {
      table: ['Variável', 'Padrão', 'Descrição'],
      rows: [
        [
          '`WANMORY_DB_PASSWORD`',
          'wanmory',
          'Senha do PostgreSQL, também usada na DATABASE_URL do server. Trocá-la depois da primeira inicialização exige trocar também a senha do usuário dentro do banco.',
        ],
        ['`WANMORY_PORT`', '8080', 'Porta publicada na máquina, usada também no endereço exibido pelo app web.'],
        ['`WANMORY_TZ`', 'Asia/Shanghai', 'Fuso horário usado quando os dados EXIF não informam.'],
        ['`WANMORY_VERSION`', 'latest', 'Tag da imagem; fixe uma versão para decidir quando atualizar.'],
        [
          '`WANMORY_REGISTRY`',
          'ghcr.io/i-dj',
          'Registro de imagens. Troque por um acessível se o ghcr.io não estiver disponível.',
        ],
        [
          '`WANMORY_DATA_DIR`',
          './data',
          'Pasta de dados: originais enviados (upload/) e miniaturas e prévias (thumbs/), montada em /data no contêiner.',
        ],
        ['`WANMORY_MODELS_DIR`', './models', 'Pasta de modelos de IA, montada em /models no contêiner ml.'],
        [
          '`WANMORY_DB_DIR`',
          'volume pgdata',
          'Pasta do banco de dados. Sem valor, usa o volume Docker pgdata; com o caminho de uma pasta num disco local, o banco fica guardado lá. Não use pastas compartilhadas em rede.',
        ],
        [
          '`WANMORY_DOMAIN`',
          'wanmory.local',
          'Domínio local inicial; precisa terminar em .local. Depois de alterado em "Configurações do sistema → Domínio de acesso", vale a configuração.',
        ],
      ],
    },
    {
      h3: 'Contêiner server (opcional)',
    },
    {
      p: '`DATABASE_URL`, `WANMORY_ML_URL`, `WANMORY_MDNS` e `WANMORY_HTTP_PUBLIC_PORT` já estão no arquivo Compose, com a finalidade anotada. As variáveis a seguir não estão no arquivo padrão; adicione-as ao `environment` do `server` se precisar:',
    },
    {
      table: ['Variável', 'Padrão', 'Descrição'],
      rows: [
        [
          '`WANMORY_WORKERS`',
          'automático',
          'Paralelismo padrão das tarefas de metadados e miniaturas. Sem valor, é calculado pelos núcleos e pela memória; pode ser ajustado em "Desempenho" no app web.',
        ],
        [
          '`WANMORY_ML_TOKEN`',
          'vazio',
          'Token de acesso do serviço de IA embutido; precisa ser igual à variável de mesmo nome no contêiner ml. Normalmente não é necessário.',
        ],
        ['`WANMORY_FACE_MODEL`', 'antelopev2', 'Modelo de rostos usado quando nenhum nível foi escolhido.'],
        [
          '`WANMORY_CLIP_MODEL`',
          'chinese-clip-vit-h-14',
          'Modelo de busca semântica usado quando nenhum nível foi escolhido.',
        ],
        [
          '`WANMORY_STORAGE_ROOTS`',
          'pasta de dados',
          'Pastas que podem ser navegadas e escolhidas no app web, separadas por dois-pontos.',
        ],
      ],
    },
    {
      h2: 'library',
    },
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
    {
      p: 'Depois da mudança, rode `docker compose up -d`. A primeira varredura começa cerca de 20 segundos após o reinício do contêiner.',
    },
    {
      ul: [
        '**Recomenda-se montar só para leitura (:ro)**: o sistema não grava nada nessas pastas. Apagar uma foto no app só a move para "Apagadas recentemente", a exclusão definitiva nunca apaga o arquivo original e as varreduras seguintes não o importam de novo. Em pastas de leitura e gravação, a exclusão definitiva também apaga o arquivo original.',
        'Arquivos com conteúdo idêntico são importados uma só vez (comparação pela soma SHA-1), incluindo arquivos já enviados e duplicatas entre pastas.',
        'Pastas ocultas e pastas de sistema do NAS (.xxx, @eaDir, #recycle etc.) são ignoradas automaticamente.',
        'Fotos importadas das pastas não pertencem a nenhum membro; só os administradores podem apagá-las.',
      ],
    },
    {
      h2: 'mdns',
    },
    {
      p: 'O serviço `mdns` roda no modo de rede da máquina e anuncia o domínio de acesso na rede local (padrão `wanmory.local`). macOS, iOS, iPadOS e Windows 10 ou posterior acessam em `http://wanmory.local:8080` sem configurar o roteador. O domínio pode ser trocado em "Configurações do sistema → Domínio de acesso" e precisa terminar em `.local`.',
    },
    {
      note: 'Alguns aparelhos Android não resolvem nomes mDNS; use o endereço IP. Se a porta 5353 já estiver ocupada (por exemplo, no Synology), o serviço mdns pode não iniciar; nesse caso, use o IP também. O restante não é afetado.',
      warn: true,
    },
    {
      h2: 'proxy',
    },
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
    {
      h2: 'ai-overview',
    },
    {
      p: 'O serviço de IA é um serviço HTTP sem estado: recebe prévias de 1440 pixels do backend e devolve rostos, vetores e texto reconhecido. Ele nunca acessa o banco de dados nem guarda arquivos. O backend tem dois modos, trocados em "Configurações do sistema → IA → Modo de execução da IA":',
    },
    {
      table: ['Modo', 'Onde roda', 'Indicado para'],
      rows: [
        [
          'Embutido (só CPU)',
          'O contêiner ml do Compose, acessível só na rede interna',
          'Pronto para usar; NAS ou mini PC com biblioteca moderada, ou quando um primeiro processamento mais longo é aceitável',
        ],
        [
          'Serviço remoto',
          'Outra máquina da rede local, rodando o serviço Python diretamente',
          'Mac com Apple Silicon (CoreML / MPS) ou máquina com GPU NVIDIA (CUDA), encurtando bastante o primeiro processamento',
        ],
      ],
    },
    {
      p: 'Quando o serviço de IA não está disponível, as tarefas de IA ficam na fila e deixam de ser pegas, sem gastar repetições; o processamento continua sozinho quando o serviço volta. Navegação, uploads e o resto não são afetados.',
    },
    {
      h2: 'ai-remote',
    },
    {
      p: 'O contêiner de IA integrado usa só a CPU. Se você tem um computador mais rápido (um Mac com chip Apple ou um PC Windows / Linux com GPU NVIDIA), pode rodar o serviço de IA direto nele (o programa Python da pasta `ml/` do repositório) e o Wanmory manda as fotos para lá. Python e dependências são gerenciados pelo [uv](https://docs.astral.sh/uv/), então não é preciso instalar Python.',
    },
    {
      table: ['Computador', 'Aceleração disponível'],
      rows: [
        ['Mac com chip Apple', 'CoreML para reconhecimento facial, MPS (PyTorch) para a busca inteligente.'],
        ['Linux + GPU NVIDIA', 'CUDA para a busca inteligente (PyTorch em meia precisão, cerca de 1,9 GB de VRAM).'],
        [
          'Windows + GPU NVIDIA',
          'CUDA para a busca inteligente depois de instalar o PyTorch com CUDA (passo 3 do Windows abaixo); rostos e texto na CPU.',
        ],
        ['Sem GPU', 'Sem PyTorch, tudo com ONNX na CPU; vale a pena num computador bem mais rápido que o NAS.'],
      ],
    },
    {
      h3: 'macOS',
    },
    {
      steps: [
        {
          title: 'Instalar o uv',
          body: [
            {
              code: `curl -LsSf https://astral.sh/uv/install.sh | sh   # ou: brew install uv
# depois abra um terminal novo`,
              lang: 'bash',
            },
          ],
        },
        {
          title: 'Baixar o código',
          body: [
            {
              code: `git clone https://github.com/i-dj/wanmory.git   # espelho na China: https://gitee.com/i-dj/wanmory.git
cd wanmory/ml`,
              lang: 'bash',
            },
            {
              p: 'Se faltar o git, o macOS oferece instalar as ferramentas de linha de comando do Xcode; aceite e siga as instruções.',
            },
          ],
        },
        {
          title: 'Instalar dependências',
          body: [
            {
              code: 'uv sync --extra torch   # na primeira vez baixa Python e PyTorch, alguns minutos',
              lang: 'bash',
            },
          ],
        },
        {
          title: 'Criar um token de acesso e iniciar',
          body: [
            {
              code: `export WANMORY_ML_TOKEN=$(openssl rand -hex 24)
echo $WANMORY_ML_TOKEN   # anote, o Wanmory precisa dele
WANMORY_FACE_MODEL_PRELOAD=1 uv run --extra torch python -m wanmory_ml`,
              lang: 'bash',
            },
            {
              p: 'Está pronto quando aparece `Uvicorn running on http://0.0.0.0:3003`. A primeira inicialização baixa o modelo de rostos (cerca de 340 MB). Se o macOS perguntar se o python pode aceitar conexões de entrada, permita.',
            },
          ],
        },
        {
          title: 'Deixar outros computadores conectarem',
          body: [
            {
              p: 'Se o firewall estiver ligado (Ajustes do Sistema → Rede → Firewall), confirme que o python pode receber conexões. `ipconfig getifaddr en0` mostra o IP do Mac.',
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
          title: 'Instalar o uv',
          body: [
            {
              p: 'Abra o PowerShell e execute:',
            },
            {
              code: `powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
# ou: winget install --id=astral-sh.uv -e
# depois abra uma nova janela do PowerShell`,
              lang: 'powershell',
            },
          ],
        },
        {
          title: 'Baixar o código',
          body: [
            {
              code: `git clone https://github.com/i-dj/wanmory.git   # sem Git? winget install Git.Git
cd wanmory\\ml`,
              lang: 'powershell',
            },
            {
              p: 'Sem Git, também dá para clicar em Code → Download ZIP no GitHub, descompactar e entrar na pasta ml.',
            },
          ],
        },
        {
          title: 'Instalar dependências',
          body: [
            {
              code: `uv sync --extra torch
# Com GPU NVIDIA, troque pelo PyTorch com CUDA (o PyTorch do PyPI no Windows só usa CPU)
uv pip install --reinstall torch --index-url https://download.pytorch.org/whl/cu126`,
              lang: 'powershell',
            },
            {
              p: 'Depois de trocar para a versão com CUDA, inicie com `uv run --no-sync`; senão o uv volta a instalar a versão de CPU. Sem GPU, rode só `uv sync` (sem PyTorch, bem menor) e tire `--extra torch` ao iniciar.',
            },
          ],
        },
        {
          title: 'Criar um token de acesso e iniciar',
          body: [
            {
              code: `$env:WANMORY_ML_TOKEN = [guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N")
echo $env:WANMORY_ML_TOKEN   # anote, o Wanmory precisa dele
$env:WANMORY_FACE_MODEL_PRELOAD = "1"
uv run --extra torch python -m wanmory_ml
# com o PyTorch com CUDA, use: uv run --no-sync python -m wanmory_ml`,
              lang: 'powershell',
            },
          ],
        },
        {
          title: 'Liberar a porta no firewall',
          body: [
            {
              p: 'Na primeira inicialização o Firewall do Windows pede permissão: marque Redes privadas e permita. Ou, no PowerShell como administrador:',
            },
            {
              code: 'New-NetFirewallRule -DisplayName "Wanmory AI" -Direction Inbound -Protocol TCP -LocalPort 3003 -Action Allow',
              lang: 'powershell',
            },
            {
              p: '`ipconfig` mostra o endereço IPv4 do PC.',
            },
          ],
        },
        {
          title: 'Iniciar automaticamente (opcional)',
          body: [
            {
              p: 'Crie `start-ai.cmd` na pasta ml:',
            },
            {
              code: `@echo off
cd /d %~dp0
set WANMORY_ML_TOKEN=seu-token
uv run --extra torch python -m wanmory_ml`,
              lang: 'cmd',
            },
            {
              p: 'Aperte Win+R, digite `shell:startup` e coloque um atalho para esse arquivo na pasta que abrir; ele inicia ao entrar no Windows. Para rodar sem entrar, crie uma tarefa no Agendador de Tarefas com o gatilho “Ao iniciar o computador” e esse start-ai.cmd como ação.',
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
uv sync --extra torch        # no Linux o PyTorch do PyPI já vem com CUDA; sem GPU basta uv sync
export WANMORY_ML_TOKEN=$(openssl rand -hex 24)
WANMORY_FACE_MODEL_PRELOAD=1 uv run --extra torch python -m wanmory_ml
sudo ufw allow 3003/tcp      # se usar o firewall ufw`,
      lang: 'bash',
    },
    {
      p: 'Para iniciar no boot, escreva um serviço systemd: o comando uv run acima em `ExecStart` (com o caminho completo `~/.local/bin/uv`), a pasta ml em `WorkingDirectory` e o token em `Environment=`.',
    },
    {
      h3: 'Variáveis de ambiente comuns',
    },
    {
      table: ['Variável', 'Padrão', 'O que faz'],
      rows: [
        [
          '`WANMORY_ML_HOST`',
          '0.0.0.0',
          'Endereço de escuta; 0.0.0.0 permite que outros computadores da rede se conectem.',
        ],
        ['`WANMORY_ML_PORT`', '3003', 'Porta de escuta.'],
        [
          '`WANMORY_ML_TOKEN`',
          'vazio',
          'Token de acesso. Se definido, toda requisição, exceto a verificação de saúde, precisa enviar `Authorization: Bearer <token>`; coloque o mesmo valor no Wanmory.',
        ],
        [
          '`WANMORY_MODEL_DIR`',
          '~/.cache/wanmory/models',
          'Onde os modelos ficam (no Windows, .cache\\wanmory\\models na sua pasta de usuário).',
        ],
      ],
    },
    {
      p: 'As demais estão em [Variáveis de ambiente do serviço de IA](#ai-env).',
    },
    {
      h3: 'Conectar no Wanmory',
    },
    {
      steps: [
        {
          title: 'Escolher o serviço remoto',
          body: [
            {
              p: 'Como administrador, abra Configurações e escolha Serviço remoto no cartão Como a IA é executada.',
            },
          ],
        },
        {
          title: 'Informar URL e token',
          body: [
            {
              p: 'Em URL do serviço, o endereço do computador que roda o serviço de IA, ex. `http://192.168.1.20:3003`; em Token de acesso, o token criado. Clique em Testar conexão; se passar, mostra a latência e a versão. Depois salve.',
            },
          ],
        },
        {
          title: 'Baixar modelos',
          body: [
            {
              p: 'Conectado, se o nível estiver em Automático ele é recomendado de novo conforme o hardware daquele computador; baixe os modelos necessários em Nível do modelo e a IA começa a processar as fotos.',
            },
          ],
        },
      ],
    },
    {
      note: 'Use o serviço de IA remoto só na rede local ou por VPN (como Tailscale), sempre defina um token e nunca exponha a porta 3003 direto na internet. Se o computador que o roda desligar ou dormir, o processamento pausa e continua sozinho quando ele voltar.',
      warn: true,
    },
    {
      h2: 'ai-schedule',
    },
    {
      p: 'Depois de importar fotos, a leitura dos dados e as miniaturas acontecem na hora; quando o reconhecimento por IA (rostos, busca inteligente, texto) roda é definido em Configurações → Processamento em segundo plano, e as mudanças valem na hora. O topo do cartão mostra se a IA pode rodar agora e, se não, por quê.',
    },
    {
      table: ['Configuração', 'Opção', 'O que faz'],
      rows: [
        [
          'Quando processar',
          'Quando ocioso (padrão)',
          'Pausa a IA enquanto fotos estão sendo enviadas ou miniaturas geradas, e continua quando fica calmo.',
        ],
        [
          '',
          'A qualquer momento',
          'Processa sem esperar os envios; eles podem ficar mais lentos. A espera após envios não vale aqui.',
        ],
        [
          '',
          'À noite',
          'Só processa no horário definido (padrão 1:00–7:00; pode passar da meia-noite, ex. 23:00 às 7:00) e também evita envios nesse horário.',
        ],
        [
          'Espera após envios',
          '30 s (padrão), 5 / 15 / 30 min, 1 / 2 / 4 h',
          'Depois que os envios terminam, a IA espera esse tempo antes de começar, para não se meter entre lotes. Vale para Quando ocioso e À noite. Para deixar para amanhã, escolha À noite.',
        ],
      ],
    },
    {
      ul: [
        'Se os modelos do nível atual não foram baixados, a IA fica pausada qualquer que seja o horário; começa sozinha quando você os baixa em Nível do modelo.',
        'Enquanto houver um envio não terminado (inclusive os que podem continuar depois de uma queda de conexão), a IA espera.',
        'Durante a pausa, as tarefas ficam na fila: nada se perde e nada conta como falha.',
      ],
    },
    {
      h2: 'ai-models',
    },
    {
      p: 'O nível define quais modelos são usados para rostos e busca semântica. No "Automático", o sistema recomenda um nível conforme o hardware da máquina do serviço de IA: "Alta precisão" se houver GPU utilizável; só com CPU, "Leve" abaixo de 6 GB de memória e "Equilibrado" nos demais casos.',
    },
    {
      table: ['Nível', 'Detecção + características de rostos', 'Busca semântica', 'Hardware indicado'],
      rows: [
        [
          'Alta precisão (quality)',
          'antelopev2 (SCRFD-10G + ArcFace R100)',
          'Chinese-CLIP ViT-H/14 (1024-d)',
          'Mac com Apple Silicon, GPU NVIDIA',
        ],
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
    {
      h2: 'ai-env',
    },
    {
      table: ['Variável', 'Padrão', 'Descrição'],
      rows: [
        ['`WANMORY_ML_HOST`', '0.0.0.0', 'Endereço de escuta.'],
        ['`WANMORY_ML_PORT`', '3003', 'Porta de escuta.'],
        [
          '`WANMORY_ML_TOKEN`',
          'vazio',
          'Token de acesso; quando definido, toda requisição precisa incluir Authorization: Bearer.',
        ],
        ['`WANMORY_MODEL_DIR`', '~/.cache/wanmory/models', 'Pasta dos modelos; /models dentro da imagem.'],
        ['`WANMORY_AUTO_DOWNLOAD`', '0 na imagem', 'Se os modelos são baixados automaticamente no primeiro uso.'],
        [
          '`WANMORY_FACE_MODEL_PRELOAD`',
          '—',
          'Com 1, carrega os modelos de rosto ao iniciar; o Chinese-CLIP carrega em segundo plano.',
        ],
        [
          '`WANMORY_UNLOAD_AFTER`',
          '5 / 30 minutos',
          'Segundos de inatividade antes de descarregar um modelo para liberar memória; 0 nunca descarrega. O padrão depende da memória da máquina.',
        ],
      ],
    },
    {
      h2: 'first-run',
    },
    {
      steps: [
        {
          title: 'Crie o administrador',
          body: [
            {
              p: 'No primeiro acesso, o sistema percebe que não há contas e orienta a criação de um administrador. Administradores podem adicionar membros e mudar as configurações do sistema.',
            },
          ],
        },
        {
          title: 'Baixe os modelos',
          body: [
            {
              p: 'Vá em "Configurações do sistema → IA", confirme o nível de modelos e baixe-os. As tarefas de IA esperam na fila até os modelos ficarem prontos.',
            },
          ],
        },
        {
          title: 'Importe fotos',
          body: [
            {
              p: 'Envie pelo app web ou conecte as fotos do NAS como descrito em [Montar pastas de fotos existentes](#library).',
            },
          ],
        },
        {
          title: 'Adicione membros',
          body: [
            {
              p: 'Em "Configurações do sistema → Membros", crie contas para outras pessoas e escolha o papel "Membro" ou "Administrador".',
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
        'O envio web aceita fotos, vídeos, HEIC, RAW (como DNG) e mais, com seleção múltipla; o envio é feito em blocos pelo protocolo tus e retoma após uma queda de rede ou ao recarregar a página.',
        'Os arquivos enviados ficam guardados por ano e mês na pasta de envios (padrão data/upload). A pasta pode ser trocada em "Configurações do sistema → Pasta de envios" e vale só para envios novos.',
        'Depois da importação, roda nesta ordem: leitura de metadados (ExifTool) → miniaturas e prévia de 1440 pixels (libvips / FFmpeg) → vetores semânticos, rostos e texto (serviço de IA) → geocodificação reversa.',
        'O indicador de tarefas no topo da barra lateral mostra, em número de fotos, o progresso e o tempo restante estimado de "Importar fotos" e "Reconhecimento por IA".',
      ],
    },
    {
      h2: 'browse',
    },
    {
      table: ['Recurso', 'Descrição'],
      rows: [
        [
          'Biblioteca',
          'Linha do tempo das fotos agrupada por mês, com o carrossel de escolhas da IA e "Neste dia" no topo.',
        ],
        [
          'Busca em linguagem natural',
          'Digite uma descrição (como "fotos do terceiro aniversário do bebê"); o resultado é ordenado combinando texto reconhecido, local da foto e similaridade semântica do Chinese-CLIP. Digitar o nome de uma categoria devolve essa categoria diretamente.',
        ],
        [
          'Pessoas',
          'Os rostos são agrupados automaticamente; a pessoa aparece quando está em pelo menos 3 fotos. Dê nomes, mescle, defina aniversários e veja o crescimento por idade, os lugares e as fotos em grupo.',
        ],
        [
          'Álbuns · Álbuns inteligentes',
          'Álbuns reúnem fotos escolhidas à mão e podem ser privados; álbuns inteligentes juntam fotos sozinhos por pessoa, lugar, data e outros critérios.',
        ],
        ['Lugares', 'Mostra num mapa onde cada foto foi tirada pelo GPS, com as visões Mapa, Satélite e Grade.'],
        [
          'Sequências e parecidas',
          'Agrupa sozinho sequências e fotos parecidas e recomenda a melhor para manter; "Duplicadas" lista os arquivos com conteúdo idêntico.',
        ],
        [
          'Apresentações de slides',
          'Reproduza a biblioteca, álbuns, pessoas e lembranças; fotos verticais são juntadas de duas ou três numa página, com música de fundo e transições.',
        ],
      ],
    },
    {
      h2: 'members-usage',
    },
    {
      table: ['Papel', 'Permissões'],
      rows: [
        [
          'Administrador',
          'Adicionar e remover membros, redefinir senhas de membros e mudar as configurações do sistema; pode apagar qualquer foto.',
        ],
        [
          'Membro',
          'Enviar, ver e organizar fotos; só pode apagar as que enviou; não pode mudar as configurações do sistema.',
        ],
        [
          'Visitante',
          'Com o acesso de visitantes ligado, quem não entrou pode ver o conteúdo compartilhado só para leitura; álbuns privados e fotos ocultas não aparecem.',
        ],
      ],
    },
    {
      p: 'As informações de pessoas (nomes, mesclagens) são comuns a todos os membros; o número de fotos, as capas e as páginas de pessoas são calculados com as fotos que cada membro pode ver, e as fotos ocultas só aparecem para quem as ocultou.',
    },
    {
      h2: 'settings-members',
    },
    {
      ul: [
        'Membros: ao adicionar, defina nome, senha inicial (mínimo de 4 caracteres) e papel; é possível redefinir a senha de um membro ou removê-lo.',
        'Histórico de acessos: registra a hora, o aparelho e o IP de cada acesso, com o local estimado offline pelo IP (ip2region), e guarda os últimos seis meses. Só os administradores veem.',
        'Em "Minha conta", cada membro pode trocar a senha e o avatar e ver em quais aparelhos está conectado.',
      ],
    },
    {
      h2: 'settings-ai',
    },
    {
      table: ['Configuração', 'Opções', 'Descrição'],
      rows: [
        [
          'Modo de execução da IA',
          'Embutido (só CPU) / Serviço remoto',
          'Um serviço remoto precisa de endereço e token, e a conexão é testada antes da troca; o processamento de IA pausa enquanto o serviço estiver indisponível.',
        ],
        [
          'Dispositivo de processamento',
          'Automático / GPU / Só CPU',
          'Sem placa de vídeo utilizável, só a CPU pode ser escolhida; a troca recarrega os modelos, e o processamento de IA em andamento continua logo depois.',
        ],
        [
          'Nível de modelos',
          'Automático / Alta precisão / Equilibrado / Leve',
          'Depois da troca, todas as fotos são reprocessadas com os novos modelos, com o progresso exibido.',
        ],
        [
          'Gerenciar modelos',
          'Baixar / Apagar',
          'Lista o tamanho e o estado de cada modelo (em uso, baixado, não baixado).',
        ],
      ],
    },
    {
      h2: 'settings-perf',
    },
    {
      table: ['Configuração', 'Opções', 'Descrição'],
      rows: [
        [
          'Quando processar',
          'Ocioso / Sempre / À noite',
          'Quando ocioso: pausa a IA durante envios e geração de miniaturas; A qualquer momento: processa sem parar, envios podem ficar lentos; À noite: só no horário definido. Veja [Quando a IA trabalha](#ai-schedule).',
        ],
        [
          'Espera após envios',
          '30 s – 4 h',
          'Quanto a IA espera depois que os envios terminam; vale para Quando ocioso e À noite.',
        ],
        [
          'Paralelismo do processamento de fotos',
          'Número',
          'Quantas fotos são lidas e miniaturizadas ao mesmo tempo; o padrão é calculado pelos núcleos e pela memória.',
        ],
        ['Paralelismo da IA', 'Número', 'Quantas fotos são enviadas ao mesmo tempo ao serviço de IA.'],
        ['Threads de CPU', 'Número', 'Threads de CPU usadas por cada modelo na inferência.'],
      ],
    },
    {
      p: 'O topo do cartão mostra ao vivo o estado da IA (rodando ou o motivo da pausa). As mudanças valem na hora, sem reiniciar.',
    },
    {
      h2: 'settings-general',
    },
    {
      table: ['Configuração', 'Padrão', 'Descrição'],
      rows: [
        [
          'Pasta de envios',
          'data/upload',
          'Os arquivos enviados ficam por ano e mês; a mudança vale só para envios novos.',
        ],
        [
          'Acesso de visitantes',
          'Ligado',
          'Permite ver o conteúdo compartilhado sem entrar. Recomenda-se desligar se houver acesso pela internet.',
        ],
        [
          'Mapas on-line',
          'Ligado',
          'Mostra mapas, nomes de lugares e busca de lugares, enviando a localização das fotos ao serviço de mapas; desligado, só aparecem coordenadas.',
        ],
        [
          'Provedor de mapas',
          'Automático',
          'Automático: AMap na China continental e OpenStreetMap no resto; também dá para fixar um dos dois.',
        ],
        ['Domínio de acesso', 'wanmory.local', 'Domínio de acesso na rede local; precisa terminar em .local.'],
      ],
    },
    {
      h2: 'settings-update',
    },
    {
      p: '"Configurações do sistema → Atualização do sistema" mostra as versões atuais do backend e do serviço de IA e avisa quando há versão nova. Para atualizar, rode na pasta onde está o `docker-compose.yml`:',
    },
    {
      code: 'docker compose pull && docker compose up -d',
      lang: 'bash',
    },
    {
      p: 'As migrações do banco rodam sozinhas quando o server inicia. Se você fixou uma versão com `WANMORY_VERSION`, mude antes a tag no `.env`.',
    },
    {
      note: 'Os passos completos estão em [Atualizar](#update).',
    },
    {
      h2: 'update',
    },
    {
      p: 'Quando sai uma versão nova, Configurações → Atualização do sistema avisa e mostra as notas de cada versão (também na página [Versões](/releases/)). Atualizar só troca o programa; fotos, banco de dados, configurações e modelos são mantidos.',
    },
    {
      steps: [
        {
          title: 'Ir para a pasta de instalação',
          body: [
            {
              code: 'cd ~/wanmory   # sua pasta de instalação (a que tem docker-compose.yml e .env)',
              lang: 'bash',
            },
          ],
        },
        {
          title: 'Baixar as imagens novas e reiniciar',
          body: [
            {
              code: `docker compose pull
docker compose up -d`,
              lang: 'bash',
            },
            {
              p: 'O Wanmory atualiza a estrutura do banco ao iniciar; recarregue a página depois de alguns segundos a um minuto.',
            },
          ],
        },
        {
          title: 'Remover imagens antigas (opcional)',
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
      note: 'Se o `.env` fixa uma versão com `WANMORY_VERSION`, troque pelo número novo (ou apague a linha para usar a mais recente) antes de rodar os comandos. Também dá para rodar de novo o script de instalação mantendo a configuração (`Keep the existing configuration` → Y): o resultado é o mesmo e ainda baixa o `docker-compose.yml` mais recente.',
    },
    {
      h2: 'backup',
    },
    {
      p: 'São três tipos de dados para guardar no backup:',
    },
    {
      table: ['Dados', 'Local', 'Descrição'],
      rows: [
        [
          'Banco de dados',
          'volume nomeado pgdata',
          'Metadados das fotos, pessoas, álbuns, configurações, vetores e fila de tarefas.',
        ],
        [
          'Envios e miniaturas',
          './data',
          'Originais enviados (data/upload) e miniaturas (data/thumbs); as miniaturas podem ser geradas de novo.',
        ],
        [
          'Pastas de fotos',
          'pastas montadas em /photos',
          'Cobertas pelo plano de backup do próprio NAS; o app nunca altera pastas montadas só para leitura.',
        ],
      ],
    },
    {
      lang: 'bash',
      code: `# Exportar o banco de dados
docker compose exec -T postgres pg_dump -U wanmory -Fc wanmory > wanmory-$(date +%F).dump

# Restaurar numa instalação nova (rode antes docker compose up -d postgres)
docker compose exec -T postgres pg_restore -U wanmory -d wanmory --clean < wanmory-2026-11-10.dump`,
    },
    {
      note: 'Os modelos em ./models não precisam de backup; podem ser baixados de novo pelo app web.',
    },
    {
      h2: 'reset-password',
    },
    {
      p: 'Quando um membro esquece a senha, um administrador a redefine em "Configurações do sistema → Membros". Se o administrador esquecer a própria, rode na máquina onde o app funciona, na pasta onde está o `docker-compose.yml`:',
    },
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
    {
      h2: 'troubleshooting',
    },
    {
      table: ['Sintoma', 'O que verificar'],
      rows: [
        [
          'Não abre wanmory.local',
          'Confira se o serviço mdns está rodando (docker compose ps); alguns Android não suportam mDNS, use o IP; veja se a porta 5353 está ocupada na máquina.',
        ],
        [
          'As configurações de IA mostram "Sem conexão, processamento de IA pausado"',
          'No modo embutido, veja os logs do contêiner ml (docker compose logs ml); no modo remoto, confira se endereço, porta, firewall e token batem.',
        ],
        [
          'Sem resultados em Pessoas ou na busca',
          'Confira se os modelos foram baixados; em "Desempenho", veja se a IA está pausada pelo horário de processamento; acompanhe o reconhecimento no indicador de tarefas.',
        ],
        [
          'Envios grandes falham',
          'O limite de tamanho de requisição do proxy reverso está baixo demais; ajuste o client_max_body_size como em "Proxy reverso e acesso pela internet".',
        ],
        [
          'As fotos de uma pasta montada não aparecem',
          'As pastas precisam ser montadas como subpastas de /photos; a primeira varredura acontece cerca de 20 segundos após iniciar e depois a cada 15 minutos; pastas ocultas são ignoradas.',
        ],
        ['Download das imagens lento ou com falha', 'Defina no .env o WANMORY_REGISTRY com um registro acessível.'],
      ],
    },
    {
      p: 'Veja os logs de cada serviço com `docker compose logs -f server` e `docker compose logs -f ml`. Se o problema continuar, conte para nós na página [Relatar um problema](/feedback/), com o número da versão e os logs relevantes.',
    },
    {
      h2: 'uninstall',
    },
    {
      p: 'Execute no computador onde o Wanmory roda:',
    },
    {
      code: 'curl -fsSL https://wanmory.com/uninstall.sh | bash',
      lang: 'bash',
    },
    {
      p: 'Por padrão só os contêineres são removidos e todos os dados ficam: ele pergunta item por item, e Enter sempre significa manter (N). As pastas de fotos que você montou (NAS, discos externos) nunca são apagadas.',
    },
    {
      steps: [
        {
          title: 'Locating installation',
          body: [
            {
              p: 'Pergunta o `Install directory`; Enter usa ~/wanmory. A pasta precisa ter o `docker-compose.yml` do Wanmory, senão o script para. Depois lista a quantidade de contêineres, onde está o banco, as pastas de dados e de modelos com o tamanho, e suas pastas de fotos montadas (marcadas `never deleted`).',
            },
          ],
        },
        {
          title: 'Choose what to remove',
          body: [
            {
              p: 'Contêineres e rede são sempre removidos. Cada item abaixo é perguntado uma vez:',
            },
            {
              table: ['Pergunta', 'O que é apagado'],
              rows: [
                [
                  '`Delete the database`',
                  'O banco de dados (volume Docker pgdata ou a pasta de `WANMORY_DB_DIR`): pessoas, álbuns, configurações, resultados de IA e contas. Não dá para desfazer.',
                ],
                [
                  '`Delete the data directory`',
                  'A pasta de dados: miniaturas e **as fotos originais enviadas pela página**.',
                ],
                ['`Delete the AI models`', 'A pasta de modelos de IA; dá para baixar de novo depois de reinstalar.'],
                [
                  '`Remove the Docker images`',
                  'As imagens Docker usadas pelo Wanmory (incluindo postgres/pgvector); dá para baixar de novo.',
                ],
                [
                  '`Delete the configuration files`',
                  '`.env` (com a senha do banco), `docker-compose.yml`, `docker-compose.override.yml`; se a pasta de instalação ficar vazia, também é removida.',
                ],
              ],
            },
          ],
        },
        {
          title: 'Summary',
          body: [
            {
              p: 'Resume o que vai acontecer. Se você escolheu apagar o banco ou a pasta de dados, é preciso digitar `DELETE` em maiúsculas para continuar; qualquer outra coisa cancela sem mudar nada. Caso contrário, pergunta `Proceed` uma vez. Se você mantém o banco mas apaga o `.env`, lembra de anotar antes o `WANMORY_DB_PASSWORD`.',
            },
          ],
        },
        {
          title: 'Removing',
          body: [
            {
              p: 'Para e remove os contêineres e depois apaga o que foi escolhido. Arquivos gravados pelos contêineres podem pertencer a outro usuário (versões antigas gravavam como uid 1000 ou root); se um rm comum for recusado, o script apaga usando um contêiner temporário que roda como root, e se isso também falhar, indica `sudo rm -rf` para você apagar à mão. O script se recusa a apagar caminhos que claramente não são do Wanmory, como /, /home, /volume1 ou sua pasta pessoal.',
            },
          ],
        },
      ],
    },
    {
      p: 'Se você só removeu os contêineres e manteve dados e configuração, rodar install.sh de novo na mesma pasta traz tudo de volta.',
    },
    {
      table: ['Opção', 'O que faz'],
      rows: [
        ['`--dir PASTA`', 'Pasta de instalação, padrão ~/wanmory (ou defina `WANMORY_DIR`).'],
        [
          '`-y`, `--yes`',
          'Sem perguntas: remove só contêineres e rede, mantém todos os dados e a configuração. Também é o comportamento sem terminal interativo.',
        ],
        [
          '`--purge`',
          'Sem perguntas: apaga tudo da tabela acima (menos suas pastas de fotos) sem digitar DELETE. Use com cuidado.',
        ],
        ['`--dry-run`', 'Mostra o que seria feito sem mudar nada.'],
        ['`-h`, `--help`', 'Mostra a ajuda.'],
      ],
    },
  ],
}

export default docs
