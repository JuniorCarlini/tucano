import { el, icon, ICONS, on } from './dom.js';

/*
 * O que um modal e uma gaveta tem em comum.
 *
 * Os dois sao <dialog> aberto com showModal(), e e dai que vem a parte dificil:
 * top layer (acima de qualquer z-index, e imune a ancestral com overflow
 * escondido ou com transform), foco preso, foco devolvido a quem abriu, Escape
 * e ::backdrop. Nada disso muda quando a caixa sai do centro e encosta numa
 * borda — o que muda e geometria e movimento, e isso fica com cada componente.
 *
 * Existir como base, e nao como duas implementacoes parecidas, e o que impede
 * que uma correcao feita num deles deixe de valer no outro.
 */

/** Espelha a duracao de saida do CSS; os dois precisam concordar. */
export const EXIT_MS = 160;

export class Dialog {
  /**
   * Adota um <dialog> ja escrito no template. O no e de quem escreveu o HTML:
   * abrir nao o insere e fechar nao o remove.
   */
  _adopt(node) {
    this._adopted = true;
    this.node = node;
    node._tucano = this;
    return this;
  }

  open() {
    if (this.isOpen) return this;
    this.isOpen = true;
    if (!this._adopted) document.body.append(this.node);
    this.node.showModal();
    this._wire();
    // Reflow antes da classe: sem isto o navegador agrupa as duas mudancas e
    // a animacao de entrada nao chega a existir.
    void this.node.offsetHeight;
    this.node.classList.add('is-open');
    return this;
  }

  close(reason = 'api') {
    if (!this.isOpen) return this;
    this.isOpen = false;
    this._cleanups.forEach((fn) => fn());
    this._cleanups = [];

    this.node.classList.remove('is-open');
    this.node.classList.add('is-closing');
    clearTimeout(this._exitTimer);
    this._exitTimer = setTimeout(() => {
      this.node.classList.remove('is-closing');
      // close() antes de remover: e o que devolve o foco a quem abriu.
      if (this.node.open) this.node.close();
      if (!this._adopted) this.node.remove();
      this.opts.onClose?.(reason, this);
    }, EXIT_MS);
    return this;
  }

  /** Conteudo livre no corpo: um form do Django, uma tabela, o que for. */
  content(no) {
    this.body?.replaceChildren(...(Array.isArray(no) ? no : [no]).filter(Boolean));
    return this;
  }

  _wire() {
    this._cleanups.push(
      // O Escape do <dialog> fecha na hora, sem animacao: interceptamos para
      // fechar pelo nosso caminho, que anima e devolve o motivo.
      on(this.node, 'cancel', (e) => {
        e.preventDefault();
        if (this.opts.closable) this.close('escape');
      }),
      on(this.node, 'click', (e) => {
        // O <dialog> ocupa a viewport inteira e a caixa fica dentro dele,
        // entao clique que chega ao proprio dialog e clique no fundo.
        if (this.opts.closeOnBackdrop && e.target === this.node) this.close('fundo');
      }),
    );
  }
}

/*
 * A caixa por dentro e a mesma nos dois: cabecalho com titulo, texto e X, um
 * corpo que rola, e um rodape de acoes. O prefix entra por parametro porque
 * as classes seguem o nome de cada componente — .tuc-modal__panel continua
 * sendo .tuc-modal__panel, que e o que quem escreve o template digita a mao.
 */
export function buildPanel(prefix, opts, owner, titleId) {
  const { title, text, actions, closable } = opts;
  return el('div', { class: `${prefix}__panel` }, [
    el('div', { class: `${prefix}__top` }, [
      el('div', { class: `${prefix}__header` }, [
        title ? el('h2', { class: `${prefix}__title`, id: titleId, text: title }) : null,
        text ? el('p', { class: `${prefix}__text`, text }) : null,
      ]),
      closable ? el('button', {
        type: 'button',
        class: `tuc-btn is-ghost is-icon is-sm ${prefix}__close`,
        'aria-label': 'Fechar',
        onclick: () => owner.close('botao'),
      }, [icon(ICONS.x, 15)]) : null,
    ]),
    el('div', { class: `${prefix}__body` }),
    actions?.length ? el('div', { class: `${prefix}__footer` }, actions.map((a) => el('button', {
      type: 'button',
      class: `tuc-btn is-${a.variant || 'outline'}`,
      text: a.text,
      onclick: () => {
        a.onClick?.(owner);
        if (a.closes !== false) owner.close('action');
      },
    }))) : null,
  ]);
}

export function withoutUndefined(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) if (v !== undefined) out[k] = v;
  return out;
}
