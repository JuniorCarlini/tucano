import { openWithTransition, el, nextId, on } from '../core/dom.js';
import { Popover } from '../core/popover.js';

const DEFAULTS = {
  text: '',
  placement: 'top-center',
  delay: 350,        // atraso ao apontar: evita piscar ao passar o mouse de raspao
  delayOut: 120,
  maxWidth: '16rem',
  className: '',        // classe extra no balao, para variar a cor num caso so
};

let isOpen = null;   // so um por vez

/**
 * Dica de texto ancorada a um elemento.
 *
 * Aparece no `hover` e tambem no `focus`: um tooltip que so responde ao mouse
 * nao existe para quem navega por teclado.
 *
 * Em tela de toque nao ha hover, entao o toque abre e o proximo toque fora
 * fecha. Sem isso a dica simplesmente nunca apareceria no celular.
 *
 * `Escape` fecha mesmo com o ponteiro parado em cima, como pede a WCAG 1.4.13.
 */
export class Tooltip {
  constructor(target, options = {}) {
    const node = typeof target === 'string' ? document.querySelector(target) : target;
    if (!node) throw new Error('[Tooltip] elemento alvo nao encontrado');

    this.opts = { ...DEFAULTS, ...omitUndefined(options) };
    this.anchor = node;
    this.id = nextId('tip');
    this._cleanups = [];

    // O texto sai do title para nao aparecer a dica nativa por cima da nossa.
    if (!this.opts.text && node.title) {
      this.opts.text = node.title;
      node.removeAttribute('title');
    }
    if (!this.opts.text) throw new Error('[Tooltip] informe o texto');

    this.panel = el('div', {
      class: `tuc-tip${this.opts.className ? ` ${this.opts.className}` : ''}`,
      role: 'tooltip',
      id: this.id,
      style: `max-width:${this.opts.maxWidth}`,
    }, [
      el('span', { class: 'tuc-tip__text', text: this.opts.text }),
      // aria-hidden: a seta e desenho, e o leitor de tela ja recebe o texto.
      el('span', { class: 'tuc-tip__arrow', 'data-tuc-arrow': '', 'aria-hidden': 'true' }),
    ]);

    // Anunciado como descricao do proprio elemento: e o que faz o leitor de
    // tela ler a dica junto com o botao, sem virar um elemento perdido.
    node.setAttribute('aria-describedby', this.id);
    if (!node.hasAttribute('tabindex') && !FOCUSABLE.test(node.tagName)) node.tabIndex = 0;

    const toque = () => window.matchMedia?.('(pointer: coarse)').matches;

    this._cleanups.push(
      on(node, 'pointerenter', (e) => { if (e.pointerType !== 'touch') this._schedule(true); }),
      on(node, 'pointerleave', (e) => { if (e.pointerType !== 'touch') this._schedule(false); }),
      on(node, 'focusin', () => this._show()),
      on(node, 'focusout', () => this._hide()),
      on(node, 'click', () => { if (toque()) this.isOpen ? this._hide() : this._show(); }),
      on(document, 'keydown', (e) => { if (e.key === 'Escape' && this.isOpen) this._hide(); }),
    );

    node._tucano = this;
  }

  _schedule(show) {
    clearTimeout(this._timer);
    this._timer = setTimeout(
      () => (show ? this._show() : this._hide()),
      show ? this.opts.delay : this.opts.delayOut,
    );
  }

  _show() {
    if (this.isOpen) return;
    if (isOpen && isOpen !== this) isOpen._hide();
    this.isOpen = true;
    isOpen = this;
    this.popover = new Popover(this.anchor, this.panel, {
      placement: this.opts.placement,
      /*
       * 13 e nao 6 por causa da seta. Ela e um quadrado de 10px girado 45
       * graus: a diagonal da 14,1px, e metade disso — 7,1px — projeta para
       * fora do balao. Com o afastamento antigo a ponta encostava no gatilho,
       * e o que se via era a dica colada nele. 13 menos os 7 da seta deixam
       * uns 6px de respiro, que e o que o balao sozinho tinha antes.
       */
      offset: 13,
      closeIfDetached: true,
      onDismiss: () => this._hide(),
    });
    this.popover.show();
    openWithTransition(this.panel);
  }

  _hide() {
    clearTimeout(this._timer);
    if (!this.isOpen) return;
    this.isOpen = false;
    if (isOpen === this) isOpen = null;
    this.panel.classList.remove('is-open');
    this.popover?.destroy();
    this.popover = null;
  }

  setText(text) {
    this.opts.text = text;
    this.panel.textContent = text;
  }

  destroy() {
    this._hide();
    this._cleanups.forEach((fn) => fn());
    this._cleanups = [];
    this.anchor.removeAttribute('aria-describedby');
    delete this.anchor._tucano;
  }
}

const FOCUSABLE = /^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/;

function omitUndefined(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) if (v !== undefined) out[k] = v;
  return out;
}

export function autoInit(scope = document) {
  const out = [];
  for (const node of scope.querySelectorAll('[data-tuc-tip]:not([data-tuc-ready])')) {
    node.setAttribute('data-tuc-ready', '');
    out.push(new Tooltip(node, {
      text: node.dataset.tucTip || undefined,
      placement: node.dataset.placement || undefined,
      delay: node.dataset.delay ? +node.dataset.delay : undefined,
      className: node.dataset.tipClass || undefined,
    }));
  }
  return out;
}
