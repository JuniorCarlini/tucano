import { el, icon, ICON_CHEVRON_DOWN, omitUndefined, on } from '../core/dom.js';

/*
 * Acordeao sobre <details>/<summary> nativos.
 *
 * O nativo ja resolve teclado, semantica (o leitor de tela anuncia recolhido e
 * expandido) e estado, e funciona antes de o JavaScript carregar — quem so
 * escreve o HTML ja tem um acordeao. O que ele nao resolve e animar: a altura
 * do conteudo e `auto`, que nao transiciona, e ao fechar o navegador some com
 * o conteudo no mesmo quadro. E dai que este componente tira o seu lugar.
 *
 * A abertura e CSS puro, pelo truque de grid-template-rows 0fr -> 1fr, que
 * anima o que `height: auto` nao anima. O fechamento precisa de JavaScript: o
 * clique e interceptado para o elemento continuar aberto enquanto a animacao
 * corre, e so entao `open` cai.
 */

const DEFAULTS = {
  single: false,   // abrir um recolhe os outros
};

/*
 * Rede de seguranca, nao a duracao da animacao.
 *
 * Quem diz que a animacao acabou e o transitionend. Um numero aqui teria de
 * espelhar o token do CSS, e foi o que deu errado: 220ms contra 280ms fazia o
 * conteudo ser arrancado 60ms antes do fim, e o fechamento aparecia cortado.
 * O timeout so cobre o caso em que o evento nunca chega — aba oculta, ou
 * prefers-reduced-motion deixando a transicao curta demais para disparar.
 */
const SAFETY_MS = 500;

export class Accordion {
  constructor(target, options = {}) {
    this.node = typeof target === 'string' ? document.querySelector(target) : target;
    if (!this.node) throw new Error('[Accordion] elemento não encontrado');
    this.opts = { ...DEFAULTS, ...omitUndefined(options) };
    this._cleanups = [];
    this._build();
  }

  get items() {
    return [...this.node.querySelectorAll(':scope > details')];
  }

  _build() {
    this.node.classList.add('tuc-accordion');
    this.node._tucano = this;

    for (const item of this.items) {
      item.classList.add('tuc-accordion__item');
      const trigger = item.querySelector(':scope > summary');
      if (!trigger) continue;
      trigger.classList.add('tuc-accordion__trigger');

      // A seta e desenho: aria-hidden para o leitor de tela nao a anunciar
      // junto do titulo, ja que <details> ja informa o estado.
      if (!trigger.querySelector('.tuc-accordion__arrow')) {
        trigger.append(el('span', { class: 'tuc-accordion__arrow', 'aria-hidden': 'true' },
          [icon(ICON_CHEVRON_DOWN, 16)]));
      }

      // O corpo precisa de dois elementos: o de fora anima a altura pelo grid,
      // o de dentro esconde o excesso enquanto ela cresce.
      if (!item.querySelector(':scope > .tuc-accordion__body')) {
        const rest = [...item.childNodes].filter((n) => n !== trigger);
        const content = el('div', { class: 'tuc-accordion__content' });
        content.append(...rest);
        item.append(el('div', { class: 'tuc-accordion__body' }, [content]));
      }

      this._cleanups.push(on(trigger, 'click', (e) => this._toggle(e, item)));
    }

    this._warmUp();
  }

  /*
   * Adianta o primeiro layout do conteudo.
   *
   * Enquanto o <details> esta fechado o navegador nao renderiza os filhos, e a
   * primeira abertura carrega junto o calculo de estilo, o layout e a pintura
   * de uma subarvore inedita — e e por isso que so a primeira engasga. Aqui o
   * item e aberto e fechado no mesmo bloco sincrono: nada chega a pintar,
   * porque o quadro so e desenhado quando a pilha termina, mas o navegador e
   * obrigado a medir pelo offsetHeight no meio.
   */
  _warmUp() {
    for (const item of this.items) {
      if (item.open) continue;
      item.open = true;
      void item.querySelector(':scope > .tuc-accordion__body')?.offsetHeight;
      item.open = false;
    }
  }

  _toggle(e, item) {
    e.preventDefault();
    if (item.open) this.close(item);
    else this.open(item);
  }

  open(item) {
    // Reabrir no meio do fechamento e comum: cancela a saida e segue do ponto
    // em que a altura estava, sem esperar o fim da animacao anterior.
    item._tucTeardown?.();
    if (item.open) return this;
    if (this.opts.single) {
      for (const other of this.items) if (other !== item && other.open) this.close(other);
    }
    item.open = true;
    return this;
  }

  close(item) {
    if (!item.open || item.classList.contains('is-closing')) return this;
    const body = item.querySelector(':scope > .tuc-accordion__body');

    // `open` so cai no fim: enquanto ele vale, o conteudo continua no fluxo e
    // pode encolher animado. Removido agora, sumiria de uma vez.
    item.classList.add('is-closing');

    const teardown = () => {
      clearTimeout(item._tucExit);
      body?.removeEventListener('transitionend', onDone);
      item._tucTeardown = null;
      item.classList.remove('is-closing');
      item.open = false;
    };
    const onDone = (e) => {
      // So a linha do grid encerra: o corpo tem outras propriedades animando,
      // e qualquer uma delas fecharia o item cedo demais.
      if (e.target === body && e.propertyName === 'grid-template-rows') teardown();
    };

    item._tucTeardown = () => { teardown(); item.classList.remove('is-closing'); };
    body?.addEventListener('transitionend', onDone);
    item._tucExit = setTimeout(teardown, SAFETY_MS);
    return this;
  }

  destroy() {
    this._cleanups.forEach((fn) => fn());
    this._cleanups = [];
  }
}

export function autoInit(scope = document) {
  const out = [];
  for (const node of scope.querySelectorAll('[data-tuc-accordion]:not([data-tuc-ready])')) {
    node.setAttribute('data-tuc-ready', '');
    out.push(new Accordion(node, { single: node.dataset.single === 'true' }));
  }
  return out;
}
