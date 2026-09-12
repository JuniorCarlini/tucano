import { nextId, omitUndefined, on } from '../core/dom.js';

/*
 * Abas.
 *
 * O template ja traz as classes, a aba inicial marcada e os outros paineis com
 * `hidden`, entao a pagina nasce certa antes do script. O que fica aqui e o que
 * HTML nao da: os papeis que fazem o leitor de tela anunciar "aba, 2 de 4", a
 * ligacao entre aba e painel, e o teclado do padrao do ARIA APG.
 *
 * O teclado segue o APG: a lista inteira e uma parada so do Tab, e dentro dela
 * quem anda sao as setas. Sem isso, quem navega por teclado atravessaria todas
 * as abas antes de chegar ao conteudo da aberta.
 */

const DEFAULTS = {
  selected: null,   // indice da aba inicial; sem ele vale a marcada com aria-selected="true", ou a primeira
  manual: false,    // setas so movem o foco, e Enter ou Espaco trocam o painel — para painel que carrega por HTMX
  onChange: null,   // (index, detail) a cada troca feita pela pessoa ou por select()
};

const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"]), [contenteditable]';

export class Tabs {
  constructor(target, options = {}) {
    this.node = typeof target === 'string' ? document.querySelector(target) : target;
    if (!this.node) throw new Error('[Tabs] elemento não encontrado');
    this.list = this.node.querySelector(':scope > .tuc-tabs__list');
    if (!this.list) throw new Error('[Tabs] faltou o .tuc-tabs__list');
    this.opts = { ...DEFAULTS, ...omitUndefined(options) };
    this._cleanups = [];
    this._build();
  }

  /* `:scope >` porque aba dentro de painel e de outro conjunto de abas. */
  get tabs() {
    return [...this.list.querySelectorAll(':scope > .tuc-tabs__tab')];
  }

  get panels() {
    return [...this.node.querySelectorAll(':scope > .tuc-tabs__panel')];
  }

  /** Indice da aba aberta, ou -1. */
  get index() {
    return this.tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
  }

  _build() {
    this.node.classList.add('tuc-tabs');
    this.node._tucano = this;
    this.list.setAttribute('role', 'tablist');

    const base = this.node.id || nextId('tuc-tabs');
    const panels = this.panels;
    this.tabs.forEach((tab, i) => {
      // Sem type, um <button> dentro de <form> envia o formulario ao trocar de aba.
      if (tab.tagName === 'BUTTON' && !tab.hasAttribute('type')) tab.type = 'button';
      tab.id ||= `${base}-tab-${i}`;
      tab.setAttribute('role', 'tab');
      const panel = panels[i];
      if (!panel) return;
      panel.id ||= `${base}-panel-${i}`;
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', tab.id);
      tab.setAttribute('aria-controls', panel.id);
      // O APG pede o painel focavel para o Tab chegar ao conteudo — mas so quando
      // nao ha nada focavel dentro, senao seria uma parada inutil antes do campo.
      if (!panel.hasAttribute('tabindex') && !panel.querySelector(FOCUSABLE)) panel.tabIndex = 0;
    });

    this._cleanups.push(
      on(this.list, 'click', (e) => {
        const tab = e.target.closest('.tuc-tabs__tab');
        if (tab && this._enabled(tab)) this.select(this.tabs.indexOf(tab));
      }),
      on(this.list, 'keydown', (e) => this._onKey(e)),
    );

    const marked = this.index;
    const first = this.tabs.findIndex((t) => this._enabled(t));
    this.select(this.opts.selected ?? (marked >= 0 ? marked : Math.max(first, 0)), { silent: true });
  }

  _enabled(tab) {
    return !tab.disabled && tab.getAttribute('aria-disabled') !== 'true';
  }

  select(index, { silent = false } = {}) {
    const tabs = this.tabs;
    const tab = tabs[index];
    if (!tab || !this._enabled(tab)) return this;
    const before = this.index;

    tabs.forEach((t, i) => {
      t.setAttribute('aria-selected', String(i === index));
      // Uma parada so do Tab: a aba aberta. As outras se alcancam pelas setas.
      t.tabIndex = i === index ? 0 : -1;
    });
    this.panels.forEach((p, i) => { p.hidden = i !== index; });

    if (!silent && before !== index) this._emit();
    return this;
  }

  _onKey(e) {
    const usable = this.tabs.filter((t) => this._enabled(t));
    const current = usable.indexOf(document.activeElement);
    if (current < 0) return;

    let next = null;
    if (e.key === 'ArrowRight') next = (current + 1) % usable.length;
    else if (e.key === 'ArrowLeft') next = (current - 1 + usable.length) % usable.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = usable.length - 1;
    if (next === null) return;

    e.preventDefault();
    const target = usable[next];
    target.focus();
    // A lista rola na horizontal quando nao cabe; a aba focada tem de aparecer.
    target.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    // No modo manual quem troca e o Enter ou o Espaco, que no <button> ja viram
    // clique sozinhos — nao ha tecla para tratar aqui.
    if (!this.opts.manual) this.select(this.tabs.indexOf(target));
  }

  _emit() {
    const value = this.index;
    const detail = { value, tab: this.tabs[value], panel: this.panels[value], instance: this };
    this.opts.onChange?.(value, detail);
    this.node.dispatchEvent(new CustomEvent('tucano:change', { detail, bubbles: true }));
  }

  destroy() {
    this._cleanups.forEach((fn) => fn());
    this._cleanups = [];
    delete this.node._tucano;
  }
}

export function autoInit(scope = document) {
  const out = [];
  for (const node of scope.querySelectorAll('[data-tuc-tabs]:not([data-tuc-ready])')) {
    node.setAttribute('data-tuc-ready', '');
    out.push(new Tabs(node, { manual: node.dataset.manual === 'true' }));
  }
  return out;
}
