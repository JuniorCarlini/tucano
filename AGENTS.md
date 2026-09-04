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
```

O `build` termina em `tools/tamanhos.mjs`, que escreve o peso real do `dist` na
página, no README e no llms.txt. Nunca edite esses números à mão: eles já
envelheceram uma vez, e a página chegou a anunciar 15 KB com o arquivo em 27.

`index.html` na raiz é a documentação e também a página do GitHub Pages.
`dist/` **é versionado** de propósito: é ele que o CDN serve e o que faz o uso
estático funcionar sem build.

## Estrutura

```
src/js/core/          datas, cores, DOM, popover, base do diálogo
src/js/components/    datepicker, select, colorpicker, upload, mask,
                      toast, tooltip, modal, offcanvas, acordeon
src/styles/core/      reset e tokens
src/styles/components/
```

Modal e gaveta compartilham `core/dialogo.js`: top layer, foco preso, Escape e
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

**O editor de texto escapa antes de marcar, nunca o contrário.** `core/sanitizar.js`
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
página escura. `npm run conferir` cobre isso agora, comparando o campo em espera
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
`fecharAoSairFoco`, e é opcional de propósito — o tooltip aparece no hover com o
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
`Enter`/`Espaço` sem código nosso. `openOnFocus` continua existindo no date
picker para quem quiser o comportamento antigo, agora com padrão `false`.

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
`tools/icones.html`; componente importa a constante.

**Helper compartilhado mora em `core/dom.js`.** `omitUndefined` existia copiado
em doze componentes com dois nomes; `escapeHtml` em dois. Antes de escrever
uma função utilitária num componente, procure em `dom.js`.

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

**Versão e tamanho não se escrevem à mão — `tools/carimbo.mjs` carimba os dois
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

**Se é clicável, tem cara de botão.** A coluna de ações da tabela nasceu com
`is-ghost` esmaecido a 55%, com a justificativa de que vinte linhas de ícones
acesos competiriam com o conteúdo. Na tela o efeito foi outro: sem borda e sem
fundo, o ícone lia como decoração desativada. Ali vão os botões do sistema —
`tuc-btn is-outline is-icon is-sm` — sem opacidade nenhuma.

## Antes de dizer que está pronto

```bash
npm run conferir
```

Mede a altura e a fonte de todo controle nas duas larguras e falha se algum sair
do padrão. Existe porque o mesmo erro aconteceu três vezes — botão de ícone com
28px ao lado de um de 30, campo de data com 38px e fonte 13 ao lado de um select
de 44 e 16 — e nas três quem percebeu foi o usuário, olhando a tela.

Componente novo com campo ou botão precisa entrar em `tools/conferir.mjs` e na
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

## Ainda em aberto

- Não há suite de testes automatizados.
- O Backspace da máscara foi validado por `InputEvent` simulado, não por teclado
  real.
