# Changelog

O que mudou em cada versão da Tucano, da mais nova para a mais antiga. Antes de
atualizar, leia "Atenção ao atualizar": ali está o que pede mudança no seu
projeto.

## Ainda não publicado

### Novo

- O editor ganhou variáveis: `variables: [{ name, label, example }]` põe um
  botão na barra e abre uma lista ao digitar `{`, que filtra pelo que vem
  depois da chave e escreve `{{nome}}` no texto — texto puro, do jeito que o
  template do servidor já espera. `editor.unknownVariables()` aponta o que está
  escrito no texto e não está na lista, que é o erro de digitação de sempre.
  Sem `variables`, nada muda no editor.

### Mudou

- Menu suspenso aberto por clique não destaca mais o primeiro item: com o
  ponteiro noutro canto, o item aceso parecia escolha feita. A primeira seta é
  que destaca. Aberto pelo teclado (`Enter`, `Espaço` ou seta no gatilho), o
  primeiro item continua nascendo destacado. Vale também para o menu do botão
  direito e para a lista de variáveis, que são o mesmo menu.

## 0.35.0 — 2026-09-20

### Novo

- Menu do botão direito (`ContextMenu`, `data-tuc-contextmenu`): o mesmo menu
  suspenso, aberto no ponto do clique. `match` diz qual pedaço da área é o
  alvo, `items` também aceita função para montar as ações da linha clicada, e o
  menu do navegador continua com `Shift` + botão direito. A tecla de menu e o
  `Shift+F10` abrem a partir do alvo com foco.

### Mudou

- O título de grupo do menu suspenso deixou de ser em caixa alta. "CONTRATO"
  gritava mais que os próprios itens do menu.

## 0.34.0 — 2026-09-18

### Atenção ao atualizar

- O valor de um editor vazio passou de `<p><br></p>` para `''`, no `getValue()`
  e no `<textarea>` que vai no POST. Quem reconhecia o vazio comparando com
  `<p><br></p>`, no JavaScript ou no servidor, passa a receber string vazia — e
  um campo `required` agora barra o envio, como deveria.
- Com o script carregado por `defer`, a inicialização automática agora espera o
  `DOMContentLoaded`, em vez de rodar no instante em que o script executa. É o
  que dá tempo de chamar `Tucano.setTexts()` antes de os componentes montarem.
  Um script seu, também em `defer`, que lia `elemento._tucano` logo ao executar
  passa a encontrar `undefined`: leia dentro de um listener do
  `DOMContentLoaded`.
- O formato de moeda em reais passou de `real` para `brl`, em inglês como os
  outros nomes de código: `data-tuc-mask="brl"`, `data-tuc-format="brl"`,
  `format: 'brl'` e `Tucano.FORMATS.brl`. `real` deixou de funcionar: o campo
  fica sem máscara e o texto de exibição aparece cru.
- `Tucano.mask.format(valor, 'document')`, apelido não documentado de
  `'cpf-cnpj'`, foi removido. Use `'cpf-cnpj'`.
- Os eventos da tabela ganharam o prefixo dos outros: `tuc:sort` agora é
  `tucano:sort`, e `tuc:select` é `tucano:select`. Os nomes antigos não
  disparam mais.
- A opção `openOnFocus` do date picker foi removida. Ela existia só para manter
  o comportamento antigo de abrir o calendário ao chegar de `Tab`; abrir
  continua sendo `↓`, `Espaço` com o campo vazio ou clique.
- A busca no servidor do select lê só os formatos de resposta documentados:
  `[{value, label}]`, `["a", "b"]`, `{results: [...]}` do DRF e `{id, text}` do
  Select2, com `next` para saber se há outra página. `{items}`, `{data}`, `pk`,
  `name` e `has_more` deixaram de ser lidos: responda num dos formatos acima ou
  use `loadOptions`.
- Nomes em português que sobravam no código: o `Popover` passa ao `onDismiss`
  os motivos `'focus'` e `'detached'` (eram `'foco'` e `'solto'`), e a custom
  property da área do color picker é `--hue` (era `--matiz`).
- Saíram classes de estado que nenhuma regra de CSS lia — `is-multiple` e
  `is-empty` do select, `is-empty` do upload, `is-range` e `is-timed` do date
  picker — e a propriedade `id` da instância de `Table`, que nada usava. Se o
  seu projeto dependia delas, use `.tuc-select-native[multiple] + .tuc-select`,
  `.tuc-select:not(.has-value)`, `instancia.isRange`, `instancia.opts.time` e o
  `id` da própria `<table>`.
- O CSS saiu quase 1 KB menor (gzip) sem os fallbacks que a Tailwind injetava
  para navegadores antigos. Abaixo de Chrome 111, Safari 16.2 e Firefox 113 — a
  base da própria Tailwind 4 —, fundos suaves, anéis de foco e o trilho da
  chave desligada, que usam `color-mix`, deixam de aparecer. E os pesos de fonte
  dos componentes ficam fixos em 500 e 600, sem ler o tema da Tailwind do seu
  projeto.
