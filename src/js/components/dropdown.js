import { abrirComTransicao, el, icon, on } from '../core/dom.js';
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
  itens: null,       // [{ texto, icone, atalho, onClick, href, variante, desabilitado }]
                     // ou { separador: true } / { rotulo: 'Seção' }
  fecharAoEscolher: true,
};

const FOCAVEIS = '.tuc-dropdown__item:not([disabled]):not([aria-disabled="true"])';

function semUndefined(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) if (v !== undefined) out[k] = v;
  return out;
}

export class Dropdown {
  constructor(gatilho, opcoes = {}) {
    this.gatilho = typeof gatilho === 'string' ? document.querySelector(gatilho) : gatilho;
    if (!this.gatilho) throw new Error('[Dropdown] gatilho não encontrado');
    this.opts = { ...DEFAULTS, ...semUndefined(opcoes) };
    this._cleanups = [];
    this._montar();
  }

  _montar() {
    this.painel = this.opts.painel ?? el('div', { class: 'tuc-dropdown', role: 'menu' },
      (this.opts.itens ?? []).map((i) => this._item(i)));
    this.painel.classList.add('tuc-dropdown');
    this.painel.setAttribute('role', 'menu');

    this.gatilho.setAttribute('aria-haspopup', 'menu');
    this.gatilho.setAttribute('aria-expanded', 'false');

    this._cleanups.push(
      on(this.gatilho, 'click', (e) => { e.preventDefault(); this.alternar(); }),
      on(this.gatilho, 'keydown', (e) => {
        // Seta para baixo abre e ja entra no primeiro item, como manda o padrao
        // de menu — quem chega por teclado nao deveria precisar de Enter antes.
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          this.abrir();
          this._mover(e.key === 'ArrowUp' ? -1 : 0, true);
        }
      }),
      on(this.painel, 'keydown', (e) => this._teclado(e)),
      on(this.painel, 'click', (e) => {
        const item = e.target.closest('.tuc-dropdown__item');
        if (!item || item.hasAttribute('aria-disabled')) return;
        if (this.opts.fecharAoEscolher) this.fechar();
      }),
    );

    this.gatilho._tucano = this;
    this.painel._tucano = this;
  }

  _item(dados) {
    if (dados.separador) return el('hr', { class: 'tuc-dropdown__separador', role: 'separator' });
    if (dados.rotulo) return el('div', { class: 'tuc-dropdown__rotulo', text: dados.rotulo });

    const tag = dados.href ? 'a' : 'button';
    const filhos = [];
    if (dados.icone) filhos.push(el('span', { class: 'tuc-dropdown__icone', 'aria-hidden': 'true' }, [icon(dados.icone, 15)]));
    filhos.push(el('span', { class: 'tuc-dropdown__texto', text: dados.texto ?? '' }));
    if (dados.atalho) filhos.push(el('span', { class: 'tuc-dropdown__atalho', text: dados.atalho }));

    return el(tag, {
      class: `tuc-dropdown__item${dados.variante ? ` is-${dados.variante}` : ''}`,
      role: 'menuitem',
      // tabindex -1 de proposito: quem navega e a seta, nao o Tab. Deixar os
      // itens tabulaveis faria o Tab sair do menu item a item.
      tabindex: '-1',
      ...(dados.href ? { href: dados.href } : { type: 'button' }),
      ...(dados.desabilitado ? { 'aria-disabled': 'true' } : {}),
      ...(dados.desabilitado ? {} : { onclick: () => dados.onClick?.(this) }),
    }, filhos);
  }

  get itens() {
    return [...this.painel.querySelectorAll(FOCAVEIS)];
  }

  _mover(passo, absoluto = false) {
    const itens = this.itens;
    if (!itens.length) return;
    const atual = itens.indexOf(document.activeElement);
    let i;
    if (absoluto) i = passo < 0 ? itens.length - 1 : 0;
    else i = (atual + passo + itens.length) % itens.length;
    itens[i]?.focus();
  }

  _teclado(e) {
    const teclas = {
      ArrowDown: () => this._mover(1),
      ArrowUp: () => this._mover(-1),
      Home: () => this._mover(0, true),
      End: () => this._mover(-1, true),
      Escape: () => this.fechar(),
      Tab: () => this.fechar(),
    };
    const acao = teclas[e.key];
    if (!acao) return;
    if (e.key !== 'Tab') e.preventDefault();
    acao();
  }

  abrir() {
    if (this.aberto) return this;
    this.aberto = true;
    this.gatilho.setAttribute('aria-expanded', 'true');
    this.popover = new Popover(this.gatilho, this.painel, {
      placement: this.opts.placement,
      offset: 6,
      fecharSeSolto: true,
      onDismiss: () => this.fechar(),
    });
    this.popover.show();
    abrirComTransicao(this.painel);
    this._mover(0, true);
    return this;
  }

  fechar() {
    if (!this.aberto) return this;
    this.aberto = false;
    this.gatilho.setAttribute('aria-expanded', 'false');
    this.painel.classList.remove('is-open');
    this.popover?.destroy();
    this.popover = null;
    // O foco volta para o gatilho: fechar um menu nao deveria largar quem
    // navega por teclado no comeco da pagina.
    if (this.painel.contains(document.activeElement)) {
      this.gatilho.focus({ preventScroll: true });
    }
    return this;
  }

  alternar() { return this.aberto ? this.fechar() : this.abrir(); }

  destroy() {
    this.fechar();
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
  for (const gatilho of scope.querySelectorAll('[data-tuc-dropdown]:not([data-tuc-ready])')) {
    gatilho.setAttribute('data-tuc-ready', '');
    const painel = document.querySelector(gatilho.dataset.tucDropdown);
    if (!painel) continue;
    painel.hidden = false;   // quem esconde agora e o popover, tirando do fluxo
    painel.remove();
    for (const item of painel.querySelectorAll('.tuc-dropdown__item')) {
      item.setAttribute('role', 'menuitem');
      item.setAttribute('tabindex', '-1');
    }
    out.push(new Dropdown(gatilho, {
      painel,
      placement: gatilho.dataset.placement || undefined,
    }));
  }
  return out;
}
