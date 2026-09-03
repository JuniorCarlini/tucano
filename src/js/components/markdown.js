import { el, icon, on } from '../core/dom.js';
import { renderizar } from '../core/markdown.js';

/*
 * Campo de texto formatado, em Markdown.
 *
 * Nao usa contenteditable de proposito. O <textarea> continua sendo o dono do
 * valor — `name`, `required` e o POST do Django seguem funcionando sem nada
 * especial — e o que vai para o banco e markdown cru, nao HTML. Assim a
 * sanitizacao para publicacao fica no servidor, que e onde ela pertence: um
 * campo de formulario nao deveria ser fronteira de seguranca da aplicacao.
 *
 * A pre-visualizacao aqui e so para quem escreve.
 */

const DEFAULTS = {
  preview: true,
  minRows: 6,
  toolbar: ['negrito', 'italico', 'titulo', 'link', 'lista', 'numerada', 'citacao', 'codigo'],
};

const ICONES = {
  negrito:  'M6 4h6a4 4 0 010 8H6zM6 12h7a4 4 0 010 8H6z',
  italico:  'M19 4h-9M14 20H5M15 4L9 20',
  titulo:   'M6 4v16M18 4v16M6 12h12',
  link:     'M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1',
  lista:    'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  numerada: 'M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2M6 15a1.5 1.5 0 10-2 1.4L6 19H4',
  citacao:  'M6 17h3l2-4V7H5v6h3zM14 17h3l2-4V7h-6v6h3z',
  codigo:   'M16 18l6-6-6-6M8 6l-6 6 6 6',
};

const ROTULOS = {
  negrito: 'Negrito', italico: 'Itálico', titulo: 'Título', link: 'Link',
  lista: 'Lista', numerada: 'Lista numerada', citacao: 'Citação', codigo: 'Código',
};

/*
 * Cada marcacao diz como envolver a selecao. `linha` marca as que valem para a
 * linha inteira: elas entram no comeco de cada linha selecionada, e nao em
 * volta do trecho.
 */
const MARCAS = {
  negrito:  { antes: '**', depois: '**', vazio: 'texto' },
  italico:  { antes: '*',  depois: '*',  vazio: 'texto' },
  codigo:   { antes: '`',  depois: '`',  vazio: 'código' },
  link:     { antes: '[',  depois: '](https://)', vazio: 'texto' },
  titulo:   { linha: '## ' },
  lista:    { linha: '- ' },
  numerada: { linha: '1. ' },
  citacao:  { linha: '> ' },
};

const ATALHOS = { b: 'negrito', i: 'italico', k: 'link' };

function semUndefined(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) if (v !== undefined) out[k] = v;
  return out;
}

export class Markdown {
  constructor(alvo, opcoes = {}) {
    this.campo = typeof alvo === 'string' ? document.querySelector(alvo) : alvo;
    if (!this.campo) throw new Error('[Markdown] elemento não encontrado');
    // Sem a peneira, um `undefined` vindo de atributo ausente sobrescreveria o
    // padrao no spread — e o campo nasceria com minRows indefinido.
    this.opts = { ...DEFAULTS, ...semUndefined(opcoes) };
    this._cleanups = [];
    this._montar();
  }

  _montar() {
    const campo = this.campo;
    campo.classList.add('tuc-input', 'tuc-md__campo');
    campo.rows = campo.rows > 1 ? campo.rows : this.opts.minRows;

    this.barra = el('div', { class: 'tuc-md__barra', role: 'toolbar', 'aria-label': 'Formatação' },
      this.opts.toolbar.map((nome) => el('button', {
        type: 'button',
        class: 'tuc-btn is-ghost is-icon is-sm',
        'aria-label': ROTULOS[nome] ?? nome,
        'data-tuc-tip': ROTULOS[nome] ?? nome,
        onclick: () => this.aplicar(nome),
      }, [icon(ICONES[nome] ?? ICONES.codigo, 15)])));

    if (this.opts.preview) {
      this.botaoPreview = el('button', {
        type: 'button',
        class: 'tuc-btn is-ghost is-sm tuc-md__ver',
        'aria-pressed': 'false',
        text: 'Visualizar',
        onclick: () => this.alternarPreview(),
      });
      this.barra.append(this.botaoPreview);
      this.preview = el('div', { class: 'tuc-md__preview', hidden: true });
    }

    this.raiz = el('div', { class: 'tuc-md' });
    campo.parentNode.insertBefore(this.raiz, campo);
    this.raiz.append(this.barra, campo);
    if (this.preview) this.raiz.append(this.preview);

    this._cleanups.push(
      on(campo, 'keydown', (e) => this._teclado(e)),
      on(campo, 'input', () => this._crescer()),
    );
    this._crescer();
    campo._tucano = this;
  }

