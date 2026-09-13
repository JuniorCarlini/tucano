# Changelog

O que mudou em cada versão da Tucano, da mais nova para a mais antiga. Antes de
atualizar, leia "Atenção ao atualizar": ali está o que pede mudança no seu
projeto.

## Ainda não publicado

### Atenção ao atualizar

- A cor de destaque padrão agora é o laranja do tucano, `#FF7501`, nos dois
  temas, e o texto sobre ela passa a ser escuro (`--tuc-accent-fg`). Onde o
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

- As setas de trocar de mês do calendário estavam invisíveis e sem clique.
- Botão feito com `<a>` saía sublinhado.
- Upload, item perigoso do menu suspenso e campo inválido da máscara usavam
  vermelho e verde fixos, que não clareavam no tema escuro.
- O anel de foco do painel de abas subia por cima da lista.
- O erro da busca no servidor aparecia igual a "nenhum resultado".

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
