import { el, escapeHtml, icon, omitUndefined, on } from '../core/dom.js';
import { sanitize, safeUrl } from '../core/sanitize.js';
import { Modal } from './modal.js';
import { Dropdown } from './dropdown.js';
import { highlight } from '../core/highlight.js';
import { EDITOR_TEXTS as T } from '../core/texts.js';

/*
 * Editor de texto formatado, do tipo que mostra o resultado enquanto se
 * escreve. Quem preenche uma descricao no sistema ve negrito em negrito, e nao
 * asteriscos.
 *
 * O <textarea> original continua no DOM, escondido, guardando o HTML: assim
 * `name`, `required` e o POST do Django seguem funcionando sem nada especial, e
 * quem ja tem um formulario nao muda a view.
 *
 * Duas escolhas carregam o peso desta implementacao:
 *
 * Colar entra como texto puro. E o que evita o HTML do Word e do Google Docs,
 * com suas tabelas de layout e estilos embutidos, que e onde editor ingenuo
 * quebra primeiro.
 *
 * A saida passa por uma peneira de tags a cada leitura, e nao so no que
 * digitamos. Navegador tem liberdade para marcar como quiser ao executar um
 * comando, e o resultado precisa caber no que prometemos entregar.
 */

const DEFAULTS = {
  toolbar: ['bold', 'italic', 'underline', 'title', 'subheading',
            'list', 'numbered', 'left', 'center', 'right', 'justify',
            'quote', 'code', 'link', 'table', 'clear'],
  table: { rows: 3, cols: 3 },
  minHeight: '9rem',
  placeholder: '',
  /*
   * Variaveis do texto: [{ name, label, example }]. Sem elas o editor nao muda
   * em nada — nem botao na barra, nem a lista ao digitar `{`.
   */
  variables: null,
};

const ICONS = {
  bold:    'M6 4h6a4 4 0 010 8H6zM6 12h7a4 4 0 010 8H6z',
  italic:    'M19 4h-9M14 20H5M15 4L9 20',
  underline: 'M6 4v6a6 6 0 0012 0V4M4 21h16',
  title:     'M6 4v16M18 4v16M6 12h12',
  subheading:  'M6 6v12M16 6v12M6 12h10',
  list:      'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  numbered:   'M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1',
  quote:    'M6 17h3l2-4V7H5v6h3zM14 17h3l2-4V7h-6v6h3z',
  link:       'M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1',
  clear:     'M4 7V4h16v3M5 20h6M13 4L8 20M15 15l5 5M20 15l-5 5',
  table:     'M3 5h18v14H3zM3 10h18M3 15h18M9 5v14M15 5v14',
  left:   'M3 6h18M3 12h11M3 18h15',
  center:     'M3 6h18M6 12h12M4 18h16',
  right:    'M3 6h18M10 12h11M6 18h15',
  justify: 'M3 6h18M3 12h18M3 18h18',
  code:     'M16 18l6-6-6-6M8 6l-6 6 6 6',
  variable: 'M8 4H7a2 2 0 00-2 2v3a2 2 0 01-2 2 2 2 0 012 2v3a2 2 0 002 2h1M16 4h1a2 2 0 012 2v3a2 2 0 002 2 2 2 0 00-2 2v3a2 2 0 01-2 2h-1',
};

/* Os rotulos dos botoes moram em core/texts.js, com a mesma chave da barra. */

/*
 * execCommand esta deprecado, mas continua sendo o unico caminho com suporte
 * universal para negrito, lista e bloco — e, o que mais importa aqui, e o unico
 * que se integra ao desfazer nativo do navegador. Reimplementar isso a mao
 * significaria reimplementar tambem o Ctrl+Z, que e onde editores caseiros
 * costumam decepcionar.
 */
const COMMANDS = {
  bold:    () => document.execCommand('bold'),
  italic:    () => document.execCommand('italic'),
  underline: () => document.execCommand('underline'),
  title:     () => toggleBlock('H2'),
  subheading:  () => toggleBlock('H3'),
  list:      () => document.execCommand('insertUnorderedList'),
  numbered:   () => document.execCommand('insertOrderedList'),
  quote:    () => toggleBlock('BLOCKQUOTE'),
  clear:     () => document.execCommand('removeFormat'),
  left:   () => document.execCommand('justifyLeft'),
  center:     () => document.execCommand('justifyCenter'),
  right:    () => document.execCommand('justifyRight'),
  justify: () => document.execCommand('justifyFull'),
  code:     () => toggleCode(),
  table:    (ed) => insertTable(ed),
  variable: (ed) => ed.openVariables(),
  link:     (ed) => ed._askForLink(),
};

/*
 * Quando o botao acende.
 *
 * O valor e um comando ou um seletor. queryCommandState cobre negrito, lista e
 * alinhamento, e para ai; para o resto — "o cursor esta dentro de uma
 * citacao?" — a pergunta e feita ao elemento em volta do cursor. Um mapa so
 * serve aos dois porque cada valor so casa do seu lado: nao existe elemento
 * <insertorderedlist>, e o comando 'h2' nao existe. Sem o lado do DOM metade da
 * barra ficava apagada mesmo com o cursor dentro do bloco que ela aplica.
 */
const STATES = {
  bold: 'bold', italic: 'italic', underline: 'underline',
  list: 'insertUnorderedList', numbered: 'insertOrderedList',
  left: 'justifyLeft', center: 'justifyCenter',
  right: 'justifyRight', justify: 'justifyFull',
  title: 'h2', subheading: 'h3', quote: 'blockquote',
  code: 'pre, code', link: 'a', table: 'table',
};

