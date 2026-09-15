# Tucano — instruções para agentes

Biblioteca de componentes de formulário e interface em JavaScript puro, sem
dependências em runtime.

**Para usar a biblioteca em outro projeto, leia [llms.txt](llms.txt)** — ele tem
a API completa. Este arquivo é sobre trabalhar *no* código da Tucano.

## Como rodar

```bash
npm install          # só para desenvolver; quem consome não precisa de build
npm run build        # gera dist/ (JS via esbuild, CSS via Tailwind CLI)
npm run serve        # build + servidor local na porta 4322
npm run build:og     # regera og.png a partir de tools/og.html
node tools/site.mjs preview   # gera o site numa pasta de prévia, fora do git
```

O `build` termina em `tools/reference.mjs`, que regera a referência do llms.txt, e
em `tools/stamp.mjs`, que escreve a versão e o peso real do `dist` na página, no
README e no llms.txt. Nunca edite esses números à mão: eles já
envelheceram uma vez, e a página chegou a anunciar 15 KB com o arquivo em 27.

**A documentação é gerada, e não se edita o HTML publicado.** A fonte mora em
`site/`: `layout.html` (cabeçalho, barra lateral e `<head>`, uma vez só),
`nav.json` (ordem e grupos do menu, de onde saem anterior e próxima),
`site.css` e `site.js` (só layout e comportamento da página) e `pages/<slug>.html`
(o conteúdo de cada página). `tools/site.mjs` gera `index.html` e
`<slug>/index.html` na raiz — que é de onde o GitHub Pages publica — e monta
sozinho a tabela de API (do mesmo extrator do `llms.txt`), a grade de
componentes do início, o changelog em linha do tempo e os blocos de código.
Editar um `index.html` gerado é trabalho perdido no próximo build.
`dist/` **é versionado** de propósito: é ele que o CDN serve e o que faz o uso
estático funcionar sem build.

## Estrutura

```
src/js/core/          dates, color, mask, dom, popover, dialog, sanitize, highlight,
                      files, texts (todo texto de interface)
src/js/components/    datepicker, select, colorpicker, upload, mask, toast,
                      tooltip, modal, drawer, accordion, dropdown, table,
                      pagination, editor
src/styles/core/      base (reset) e tokens
src/styles/components/  um arquivo por componente; os que são só classe
                      (botão, etiqueta, campo) também moram aqui
site/                 fonte do site de documentação (layout, nav, css, js, pages/)
tools/                build (reference, site, stamp, og) e verificação (behavior,
                      keyboard, examples, consistency, audit)
test/                 funções puras, com node --test
```

Modal e gaveta compartilham `core/dialog.js`: top layer, foco preso, Escape e
devolução do foco moram lá. Cada um só define geometria e movimento. Não
duplique essa mecânica ao criar um diálogo novo.

## Decisões que não devem ser revertidas sem motivo

**Código em inglês, comentário em português.** Vale para tudo que alguém digita:
nome de classe e de método, chave de opção, valor de opção, classe CSS, token e
atributo `data-*`. Os comentários e os textos de interface continuam em
português — `'Alinhar à esquerda'` é o que o usuário lê, não é código.

A biblioteca esteve metade em cada idioma, que é pior que qualquer uma das duas
escolhas: conviviam `Modal.abrir()` e `DatePicker.open()`, `fechavel` e
`closable`, `.tuc-gaveta__corpo` e `.tuc-select__menu`. Sem regra, quem usa
precisa decorar caso a caso.

**Nome errado sai de uma vez, sem apelido.** Ao corrigir um nome de API, a
versão nova tem só o certo: nada de `LEGACY_*`, alias ou "aceito por um tempo".
Quem usa a versão antiga continua nela; manter o errado funcionando deixa alguém
usá-lo sem perceber, gera complicação depois e pesa no pacote. O aviso vai em
"Atenção ao atualizar", nos três changelogs, dizendo que o nome antigo deixou de
funcionar. Foi o que aconteceu com `fim`/`tudo` (agora `end`/`all`),
`cnpj-numerico` (`cnpj-numeric`) e os motivos `'botao'`/`'fundo'` do `onClose`
(`'button'`/`'backdrop'`).

Ao renomear em massa, três armadilhas apareceram e todas passam pelo build:
string literal tratada como código traduz frase da interface pela metade
("Excluir tabela" virou "Excluir table"); `${...}` dentro de template literal é
código e fica para trás, apontando para variável que já mudou de nome — foi
assim que `.tuc-modal__panel` ficou sem o JS que a monta; prefixo de nome
antigo dentro de nome novo duplica letra (`is-erro` dentro de `is-error` virou
`is-errorr`); um literal de regex contendo `//` faz um scanner ingênuo tratar o
resto do arquivo como comentário, e nada dali para baixo é renomeado — foi o que
deixou `highlight.js` pela metade; e substituir palavra em texto corrido traduz
a documentação junto, então a passada nos docs só pode entrar em `<pre>`,
`<code>` e cerca de crase. Nenhuma dessas quebra o build: só um teste que
instancia os componentes no navegador pega, e a prosa só um diff contra a versão
anterior.

Cada uma custou um bug real.

**O CSS é compilado pelo `tools/css.mjs`, sem os fallbacks da Tailwind.** A CLI
liga sempre os polyfills de `color-mix` e `@property`, para navegadores abaixo da
base da própria Tailwind 4 (Chrome 111, Safari 16.2, Firefox 113), e não tem
opção para desligar. Eles custavam quase 1 KB de gzip num CSS de 14 KB. O script
chama a mesma API com `Polyfills.None`; com `Polyfills.All` a saída é idêntica à
da CLI. Por isso, dentro de `@apply`, utilitário que registra variável própria
não entra — `font-medium`, `font-semibold`, `tracking-wide`, `border-0`, `snap-y`,
`scale-105`, `tabular-nums` — e vira declaração (`font-weight: 500;`). A seção 8 do
`consistency.mjs` falha se `@property`, `@layer properties` ou o fallback de
`color-mix` voltarem ao `dist`. Os pesos ficam fixos em vez de ler o tema da
Tailwind do projeto, que antes vazava para dentro dos componentes.

