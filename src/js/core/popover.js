import { on } from './dom.js';

/** Espelha --tuc-duration-out do CSS; os dois precisam concordar. */
const DURACAO_SAIDA = 170;

/**
 * Posiciona um painel flutuante ancorado num elemento.
 * Escolhe lado com base no espaco disponivel (flip) e desloca no eixo
 * horizontal para nao vazar da viewport (shift). Nao usa dependencia externa.
 */
export class Popover {
  constructor(anchor, panel, options = {}) {
    this.anchor = anchor;
    this.panel = panel;
    this.placement = options.placement || 'bottom-start';
    this.offset = options.offset ?? 8;
    this.padding = options.padding ?? 8;
    this.appendTo = options.appendTo || document.body;
    // Menu de select acompanha a largura do campo; calendario nao.
    this.matchWidth = options.matchWidth || false;
    this.onDismiss = options.onDismiss || (() => {});
    this.open = false;
    this._cleanups = [];
    this._reposition = this._reposition.bind(this);
  }

  show() {
    if (this.open) return;
    this.open = true;

    clearTimeout(this._saida);
    this.panel.classList.remove('is-closing');
    this.panel.style.position = 'absolute';
    this.panel.style.top = '0';
    this.panel.style.left = '0';
    this.panel.style.margin = '0';
    this.appendTo.append(this.panel);
    this._reposition();

    // `capture` para reagir a scroll de qualquer ancestral, nao so da janela.
    this._cleanups.push(
      on(window, 'scroll', this._reposition, true),
      on(window, 'resize', this._reposition),
      on(document, 'pointerdown', (e) => {
        if (!this.panel.contains(e.target) && !this.anchor.contains(e.target)) this.onDismiss('outside');
      }, true),
      on(document, 'keydown', (e) => {
        if (e.key === 'Escape') { e.stopPropagation(); this.onDismiss('escape'); }
      }, true),
    );

    if (typeof ResizeObserver !== 'undefined') {
      this._ro = new ResizeObserver(this._reposition);
      this._ro.observe(this.panel);
      this._ro.observe(this.anchor);
    }
  }

  /**
   * `animar` mantem o painel no DOM pelo tempo da transicao de saida. Sem
   * isso ele desaparece no mesmo quadro, e so a entrada tem movimento — o
   * fechamento fica seco em comparacao.
   */
  hide({ animar = true } = {}) {
    if (!this.open) return;
    this.open = false;
    this._cleanups.forEach((fn) => fn());
    this._cleanups = [];
    this._ro?.disconnect();
    this._ro = null;

    clearTimeout(this._saida);
    if (!animar) { this.panel.classList.remove('is-closing'); this.panel.remove(); return; }

    this.panel.classList.add('is-closing');
    this._saida = setTimeout(() => {
      this.panel.classList.remove('is-closing');
      this.panel.remove();
    }, DURACAO_SAIDA);
  }

  destroy() {
    this.hide();
  }

  _reposition() {
    if (!this.open) return;
    const a = this.anchor.getBoundingClientRect();
    if (this.matchWidth) this.panel.style.minWidth = `${Math.round(a.width)}px`;

    /*
     * offset* em vez de getBoundingClientRect: o painel abre com `scale(.98)`
     * pela animacao, e o rect devolve a caixa ja transformada. Posicionar por
     * ela deixa o painel deslocado pela metade da diferenca de escala — e o
     * deslocamento some quando a animacao termina, o que dificulta perceber.
     */
    const p = { width: this.panel.offsetWidth, height: this.panel.offsetHeight };
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const [side, align = 'start'] = this.placement.split('-');

    // Flip vertical quando nao cabe embaixo mas cabe em cima.
    let placeSide = side;
    const spaceBelow = vh - a.bottom - this.offset;
    const spaceAbove = a.top - this.offset;
    if (side === 'bottom' && p.height > spaceBelow && spaceAbove > spaceBelow) placeSide = 'top';
    if (side === 'top' && p.height > spaceAbove && spaceBelow > spaceAbove) placeSide = 'bottom';

    let top = placeSide === 'top' ? a.top - p.height - this.offset : a.bottom + this.offset;

    let left;
    if (p.width >= vw * 0.85) {
      /*
       * Painel quase da largura da tela (celular): centra na viewport, nao na
       * ancora. Centrado no campo, o centro dele nao coincide com o centro da
       * tela e sobra folga diferente de cada lado — visivel quando so restam
       * alguns pixels em cada borda.
       */
      left = (vw - p.width) / 2;
    } else if (align === 'end') {
      left = a.right - p.width;
    } else if (align === 'center') {
      left = a.left + a.width / 2 - p.width / 2;
    } else {
      left = a.left;
    }

    // Shift: mantem dentro da viewport com uma folga.
    left = Math.min(Math.max(left, this.padding), Math.max(this.padding, vw - p.width - this.padding));
    top = Math.min(Math.max(top, this.padding), Math.max(this.padding, vh - p.height - this.padding));

    const host = this.appendTo === document.body
      ? { top: window.scrollY, left: window.scrollX }
      : (() => {
          const r = this.appendTo.getBoundingClientRect();
          return { top: -r.top + this.appendTo.scrollTop, left: -r.left + this.appendTo.scrollLeft };
        })();

    this.panel.style.transform = `translate(${Math.round(left + host.left)}px, ${Math.round(top + host.top)}px)`;
    this.panel.dataset.side = placeSide;
  }
}

/**
 * Mantem o foco dentro do painel enquanto ele esta aberto.
 * Devolve so a funcao de release — devolver o foco e decisao de quem chama,
 * porque depende de como o painel foi fechado (tecla, selecao ou clique fora).
 */
export function trapFocus(panel) {
  const SELECTOR = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';
  const handler = (e) => {
    if (e.key !== 'Tab') return;
    const items = [...panel.querySelectorAll(SELECTOR)].filter((n) => n.offsetParent !== null);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  return on(panel, 'keydown', handler);
}
