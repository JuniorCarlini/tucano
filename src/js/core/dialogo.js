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
export const DURACAO_SAIDA = 160;

export class Dialogo {
  /**
   * Adota um <dialog> ja escrito no template. O no e de quem escreveu o HTML:
   * abrir nao o insere e fechar nao o remove.
   */
  _adotar(node) {
    this._adotado = true;
    this.node = node;
    node._tucano = this;
    return this;
  }

  abrir() {
    if (this.aberto) return this;
    this.aberto = true;
    if (!this._adotado) document.body.append(this.node);
    this.node.showModal();
    this._ligar();
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

  /** Conteudo livre no corpo: um form do Django, uma tabela, o que for. */
  conteudo(no) {
    this.corpo?.replaceChildren(...(Array.isArray(no) ? no : [no]).filter(Boolean));
    return this;
  }

  _ligar() {
    this._cleanups.push(
      // O Escape do <dialog> fecha na hora, sem animacao: interceptamos para
      // fechar pelo nosso caminho, que anima e devolve o motivo.
      on(this.node, 'cancel', (e) => {
        e.preventDefault();
        if (this.opts.fechavel) this.fechar('escape');
      }),
      on(this.node, 'click', (e) => {
        // O <dialog> ocupa a viewport inteira e a caixa fica dentro dele,
        // entao clique que chega ao proprio dialog e clique no fundo.
        if (this.opts.fecharNoFundo && e.target === this.node) this.fechar('fundo');
      }),
    );
  }
}

/*
 * A caixa por dentro e a mesma nos dois: cabecalho com titulo, texto e X, um
 * corpo que rola, e um rodape de acoes. O prefixo entra por parametro porque
 * as classes seguem o nome de cada componente — .tuc-modal__caixa continua
 * sendo .tuc-modal__caixa, que e o que quem escreve o template digita a mao.
 */
export function montarCaixa(prefixo, opts, dono, tituloId) {
  const { title, text, acoes, fechavel } = opts;
  return el('div', { class: `${prefixo}__caixa` }, [
    el('div', { class: `${prefixo}__topo` }, [
      el('div', { class: `${prefixo}__cabecalho` }, [
        title ? el('h2', { class: `${prefixo}__titulo`, id: tituloId, text: title }) : null,
        text ? el('p', { class: `${prefixo}__texto`, text }) : null,
      ]),
      fechavel ? el('button', {
        type: 'button',
        class: `tuc-btn is-ghost is-icon is-sm ${prefixo}__fechar`,
        'aria-label': 'Fechar',
        onclick: () => dono.fechar('botao'),
      }, [icon(ICONS.x, 15)]) : null,
    ]),
    el('div', { class: `${prefixo}__corpo` }),
    acoes?.length ? el('div', { class: `${prefixo}__rodape` }, acoes.map((a) => el('button', {
      type: 'button',
      class: `tuc-btn is-${a.variante || 'outline'}`,
      text: a.texto,
      onclick: () => {
        a.onClick?.(dono);
        if (a.fecha !== false) dono.fechar('acao');
      },
    }))) : null,
  ]);
}

export function semUndefined(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) if (v !== undefined) out[k] = v;
  return out;
}