**O preflight do Tailwind não é enviado.** Só as classes dos componentes vão no
`dist`. Enviar o preflight mudaria o CSS do projeto que instala. Em troca, os
componentes precisam do próprio reset, em `src/styles/core/base.css`.

**Esse reset usa `:where()` para ter peso zero.** Sem isso ele vencia as classes
dos próprios componentes por especificidade e quebrava alinhamentos.

**Inputs internos levam `all: unset` num seletor de peso 0,2,1**
(`.tuc-select input.tuc-select__search`). Projetos costumam ter
`input[type=text] { border: ... }`, que venceria uma classe simples e desenharia
uma caixa dentro do controle.

**Prefixo `tuc-` em classes e variáveis.** `ui-` colide com CSS de projeto.

**O elemento nativo continua sendo o dono do valor.** O `<select>` fica no DOM e
o `<input>` mantém o `name`, então `multiple`, `required` e `getlist()` seguem
funcionando. Nunca substitua por estado só em JS.

**O hover no calendário repinta classes, não refaz a grade.** Refazer trocava o
elemento entre o `mousedown` e o `mouseup`, e o browser descartava o clique — o
período nunca fechava. Ver `_paintDays()`.

**Um range pela metade não se confirma por texto.** O `blur` do campo não chama
`_commitTyped()` enquanto `pendingRange` é verdadeiro; senão o `pendingRange`
zerava e o clique seguinte começava um período novo.

**O color picker guarda HSVA, não RGB.** Converter a cada movimento perde a
matiz quando a saturação chega a zero: todo cinza viraria vermelho ao clarear.

**Tema escuro automático é opt-in** (`<html data-tuc-theme="auto">`). Seguir o
sistema por padrão fazia o componente escurecer sozinho numa página clara.


**`<dialog>` fechado precisa voltar a `display: none`.** A folha do navegador já
faz isso, mas a regra base do modal declara `display: grid` e vence. Sem
`.tuc-modal:not([open]) { display: none }`, um `<dialog>` parado no template fica
renderizado, `fixed`, cobrindo a viewport inteira — transparente, então nada
aparece e simplesmente nenhum clique da página funciona.

**O popover posiciona por `left`/`top`, nunca por `transform`.** As propriedades
individuais compõem na ordem translate, rotate, scale e só então `transform`:
um `scale: .95` de animação multiplica também a translação do `transform`. Como
o painel é `absolute` no body, essa distância inclui o scroll, e numa página
longa o painel entrava voando de centenas de pixels.

**Duração nula resolve com `in`, não com `??`.** O `null` de "não fecha sozinho"
é um valor, não uma ausência: com `??` ele caía no padrão e o toast de carregando
sumia no meio da operação.

**Uma faixa de grid em `fr` é `minmax(auto, Nfr)`.** Ela não encolhe abaixo do
mínimo do conteúdo, e `min-height: 0` libera a caixa mas não o padding. No
acordeão isso criava um piso: espaçamento de baixo tem de ser margem do último
filho, não padding do contêiner.

**Fim de animação se detecta por `transitionend`, não por `setTimeout`.** O
número em JavaScript precisa espelhar um token do CSS, e os dois divergem: 220ms
contra 280ms cortava o fechamento do acordeão. Timeout só como rede de segurança,
para quando o evento não chega.

**As duas live regions do toast dividem um palco só.** Erro fala numa região
assertiva e o resto numa polida — separação que o leitor de tela exige. Se cada
uma posicionar por conta, viram duas pilhas paralelas na tela e o limite conta em
dobro.

**O tamanho do ícone sai do botão, por variável.** Decidido em cada chamada, ele
divergia: 14px no X do toast e 15px no do modal, mesmo papel.

**O editor de texto escapa antes de marcar, nunca o contrário.** `core/sanitize.js`
tem uma lista fechada de tags e derruba todo atributo, exceto `href` com destino
aceitável e `text-align` reescrito por nós. Marcar primeiro e escapar depois é
como se escreve um XSS. A peneira roda a cada leitura do valor, e não só no que
foi digitado: o navegador tem liberdade para marcar como quiser ao executar um
comando.

**Isso protege o editor, não a publicação.** O HTML chega ao servidor por POST e
ninguém garante que veio daqui. A documentação diz para sanitizar de novo no
servidor, e ela não deve deixar de dizer.

**Colar entra sempre como texto puro.** É o que evita o HTML do Word e do Google
Docs, com tabelas de layout e estilos embutidos.

**`execCommand` está deprecado e é usado assim mesmo.** É o único caminho com
suporte universal e, sobretudo, o único que se integra ao desfazer nativo.
Reimplementar à mão significaria reimplementar o Ctrl+Z junto. A exceção é
desfazer um bloco de código: ali `insertHTML` escreve *dentro* do `<pre>` e o
deixa de pé, então o elemento é trocado direto no DOM — perde-se o desfazer
nessa ação só, o que é melhor que entregar um bloco com parágrafos dentro.

**O que o editor salva não leva classe nenhuma.** É o que o faz servir a
qualquer servidor. Para exibir com a mesma aparência, envolva em `.tuc-prose` —
as regras são compartilhadas com a área de edição no CSS, então as duas não têm
como divergir.

**A coloração de código é exibição, nunca conteúdo.** A peneira dissolve `span`,
então ela não chega ao banco. O destacador não conhece linguagem nenhuma de
propósito: reconhece comentário, texto entre aspas, número, tag, atributo e
chaves de template, o que cobre qualquer linguagem por 2 KB.

**O editor se defende do CSS de quem hospeda.** `display: table` e a tipografia
das células são declarados de propósito: `table { display: block }` e
`th { text-transform: uppercase }` são receitas comuns em projeto, e herdadas
aqui desmontam o layout e mentem sobre o que será publicado.

