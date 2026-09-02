# Tucano — instruções para agentes

Biblioteca de componentes de formulário em JavaScript puro: date picker, select
com busca e color picker. Sem dependências em runtime.

**Para usar a biblioteca em outro projeto, leia [llms.txt](llms.txt)** — ele tem
a API completa. Este arquivo é sobre trabalhar *no* código da Tucano.

## Como rodar

```bash
npm install          # só para desenvolver; quem consome não precisa de build
npm run build        # gera dist/ (JS via esbuild, CSS via Tailwind CLI)
npm run dev          # build + servidor local
npm run build:og     # regera og.png a partir de tools/og.html
```

`index.html` na raiz é a documentação e também a página do GitHub Pages.
`dist/` **é versionado** de propósito: é ele que o CDN serve e o que faz o uso
estático funcionar sem build.

## Estrutura

```
src/js/core/          datas, cores, DOM, posicionamento do popover
src/js/components/    datepicker, select, colorpicker
src/styles/core/      reset e tokens
src/styles/components/
```

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

## Ao testar mudanças visuais

`element.click()` não passa por `mousedown`/`mouseup` e não move o foco. Dois
bugs sérios passaram por testes assim. Interações que envolvem foco, hover ou
clique precisam de mouse e teclado reais.

Cuidado com cache do navegador ao testar `dist/`: já aconteceu de "corrigir" um
bug contra build antigo. Confirme o código carregado, não só o arquivo em disco.

## Ainda em aberto

- Não há suite de testes automatizados.
- O Backspace da máscara foi validado por `InputEvent` simulado, não por teclado
  real.
