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
    /*
     * Fecha quando a ancora sai da viewport. Sem isto o painel continua sendo
     * preso na tela a cada rolagem e, com a ancora ja longe, ele desliza pela
     * pagina sozinho — parece um balao solto que atravessa a tela. Vale para
     * dica; um menu aberto prefere continuar visivel enquanto o campo apenas
     * encosta na borda.
     */
    this.fecharSeSolto = options.fecharSeSolto || false;
    this.fecharAoSairFoco = options.fecharAoSairFoco || false;
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
    // Procurado uma vez por abertura, nao a cada reposicionamento (que roda em
    // scroll e resize). Painel sem seta simplesmente nao tem o elemento.
    this._seta = this.panel.querySelector('[data-tuc-seta]');
    this._reposition();

    /*
     * _reposition pode ter fechado o popover agora mesmo, quando fecharSeSolto
     * esta ligado e a ancora ja nasce fora da tela. Sem esta guarda os
     * listeners abaixo seriam registrados depois do hide, e o hide seguinte
     * sairia cedo por `!this.open` sem nunca remove-los.
     */
    if (!this.open) return;

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

    /*
     * Fechar quando o foco vai para fora.
     *
     * Sem isto, andar de Tab pela pagina ia abrindo painel atras de painel e
     * nenhum fechava: o campo abre no foco, e o unico jeito de fechar era
     * clicar fora ou apertar Escape. Quem navega por teclado terminava com a
     * tela coberta de menus abertos.
     *
     * Ouvimos `focusin` no documento, e nao `focusout` na ancora: o
     * relatedTarget do focusout vem null no Safari e no Firefox quando o clique
     * cai num botao do painel, e ai o painel se fecharia sozinho no meio do
     * uso. Perguntar onde o foco chegou e sempre confiavel.
     *
     * Fica opcional porque nem todo painel quer isso: o tooltip aparece no
     * hover com o foco em outro lugar, e fecharia no primeiro Tab mesmo com o
     * ponteiro parado em cima dele.
     */
    if (this.fecharAoSairFoco) {
      this._cleanups.push(on(document, 'focusin', (e) => {
        if (this.panel.contains(e.target) || this.anchor.contains(e.target)) return;
        this.onDismiss('foco');
      }, true));
    }

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

    if (this.fecharSeSolto && (a.bottom < 0 || a.top > vh || a.right < 0 || a.left > vw)) {
      this.onDismiss('solto');
      return;
    }

    const [side, align = 'start'] = this.placement.split('-');

    /*
     * Dois eixos: `top`/`bottom` abrem na vertical e se alinham na horizontal,
     * `left`/`right` fazem o contrario. Em ambos o flip so acontece quando o
     * lado pedido nao cabe E o oposto cabe melhor — trocar de lado por trocar
     * faria o painel pular a cada rolagem.
     */
    const deitado = side === 'left' || side === 'right';
    let placeSide = side;
    let top;
    let left;

    if (deitado) {
      const folgaDir = vw - a.right - this.offset;
      const folgaEsq = a.left - this.offset;
      if (side === 'right' && p.width > folgaDir && folgaEsq > folgaDir) placeSide = 'left';
      if (side === 'left' && p.width > folgaEsq && folgaDir > folgaEsq) placeSide = 'right';

      left = placeSide === 'left' ? a.left - p.width - this.offset : a.right + this.offset;

      if (align === 'end') top = a.bottom - p.height;
      else if (align === 'center') top = a.top + a.height / 2 - p.height / 2;
      else top = a.top;
    } else {
      const spaceBelow = vh - a.bottom - this.offset;
      const spaceAbove = a.top - this.offset;
      if (side === 'bottom' && p.height > spaceBelow && spaceAbove > spaceBelow) placeSide = 'top';
      if (side === 'top' && p.height > spaceAbove && spaceBelow > spaceAbove) placeSide = 'bottom';

      top = placeSide === 'top' ? a.top - p.height - this.offset : a.bottom + this.offset;

      if (p.width >= vw * 0.85) {
        /*
         * Painel quase da largura da tela (celular): centra na viewport, nao
         * na ancora. Centrado no campo, o centro dele nao coincide com o
         * centro da tela e sobra folga diferente de cada lado — visivel
         * quando so restam alguns pixels em cada borda.
         */
        left = (vw - p.width) / 2;
      } else if (align === 'end') {
        left = a.right - p.width;
      } else if (align === 'center') {
        left = a.left + a.width / 2 - p.width / 2;
      } else {
        left = a.left;
      }
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

    /*
     * left/top, e nao transform.
     *
     * As propriedades individuais compoem nesta ordem: translate, rotate,
     * scale e por ultimo `transform`. Entao um `scale: .95` na animacao de
     * entrada multiplica tambem a translacao do transform: um painel em
     * translate(579px, 305px) renderiza em (550, 290) e desliza ate o lugar
     * certo conforme a escala chega a 1.
     *
     * O desvio e proporcional a distancia ate a origem do documento — e como o
     * painel e absolute no body, essa distancia inclui o scroll. Numa pagina
     * longa, rolada, o painel entrava voando de centenas de pixels de
     * distancia. Posicionando por left/top a animacao fica so com o que e
     * dela: 8px, escala e opacidade.
     */
    this.panel.style.left = `${Math.round(left + host.left)}px`;
    this.panel.style.top = `${Math.round(top + host.top)}px`;
    this.panel.dataset.side = placeSide;

    /*
     * A seta aponta para o centro da ancora, nao para o centro do painel: num
     * painel largo ancorado num botao estreito os dois nao coincidem, e apontar
     * para o meio do balao indicaria o elemento errado. O limite impede que ela
     * suba no canto arredondado, onde sairia meia seta.
     */
    if (this._seta) {
      const meia = this._seta.offsetWidth / 2;
      const limite = 12 + meia;
      /*
       * Num balao curto — uma dica de uma linha tem ~31px — o limite passa da
       * metade e os dois extremos se cruzam, empurrando a seta para longe do
       * centro justamente onde ela deveria estar bem no meio. Nesse caso o
       * centro e o melhor lugar possivel.
       */
      const preso = (v, total) =>
        (total <= limite * 2 ? total / 2 : Math.min(Math.max(v, limite), total - limite));
      if (deitado) {
        this._seta.style.top = `${preso(a.top + a.height / 2 - top, p.height)}px`;
        this._seta.style.left = placeSide === 'left' ? `${p.width}px` : '0px';
      } else {
        this._seta.style.left = `${preso(a.left + a.width / 2 - left, p.width)}px`;
        this._seta.style.top = placeSide === 'top' ? `${p.height}px` : '0px';
      }
    }
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
