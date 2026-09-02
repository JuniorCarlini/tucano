import { abrirComTransicao, el, icon, ICONS, nextId, on } from '../core/dom.js';
import { ICONS_EXTRA } from '../core/dom-extra.js';
import { Popover } from '../core/popover.js';

const DEFAULTS = {
  search: undefined,        // default: liga a partir de 6 opcoes
  searchMinItems: 6,
  placeholder: undefined,   // default: do atributo ou "Selecione..."
  searchPlaceholder: 'Buscar...',
  emptyText: 'Nenhum resultado',
  clearable: true,
  maxItems: null,           // limite no modo multiplo
  wrapTags: false,          // true deixa o campo crescer em varias linhas
  closeOnSelect: undefined, // default: true em simples, false em multiplo
  placement: 'bottom-start',
  appendTo: undefined,
  // Busca no servidor
  url: null,             // com url, a lista vem do servidor a cada digitacao
  loadOptions: null,     // (termo) => Promise<[{value,label,disabled,group}]>
  queryParam: 'q',
  pageParam: 'page',     // paginacao ao rolar; null desliga
  minChars: 1,
  debounce: 300,
  cache: true,           // guarda o resultado de cada termo
  cacheSize: 60,
  shortCircuit: false,   // ver _semChance()
  loadingText: 'Buscando...',
  errorText: 'Falha ao buscar',
  onChange: null,
};

/**
 * Enriquece um <select> nativo. O elemento original continua no DOM, guardando
 * o valor — entao `name`, `multiple` e `required` seguem funcionando e o Django
 * recebe exatamente o que receberia sem o componente.
 */
export class Select {
  constructor(target, options = {}) {
    const node = typeof target === 'string' ? document.querySelector(target) : target;
    if (!node) throw new Error('[Select] elemento alvo nao encontrado');
    if (node.tagName !== 'SELECT') throw new Error('[Select] o alvo precisa ser um <select>');

    this.opts = { ...DEFAULTS, ...omitUndefined(options) };
    this.native = node;
    this.multiple = node.multiple;
    this.opts.closeOnSelect = this.opts.closeOnSelect ?? !this.multiple;
    this.opts.placeholder = this.opts.placeholder
      ?? node.dataset.placeholder
      ?? (this.multiple ? 'Selecione...' : firstEmptyLabel(node) ?? 'Selecione...');

    this.id = nextId('sel');
    this.isOpen = false;
    this.query = '';
    this.activeIndex = -1;
    this._cleanups = [];

    this.items = readOptions(node);
    this.remoto = !!(this.opts.url || this.opts.loadOptions);
    // Com busca no servidor o campo de busca e obrigatorio: e o unico jeito de
    // pedir algo.
    this.opts.search = this.remoto ? true : (this.opts.search ?? this.items.length >= this.opts.searchMinItems);
    this.estadoBusca = null;   // null | 'carregando' | 'erro'
    this._cache = new Map();   // termo -> itens
    this._vazios = new Set();  // termos que nao trouxeram nada
    this._pagina = 1;
    this._temMais = false;

    this._build();
    this._syncFromNative();
    node._tucano = this;
  }

  /* ---------------------------------------------------------------- *
   * API publica                                                       *
   * ---------------------------------------------------------------- */

  getValue() {
    const escolhidos = this.items.filter((i) => i.selected).map((i) => i.value);
    return this.multiple ? escolhidos : (escolhidos[0] ?? null);
  }

  setValue(value, { silent = false } = {}) {
    const alvo = new Set([].concat(value ?? []).map(String));
    for (const item of this.items) item.selected = alvo.has(item.value);
    this._pushToNative();
    this._renderControl();
    if (this.isOpen) this._renderMenu();
    if (!silent) this._emit();
  }

  clear({ silent = false } = {}) {
    this.setValue([], { silent });
  }

  /** Relê as <option> do select nativo — use depois de trocar as opções por HTMX. */
  refresh() {
    this._cache.clear();
    this._vazios.clear();
    this.items = readOptions(this.native);
    this._renderControl();
    if (this.isOpen) this._renderMenu();
  }