- Date picker com o botão Aplicar (o padrão com `time`, ou `autoApply: false`):
  escolher dia, hora ou atalho não dispara mais `tucano:change`, `change` nem
  `onChange`. O evento sai uma vez, no Aplicar, e fechar com `Escape` ou clique
  fora descarta a escolha. Antes cada clique já emitia, o Aplicar emitia de novo
  e fechar fora mantinha a mudança. Com `autoApply: true` nada muda. Quem
  salvava a cada evento passa a receber só o valor confirmado.
- Data fora de `min` e `max` deixou de ser puxada para o limite. Digitada, é
  recusada e o valor anterior fica; no `setValue()` e no `value` inicial, o
  campo fica vazio, como já acontecia com `disabledDates`. Antes `2027-01-15`
  com `max` em `2026-12-31` virava 31/12/2026 calado. Período digitado sem um
  fim válido também é recusado inteiro, em vez de valer só o início.
- `Tucano.dates.parseISO()` lê só ISO (`aaaa-mm-dd`, com hora opcional) e
  `Date`. Texto em outro formato caía em `new Date(texto)`, que lê
  `07/09/2026` como 9 de julho, e agora devolve `null`. Para o que a pessoa
  digita, use `Tucano.dates.parseUserInput()`.
- No color picker, o `change` nativo sai uma vez só, quando termina o arrasto na
  área ou nas trilhas, como no `<input type="range">`. O `tucano:change` e o
  `onChange` continuam a cada movimento. Antes o nativo saía a cada pixel, e um
  `hx-trigger="change"` mandava uma requisição por movimento do mouse; quem usava
  o `change` para prévia ao vivo passa a ouvir o `tucano:change`.
- A matiz do color picker para em 360 pelo teclado, em vez de dar a volta para
  0: `→` no fim da trilha não faz mais nada. `Home` e `End` vão aos extremos.
- O upload direto só manda o `X-CSRFToken` lido do cookie para a mesma origem
  da página, como na receita do Django. Antes ele ia junto do arquivo para
  qualquer `url`, inclusive de outro domínio. Quem envia para outra origem e
  precisa do token passa `headers: { 'X-CSRFToken': ... }`.
- No upload direto de um input com `name`, uma resposta 2xx sem o id
  (`responseId`) deixa o arquivo em erro, com "O servidor não devolveu o id".
  Antes ele ficava pronto, com o visto, e o formulário não postava nada.

- O campo de cor sem `value` nasce vazio, em vez de já vir com uma cor que o
  componente escolhia sozinho. Agora `required` barra o envio enquanto ninguém
  escolhe, e o formulário não posta mais uma cor que ninguém pediu. `getValue()`
  devolve `null` nesse estado, e `setValue(null)` ou `setValue('')` limpa. Quem
  contava com a cor de fábrica põe `value="#4f46e5"` no próprio campo.
- No select, `setValue(valor, { silent: true })` e `clear({ silent: true })`
  passam a segurar também o `change` do elemento nativo, e não só o `onChange` e
  o `tucano:change`. É o que o DOM faz quando um script escreve em
  `select.value`. Um `hx-trigger="change"` deixava de ser silencioso e mandava
  uma requisição a cada troca por código. Quem precisa avisar chama sem
  `silent`; a escolha de quem clica ou digita continua disparando.

### Novo

- `data-tuc-reveal` também em texto solto na tela, e não só em campo: um CPF
  num perfil, o cartão numa célula de tabela, uma chave de API num parágrafo. O
  texto aparece escondido, com o olho ao lado, nos mesmos modos (`end`,
  `email`, `all`) e junto com `data-tuc-format`. É só visual: o valor inteiro
  continua no HTML, então o que não pode chegar ao navegador precisa ser
  escondido no servidor.
- `Tucano.setTexts()` troca qualquer texto que os componentes mostram ou
  anunciam: o "Limpar" e o "Aplicar" do date picker, os atalhos de período, o
  "Buscar..." e o "Nenhum resultado" do select, o "Fechar" do modal, da gaveta e
  do toast, os botões do editor, o "Mostrar"/"Ocultar" da máscara e os rótulos
  lidos pelo leitor de tela. Num projeto em inglês ou espanhol, nada mais aparece
  em português. A troca é por grupo (`Tucano.setTexts({ datepicker: { clear:
  'Clear' } })`), vale para o que montar depois, e a opção da instância
  (`data-placeholder`, `emptyText`, `prevText`, `texts` do upload) continua
  vencendo. O português segue como padrão, sem dicionário de idiomas no pacote,
  e `Tucano.getTexts()` devolve os textos atuais. O nome do dia que o leitor de
  tela lê no calendário passou a vir do idioma da página.
- Tipos de TypeScript no pacote, em `dist/tucano.d.ts`, gerados do código a
  cada build e sem peso nenhum no bundle. `import { DatePicker } from 'tucano'`
  e o `Tucano` global do `<script>` (com `checkJs`) passam a ter autocomplete e
  conferência de opções, métodos, do que `getValue()` devolve em cada modo, do
  `detail` dos eventos `tucano:*`, dos grupos e chaves de `Tucano.setTexts()` e
  dos utilitários `Tucano.mask`, `Tucano.dates` e `Tucano.color`.

### Mudou

- O ícone do `.tuc-alert` fica no meio da altura do aviso, e não mais preso à
  primeira linha. Com título e texto ele subia sozinho, enquanto os botões de
  ação ao lado já ficavam centrados.

