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
   * Aberto pelo botao direito, nenhum item nasce destacado: o menu do sistema
   * tambem nao adivinha a escolha, e um item ja aceso parece escolhido por
   * engano. O foco vai para o painel — e preciso ter foco la dentro para as
   * setas andarem, o Escape fechar e o foco voltar depois —, e a primeira seta
   * destaca o primeiro item. Aberto pelo teclado, vale a regra do menu suspenso:
   * quem apertou a tecla de menu ja quer andar pelos itens.
   */
  _focusOnOpen() {
    if (!this._point) return super._focusOnOpen();
    this.panel.tabIndex = -1;
    this.panel.focus({ preventScroll: true });
  }

  _anchor() {
    if (!this._point) return this._target ?? this.trigger;
    /*
     * Ancora de 1px no ponto do clique: o Popover sabe ancorar em elemento, e
     * com isso ele continua fazendo tudo o que ja fazia — virar para cima ou
     * para a esquerda quando nao cabe, nao vazar da tela, fechar no Escape e no
     * clique fora. `fixed` porque o ponto e da tela, nao da pagina.
     */
    this._pin ??= el('span', { class: 'tuc-context-pin', 'aria-hidden': 'true' });
    // Só o ponto vem do JavaScript; o resto do desenho mora no CSS.
    this._pin.style.left = `${this._point.x}px`;
    this._pin.style.top = `${this._point.y}px`;
    (this._target?.closest('dialog[open]') || document.body).append(this._pin);
    return this._pin;
  }

  /**
   * Abre o menu. Com x e y, no ponto da tela; sem eles, ancorado no alvo — que
   * e como o teclado abre.
   */
  openAt(x, y, target = this.trigger) {
    // Reabrir noutro ponto e fechar e abrir: o painel ja esta montado e o
    // Popover anterior tem ouvintes presos na ancora velha.
    if (this.isOpen) this.close({ restoreFocus: false });
    this._target = target;
    this._point = x == null ? null : { x, y };
    // Quem volta a ter o foco no fim. O alvo pode nem ser focavel — uma celula
    // de tabela —, entao guarda-se quem estava com o foco antes de abrir.
    this._returnFocus = document.activeElement;
    if (typeof this.opts.items === 'function') this._renderItems(this.opts.items(target, this));
    this.opts.onOpen?.(target, this);
    super.open();
    /*
     * Rolar a pagina fecha, como faz o menu do sistema operacional. Sem isto o
     * menu fica preso na tela enquanto o conteudo corre por baixo, apontando
     * para a linha errada.
     */
    this._offScroll = on(window, 'scroll', () => this.close(), true);
    return this;
  }

  /** Troca os itens do painel, mantendo papeis e tabindex do Dropdown. */
  _renderItems(items) {
    this.panel.replaceChildren(...(items ?? []).map((i) => this._item(i)));
    for (const item of this.panel.querySelectorAll('.tuc-dropdown__item')) {
      item.setAttribute('role', 'menuitem');
      item.setAttribute('tabindex', '-1');
    }
  }

  close({ restoreFocus = true } = {}) {
    if (!this.isOpen) return this;
    this._offScroll?.();
    this._offScroll = null;
    const inside = this.panel.contains(document.activeElement);
    super.close();
    this._pin?.remove();
    this._point = null;
    // O foco volta para quem o tinha antes do botao direito. O super devolve ao
    // gatilho, que aqui e a area inteira e costuma nem ser focavel: sem isto o
    // foco caia no <body> e quem usa teclado voltava para o topo da pagina.
    if (restoreFocus && inside && this._returnFocus?.isConnected) {
      this._returnFocus.focus({ preventScroll: true });
    }
    return this;
  }

  destroy() {
    super.destroy();
    this._pin?.remove();
    this._pin = null;
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
