import { el, nextId } from '../core/dom.js';
import { Dialog, buildPanel, withoutUndefined } from '../core/dialog.js';

/*
 * Gaveta (off-canvas): dialogo encostado numa borda.
 *
 * Divide com o modal a mecanica do <dialog> — top layer, foco preso, Escape,
 * devolver o foco a quem abriu —, que mora em core/dialogo.js. O que e proprio
 * daqui e a geometria e o movimento: a caixa ocupa o eixo inteiro da borda em
 * que encosta, e entra deslizando de fora em vez de crescer no lugar, porque e
 * assim que uma gaveta diz de onde veio.
 */

const DEFAULTS = {
  title: null,
  text: '',
  side: 'right',     // left | right | top | bottom
  size: 'md',       // sm | md | lg — nas laterais, largura da coluna
  tone: 'default',       // default | danger | success | warning
  closable: true,
  closeOnBackdrop: true,
  actions: null,
  onClose: null,
  className: '',
};

export class Drawer extends Dialog {
  constructor(options = {}) {
    super();
    this.opts = { ...DEFAULTS, ...withoutUndefined(options) };
    this.id = nextId('drawer');
    this._cleanups = [];
    this._build();
  }

  _build() {
    const titleId = `${this.id}-title`;
    this.panel = buildPanel('tuc-drawer', this.opts, this, titleId);

    this.node = el('dialog', {
      class: [
        'tuc-drawer',
        `is-${this.opts.side}`,
        `is-${this.opts.size}`,
        `is-${this.opts.tone}`,
        this.opts.className,
      ].filter(Boolean).join(' '),
      id: this.id,
      ...(this.opts.title ? { 'aria-labelledby': titleId } : {}),
    }, [this.panel]);

    this.body = this.panel.querySelector('.tuc-drawer__body');
    this.node._tucano = this;
  }
}

/** Atalho: cria e abre num passo. */
export function drawer(optionsOrText, extra = {}) {
  const base = typeof optionsOrText === 'string' ? { text: optionsOrText } : optionsOrText;
  return new Drawer({ ...base, ...extra }).open();
}

/**
 * Gavetas escritas no template — o caminho quando o conteudo vem do servidor:
 *
 *   <dialog class="tuc-drawer is-right" id="filtros"> ... </dialog>
 *   <button data-tuc-drawer="#filtros">Filtros</button>
 */
export function autoInit(scope = document) {
  const out = [];

  for (const node of scope.querySelectorAll('dialog.tuc-drawer:not([data-tuc-ready])')) {
    node.setAttribute('data-tuc-ready', '');
    const d = node.dataset;
    const g = Object.create(Drawer.prototype);
    g.opts = { ...DEFAULTS, closable: d.closable !== 'false', closeOnBackdrop: d.backdrop !== 'false' };
    g.id = node.id || nextId('drawer');
    g._cleanups = [];
    g.panel = node.querySelector('.tuc-drawer__panel');
    g.body = node.querySelector('.tuc-drawer__body');
    g._adopt(node);

    for (const b of node.querySelectorAll('[data-tuc-drawer-close]')) {
      b.addEventListener('click', () => g.close('botao'));
    }
    out.push(g);
  }

  for (const trigger of scope.querySelectorAll('[data-tuc-drawer]:not([data-tuc-ready])')) {
    trigger.setAttribute('data-tuc-ready', '');
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelector(trigger.dataset.tucDrawer)?._tucano?.open();
    });
  }

  return out;
}