### Corrigido

- O select não disparava `input` no `<select>` nativo, só `change`. O do
  navegador dispara os dois, nessa ordem: um `hx-trigger="input"` nunca rodava,
  e no Firefox o balão de validação de um envio inválido não fechava quando a
  pessoa escolhia a opção.
- `data-tuc-reveal` num campo sem `data-tuc-mask`, como senha e token, lançava
  erro a cada tecla digitada.
- Campo de senha vazio com `data-tuc-reveal` nascia visível, trocado para
  `type="text"`, e mostrava o que se digitava. Agora nasce sempre escondido.
- Campo só com o olho recebia `inputmode="numeric"`, e o celular abria o
  teclado de números para senha e token. E o campo de senha perdia o
  `autocomplete` do navegador, o que atrapalhava o gerenciador de senhas.
- Alguns textos padrão estavam sem acento: "Mês anterior", "Próximo mês",
  "Próximo" e "Selecionar período" no date picker, "Limpar seleção" no select e
  "Saturação e brilho" no color picker. Quem compara esses textos, num teste do
  próprio projeto, precisa atualizar.
- `Escape` num select, calendário ou color picker aberto dentro de um modal
  fechava o modal junto. Agora fecha só o painel.
- `Escape` no color picker deixava o foco no `<body>`, e o `Tab` seguinte
  recomeçava do topo da página. O foco volta à amostra, como nos outros campos.
- O xadrez atrás de cor translúcida — na amostra, na prévia e na trilha de
  transparência do color picker — não aparecia.
- Select, date picker, color picker, menu e dica saíam do DOM no instante exato
  em que a animação de saída terminaria, e o fim podia sair cortado.
- Período digitado no date picker: `25-12-2025 a 31-12-2025` era cortado nos
  hífens da data, `aa` e `aé` valiam como separador, e o "AM" de um horário de
  12 horas partia o texto. Os separadores agora são `a`, `até` e `-` entre
  espaços, e `–` ou `—`.
- Remover um arquivo no upload direto passava por cima do `X-CSRFToken`
  informado em `headers`; o envio já o respeitava.
- Reabrir um modal ou uma gaveta menos de 200 ms depois de fechar fazia o
  diálogo fechar sozinho logo em seguida: o fechamento agendado não era
  cancelado. Agora reabrir cancela o fechamento pendente.
- Date picker lia data ambígua no formato americano no `value` inicial e no
  `setValue()`: `07/09/2026` virava 9 de julho num campo em português, também
  com hora. Texto agora passa pela leitura do idioma, e `Date` entra como está.
- Data digitada no date picker não disparava `tucano:change` nem `onChange`, o
  `Enter` com o painel aberto não confirmava nem fechava e o `Escape` não
  descartava o texto: a prévia gravava o valor enquanto se digitava.
- Começar um período novo e fechar com `Escape` ou clique fora apagava o
  período que já estava escolhido. Agora ele volta.
- Fechar e reabrir em menos de 200 ms o date picker, o select, o color picker,
  o menu ou a dica tirava o painel do DOM com o componente ainda aberto.
- Foco pelo teclado no calendário: a seta num dia desativado mandava o foco ao
  `<body>`; abrir com `↓` focava o dia 1, desativado quando o `min` cai no
  meio do mês, em vez do dia escolhido ou de hoje; e com dois meses o dia
  repetido do mês vizinho recebia o foco, com duas paradas de Tab na grade.
- Clicar ou apertar `Enter` nas setas, no rótulo do mês, nas células de mês e
  ano, nos atalhos e nas horas do calendário mandava o foco ao `<body>`.
- Número da semana errado no calendário quando a semana começa no domingo, como
  em pt-BR e en-US: saía o da semana anterior.
- Colunas de hora do date picker: cada botão era uma parada de Tab (194 com
  segundos) e as setas não faziam nada. Agora cada coluna é uma parada só,
  `↑`, `↓`, `Home` e `End` andam nela, e `Enter` ou `Espaço` escolhem.
- `destroy()` do date picker deixava o campo sem `name`, e o formulário parava
  de postar, além dos atributos, da classe e do `data-tuc-ready`, que impedia o
  `Tucano.init` de montar de novo; no modo nativo sobravam o envólucro e o
  overlay. E `new DatePicker` duas vezes no mesmo campo criava duas instâncias:
  a segunda agora substitui a primeira.
- `form.reset()` deixava o date picker dessincronizado: o campo mostrava o texto
  cru do `value` e o hidden continuava com o valor antigo.
- Date picker: no modo nativo com hora, o `max` travava todos os horários do
  último dia; atalhos de período com hora terminavam à meia-noite ("Hoje" era
  00:00 — 00:00); em idioma de 12 horas a hora do painel saía em 24; e
  `data-native="auto"` não era lido.
- As vistas de mês e de ano do calendário ignoravam `min` e `max`. Agora o que
  está fora fica desativado, e as setas também.
- O layout compacto do date picker era decidido só na montagem: alargar a tela
  ou girar o tablet deixava o campo sem digitação e sem máscara.
- A grade do calendário não tinha `role="row"`, e a região que anuncia a troca
  de mês era recriada a cada render, então o leitor de tela não a anunciava.