  open() {
    if (this.isOpen || this.native.disabled) return;
    this.isOpen = true;
    this.query = '';
    this.search.value = '';
    if (this.remoto) { this.items = this._escolhidos(); this.estadoBusca = null; }
    this.activeIndex = this.items.findIndex((i) => i.selected && !i.disabled);
    this._renderMenu();

    this.popover = new Popover(this.control, this.menu, {
      placement: this.opts.placement,
      appendTo: this.opts.appendTo || document.body,
      matchWidth: true,
      onDismiss: () => this.close(),
    });
    this.popover.show();
    abrirComTransicao(this.menu);
    this.control.classList.add('is-open');
    this.control.setAttribute('aria-expanded', 'true');
    this.search.focus();
    this._scrollToActive();
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.menu.classList.remove('is-open');
    this.control.classList.remove('is-open');
    this.control.setAttribute('aria-expanded', 'false');
    this.popover?.destroy();
    this.popover = null;
    this.query = '';
    this.search.value = '';
    this._renderControl();
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  destroy() {
    clearTimeout(this._timerBusca);
    this._abortar();
    this.close();
    this._cleanups.forEach((fn) => fn());
    this._cleanups = [];
    this.control.remove();
    this.menu.remove();
    this.native.classList.remove('tuc-select-native');
    this.native.removeAttribute('aria-hidden');
    this.native.removeAttribute('tabindex');
    delete this.native._tucano;
  }

  /* ---------------------------------------------------------------- *
   * Construcao                                                        *
   * ---------------------------------------------------------------- */

  _build() {
    // O select nativo sai do fluxo visual mas continua no formulario.
    this.native.classList.add('tuc-select-native');
    this.native.setAttribute('aria-hidden', 'true');
    this.native.tabIndex = -1;

    this.values = el('div', { class: 'tuc-select__values' });
    this.search = el('input', {
      class: 'tuc-select__search',
      type: 'text',
      autocomplete: 'off',
      spellcheck: 'false',
      'aria-autocomplete': 'list',
      'aria-controls': `${this.id}-list`,
    });

    this.clearBtn = el('button', {
      type: 'button', class: 'tuc-select__clear', 'aria-label': 'Limpar selecao',
      tabindex: -1,
      onclick: (e) => { e.stopPropagation(); this.clear(); },
    }, [icon(ICONS.x, 14)]);

    this.control = el('div', {
      class: `tuc-select${this.multiple ? ' is-multiple' : ''}${this.opts.wrapTags ? ' is-wrap' : ''}`,
      role: 'combobox',
      'aria-haspopup': 'listbox',
      'aria-expanded': 'false',
      'aria-controls': `${this.id}-list`,
      id: this.id,
    }, [
      this.values,
      this.opts.clearable ? this.clearBtn : null,
      el('span', { class: 'tuc-select__arrow' }, [icon(ICONS_EXTRA.chevronsUpDown, 15)]),
    ]);

    this.list = el('div', { class: 'tuc-select__list', role: 'listbox', id: `${this.id}-list`, 'aria-multiselectable': this.multiple ? 'true' : null });
    this.menu = el('div', { class: 'tuc-select__menu' }, [this.list]);

    this.native.after(this.control);
    this.values.append(this.search);

    this._cleanups.push(
      on(this.control, 'mousedown', (e) => {
        if (e.target.closest('.tuc-select__clear, .tuc-select__tagx')) return;
        // Evita perder o foco do campo de busca ao clicar no proprio controle.
        e.preventDefault();
        this.isOpen ? this.search.focus() : this.open();
      }),
      on(this.search, 'input', () => {
        this.query = this.search.value;
        if (!this.isOpen) this.open();
        if (this.remoto) { this._agendarBusca(); return; }
        this.activeIndex = this._filtered().findIndex((i) => !i.disabled);
        this._renderMenu();
        this._renderControl();
      }),
      on(this.search, 'keydown', (e) => this._onKeydown(e)),
      // Se o valor mudar por fora (reset de formulario, JS de terceiros).
      on(this.native, 'change', () => { if (!this._pushing) this._syncFromNative(); }),
      on(this.list, 'scroll', () => this._aoRolarLista()),
    );
  }

  _syncFromNative() {
    const escolhidos = new Set([...this.native.selectedOptions].map((o) => o.value));
    for (const item of this.items) item.selected = escolhidos.has(item.value);
    this._renderControl();
  }

  _pushToNative() {
    this._pushing = true;
    // Itens vindos do servidor nao existem no <select>: cria a <option> para o
    // valor poder ser postado.
    if (this.remoto) {
      for (const item of this.items) {
        if (!item.selected) continue;
        if ([...this.native.options].some((o) => o.value === item.value)) continue;
        this.native.append(el('option', { value: item.value, text: item.label }));
      }
    }
    const escolhidos = new Set(this.items.filter((i) => i.selected).map((i) => i.value));
    for (const opt of this.native.options) opt.selected = escolhidos.has(opt.value);
    // Nada escolhido num select simples: volta para a <option value=""> para o
    // formulario postar vazio e o `required` do Django continuar valendo.
    if (!this.multiple && !escolhidos.size) {
      const vazia = [...this.native.options].find((o) => o.value === '');
      if (vazia) vazia.selected = true;
    }
    this.native.dispatchEvent(new Event('change', { bubbles: true }));
    this._pushing = false;
  }


  /* ---------------------------------------------------------------- *
   * Busca no servidor                                                 *
   * ---------------------------------------------------------------- */

  /**
   * Quatro filtros antes de chegar na rede, do mais barato ao mais caro:
   * tamanho minimo, cache, termo sem chance e requisicao ja em voo. Debounce
   * so no fim, para o que sobrou.
   */
  _agendarBusca() {
    clearTimeout(this._timerBusca);
    const termo = this.query.trim();
    this._pagina = 1;

    if (termo.length < this.opts.minChars) {
      this._abortar();
      this.estadoBusca = null;
      this.items = this._escolhidos();
      this._temMais = false;
      this._renderMenu();
      return;
    }

    const guardado = this.opts.cache ? this._cache.get(termo) : null;
    if (guardado) {
      this._abortar();
      this.estadoBusca = null;
      this._aplicarResultado(guardado, { anexar: false });
      return;
    }

    if (this._semChance(termo)) {
      this._abortar();
      this.estadoBusca = null;
      this._aplicarResultado([], { anexar: false });
      return;
    }

    if (this._termoEmVoo === termo) return;

    this.estadoBusca = 'carregando';
    this._renderMenu();
    this._timerBusca = setTimeout(() => this._buscar(termo), this.opts.debounce);
  }

  /**
   * Se "lucas" nao trouxe nada, "lucass" tambem nao traz — desde que a busca
   * do servidor seja por conter o termo, como um icontains do Django.
   *
   * Fica desligado por padrao: com busca aproximada, por sinonimo ou por
   * relevancia, um termo maior pode sim trazer resultado, e cortar aqui
   * esconderia dados sem aviso.
   */
  _semChance(termo) {
    if (!this.opts.shortCircuit) return false;
    for (const vazio of this._vazios) if (termo.startsWith(vazio)) return true;
    return false;
  }

  _guardar(termo, itens) {
    if (!this.opts.cache) return;
    // Map preserva ordem de insercao: o mais antigo sai primeiro.
    if (this._cache.size >= this.opts.cacheSize) {
      this._cache.delete(this._cache.keys().next().value);
    }
    this._cache.set(termo, itens);
    if (!itens.length) this._vazios.add(termo);
  }

  /** Junta o que veio com quem ja estava escolhido e desenha. */
  _aplicarResultado(vindos, { anexar }) {
    const escolhidos = this._escolhidos();
    const base = anexar ? this.items : escolhidos;
    const novos = vindos.filter((i) => !base.some((e) => e.value === i.value));
    this.items = [...base, ...novos];
    this.activeIndex = this.items.findIndex((i) => !i.disabled && !i.selected);
    this._renderMenu();
  }

  _abortar() {
    this._controle?.abort();
    this._controle = null;
  }

  async _buscar(termo, { pagina = 1 } = {}) {
    // Cancela a anterior: sem isso, uma resposta lenta chega depois de uma
    // rapida e sobrescreve a lista com resultado de um termo ja abandonado.
    this._abortar();
    const controle = new AbortController();
    this._controle = controle;
    this._termoEmVoo = termo;

    try {
      const brutos = this.opts.loadOptions
        ? await this.opts.loadOptions(termo, { signal: controle.signal, page: pagina })
        : await this._buscarUrl(termo, controle.signal, pagina);
      if (controle.signal.aborted) return;

      const vindos = normalizarOpcoes(brutos);
      this._temMais = temProximaPagina(brutos, vindos, this.opts.pageParam);
      this.estadoBusca = null;
      if (pagina === 1) this._guardar(termo, vindos);
      this._aplicarResultado(vindos, { anexar: pagina > 1 });
      return;
    } catch (e) {
      if (e.name === 'AbortError' || controle.signal.aborted) return;
      this.estadoBusca = 'erro';
      this._renderMenu();
    } finally {
      if (this._controle === controle) { this._controle = null; this._termoEmVoo = null; }
    }
  }

  async _buscarUrl(termo, signal, pagina = 1) {
    const url = new URL(this.opts.url, location.href);
    url.searchParams.set(this.opts.queryParam, termo);
    if (pagina > 1 && this.opts.pageParam) url.searchParams.set(this.opts.pageParam, String(pagina));
    const r = await fetch(url, { signal, headers: { Accept: 'application/json' } });
    if (!r.ok) throw new Error(`O servidor respondeu ${r.status}`);
    return r.json();
  }

  /**
   * Proxima pagina ao chegar perto do fim da lista. Carregar de uma vez os
   * dez mil registros e o que trava a pagina; vinte por vez, nao.
   */
  _aoRolarLista() {
    if (!this.remoto || !this._temMais || this.estadoBusca === 'carregando') return;
    const l = this.list;
    if (l.scrollTop + l.clientHeight < l.scrollHeight - 48) return;
    this._pagina += 1;
    this.estadoBusca = 'carregando';
    this._renderMenu();
    this._buscar(this.query.trim(), { pagina: this._pagina });
  }

  _escolhidos() {
    return this.items.filter((i) => i.selected);
  }

  /* ---------------------------------------------------------------- *
   * Render                                                            *
   * ---------------------------------------------------------------- */

  _renderControl() {
    const escolhidos = this.items.filter((i) => i.selected);
    for (const n of [...this.values.children]) if (n !== this.search) n.remove();

    if (this.multiple) {
      for (const item of escolhidos) {
        this.values.insertBefore(el('span', { class: 'tuc-select__tag' }, [
          el('span', { class: 'tuc-select__tagtext', text: item.label }),
          el('button', {
            type: 'button', class: 'tuc-select__tagx', tabindex: -1,
            'aria-label': `Remover ${item.label}`,
            onclick: (e) => { e.stopPropagation(); this._toggleItem(item); },
          }, [icon(ICONS.x, 12)]),
        ]), this.search);
      }
    } else if (escolhidos.length && !this.query) {
      this.values.insertBefore(
        el('span', { class: 'tuc-select__single', text: escolhidos[0].label }), this.search);
    }

    const vazio = !escolhidos.length && !this.query;
    // Placeholder no input: some assim que existe tag ou rotulo ao lado.
    this.search.placeholder = vazio
      ? this.opts.placeholder
      : (this.isOpen && this.opts.search ? this.opts.searchPlaceholder : '');
    this.control.classList.toggle('is-empty', vazio);
    this.control.classList.toggle('has-value', escolhidos.length > 0);
    this.search.readOnly = !this.opts.search;
  }

  _filtered() {
    // No modo remoto o servidor ja devolveu o recorte: filtrar de novo
    // esconderia resultados que ele considerou relevantes.
    if (this.remoto) return this.items;
    const q = this.query.trim().toLowerCase();
    if (!q) return this.items;
    return this.items.filter((i) => i.busca.includes(q));
  }

  _renderMenu() {
    const visiveis = this._filtered();
    this.list.replaceChildren();

    if (this.estadoBusca === 'carregando') {
      this.list.append(el('div', { class: 'tuc-select__empty is-loading', text: this.opts.loadingText }));
      return;
    }
    if (this.estadoBusca === 'erro') {
      this.list.append(el('div', { class: 'tuc-select__empty is-error', text: this.opts.errorText }));
      return;
    }
    if (!visiveis.length) {
      const faltaDigitar = this.remoto && this.query.trim().length < this.opts.minChars;
      this.list.append(el('div', {
        class: 'tuc-select__empty',
        text: faltaDigitar
          ? `Digite ${this.opts.minChars} caractere${this.opts.minChars > 1 ? 's' : ''} para buscar`
          : this.opts.emptyText,
      }));
      return;
    }

    let grupoAtual = null;
    visiveis.forEach((item, i) => {
      if (item.group && item.group !== grupoAtual) {
        grupoAtual = item.group;
        this.list.append(el('div', { class: 'tuc-select__group', text: item.group, role: 'presentation' }));
      }
      const ativo = i === this.activeIndex;
      const node = el('div', {
        class: `tuc-select__option${item.selected ? ' is-selected' : ''}${ativo ? ' is-active' : ''}${item.disabled ? ' is-disabled' : ''}`,
        role: 'option',
        id: `${this.id}-opt-${i}`,
        'aria-selected': item.selected ? 'true' : 'false',
        'aria-disabled': item.disabled ? 'true' : null,
        onmousedown: (e) => { e.preventDefault(); if (!item.disabled) this._toggleItem(item); },
        onmouseenter: () => { this.activeIndex = i; this._paintActive(); },
      }, [
        el('span', { class: 'tuc-select__label', text: item.label }),
        item.selected ? el('span', { class: 'tuc-select__check' }, [icon(ICONS_EXTRA.check, 15)]) : null,
      ]);
      this.list.append(node);
    });

    this.search.setAttribute('aria-activedescendant',
      this.activeIndex >= 0 ? `${this.id}-opt-${this.activeIndex}` : '');
  }

  /** Move o destaque sem refazer a lista — mesma razao do calendario. */
  _paintActive() {
    const opcoes = this.list.querySelectorAll('.tuc-select__option');
    opcoes.forEach((n, i) => n.classList.toggle('is-active', i === this.activeIndex));
    this.search.setAttribute('aria-activedescendant',
      this.activeIndex >= 0 ? `${this.id}-opt-${this.activeIndex}` : '');
  }

  _scrollToActive() {
    const node = this.list.querySelectorAll('.tuc-select__option')[this.activeIndex];
    if (!node) return;
    const lr = this.list.getBoundingClientRect();
    const nr = node.getBoundingClientRect();
    if (nr.top < lr.top) this.list.scrollTop -= lr.top - nr.top;
    else if (nr.bottom > lr.bottom) this.list.scrollTop += nr.bottom - lr.bottom;
  }

  /* ---------------------------------------------------------------- *
   * Interacao                                                         *
   * ---------------------------------------------------------------- */

  _toggleItem(item) {
    if (item.disabled) return;
    if (this.multiple) {
      if (!item.selected && this.opts.maxItems && this.items.filter((i) => i.selected).length >= this.opts.maxItems) return;
      item.selected = !item.selected;
    } else {
      for (const i of this.items) i.selected = i === item;
    }
    this._pushToNative();
    this.query = '';
    this.search.value = '';
    this._renderControl();
    this._emit();

    if (this.opts.closeOnSelect) this.close();
    else if (this.isOpen) { this._renderMenu(); this.search.focus(); }
  }

  _onKeydown(e) {
    const visiveis = this._filtered();
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!this.isOpen) return this.open();
      const passo = e.key === 'ArrowDown' ? 1 : -1;
      for (let n = 1; n <= visiveis.length; n++) {
        const i = (this.activeIndex + passo * n + visiveis.length * n) % visiveis.length;
        if (!visiveis[i].disabled) { this.activeIndex = i; break; }
      }
      this._paintActive();
      this._scrollToActive();
    } else if (e.key === 'Enter') {
      if (!this.isOpen) return;
      e.preventDefault();
      const item = visiveis[this.activeIndex];
      if (item) this._toggleItem(item);
    } else if (e.key === 'Escape') {
      if (this.isOpen) { e.preventDefault(); e.stopPropagation(); this.close(); this.control.focus?.(); }
    } else if (e.key === 'Backspace' && !this.search.value && this.multiple) {
      // Campo de busca vazio: apagar remove a ultima tag, como em qualquer editor de tags.
      const escolhidos = this.items.filter((i) => i.selected);
      if (escolhidos.length) this._toggleItem(escolhidos[escolhidos.length - 1]);
    } else if (e.key === 'Home' || e.key === 'End') {
      if (!this.isOpen) return;
      e.preventDefault();
      this.activeIndex = e.key === 'Home' ? 0 : visiveis.length - 1;
      this._paintActive();
      this._scrollToActive();
    }
  }

  _emit() {
    const value = this.getValue();
    const detail = { value, instance: this };
    this.opts.onChange?.(value, detail);
    this.native.dispatchEvent(new CustomEvent('tucano:change', { detail, bubbles: true }));
  }
}