**`index.js` não tem efeito colateral, e isso é deliberado.** O auto-init mora
em `auto.js`, que é a entrada do build IIFE. Enquanto o boot morava no index,
importar `tucano` executava `init()`, que alcança os onze componentes — e
empacotador nenhum consegue descartar o que é usado. Medido: importar só o date
picker custava os mesmos 31,9 KB de importar tudo, contra 9,8 KB depois da
separação. Não devolva o boot para o index.

**O CSS desenha o estado de espera, e ele faz parte do componente.** Os
seletores `[data-tuc-*]:not([data-tuc-ready])` dão ao campo cru a altura, borda,
raio e fundo que ele terá depois do script. Sem isso quem recarrega rápido vê o
select do sistema e o input quadrado por um quadro, e o conteúdo pula quando o
JS troca tudo de lugar. Não é FOUC — a folha é bloqueante e já está aplicada; o
que falta é o JS, que vem com `defer`. Tirar o `defer` custaria bem mais caro.

Duas armadilhas nesse bloco, ambas pelo mesmo motivo — o elemento cru ainda não
tem classe `.tuc-*`. Os seletores precisam entrar em **todas** as listas de
escopo de `tokens.css` — clara, escura por classe, escura por mídia e compacta
—, senão `var(--tuc-border)` não resolve e a borda é descartada inteira.
Esquecer uma é silencioso: faltando nas escuras, o campo piscava branco numa
página escura. `npm run audit` cobre isso agora, comparando o campo em espera
com um `.tuc-input` de verdade nos dois temas. E o `box-sizing` tem de ser declarado ali, porque o reset de
`base.css` também é escopado: sem ele a borda soma sobre a altura e o campo
nasce 2px mais alto que o vizinho. Componente novo que transforma um elemento
existente precisa entrar nesse bloco.

**Medição em headless não vê transição.** O Chrome com `--dump-dom` aplica a
classe `is-open` mas não avança a transição: 400ms depois o `opacity` ainda é 0
e o `translate` continua no valor de entrada. Medir posição logo depois de abrir
devolve o estado inicial — no dropdown isso aparecia como 4px de recuo lateral e
8px a menos de folga, que são exatamente o `scale: .95` e o `translate: -.5rem`
da entrada. Para conferir geometria final, desligue a transição no probe
(`.tuc-dropdown { transition: none !important }`) e leia o retângulo.

**`[hidden]` perde para o `display` do `@apply`.** Já aconteceu três vezes —
duas no editor, uma no dropdown. A regra do navegador para `[hidden]` é da
origem do agente e qualquer `display` de autor a vence, então um painel com
`@apply flex` marcado como `hidden` fica invisível mas continua ocupando a
linha, empurrando o que vem depois. Componente que documenta `hidden` no
template precisa declarar `.tuc-x[hidden] { display: none; }` junto.

**Painel que abre no foco tem de fechar quando o foco sai.** Sem isso, andar de
Tab pela página ia abrindo painel atrás de painel e nenhum fechava: o único
jeito era clicar fora ou apertar Escape. Está no Popover, atrás de
`closeOnFocusOut`, e é opcional de propósito — o tooltip aparece no hover com o
foco em outro lugar e fecharia no primeiro Tab mesmo com o ponteiro em cima. Use
`focusin` no documento, nunca `focusout` na âncora: o `relatedTarget` do
focusout vem `null` no Safari e no Firefox quando o clique cai num botão do
painel, e aí o painel se fecha sozinho no meio do uso.

**Chegar de `Tab` não abre painel.** Abrir no foco parecia conveniente e era a
origem de dois defeitos: os painéis se empilhavam ao tabular, e no campo de cor
o painel cobria o próprio campo de quem queria digitar o hex. Quem tabula por um
formulário até o botão de salvar não deveria levar um calendário na cara a cada
campo. Abrir é sempre explícito — `↓`, clique, e no select também `Enter` e
`Espaço`, como no `<select>` nativo e no ARIA APG. O gatilho do color picker é a
amostra ao lado, que é um `<button>` de verdade e por isso já responde a
`Enter`/`Espaço` sem código nosso. A opção `openOnFocus`, que guardava o
comportamento antigo no date picker, saiu de vez: ninguém a documentava como
recomendada, e ela só mantinha vivo o defeito que motivou esta regra.

No campo de data o `Enter` fica de fora de propósito: é um campo de texto dentro
de um `<form>`, e `Enter` num campo de texto envia o formulário. Sequestrar a
tecla quebraria o envio em silêncio em todo form que já existe. Ali quem abre é
o `Espaço`, e só com o campo vazio, porque em modo com hora se digita
`07/09/2026 14:30` — mesma ressalva do `Espaço` no select, onde o foco está num
campo de busca.

**Ordenar tabela é do servidor, não do cliente.** Numa lista paginada,
reordenar as linhas que estão na tela produz uma ordem falsa: o maior valor real
pode estar na página 7, e a tabela mente com cara de verdade. O cabeçalho é um
`<a>` para a mesma URL com `?sort=` e `?dir=` — funciona sem JavaScript, com
`hx-boost`, abre em outra aba, e o estado da seta sai da query string, então
sobrevive ao reload. `data-sort-mode="client"` existe só para tabela pequena e
completa, sem paginação.

**Célula de tabela não vira container flex.** `display: flex` num `<th>` ou
`<td>` tira a célula do algoritmo de colunas da tabela: ela deixa de participar
da largura e passa a desenhar a própria caixa por cima do cabeçalho. Para
encostar uma coluna à direita, use `text-align`; o flex fica no conteúdo dentro
da célula. E `truncate` só funciona com a coluna tendo largura — em
`table-layout: auto` a coluna cresce com o conteúdo e a reticência nunca
aparece.

**Não existe um segundo desenho de botão.** A paginação usa `.tuc-btn is-ghost`
e `is-outline`; altura, raio, foco e comportamento no toque já estão resolvidos
lá. Um segundo botão na mesma página é o que denuncia biblioteca remendada — e
foi por isso que os tons `--tuc-success`, `--tuc-warning` e `--tuc-danger`
saíram de dentro do toast e viraram token: a etiqueta de estado e o toast têm de
falar a mesma cor.