- Arrastar um trecho de outra página para dentro do editor trazia o HTML junto —
  título, cor, estilo e `<img>`, que o navegador chegava a baixar. Soltar agora
  entra como texto puro, como colar.
- A peneira do editor aceitava `//site.com` e `/\site.com` como caminho local, e
  o link salvo apontava para outro domínio.
- Caixa de link do editor: `javascript:` digitado virava um link clicável na
  área (o valor salvo saía limpo); endereço sem esquema, como `exemplo.com`,
  sumia calado ao salvar e agora ganha `https://`; e trocar o endereço com o
  cursor dentro do link o partia em dois.
- `Enter` e colar dentro de um bloco de código do editor perdiam as quebras na
  repintura, e as linhas se juntavam numa só.
- `Tab` numa tabela do editor andava uma célula só e não saía de célula vazia.
  Agora percorre todas e cria linha na última.
- O `placeholder` do editor nunca aparecia.
- `required` no editor não funcionava: intocado, barrava o envio sem mostrar
  onde; esvaziado, postava `<p><br></p>` e passava. E o `reset` do formulário
  não voltava o editor ao conteúdo de origem.
- Tabela inserida no editor ia parar dentro do parágrafo do cursor, deixava
  `<p></p>` a mais no valor, e o `Ctrl+Z` seguinte desfazia o texto e deixava a
  tabela.
- Selecionar texto em negrito fora do editor acendia o botão de negrito de todos
  os editores da página.
- Lista aplicada a um parágrafo deixava `<p></p>` antes e depois dela no valor
  salvo.
- `destroy()` do editor deixava `_tucano` e a classe no textarea, e a repintura
  agendada ainda rodava.
- No Safari, `Enter` dentro de um bloco de código do editor abria um bloco novo
  em vez de quebrar a linha, e colar ou soltar texto com várias linhas ali
  virava um bloco por linha.
- No Safari, o botão da barra do editor acionado pelo teclado (`Tab` até ele e
  `Espaço` ou `Enter`) aplicava o comando num cursor vazio no começo do texto, e
  não no trecho selecionado.
- No Firefox, `Ctrl+Z` logo depois de inserir uma tabela no editor não a
  removia.
- No Firefox, trocar o endereço de um link com o cursor dentro dele deixava um
  `<a>` vazio na frente do link, no valor salvo.
- O painel do color picker não era alcançável pelo teclado: com o foco na
  amostra, o `Tab` seguinte saía do campo e o painel fechava. Aberto por `↓`, ou
  por `Enter` e `Espaço` na amostra, o foco agora entra na área de cor, e o `Tab`
  anda por dentro do painel. As trilhas ganharam `Home` e `End`.
- `Tucano.color.parseColor()` e o color picker gravavam lixo a partir de cor
  válida em CSS: alfa em porcentagem, como `rgb(255 0 0 / 50%)`, saía
  `#ff0000NaN`, e `hsl(120, 200%, 50%)` saía `#-7f17f-7f`. Agora `rgb()` e
  `hsl()` leem `%`, a barra do alfa, `deg` e `turn`, cada parte é presa à faixa,
  e o que não é número recusa a cor.
- `Tucano.color.formatColor()` devolvia `hsl(360, …)` para matiz perto do fim,
  que relida virava 0, e `#rrggbbff` para opacidade de 0,998 para cima.
- Digitar uma cor no campo do color picker disparava o `change` nativo duas
  vezes — com HTMX, duas requisições —, e tecla na borda da área emitia de novo
  o mesmo valor.
- `form.reset()` deixava a amostra e a instância do color picker com a cor
  antiga.
- Color picker desativado, só de leitura ou dentro de `<fieldset disabled>`
  abria o painel e deixava trocar a cor.
- Com `alpha: false`, o valor inicial com opacidade, como `#ff000080`, ficava no
  campo do color picker com a trilha de opacidade escondida.
- `destroy()` do color picker deixava o `data-tuc-ready`, e o `Tucano.init` não
  montava o campo de novo. E `new ColorPicker` duas vezes no mesmo campo aninhava
  um controle no outro, com duas amostras: a segunda agora substitui a primeira.
- Paleta do color picker: `data-swatches` com `rgb(255, 0, 0)` era partido nas
  vírgulas e virava três amostras quebradas; a marcação ignorava a opacidade, e
  `#00ff0080` e `#00ff00` acendiam juntas; e o aumento no hover não animava.
- Color picker: texto inválido no campo do painel ficava lá depois de confirmar,
  mentindo o valor; o botão direito na área mudava a cor junto com o menu de
  contexto; e cinza ou preto pelo `setValue()` ou digitado pulava a área para o
  vermelho, em vez de manter a matiz.
- Upload de um arquivo só: escolher um arquivo recusado apagava o que já estava
  escolhido, e no modo direto ainda chamava o `DELETE` dele no servidor.
- Upload no formulário: o `reset` esvaziava o input, mas a lista continuava
  mostrando os arquivos que o envio já não levava.
- `destroy()` do upload no meio de um envio deixava a requisição seguir e ainda
  emitia `tucano:change`; no modo direto o input voltava sem `name`.
- Upload: o input nativo escondido era uma parada de `Tab` sem foco visível, e
  remover um arquivo — ou outro terminar de subir — jogava o foco no `<body>`.
