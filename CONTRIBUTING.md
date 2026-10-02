# Contribuir com a Tucano

Obrigado por olhar o código. Este arquivo é o caminho curto; as decisões de
projeto e as armadilhas conhecidas moram no [AGENTS.md](AGENTS.md), que vale
para pessoas e para agentes de IA.

## Rodando

```bash
npm install
npx playwright install chromium firefox webkit   # navegadores dos testes
npm run serve       # build + http://127.0.0.1:4322
npm test            # build e todos os testes, nos três navegadores
npm run audit       # geometria dos campos nos dois temas
```

## O que o CI exige

O `npm test` roda tudo o que o GitHub Actions roda, e nesta ordem: funções
puras, tipos, comportamento, teclado de verdade, exemplos da documentação e as
checagens cruzadas de nome. Além disso, o CI confere que **o que foi gerado está
commitado** — `dist/`, `llms.txt`, `dist/tucano.d.ts` e as páginas do site saem
do build, então rode `npm run build` antes de abrir o PR.

Três coisas derrubam o CI com frequência e não aparecem aqui na sua máquina:

- **Navegador de Linux.** O WebKit e o Firefox do CI não são os do macOS: foco,
  balão de validação nativo e tempo de transição mudam. Teste que depende de
  tempo fixo passa aqui e reprova lá — espere a condição, não o relógio.
- **Node 24.** O CI usa a LTS; números gerados com `node:zlib` mudam entre
  versões, e por isso o tamanho em gzip sai do `fflate` com versão fixa.
- **Nome só trocado num lugar.** A `tools/consistency.mjs` cruza CSS, JS,
  documentação e README. Renomeou? Rode `npm test` antes de acreditar.

## Padrão do código

- **Código em inglês, comentário em português.** Vale para nome de classe CSS,
  variável, opção e id — a `consistency` reprova nome em português no código.
- **O comentário explica por quê, não o quê.** Se a linha já diz o que faz, o
  comentário só vale se contar a razão ou a armadilha.
- **Componente novo que é variação de outro herda, não copia** — como o menu do
  botão direito herda do menu suspenso.
- **A documentação é gerada.** Edite `site/pages/<slug>.html`, nunca o
  `<slug>/index.html` publicado.

## Mensagem de commit

Escreva **por que** a mudança existe, e não só o que mudou — o diff já conta o
quê. Uma linha de assunto no imperativo, linha em branco, e o corpo explicando o
problema que levou àquilo. Sem rodapé de atribuição.

## Publicação

Só o mantenedor publica. O caminho é: versão no `package.json`, changelog datado
nos três idiomas, `npm test`, commit, tag anotada `vX.Y.Z` e push — a tag é que
dispara a publicação no npm pelo `release.yml`.