**Tokens vivem em `:root`; o reset tem um seletor só.** Custom property não
estiliza nada sozinha — declarada na raiz é inerte para a página. A versão
anterior escopava os tokens a uma lista de classes repetida quatro vezes em
`tokens.css` e dezenove em `base.css`, e essa lista foi a origem de três
defeitos nesta biblioteca (campo sem borda, campo branco no tema escuro, campo
2px mais alto). Agora o reset usa `:where([class^='tuc-'], [class*=' tuc-'])`
e os tokens ficam em `:root`, `.dark`/`[data-theme='dark']` e
`:root[data-tuc-theme='auto']`. A única lista que sobra é a do `--tuc-text`
no compacto, e ela é semântica ("tudo em que se digita ou se toca"). O único
ponto ainda escopado é `color-scheme`, que muda campo nativo e barra de rolagem
e não pode vazar para a página. Medido: `base.css` 335 → 114 linhas, CSS 12 → 11 KB.

**Tom de texto e preenchimento sólido são tokens diferentes.** `--tuc-danger`
é mais claro no tema escuro para ter contraste sobre fundo escuro — e um botão
pintado com ele fica pastel com texto branco. `--tuc-danger-fill` é o mesmo nos
dois temas e é o que o botão usa. Ao promover uma cor escrita à mão a token,
pergunte que papel ela tem antes de escolher o token.

**Ícone é constante exportada, não chave de objeto.** Objeto é indivisível para
o empacotador: quem importava uma seta levava o mapa inteiro — medido, 0,6 KB a
mais para quem usa só o date picker. `ICON_CHEVRON_DOWN` solto o esbuild
descarta quando ninguém importa. O mapa `ICONS` existe só para a galeria em
`tools/icons.html`; componente importa a constante.

**Helper compartilhado mora em `core/dom.js`.** `omitUndefined` existia copiado
em doze componentes com dois nomes; `escapeHtml` em dois. Antes de escrever
uma função utilitária num componente, procure em `dom.js`.

Mas helper compartilhado para boilerplate de duas linhas não emagrece o pacote.
A auditoria mediu: o gzip já comprime a repetição, e a função nova custa o
próprio nome e a chamada. Extrair esse tipo de trecho só se justifica por
manutenção — um lugar para corrigir —, nunca por peso. O que reduziu bytes de
verdade foi tirar responsabilidade do componente: a entrada `is-open` morar no
`Popover` em vez de em cinco componentes deu 34 bytes a menos com gzip.

**Texto de interface mora em `core/texts.js`, nunca no componente.** Todo texto
que um componente mostra ou anuncia — rótulo, placeholder, `aria-label`,
mensagem de vazio, de erro e de carregando, nome de atalho — é uma chave em
inglês no grupo com o nome do componente, e o valor é o português. Escrito
direto no componente, ele aparecia em português num projeto em inglês sem jeito
de trocar, e a demonstração em inglês do site chegou a desligar o "Limpar" do
calendário só para escondê-lo. Texto novo entra no grupo do componente, e
`tools/reference.mjs` o publica no `llms.txt` sozinho. Onde a frase depende de
um número ou de um nome, o valor é função (`others: (n) => …`).

Três regras vêm junto. Um objeto por componente, e não um mapa único: objeto é
indivisível para o empacotador, e quem importa só o date picker levaria as
frases do editor (medido: o date picker sozinho foi de 10.146 para 10.344 bytes
com gzip, e o pacote inteiro de 38.300 para 39.198). O texto é lido na montagem,
então `setTexts` depois do init não reescreve o que já está na tela — e é por
isso que o boot espera o `DOMContentLoaded` também quando o script vem com
`defer`: rodando no instante em que o script executava, não sobrava momento para
trocar os textos antes. E a opção de instância que já existia (`emptyText`,
`prevText`, `texts` do upload) fica `undefined` no `DEFAULTS` e é resolvida no
construtor, para vencer o texto global. Nada de dicionário de idiomas no pacote.
Mensagem de erro para quem programa (`[Select] elemento alvo nao encontrado`)
não é interface e fica onde está.

**O estado de espera vale para tudo que o script transforma — inclusive
tabela, paginação e acordeão.** A tabela crua é a do navegador e ganhar a
classe fazia a altura dobrar; a paginação era um `<div>` vazio até montar; o
acordeão era `<details>` com marcador. E a altura de linha da célula é fixa
(`1.5rem`): com `normal`, a caixa de seleção e o botão de ordenar esticavam a
linha de 37 para 43px assim que o script os inseria. A sonda que mede isso
compara a geometria antes e depois do `load`; qualquer diferença é piscar.

**Reposicionar em `scroll` é coalescido num frame.** `scroll` dispara várias
vezes por quadro, e `_reposition` lê layout e escreve estilo — intercalado no
mesmo quadro, força recálculo a cada chamada. `requestAnimationFrame` junta
tudo numa só, e `hide()` cancela o frame pendente.

**Headless congela transição — inclusive de cor.** Ao trocar o accent e ler o
`background` do botão, ele continuava o antigo mesmo 400ms depois: a
transição de 160ms nunca avança aqui. Para medir cor ou posição final, injete
`* { transition: none !important }` na sonda.

**"Definido num arquivo, usado em nenhum outro" não é código morto.** Um
detector que só olha uso entre arquivos marcou onze funções como mortas; sete
eram helpers usados dentro do próprio módulo, e apagá-las teria quebrado o
color picker, a máscara e o date picker. Antes de remover, procure a referência
no arquivo onde ela mora.

**`Tucano.mask`, `Tucano.dates` e `Tucano.color` são API pública documentada.**
Estavam expostas por `export * as` sem uma linha de documentação, e por isso
liam como sobra. As quatro funções de fato sem referência custam 81 bytes no
bundle — não vale trocar API por isso. Tree-shaking já as descarta para quem
importa pelo npm.