- Upload dentro de um `<label>`: clicar na zona abria a janela de arquivos duas
  vezes no Firefox e no Safari.
- Upload desativado, no input ou num `fieldset`, aceitava arquivo solto na
  zona, e no modo direto o enviava.
- Upload direto: `'x-csrftoken'` em minúsculas em `headers` somava com o token
  do cookie; o id ia sem codificar na URL do `DELETE`, e um `../` saía do
  `deleteUrl`; os hidden ignoravam o atributo `form` do input; `clear()` com
  envio em andamento emitia duas vezes; e soltar muitos arquivos de uma vez
  redesenhava a lista a cada um.
- `data-max-size="2M"` e outras grafias sem o "b" viravam "sem limite" em
  silêncio. Agora `2M`, `300k` e `1 MiB` valem, e o que não se lê avisa no
  console.
- Busca do select: digitar com acento (`pará`, `são`) não achava nada — só a
  opção era dobrada, não o termo digitado.
- Select com busca no servidor: voltar a um termo que ainda estava em voo
  travava a lista em "Buscando..."; a resposta de um termo abandonado aparecia
  durante o debounce e ao reabrir; `minChars: 0` não buscava ao abrir; e um
  termo vindo do cache deixava de paginar.
- Paginação do select remoto: servidor que ignora `page` gerava pedidos sem fim;
  carregar a página seguinte voltava a rolagem e o destaque ao topo; e um erro
  nela apagava a página que já estava na tela.
- Select dentro de `<label>`: o clique que abria o painel o fechava em seguida.
  O foco que chega ao `<select>` nativo — por `<label for>` ou pelo aviso de
  campo obrigatório — vai para a busca, e o campo lê o nome acessível do
  `<label>`, do `aria-label` ou do `aria-labelledby`.
- Select desativado deixava digitar e limpar pelo X, e não parecia desativado.
  Opção dentro de `<optgroup disabled>` podia ser escolhida, e o `Backspace` do
  múltiplo removia tag de opção desativada.
- Teclado no select: `Enter` no múltiplo depois de filtrar marcava outra opção;
  `↑` sem opção ativa não ia à última; `Home` e `End` paravam em opção
  desativada; o ponteiro parado sobre a lista roubava o destaque das setas
  (no Safari, a cada rolagem); e o `aria-activedescendant` ficava apontando
  para opção que não estava na tela.
- Select: clicar no título de um grupo, no X de limpar ou no X de uma tag
  tirava o foco da busca; escolher de novo a opção já escolhida disparava
  `change`; `setValue()` com dois valores num select simples mostrava um e
  postava outro (vale o primeiro); `<option value=""></option>` sem texto
  apagava o placeholder; `destroy()` deixava o `data-tuc-ready`; e o
  `form.reset()` no modo remoto deixava a tela vazia.
- `refresh()` do select não ligava a busca quando as opções chegavam depois da
  montagem, e o menu de um rótulo longo passava da largura do celular, rolando
  a página de lado.

## 0.33.1 — 2026-09-14

### Corrigido

- No select simples, `Backspace` e `Delete` com a busca vazia não faziam nada:
  só o múltiplo respondia, removendo a última tag. Quem chegava de Tab a um
  select preenchido não conseguia esvaziá-lo sem pegar o mouse no X. Agora as
  duas teclas limpam o valor, como o X. Com `clearable: false` o X não existe e
  o teclado também não limpa.
- Limpar um select simples sem `<option value="">` — pelo X ou pelo teclado —
  mostrava o campo vazio, mas o `<select>` voltava sozinho para a primeira
  opção e o formulário postava o valor antigo. Agora o nativo fica sem nada
  selecionado: não posta o campo, e o `required` barra o envio.
- Digitar num select com busca e a lista fechada perdia a primeira letra: ela
  abria a lista, e abrir zerava a busca. "sa" virava "a". Agora a busca guarda
  tudo o que foi digitado, inclusive no select remoto.
- O `reset()` do formulário voltava o `<select>` ao valor inicial, mas o
  componente continuava mostrando o valor antigo, porque o reset não dispara
  `change`. Agora a tela acompanha o reset.

## 0.33.0 — 2026-09-14

### Atenção ao atualizar

- A cor de destaque padrão agora é neutra: `#0a0a0a` no tema claro e `#fafafa`
  no escuro, com o texto em cima invertido. A cor é do seu projeto, e o pacote
  não impõe marca. Quem não define `--tuc-accent` vai ver botão primário, caixa
  marcada, aba ativa e dia escolhido passarem de laranja para preto (ou quase
  branco, no escuro). Para manter o laranja, defina em `:root, .dark`
  `--tuc-accent: #FF7501`, `--tuc-accent-hover: #FF8A2A`, `--tuc-accent-fg: #ffffff`,
  `--tuc-thumb: #ffffff` e `--tuc-accent-text: #B84300` — este último `#FF7501`
  no `.dark`. A receita completa está na página Tema.
- Os motivos que o modal e a gaveta entregam ao `onClose` agora são em inglês,
  como o resto da API: `'button'` no lugar de `'botao'` e `'backdrop'` no lugar
  de `'fundo'`. Quem compara o motivo no próprio código precisa trocar os dois.