  /* A altura acompanha o conteudo: rolagem dentro de um campo curto e o pior
     dos dois mundos — nao se ve o texto nem se ve o formulario. */
  _crescer() {
    const c = this.campo;
    c.style.height = 'auto';
    c.style.height = `${c.scrollHeight}px`;
  }

  _teclado(e) {
    const tecla = e.key.toLowerCase();
    if ((e.metaKey || e.ctrlKey) && ATALHOS[tecla]) {
      e.preventDefault();
      this.aplicar(ATALHOS[tecla]);
      return;
    }
    // Enter dentro de lista continua a lista; numa linha vazia, encerra.
    if (e.key === 'Enter' && !e.shiftKey) {
      const c = this.campo;
      const inicio = c.value.lastIndexOf('\n', c.selectionStart - 1) + 1;
      const linha = c.value.slice(inicio, c.selectionStart);
      const m = linha.match(/^(\s*)([-*+]|(\d+)\.)\s+/);
      if (!m) return;
      e.preventDefault();
      if (linha.trim() === m[2]) {
        // Item vazio: sai da lista em vez de criar outro vazio.
        this._trocar(inicio, c.selectionStart, '');
        return;
      }
      const proximo = m[3] ? `${m[1]}${+m[3] + 1}. ` : `${m[1]}${m[2]} `;
      this._trocar(c.selectionStart, c.selectionEnd, `\n${proximo}`);
    }
  }

  _trocar(de, ate, texto, selecionar) {
    const c = this.campo;
    c.setRangeText(texto, de, ate, 'end');
    if (selecionar) c.setSelectionRange(selecionar[0], selecionar[1]);
    c.dispatchEvent(new Event('input', { bubbles: true }));
    c.focus();
    this._crescer();
  }

  aplicar(nome) {
    const marca = MARCAS[nome];
    if (!marca) return this;
    const c = this.campo;
    const de = c.selectionStart;
    const ate = c.selectionEnd;

    if (marca.linha) {
      const inicio = c.value.lastIndexOf('\n', de - 1) + 1;
      const fim = c.value.indexOf('\n', ate) === -1 ? c.value.length : c.value.indexOf('\n', ate);
      const trecho = c.value.slice(inicio, fim);
      // Clicar de novo tira a marcacao, em vez de empilhar outra.
      const jaTem = trecho.split('\n').every((l) => l.startsWith(marca.linha));
      const novo = trecho.split('\n')
        .map((l) => (jaTem ? l.slice(marca.linha.length) : marca.linha + l))
        .join('\n');
      this._trocar(inicio, fim, novo);
      return this;
    }

    const selecionado = c.value.slice(de, ate) || marca.vazio;
    this._trocar(de, ate, marca.antes + selecionado + marca.depois,
      // Sem selecao, deixa o texto de exemplo marcado para ser digitado por cima.
      ate === de ? [de + marca.antes.length, de + marca.antes.length + selecionado.length] : null);
    return this;
  }

  alternarPreview() {
    const vendo = this.preview.hidden;
    this.preview.innerHTML = vendo ? renderizar(this.campo.value) : '';
    this.preview.hidden = !vendo;
    this.campo.hidden = vendo;
    this.botaoPreview.textContent = vendo ? 'Editar' : 'Visualizar';
    this.botaoPreview.setAttribute('aria-pressed', String(vendo));
    for (const b of this.barra.querySelectorAll('.tuc-btn.is-icon')) b.disabled = vendo;
    return this;
  }

  getValue() { return this.campo.value; }
  html() { return renderizar(this.campo.value); }

  destroy() {
    this._cleanups.forEach((fn) => fn());
    this.raiz.parentNode?.insertBefore(this.campo, this.raiz);
    this.raiz.remove();
  }
}

export function autoInit(scope = document) {
  const out = [];
  for (const node of scope.querySelectorAll('[data-tuc-markdown]:not([data-tuc-ready])')) {
    node.setAttribute('data-tuc-ready', '');
    out.push(new Markdown(node, {
      preview: node.dataset.preview !== 'false',
      minRows: node.dataset.rows ? +node.dataset.rows : undefined,
    }));
  }
  return out;
}
