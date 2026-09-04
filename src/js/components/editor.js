import { el, icon, on } from '../core/dom.js';
import { sanitize, textOnly } from '../core/sanitize.js';
import { Modal } from './modal.js';
import { highlight } from '../core/highlight.js';

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
};

const ICONS = {
  bold:    'M6 4h6a4 4 0 010 8H6zM6 12h7a4 4 0 010 8H6z',
  italic:    'M19 4h-9M14 20H5M15 4L9 20',
  underline: 'M6 4v6a6 6 0 0012 0V4M4 21h16',
  title:     'M6 4v16M18 4v16M6 12h12',
  subheading:  'M6 6v12M16 6v12M6 12h10',
  list:      'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  numbered:   'M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2M6 15a1.5 1.5 0 10-2 1.4L6 19H4',
  quote:    'M6 17h3l2-4V7H5v6h3zM14 17h3l2-4V7h-6v6h3z',
  link:       'M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1',
  clear:     'M4 7h16M10 11v6M14 11v6M5 7l1 13a2 2 0 002 2h8a2 2 0 002-2l1-13',
  table:     'M3 5h18v14H3zM3 10h18M3 15h18M9 5v14M15 5v14',
  left:   'M3 6h18M3 12h11M3 18h15',
  center:     'M3 6h18M6 12h12M4 18h16',
  right:    'M3 6h18M10 12h11M6 18h15',
  justify: 'M3 6h18M3 12h18M3 18h18',
  code:     'M16 18l6-6-6-6M8 6l-6 6 6 6',
};

const LABELS = {
  bold: 'Negrito', italic: 'Itálico', underline: 'Sublinhado',
  title: 'Título', subheading: 'Subtítulo', list: 'Lista',
  numbered: 'Lista numbered', quote: 'Citação', link: 'Link',
  clear: 'Limpar formatação', table: 'Inserir tabela',
  left: 'Alinhar à esquerda', center: 'Centralizar',
  right: 'Alinhar à direita', justify: 'Justificar',
  code: 'Código',
};

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
};

/* Estado que o proprio navegador informa. */
const STATES = {
  bold: 'bold', italic: 'italic', underline: 'underline',
  list: 'insertUnorderedList', numbered: 'insertOrderedList',
  left: 'justifyLeft', center: 'justifyCenter',
  right: 'justifyRight', justify: 'justifyFull',
};

/*
 * Estado que so o DOM sabe.
 *
 * Nao existe comando que responda "o cursor esta dentro de uma citacao?" —
 * queryCommandState cobre negrito, lista e alinhamento, e para ai. Para o resto
 * a pergunta e feita ao elemento em volta do cursor. Sem isto metade da barra
 * ficava apagada mesmo com o cursor dentro do bloco que ela aplica, e nao havia
 * como saber que clicar de novo desfaz.
 */
const ANCESTORS = {
  title: 'h2',
  subheading: 'h3',
  quote: 'blockquote',
  code: 'pre, code',
  link: 'a',
  table: 'table',
};

const SHORTCUTS = { b: 'bold', i: 'italic', u: 'underline', k: 'link' };

/*
 * O execCommand nao tem comando de codigo, entao a marcacao e montada aqui —
 * mas entregue por insertHTML, e nao inserida direto no DOM. E o que mantem a
 * operacao dentro do desfazer nativo: um Ctrl+Z depois de aplicar codigo
 * precisa voltar como qualquer outra formatacao, senao o editor mente sobre o
 * proprio historico.
 */
