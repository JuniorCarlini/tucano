import { el, icon, ICONS, nextId, on } from '../core/dom.js';

/*
 * Modal sobre <dialog> nativo.
 *
 * A escolha nao e por economia de codigo, e pelo que so o nativo entrega:
 * showModal() poe o elemento na top layer do navegador, acima de qualquer
 * z-index, de ancestral com overflow:hidden e de ancestral com transform — as
 * tres coisas que fazem modal artesanal aparecer cortado ou por baixo. Junto
 * vem armadilha de foco, devolucao do foco ao fechar, Escape e ::backdrop.
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

/** Espelha a duracao de saida do CSS; os dois precisam concordar. */
const DURACAO_SAIDA = 160;


function semUndefined(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) if (v !== undefined) out[k] = v;
  return out;
}

export class Modal {
  constructor(opcoes = {}) {
    this.opts = { ...DEFAULTS, ...semUndefined(opcoes) };
    this.id = nextId('modal');
    this._cleanups = [];
    this._montar();
  }

  _montar() {
    const { title, text, acoes, fechavel } = this.opts;
    const tituloId = `${this.id}-titulo`;

    this.caixa = el('div', { class: 'tuc-modal__caixa' }, [
      el('div', { class: 'tuc-modal__topo' }, [
        el('div', { class: 'tuc-modal__cabecalho' }, [
          title ? el('h2', { class: 'tuc-modal__titulo', id: tituloId, text: title }) : null,
          text ? el('p', { class: 'tuc-modal__texto', text }) : null,
        ]),
        fechavel ? el('button', {
          type: 'button',
          class: 'tuc-btn is-ghost is-icon is-sm tuc-modal__fechar',
          'aria-label': 'Fechar',
          onclick: () => this.fechar('botao'),
        }, [icon(ICONS.x, 15)]) : null,
      ]),
      el('div', { class: 'tuc-modal__corpo' }),
      acoes?.length ? el('div', { class: 'tuc-modal__rodape' }, acoes.map((a) => el('button', {
        type: 'button',
        class: `tuc-btn is-${a.variante || 'outline'}`,
        text: a.texto,
        onclick: () => {
          a.onClick?.(this);
          if (a.fecha !== false) this.fechar('acao');
        },
      }))) : null,
    ]);

    this.node = el('dialog', {
      class: `tuc-modal is-${this.opts.tamanho} is-${this.opts.tom}${this.opts.folha ? ' is-folha' : ''}${this.opts.classe ? ` ${this.opts.classe}` : ''}`,
      id: this.id,
      // O titulo nomeia o dialogo; sem titulo o proprio texto serve.
      ...(title ? { 'aria-labelledby': tituloId } : {}),
    }, [this.caixa]);

    this.corpo = this.caixa.querySelector('.tuc-modal__corpo');
    this.node._tucano = this;
  }

  /** Conteudo livre dentro do modal: um form do Django, uma tabela, o que for. */
  conteudo(no) {
    this.corpo.replaceChildren(...(Array.isArray(no) ? no : [no]).filter(Boolean));
    return this;
  }

  /**
   * Adota um <dialog class="tuc-modal"> ja escrito no template. O no e de quem
   * escreveu o HTML: abrir nao o insere e fechar nao o remove.
   */
  static adotar(node, opcoes = {}) {
    const m = Object.create(Modal.prototype);
    m.opts = { ...DEFAULTS, ...semUndefined(opcoes) };
    m.id = node.id || nextId('modal');
    m._cleanups = [];
    m._adotado = true;
    m.node = node;
    m.caixa = node.querySelector('.tuc-modal__caixa');
    m.corpo = node.querySelector('.tuc-modal__corpo');
    node._tucano = m;
    return m;
  }

  abrir() {
    if (this.aberto) return this;
    this.aberto = true;
    if (!this._adotado) document.body.append(this.node);
    this.node.showModal();
    ligar(this);
    // Reflow antes da classe: sem isto o navegador agrupa as duas mudancas e
    // a animacao de entrada nao chega a existir.
    void this.node.offsetHeight;
    this.node.classList.add('is-open');
    return this;
  }

  fechar(motivo = 'api') {
    if (!this.aberto) return this;
    this.aberto = false;
    this._cleanups.forEach((fn) => fn());
    this._cleanups = [];

    this.node.classList.remove('is-open');
    this.node.classList.add('is-closing');
    clearTimeout(this._saida);
    this._saida = setTimeout(() => {
      this.node.classList.remove('is-closing');
      // close() antes de remover: e o que devolve o foco a quem abriu.
      if (this.node.open) this.node.close();
      if (!this._adotado) this.node.remove();
      this.opts.aoFechar?.(motivo, this);
    }, DURACAO_SAIDA);
    return this;
  }
}

/*
 * Liga fechamento por Escape e por clique no fundo. Serve tanto para o modal
 * criado por JS quanto para um <dialog class="tuc-modal"> escrito na mao no
 * template — por isso mora fora da classe.
 */
function ligar(alvo) {
  const node = alvo.node;
  const opts = alvo.opts;

  alvo._cleanups.push(
    // O Escape do <dialog> fecha na hora, sem animacao: interceptamos para
    // fechar pelo nosso caminho, que anima e devolve o motivo.
    on(node, 'cancel', (e) => {
      e.preventDefault();
      if (opts.fechavel) alvo.fechar('escape');
    }),
    on(node, 'click', (e) => {
      // O <dialog> ocupa a viewport inteira e a caixa fica centrada dentro
      // dele, entao clique que chega ao proprio dialog e clique no fundo.
      if (opts.fecharNoFundo && e.target === node) alvo.fechar('fundo');
    }),
  );
}

/** Atalho: cria e abre num passo. */
export function modal(opcoesOuTexto, extra = {}) {
  const base = typeof opcoesOuTexto === 'string' ? { text: opcoesOuTexto } : opcoesOuTexto;
  return new Modal({ ...base, ...extra }).abrir();
}

/**
 * Confirmacao que devolve promessa — o caso mais comum de modal num CRUD:
 *
 *   if (await Tucano.confirmar({ title: 'Excluir contrato?', tom: 'perigo' })) ...
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
 * Modais escritos no template. O <dialog> ja existe no HTML — util quando o
 * conteudo vem renderizado pelo servidor, como um form do Django:
 *
 *   <dialog class="tuc-modal is-md" id="excluir"> ... </dialog>
 *   <button data-tuc-modal="#excluir">Excluir</button>
 */
export function autoInit(scope = document) {
  const out = [];

  for (const node of scope.querySelectorAll('dialog.tuc-modal:not([data-tuc-ready])')) {
    node.setAttribute('data-tuc-ready', '');
    const d = node.dataset;
    const m = Modal.adotar(node, {
      fechavel: d.fechavel !== 'false',
      fecharNoFundo: d.fundo !== 'false',
    });
    for (const b of node.querySelectorAll('[data-tuc-modal-close]')) {
      on(b, 'click', () => m.fechar('botao'));
    }
    out.push(m);
  }

  for (const gatilho of scope.querySelectorAll('[data-tuc-modal]:not([data-tuc-ready])')) {
    gatilho.setAttribute('data-tuc-ready', '');
    on(gatilho, 'click', (e) => {
      e.preventDefault();
      const alvo = document.querySelector(gatilho.dataset.tucModal);
      alvo?._tucano?.abrir();
    });
  }

  return out;
}
