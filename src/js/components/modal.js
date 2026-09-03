import { el, nextId } from '../core/dom.js';
import { Dialogo, montarCaixa, semUndefined } from '../core/dialogo.js';

/*
 * Modal: dialogo centrado na tela.
 *
 * A mecanica do <dialog> — top layer, foco preso, Escape, devolver o foco —
 * mora em core/dialogo.js, compartilhada com a gaveta. Aqui fica so o que e
 * proprio do modal: a caixa no centro, e uma entrada que cresce em vez de
 * deslizar.
 */

const DEFAULTS = {
  title: null,
  text: '',
  tamanho: 'md',       // sm | md | lg | full
  tom: 'padrao',       // padrao | perigo | sucesso | aviso
  folha: false,        // no celular sobe do rodape em vez de surgir no centro
  fechavel: true,      // botao X e Escape
  fecharNoFundo: true,
  acoes: null,         // [{ texto, variante, onClick, fecha }]
  aoFechar: null,
  classe: '',
};

export class Modal extends Dialogo {
  constructor(opcoes = {}) {
    super();
    this.opts = { ...DEFAULTS, ...semUndefined(opcoes) };
    this.id = nextId('modal');
    this._cleanups = [];
    this._montar();
  }

  _montar() {
    const tituloId = `${this.id}-titulo`;
    this.caixa = montarCaixa('tuc-modal', this.opts, this, tituloId);

    this.node = el('dialog', {
      class: [
        'tuc-modal',
        `is-${this.opts.tamanho}`,
        `is-${this.opts.tom}`,
        this.opts.folha ? 'is-folha' : '',
        this.opts.classe,
      ].filter(Boolean).join(' '),
      id: this.id,
      // O titulo nomeia o dialogo; sem titulo o proprio texto serve.
      ...(this.opts.title ? { 'aria-labelledby': tituloId } : {}),
    }, [this.caixa]);

    this.corpo = this.caixa.querySelector('.tuc-modal__corpo');
    this.node._tucano = this;
  }
}

/** Atalho: cria e abre num passo. */
export function modal(opcoesOuTexto, extra = {}) {
  const base = typeof opcoesOuTexto === 'string' ? { text: opcoesOuTexto } : opcoesOuTexto;
  return new Modal({ ...base, ...extra }).abrir();
}

/**
 * Confirmacao que devolve promessa — o caso mais comum de modal num CRUD:
 *
 *   if (await Tucano.confirmar({ title: 'Excluir contrato?' })) excluir();
 */
export function confirmar(opcoes = {}) {
  const { confirmar: rotuloOk = 'Confirmar', cancelar = 'Cancelar', ...resto } = opcoes;
  // O tom sai daqui, e nao de resto.tom, porque o padrao e perigo: lendo so o
  // que veio de fora, um dialogo vermelho ganhava botao azul de confirmar.
  const tom = resto.tom ?? 'perigo';
  return new Promise((resolve) => {
    let decidido = false;
    const responder = (v) => { decidido = true; resolve(v); };
    new Modal({
      ...resto,
      tom,
      acoes: [
        { texto: cancelar, variante: 'outline', onClick: () => responder(false) },
        { texto: rotuloOk, variante: tom === 'perigo' ? 'danger' : 'primary', onClick: () => responder(true) },
      ],
      // Fechar pelo X, pelo Escape ou pelo fundo e uma recusa, nao um limbo:
      // sem isto a promessa ficaria pendente para sempre.
      aoFechar: (motivo, m) => { if (!decidido) resolve(false); resto.aoFechar?.(motivo, m); },
    }).abrir();
  });
}

/**
 * Modais escritos no template — util quando o conteudo vem renderizado pelo
 * servidor, como um form do Django:
 *
 *   <dialog class="tuc-modal is-md" id="excluir"> ... </dialog>
 *   <button data-tuc-modal="#excluir">Excluir</button>
 */
export function autoInit(scope = document) {
  const out = [];

  for (const node of scope.querySelectorAll('dialog.tuc-modal:not([data-tuc-ready])')) {
    node.setAttribute('data-tuc-ready', '');
    const d = node.dataset;
    const m = Object.create(Modal.prototype);
    m.opts = { ...DEFAULTS, fechavel: d.fechavel !== 'false', fecharNoFundo: d.fundo !== 'false' };
    m.id = node.id || nextId('modal');
    m._cleanups = [];
    m.caixa = node.querySelector('.tuc-modal__caixa');
    m.corpo = node.querySelector('.tuc-modal__corpo');
    m._adotar(node);

    for (const b of node.querySelectorAll('[data-tuc-modal-close]')) {
      b.addEventListener('click', () => m.fechar('botao'));
    }
    out.push(m);
  }

  for (const gatilho of scope.querySelectorAll('[data-tuc-modal]:not([data-tuc-ready])')) {
    gatilho.setAttribute('data-tuc-ready', '');
    gatilho.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelector(gatilho.dataset.tucModal)?._tucano?.abrir();
    });
  }

  return out;
}