**Testar o exemplo da documentação é teste de verdade.** Ao escrever
`Tucano.color.isDark('#4f46e5')` no README e rodar, ela quebrou: aceitava só o
objeto hsva. Ninguém tinha percebido porque por dentro sempre chega hsva. O
exemplo do `maskEmail` também estava errado. Escreveu exemplo, roda o exemplo.

**Versão e tamanho não se escrevem à mão — `tools/stamp.mjs` carimba os dois
no fim do build, lendo o `package.json`.** O cabeçalho da página ficou preso em
v0.26.0 enquanto o `package.json` ia para 0.30.1, e o trecho de instalação do
README apontava para `@v0.9.2`: quem copiasse levava uma versão de muitas
iterações atrás. O carimbo cobre o selo do cabeçalho, as URLs do jsDelivr no
README, no `llms.txt` e na página, o cache-busting local e o exemplo de "prenda
a versão". Cada padrão é obrigatório: se um trecho mudar de forma e deixar de
casar, o build quebra em vez de seguir com número velho.

**Cuidado ao restaurar prosa de uma versão anterior: o selo da versão é texto.**
Foi assim que a página voltou para v0.26.0 — a restauração que consertou a
tradução acidental da prosa reverteu junto o texto do selo, e os bumps seguintes
procuravam a versão anterior e não achavam. Depois de qualquer restauração em
massa, rode o build e confira se o selo bate com o `package.json`.

**Se é clicável, tem cara de botão — e é o botão do sistema.** A coluna de
ações da tabela nasceu com `is-ghost` esmaecido a 55%, com a justificativa de
que vinte linhas de ícones acesos competiriam com o conteúdo. Na tela o efeito
foi outro: sem borda e sem fundo, o ícone lia como decoração desativada. Ali vão
os botões do sistema — `tuc-btn is-outline is-icon is-sm` — sem opacidade
nenhuma. O mesmo vale para o copiar do bloco de código — nos dois lugares onde ele existe. A biblioteca e a própria página de docs tinham cada uma o seu, com tamanho, borda, raio, fundo e foco declarados à mão. Classe de posição, sim; segundo desenho de botão, não. E a página de docs é vitrine: um botão que não é o da biblioteca ali é a contradição mais visível possível.

**Handler em atributo `onclick=` é código, e nenhuma das minhas varreduras o
enxergava.** O rename para inglês tratou `<script>` e blocos de código, mas
deixou vinte e dois `onclick=` da página passando opção em português —
`tamanho:`, `tom:'perigo'`, `lado:'direita'` — que hoje são ignoradas, e
chamando `Tucano.gaveta()`, que não existe mais. O sintoma: o brilho do modal
sempre da mesma cor, e a gaveta não abrindo. Não quebra o build, não aparece no
console, e passa em qualquer teste que instancie os componentes por JavaScript.
Só clicando o botão da página. Ao renomear, varra também `on\w+="..."` — e teste
clicando, não chamando a API.

A primeira correção disso ainda deixou passar as chaves **aninhadas**: eu montei
a lista de renomeações a partir das opções de primeiro nível e esqueci
`actions:[{texto:'...'}]` e o rótulo `confirmar:` do `confirm()`. O resultado
foi um botão sem rótulo dentro do modal — um retângulo vazio. Lista escrita à
mão erra; o teste que não erra é comparar cada chave passada nos handlers com o
que os componentes de fato leem (`DEFAULTS`, `this.opts.*`, `a.*`) e apontar as
que ninguém lê. Chave desconhecida é silenciosamente ignorada pelo
`{ ...DEFAULTS, ...omitUndefined(options) }`, então nada avisa.

**Ícone precisa ser olhado grande.** O de "limpar formatação" era uma lixeira —
o mesmo desenho de "excluir tabela", que faz sentido lá e nenhum aqui. E os
dígitos da lista numerada saíam como rabiscos em 15px. Renderize o mapa de
ícones em 64px antes de dar por bom; em tamanho de barra tudo parece aceitável.

**A máscara deriva o placeholder do gabarito.** `###.###.###-##` vira
`000.000.000-00`, e com dois gabaritos vale o primeiro. Existe porque escrever
à mão é trabalho que se esquece: a página tinha cinco campos com placeholder e
um sem, justamente o de CPF/CNPJ. Só preenche o que o autor deixou vazio.
Moeda não tem gabarito: o placeholder é o zero já formatado com as mesmas
opções (`R$ 0,00`, `0,000` com `data-decimals="3"`, `US$ 0,00`). Sem ele o
campo de valor nascia em branco e parecia campo comum.

**Na página de docs, a instância só existe depois do `DOMContentLoaded`.** O
script da própria página roda durante o parse; o boot do Tucano espera o
`DOMContentLoaded`. Ler `elemento._tucano` no meio do script devolve `undefined`,
e um `if (inst)` protetor engole o problema em silêncio — foi assim que o
cancelamento do clique na paginação da demonstração nunca chegou a ser
registrado, e os links navegavam de verdade. Para amarrar comportamento na
página, use delegação no documento, que não depende de ordem de inicialização.

**`timeout` não existe no macOS.** `timeout 60 chrome ...` falha com "command
not found" e a sonda devolve zero byte — o que parece defeito do produto e é
defeito do comando. Se um `--dump-dom` voltar vazio, confira primeiro se o
Chrome chegou a rodar.

**O destacador emitia uma classe multiplicada por oito.** O template do span
tinha virado `class="tuc-tok-${n}tuc-tok-${n}…"` — uma classe única que não casa
com regra nenhuma, então o código saía sem cor e nada acusava: os `<span>`
estavam lá, o CSS estava lá, e mesmo assim tudo cinza. Ao mexer em template
literal por regex, confira o HTML gerado, não só o build. E o nome da regra tem
de casar com a classe: `'coment'` gerava `.tuc-tok-coment`, que não existe.

