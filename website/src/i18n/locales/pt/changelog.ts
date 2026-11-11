// Português (Brasil) · Tradução do CHANGELOG.md, por versão, uma frase por item na mesma ordem.
// O prefixo "修复：" (Correção) aparece como ícone e é omitido aqui.
// Versões ausentes (ou com número de itens diferente) aparecem no chinês original.

const changelog: Record<string, string[]> = {
  'v0.3.1': [
    "O mapa de Lugares agora pode ser ampliado, reduzido e arrastado: zoom com a roda do mouse ou o trackpad, clique duplo para ampliar, arrastar para mover, pinça com dois dedos no celular, e botões no canto inferior direito para ampliar, reduzir ou ver o mundo todo; perto do nível de país ele muda para um mapa de ruas (os mapas on-line precisam estar ativados) com cidades, estradas e nomes de lugares, e os alfinetes de fotos vão se dividindo conforme você amplia, até cada local de foto; ao voltar das fotos, o mapa continua onde estava",
    "Site: o calendário da página de versões agora é um calendário mensal com os números de versão de cada dia, e clicar numa versão leva às notas dela; corrigido o problema de páginas que às vezes carregavam sem estilo em conexões lentas ou logo após uma atualização do site",
  ],
  'v0.3.0': [
    "Novo site: início, arquitetura, instalação e documentação, perguntas frequentes, versões e feedback, em 12 idiomas; por padrão segue o idioma do navegador, e você pode trocar no rodapé da página",
    "Scripts de instalação e desinstalação com um comando (install.sh, uninstall.sh): na instalação, defina a porta, o domínio, a senha e o local do banco de dados, o fuso horário, o diretório de dados e o de fotos; você escolhe onde ficam o banco de dados, os dados e os modelos (WANMORY_DB_DIR, WANMORY_DATA_DIR, WANMORY_MODELS_DIR), e WANMORY_DOMAIN define o domínio usado na sua rede local",
    "Lugares agora é um mapa-múndi plano: os países visitados aparecem numa cor quente, cada cidade tem um alfinete com foto e o nome da cidade e do país, e um clique abre as fotos tiradas lá; no canto superior direito ficaram só Mapa / Grade, e o mapa de ruas e o globo de satélite foram removidos",
    "A página de Álbuns usa cartões grandes: capa quadrada com o nome e a quantidade de itens embaixo, um cadeado nos álbuns privados e o nome de quem criou os álbuns de outras pessoas; excluir um álbum usa a caixa de confirmação padrão, e Adicionar fotos dentro de um álbum agora é um botão principal em destaque",
    "A página de Pessoas mostra retratos grandes 3:4 com o nome e a quantidade embaixo; clique no nome para renomear. O cabeçalho de cada pessoa ficou mais simples: avatar, nome e idade, com os anos e a quantidade de fotos e vídeos na linha de baixo, e à direita as abas Fotos, Crescimento, Lugares e Juntos; os cartões de Crescimento, Juntos e Lugares têm o mesmo tamanho das páginas de Pessoas e Álbuns",
    "Todos os títulos de página agora ficam numa só linha: o título grande seguido de uma descrição em cinza",
    "Em celulares e outras telas estreitas, há uma barra com o logotipo no topo, e o menu desliza pela direita",
    "Conta de demonstração: a conta chamada demo (pode ser trocada com WANMORY_DEMO_USER) não pode mudar a senha, sair de outros dispositivos nem excluir nada; pode enviar arquivos, e pode excluir as fotos que enviou e os álbuns que criou nos últimos 30 minutos",
    "Melhorias nas memórias em destaque, no histórico de login, nos avatares, na nota estética, na localização por IP e mais",
  ],
  'v0.2.9': [
    'Novo logotipo: um "M" de um só traço dentro de um círculo fino, com um ponto vermelho; as abas do navegador também passam a mostrar um ícone',
    'O menu da esquerda pode ser recolhido numa barra estreita só com ícones (clique no logotipo para abrir); agora ele se divide em três grupos: Principais, Categorias e Organizar. Categorias reúne Favoritos, Classificação, Vídeos, Paisagens, Comida, Animais e Plantas, com Capturas de tela, Documentos e Identidades em "Mais"',
    'Nova categoria "Plantas", e "Pets" passa a se chamar "Animais" (aves e animais de zoológico também contam); buscar o nome de uma categoria (Comida, Paisagens…) mostra direto as fotos dela',
    'Nova página "Minha conta": clique no avatar no canto inferior esquerdo do menu para trocar avatar, nome e senha, ver os aparelhos conectados (navegador, IP, último uso) e desconectar os outros; o tema também fica aqui',
    'As configurações do sistema agora são uma série de cartões: Membros, Modo de execução da IA (com teste de conexão e aviso em caso de falha), Dispositivo de processamento, Nível de modelos (modelos baixados podem ser apagados), Processamento em segundo plano, Pasta de envios, Acesso de visitantes, Mapas on-line e Atualização do sistema; os modelos agora são baixados automaticamente da fonte mais rápida, Hugging Face ou um espelho na China',
    'Todas as janelas pop-up passam a ter o mesmo visual de vidro fosco translúcido, com botões principais e secundários; erros ao adicionar um membro ou trocar a senha aparecem dentro da própria janela',
    'As "Configurações de compartilhamento" de um álbum passam a se chamar "Permissões": Todos, Membros escolhidos, Só eu',
    'Fundo mais escuro no modo escuro; todos os botões e seletores segmentados do app agora têm um só estilo',
    'O ícone das tarefas em segundo plano continuava girando e mostrando 0 depois que todas as tarefas terminavam',
  ],
  'v0.2.8': [
    'A área de conteúdo passa a ter fundo branco (para cores mais fiéis) e o menu da esquerda fica bege; o armazenamento no rodapé do menu vira um pequeno cartão branco',
    'O botão de reproduzir agora é só um ícone redondo laranja, que mostra "Apresentação de slides" ao passar o mouse',
    'Cabeçalho da página de pessoa mais limpo: sem degradê, com borda fina, avatar, nome, idade e aniversário em cima e quatro estatísticas embaixo; o aniversário pode ser definido ou alterado logo abaixo do nome, e o cabeçalho é igual nas abas Fotos, Crescimento, Lugares e Juntos',
  ],
  'v0.2.7': [
    'Um visual quente totalmente novo: fundo branco-gelo, destaque laranja-tijolo e fonte serifada nos títulos, nomes, lembranças e datas; um novo logotipo laranja',
    'Toda página agora tem uma caixa de busca no topo (busca na biblioteca inteira); calendário, ordenação, filtro e tamanho de exibição à direita ficam num só grupo de botões, e reproduzir vira um botão laranja "Apresentação de slides" em todo lugar',
    'As fotos da biblioteca, dos favoritos, dos álbuns e das pessoas ficam agrupadas por mês, cada grupo com um título como "Novembro de 2026"',
    '"Neste dia" agora é um cartão grande com uma única foto',
    'Novo cabeçalho da página de pessoa: avatar grande, idade e aniversário, estatísticas de fotos, vídeos, anos abrangidos e lugares visitados, e as pessoas com quem ela costuma aparecer',
    'O menu da esquerda fica sempre visível (não recolhe mais ao abrir uma pessoa ou um álbum) e mostra o armazenamento usado no rodapé; "Enviar arquivos" passa a se chamar "Enviar fotos / vídeos"',
    'Um clique numa foto já abre em tamanho grande (clique com ⌘ / Ctrl ou ⇧ para selecionar várias); as fotos aparecem com esmaecimento ao trocar de página',
    'Os botões do canto superior direito e a linha do tempo à direita pulavam ao trocar de página, a tela piscava ao abrir uma pessoa e a animação do menu travava no iPad',
    'Diálogos e menus agora têm fundo branco opaco; a barra de ações das fotos selecionadas, as tarefas em segundo plano e a janela de envio usam vidro fosco claro',
    'Esqueceu a senha (mesmo sendo o único administrador ou tendo esquecido até o nome)? Na máquina onde o app roda, execute `docker compose exec server wanmory reset-password`; veja "Esqueci a senha" no README',
  ],
  'v0.2.6': [
    'A barra de título no topo de cada página agora tem a mesma altura e posição, então títulos e botões não pulam mais ao trocar de página',
    'Trocar de página não mostra mais por um instante as fotos da página anterior',
    'No modo claro, a área de conteúdo e o menu da esquerda têm o mesmo fundo',
    'Adicionado "Sair" no rodapé do menu; a engrenagem das configurações do sistema fica escondida para quem não é administrador (clique no seu avatar e nome para as suas próprias configurações)',
    'Tudo o que é clicável mostra o cursor de mãozinha ao passar o mouse',
  ],
  'v0.2.5': [
    'Painel de tarefas em segundo plano simplificado: rostos, conteúdo e texto viram uma única linha "Reconhecimento por IA", e metadados e miniaturas viram "Importar fotos"; ambos mostram o progresso por número de fotos e o tempo restante estimado',
    'Com o nível Automático, o nível é definido mais rápido e o processamento começa antes, mesmo quando o serviço de IA está ocupado logo depois de iniciar',
  ],
  'v0.2.4': [
    'O serviço de IA usa menos memória: modelos sem uso são descarregados sozinhos (depois de 5 minutos em máquinas com menos de 8 GB, 30 minutos nas maiores), os modelos do nível anterior são liberados ao trocar de nível e nenhuma reserva de memória é feita em máquinas com pouca memória. No Raspberry Pi, o serviço de IA quase não ocupa memória quando não está processando fotos',
    'Novo nível Automático (o padrão enquanto nenhum nível foi escolhido): escolhido pelo hardware do servidor de IA, Alta precisão com GPU e, só com CPU, Leve abaixo de 6 GB de memória e Equilibrado acima disso; acompanha a troca de servidor de IA. O processamento de IA só começa depois que o nível é definido',
  ],
  'v0.2.3': [
    'As tarefas em segundo plano continuavam mostrando "IA pausada: há fotos sendo enviadas" muito depois de os envios terminarem. Agora só contam os envios que estão de fato transferindo dados, e a IA continua 30 segundos depois que eles terminam',
    'O topo da biblioteca não mostra mais "Processando / Concluído"; o progresso aparece só no ícone de tarefas no topo do menu',
  ],
  'v0.2.2': [
    'O número da versão aparece no topo do menu; nova seção "Atualização do sistema" nas configurações: mostra as versões do app e do serviço de IA, avisa quando há versão nova e lista as novidades dela',
    'As notas de versão são geradas automaticamente quando uma nova versão é publicada',
  ],
  'v0.2.1': [
    'O processamento em segundo plano se ajusta à máquina: quantas fotos a IA processa por vez e quantas threads cada modelo usa dependem da existência de GPU, do número de núcleos e da memória, então o Raspberry Pi não trava mais',
    'Quando a IA processa: Ocioso (padrão; pausa enquanto alguém envia fotos ou miniaturas são geradas), Sempre ou Só à noite',
    'Nova seção "Desempenho" nas configurações para mudar tudo isso à mão; o nível de IA é recomendado pelo hardware do servidor',
    'Ícone de tarefas em segundo plano no topo do menu: aparece quando há tarefas rodando e, ao abrir, mostra o progresso de cada tipo de tarefa e se a IA está pausada',
    'O docker-compose.yml de instalação agora inclui o banco de dados, então um único arquivo basta para instalar',
  ],
  'v0.2.0': [
    'Acesso de visitantes: ver fotos e álbuns compartilhados só para leitura, sem entrar (pode ser desligado nas configurações)',
    'Nova janela de login',
    'Álbuns podem ser privados ou compartilhados só com membros escolhidos; um álbum privado também pode ocultar as fotos que você enviou para ele',
  ],
  'v0.1.0': ['Primeira versão: biblioteca, álbuns, pessoas (reconhecimento facial), lugares, favoritos, classificações, busca semântica e reconhecimento de texto'],
}

export default changelog
