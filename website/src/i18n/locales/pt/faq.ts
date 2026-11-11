import type { FaqDict } from '../zh/faq'

// Português (Brasil) · Perguntas frequentes

const faq: FaqDict = {
  title: 'Perguntas frequentes',
  lead: 'As respostas para as perguntas que mais recebemos. Não achou a sua? Abra uma issue no GitHub ou consulte a documentação completa de instalação e uso.',
  readDocs: 'Ler a documentação',
  submit: 'Relatar um problema',
  categories: 'Categorias de perguntas',
  all: 'Todas',
  showAll: 'Ver todas as {n} perguntas',
  groups: [
    {
      key: 'deploy',
      label: 'Instalação',
      items: [
        {
          q: 'Que hardware preciso para rodar o Wanmory?',
          a: 'Qualquer aparelho x86_64 ou ARM64 que rode Docker: um NAS, um mini PC ou um Raspberry Pi 5. A partir de 4 GB de memória, o sistema escolhe sozinho os modelos leves; com 8 GB ou mais, dá para usar o nível Equilibrado. Para bibliotecas grandes ou IA mais rápida, o serviço de IA pode rodar num computador com GPU ou num Mac com Apple Silicon.',
        },
        {
          q: 'Funciona num NAS Synology ou QNAP?',
          a: 'Sim. O Wanmory é instalado com Docker Compose e roda no Synology DSM, QNAP QTS, TrueNAS SCALE, Unraid e em distribuições Linux como Ubuntu e Debian. Há imagens para amd64 e arm64, e a certa é baixada automaticamente.',
        },
        {
          q: 'Preciso enviar de novo as fotos que já estão no NAS?',
          a: 'Não. Monte suas pastas de fotos em /photos no docker-compose.yml. Dá para montar várias, e o recomendado é só leitura (:ro). As pastas são varridas a cada 15 minutos e as fotos novas importadas no lugar, sem copiar nem mover os originais.',
        },
        {
          q: 'O download das imagens está lento. O que faço?',
          a: 'Defina o WANMORY_REGISTRY no arquivo .env ao lado do docker-compose.yml com um registro acessível e rode docker compose up -d de novo.',
        },
        {
          q: 'Como atualizo para uma versão nova?',
          a: 'Rode docker compose pull && docker compose up -d na pasta onde está o docker-compose.yml. As migrações do banco rodam sozinhas na inicialização, sem mexer nas suas fotos, pessoas e álbuns. Em "Configurações do sistema → Atualização do sistema", o app web avisa quando há uma versão nova.',
        },
        {
          q: 'E se eu esquecer a senha de administrador?',
          a: 'Na máquina onde o app roda, vá até a pasta do docker-compose.yml, rode docker compose exec server wanmory reset-password, escolha a conta e digite uma senha nova seguindo as instruções. As senhas dos membros comuns são redefinidas por um administrador em "Configurações do sistema → Membros".',
        },
      ],
    },
    {
      key: 'ai',
      label: 'IA e privacidade',
      items: [
        {
          q: 'Minhas fotos vão para a nuvem?',
          a: 'Não. Fotos, miniaturas, banco de dados e todos os resultados da IA ficam no aparelho onde o Wanmory roda. Os modelos de IA só são baixados no primeiro uso; depois disso, reconhecimento facial, busca semântica e reconhecimento de texto acontecem localmente.',
        },
        {
          q: 'Dá para usar a IA num NAS fraco?',
          a: 'Dá. O serviço de IA embutido usa só a CPU. A primeira passada numa biblioteca grande demora mais, e depois as fotos novas são processadas conforme chegam. Em "Desempenho e recursos", você pode limitar o processamento aos momentos ociosos ou à noite, para não atrapalhar o uso diário.',
        },
        {
          q: 'O serviço de IA pode ficar em outro computador?',
          a: 'Pode. Rode o serviço de IA num Mac ou num computador com placa de vídeo NVIDIA, escolha "Serviço remoto" em "Configurações do sistema → IA" e informe o endereço e o token de acesso. O serviço de IA só recebe prévias de 1440 pixels e nunca toca nos originais nem no banco de dados.',
        },
        {
          q: 'A IA precisa de internet o tempo todo?',
          a: 'Não. Depois de baixar os modelos, tudo pode rodar offline. Só os mapas on-line e a busca reversa de nomes de lugares precisam de internet, e os dois podem ser desligados nas configurações; aí os lugares mostram só coordenadas.',
        },
        {
          q: 'Como os rostos são agrupados?',
          a: 'O sistema detecta os rostos em cada foto e calcula um vetor de características de cada um; rostos parecidos vão automaticamente para a mesma pessoa. A pessoa só aparece quando está em pelo menos 3 fotos, então quem aparece por acaso não é cadastrado. Dê nome e aniversário para rever o crescimento por idade.',
        },
        {
          q: 'Quais tipos de busca são aceitos?',
          a: 'Busca em linguagem natural em chinês, por exemplo "宝宝三岁生日的照片" (fotos do terceiro aniversário do bebê) ou "海边的日落" (pôr do sol na praia); também é possível buscar o texto que aparece nas fotos (documentos, capturas de tela, placas) e o local da foto. Os três tipos de resultado são combinados e ordenados, e só voltam as fotos claramente relevantes.',
        },
      ],
    },
    {
      key: 'usage',
      label: 'Uso e recursos',
      items: [
        {
          q: 'Como abro a biblioteca no celular?',
          a: 'Na mesma rede local, abra http://wanmory.local:8080 no navegador do celular. iPhone, iPad, Mac e Windows não precisam de configuração no roteador. Alguns aparelhos Android não aceitam domínios .local; nesse caso, use o endereço IP.',
        },
        {
          q: 'Quais formatos de foto e vídeo são aceitos?',
          a: 'Os formatos de foto comuns, como JPEG, PNG, HEIC e RAW (por exemplo, DNG), além dos formatos de vídeo comuns. Os envios web retomam depois de uma queda de rede ou ao recarregar a página.',
        },
        {
          q: 'Dá para recuperar fotos apagadas?',
          a: 'Dá. As fotos apagadas vão primeiro para "Apagadas recentemente", de onde podem ser restauradas a qualquer momento. Nas pastas montadas só para leitura, os arquivos originais continuam lá mesmo depois da exclusão definitiva no app; eles só deixam de aparecer.',
        },
        {
          q: 'Como organizo sequências e fotos duplicadas?',
          a: '"Sequências e parecidas" agrupa sozinho as sequências e as fotos quase iguais e recomenda manter a mais nítida; o resto vai com um clique para "Apagadas recentemente". Arquivos com conteúdo exatamente igual aparecem separados em "Duplicadas".',
        },
      ],
    },
    {
      key: 'members',
      label: 'Membros e permissões',
      items: [
        {
          q: 'Várias pessoas podem usar juntas?',
          a: 'Podem. Um administrador cria uma conta para cada pessoa, e as fotos que cada uma envia se juntam na mesma biblioteca. Os membros só podem apagar as fotos que enviaram, os administradores cuidam de tudo, e o histórico de acessos registra a hora, o aparelho e o local aproximado de cada acesso.',
        },
        {
          q: 'Outros membros veem as fotos que eu oculto?',
          a: 'Não. As fotos ocultas só aparecem para você, e os álbuns privados só para quem os criou. Os nomes e as mesclagens de pessoas são compartilhados, mas o número de fotos e as capas que cada membro vê são calculados só com as fotos que ele pode ver.',
        },
        {
          q: 'O que é o acesso de visitantes?',
          a: 'Com o acesso de visitantes ligado, quem não entrou pode ver as fotos compartilhadas só para leitura; álbuns privados e fotos ocultas continuam invisíveis. Se a sua biblioteca for acessível pela internet, recomendamos desligar o acesso de visitantes nas configurações.',
        },
      ],
    },
  ],
}

export default faq