**Cada seletor de uma lista carrega o próprio escopo.** No bloco escuro da
paleta de sintaxe, `.tuc-prose` estava sem o `:where(.dark …)` na frente — então
a paleta escura valia nos dois temas, verde-claro sobre fundo claro. Vírgula não
distribui prefixo.

**Para achar comentário traduzido por engano, compare com o original — não
adivinhe a palavra errada.** `git show <antes>:<arquivo>` e um diff linha a
linha dos comentários separa em duas pilhas: prosa em português que voltou
errada (restaurar) e nome de API novo que deve mesmo aparecer (manter). Foi
assim que apareceram 29 linhas em `datepicker.js`, `editor.js` e `dialog.js`
que três varreduras por heurística tinham deixado passar.

**Código escrito depois do rename também nasce em português.** Metade dos
identificadores que sobraram (`mostrar`, `ordenadas`, `saida`, `classe`,
`filhos`, `texto`) estava em `pagination.js`, `table.js` e no copiar do
`highlight.js` — arquivos que eu mesmo escrevi já com a regra valendo. Rode a
varredura de identificadores depois de escrever, não só depois de renomear.

**Classe escrita em CSS e classe escrita em JS são dois lugares, e o rename
pode acertar só um.** O envolucro do botão de copiar da página de docs virou
`.block` no `<style>` e continuou `'bloco'` no `className` do script — regra
nenhuma casava, então o botão ficava com `opacity: 0` e o `<pre>` sem
`position: relative`. Não quebra nada, não aparece no console: o botão
simplesmente some. A checagem é cruzar as três fontes — classes definidas no
`<style>`, usadas no HTML e escritas pelo JS — e apontar as que só aparecem em
uma delas.

**A referência do `llms.txt` é gerada pelo build, não escrita à mão.**
`tools/reference.mjs` extrai do código o seletor, os `data-*`, todas as opções
com o comentário que as explica, os métodos, os eventos, as classes e os tokens
— e reescreve o bloco entre "Referencia completa" e "Ao gerar código". Antes
dela, 40 opções, 8 métodos e 22 exports públicos não apareciam em lugar nenhum
do arquivo que as IAs leem. Não edite esse bloco à mão: ele é sobrescrito no
próximo build. Para mudar o que aparece, mude o extrator ou o comentário da
opção no código-fonte.

**Rodar o exemplo da documentação acha bug de documentação.** Ouvindo cada
evento numa sonda, `e.target.name` veio vazio no date picker — ele move o `name`
para um `<input type=hidden>` com o valor ISO, e o campo visível fica sem. Os
três arquivos ensinavam `e.target.name` como se valesse para todos.

**A tag é o último passo, depois do último commit.** Criei a tag `v0.30.1` e só
então continuei mexendo: o commit seguinte renomeou o evento público
`tucano:toast-fechado` para `tucano:toast-closed`. Resultado — o npm, publicado
depois, saiu com o nome novo, e o jsDelivr, que serve da tag, ficou servindo o
antigo. Mesmo número de versão, código diferente em cada canal.

Tag publicada não se move: o jsDelivr cacheia de forma agressiva e alguém pode
já ter fixado aquela versão. A saída é subir a próxima. A ordem é sempre build →
conferir → commit → tag → push → publish, e nada entra entre a tag e o publish.
Antes de publicar, compare o que a tag contém com o que o `HEAD` contém.

**Caixa, opção e chave são o `<input>` nativo com o desenho trocado — e o
rótulo se defende do CSS de `label`.** Nada de JavaScript nem de elemento
substituto: `name`, `required`, estado misto e o anúncio do leitor de tela têm
de continuar sendo os do navegador. O `.tuc-choice` repete a classe e declara
margem e peso porque `label` é das tags que todo projeto estiliza — a própria
página de docs tem `.card label { display: block; margin-bottom: 8px }`, e com
peso 0,1,1 isso desmontava a linha dentro de qualquer card. O controle é
alinhado ao topo e descido até o centro de uma primeira linha de altura fixa;
`npm run audit` mede esse centro, com e sem descrição. A chave precisa de
`role="switch"` no template, porque CSS não põe papel.

**Campo com erro é `aria-invalid="true"`, não classe.** É o atributo que o
leitor de tela anuncia, e o Django 5 o escreve sozinho em todo campo que voltou
com erro — então `{{ field }}` pinta sem ninguém escrever nada. Nos componentes
que trocam o campo por um controle próprio, o atributo continua no nativo e o CSS
chega ao controle por `select[aria-invalid] + .tuc-select` e `:has(> …)`: nenhum
componente copia atributo, e por isso nenhum fica dessincronizado quando o HTMX
troca o campo. `:user-invalid` vai dentro de `:is()`, que perdoa seletor
desconhecido — fora dele, navegador sem suporte descartaria a lista inteira.

**As abas vêm desenhadas do template; o script só põe papéis e teclado.** As
classes `.tuc-tabs__*`, o `aria-selected="true"` da inicial e o `hidden` dos
outros painéis são escritos à mão, e por isso a página nasce certa no primeiro
quadro, sem bloco de espera. O teclado é o do ARIA APG: a lista é uma parada só do
`Tab`, e as setas andam dentro dela pulando aba desativada. `data-manual` existe
para painel que carrega por HTMX — com ativação automática, atravessar quatro
abas com a seta dispararia quatro requisições.

**Na página de teste, gatilho de popover precisa estar na tela.** O Popover fecha
o painel no primeiro reposicionamento quando a âncora está fora da viewport
(`closeIfDetached`). Ao acrescentar as abas no `behavior.mjs`, o botão do dropdown
desceu para 838px numa janela de 813, o menu fechou no `show()`, e o teste acusou
"foco não voltou" — que parecia defeito de foco e era de posição. Conteúdo novo
na página de teste empurra o que vem depois; o teste rola o gatilho para a tela
antes de abrir, como faria quem clica.

**Aspas cruas em `class="…"` dentro de `<code>` na página viram classe para o
`consistency.mjs`.** Numa nota em prosa, escreva `&quot;`; nos `<pre>` o valor já
sai partido em `<span>` e não casa.

