import { el, icon, omitUndefined, on, openWithTransition } from '../core/dom.js';
import { Popover } from '../core/popover.js';

/*
 * Menu suspenso ancorado num gatilho.
 *
 * A parte dificil ja estava pronta no Popover: virar de lado quando nao cabe,
 * nao vazar da tela, fechar ao clicar fora e no Escape. Aqui fica o que e
 * proprio de um menu — teclado, papeis de acessibilidade e o que acontece ao
 * escolher um item.
 *
 * O foco vai para dentro do menu ao abrir e volta para o gatilho ao fechar. Sem
 * isso, quem navega por teclado abre o menu e continua no botao: as setas nao
 * chegam aos itens, e fechar deixa o foco no comeco da pagina.
 */

const DEFAULTS = {
  placement: 'bottom-start',
  items: null,       // [{ text, icon, shortcut, onClick, href, variant, disabled }]
                     // ou { separator: true }, ou { label } para um titulo de grupo
                     // ou { separator: true } / { label: 'Seção' }
  closeOnPick: true,
};

const FOCUSABLE = '.tuc-dropdown__item:not([disabled]):not([aria-disabled="true"])';


export class Dropdown {
  constructor(trigger, options = {}) {
    this.trigger = typeof trigger === 'string' ? document.querySelector(trigger) : trigger;
    if (!this.trigger) throw new Error('[Dropdown] gatilho não encontrado');
    this.opts = { ...DEFAULTS, ...omitUndefined(options) };
    this._cleanups = [];
    this._build();
  }

  _build() {
    this.panel = this.opts.panel ?? el('div', { class: 'tuc-dropdown', role: 'menu' },
      (this.opts.items ?? []).map((i) => this._item(i)));
    this.panel.classList.add('tuc-dropdown');
    this.panel.setAttribute('role', 'menu');

    this.trigger.setAttribute('aria-haspopup', 'menu');
    this.trigger.setAttribute('aria-expanded', 'false');

    this._cleanups.push(
      on(this.trigger, 'click', (e) => { e.preventDefault(); this.toggle(); }),
      on(this.trigger, 'keydown', (e) => {
        // Seta para baixo abre e ja entra no primeiro item, como manda o padrao
        // de menu — quem chega por teclado nao deveria precisar de Enter antes.
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          this.open();
          this._move(e.key === 'ArrowUp' ? -1 : 0, true);
        }
      }),
      on(this.panel, 'keydown', (e) => this._onKey(e)),
      on(this.panel, 'click', (e) => {
        const item = e.target.closest('.tuc-dropdown__item');
        if (!item || item.hasAttribute('aria-disabled')) return;
        if (this.opts.closeOnPick) this.close();
      }),
    );

    this.trigger._tucano = this;
    this.panel._tucano = this;
  }

  _item(data) {
    if (data.separator) return el('hr', { class: 'tuc-dropdown__separator', role: 'separator' });
    if (data.label) return el('div', { class: 'tuc-dropdown__label', text: data.label });

    const tag = data.href ? 'a' : 'button';
    const children = [];
    if (data.icon) children.push(el('span', { class: 'tuc-dropdown__icon', 'aria-hidden': 'true' }, [icon(data.icon, 15)]));
    children.push(el('span', { class: 'tuc-dropdown__text', text: data.text ?? '' }));
    if (data.shortcut) children.push(el('span', { class: 'tuc-dropdown__shortcut', text: data.shortcut }));

    return el(tag, {
      class: `tuc-dropdown__item${data.variant ? ` is-${data.variant}` : ''}`,
      role: 'menuitem',
      // tabindex -1 de proposito: quem navega e a seta, nao o Tab. Deixar os
      // itens tabulaveis faria o Tab sair do menu item a item.
      tabindex: '-1',
      ...(data.href ? { href: data.href } : { type: 'button' }),
      ...(data.disabled ? { 'aria-disabled': 'true' } : {}),
      ...(data.disabled ? {} : { onclick: () => data.onClick?.(this) }),
    }, children);
  }

  get items() {
    return [...this.panel.querySelectorAll(FOCUSABLE)];
  }

  _move(step, absolute = false) {
    const items = this.items;
    if (!items.length) return;
    const current = items.indexOf(document.activeElement);
    let i;
    if (absolute) i = step < 0 ? items.length - 1 : 0;
    else i = (current + step + items.length) % items.length;
    items[i]?.focus();
  }

  _onKey(e) {
    const keys = {
      ArrowDown: () => this._move(1),
      ArrowUp: () => this._move(-1),
      Home: () => this._move(0, true),
      End: () => this._move(-1, true),
      Escape: () => this.close(),
      Tab: () => this.close(),
    };
    const action = keys[e.key];
    if (!action) return;
    if (e.key !== 'Tab') e.preventDefault();
    action();
  }

  open() {
    if (this.isOpen) return this;
    this.isOpen = true;
    this.trigger.setAttribute('aria-expanded', 'true');
    this.popover = new Popover(this.trigger, this.panel, {
      placement: this.opts.placement,
      offset: 6,
      closeIfDetached: true,
      closeOnFocusOut: true,
      onDismiss: () => this.close(),
    });
    this.popover.show();
    openWithTransition(this.panel);
    this._move(0, true);
    return this;
  }

  close() {
    if (!this.isOpen) return this;
    this.isOpen = false;
    this.trigger.setAttribute('aria-expanded', 'false');
    this.panel.classList.remove('is-open');
    this.popover?.destroy();
    this.popover = null;
    // O foco volta para o gatilho: fechar um menu nao deveria largar quem
    // navega por teclado no comeco da pagina.
    if (this.panel.contains(document.activeElement)) {
      this.trigger.focus({ preventScroll: true });
    }
    return this;
  }

  toggle() { return this.isOpen ? this.close() : this.open(); }

  destroy() {
    this.close();
    this._cleanups.forEach((fn) => fn());
    this._cleanups = [];
  }
}

/**
 * Menus escritos no template — o caminho quando os itens vêm do servidor:
 *
 *   <button data-tuc-dropdown="#acoes">Ações</button>
 *   <div class="tuc-dropdown" id="acoes" hidden>
 *     <button class="tuc-dropdown__item">Editar</button>
 *   </div>
 */
export function autoInit(scope = document) {
  const out = [];
  for (const trigger of scope.querySelectorAll('[data-tuc-dropdown]:not([data-tuc-ready])')) {
    trigger.setAttribute('data-tuc-ready', '');
    const panel = document.querySelector(trigger.dataset.tucDropdown);
    if (!panel) continue;
    panel.hidden = false;   // quem esconde agora e o popover, tirando do fluxo
    panel.remove();
    for (const item of panel.querySelectorAll('.tuc-dropdown__item')) {
      item.setAttribute('role', 'menuitem');
      item.setAttribute('tabindex', '-1');
    }
    out.push(new Dropdown(trigger, {
      panel,
      placement: trigger.dataset.placement || undefined,
    }));
  }
  return out;
}