- Na máscara, `data-tuc-reveal`, `data-reveal-mode` e `revealMode` passam a ser
  `end` ou `all` (eram `fim` e `tudo`), e o formato `cnpj-numerico` passa a ser
  `cnpj-numeric`. Os nomes antigos deixam de funcionar: troque no template.

### Novo

- Campo com `data-validate` fica verde quando passa. Na máscara, assim que o
  valor fica completo e certo, já digitando (`data-tuc-valid`); o vermelho continua
  só ao sair do campo. Num `.tuc-input` nativo com `data-validate`, o verde vem por
  `:user-valid`. Sem o atributo, nada muda.

### Corrigido

- Gaveta com conteúdo maior que a tela — um menu longo, um formulário de
  filtros — passava da tela e não rolava. O corpo agora rola e o painel fica do
  tamanho da tela, nas quatro bordas; o modal ganhou a mesma correção.
- `.tuc-menu` numa coluna de altura fixa, como a barra lateral de um sistema,
  vazava da coluna e a página rolava inteira no lugar dele. Agora o menu rola
  sozinho ali; fora de uma coluna assim, nada muda.
- Com um modal ou uma gaveta aberta, a roda do mouse rolava a página de trás —
  sobre o fundo escurecido e depois de o conteúdo do diálogo chegar ao fim. A
  página agora fica parada enquanto houver um diálogo aberto, e chegar ao fim do
  corpo não passa a rolagem adiante.
- O X de fechar do modal e da gaveta ficava uns 2px para dentro da linha onde
  terminam o conteúdo e os botões do rodapé. Agora o traço do X termina na mesma
  linha.
- Abrir um modal ou uma gaveta numa página com barra de rolagem que ocupa
  espaço (Windows, ou macOS com mouse) fazia o conteúdo do fundo pular para o
  lado: a trava de rolagem escondia a barra e a página ganhava a largura dela.
  Agora o espaço da barra fica reservado enquanto o diálogo está aberto.
- Tabela com muitas colunas no editor e no `.tuc-prose` ficava presa na largura
  e espremia o texto em uma palavra por linha. Agora cada coluna tem largura
  mínima e a tabela larga rola na horizontal, sozinha, sem mover o resto do
  texto. O HTML salvo não muda.

## 0.32.1 — 2026-09-13

### Corrigido

- O campo do date picker declarava `aria-expanded` sem papel que o aceite, e o
  leitor de tela ignorava o atributo. Agora é `role="combobox"`, o papel do ARIA
  para campo que abre um painel.
- Date picker e select mantinham `aria-controls` apontando para o painel mesmo
  fechado, quando ele não está no DOM — valor inválido para o leitor de tela e
  para o Lighthouse. O atributo agora só existe com o painel aberto.

## 0.32.0 — 2026-09-13

### Atenção ao atualizar

- A cor de destaque padrão agora é o laranja do tucano, `#FF7501`, nos dois
  temas, com texto branco em cima (`--tuc-accent-fg`). O contraste do branco
  sobre esse laranja é 2,7; quem precisa de 4,5 no botão primário define
  `--tuc-accent-fg: #0a0a0a` no próprio projeto. Onde o
  destaque é a cor do próprio texto — link, menu ativo, tag — entra o novo
  `--tuc-accent-text`, mais fechado no tema claro para continuar legível. Quem já
  define `--tuc-accent` no próprio projeto confira também esses dois.
- O arquivo recusado no upload é um `.tuc-alert is-danger`, com a classe
  `.tuc-upload__rejected`. A regra `.tuc-upload__item.is-rejected` não existe mais.
- O campo hex do color picker é um `.tuc-input`, e o conta-gotas um
  `.tuc-btn is-outline is-sm`.
- As classes `tuc-upload__action` e `tuc-pagination__ico` foram removidas.
- O item ativo do `.tuc-menu` não tem mais o traço na borda esquerda.
- Etiqueta, aviso e toast de informação usam o novo `--tuc-info` (azul), e não
  mais a cor de destaque. Quem sobrescrevia `--tuc-accent` para mudar esse tom
  passa a sobrescrever `--tuc-info`.

### Novo

- Caixa, opção e chave: `.tuc-radio`, `.tuc-switch` e o rótulo `.tuc-choice`, que
  alinha o controle à primeira linha do texto, com `.tuc-choices` para grupos.
- Formulário: `.tuc-label`, `.tuc-hint` e `.tuc-error`, e o estado inválido por
  `aria-invalid="true"` em todos os campos — o Django 5 já escreve o atributo.
  `.tuc-input` também vale no `<select>` nativo.
- Abas (`data-tuc-tabs`), com o teclado do ARIA APG, modo manual para painel
  que carrega por HTMX e a variante segmentada.
- Aviso fixo na página (`.tuc-alert`), em quatro tons.
- Carregando: `.tuc-spinner` e `.tuc-skeleton`. Botão com `aria-busy` não esmaece.
- Linha do tempo (`.tuc-timeline`), só classe: tons, ponto cheio ou vazado e
  ícone opcional no lugar do ponto.
- O pacote exporta `icon`, `ICON_CHECK`, `ICON_COPY` e `ICON_X`.
- Documentação com uma página por componente, gerada no build.

