import { el, icon, omitUndefined, on } from '../core/dom.js';
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
  items: null,       // [{ text, icon, shortcut, onClick, href, variant, disabled, separator, label }]
                     // separator: true vira uma linha; label sozinho vira titulo de grupo
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
    // `items` tambem aceita funcao (o menu do botao direito monta a lista a
    // partir da linha clicada); nesse caso o painel nasce vazio e e preenchido
    // a cada abertura.
    const items = Array.isArray(this.opts.items) ? this.opts.items : [];
    this.panel = this.opts.panel ?? el('div', {}, items.map((i) => this._item(i)));
    this.panel.classList.add('tuc-dropdown');
    this.panel.setAttribute('role', 'menu');
    // Tambem aqui, e nao so no autoInit: um painel passado em JS ficava com
    // itens que o leitor de tela nao anunciava como opcao.
    this._markItems();

    this._wireTrigger();

    this._cleanups.push(
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

  /*
   * O que abre o menu. Separado do resto do _build porque o menu do botao
   * direito herda tudo isto e troca so esta parte: la quem abre e o
   * `contextmenu`, num ponto da tela, e nao o clique num gatilho.
   */
  _wireTrigger() {
    this.trigger.setAttribute('aria-haspopup', 'menu');
    this.trigger.setAttribute('aria-expanded', 'false');
    this._cleanups.push(
      on(this.trigger, 'click', (e) => {
        e.preventDefault();
        // `detail` 0 e o clique que veio de Enter ou Espaco num botao focado: ali
        // quem abriu foi o teclado, e o primeiro item ja nasce aceso.
        this._pointerOpen = e.detail > 0;
        this.toggle();
      }),
      on(this.trigger, 'keydown', (e) => {
        // Seta para baixo abre e ja entra no primeiro item, como manda o padrao
        // de menu — quem chega por teclado nao deveria precisar de Enter antes.
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          this._pointerOpen = false;
          this.open();
          this._move(e.key === 'ArrowUp' ? -1 : 0, true);
        }
      }),
    );
  }

  /*
   * De onde o painel sai: o gatilho, ou um ponto da tela quando o menu foi
   * aberto por openAt() — o botao direito numa linha, a lista de variaveis no
   * cursor do editor. A ancora e um ponto de 1px: o Popover so sabe ancorar em
   * elemento, e assim ele continua virando de lado quando nao cabe, nao vazando
   * da tela e fechando no Escape e no clique fora.
   */
  _anchor() {
    if (!this._point) return this.trigger;
    this._pin ??= el('span', { class: 'tuc-context-pin', 'aria-hidden': 'true' });
    // So o ponto vem do JavaScript; o resto do desenho mora no CSS.
    this._pin.style.left = `${this._point.x}px`;
    this._pin.style.top = `${this._point.y}px`;
    (this._pinInto?.() || document.body).append(this._pin);
    return this._pin;
  }

  /** Abre ancorado num ponto da tela, em vez de no gatilho. */
  openAt(x, y) {
    // Reabrir noutro ponto e fechar e abrir: o Popover anterior tem ouvintes
    // presos na ancora velha.
    if (this.isOpen) this.close();
    this._point = { x, y };
    // Depois do close, que limpa a marca: abrir num ponto e coisa de ponteiro,
    // entao nenhum item nasce aceso.
    this._pointerOpen = true;
    return this.open();
  }

  /** Troca os itens do painel, mantendo papeis e tabindex. */
  _renderItems(items) {
    this.panel.replaceChildren(...(items ?? []).map((i) => this._item(i)));
    this._markItems();
  }

  /*
   * Quem recebe o foco ao abrir, e por consequencia o que nasce aceso.
   *
   * Pelo teclado, o primeiro item: quem apertou Enter ou a seta ja quer andar
   * pelo menu. Pelo ponteiro, nada — o menu do sistema operacional tambem nao
   * adivinha a escolha, e um item aceso com o ponteiro noutro canto parece
   * escolha feita. O foco vai para o painel, porque as setas, o Escape e a
   * devolucao do foco precisam de alguem focado la dentro, e a primeira seta
   * acende o primeiro item.
   */
  _focusOnOpen() {
    if (!this._pointerOpen) return this._move(0, true);
    this.panel.tabIndex = -1;
    this.panel.focus({ preventScroll: true });
    /*
     * Rede para o foco que nao fica: depois de um clique o Safari as vezes
     * devolve o foco para onde estava, e sem foco no painel as setas nao
     * chegariam ao menu. Enquanto aberto, as teclas de menu valem do documento.
     */
    this._offKeys = on(document, 'keydown', (e) => {
      if (!this.panel.contains(e.target)) this._onKey(e);
    }, true);
  }

  /*
   * Fechar quando o foco sai do painel. Faz sentido no menu de um botao, que so
   * abre com o foco dentro dele: andar de Tab pela pagina nao deve deixar menu
   * aberto para tras.
   */
  _closeOnFocusOut() { return true; }

  /*
   * Quem anuncia o estado. No menu do botao direito a "area" e uma tabela ou a
   * pagina inteira, e um aria-expanded num elemento desses nao diz nada a quem
   * usa leitor de tela — la este metodo nao faz nada.
   */
  _setExpanded(value) { this.trigger.setAttribute('aria-expanded', String(value)); }

  /*
   * Papel e tabindex dos itens. O tabindex -1 e de proposito: quem navega e a
   * seta, nao o Tab — itens tabulaveis fariam o Tab sair do menu item a item.
   */
  _markItems() {
    for (const item of this.panel.querySelectorAll('.tuc-dropdown__item')) {
      item.setAttribute('role', 'menuitem');
      item.setAttribute('tabindex', '-1');
    }
  }

  _item(data) {
    if (data.separator) return el('hr', { class: 'tuc-dropdown__separator', role: 'separator' });
    if (data.label) return el('div', { class: 'tuc-dropdown__label', text: data.label });

    const tag = data.href ? 'a' : 'button';
    const children = [];
    if (data.icon) children.push(el('span', { class: 'tuc-dropdown__icon', 'aria-hidden': 'true' }, [icon(data.icon, 15)]));
    children.push(el('span', { class: 'tuc-dropdown__text', text: data.text ?? '' }));
    if (data.shortcut) children.push(el('span', { class: 'tuc-dropdown__shortcut', text: data.shortcut }));

    // el() pula null, undefined e false: o que nao se aplica simplesmente fica de fora.
    return el(tag, {
      class: `tuc-dropdown__item${data.variant ? ` is-${data.variant}` : ''}`,
      href: data.href,
      type: data.href ? null : 'button',
      'aria-disabled': data.disabled && 'true',
      onclick: !data.disabled && (() => data.onClick?.(this)),
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
      // Escape nao entra: com o menu aberto quem o trata e o Popover.
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
    this._setExpanded(true);
    this.popover = new Popover(this._anchor(), this.panel, {
      placement: this.opts.placement,
      offset: 6,
      closeIfDetached: true,
      // Fora daqui para o menu do botao direito poder desligar: ver la.
      closeOnFocusOut: this._closeOnFocusOut(),
      onDismiss: () => this.close(),
    });
    this.popover.show();
    this._focusOnOpen();
    return this;
  }

  close() {
    if (!this.isOpen) return this;
    this.isOpen = false;
    this._setExpanded(false);
    this.popover?.destroy();
    this.popover = null;
    this._offKeys?.();
    this._offKeys = null;
    this._pointerOpen = false;
    this._pin?.remove();
    this._point = null;
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
    this._pin?.remove();
    this._pin = null;
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
    out.push(new Dropdown(trigger, {
      panel,
      placement: trigger.dataset.placement || undefined,
    }));
  }
  return out;
}
