import { el, icon, ICONS, nextId, on } from '../core/dom.js';
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
    this.opts.search = this.opts.search ?? this.items.length >= this.opts.searchMinItems;

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
    this.items = readOptions(this.native);
    this._renderControl();
    if (this.isOpen) this._renderMenu();
  }

  open() {
    if (this.isOpen || this.native.disabled) return;
    this.isOpen = true;
    this.query = '';
    this.search.value = '';
    this.activeIndex = this.items.findIndex((i) => i.selected && !i.disabled);
    this._renderMenu();

    this.popover = new Popover(this.control, this.menu, {
      placement: this.opts.placement,
      appendTo: this.opts.appendTo || document.body,
      matchWidth: true,
      onDismiss: () => this.close(),
    });
    this.popover.show();
    requestAnimationFrame(() => this.menu.classList.add('is-open'));
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
        this.activeIndex = this._filtered().findIndex((i) => !i.disabled);
        this._renderMenu();
        this._renderControl();
      }),
      on(this.search, 'keydown', (e) => this._onKeydown(e)),
      // Se o valor mudar por fora (reset de formulario, JS de terceiros).
      on(this.native, 'change', () => { if (!this._pushing) this._syncFromNative(); }),
    );
  }

  _syncFromNative() {
    const escolhidos = new Set([...this.native.selectedOptions].map((o) => o.value));
    for (const item of this.items) item.selected = escolhidos.has(item.value);
    this._renderControl();
  }

  _pushToNative() {
    this._pushing = true;
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
    const q = this.query.trim().toLowerCase();
    if (!q) return this.items;
    return this.items.filter((i) => i.busca.includes(q));
  }

  _renderMenu() {
    const visiveis = this._filtered();
    this.list.replaceChildren();

    if (!visiveis.length) {
      this.list.append(el('div', { class: 'tuc-select__empty', text: this.opts.emptyText }));
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
      closeOnSelect: d.closeOnSelect === 'false' ? false : d.closeOnSelect === 'true' ? true : undefined,
    }));
  }
  return out;
}
