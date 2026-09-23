import { el, omitUndefined, on } from '../core/dom.js';
import { Dropdown } from './dropdown.js';

/*
 * Menu do botao direito.
 *
 * E o mesmo menu suspenso: mesma marcacao (.tuc-dropdown), mesmos itens, mesmo
 * teclado, mesmo popover. Muda so o que abre — o evento `contextmenu` em vez do
 * clique num gatilho — e onde o painel nasce: no ponto do clique, e nao colado
 * num botao. Herdar do Dropdown, em vez de copiar, foi de proposito: papeis de
 * acessibilidade, setas, Home/End e devolucao de foco ja moram la e nunca
 * ficarao diferentes entre os dois.
 *
 * Numa lista, os itens costumam depender da linha clicada; por isso `items`
 * tambem aceita funcao, que recebe o alvo e devolve a lista daquela linha.
 *
 * O menu nativo do navegador continua a um Shift de distancia: o Firefox e o
 * Chrome mostram o deles com Shift + botao direito, e nao se pode tirar isso de
 * quem precisa de "abrir em nova aba" ou do corretor ortografico.
 */

const DEFAULTS = {
  placement: 'bottom-start',
  items: null,       // array como o do Dropdown, ou (alvo) => array
  match: null,       // seletor do alvo dentro da area; sem ele, a area inteira
  closeOnPick: true,
  onOpen: null,      // (alvo, instancia) — para marcar a linha clicada, por exemplo
  panel: null,       // painel ja escrito no template, no lugar de `items`
};

export class ContextMenu extends Dropdown {
  constructor(area, options = {}) {
    super(area, { ...DEFAULTS, ...omitUndefined(options) });
  }

  /** A area que responde ao botao direito. */
  get area() { return this.trigger; }

  /** O elemento clicado com o botao direito, dentro da area. */
  get target() { return this._target ?? null; }

  _wireTrigger() {
    this._cleanups.push(
      on(this.trigger, 'contextmenu', (e) => {
        // Shift passa direto: e o atalho do navegador para o menu dele.
        if (e.shiftKey) return;
        const target = this.opts.match ? e.target.closest(this.opts.match) : this.trigger;
        // Fora de um alvo (o espaco vazio de uma tabela, por exemplo) o menu do
        // navegador continua valendo: melhor nada nosso do que um menu de acoes
        // que nao sabe sobre o que age.
        if (!target || !this.trigger.contains(target)) return;
        e.preventDefault();
        this.openAt(e.clientX, e.clientY, target);
      }),
      /*
       * Tecla de menu e Shift+F10, como em qualquer aplicativo: sem elas, tudo
       * o que estiver so neste menu fica inalcancavel para quem nao usa mouse.
       * Ancora no proprio elemento com foco, e nao num ponto da tela.
       */
      on(this.trigger, 'keydown', (e) => {
        if (e.key !== 'ContextMenu' && !(e.key === 'F10' && e.shiftKey)) return;
        const target = this.opts.match ? e.target.closest(this.opts.match) : this.trigger;
        if (!target) return;
        e.preventDefault();
        this.openAt(null, null, target);
      }),
      // Botao direito dentro do proprio menu nao troca o nosso pelo do navegador.
      on(this.panel, 'contextmenu', (e) => { if (!e.shiftKey) e.preventDefault(); }),
    );
  }

  /* A area nao e um gatilho: nao ha aria-expanded para marcar nela. */
  _setExpanded() {}

  /*
   * Aberto pelo ponteiro, o foco pode acabar fora do painel — na linha clicada,
   * por exemplo, que e para onde o Safari as vezes o devolve depois do clique.
   * Com a regra do menu suspenso ligada, o painel se fechava sozinho nesse
   * instante. Aqui fecham o menu o clique fora, o Escape, o Tab e a rolagem.
   */
  _closeOnFocusOut() { return !this._pointerOpen; }

  _anchor() { return this._point ? super._anchor() : (this._target ?? this.trigger); }

  /* Dentro de um <dialog> aberto o alfinete nasce nele, e nao no <body>: o
     dialogo esta na top layer, e um painel no body ficaria atras dele. */
  _pinInto() { return this._target?.closest('dialog[open]'); }

  /**
   * Abre o menu. Com x e y, no ponto da tela; sem eles, ancorado no alvo — que
   * e como o teclado abre.
   */
  openAt(x, y, target = this.trigger) {
    // Reabrir noutro ponto e fechar e abrir: o painel ja esta montado e o
    // Popover anterior tem ouvintes presos na ancora velha.
    if (this.isOpen) this.close({ restoreFocus: false });
    this._target = target;
    // Quem volta a ter o foco no fim. O alvo pode nem ser focavel — uma celula
    // de tabela —, entao guarda-se quem estava com o foco antes de abrir.
    this._returnFocus = document.activeElement;
    if (typeof this.opts.items === 'function') this._renderItems(this.opts.items(target, this));
    this.opts.onOpen?.(target, this);
    // Com x e y, o Dropdown ancora no ponto; sem eles, no alvo (o caminho do teclado).
    if (x == null) super.open(); else super.openAt(x, y);
    /*
     * Rolar fecha, como faz o menu do sistema operacional: sem isto o menu fica
     * preso na tela enquanto o conteudo corre por baixo, apontando para a linha
     * errada.
     *
     * Roda do mouse e gesto de toque, e nao o evento `scroll`: dar foco a um
     * item rola a pagina quando ele esta perto da borda, e isso tambem dispara
     * `scroll` — o menu se fechava sozinho na primeira seta, devolvendo o foco
     * para a linha. Aqui so fecha a rolagem de quem esta usando.
     */
    const bye = () => this.close();
    this._offScroll = on(window, 'wheel', bye, { capture: true, passive: true });
    this._offTouch = on(window, 'touchmove', bye, { capture: true, passive: true });
    return this;
  }

  close({ restoreFocus = true } = {}) {
    if (!this.isOpen) return this;
    this._offScroll?.();
    this._offScroll = null;
    this._offTouch?.();
    this._offTouch = null;
    this._offKeys?.();
    this._offKeys = null;
    const inside = this.panel.contains(document.activeElement);
    super.close();
    // O foco volta para quem o tinha antes do botao direito. O super devolve ao
    // gatilho, que aqui e a area inteira e costuma nem ser focavel: sem isto o
    // foco caia no <body> e quem usa teclado voltava para o topo da pagina.
    if (restoreFocus && inside && this._returnFocus?.isConnected) {
      this._returnFocus.focus({ preventScroll: true });
    }
    return this;
  }
}

/**
 * Menu escrito no template, como o do dropdown — o caminho quando os itens vêm
 * do servidor:
 *
 *   <table data-tuc-contextmenu="#acoes-linha" data-match="tbody tr">…</table>
 *   <div class="tuc-dropdown" id="acoes-linha" hidden>
 *     <button class="tuc-dropdown__item">Editar</button>
 *   </div>
 */
export function autoInit(scope = document) {
  const out = [];
  for (const area of scope.querySelectorAll('[data-tuc-contextmenu]:not([data-tuc-ready])')) {
    area.setAttribute('data-tuc-ready', '');
    const panel = document.querySelector(area.dataset.tucContextmenu);
    if (!panel) continue;
    panel.hidden = false;   // quem esconde agora e o popover, tirando do fluxo
    panel.remove();
    out.push(new ContextMenu(area, {
      panel,
      match: area.dataset.match || undefined,
      placement: area.dataset.placement || undefined,
    }));
  }
  return out;
}