### Mudou

- Os componentes usam as peças da própria biblioteca por dentro: rótulo e atalhos
  do calendário são `.tuc-btn`, carregando do toast e do select é o
  `.tuc-spinner`, contador do menu é `.tuc-badge`.
- O brilho do modal e da gaveta acompanha a cor de destaque.

### Corrigido

- Campo de moeda da máscara nascia sem placeholder e parecia campo comum.
  Agora mostra o zero já formatado, como `R$ 0,00`.
- As setas de trocar de mês do calendário estavam invisíveis e sem clique.
- Botão feito com `<a>` saía sublinhado.
- Upload, item perigoso do menu suspenso e campo inválido da máscara usavam
  vermelho e verde fixos, que não clareavam no tema escuro.
- O anel de foco do painel de abas subia por cima da lista.
- O erro da busca no servidor aparecia igual a "nenhum resultado".
- No date picker, abrir com `↓` ou `Espaço` deixava o foco no campo: as setas
  não chegavam aos dias e o `Tab` fechava o painel. Agora o foco vai ao dia.
- A máscara apagava o `aria-invalid` do campo ao focar, e o erro que o Django
  mandou sumia no primeiro clique. Agora só a validação da própria máscara mexe
  nele.
- `setValue()` no campo sensível não atualizava o valor enviado no formulário.
- A barra do editor só respondia ao mouse: com o foco num botão, `Enter` e
  `Espaço` não faziam nada. Agora funcionam, e o comando vale para o texto que
  estava selecionado.
- Os botões de apagar linha, coluna e tabela do editor não ficavam vermelhos.
- A opção `method` do upload era ignorada, e o envio saía sempre como POST.
- Toast vindo das mensagens do Django pegava o tipo errado quando a mensagem
  tinha `extra_tags`: lia só a primeira palavra.
- `Tooltip.setText()` apagava a seta junto com o texto.
- Um `data-tuc-tip` vazio interrompia a montagem dos tooltips seguintes.
- Menu suspenso criado em JS com `panel` deixava os itens sem `role="menuitem"`.
- Select, date picker e color picker dentro de modal ou gaveta abriam o painel
  atrás do diálogo. Agora o painel nasce dentro do `<dialog>` aberto.
- Modal sem título ficava sem nome para o leitor de tela; agora o texto nomeia.
- O diálogo saía do DOM 10 ms antes do fim da animação de saída.
- Na paginação, as pontas ficavam sem nome no celular, e `setPage()` perdia o
  foco de quem navegava pelo teclado.
- O date picker de período lia errado o próprio valor em ISO
  (`2026-03-01,2026-03-15`), que é o que o Django devolve quando o formulário
  volta com erro.
- Trocar `--tuc-accent` ou um tom num contêiner não mudava o fundo suave nem o
  anel de foco, que ficavam na cor da raiz.
- O destacador de código pintava o resto da linha como comentário depois de
  `https://`, e toda cor hex de CSS (`#4f46e5`) como comentário.

## 0.31.0 — 2026-09-04

### Atenção ao atualizar

- A classe `tuc-menu__secao` foi removida. Use `tuc-menu__section`.

### Mudou

- Suíte de testes no repositório e no CI: funções puras, comportamento no
  navegador, teclado real, exemplos da documentação conferidos contra o código e
  checagens cruzadas de nome.

### Corrigido

- O acordeão não expunha `node._tucano`.
- Modal e gaveta anunciavam `actions` com as chaves antigas.
- `toast.promise` documentava `carregando/sucesso/erro` em vez de
  `loading/success/error`.

## 0.30.2 — 2026-09-04

### Corrigido

- A tag 0.30.1 não continha a renomeação do evento `tucano:toast-fechado` para
  `tucano:toast-closed`, que o npm já publicava. GitHub, jsDelivr e npm voltam a
  ter o mesmo conteúdo.

### Novo

- Referência completa da API, gerada do código, dentro do `llms.txt`.

## 0.30.1 — 2026-09-04

### Atenção ao atualizar

- A API passou a ser toda em inglês: nomes de método, opção, valor, classe CSS e
  evento. `Modal.abrir()` virou `open()`, `tom: 'perigo'` virou
  `tone: 'danger'`, `.tuc-gaveta` virou `.tuc-drawer`.
- A tabela ordena pelo servidor por padrão; ordenar na tela pede
  `data-sort-mode="client"`.
- Chegar de `Tab` não abre mais o painel dos campos. Abrir é sempre explícito.

### Novo

- Tabela, com ordenação e seleção em massa, e paginação feita para o Paginator.
- Menu suspenso.
- Etiqueta de estado, caixa de seleção desenhada e botão de copiar nos blocos de
  código.
- O campo desenha a borda e a altura antes de o script rodar.

### Mudou

- Tokens em `:root` e reset com um seletor só.

## 0.25.1 — 2026-09-03

- O navegador ancora a rolagem sozinho, sem correção à mão.

## 0.25.0 — 2026-09-03

- Importar `tucano` não executa mais nada: o empacotador leva só o que foi usado.

## 0.24.2 — 2026-09-03

- Aplicar título no editor não faz o texto saltar, e o link é pedido num modal.

## 0.23.3 — 2026-09-03

