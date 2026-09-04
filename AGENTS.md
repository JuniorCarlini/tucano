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
qualquer servidor. Para exibir com a mesma aparência, envolva em `.tuc-prosa` —
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
