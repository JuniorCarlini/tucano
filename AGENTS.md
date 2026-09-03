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