- A barra de rolagem acompanha o tema.

## 0.23.1 — 2026-09-03

- Mesmo conteúdo da 0.23.0, publicado com outro número porque o npm reservou o
  anterior.

## 0.23.0 — 2026-09-03

- Editor de texto com tabela, alinhamento e bloco de código. O campo em Markdown
  saiu, deixando um editor só.
- O tooltip se afasta o bastante para a seta não encostar no gatilho.

## 0.22.1 — 2026-09-03

- Todos os controles conferidos por medida com a mesma altura.

## 0.19.0 — 2026-09-03

- Editor de texto que mostra o resultado enquanto se escreve.

## 0.18.1 — 2026-09-03

- A pré-visualização do campo formatado substitui o campo, em vez de empilhar.

## 0.18.0 — 2026-09-03

- Campo de texto formatado, em Markdown.

## 0.17.1 — 2026-09-03

- O ícone não fica mais sobre o texto nos campos com ícone.

## 0.17.0 — 2026-09-03

- Estilo para o campo de texto, que a biblioteca nunca tinha tido.

## 0.16.3 — 2026-09-03

- Arquivos para IA em dia com a biblioteca.

## 0.16.2 — 2026-09-03

- Exemplo do acordeão com conteúdo real.

## 0.16.1 — 2026-09-03

- Nomes genéricos no menu de exemplo.

## 0.16.0 — 2026-09-03

- Submenu no menu lateral, com trilho e marcação do ramo aberto.

## 0.15.1 — 2026-09-03

- O ícone acompanha o tamanho do botão.

## 0.15.0 — 2026-09-03

- Menu lateral, e os ícones passam a usar o botão da biblioteca.

## 0.14.3 — 2026-09-03

- O acordeão não engasga mais na primeira abertura.

## 0.14.2 — 2026-09-03

- O acordeão fecha até zero, e o brilho do fundo se espalha mais.

## 0.14.1 — 2026-09-03

- O fim do acordeão não é mais cortado, e o brilho da gaveta nasce no lugar certo.

## 0.14.0 — 2026-09-03

- Acordeão sobre `<details>` nativo.

## 0.13.0 — 2026-09-03

- A gaveta vira componente próprio, sobre a mesma base do modal.

## 0.12.0 — 2026-09-03

- Gaveta (off-canvas).

## 0.11.1 — 2026-09-02

- O `<dialog>` fechado não cobre mais a página inteira.
- Os tamanhos anunciados passam a sair do build.

## 0.11.0 — 2026-09-02

- Modal sobre `<dialog>` nativo.

## 0.10.2 — 2026-09-02

- Vazamento de listeners no popover.

## 0.10.1 — 2026-09-02

- Painéis posicionados por `left`/`top`, e não por `transform`.

## 0.10.0 — 2026-09-02

- Tooltip completo: quatro lados, seta e cor trocável.

## 0.9.9 — 2026-09-02

- O toast vai para o canto inferior direito, e a margem no celular foi corrigida.

## 0.9.8 — 2026-09-02

- Toast de carregando que vira o resultado no mesmo cartão.

## 0.9.7 — 2026-09-02

- As duas regiões de acessibilidade do toast viram uma pilha só.

## 0.9.6 — 2026-09-02

- Ícone e botão de fechar centralizados no toast.

## 0.9.5 — 2026-09-02

- Nova animação do tooltip.

## 0.9.4 — 2026-09-02

- A pilha de toasts não fecha ao mover o mouse de um para outro.

## 0.9.3 — 2026-09-02

- Toast e tooltip ficam fora da regra de 16px do celular.

## 0.9.2 — 2026-09-02

- Movimento revisto e alturas conferidas.

## 0.9.1 — 2026-09-02

- Botão desabilitado mostra o cursor de bloqueio.

## 0.9.0 — 2026-09-02

- Toasts empilhados e estilo de botão.

## 0.8.0 — 2026-09-02

- Toast e tooltip.

## 0.7.1 — 2026-09-02

- Menos requisições na busca do servidor.

## 0.7.0 — 2026-09-02

- Busca no servidor no Select.

## 0.6.1 — 2026-09-02

- Modos de esconder no campo sensível, e o campo de senha corrigido.

## 0.6.0 — 2026-09-02

- Máscaras, validação de documento e campo sensível.

## 0.5.2 — 2026-09-02

- Tipos aceitos no upload documentados.

## 0.5.1 — 2026-09-02

- Ícone de tentar de novo corrigido.

## 0.5.0 — 2026-09-02

- Campo de upload.

## 0.4.2 — 2026-09-02

- Atributos do date picker documentados na página.

## 0.4.1 — 2026-09-02

- Linha de valor do color picker alinhada.

## 0.4.0 — 2026-09-02

- Personalização completa por variável CSS.
- Recursão no color picker corrigida.

## 0.3.0 — 2026-09-02

- Sem zoom no celular ao focar um campo, e o painel próprio vira o padrão.

## 0.2.1 — 2026-09-02

- Modo nativo e calendário no celular corrigidos.
- `llms.txt` e `AGENTS.md`, para IA saber usar a biblioteca.

## 0.2.0 — 2026-09-01

- Primeira versão: componentes de formulário leves, sem dependências.
