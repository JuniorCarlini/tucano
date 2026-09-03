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

/** Espelha a duracao do CSS; os dois precisam concordar. */
const DURACAO = 220;

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
  }

  _alternar(e, item) {
    e.preventDefault();
    if (item.open) this.fechar(item);
    else this.abrir(item);
  }

  abrir(item) {
    if (item.open) return this;
    if (this.opts.unico) {
      for (const outro of this.itens) if (outro !== item && outro.open) this.fechar(outro);
    }
    clearTimeout(item._tucSaida);
    item.classList.remove('is-fechando');
    item.open = true;
    return this;
  }

  fechar(item) {
    if (!item.open || item.classList.contains('is-fechando')) return this;
    // `open` so cai no fim: enquanto ele vale, o conteudo continua no fluxo e
    // pode encolher animado. Removido agora, sumiria de uma vez.
    item.classList.add('is-fechando');
    clearTimeout(item._tucSaida);
    item._tucSaida = setTimeout(() => {
      item.open = false;
      item.classList.remove('is-fechando');
    }, DURACAO);
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
