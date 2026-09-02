import { el, nextId, on } from '../core/dom.js';
import { Popover } from '../core/popover.js';

const DEFAULTS = {
  text: '',
  placement: 'top-center',
  delay: 350,        // atraso ao apontar: evita piscar ao passar o mouse de raspao
  delayOut: 120,
  maxWidth: '16rem',
};

let aberto = null;   // so um por vez

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

    this.painel = el('div', {
      class: 'tuc-tip',
      role: 'tooltip',
      id: this.id,
      style: `max-width:${this.opts.maxWidth}`,
      text: this.opts.text,
    });

    // Anunciado como descricao do proprio elemento: e o que faz o leitor de
    // tela ler a dica junto com o botao, sem virar um elemento perdido.
    node.setAttribute('aria-describedby', this.id);
    if (!node.hasAttribute('tabindex') && !FOCAVEL.test(node.tagName)) node.tabIndex = 0;

    const toque = () => window.matchMedia?.('(pointer: coarse)').matches;

    this._cleanups.push(
      on(node, 'pointerenter', (e) => { if (e.pointerType !== 'touch') this._agendar(true); }),
      on(node, 'pointerleave', (e) => { if (e.pointerType !== 'touch') this._agendar(false); }),
      on(node, 'focusin', () => this._mostrar()),
      on(node, 'focusout', () => this._esconder()),
      on(node, 'click', () => { if (toque()) this.aberto ? this._esconder() : this._mostrar(); }),
      on(document, 'keydown', (e) => { if (e.key === 'Escape' && this.aberto) this._esconder(); }),
    );

    node._tucano = this;
  }

  _agendar(mostrar) {
    clearTimeout(this._timer);
    this._timer = setTimeout(
      () => (mostrar ? this._mostrar() : this._esconder()),
      mostrar ? this.opts.delay : this.opts.delayOut,
    );
  }

  _mostrar() {
    if (this.aberto) return;
    if (aberto && aberto !== this) aberto._esconder();
    this.aberto = true;
    aberto = this;
    this.popover = new Popover(this.anchor, this.painel, {
      placement: this.opts.placement,
      offset: 6,
      onDismiss: () => this._esconder(),
    });
    this.popover.show();
    requestAnimationFrame(() => this.painel.classList.add('is-open'));
  }

  _esconder() {
    clearTimeout(this._timer);
    if (!this.aberto) return;
    this.aberto = false;
    if (aberto === this) aberto = null;
    this.painel.classList.remove('is-open');
    this.popover?.destroy();
    this.popover = null;
  }

  setText(texto) {
    this.opts.text = texto;
    this.painel.textContent = texto;
  }

  destroy() {
    this._esconder();
    this._cleanups.forEach((fn) => fn());
    this._cleanups = [];
    this.anchor.removeAttribute('aria-describedby');
    delete this.anchor._tucano;
  }
}

const FOCAVEL = /^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/;

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
    }));
  }
  return out;
}