/* ------------------------------------------------------------------ */

/**
 * Aceita a lista em varios formatos: [{value,label}], ["a","b"],
 * {results:[...]} do DRF, ou {id,text} do Select2 — para nao obrigar o
 * servidor a mudar so por causa daqui.
 */
function normalizarOpcoes(dados) {
  const lista = Array.isArray(dados) ? dados : (dados?.results ?? dados?.items ?? dados?.data ?? []);
  return lista.map((o) => {
    if (o == null) return null;
    if (typeof o !== 'object') return { value: String(o), label: String(o), disabled: false, group: null, selected: false, busca: normalize(String(o)) };
    const value = String(o.value ?? o.id ?? o.pk ?? '');
    const label = String(o.label ?? o.text ?? o.nome ?? o.name ?? value);
    return { value, label, disabled: !!o.disabled, group: o.group ?? o.grupo ?? null, selected: false, busca: normalize(`${label} ${value}`) };
  }).filter((o) => o && o.value !== '');
}

/**
 * Ha mais paginas? O DRF diz em `next`. Sem essa pista, so da para supor: uma
 * pagina que veio vazia acabou; uma que veio cheia pode ter mais.
 */
function temProximaPagina(brutos, itens, pageParam) {
  if (!pageParam) return false;
  if (brutos && typeof brutos === 'object' && !Array.isArray(brutos)) {
    if ('next' in brutos) return !!brutos.next;
    if ('has_more' in brutos) return !!brutos.has_more;
  }
  return itens.length > 0;
}

