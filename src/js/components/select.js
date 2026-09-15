import { el, icon, ICON_CHECK, ICON_CHEVRONS_UP_DOWN, ICON_X, nextId, omitUndefined, on } from '../core/dom.js';
import { Popover } from '../core/popover.js';
import { SELECT_TEXTS as T } from '../core/texts.js';

// Os textos sem valor aqui saem de Tucano.setTexts({ select }), com o portugues como padrao.
const TEXT_OPTIONS = ['searchPlaceholder', 'emptyText', 'loadingText', 'errorText'];

const DEFAULTS = {
  search: undefined,        // default: liga a partir de 6 opcoes
  searchMinItems: 6,
  placeholder: undefined,   // default: do atributo, da <option value=""> ou setTexts ("Selecione...")
  searchPlaceholder: undefined, // default: setTexts ("Buscar...")
  emptyText: undefined,     // default: setTexts ("Nenhum resultado")
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
  shortCircuit: false,   // ver _noChance()
  loadingText: undefined,   // default: setTexts ("Buscando...")
  errorText: undefined,     // default: setTexts ("Falha ao buscar")
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
    // A opcao da instancia vence o texto global.
    for (const key of TEXT_OPTIONS) this.opts[key] ??= T[key];
    // `||`: uma <option value=""></option> em branco deixava o campo sem texto nenhum.
    this.opts.placeholder = this.opts.placeholder
      ?? node.dataset.placeholder
      ?? ((!this.multiple && firstEmptyLabel(node)) || T.placeholder);

    this.id = nextId('sel');
    this.isOpen = false;
    this.query = '';
    this.activeIndex = -1;
    this._cleanups = [];

    this.remote = !!(this.opts.url || this.opts.loadOptions);
    /*
     * Com busca no servidor o campo de busca e obrigatorio: e o unico jeito de
     * pedir algo. Sem a opcao, a busca liga pelo numero de opcoes e e refeita a
     * cada releitura — um select que nasce vazio e recebe as cidades por HTMX
     * ficava sem busca para sempre.
     */
    this._autoSearch = !this.remote && this.opts.search === undefined;
    if (this.remote) this.opts.search = true;
    this.searchState = null;   // null | 'loading' | 'error'
    this._cache = new Map();   // termo -> { items, more }
    this._page = 1;
    this._hasMore = false;

    this._build();
    this.refresh();
    node._tucano = this;
  }

  /* ---------------------------------------------------------------- *
   * API publica                                                       *
   * ---------------------------------------------------------------- */

  getValue() {
    const chosen = this._chosen().map((i) => i.value);
    return this.multiple ? chosen : (chosen[0] ?? null);
  }

  setValue(value, { silent = false } = {}) {
    // No simples vale o primeiro: com dois, a tela mostrava um e o nativo postava o outro.
    const target = new Set([].concat(value ?? []).map(String).slice(0, this.multiple ? undefined : 1));
    for (const item of this.items) item.selected = target.has(item.value);
    this._pushToNative();
    this._renderControl();
    if (this.isOpen) this._renderMenu();
    if (!silent) this._emit();
  }

  clear({ silent = false } = {}) {
    this.setValue([], { silent });
  }

  /**
   * Relê as <option> do select nativo — use depois de trocar as opções por HTMX.
   * É também o que roda no `change` de fora e no reset do formulário: no modo
   * remoto a lista guardada só tinha o que estava escolhido, e o reset que
   * voltava a uma opção fora dela deixava a tela vazia e o POST com valor.
   */
  refresh() {
    this._cache.clear();
    this.items = readOptions(this.native);
    if (this._autoSearch) this.opts.search = this.items.length >= this.opts.searchMinItems;
    this._renderControl();
    if (this.isOpen) this._renderMenu();
  }

  open() {
    if (this.isOpen || this.native.disabled) return;
    this.isOpen = true;
    this.query = '';
    this.search.value = '';
    if (this.remote) { this.items = this._chosen(); this.searchState = null; }
    this.activeIndex = this.items.findIndex((i) => i.selected && !i.disabled);
    this._renderMenu();

    this.popover = new Popover(this.control, this.menu, {
      placement: this.opts.placement,
      appendTo: this.opts.appendTo,
      matchWidth: true,
      closeOnFocusOut: true,
      onDismiss: () => this.close(),
    });
    this.popover.show();
    this.control.classList.add('is-open');
    this.control.setAttribute('aria-expanded', 'true');
    // A lista so existe no DOM com o painel aberto: fechado, o aria-controls
    // apontaria para um id inexistente, que e valor invalido.
    this.control.setAttribute('aria-controls', `${this.id}-list`);
    this.search.setAttribute('aria-controls', `${this.id}-list`);
    this.search.focus();
    this._scrollToActive();
    // Com minChars 0 a lista vem do servidor ja na abertura; antes aparecia
    // "Nenhum resultado" ate a pessoa digitar e apagar.
    if (this.remote && !this.opts.minChars) this._scheduleSearch();
  }

  close() {
    // Busca pendente morre com a lista: senao a resposta chegava depois e enchia
    // a lista reaberta com o resultado de um termo que ja nao esta no campo.
    clearTimeout(this._searchTimer);
    this._abort();
    if (!this.isOpen) return;
    this.isOpen = false;
    this.control.classList.remove('is-open');
    this.control.setAttribute('aria-expanded', 'false');
    this.control.removeAttribute('aria-controls');
    this.search.removeAttribute('aria-controls');
    // Pelo mesmo motivo do aria-controls: a opcao ativa sai do DOM com a lista.
    this.search.removeAttribute('aria-activedescendant');
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
    this.close();
    this._cleanups.forEach((fn) => fn());
    this._cleanups = [];
    this.control.remove();
    this.menu.remove();
    this.native.classList.remove('tuc-select-native');
    this.native.removeAttribute('aria-hidden');
    this.native.removeAttribute('tabindex');
    // Sem isto o init() seguinte pulava o campo, que ficava cru para sempre.
    this.native.removeAttribute('data-tuc-ready');
    delete this.native._tucano;
  }

  /* ---------------------------------------------------------------- *
   * Construcao                                                        *
   * ---------------------------------------------------------------- */

  _build() {
    const node = this.native;
    // O select nativo sai do fluxo visual mas continua no formulario.
    node.classList.add('tuc-select-native');
    node.setAttribute('aria-hidden', 'true');
    node.tabIndex = -1;

    /*
     * O <label for> e o aria-label apontam para o nativo, que esta escondido:
     * sem repassar o nome, o combobox e a busca ficavam sem nome nenhum para o
     * leitor de tela.
     */
    const labelledBy = node.getAttribute('aria-labelledby');
    const name = labelledBy ? null : (node.getAttribute('aria-label') || [...node.labels].map(labelText).join(' ') || null);

    this.values = el('div', { class: 'tuc-select__values' });
    this.search = el('input', {
      class: 'tuc-select__search',
      type: 'text',
      autocomplete: 'off',
      spellcheck: 'false',
      'aria-autocomplete': 'list',
      'aria-label': name,
      'aria-labelledby': labelledBy,
    });

    this.clearBtn = el('button', {
      type: 'button', class: 'tuc-btn is-ghost is-icon tuc-select__clear', 'aria-label': T.clear,
      tabindex: -1,
      // O foco volta para a busca: o X some sem valor e levava o foco junto para o body.
      onclick: (e) => { e.stopPropagation(); this.clear(); this.search.focus(); },
    }, [icon(ICON_X, 14)]);

    this.control = el('div', {
      class: `tuc-select${this.opts.wrapTags ? ' is-wrap' : ''}`,
      role: 'combobox',
      'aria-haspopup': 'listbox',
      'aria-expanded': 'false',
      'aria-label': name,
      'aria-labelledby': labelledBy,
      id: this.id,
    }, [
      this.values,
      this.opts.clearable ? this.clearBtn : null,
      el('span', { class: 'tuc-select__arrow' }, [icon(ICON_CHEVRONS_UP_DOWN, 15)]),
    ]);

    this.list = el('div', { class: 'tuc-select__list', role: 'listbox', id: `${this.id}-list`, 'aria-multiselectable': this.multiple ? 'true' : null });
    this.menu = el('div', { class: 'tuc-select__menu' }, [this.list]);

    node.after(this.control);
    this.values.append(this.search);

    this._cleanups.push(
      on(this.control, 'mousedown', (e) => {
        if (e.target.closest('.tuc-select__clear, .tuc-select__tagx')) return;
        // Evita perder o foco do campo de busca ao clicar no proprio controle.
        e.preventDefault();
        this.isOpen ? this.search.focus() : this.open();
      }),
      /*
       * Dentro de um <label>, o clique no controle ativava o label, que mandava
       * o foco ao nativo escondido: o Popover via o foco sair e fechava a lista
       * que acabara de abrir. E o <label for>, o submit invalido do `required` e
       * qualquer .focus() no nativo deixavam o foco num elemento invisivel.
       */
      on(this.control, 'click', (e) => e.preventDefault()),
      on(node, 'focus', () => this.search.focus()),
      on(this.search, 'input', () => {
        // open() zera a busca. Com a lista fechada, a primeira letra digitada e
        // o que abre a lista, e sumia junto: "pa" virava "a".
        const typed = this.search.value;
        if (!this.isOpen) { this.open(); this.search.value = typed; }
        this.query = typed;
        if (this.remote) { this._scheduleSearch(); return; }
        this.activeIndex = this._filtered().findIndex((i) => !i.disabled);
        this._renderMenu();
        this._renderControl();
      }),
      on(this.search, 'keydown', (e) => this._onKeydown(e)),
      // Se o valor mudar por fora, por JS de terceiros que dispara change.
      on(node, 'change', () => { if (!this._pushing) this.refresh(); }),
      /*
       * O reset do formulario volta o <select> aos valores iniciais sem disparar
       * change: o nativo mudava e a tela continuava mostrando o valor antigo. O
       * evento chega antes de os valores voltarem, entao a leitura espera a vez.
       */
      node.form
        ? on(node.form, 'reset', () => setTimeout(() => this.refresh()))
        : () => {},
      /*
       * Um ouvinte no painel, e nao dois por opcao: com 2.000 opcoes eram 4.000
       * funcoes novas a cada tecla. E o clique em qualquer ponto do painel nao
       * tira o foco da busca — no titulo de um grupo o foco ia para o body e a
       * lista ficava aberta sem teclado. A barra de rolagem da lista fica de
       * fora, para continuar arrastavel.
       */
      on(this.menu, 'mousedown', (e) => {
        if (e.target !== this.list) e.preventDefault();
        const i = optionIndex(e.target);
        if (i >= 0) this._toggleItem(this._filtered()[i]);
      }),
      /*
       * So o ponteiro que de fato andou muda o destaque. A seta rola a lista por
       * baixo do ponteiro parado, e a opcao que passava por ali roubava o
       * destaque do teclado — pelo mouseenter em todo motor, e o WebKit ainda
       * dispara mousemove sem movimento ao rolar, por isso a coordenada.
       */
      on(this.list, 'mousemove', (e) => {
        const at = e.clientX + ',' + e.clientY;
        const i = optionIndex(e.target);
        if (at === this._pointer || i < 0) return;
        this._pointer = at;
        this.activeIndex = i;
        this._paintActive();
      }),
      on(this.list, 'scroll', () => this._onListScroll()),
    );
  }

  _pushToNative() {
    this._pushing = true;
    // Itens vindos do servidor nao existem no <select>: cria a <option> para o
    // valor poder ser postado.
    if (this.remote) {
      for (const item of this.items) {
        if (!item.selected) continue;
        if ([...this.native.options].some((o) => o.value === item.value)) continue;
        this.native.append(el('option', { value: item.value, text: item.label }));
      }
    }
    const chosen = new Set(this._chosen().map((i) => i.value));
    for (const opt of this.native.options) opt.selected = chosen.has(opt.value);
    // Nada escolhido num select simples: volta para a <option value=""> para o
    // formulario postar vazio e o `required` do Django continuar valendo.
    if (!this.multiple && !chosen.size) {
      const empty = [...this.native.options].find((o) => o.value === '');
      if (empty) empty.selected = true;
      // Sem <option value="">, o navegador volta sozinho para a primeira opção:
      // a tela mostrava o campo vazio e o formulário postava o valor antigo.
      // Sem nada selecionado, o <select> não posta nada e o `required` barra.
      else this.native.selectedIndex = -1;
    }
    this.native.dispatchEvent(new Event('change', { bubbles: true }));
    this._pushing = false;
  }


  /* ---------------------------------------------------------------- *
   * Busca no servidor                                                 *
   * ---------------------------------------------------------------- */

  /**
   * Tres filtros antes de chegar na rede, do mais barato ao mais caro: tamanho
   * minimo, cache e termo sem chance. Debounce so no fim, para o que sobrou.
   *
   * A busca anterior morre ja na tecla, e nao quando a proxima sai: no intervalo
   * do debounce ela voltava e mostrava o resultado de um termo abandonado. E
   * nao ha mais o atalho de "termo ja em voo": abortado por um termo do cache,
   * ele ficava marcado como em voo, e digitar o mesmo termo de novo deixava a
   * lista em "Buscando..." para sempre.
   */
  _scheduleSearch() {
    clearTimeout(this._searchTimer);
    this._abort();
    this.searchState = null;
    const term = this.query.trim();
    this._page = 1;

    if (term.length < this.opts.minChars) {
      this.items = this._chosen();
      this._hasMore = false;
      this._renderMenu();
      return;
    }

    const saved = this.opts.cache && this._cache.get(term);
    if (saved || this._noChance(term)) {
      this._applyResult(saved ? saved.items : [], { more: !!saved && saved.more });
      return;
    }

    this.searchState = 'loading';
    this._renderMenu();
    this._searchTimer = setTimeout(() => this._fetch(term), this.opts.debounce);
  }

  /**
   * Se "lucas" nao trouxe nada, "lucass" tambem nao traz — desde que a busca
   * do servidor seja por conter o termo, como um icontains do Django.
   *
   * Fica desligado por padrao: com busca aproximada, por sinonimo ou por
   * relevancia, um termo maior pode sim trazer resultado, e cortar aqui
   * esconderia dados sem aviso.
   *
   * Os termos vazios sao lidos do proprio cache, sem um Set a parte para manter.
   */
  _noChance(term) {
    if (this.opts.shortCircuit) for (const [t, saved] of this._cache) if (!saved.items.length && term.startsWith(t)) return true;
    return false;
  }

  /** Guarda tambem se havia mais paginas: sem isso o termo vindo do cache herdava o `hasMore` do ultimo termo buscado. */
  _store(term, items, more) {
    if (!this.opts.cache) return;
    // Map preserva ordem de insercao: o mais antigo sai primeiro.
    if (this._cache.size >= this.opts.cacheSize) {
      this._cache.delete(this._cache.keys().next().value);
    }
    this._cache.set(term, { items, more });
  }

  /** Junta o que veio com quem ja estava escolhido e desenha. */
  _applyResult(incoming, { append = false, more }) {
    const base = append ? this.items : this._chosen();
    const fresh = incoming.filter((i) => !base.some((e) => e.value === i.value));
    // Pagina sem nada novo encerra: um servidor que ignora `page` devolvia a
    // mesma pagina a cada rolagem, sem fim.
    this._hasMore = more && (!append || fresh.length > 0);
    this.items = [...base, ...fresh];
    const top = this.list.scrollTop;
    if (!append) this.activeIndex = this.items.findIndex((i) => !i.disabled && !i.selected);
    this._renderMenu();
    // Mais uma pagina no fim: a rolagem e o destaque ficam onde a pessoa estava.
    if (append) this.list.scrollTop = top;
  }

  _abort() {
    this._control?.abort();
    this._control = null;
    this._more = null;
  }

  async _fetch(term, { page = 1 } = {}) {
    // Cancela a anterior: sem isso, uma resposta lenta chega depois de uma
    // rapida e sobrescreve a lista com resultado de um termo ja abandonado.
    this._abort();
    const control = new AbortController();
    this._control = control;

    try {
      const raws = this.opts.loadOptions
        ? await this.opts.loadOptions(term, { signal: control.signal, page: page })
        : await this._fetchUrl(term, control.signal, page);
      if (control.signal.aborted) return;

      const incoming = normalizeOptions(raws);
      const more = hasNextPage(raws, incoming, this.opts.pageParam);
      this.searchState = null;
      if (page === 1) this._store(term, incoming, more);
      this._applyResult(incoming, { append: page > 1, more });
    } catch (e) {
      if (e.name === 'AbortError' || control.signal.aborted) return;
      // Falha ao carregar mais nao apaga a pagina que ja esta na tela: so para de pedir.
      if (page > 1) { this._hasMore = false; this._more?.remove(); return; }
      this.searchState = 'error';
      this._renderMenu();
    } finally {
      if (this._control === control) { this._control = null; this._more = null; }
    }
  }

  async _fetchUrl(term, signal, page = 1) {
    const url = new URL(this.opts.url, location.href);
    url.searchParams.set(this.opts.queryParam, term);
    if (page > 1 && this.opts.pageParam) url.searchParams.set(this.opts.pageParam, String(page));
    const r = await fetch(url, { signal, headers: { Accept: 'application/json' } });
    if (!r.ok) throw new Error(`O servidor respondeu ${r.status}`);
    return r.json();
  }

  /**
   * Proxima pagina ao chegar perto do fim da lista. Carregar de uma vez os
   * dez mil registros e o que trava a pagina; vinte por vez, nao.
   *
   * O "Buscando..." entra no fim da lista, sem redesenhar: redesenhar esvaziava
   * a lista, e a rolagem voltava ao topo a cada pagina.
   */
  _onListScroll() {
    if (!this.remote || !this._hasMore || this.searchState || this._more) return;
    const l = this.list;
    if (l.scrollTop + l.clientHeight < l.scrollHeight - 48) return;
    this._fetch(this.query.trim(), { page: ++this._page });
    this._more = l.appendChild(loadingRow(this.opts.loadingText));
  }

  _chosen() {
    return this.items.filter((i) => i.selected);
  }

  /* ---------------------------------------------------------------- *
   * Render                                                            *
   * ---------------------------------------------------------------- */

  _renderControl() {
    const chosen = this._chosen();
    for (const n of [...this.values.children]) if (n !== this.search) n.remove();

    if (this.multiple) {
      for (const item of chosen) {
        this.values.insertBefore(el('span', { class: 'tuc-select__tag' }, [
          el('span', { class: 'tuc-select__tagtext', text: item.label }),
          el('button', {
            type: 'button', class: 'tuc-select__tagx', tabindex: -1,
            'aria-label': T.remove(item.label),
            onclick: (e) => { e.stopPropagation(); this._toggleItem(item); },
          }, [icon(ICON_X, 12)]),
        ]), this.search);
      }
    } else if (chosen.length && !this.query) {
      this.values.insertBefore(
        el('span', { class: 'tuc-select__single', text: chosen[0].label }), this.search);
    }

    const empty = !chosen.length && !this.query;
    // Placeholder no input: some assim que existe tag ou rotulo ao lado.
    this.search.placeholder = empty
      ? this.opts.placeholder
      : (this.isOpen && this.opts.search ? this.opts.searchPlaceholder : '');
    this.control.classList.toggle('has-value', chosen.length > 0);
    this.search.readOnly = !this.opts.search;
    // Desativado no nativo, desativado na tela: antes a busca aceitava texto e o
    // Backspace e o X limpavam um campo que o formulario nem envia.
    this.search.disabled = this.native.disabled;
    this.control.classList.toggle('is-disabled', this.native.disabled);
  }

  _filtered() {
    // No modo remoto o servidor ja devolveu o recorte: filtrar de novo
    // esconderia resultados que ele considerou relevantes.
    if (this.remote) return this.items;
    // O termo passa pela mesma normalizacao das opcoes: so elas perdiam o
    // acento, e "são" digitado nao achava "São Paulo".
    const q = normalize(this.query);
    return q ? this.items.filter((i) => i.search.includes(q)) : this.items;
  }

  _renderMenu() {
    const visible = this._filtered();
    const list = this.list;
    list.replaceChildren();

    if (this.searchState === 'loading') {
      list.append(loadingRow(this.opts.loadingText));
    } else if (this.searchState === 'error') {
      list.append(el('div', { class: 'tuc-select__empty is-error', text: this.opts.errorText }));
    } else if (!visible.length) {
      list.append(el('div', {
        class: 'tuc-select__empty',
        text: this.remote && this.query.trim().length < this.opts.minChars
          ? T.typeToSearch(this.opts.minChars)
          : this.opts.emptyText,
      }));
    } else {
      let currentGroup = null;
      visible.forEach((item, i) => {
        if (item.group && item.group !== currentGroup) {
          currentGroup = item.group;
          list.append(el('div', { class: 'tuc-select__group', text: item.group, role: 'presentation' }));
        }
        list.append(el('div', {
          class: `tuc-select__option${item.selected ? ' is-selected' : ''}${item.disabled ? ' is-disabled' : ''}`,
          role: 'option',
          id: `${this.id}-opt-${i}`,
          'aria-selected': item.selected ? 'true' : 'false',
          'aria-disabled': item.disabled ? 'true' : null,
        }, [
          el('span', { class: 'tuc-select__label', text: item.label }),
          item.selected ? el('span', { class: 'tuc-select__check' }, [icon(ICON_CHECK, 15)]) : null,
        ]));
      });
    }
    this._paintActive();
  }

  /**
   * Move o destaque sem refazer a lista — mesma razao do calendario. Sem opcao
   * ativa na tela o aria-activedescendant sai: apontava para um id que nao
   * existia mais, com a busca sem resultado ou com a lista fechada.
   */
  _paintActive() {
    for (const n of this.list.querySelectorAll('.is-active')) n.classList.remove('is-active');
    const id = `${this.id}-opt-${this.activeIndex}`;
    const node = this.list.querySelector(`[id="${id}"]`);
    if (node) {
      node.classList.add('is-active');
      this.search.setAttribute('aria-activedescendant', id);
    } else {
      this.search.removeAttribute('aria-activedescendant');
    }
    return node;
  }

  _scrollToActive() {
    const node = this._paintActive();
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
      if (!item.selected && this.opts.maxItems && this._chosen().length >= this.opts.maxItems) return;
      item.selected = !item.selected;
    } else if (item.selected) {
      // Reescolher a opcao que ja estava escolhida nao e mudanca: o nativo nao
      // dispara change nesse caso, e o hx-trigger="change" fazia uma requisicao a toa.
      if (this.opts.closeOnSelect) this.close();
      return;
    } else {
      for (const i of this.items) i.selected = i === item;
    }
    this._pushToNative();
    this.query = '';
    this.search.value = '';
    this._renderControl();
    this._emit();

    if (this.opts.closeOnSelect) this.close();
    else if (this.isOpen) {
      // A busca zera ao escolher: o destaque segue a opcao na lista inteira, e
      // nao o indice que ela tinha na filtrada — senao o Enter seguinte marcava outra.
      this.activeIndex = this._filtered().indexOf(item);
      this._renderMenu();
      this._scrollToActive();
    }
    // O X da tag some junto com a tag, e levava o foco para o body.
    this.search.focus();
  }

  _onKeydown(e) {
    const { key } = e;
    const visible = this._filtered();
    if (key === 'ArrowDown' || key === 'ArrowUp' || (this.isOpen && (key === 'Home' || key === 'End'))) {
      e.preventDefault();
      if (!this.isOpen) return this.open();
      /*
       * Setas dao a volta; Home e End partem de fora das pontas. Todos pulam as
       * desativadas — o Home caia numa opcao desativada. E a seta para cima sem
       * nada ativo parte do fim: partindo do -1 ela caia na penultima.
       */
      const len = visible.length;
      const step = key === 'ArrowDown' || key === 'Home' ? 1 : -1;
      const from = key === 'Home' ? -1 : (key === 'End' || (step < 0 && this.activeIndex < 0)) ? len : this.activeIndex;
      for (let n = 1; n <= len; n++) {
        const i = (((from + step * n) % len) + len) % len;
        if (!visible[i].disabled) { this.activeIndex = i; break; }
      }
      this._scrollToActive();
    } else if (key === 'Enter' || key === ' ') {
      /*
       * Fechado, Enter e Espaco abrem — antes o campo so respondia a seta, e
       * quem chegava de Tab ficava sem saber como entrar na lista.
       *
       * O Espaco tem a ressalva de que o foco esta num campo de busca: com
       * texto digitado ele e digitacao, senao seria impossivel escrever
       * "Sao Paulo". Fechado o campo esta sempre vazio, entao nao ha conflito.
       */
      if (!this.isOpen) {
        if (key === ' ' && this.search.value) return;
        e.preventDefault();
        return this.open();
      }
      if (key === ' ') return;
      e.preventDefault();
      const item = visible[this.activeIndex];
      if (item) this._toggleItem(item);
    } else if (key === 'Backspace' && !this.search.value && this.multiple) {
      // Campo de busca vazio: apagar remove a ultima tag, como em qualquer editor de tags.
      // A ultima que se pode tirar: uma opcao desativada escolhida travava o Backspace nela.
      // O Escape nao passa por aqui: com a lista aberta quem o trata e o Popover.
      const last = this._chosen().filter((i) => !i.disabled).pop();
      if (last) this._toggleItem(last);
    } else if ((key === 'Backspace' || key === 'Delete') && !this.search.value && !this.multiple) {
      /*
       * No simples, apagar com a busca vazia limpa o valor — o mesmo que o X faz.
       * Antes so o multiplo respondia: quem tabulava ate um select preenchido e
       * apertava Backspace nao conseguia esvaziar sem pegar o mouse. Com
       * `clearable: false` o X nao existe, e o teclado tambem nao limpa.
       */
      if (this.opts.clearable && this.getValue() !== null) {
        e.preventDefault();
        this.clear();
      }
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

/** Indice da opcao sob o evento, lido do id (`sel-…-opt-12`); -1 fora de uma opcao. */
function optionIndex(target) {
  const node = target.closest('[role=option]');
  return node ? +node.id.slice(node.id.lastIndexOf('-') + 1) : -1;
}

function loadingRow(text) {
  return el('div', { class: 'tuc-select__empty is-loading' }, [
    el('span', { class: 'tuc-spinner', 'aria-hidden': 'true' }), text]);
}

/** Texto do <label>, sem o texto das opcoes do select que mora dentro dele. */
function labelText(label) {
  const copy = label.cloneNode(true);
  for (const n of copy.querySelectorAll('select')) n.remove();
  return copy.textContent.trim();
}

/**
 * Aceita os formatos documentados, e so eles: [{value,label}], ["a","b"],
 * {results:[...]} do DRF e {id,text} do Select2 — para nao obrigar o servidor
 * a mudar so por causa daqui. Sem o campo `search`: o modo remoto nao filtra no
 * cliente, e a normalizacao de cada item era trabalho jogado fora.
 */
function normalizeOptions(data) {
  const list = Array.isArray(data) ? data : (data?.results ?? []);
  return list.map((o) => {
    if (typeof o !== 'object') o = { value: o };
    const value = String(o?.value ?? o?.id ?? '');
    return { value, label: String(o?.label ?? o?.text ?? value), disabled: !!o?.disabled, group: o?.group ?? null, selected: false };
  }).filter((o) => o.value !== '');
}

/**
 * Ha mais paginas? O DRF diz em `next`. Sem essa pista, so da para supor: uma
 * pagina que veio vazia acabou; uma que veio cheia pode ter mais.
 */
function hasNextPage(raws, items, pageParam) {
  if (!pageParam) return false;
  if (raws && typeof raws === 'object' && 'next' in raws) return !!raws.next;
  return items.length > 0;
}

function readOptions(select) {
  return [...select.options]
    // <option value=""> e placeholder, nao opcao: fica fora da lista.
    .filter((o) => o.value !== '')
    .map((o) => ({
      value: o.value,
      label: o.textContent.trim(),
      // :disabled pega tambem a <optgroup disabled>, que o `o.disabled` ignora.
      disabled: o.matches(':disabled'),
      group: o.parentElement.tagName === 'OPTGROUP' ? o.parentElement.label : null,
      selected: o.selected,
      // Normaliza acentos: buscar "sao" acha "São Paulo".
      search: normalize(`${o.textContent} ${o.value}`),
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


export function autoInit(scope = document) {
  const out = [];
  for (const node of scope.querySelectorAll('select[data-tuc-select]:not([data-tuc-ready])')) {
    const d = node.dataset;
    node.setAttribute('data-tuc-ready', '');
    out.push(new Select(node, {
      // data-placeholder nao entra aqui: o construtor ja o le do proprio elemento.
      search: d.search === 'true' ? true : d.search === 'false' ? false : undefined,
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