const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };

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
    sel.removeAllRanges();
    sel.addRange(r);
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
        const par = document.createElement('p');
        if (row) par.textContent = row;
        else par.append(document.createElement('br'));
        block.append(par);
      }
      const first = block.firstChild;
      target.replaceWith(block);
      if (first) {
        const pos = document.createRange();
        pos.selectNodeContents(first);
        pos.collapse(true);
        sel.removeAllRanges();
        sel.addRange(pos);
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
   * todas as rows, como se o codigo tivesse sido espacado de proposito.
   */
  const escaped = text.replace(/\n{2,}/g, '\n').replace(/[&<>]/g, (c) => ESCAPES[c]);

  /*
   * Selecao que atravessa rows vira bloco, e nao codigo no meio da frase.
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
 * A tabela e montada aqui, e nao pelo execCommand — que nao insere tabela em
 * navegador nenhum. Vai com cabecalho porque tabela de sistema quase sempre
 * tem um, e sem ele a primeira linha de dados acaba servindo de titulo.
 */
function buildTable(doc, rows, cols) {
  const cel = (tag) => { const c = doc.createElement(tag); c.append(doc.createElement('br')); return c; };
  const table = doc.createElement('table');
  const thead = doc.createElement('thead');
  const trCab = doc.createElement('tr');
  for (let c = 0; c < cols; c++) trCab.append(cel('th'));
  thead.append(trCab);
  const tbody = doc.createElement('tbody');
  for (let l = 0; l < rows - 1; l++) {
    const tr = doc.createElement('tr');
    for (let c = 0; c < cols; c++) tr.append(cel('td'));
    tbody.append(tr);
  }
  table.append(thead, tbody);
  return table;
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
 * O verbo vem primeiro porque sem ele o rotulo e ambiguo: "Coluna a esquerda"
 * tanto pode inserir quanto alinhar, e a barra tem as duas coisas.
 */
const TABLE_LABELS = {
  rowAbove: 'Inserir linha acima', rowBelow: 'Inserir linha abaixo',
  colBefore: 'Inserir coluna à esquerda', colAfter: 'Inserir coluna à direita',
  deleteRow: 'Excluir linha', deleteColumn: 'Excluir coluna',
  deleteTable: 'Excluir tabela',
};

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
  const nova = document.createElement('tr');
  for (let i = 0; i < row.children.length; i++) nova.append(emptyCell('td'));
  // Linha acima do cabecalho vira corpo, nao outro cabecalho.
  const body = cell.closest('table').querySelector('tbody');
  if (row.parentElement.tagName === 'THEAD' && body) {
    after ? body.prepend(nova) : body.prepend(nova);
  } else {
    row.parentElement.insertBefore(nova, after ? row.nextSibling : row);
  }
  return nova.firstElementChild;
}

function insertColumn(cell, after) {
  const i = [...cell.parentElement.children].indexOf(cell);
  for (const row of cell.closest('table').querySelectorAll('tr')) {
    const model = row.children[i];
    const nova = emptyCell(model?.tagName === 'TH' ? 'th' : 'td');
    row.insertBefore(nova, after ? model?.nextSibling : model);
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
  // A linha e guardada antes do laco: ele apaga a coluna em todas as rows,
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
  const s = window.getSelection();
  s.removeAllRanges();
  s.addRange(r);
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
  let no;
  while ((no = step.nextNode())) {
    if (counted + no.length >= howMany) {
      const r = document.createRange();
      r.setStart(no, howMany - counted);
      r.collapse(true);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(r);
      return;
    }
    counted += no.length;
  }
}

function withoutUndefined(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) if (v !== undefined) out[k] = v;
  return out;
}

export class Editor {
  constructor(target, options = {}) {
    this.field = typeof target === 'string' ? document.querySelector(target) : target;
    if (!this.field) throw new Error('[Editor] elemento não encontrado');
    this.opts = { ...DEFAULTS, ...withoutUndefined(options) };
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

    // Onde a barra muda de assunto: marcacao de texto, alinhamento, blocos.
    const GROUPS = new Set(['left', 'quote']);

    this.toolbar = el('div', { class: 'tuc-editor__toolbar', role: 'toolbar', 'aria-label': 'Formatação' },
      this.opts.toolbar.flatMap((name) => {
        const b = el('button', {
          type: 'button',
          class: 'tuc-btn is-ghost is-icon is-sm',
          'aria-label': LABELS[name] ?? name,
          'data-tuc-tip': LABELS[name] ?? name,
          'aria-pressed': 'false',
          // mousedown e nao click: click viria depois do blur, e a selecao
          // dentro da area ja teria sido perdida.
          onmousedown: (e) => { e.preventDefault(); this.apply(name); },
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
      'aria-label': 'Tabela',
      hidden: true,
    }, Object.keys(TABLE).map((name) => el('button', {
      type: 'button',
      class: `tuc-btn is-ghost is-icon is-sm${name.startsWith('remove') ? ' is-remove' : ''}`,
      'aria-label': TABLE_LABELS[name],
      'data-tuc-tip': TABLE_LABELS[name],
      onmousedown: (e) => { e.preventDefault(); this.inTable(name); },
    }, [icon(TABLE_ICONS[name], 15)])));

    this.root = el('div', { class: 'tuc-editor' }, [this.toolbar, this.tableBar, this.area]);
    field.parentNode.insertBefore(this.root, field);
    this.root.append(field);
    field.hidden = true;
    field.classList.add('tuc-editor__value');

    this._cleanups.push(
      on(this.area, 'input', () => { this._sync(); this._schedulePaint(); }),
      on(this.area, 'blur', () => this._sync()),
      on(this.area, 'paste', (e) => this._paste(e)),
      on(this.area, 'keydown', (e) => this._onKey(e)),
      on(this.area, 'keyup', () => this._markActive()),
      on(this.area, 'mouseup', () => this._markActive()),
      // selectionchange e global: e o unico evento que pega o cursor mudando
      // de lugar por qualquer caminho, inclusive clique fora e volta.
      on(document, 'selectionchange', () => { this._syncTableBar(); this._markActive(); }),
    );

    this._paint();
    field._tucano = this;
    this.area._tucano = this;
  }

  /*
   * Pinta os blocos de codigo. A coloracao e so exibicao: a peneira dissolve
   * <span>, entao nada disso chega ao valor salvo — e nem deveria, porque cor
   * e decisao de quem exibe, nao conteudo.
   */
  _paint() {
    for (const code of this.area.querySelectorAll('pre > code')) {
      const raw = code.textContent;
      const painted = highlight(raw);
      if (code.innerHTML === painted) continue;
      const where = offsetInBlock(code);
      code.innerHTML = painted;
      restoreOffset(code, where);
    }
  }

  /* O textarea escondido e a fonte da verdade para o formulario. */
  _sync() {
    const plain = sanitize(this.area.innerHTML);
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
    const text = e.clipboardData?.getData('text/plain')
      ?? textOnly(e.clipboardData?.getData('text/html'));
    document.execCommand('insertText', false, text);
  }

  _onKey(e) {
    if (e.key === 'Tab') {
      const cell = window.getSelection()?.anchorNode?.parentElement?.closest?.('th, td');
      if (cell) {
        e.preventDefault();
        let target = nextCell(cell, e.shiftKey);
        // Tab na ultima celula acrescenta uma linha: e como se preenche tabela
        // sem tirar as maos do teclado.
        if (!target && !e.shiftKey) {
          const body = cell.closest('table').querySelector('tbody') || cell.closest('table');
          const model = body.querySelector('tr') || cell.parentElement;
          const nova = document.createElement('tr');
          for (let i = 0; i < model.children.length; i++) {
            const td = document.createElement('td');
            td.append(document.createElement('br'));
            nova.append(td);
          }
          body.append(nova);
          target = nova.firstElementChild;
          this._sync();
        }
        if (target) {
          const r = document.createRange();
          r.selectNodeContents(target);
          r.collapse(true);
          const s = window.getSelection();
          s.removeAllRanges();
          s.addRange(r);
        }
        return;
      }
    }
    const t = e.key.toLowerCase();
    if ((e.metaKey || e.ctrlKey) && SHORTCUTS[t]) {
      e.preventDefault();
      this.apply(SHORTCUTS[t]);
    }
  }

  /* Botao aceso quando o cursor esta dentro daquela formatacao. */
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
    this.area.focus({ preventScroll: true });
  }

  /* Elemento em volta do cursor, dentro da area. */
  _currentNode() {
    const sel = window.getSelection();
    if (!sel?.anchorNode || !this.area.contains(sel.anchorNode)) return null;
    return sel.anchorNode.nodeType === Node.ELEMENT_NODE ? sel.anchorNode : sel.anchorNode.parentElement;
  }

  _markActive() {
    const no = this._currentNode();
    for (const b of this.toolbar.querySelectorAll('[data-action]')) {
      const action = b.dataset.action;
      const cmd = STATES[action];
      const selector = ANCESTORS[action];
      if (!cmd && !selector) continue;

      let active = false;
      if (cmd) {
        try { active = document.queryCommandState(cmd); } catch { /* sem selecao */ }
      } else if (no) {
        active = !!no.closest?.(selector);
      }
      b.setAttribute('aria-pressed', String(active));
      b.classList.toggle('is-active', active);
    }
  }

  /** Celula onde o cursor esta, ou nada. */
  _currentCell() {
    const sel = window.getSelection();
    if (!sel?.anchorNode || !this.area.contains(sel.anchorNode)) return null;
    const no = sel.anchorNode.nodeType === Node.ELEMENT_NODE ? sel.anchorNode : sel.anchorNode.parentElement;
    const cell = no?.closest?.('th, td') ?? null;
    /*
     * A selecao sobrevive ao no que ela apontava: remover uma linha deixa o
     * cursor num elemento que ja saiu do documento, e a operacao seguinte
     * receberia uma celula sem pai. Confirmar que ela ainda esta na area custa
     * uma checagem e evita quebrar no segundo clique.
     */
    return cell && this.area.contains(cell) ? cell : null;
  }

  _syncTableBar() {
    const inside = !!this._currentCell();
    if (this.tableBar.hidden !== !inside) this.tableBar.hidden = !inside;
  }

  /** Operacao de tabela na celula onde o cursor esta. */
  inTable(name) {
    const cell = this._currentCell();
    if (!cell) return this;
    const destination = TABLE[name]?.(cell);
    this._focus();
    focusCell(destination);
    this._sync();
    this._syncTableBar();
    return this;
  }

  apply(name) {
    this._focus();
    if (name === 'table') {
      const { rows, cols } = this.opts.table;
      const table = buildTable(document, rows, cols);
      const sel = window.getSelection();

      /*
       * Com o cursor dentro de uma celula, a nova tabela nasce depois da
       * atual, e nao dentro dela. Tabela aninhada quase nunca e o que se
       * queria, e desfazer isso pelo editor e trabalhoso — o clique certo e
       * dificil de acertar entre duas molduras encaixadas.
       */
      const inside = this._currentCell()?.closest('table');
      if (inside) {
        inside.after(table);
        const p = document.createElement('p');
        p.append(document.createElement('br'));
        table.after(p);
        focusCell(table.querySelector('th'));
        this._sync();
        return this;
      }

      if (sel?.rangeCount) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(table);
        // Um paragrafo depois da tabela: sem ele nao ha onde continuar
        // escrevendo quando ela e a ultima coisa do texto.
        const p = document.createElement('p');
        p.append(document.createElement('br'));
        table.after(p);
        const first = table.querySelector('th');
        if (first) {
          const r = document.createRange();
          r.selectNodeContents(first);
          r.collapse(true);
          sel.removeAllRanges();
          sel.addRange(r);
        }
      }
      this._sync();
      return this;
    }
    if (name === 'link') {
      this._askForLink();
      return this;
    }
    COMMANDS[name]?.();
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

    const restoreSelection = () => {
      this.area.focus({ preventScroll: true });
      if (!mark) return;
      const s = window.getSelection();
      s.removeAllRanges();
      s.addRange(mark);
    };

    /*
     * O que fazer fica anotado no clique e so acontece quando o dialogo fecha.
     *
     * Enquanto ele esta aberto o foco fica preso na top layer, e devolver a
     * selecao ao editor por baixo nao funciona: o createLink nao encontrava
     * trecho nenhum e o link simplesmente nao aparecia.
     */
    let decided = null;
    const actions = [{ text: 'Cancelar', variant: 'outline' }];
    if (existing) {
      actions.push({ text: 'Remover', variant: 'ghost', onClick: () => { decided = 'remove'; } });
    }
    actions.push({
      text: existing ? 'Salvar' : 'Inserir',
      variant: 'primary',
      onClick: () => { decided = field.value.trim(); },
    });

    const dialog = new Modal({
      title: existing ? 'Editar link' : 'Inserir link',
      size: 'sm',
      actions,
      onClose: () => {
        if (!decided) return;
        {
          if (decided === 'remove') {
            /*
             * O unlink exige uma selecao que abranja o link inteiro: com o
             * cursor apenas dentro dele o comando nao faz nada. Por isso a
             * ancora e selecionada antes, em vez de devolver a marca guardada.
             */
            this.area.focus({ preventScroll: true });
            const r = document.createRange();
            r.selectNodeContents(existing);
            const sel2 = window.getSelection();
            sel2.removeAllRanges();
            sel2.addRange(r);
            document.execCommand('unlink');
          } else {
            restoreSelection();
            if (decided !== 'https://') document.execCommand('createLink', false, decided);
          }
          this._sync();
          this._markActive();
        }
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

  getValue() { return sanitize(this.area.innerHTML); }
  setValue(html) {
    this.area.innerHTML = sanitize(html) || '<p><br></p>';
    this._paint();
    this._sync();
    return this;
  }

  destroy() {
    this._cleanups.forEach((fn) => fn());
    this.field.hidden = false;
    this.root.parentNode?.insertBefore(this.field, this.root);
    this.root.remove();
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
