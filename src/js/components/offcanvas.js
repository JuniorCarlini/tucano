import { el, nextId } from '../core/dom.js';
import { Dialogo, montarCaixa, semUndefined } from '../core/dialogo.js';

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
  lado: 'direita',     // esquerda | direita | cima | baixo
  tamanho: 'md',       // sm | md | lg — nas laterais, largura da coluna
  tom: 'padrao',       // padrao | perigo | sucesso | aviso
  fechavel: true,
  fecharNoFundo: true,
  acoes: null,
  aoFechar: null,
  classe: '',
};

export class Gaveta extends Dialogo {
  constructor(opcoes = {}) {
    super();
    this.opts = { ...DEFAULTS, ...semUndefined(opcoes) };
    this.id = nextId('gaveta');
    this._cleanups = [];
    this._montar();
  }

  _montar() {
    const tituloId = `${this.id}-titulo`;
    this.caixa = montarCaixa('tuc-gaveta', this.opts, this, tituloId);

    this.node = el('dialog', {
      class: [
        'tuc-gaveta',
        `is-${this.opts.lado}`,
        `is-${this.opts.tamanho}`,
        `is-${this.opts.tom}`,
        this.opts.classe,
      ].filter(Boolean).join(' '),
      id: this.id,
      ...(this.opts.title ? { 'aria-labelledby': tituloId } : {}),
    }, [this.caixa]);

    this.corpo = this.caixa.querySelector('.tuc-gaveta__corpo');
    this.node._tucano = this;
  }
}

/** Atalho: cria e abre num passo. */
export function gaveta(opcoesOuTexto, extra = {}) {
  const base = typeof opcoesOuTexto === 'string' ? { text: opcoesOuTexto } : opcoesOuTexto;
  return new Gaveta({ ...base, ...extra }).abrir();
}

/**
 * Gavetas escritas no template — o caminho quando o conteudo vem do servidor:
 *
 *   <dialog class="tuc-gaveta is-direita" id="filtros"> ... </dialog>
 *   <button data-tuc-gaveta="#filtros">Filtros</button>
 */
export function autoInit(scope = document) {
  const out = [];

  for (const node of scope.querySelectorAll('dialog.tuc-gaveta:not([data-tuc-ready])')) {
    node.setAttribute('data-tuc-ready', '');
    const d = node.dataset;
    const g = Object.create(Gaveta.prototype);
    g.opts = { ...DEFAULTS, fechavel: d.fechavel !== 'false', fecharNoFundo: d.fundo !== 'false' };
    g.id = node.id || nextId('gaveta');
    g._cleanups = [];
    g.caixa = node.querySelector('.tuc-gaveta__caixa');
    g.corpo = node.querySelector('.tuc-gaveta__corpo');
    g._adotar(node);

    for (const b of node.querySelectorAll('[data-tuc-gaveta-close]')) {
      b.addEventListener('click', () => g.fechar('botao'));
    }
    out.push(g);
  }

  for (const gatilho of scope.querySelectorAll('[data-tuc-gaveta]:not([data-tuc-ready])')) {
    gatilho.setAttribute('data-tuc-ready', '');
    gatilho.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelector(gatilho.dataset.tucGaveta)?._tucano?.abrir();
    });
  }

  return out;
}