**Peça básica é importada antes do componente que a usa.** Em
`src/styles/index.css`, botão, etiqueta, carregando e aviso vêm logo depois do
formulário. Com o mesmo peso de seletor ganha a regra que vem depois, e o
`button.css` estava depois de datepicker, colorpicker, upload e máscara: todo
ajuste que esses componentes declaravam sobre o `.tuc-btn` morria calado. Pior,
`.tuc-dp__nav.is-ghost { visibility: hidden }` — feita para o espaço reservado —
casava com as setas de verdade, que usam a variante `is-ghost`, e o calendário
ficou sem trocar de mês pelo mouse sem teste nenhum acusar. Modificador próprio
de componente não pode ter nome de variante do sistema (`is-ghost`, `is-sm`,
`is-outline`…).

**Componente usa as peças da biblioteca por dentro.** Botão é `.tuc-btn`,
campo é `.tuc-input`, carregando é `.tuc-spinner`, aviso é `.tuc-alert`,
contador é `.tuc-badge`, ícone é `ICON_*` de `dom.js`. O componente declara só
posição e, quando não cabe, tamanho — nunca cor, borda, hover ou foco de novo.
As exceções são deliberadas: célula de dia e amostra de cor (o conteúdo é o
próprio valor), opção de lista e de menu (papel e teclado próprios), campo sem
caixa dentro de um controle, e o X da tag do select, que não cabe num botão.

**A página de docs usa as peças da biblioteca, e o `<style>` dela é só layout.**
Nota é `.tuc-alert is-info`, rótulo é `.tuc-label`, pílula e selo de versão são
`.tuc-badge is-plain`, botão de tema e de menu é `.tuc-btn`, índice lateral é
`.tuc-menu`, tabela de referência é `.tuc-table`, o copiar dos blocos é o
`.tuc-copy` do `.tuc-prose`, e os ícones do script vêm de `Tucano.icon` e
`Tucano.ICON_*`. Cada um deles tinha um segundo desenho no `<style>` — e dois
viraram defeito: `.card label` desmontava todo `<label>` de componente dentro de
um card, e o `th,td` global vazava para as tabelas de demonstração. Ao
documentar algo novo, use a peça; se ela não servir, o problema é da peça. O selo
da versão é procurado pelo `stamp.mjs` com a classe exata
`tuc-badge is-plain ver`: mudou a marcação, muda a expressão junto.

**Toda mudança que quem usa percebe entra no `CHANGELOG.md`, em "Ainda não
publicado" — e na mesma hora em `CHANGELOG.en.md` ("Unreleased") e
`CHANGELOG.es.md` ("Sin publicar").** Novo, mudou, corrigido — e, em "Atenção ao
atualizar", o que obriga alguém a mexer no próprio projeto: classe renomeada ou
removida, padrão que mudou. Na hora da tag, a seção ganha o número e a data nos
três arquivos. O português é a fonte da página Changelog em português e vai no
pacote do npm; os outros dois alimentam a página no idioma deles. Nenhum é
montado a partir das tags no build porque o CI baixa o repositório sem histórico.
O `consistency.mjs` compara as versões e a quantidade de itens dos três e falha
se uma nota ficou só em português.

**O destaque padrão do pacote é neutro, e o laranja do tucano é só do site.**
No pacote, `--tuc-accent` é `#0a0a0a` no claro e `#fafafa` no escuro, com
`--tuc-accent-fg` invertido (`#ffffff` / `#0a0a0a`) e `--tuc-thumb` escuro no
escuro. A cor é do projeto que instala: um destaque de marca de fábrica brigava
com a marca do cliente. Não volte a pôr cor no padrão sem o dono pedir. O site
da documentação define o laranja no `site.css` (`:root`, `.dark` e
`[data-theme='dark']`, porque o pacote redefine o destaque no escuro): branco
sobre `#FF7501` dá 2,7, decisão de marca tomada sabendo o número, e como cor de
texto no claro vale `#B84300` (5,5 sobre branco). Regra: fundo, borda, marcação e
sublinhado leem `--tuc-accent`; a propriedade `color` de um texto lê
`--tuc-accent-text` — no neutro coincidem, mas com cor viva não.
A bolinha da chave tem `--tuc-thumb`, para quem troca `--tuc-accent-fg` para
escuro não ganhar bolinha preta. Ao trocar o destaque, confira texto em cima dele, e o texto de
destaque sobre branco, sobre `--tuc-hover` e sobre `--tuc-accent-soft`.

Informação ganhou tom próprio, `--tuc-info`: lendo o destaque, com laranja o
aviso de informação ficava igual ao de alerta. Tom semântico (sucesso,
alerta, perigo, informação) nunca lê `--tuc-accent` — a marca pode ser de qualquer
cor, e o significado não pode mudar junto.

**Painel dentro de `<dialog>` aberto nasce no próprio diálogo.** O `<dialog>`
aberto está na top layer, acima de qualquer `z-index`. O Popover anexava todo
painel ao `body`, então o select, o calendário e o color picker de um formulário
em modal abriam atrás dele, invisíveis. O destino padrão agora é o `<dialog open>`
que contém a âncora; componente nenhum força `document.body` — ele só repassa o
`appendTo` que recebeu.

**Atributo de erro é de quem renderizou o campo.** A máscara zerava
`aria-invalid` em todo foco, e o erro que o Django escreveu sumia no primeiro
clique. Um componente só mexe em `aria-invalid` quando ele próprio valida
(`data-validate`); sem isso, o atributo pertence ao template.

**Botão de barra responde ao teclado.** A barra do editor agia só no
`mousedown`, para não perder a seleção — e com isso `Enter` e `Espaço` num botão
focado não faziam nada. O `click` com `detail === 0` é o teclado (o mouse já agiu
no `mousedown`), e a última seleção feita dentro da área fica guardada para ser
devolvida quando o foco volta. Ação só no `mousedown` sempre precisa desse par.

