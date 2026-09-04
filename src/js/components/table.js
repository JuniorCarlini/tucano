import { el, icon, nextId, on } from '../core/dom.js';

/*
 * Tabela.
 *
 * A maior parte e CSS: quem renderiza a tabela e o servidor, e o <table> que
 * vem do template ja e a fonte da verdade. O JavaScript entra so onde o HTML
 * nao alcanca — ordenar pela coluna e marcar linhas em massa.
 *
 * Ordenacao acontece no cliente, sobre as linhas que estao na pagina. Isso e o
 * certo para uma lista ja paginada: reordenar o conjunto inteiro e trabalho do
 * banco, e para isso existe o evento `tuc:sort`, que o servidor pode ouvir via
 * HTMX. Ordenar no cliente o que veio paginado seria mentira — por isso, quando
 * a tabela declara `data-sort-url`, o clique nao reordena nada: so navega.
 */

const DEFAULTS = {
  sortable: true,
  selectable: false,   // coluna de selecao em massa
  selectName: 'selected',
  sortUrl: null,       // quando existe, ordenar e responsabilidade do servidor
  onSort: null,
  onSelect: null,
};

const SETAS = 'M7 15l5 5 5-5M7 9l5-5 5 5';

/* Comparadores por tipo declarado no cabecalho. */
const COMPARE = {
  number: (a, b) => parseFloat(a.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.') || 0)
                  - parseFloat(b.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.') || 0),
  date: (a, b) => new Date(a).getTime() - new Date(b).getTime(),
  text: (a, b) => a.localeCompare(b, 'pt-BR', { numeric: true, sensitivity: 'base' }),
};

function withoutUndefined(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) if (v !== undefined) out[k] = v;
  return out;
}

export class Table {
  constructor(node, options = {}) {
    this.node = typeof node === 'string' ? document.querySelector(node) : node;
    if (!this.node) throw new Error('[Table] elemento alvo nao encontrado');
    if (this.node.tagName !== 'TABLE') throw new Error('[Table] o alvo precisa ser uma <table>');
    this.opts = { ...DEFAULTS, ...withoutUndefined(options) };
    this.id = this.node.id || nextId('table');
    this._cleanups = [];
    this._build();
  }

  get rows() {
    return [...(this.node.tBodies[0]?.rows ?? [])];
  }

  _build() {
    this.node.classList.add('tuc-table');
    /*
     * A rolagem horizontal fica num envolucro, e nao na propria tabela: uma
     * <table> com overflow perde o comportamento de tabela e as colunas param
     * de se alinhar. No celular esta e a diferenca entre rolar de lado e a
     * pagina inteira estourar para a direita.
     */
    if (!this.node.parentElement?.classList.contains('tuc-table-wrap')) {
      const wrap = el('div', { class: 'tuc-table-wrap' });
      this.node.replaceWith(wrap);
      wrap.append(this.node);
    }
    this.wrap = this.node.parentElement;
    this.node._tucano = this;

    if (this.opts.selectable) this._buildSelection();
    if (this.opts.sortable) this._buildSort();
  }

  /* ---------------------------------------------------------------- *
   * Ordenacao                                                        *
   * ---------------------------------------------------------------- */

  _buildSort() {
    const head = this.node.tHead?.rows[0];
    if (!head) return;
    this.sortable = [];

    [...head.cells].forEach((th, i) => {
      const type = th.dataset.sort;
      if (!type || type === 'none') return;
      th.classList.add('tuc-table__sortable');
      th.setAttribute('aria-sort', 'none');
      // O rotulo vira botao para chegar pelo Tab e responder a Enter e Espaco;
      // <th> sozinho nao e focavel, e o clique ficaria so para quem usa mouse.
      const label = el('button', { type: 'button', class: 'tuc-table__sortbtn' }, [
        el('span', { text: th.textContent.trim() }),
        el('span', { class: 'tuc-table__sorticon', 'aria-hidden': 'true' }, [icon(SETAS, 13)]),
      ]);
      th.textContent = '';
      th.append(label);
      this.sortable.push({ th, index: i, type });
      this._cleanups.push(on(label, 'click', () => this._onSortClick(th, i, type)));
    });
  }

  _onSortClick(th, index, type) {
    const atual = th.getAttribute('aria-sort');
    const dir = atual === 'ascending' ? 'descending' : 'ascending';
    for (const s of this.sortable) s.th.setAttribute('aria-sort', 'none');
    th.setAttribute('aria-sort', dir);

    const detalhe = { column: index, field: th.dataset.field || null, direction: dir === 'ascending' ? 'asc' : 'desc' };
    this.node.dispatchEvent(new CustomEvent('tuc:sort', { bubbles: true, detail: detalhe }));
    this.opts.onSort?.(detalhe, this);

    // Servidor manda: nao reordenamos a pagina atual por cima do que ele fara.
    if (this.opts.sortUrl) {
      const url = new URL(this.opts.sortUrl, location.href);
      url.searchParams.set('sort', detalhe.field ?? String(index));
      url.searchParams.set('dir', detalhe.direction);
      location.href = url.toString();
      return;
    }
    this.sort(index, detalhe.direction, type);
  }

  /** Ordena as linhas visíveis. `type`: text | number | date. */
  sort(index, direction = 'asc', type = 'text') {
    const body = this.node.tBodies[0];
    if (!body) return this;
    const cmp = COMPARE[type] ?? COMPARE.text;
    const chave = (tr) => {
      const cell = tr.cells[index];
      // data-sort-value existe para quando o texto exibido nao ordena bem:
      // "há 3 dias", "R$ 1.234,50", "Em análise".
      return cell?.dataset.sortValue ?? cell?.textContent.trim() ?? '';
    };
    const sinal = direction === 'desc' ? -1 : 1;
    const ordenadas = this.rows.sort((a, b) => sinal * cmp(chave(a), chave(b)));
    for (const tr of ordenadas) body.append(tr);
    return this;
  }

  /* ---------------------------------------------------------------- *
   * Selecao em massa                                                 *
   * ---------------------------------------------------------------- */

  _buildSelection() {
    const head = this.node.tHead?.rows[0];
    if (!head) return;

    this.checkAll = el('input', {
      type: 'checkbox', class: 'tuc-table__check',
      'aria-label': 'Selecionar todas as linhas desta página',
    });
    const th = el('th', { class: 'tuc-table__pick', scope: 'col' }, [this.checkAll]);
    head.prepend(th);

    for (const tr of this.rows) {
      /*
       * A caixa continua sendo um <input> com name e value: o que chega no
       * Django e request.POST.getlist('selected'), sem JavaScript no meio.
       * O identificador sai do data-id da linha, que o template ja escreve.
       */
      const check = el('input', {
        type: 'checkbox', class: 'tuc-table__check',
        name: this.opts.selectName, value: tr.dataset.id ?? '',
        'aria-label': 'Selecionar linha',
      });
      const td = el('td', { class: 'tuc-table__pick' }, [check]);
      tr.prepend(td);
      this._cleanups.push(on(check, 'change', () => this._afterPick(tr, check.checked)));
    }

    this._cleanups.push(on(this.checkAll, 'change', () => {
      /*
       * O estado e lido uma vez, antes do laco. _afterPick reescreve
       * this.checkAll.checked a cada linha para manter o estado misto — e
       * relendo ali dentro, da segunda linha em diante ja chegava `false`:
       * marcar tudo marcava so a primeira.
       */
      const marcar = this.checkAll.checked;
      for (const tr of this.rows) {
        const c = tr.querySelector('.tuc-table__check');
        if (c) { c.checked = marcar; this._afterPick(tr, marcar); }
      }
    }));
  }

  _afterPick(tr, marcada) {
    tr.classList.toggle('is-selected', marcada);
    const todas = this.rows.map((r) => r.querySelector('.tuc-table__check')).filter(Boolean);
    const marcadas = todas.filter((c) => c.checked);
    if (this.checkAll) {
      this.checkAll.checked = marcadas.length === todas.length && todas.length > 0;
      // Estado misto: nem tudo, nem nada. Sem isto o cabecalho mente sobre a
      // selecao assim que uma linha e desmarcada.
      this.checkAll.indeterminate = marcadas.length > 0 && marcadas.length < todas.length;
    }
    const detalhe = { selected: this.getSelected(), row: tr };
    this.node.dispatchEvent(new CustomEvent('tuc:select', { bubbles: true, detail: detalhe }));
    this.opts.onSelect?.(detalhe, this);
  }

  /** Valores marcados — os mesmos que o formulário enviaria. */
  getSelected() {
    return this.rows
      .filter((tr) => tr.querySelector('.tuc-table__check')?.checked)
      .map((tr) => tr.querySelector('.tuc-table__check').value);
  }

  clearSelection() {
    for (const tr of this.rows) {
      const c = tr.querySelector('.tuc-table__check');
      if (c) { c.checked = false; tr.classList.remove('is-selected'); }
    }
    if (this.checkAll) { this.checkAll.checked = false; this.checkAll.indeterminate = false; }
    return this;
  }

  destroy() {
    this._cleanups.forEach((fn) => fn());
    this._cleanups = [];
  }
}

/**
 * Tabelas escritas no template — o caminho normal num projeto Django:
 *
 *   <table data-tuc-table data-selectable>
 *     <thead><tr><th data-sort="text" data-field="nome">Nome</th></tr></thead>
 *     <tbody><tr data-id="12"><td>Ana</td></tr></tbody>
 *   </table>
 */
export function autoInit(scope = document) {
  const out = [];
  for (const node of scope.querySelectorAll('table[data-tuc-table]:not([data-tuc-ready])')) {
    node.setAttribute('data-tuc-ready', '');
    const d = node.dataset;
    out.push(new Table(node, {
      sortable: d.sortable !== 'false',
      selectable: d.selectable !== undefined && d.selectable !== 'false',
      selectName: d.selectName || undefined,
      sortUrl: d.sortUrl || undefined,
    }));
  }
  return out;
}