function readOptions(select) {
  return [...select.options]
    // <option value=""> e placeholder, nao opcao: fica fora da lista.
    .filter((o) => o.value !== '')
    .map((o) => ({
      value: o.value,
      label: o.textContent.trim(),
      disabled: o.disabled,
      group: o.parentElement.tagName === 'OPTGROUP' ? o.parentElement.label : null,
      selected: o.selected,
      // Normaliza acentos: buscar "sao" acha "São Paulo".
      busca: normalize(`${o.textContent} ${o.value}`),
    }));
}

function normalize(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/** Uma <option value=""> serve de placeholder num select simples. */
function firstEmptyLabel(select) {
  const o = [...select.options].find((x) => x.value === '');
  return o ? o.textContent.trim() : null;
}

function omitUndefined(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) if (v !== undefined) out[k] = v;
  return out;
}

export function autoInit(scope = document) {
  const out = [];
  for (const node of scope.querySelectorAll('select[data-tuc-select]:not([data-tuc-ready])')) {
    const d = node.dataset;
    node.setAttribute('data-tuc-ready', '');
    out.push(new Select(node, {
      search: d.search === 'true' ? true : d.search === 'false' ? false : undefined,
      placeholder: d.placeholder || undefined,
      emptyText: d.emptyText || undefined,
      maxItems: d.maxItems ? +d.maxItems : undefined,
      clearable: d.clearable === 'false' ? false : undefined,
      wrapTags: d.wrapTags === 'true' ? true : undefined,
      url: d.url || undefined,
      queryParam: d.queryParam || undefined,
      minChars: d.minChars ? +d.minChars : undefined,
      debounce: d.debounce ? +d.debounce : undefined,
      pageParam: d.pageParam === 'false' ? null : (d.pageParam || undefined),
      cache: d.cache === 'false' ? false : undefined,
      shortCircuit: d.shortCircuit === 'true' ? true : undefined,
      closeOnSelect: d.closeOnSelect === 'false' ? false : d.closeOnSelect === 'true' ? true : undefined,
    }));
  }
  return out;
}