**Token derivado é declarado em cada elemento da biblioteca, não só na raiz.**
Custom property que usa `var()` é resolvida onde é declarada. Com
`--tuc-accent-soft` e `--tuc-accent-ring` só no `:root`, trocar `--tuc-accent`
num contêiner mudava o botão e deixava o fundo da tag e o anel de foco na cor da
raiz. Os derivados (`-soft`, `-ring`) moram em
`:root, :where([class^='tuc-'], [class*=' tuc-'])`, e são recalculados com o valor
herdado. Token novo que deriva de outro vai nesse bloco.

**Tempo de segurança fica acima do token.** A saída do diálogo removia o elemento
aos 160 ms com `--tuc-duration-out` em 170 ms, e o fim da animação saía cortado.
Número em JavaScript que espera uma transição do CSS fica acima dela, nunca igual
nem abaixo. O `EXIT_MS` do `core/popover.js` estava exatamente igual ao token
(170 ms) e passou a 200, como o do `dialog.js`: igual não tem folga nenhuma para
um quadro atrasado.

## Antes de dizer que está pronto

```bash
npm run audit
```

Mede a altura e a fonte de todo controle nas duas larguras e falha se algum sair
do padrão. Existe porque o mesmo erro aconteceu três vezes — botão de ícone com
28px ao lado de um de 30, campo de data com 38px e fonte 13 ao lado de um select
de 44 e 16 — e nas três quem percebeu foi o usuário, olhando a tela.

Componente novo com campo ou botão precisa entrar em `tools/audit.mjs` e na
lista do `@media (max-width: 40rem)` em `core/tokens.css`. Foi ficar de fora
dessa lista que fez o campo de texto pedir zoom no iPhone.

## Ao testar mudanças visuais

**Confira `document.visibilityState` antes de confiar em qualquer medida.** Um
painel de navegador oculto congela transições, reporta `innerWidth: 0`, ignora
`scrollIntoView` e nunca executa `requestAnimationFrame` — o que trava a chamada
até o timeout. Isso já produziu várias investigações fantasma: toasts de 599px,
painéis com opacidade 0, elementos "fora da viewport" em y=13000, e uma medição
que parecia inocentar a causa real de um bug. Para geometria, use um alvo
`position: fixed` no centro da tela em vez de rolar até o elemento; para
animação, leia a especificação (`getAnimations()`, `getComputedStyle`) em vez de
amostrar quadros.

`element.click()` não passa por `mousedown`/`mouseup` e não move o foco. Dois
bugs sérios passaram por testes assim. Interações que envolvem foco, hover ou
clique precisam de mouse e teclado reais.

**Verifique o elemento certo.** Um seletor frouxo já disse "inicializado" olhando
para o componente vizinho, e o atributo errado (`data-tuc-date` em vez de
`data-tuc-datepicker`) passou por isso.

Cuidado com cache do navegador ao testar `dist/`: já aconteceu de "corrigir" um
bug contra build antigo. Confirme o código carregado, não só o arquivo em disco.

## Testes

`npm test` compila e roda cinco coisas, nesta ordem. Cada uma existe por causa
de um defeito que passou batido.

**`test/*.test.mjs` — 52 testes das funções puras** (`node --test`, sem
dependência). `dates`, `mask`, `color` e `pageWindow` são entrada e saída sem
DOM. Inclui `sanitize`, que é peça de segurança.

**`tools/behavior.mjs` — 72 comportamentos no Chrome sem cabeça.** Abrir, fechar,
ordenar, marcar, emitir evento, e os textos: português sem `setTexts`, troca
global, opção da instância vencendo e restauração no fim. Armadilha registrada no cabeçalho do arquivo:
transição não avança ali, então nunca leia opacidade ou posição logo depois de
abrir algo — a página injeta `transition: none` onde o estado final importa.

**`tools/examples.mjs` — os 342 exemplos da documentação, em todas as páginas do site.** Os de HTML são
colados no documento e têm que montar; os de JS não são executados (citam
`#delivery` e `form`, que não existem) e sim conferidos nome por nome
contra o código: `Tucano.x` existe? o método existe no protótipo? cada chave de
opção é lida por alguém, inclusive dentro de `actions` e `items`?

**`tools/keyboard.mjs` — 23 caminhos de teclado real**, pelo protocolo de
depuração do Chrome: `Backspace` e `Delete` na máscara e no select, as setas nas abas, o
`↓` que leva o foco ao dia no date picker, a barra do editor pelo teclado, o
`Escape` de um painel dentro de modal (que fechava o modal junto: o `cancel` do
`<dialog>` é ação padrão da tecla, e `stopPropagation` não o impede) e o foco
que o `Escape` devolve à amostra do color picker.
Evento sintético não dispara a ação padrão, então só assim o caminho é o real.

**`tools/consistency.mjs` — nome que existe em dois lugares e mudou só num.** As
checagens saíram de defeitos reais, e cada uma foi testada reintroduzindo
o defeito que a motivou. A de identificador em português tira as strings antes
de procurar, e por isso deixou passar `--matiz`, `nextId('cor')`, o sufixo
`-dica` e os motivos `'foco'`/`'solto'`; a 5c olha justamente as strings que são
nome — custom property, prefixo de `nextId`, motivo de `onDismiss` e sufixo de
id — e acusou os sete antes da correção.

`npm run audit` continua à parte: mede geometria dos campos nos dois temas.

Duas armadilhas ao escrever essas ferramentas, ambas custaram tempo nesta
sessão: um comentário com `</script>` fecha o bloco que ele descreve, e código
de navegador escrito dentro de template literal perde toda barra de regex
(`\\d` vira `d`, calado). Por isso `examples.mjs` injeta a função por
`toString()` — assim o Node valida a sintaxe antes de o Chrome ver.

## Ainda em aberto

Nada registrado no momento. O texto fixo em português dentro dos componentes,
que abria esta lista, foi resolvido com `Tucano.setTexts` — ver "Texto de
interface mora em `core/texts.js`".

