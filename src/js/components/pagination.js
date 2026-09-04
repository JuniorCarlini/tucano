import { el, icon, on } from '../core/dom.js';

/*
 * Paginacao.
 *
 * Os itens sao <a> com href de verdade, e nao botoes que chamam JavaScript.
 * Numa lista paginada pelo servidor — que e o caso de todo CRUD Django — o
 * numero da pagina mora na query string: assim o botao do meio abre em outra
 * aba, o botao voltar do navegador funciona, e o buscador indexa. Trocar isso
 * por onclick quebraria as tres coisas de uma vez.
 *
 * Quem quiser interceptar passa `onChange`, e ai o clique e cancelado e a
 * navegacao vira responsabilidade de quem escreveu — util com HTMX.
 */

const DEFAULTS = {
  page: 1,
  pages: 1,
  param: 'page',
  around: 1,        // paginas visiveis de cada lado da atual
  edges: 1,         // paginas visiveis nas pontas
  prevText: 'Anterior',
  nextText: 'Próxima',
  label: 'Paginação',
  onChange: null,
};

const SETA_ESQ = 'M15 18l-6-6 6-6';
const SETA_DIR = 'M9 18l6-6-6-6';

function withoutUndefined(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) if (v !== undefined) out[k] = v;
  return out;
}

/*
 * Quais numeros aparecem. Com muitas paginas nao cabe tudo, entao ficam as
 * pontas, a atual e a vizinhanca dela; o resto vira reticencia. O calculo
 * devolve `null` onde entra a reticencia, e nunca duas seguidas.
 */
export function pageWindow(page, pages, { around = 1, edges = 1 } = {}) {
  const mostrar = new Set();
  for (let i = 1; i <= Math.min(edges, pages); i++) mostrar.add(i);
  for (let i = Math.max(1, pages - edges + 1); i <= pages; i++) mostrar.add(i);
  for (let i = page - around; i <= page + around; i++) if (i >= 1 && i <= pages) mostrar.add(i);

  const ordenadas = [...mostrar].sort((a, b) => a - b);
  const saida = [];
  let anterior = 0;
  for (const n of ordenadas) {
    // Buraco de uma pagina so nao merece reticencia: mostrar o numero ocupa o
    // mesmo espaco e da um destino a mais para clicar.
    if (n - anterior === 2) saida.push(anterior + 1);
    else if (n - anterior > 2) saida.push(null);
    saida.push(n);
    anterior = n;
  }
  return saida;
}

export class Pagination {
  constructor(options = {}) {
    this.opts = { ...DEFAULTS, ...withoutUndefined(options) };
    this._cleanups = [];
    this.node = el('nav', { class: 'tuc-pagination', role: 'navigation', 'aria-label': this.opts.label });
    this.node._tucano = this;
    this.render();
  }

  /** Monta o href preservando o resto da query string — filtros, busca, ordem. */
  href(page) {
    const url = new URL(location.href);
    url.searchParams.set(this.opts.param, String(page));
    return `${url.pathname}${url.search}${url.hash}`;
  }

  _item(page, { text, current = false, disabled = false, extra = '' } = {}) {
    const classe = `tuc-pagination__item${extra}${current ? ' is-current' : ''}${disabled ? ' is-disabled' : ''}`;
    const filhos = typeof text === 'string' ? [text] : text;

    /*
     * Ponta desativada e <span>, nao <a> sem href: um link que nao leva a lugar
     * nenhum continua no caminho do Tab e e anunciado como link pelo leitor de
     * tela. Assim ele simplesmente sai do caminho.
     */
    if (disabled) return el('span', { class: classe, 'aria-hidden': 'true' }, filhos);

    const a = el('a', {
      class: classe, href: this.href(page),
      ...(current ? { 'aria-current': 'page' } : {}),
    }, filhos);
    this._cleanups.push(on(a, 'click', (e) => {
      if (!this.opts.onChange) return;
      e.preventDefault();
      this.opts.onChange(page, this);
    }));
    return a;
  }

  render() {
    this._cleanups.forEach((fn) => fn());
    this._cleanups = [];
    this.node.textContent = '';
    const { page, pages } = this.opts;
    if (pages <= 1) return this;   // uma pagina so nao precisa de navegacao

    this.node.append(this._item(page - 1, {
      text: [el('span', { class: 'tuc-pagination__ico', 'aria-hidden': 'true' }, [icon(SETA_ESQ, 15)]),
             el('span', { class: 'tuc-pagination__word', text: this.opts.prevText })],
      disabled: page <= 1, extra: ' is-edge',
    }));

    for (const n of pageWindow(page, pages, this.opts)) {
      if (n === null) {
        this.node.append(el('span', { class: 'tuc-pagination__gap', 'aria-hidden': 'true', text: '…' }));
        continue;
      }
      this.node.append(this._item(n, { text: String(n), current: n === page }));
    }

    this.node.append(this._item(page + 1, {
      text: [el('span', { class: 'tuc-pagination__word', text: this.opts.nextText }),
             el('span', { class: 'tuc-pagination__ico', 'aria-hidden': 'true' }, [icon(SETA_DIR, 15)])],
      disabled: page >= pages, extra: ' is-edge',
    }));
    return this;
  }

  /** Troca a página mostrada como atual — para quem navega sem recarregar. */
  setPage(page) {
    this.opts.page = Math.min(Math.max(1, page), this.opts.pages);
    return this.render();
  }

  destroy() {
    this._cleanups.forEach((fn) => fn());
    this._cleanups = [];
    this.node.remove();
  }
}

/** Atalho: devolve o elemento pronto para inserir. */
export function pagination(options = {}) {
  return new Pagination(options).node;
}

/**
 * Do template, com os números que o Paginator do Django já tem:
 *
 *   <div data-tuc-pagination
 *        data-page="{{ page_obj.number }}"
 *        data-pages="{{ page_obj.paginator.num_pages }}"></div>
 */
export function autoInit(scope = document) {
  const out = [];
  for (const node of scope.querySelectorAll('[data-tuc-pagination]:not([data-tuc-ready])')) {
    node.setAttribute('data-tuc-ready', '');
    const d = node.dataset;
    const p = new Pagination({
      page: parseInt(d.page, 10) || 1,
      pages: parseInt(d.pages, 10) || 1,
      param: d.param || undefined,
      around: d.around ? parseInt(d.around, 10) : undefined,
      edges: d.edges ? parseInt(d.edges, 10) : undefined,
      prevText: d.prevText || undefined,
      nextText: d.nextText || undefined,
    });
    node.textContent = '';
    node.append(p.node);
    node._tucano = p;
    out.push(p);
  }
  return out;
}
