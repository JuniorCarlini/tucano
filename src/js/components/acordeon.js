import { el, icon, on } from '../core/dom.js';
import { ICONS_EXTRA } from '../core/dom-extra.js';

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
  unico: false,   // abrir um recolhe os outros
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
const SOCORRO = 500;

export class Acordeon {
  constructor(alvo, opcoes = {}) {
    this.node = typeof alvo === 'string' ? document.querySelector(alvo) : alvo;
    if (!this.node) throw new Error('[Acordeon] elemento não encontrado');
    this.opts = { ...DEFAULTS, ...opcoes };
    this._cleanups = [];
    this._montar();
  }

  get itens() {
    return [...this.node.querySelectorAll(':scope > details')];
  }

  _montar() {
    this.node.classList.add('tuc-acordeon');

    for (const item of this.itens) {
      item.classList.add('tuc-acordeon__item');
      const gatilho = item.querySelector(':scope > summary');
      if (!gatilho) continue;
      gatilho.classList.add('tuc-acordeon__gatilho');

      // A seta e desenho: aria-hidden para o leitor de tela nao a anunciar
      // junto do titulo, ja que <details> ja informa o estado.
      if (!gatilho.querySelector('.tuc-acordeon__seta')) {
        gatilho.append(el('span', { class: 'tuc-acordeon__seta', 'aria-hidden': 'true' },
          [icon(ICONS_EXTRA.chevronDown, 16)]));
      }

      // O corpo precisa de dois elementos: o de fora anima a altura pelo grid,
      // o de dentro esconde o excesso enquanto ela cresce.
      if (!item.querySelector(':scope > .tuc-acordeon__corpo')) {
        const resto = [...item.childNodes].filter((n) => n !== gatilho);
        const conteudo = el('div', { class: 'tuc-acordeon__conteudo' });
        conteudo.append(...resto);
        item.append(el('div', { class: 'tuc-acordeon__corpo' }, [conteudo]));
      }

      this._cleanups.push(on(gatilho, 'click', (e) => this._alternar(e, item)));
    }

    this._aquecer();
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
  _aquecer() {
    for (const item of this.itens) {
      if (item.open) continue;
      item.open = true;
      void item.querySelector(':scope > .tuc-acordeon__corpo')?.offsetHeight;
      item.open = false;
    }
  }

  _alternar(e, item) {
    e.preventDefault();
    if (item.open) this.fechar(item);
    else this.abrir(item);
  }

  abrir(item) {
    // Reabrir no meio do fechamento e comum: cancela a saida e segue do ponto
    // em que a altura estava, sem esperar o fim da animacao anterior.
    item._tucEncerrar?.();
    if (item.open) return this;
    if (this.opts.unico) {
      for (const outro of this.itens) if (outro !== item && outro.open) this.fechar(outro);
    }
    item.open = true;
    return this;
  }

  fechar(item) {
    if (!item.open || item.classList.contains('is-fechando')) return this;
    const corpo = item.querySelector(':scope > .tuc-acordeon__corpo');

    // `open` so cai no fim: enquanto ele vale, o conteudo continua no fluxo e
    // pode encolher animado. Removido agora, sumiria de uma vez.
    item.classList.add('is-fechando');

    const encerrar = () => {
      clearTimeout(item._tucSaida);
      corpo?.removeEventListener('transitionend', aoFim);
      item._tucEncerrar = null;
      item.classList.remove('is-fechando');
      item.open = false;
    };
    const aoFim = (e) => {
      // So a linha do grid encerra: o corpo tem outras propriedades animando,
      // e qualquer uma delas fecharia o item cedo demais.
      if (e.target === corpo && e.propertyName === 'grid-template-rows') encerrar();
    };

    item._tucEncerrar = () => { encerrar(); item.classList.remove('is-fechando'); };
    corpo?.addEventListener('transitionend', aoFim);
    item._tucSaida = setTimeout(encerrar, SOCORRO);
    return this;
  }

  destroy() {
    this._cleanups.forEach((fn) => fn());
    this._cleanups = [];
  }
}

export function autoInit(scope = document) {
  const out = [];
  for (const node of scope.querySelectorAll('[data-tuc-acordeon]:not([data-tuc-ready])')) {
    node.setAttribute('data-tuc-ready', '');
    out.push(new Acordeon(node, { unico: node.dataset.unico === 'true' }));
  }
  return out;
}