const SHORTCUTS = { b: 'bold', i: 'italic', u: 'underline', k: 'link' };

/** Troca a selecao do documento por este intervalo. */
function select(range) {
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

/*
 * O execCommand nao tem comando de codigo, entao a marcacao e montada aqui —
 * mas entregue por insertHTML, e nao inserida direto no DOM. E o que mantem a
 * operacao dentro do desfazer nativo: um Ctrl+Z depois de aplicar codigo
 * precisa voltar como qualquer outra formatacao, senao o editor mente sobre o
 * proprio historico.
 */

function toggleCode() {
  const sel = window.getSelection();
  if (!sel?.rangeCount) return;
  const start = sel.anchorNode?.nodeType === Node.ELEMENT_NODE ? sel.anchorNode : sel.anchorNode?.parentElement;
  const inside = start?.closest?.('pre, code');

  // Ja e codigo: seleciona a marcacao inteira e devolve o texto sem ela.
  if (inside) {
    const target = inside.closest('pre') || inside;
    const text = target.textContent;
    const r = document.createRange();
    /*
     * Em volta do elemento, e nao dentro dele. selectNode marca o conteudo, e
     * o insertHTML seguinte escrevia os paragrafos por dentro do <pre>, que
     * ficava de pe — sobrava um bloco de codigo com paragrafos la dentro.
     */
    r.setStartBefore(target);
    r.setEndAfter(target);
    select(r);
    /*
     * O bloco e trocado direto no DOM, e nao por execCommand.
     *
     * Tanto insertText quanto insertHTML escrevem *dentro* do <pre>, que fica
     * de pe: sobrava um bloco de codigo com paragrafos la dentro. Nem
     * selecionar em volta do elemento demove o insertHTML disso — ele respeita
     * o bloco em que o cursor esta.
     *
     * O custo e sair do desfazer nativo nesta operacao so. Preferi isso a
     * entregar um resultado errado: tirar a formatacao e a acao de quem se
     * arrependeu, e ela precisa funcionar de primeira.
     */
    if (target.tagName === 'PRE') {
      const block = document.createDocumentFragment();
      for (const row of text.split('\n')) {
        const paragraph = document.createElement('p');
        if (row) paragraph.textContent = row;
        else paragraph.append(document.createElement('br'));
        block.append(paragraph);
      }
      const first = block.firstChild;
      target.replaceWith(block);
      if (first) {
        const pos = document.createRange();
        pos.selectNodeContents(first);
        pos.collapse(true);
        select(pos);
      }
      return;
    }
    document.execCommand('insertText', false, text);
    return;
  }

  const text = sel.toString();
  if (!text) return;
  /*
   * Linha em branco dupla vira simples. A selecao atravessa paragrafos, e
   * toString junta cada um com duas quebras — o bloco saia com um vazio entre
   * todas as linhas, como se o codigo tivesse sido espacado de proposito.
   */
  const escaped = escapeHtml(text.replace(/\n{2,}/g, '\n'));

  /*
   * Selecao que atravessa linhas vira bloco, e nao codigo no meio da frase.
   * Um <code> solto nao guarda quebra: o navegador dissolvia a marcacao e
   * sobravam paragrafos com o texto cru, sem formatacao nenhuma. <pre> e o
   * elemento que existe para preservar quebra e recuo.
   */
  if (/\n/.test(text)) {
    document.execCommand('insertHTML', false, `<pre><code>${escaped}</code></pre><p><br></p>`);
    return;
  }
  document.execCommand('insertHTML', false, `<code>${escaped}</code>`);
}

/** Aplica o bloco, ou volta para paragrafo se ele ja estiver aplicado. */
function toggleBlock(tag) {
  const current = document.queryCommandValue('formatBlock')?.toUpperCase();
  document.execCommand('formatBlock', false, current === tag ? 'P' : tag);
}

/*
 * Cada tabela mora numa caixa que rola na horizontal, para a tabela larga nao
 * espremer as colunas. A caixa e so exibicao: e uma <div>, que a peneira
 * dissolve, entao o valor salvo continua sem ela.
 *
 * Roda depois de tudo que pode criar ou apagar tabela — valor inicial, inserir,
 * operacoes de tabela, desfazer — e deixa uma tabela por caixa, nada alem dela
 * ali dentro, e nenhuma caixa vazia. No caso comum nao mexe em nada.
 */
const SCROLL = 'tuc-editor__scroll';

function wrapTables(area) {
  for (const box of area.querySelectorAll(`.${SCROLL}`)) {
    const table = [...box.children].find((n) => n.tagName === 'TABLE');
    const extra = [...box.childNodes].filter((n) => n !== table);
    if (extra.length) box.after(...extra);
    if (!table) box.remove();
  }
  for (const table of area.querySelectorAll('table')) {
    if (table.parentElement.classList.contains(SCROLL)) continue;
    const box = document.createElement('div');
    box.className = SCROLL;
    table.before(box);
    box.append(table);
  }
}

/*
 * A tabela vai por insertHTML, e nao montada no DOM — que o execCommand nao
 * tem comando de tabela em navegador nenhum. Assim ela entra no desfazer
 * nativo, e o navegador fecha o paragrafo em volta antes de inserir: posta
 * pelo DOM, ela ia parar dentro do <p> do cursor, e o Ctrl+Z seguinte desfazia
 * o texto de antes e deixava a tabela.
 *
 * Vai com cabecalho porque tabela de sistema quase sempre tem um, e sem ele a
 * primeira linha de dados acaba servindo de titulo.
 */
function insertTable(ed) {
  const { rows, cols } = ed.opts.table;
  const row = (tag) => `<tr>${`<${tag}><br></${tag}>`.repeat(cols)}</tr>`;
  /*
   * Com o cursor dentro de uma celula, a nova tabela nasce depois da atual, e
   * nao dentro dela. Tabela aninhada quase nunca e o que se queria, e desfazer
   * isso pelo editor e trabalhoso.
   */
  const inside = ed._currentCell()?.closest('table');
  if (inside) {
    const r = document.createRange();
    r.setStartAfter(inside.closest(`.${SCROLL}`) || inside);
    select(r);
  }
  // Um paragrafo depois da tabela: sem ele nao ha onde continuar escrevendo
  // quando ela e a ultima coisa do texto. O cursor fica nele, e dali acha a tabela.
  // A caixa de rolagem vai junto no insertHTML: posta depois, pelo wrapTables do
  // `input`, ela movia a tabela por fora do historico, e o Ctrl+Z do Firefox
  // deixava de encontra-la — desfazia o paragrafo e a tabela ficava.
  document.execCommand('insertHTML', false, `<div class="${SCROLL}"><table><thead>${row('th')}</thead><tbody>${row('td').repeat(rows - 1)}</tbody></table></div><p><br></p>`);
  focusCell(ed._currentNode()?.closest('p')?.previousElementSibling?.querySelector('th'));
}

/** Proxima celula na ordem de leitura, ou nada se for a ultima. */
function nextCell(cell, back) {
  const table = cell.closest('table');
  const cells = [...table.querySelectorAll('th, td')];
  return cells[cells.indexOf(cell) + (back ? -1 : 1)] || null;
}

/*
 * Operacoes de tabela.
 *
 * Todas partem da celula onde o cursor esta, e nao de um indice guardado: o
 * conteudo pode ter sido editado entre um clique e outro, e posicao decorada
 * envelhece. Perguntar ao DOM na hora custa nada e nunca erra.
 */
const TABLE = {
  rowAbove:   (c) => insertRow(c, 0),
  rowBelow:  (c) => insertRow(c, 1),
  colBefore:  (c) => insertColumn(c, 0),
  colAfter: (c) => insertColumn(c, 1),
  deleteRow:  (c) => deleteRow(c),
  deleteColumn: (c) => deleteColumn(c),
  deleteTable: (c) => c.closest('table')?.remove(),
};

/*
 * Os rotulos da barra de tabela tambem estao em core/texts.js. O verbo vem
 * primeiro porque sem ele o rotulo e ambiguo: "Coluna a esquerda" tanto pode
 * inserir quanto alinhar, e a barra tem as duas coisas.
 */

const TABLE_ICONS = {
  rowAbove:    'M12 3v8M8 7h8M3 15h18M3 20h18',
  rowBelow:   'M3 4h18M3 9h18M12 21v-8M8 17h8',
  colBefore:   'M3 12h8M7 8v8M15 3v18M20 3v18',
  colAfter:  'M4 3v18M9 3v18M21 12h-8M17 8v8',
  deleteRow:  'M3 6h18M3 18h18M9 12h6',
  deleteColumn: 'M6 3v18M18 3v18M12 9v6',
  deleteTable: 'M4 7h16M10 11v6M14 11v6M5 7l1 13a2 2 0 002 2h8a2 2 0 002-2l1-13M9 7V4h6v3',
};

const emptyCell = (tag) => {
  const c = document.createElement(tag);
  c.append(document.createElement('br'));
  return c;
};

function insertRow(cell, after) {
  const row = cell.parentElement;
  const newRow = document.createElement('tr');
  for (let i = 0; i < row.children.length; i++) newRow.append(emptyCell('td'));
  // Linha acima do cabecalho vira corpo, nao outro cabecalho.
  const body = cell.closest('table').querySelector('tbody');
  if (row.parentElement.tagName === 'THEAD' && body) {
    body.prepend(newRow);
  } else {
    row.parentElement.insertBefore(newRow, after ? row.nextSibling : row);
  }
  return newRow.firstElementChild;
}

function insertColumn(cell, after) {
  const i = [...cell.parentElement.children].indexOf(cell);
  for (const row of cell.closest('table').querySelectorAll('tr')) {
    const model = row.children[i];
    const newCell = emptyCell(model?.tagName === 'TH' ? 'th' : 'td');
    row.insertBefore(newCell, after ? model?.nextSibling : model);
  }
  return cell.parentElement.children[after ? i + 1 : i];
}

function deleteRow(cell) {
  const row = cell.parentElement;
  const table = cell.closest('table');
  // Ultima linha: some a tabela inteira, senao sobra uma moldura vazia.
  if (table.querySelectorAll('tr').length <= 1) { table.remove(); return null; }
  const sibling = row.nextElementSibling || row.previousElementSibling;
  row.remove();
  return sibling?.firstElementChild ?? null;
}

function deleteColumn(cell) {
  // A linha e guardada antes do laco: ele apaga a coluna em todas as linhas,
  // inclusive nesta, e a partir dai a celula que recebemos nao tem mais pai.
  const row = cell.parentElement;
  const i = [...row.children].indexOf(cell);
  const table = cell.closest('table');
  if (row.children.length <= 1) { table.remove(); return null; }
  for (const l of table.querySelectorAll('tr')) l.children[i]?.remove();
  return row.children[Math.max(0, i - 1)] ?? null;
}

/** Poe o cursor no comeco de uma celula. */
function focusCell(cell) {
  if (!cell) return;
  const r = document.createRange();
  r.selectNodeContents(cell);
  r.collapse(true);
  select(r);
}

/*
 * Cursor dentro de um bloco, contado em caracteres.
 *
 * Repintar troca o HTML por dentro, e o navegador perde a posicao: o cursor
 * salta para o comeco a cada tecla. Contar caracteres sobrevive a troca porque
 * o texto nao muda — so a marcacao em volta dele.
 */
function offsetInBlock(block) {
  const sel = window.getSelection();
  if (!sel?.rangeCount || !block.contains(sel.anchorNode)) return null;
  const r = sel.getRangeAt(0).cloneRange();
  r.selectNodeContents(block);
  r.setEnd(sel.getRangeAt(0).endContainer, sel.getRangeAt(0).endOffset);
  return r.toString().length;
}

function restoreOffset(block, howMany) {
  if (howMany == null) return;
  const step = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
  let counted = 0;
  let node;
  while ((node = step.nextNode())) {
    if (counted + node.length >= howMany) {
      const r = document.createRange();
      r.setStart(node, howMany - counted);
      r.collapse(true);
      select(r);
      return;
    }
    counted += node.length;
  }
}


/* `{{nome}}`, com ou sem espaco dentro das chaves. */
const VARIABLE_RE = /\{\{\s*([\w.-]+)\s*\}\}/g;

/*
 * Fundo nas variaveis escritas no texto, para elas se distinguirem do resto.
 *
 * Pintura do navegador sobre intervalos (Custom Highlight do CSS), e nao <span>
 * no conteudo: o valor salvo continua exatamente o texto que a pessoa escreveu,
 * o desfazer nao ve marcacao aparecendo sozinha e nao ha nada para converter na
 * hora de salvar. Onde a API nao existe (Safari abaixo da 17.2, Firefox abaixo
 * da 140) o texto aparece sem fundo, e mais nada muda.
 *
 * O registro do CSS e global e por nome, entao cada editor guarda aqui os seus
 * intervalos e a pintura junta os de todos.
 */
const variableRanges = new Map();

function paintVariableHighlights() {
  if (!window.CSS?.highlights || typeof Highlight === 'undefined') return;
  const known = [];
  const unknown = [];
  for (const ranges of variableRanges.values()) {
    known.push(...ranges.known);
    unknown.push(...ranges.unknown);
  }
  CSS.highlights.set('tuc-variable', new Highlight(...known));
  CSS.highlights.set('tuc-variable-unknown', new Highlight(...unknown));
}

/* Sem acento e em minusculas, dos dois lados: "prazo" acha "Prazo". */
const fold = (text) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/* Onde o cursor esta, em coordenadas de tela, para a lista nascer nele. */
function caretRect(area) {
  const sel = window.getSelection();
  const r = sel?.rangeCount ? sel.getRangeAt(0).getBoundingClientRect() : null;
  return r && (r.width || r.height || r.top || r.left) ? r : area.getBoundingClientRect();
}

/*
 * Lista de variaveis: e o mesmo menu suspenso, com duas diferencas.
 *
 * Quem abre e o editor — pelo botao da barra ou pelo `{` digitado —, entao o
 * gatilho nao recebe clique nem seta.
 *
 * Aberta enquanto se digita, ela nao rouba o foco: o foco esta no texto, e e de
 * la que vem o filtro. Focar o primeiro item pararia a digitacao no meio, e a
 * regra de "fechar quando o foco sai" fecharia a lista no mesmo instante.
 */
class VariableMenu extends Dropdown {
  _wireTrigger() {}
  _focusOnOpen() { if (!this.keepFocus) super._focusOnOpen(); }
  _closeOnFocusOut() { return !this.keepFocus; }
}

export class Editor {
  constructor(target, options = {}) {
    this.field = typeof target === 'string' ? document.querySelector(target) : target;
    if (!this.field) throw new Error('[Editor] elemento não encontrado');
    this.opts = { ...DEFAULTS, ...omitUndefined(options) };
    this._cleanups = [];
    this._build();
  }

  _build() {
    const field = this.field;

    this.area = el('div', {
      class: 'tuc-editor__area',
      contenteditable: 'true',
      role: 'textbox',
      'aria-multiline': 'true',
      'data-placeholder': this.opts.placeholder || field.placeholder || '',
    });
    this.area.style.minHeight = this.opts.minHeight;
    // O valor inicial tambem passa pela peneira: pode vir do banco.
    this.area.innerHTML = sanitize(field.value) || '<p><br></p>';
    wrapTables(this.area);

    // Onde a barra muda de assunto: marcacao de texto, alinhamento, blocos.
    const GROUPS = new Set(['left', 'quote']);

    /*
     * O botao da lista so existe quando ha variaveis, e entra no fim da barra.
     * Quem quiser noutro lugar o declara na propria opcao `toolbar`.
     */
    const tools = this.opts.variables?.length && !this.opts.toolbar.includes('variable')
      ? [...this.opts.toolbar, 'variable']
      : this.opts.toolbar;

    this.toolbar = el('div', { class: 'tuc-editor__toolbar', role: 'toolbar', 'aria-label': T.toolbar },
      tools.flatMap((name) => {
        const b = el('button', {
          type: 'button',
          class: 'tuc-btn is-ghost is-icon is-sm',
          'aria-label': T[name] ?? name,
          'data-tuc-tip': T[name] ?? name,
          'aria-pressed': 'false',
          // mousedown e nao click: click viria depois do blur, e a selecao
          // dentro da area ja teria sido perdida.
          onmousedown: (e) => { e.preventDefault(); this._byPointer = true; this.apply(name); },
          // Enter e Espaco num botao focado viram click com detail 0 — o mouse
          // ja agiu no mousedown, entao so o teclado passa daqui. Sem isto a
          // barra so funcionava com mouse.
          onclick: (e) => { if (e.detail === 0) { this._byPointer = false; this.apply(name); } },
        }, [icon(ICONS[name] ?? ICONS.clear, 15)]);
        b.dataset.action = name;
        return GROUPS.has(name)
          ? [el('span', { class: 'tuc-editor__sep', 'aria-hidden': 'true' }), b]
          : [b];
      }));

    /*
     * Barra de tabela: so aparece com o cursor dentro de uma. Poe-la sempre
     * visivel encheria a barra principal de botoes inuteis na maior parte do
     * tempo, e escondida ela ensina onde procurar quando faz falta.
     */
    this.tableBar = el('div', {
      class: 'tuc-editor__toolbar is-table',
      role: 'toolbar',
      'aria-label': T.tableToolbar,
      hidden: true,
    }, Object.keys(TABLE).map((name) => el('button', {
      type: 'button',
      class: `tuc-btn is-ghost is-icon is-sm${name.startsWith('delete') ? ' is-remove' : ''}`,
      'aria-label': T[name],
      'data-tuc-tip': T[name],
      onmousedown: (e) => { e.preventDefault(); this.inTable(name); },
      onclick: (e) => { if (e.detail === 0) this.inTable(name); },
    }, [icon(TABLE_ICONS[name], 15)])));

    this._varButton = this.toolbar.querySelector('[data-action="variable"]');

    this.root = el('div', { class: 'tuc-editor' }, [this.toolbar, this.tableBar, this.area]);
    field.parentNode.insertBefore(this.root, field);
    this.root.append(field);
    field.hidden = true;
    field.classList.add('tuc-editor__value');

    this._cleanups.push(
      on(this.area, 'input', () => {
        wrapTables(this.area);
        this._sync();
        this._schedulePaint();
        this._variableTyping();
      }),
      on(this.area, 'paste', (e) => this._paste(e)),
      /*
       * Arrastar para dentro entra como texto puro, pelo mesmo motivo de colar:
       * soltar um trecho de outra pagina trazia fonte, cor, <h1> e <img> — que a
       * peneira tirava do valor, mas nao da tela, e a imagem ainda era baixada.
       */
      on(this.area, 'beforeinput', (e) => {
        if (e.inputType !== 'insertFromDrop') return;
        e.preventDefault();
        const [target] = e.getTargetRanges();
        const r = document.createRange();
        r.setStart(target.startContainer, target.startOffset);
        select(r);
        this._insertPlain(e.dataTransfer.getData('text/plain'));
      }),
      on(this.area, 'keydown', (e) => this._onKey(e)),
      // selectionchange e global: e o unico evento que pega o cursor mudando
      // de lugar por qualquer caminho, inclusive clique fora e volta.
      on(document, 'selectionchange', () => {
        // Guarda a ultima selecao feita dentro da area: quem chega a barra pelo
        // Tab tira o foco dali, e o comando precisa de onde aplicar. Com o foco
        // na barra o estado fica como estava, para o botao nao se apagar sob
        // quem esta nele.
        const sel = window.getSelection();
        if (sel?.rangeCount && this.area.contains(sel.anchorNode)) this._range = sel.getRangeAt(0).cloneRange();
        else if (this.root.contains(document.activeElement)) return;
        this._syncTableBar();
        this._markActive();
      }),
      // O reset do formulario volta o textarea ao valor de origem; a area vai junto.
      // Adiado porque o evento chega antes de o navegador trocar o valor.
      on(field.form ?? field, 'reset', () => setTimeout(() => this.setValue(field.value))),
      // Campo obrigatorio vazio: o textarea escondido nao recebe foco, e o
      // navegador barrava o envio sem mostrar onde. O foco vai para a area.
      on(field, 'invalid', () => this.area.focus()),
    );

    this._paint();
    this.area.classList.toggle('is-empty', !this.getValue());
    field._tucano = this;
    this.area._tucano = this;
  }

  /*
   * Pinta os blocos de codigo. A coloracao e so exibicao: a peneira dissolve
   * <span>, entao nada disso chega ao valor salvo — e nem deveria, porque cor
   * e decisao de quem exibe, nao conteudo.
   */
  _paint() {
    this._paintVariables();
    for (const code of this.area.querySelectorAll('pre > code')) {
      /*
       * Enter e colar dentro do bloco escrevem <br>, e textContent nao ve <br>:
       * a repintura seguinte juntava as linhas numa so. A quebra vira "\n"
       * antes, que e como o <pre> guarda linha.
       */
      for (const br of code.querySelectorAll('br')) br.replaceWith('\n');
      const painted = highlight(code.textContent);
      if (code.innerHTML === painted) continue;
      const where = offsetInBlock(code);
      code.innerHTML = painted;
      restoreOffset(code, where);
    }
  }

  /* O textarea escondido e a fonte da verdade para o formulario. */
  _sync() {
    const plain = this.getValue();
    this.area.classList.toggle('is-empty', !plain);
    if (this.field.value === plain) return;
    this.field.value = plain;
    this.field.dispatchEvent(new Event('input', { bubbles: true }));
    this.field.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /* Adiado: repintar a cada tecla brigaria com a digitacao. */
  _schedulePaint() {
    clearTimeout(this._brush);
    this._brush = setTimeout(() => this._paint(), 180);
  }

  _paste(e) {
    e.preventDefault();
    // getData devolve '' quando o formato nao existe, nunca null: o texto puro basta.
    this._insertPlain(e.clipboardData.getData('text/plain'));
  }

  /*
   * Texto puro no cursor. Dentro do bloco de codigo cada quebra vai por
   * insertLineBreak: o WebKit (Safari) transforma o "\n" do insertText num
   * <pre> novo, e o trecho colado virava uma pilha de blocos de uma linha.
   * Chromium e Firefox escrevem o mesmo <br> pelos dois caminhos.
   */
  _insertPlain(text) {
    if (!this._currentNode()?.closest('pre')) {
      document.execCommand('insertText', false, text);
      return;
    }
    text.split(/\r\n?|\n/).forEach((line, i) => {
      if (i) document.execCommand('insertLineBreak');
      if (line) document.execCommand('insertText', false, line);
    });
  }

  _onKey(e) {
    /*
     * Lista de variaveis aberta pela digitacao: o foco esta no texto, entao as
     * teclas de menu passam por aqui. A seta leva o foco ao primeiro item, de
     * onde o proprio menu assume; o Escape fecha e deixa a pessoa digitando.
     */
    if (this._typedVariable && this._varMenu?.isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        this._varMenu.keepFocus = false;
        this._varMenu._move(e.key === 'ArrowUp' ? -1 : 0, true);
        return;
      }
      if (e.key === 'Escape') { e.preventDefault(); this._closeVariables(); return; }
    }

    /*
     * Enter dentro do bloco de codigo quebra a linha no proprio bloco. Chromium
     * e Firefox ja fazem isso sozinhos; o WebKit (Safari) abria um <pre> novo a
     * cada Enter.
     */
    if (e.key === 'Enter' && !e.isComposing && !e.metaKey && !e.ctrlKey && this._currentNode()?.closest('pre')) {
      e.preventDefault();
      document.execCommand('insertLineBreak');
      return;
    }
    const cell = e.key === 'Tab' && this._currentCell();
    if (cell) {
      /*
       * A celula vem de _currentCell, e nao do pai do no da selecao: numa
       * celula vazia, e logo depois de o Tab pular para outra, a selecao aponta
       * a propria celula, cujo pai e a linha — e o segundo Tab saia do editor.
       */
      let target = nextCell(cell, e.shiftKey);
      // Shift+Tab na primeira celula sai do editor, como em qualquer campo.
      if (!target && e.shiftKey) return;
      e.preventDefault();
      // Tab na ultima celula acrescenta uma linha: e como se preenche tabela
      // sem tirar as maos do teclado.
      if (!target) {
        target = insertRow(cell, 1);
        this._sync();
      }
      focusCell(target);
      return;
    }
    const t = e.key.toLowerCase();
    if ((e.metaKey || e.ctrlKey) && SHORTCUTS[t]) {
      e.preventDefault();
      this.apply(SHORTCUTS[t]);
    }
  }

  /*
   * Foco sem arrastar a pagina.
   *
   * focus() traz o elemento a vista, e num editor ja visivel isso vira salto:
   * aplicar um titulo na primeira linha jogava a pagina para cima.
   *
   * Aqui para. Devolver a rolagem depois, como eu fazia, criava uma segunda
   * correcao competindo com o ajuste que o proprio navegador faz — o resultado
   * era a pagina ir e voltar, que e pior que o salto original. Quando um bloco
   * acima cresce, quem mantem a viewport parada e o scroll anchoring, e ele so
   * funciona se ninguem mexer na rolagem por fora.
   */
  _focus() {
    // Pelo mouse a selecao nunca sai da area; pelo teclado ela ficou para tras
    // quando o foco foi para o botao. Devolve a ultima que estava aqui dentro.
    // Olhada antes do focus(): no WebKit (Safari) focar a area poe o cursor no
    // comeco dela, a selecao parecia estar dentro, e o negrito caia num cursor
    // vazio em vez de no texto escolhido.
    const outside = !this.area.contains(window.getSelection()?.anchorNode);
    this.area.focus({ preventScroll: true });
    if (this._range && outside) select(this._range);
  }

  /* Elemento em volta do cursor, dentro da area. */
  _currentNode() {
    const sel = window.getSelection();
    if (!sel?.anchorNode || !this.area.contains(sel.anchorNode)) return null;
    return sel.anchorNode.nodeType === Node.ELEMENT_NODE ? sel.anchorNode : sel.anchorNode.parentElement;
  }

  /* Botao aceso quando o cursor esta dentro daquela formatacao. */
  _markActive() {
    // Fora da area nada acende: antes, selecionar negrito em qualquer lugar da
    // pagina acendia o negrito de todos os editores.
    const node = this._currentNode();
    for (const b of this.toolbar.querySelectorAll('[data-action]')) {
      const state = STATES[b.dataset.action];
      if (!state) continue;
      let active = false;
      try { active = !!node && (!!node.closest(state) || document.queryCommandState(state)); } catch { /* sem selecao */ }
      b.setAttribute('aria-pressed', active);
      b.classList.toggle('is-active', active);
    }
  }

  /** Celula onde o cursor esta, ou nada. */
  _currentCell() {
    const cell = this._currentNode()?.closest('th, td');
    /*
     * A selecao sobrevive ao no que ela apontava: remover uma linha deixa o
     * cursor num elemento que ja saiu do documento, e a operacao seguinte
     * receberia uma celula sem pai. Confirmar que ela ainda esta na area custa
     * uma checagem e evita quebrar no segundo clique.
     */
    return cell && this.area.contains(cell) ? cell : null;
  }

  _syncTableBar() {
    this.tableBar.hidden = !this._currentCell();
  }

  /** Operacao de tabela na celula onde o cursor esta. */
  inTable(name) {
    const cell = this._currentCell();
    if (!cell) return this;
    const destination = TABLE[name]?.(cell);
    wrapTables(this.area);
    this._focus();
    focusCell(destination);
    this._sync();
    this._syncTableBar();
    return this;
  }

  apply(name) {
    this._focus();
    COMMANDS[name]?.(this);
    this._sync();
    this._markActive();
    this._paint();
    return this;
  }

  /*
   * Endereco do link pelo nosso modal, e nao pelo prompt do navegador.
   *
   * O prompt e uma caixa do sistema: aparece fora do desenho da pagina, ignora
   * o tema e nao da para estilizar. Como o modal rouba o foco, a selecao
   * precisa ser guardada antes e devolvida depois — sem isso o createLink nao
   * teria em que trecho aplicar.
   */
  _askForLink() {
    const sel = window.getSelection();
    const mark = sel?.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
    const existing = this._currentNode()?.closest('a');

    const field = el('input', {
      type: 'url',
      class: 'tuc-input',
      placeholder: 'https://',
      value: existing?.getAttribute('href') ?? 'https://',
    });

    /*
     * O que fazer fica anotado no clique e so acontece quando o dialogo fecha.
     *
     * Enquanto ele esta aberto o foco fica preso na top layer, e devolver a
     * selecao ao editor por baixo nao funciona: o createLink nao encontrava
     * trecho nenhum e o link simplesmente nao aparecia.
     */
    let decided = null;
    const actions = [{ text: T.cancel, variant: 'outline' }];
    if (existing) {
      actions.push({ text: T.removeLink, variant: 'ghost', onClick: () => { decided = 'remove'; } });
    }
    actions.push({
      text: existing ? T.save : T.insert,
      variant: 'primary',
      onClick: () => { decided = field.value.trim(); },
    });

    const dialog = new Modal({
      title: existing ? T.editLink : T.insertLink,
      size: 'sm',
      actions,
      onClose: () => {
        if (!decided) return;
        this.area.focus({ preventScroll: true });
        /*
         * Link que ja existe e selecionado inteiro, para remover e para trocar
         * o endereco. Com o cursor so dentro dele o unlink nao faz nada, e o
         * createLink escrevia o endereco como texto novo no meio, partindo o
         * link em dois. O proprio <a>, e nao o conteudo dele: com o conteudo
         * selecionado, o createLink do Firefox punha o link novo dentro do
         * antigo, e o valor salvo saia com um <a> vazio na frente.
         */
        let range = mark;
        if (existing) {
          range = document.createRange();
          range.selectNode(existing);
        }
        if (range) select(range);
        if (decided === 'remove') {
          document.execCommand('unlink');
        } else {
          // Sem esquema e endereco da web: "exemplo.com" virava um link relativo
          // na tela, que a peneira descartava calada ao salvar.
          const url = safeUrl(/^([a-z][\w+.-]*:|[#/])/i.test(decided) ? decided : `https://${decided}`);
          if (url && url !== 'https://') document.execCommand('createLink', false, url);
        }
        this._sync();
        this._markActive();
      },
    });
    dialog.content(field);
    dialog.open();
    // Enter no campo confirma, que e o que se espera de uma caixa com um campo.
    field.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      dialog.panel.querySelector('.tuc-btn.is-primary')?.click();
    });
    field.focus();
    field.select();
    return this;
  }

  /* ---------------------------------------------------------------- *
   * Variaveis                                                          *
   * ---------------------------------------------------------------- */

  /**
   * Abre a lista de variaveis. Pelo botao da barra ela nasce no botao, com o
   * primeiro item ja destacado; digitando `{`, nasce no cursor e deixa o foco
   * no texto, filtrando pelo que vier depois da chave.
   */
  openVariables(query = '') {
    const variables = this.opts.variables;
    if (!variables?.length) return this;
    const q = fold(query);
    const items = variables
      .filter((v) => !q || fold(v.name).includes(q) || fold(v.label || '').includes(q))
      .map((v) => ({
        text: v.label || v.name,
        // O token fica a direita, como um atalho: quem ja o conhece o reconhece.
        shortcut: `{{${v.name}}}`,
        onClick: () => this.insertVariable(v.name),
      }));
    // Digitou algo que nao casa com nada: a lista sai da frente, em vez de
    // ficar vazia por cima do texto.
    if (!items.length) return this._closeVariables();

    this._varMenu ??= new VariableMenu(this._varButton ?? this.area, { placement: 'bottom-start' });
    this._varMenu.keepFocus = Boolean(this._typedVariable);
    // Pela barra, a lista segue a regra do menu suspenso: clique nao acende
    // nada, Enter no botao acende o primeiro.
    this._varMenu._pointerOpen = !this._typedVariable && Boolean(this._byPointer);
    this._varMenu._renderItems(items);
    if (!this._typedVariable) this._varMenu.open();
    else if (!this._varMenu.isOpen) {
      const r = caretRect(this.area);
      this._varMenu.openAt(r.left, r.bottom);
    }
    return this;
  }

  /** Escreve `{{nome}}` onde esta o cursor, no lugar do `{` que abriu a lista. */
  insertVariable(name) {
    const typed = this._typedVariable;
    this._closeVariables();
    this._focus();
    /*
     * Cursor no fim quando ainda nao houve nenhum: da para abrir a lista pela
     * barra sem nunca ter clicado no texto, e ai o insertText nao tinha onde
     * escrever — o botao parecia nao fazer nada.
     */
    if (!this.area.contains(window.getSelection()?.focusNode)) {
      const end = document.createRange();
      end.selectNodeContents(this.area);
      end.collapse(false);
      select(end);
    }
    if (typed?.node.isConnected && typed.node.textContent.length >= typed.start + typed.length) {
      const r = document.createRange();
      r.setStart(typed.node, typed.start);
      r.setEnd(typed.node, typed.start + typed.length);
      select(r);
    }
    // insertText, e nao escrever no DOM: assim o desfazer do navegador inclui a
    // variavel, como inclui qualquer outra coisa digitada.
    document.execCommand('insertText', false, `{{${name}}}`);
    this._sync();
    return this;
  }

  /**
   * Variaveis escritas no texto que nao estao na lista — o `{{nomee}}` de quem
   * digitou errado. Vazio quando nao ha lista declarada: sem ela nao ha o que
   * conferir.
   */
  unknownVariables() {
    const known = new Set((this.opts.variables ?? []).map((v) => v.name));
    if (!known.size) return [];
    // Bloco de codigo fora da conta: um exemplo de template escrito ali nao e
    // erro de digitacao, e acusa-lo transformaria o aviso em ruido.
    const text = this.getValue().replace(/<pre[\s\S]*?<\/pre>/g, '');
    const used = [...text.matchAll(VARIABLE_RE)].map((m) => m[1]);
    return [...new Set(used)].filter((name) => !known.has(name));
  }

  /*
   * Marca onde estao as variaveis do texto. A que nao esta na lista ganha o tom
   * de erro: o aviso aparece onde o erro esta, e nao so numa linha embaixo.
   */
  _paintVariables() {
    if (!this.opts.variables?.length || !window.CSS?.highlights) return;
    const names = new Set(this.opts.variables.map((v) => v.name));
    const known = [];
    const unknown = [];
    const walker = document.createTreeWalker(this.area, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      // Bloco de codigo fica de fora, como no aviso: ali se escreve codigo.
      if (node.parentElement?.closest('pre')) continue;
      for (const match of node.textContent.matchAll(VARIABLE_RE)) {
        const range = document.createRange();
        range.setStart(node, match.index);
        range.setEnd(node, match.index + match[0].length);
        (names.has(match[1]) ? known : unknown).push(range);
      }
    }
    variableRanges.set(this, { known, unknown });
    paintVariableHighlights();
  }

  /* O `{` digitado abre a lista, filtrada pelo que vem depois dele. */
  _variableTyping() {
    if (!this.opts.variables?.length) return;
    /*
     * Dentro de um bloco de codigo, nao. Ali se escreve codigo — inclusive o
     * proprio `{{ nome }}` de um template, como exemplo —, e uma lista pulando
     * na frente a cada chave atrapalha em vez de ajudar.
     */
    if (this._currentNode()?.closest('pre')) return this._closeVariables();
    const sel = window.getSelection();
    const node = sel?.focusNode;
    if (!node || node.nodeType !== 3 || !this.area.contains(node)) return this._closeVariables();
    const before = node.textContent.slice(0, sel.focusOffset);
    const match = before.match(/\{([\p{L}\p{N}_.-]*)$/u);
    if (!match) return this._closeVariables();
    this._typedVariable = { node, start: sel.focusOffset - match[0].length, length: match[0].length };
    return this.openVariables(match[1]);
  }

  _closeVariables() {
    this._typedVariable = null;
    this._varMenu?.close();
    return this;
  }

  getValue() {
    const html = sanitize(this.area.innerHTML);
    // Editor vazio vale vazio: com o paragrafo em branco, `required` aceitava o
    // campo e o servidor recebia marcacao sem texto.
    return html === '<p><br></p>' ? '' : html;
  }

  setValue(html) {
    this.area.innerHTML = sanitize(html) || '<p><br></p>';
    wrapTables(this.area);
    this._paint();
    this._sync();
    return this;
  }

  destroy() {
    this._varMenu?.destroy();
    this._varMenu = null;
    variableRanges.delete(this);
    paintVariableHighlights();
    clearTimeout(this._brush);
    this._cleanups.forEach((fn) => fn());
    this.field.hidden = false;
    this.field.classList.remove('tuc-editor__value');
    this.root.replaceWith(this.field);
    delete this.field._tucano;
  }
}

export function autoInit(scope = document) {
  const out = [];
  for (const node of scope.querySelectorAll('[data-tuc-editor]:not([data-tuc-ready])')) {
    node.setAttribute('data-tuc-ready', '');
    out.push(new Editor(node, {
      minHeight: node.dataset.minHeight || undefined,
      placeholder: node.dataset.placeholder || undefined,
    }));
  }
  return out;
}
