import { el, icon, on } from '../core/dom.js';
import { sanitizar, soTexto } from '../core/sanitizar.js';

/*
 * Editor de texto formatado, do tipo que mostra o resultado enquanto se
 * escreve. Quem preenche uma descricao no sistema ve negrito em negrito, e nao
 * asteriscos.
 *
 * O <textarea> original continua no DOM, escondido, guardando o HTML: assim
 * `name`, `required` e o POST do Django seguem funcionando sem nada especial, e
 * quem ja tem um formulario nao muda a view.
 *
 * Duas escolhas carregam o peso desta implementacao:
 *
 * Colar entra como texto puro. E o que evita o HTML do Word e do Google Docs,
 * com suas tabelas de layout e estilos embutidos, que e onde editor ingenuo
 * quebra primeiro.
 *
 * A saida passa por uma peneira de tags a cada leitura, e nao so no que
 * digitamos. Navegador tem liberdade para marcar como quiser ao executar um
 * comando, e o resultado precisa caber no que prometemos entregar.
 */

const DEFAULTS = {
  toolbar: ['negrito', 'italico', 'sublinhado', 'titulo', 'subtitulo',
            'lista', 'numerada', 'citacao', 'link', 'tabela', 'limpar'],
  tabela: { linhas: 3, colunas: 3 },
  minHeight: '9rem',
  placeholder: '',
};

const ICONES = {
  negrito:    'M6 4h6a4 4 0 010 8H6zM6 12h7a4 4 0 010 8H6z',
  italico:    'M19 4h-9M14 20H5M15 4L9 20',
  sublinhado: 'M6 4v6a6 6 0 0012 0V4M4 21h16',
  titulo:     'M6 4v16M18 4v16M6 12h12',
  subtitulo:  'M6 6v12M16 6v12M6 12h10',
  lista:      'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  numerada:   'M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2M6 15a1.5 1.5 0 10-2 1.4L6 19H4',
  citacao:    'M6 17h3l2-4V7H5v6h3zM14 17h3l2-4V7h-6v6h3z',
  link:       'M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1',
  limpar:     'M4 7h16M10 11v6M14 11v6M5 7l1 13a2 2 0 002 2h8a2 2 0 002-2l1-13',
  tabela:     'M3 5h18v14H3zM3 10h18M3 15h18M9 5v14M15 5v14',
};

const ROTULOS = {
  negrito: 'Negrito', italico: 'Itálico', sublinhado: 'Sublinhado',
  titulo: 'Título', subtitulo: 'Subtítulo', lista: 'Lista',
  numerada: 'Lista numerada', citacao: 'Citação', link: 'Link',
  limpar: 'Limpar formatação', tabela: 'Inserir tabela',
};

/*
 * execCommand esta deprecado, mas continua sendo o unico caminho com suporte
 * universal para negrito, lista e bloco — e, o que mais importa aqui, e o unico
 * que se integra ao desfazer nativo do navegador. Reimplementar isso a mao
 * significaria reimplementar tambem o Ctrl+Z, que e onde editores caseiros
 * costumam decepcionar.
 */
const COMANDOS = {
  negrito:    () => document.execCommand('bold'),
  italico:    () => document.execCommand('italic'),
  sublinhado: () => document.execCommand('underline'),
  titulo:     () => alternarBloco('H2'),
  subtitulo:  () => alternarBloco('H3'),
  lista:      () => document.execCommand('insertUnorderedList'),
  numerada:   () => document.execCommand('insertOrderedList'),
  citacao:    () => alternarBloco('BLOCKQUOTE'),
  limpar:     () => document.execCommand('removeFormat'),
};

const ESTADOS = {
  negrito: 'bold', italico: 'italic', sublinhado: 'underline',
  lista: 'insertUnorderedList', numerada: 'insertOrderedList',
};

const ATALHOS = { b: 'negrito', i: 'italico', u: 'sublinhado', k: 'link' };

/** Aplica o bloco, ou volta para paragrafo se ele ja estiver aplicado. */
function alternarBloco(tag) {
  const atual = document.queryCommandValue('formatBlock')?.toUpperCase();
  document.execCommand('formatBlock', false, atual === tag ? 'P' : tag);
}

/*
 * A tabela e montada aqui, e nao pelo execCommand — que nao insere tabela em
 * navegador nenhum. Vai com cabecalho porque tabela de sistema quase sempre
 * tem um, e sem ele a primeira linha de dados acaba servindo de titulo.
 */
function montarTabela(doc, linhas, colunas) {
  const cel = (tag) => { const c = doc.createElement(tag); c.append(doc.createElement('br')); return c; };
  const tabela = doc.createElement('table');
  const thead = doc.createElement('thead');
  const trCab = doc.createElement('tr');
  for (let c = 0; c < colunas; c++) trCab.append(cel('th'));
  thead.append(trCab);
  const tbody = doc.createElement('tbody');
  for (let l = 0; l < linhas - 1; l++) {
    const tr = doc.createElement('tr');
    for (let c = 0; c < colunas; c++) tr.append(cel('td'));
    tbody.append(tr);
  }
  tabela.append(thead, tbody);
  return tabela;
}

/** Proxima celula na ordem de leitura, ou nada se for a ultima. */
function proximaCelula(celula, tras) {
  const tabela = celula.closest('table');
  const celulas = [...tabela.querySelectorAll('th, td')];
  return celulas[celulas.indexOf(celula) + (tras ? -1 : 1)] || null;
}

function semUndefined(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) if (v !== undefined) out[k] = v;
  return out;
}

export class Rico {
  constructor(alvo, opcoes = {}) {
    this.campo = typeof alvo === 'string' ? document.querySelector(alvo) : alvo;
    if (!this.campo) throw new Error('[Rico] elemento não encontrado');
    this.opts = { ...DEFAULTS, ...semUndefined(opcoes) };
    this._cleanups = [];
    this._montar();
  }

  _montar() {
    const campo = this.campo;

    this.area = el('div', {
      class: 'tuc-rico__area',
      contenteditable: 'true',
      role: 'textbox',
      'aria-multiline': 'true',
      'data-placeholder': this.opts.placeholder || campo.placeholder || '',
    });
    this.area.style.minHeight = this.opts.minHeight;
    // O valor inicial tambem passa pela peneira: pode vir do banco.
    this.area.innerHTML = sanitizar(campo.value) || '<p><br></p>';

    this.barra = el('div', { class: 'tuc-rico__barra', role: 'toolbar', 'aria-label': 'Formatação' },
      this.opts.toolbar.map((nome) => {
        const b = el('button', {
          type: 'button',
          class: 'tuc-btn is-ghost is-icon is-sm',
          'aria-label': ROTULOS[nome] ?? nome,
          'data-tuc-tip': ROTULOS[nome] ?? nome,
          'aria-pressed': 'false',
          // mousedown e nao click: click viria depois do blur, e a selecao
          // dentro da area ja teria sido perdida.
          onmousedown: (e) => { e.preventDefault(); this.aplicar(nome); },
        }, [icon(ICONES[nome] ?? ICONES.limpar, 15)]);
        b.dataset.acao = nome;
        return b;
      }));

    this.raiz = el('div', { class: 'tuc-rico' }, [this.barra, this.area]);
    campo.parentNode.insertBefore(this.raiz, campo);
    this.raiz.append(campo);
    campo.hidden = true;
    campo.classList.add('tuc-rico__valor');

    this._cleanups.push(
      on(this.area, 'input', () => this._sincronizar()),
      on(this.area, 'blur', () => this._sincronizar()),
      on(this.area, 'paste', (e) => this._colar(e)),
      on(this.area, 'keydown', (e) => this._teclado(e)),
      on(this.area, 'keyup', () => this._marcarAtivos()),
      on(this.area, 'mouseup', () => this._marcarAtivos()),
    );

    campo._tucano = this;
    this.area._tucano = this;
  }

  /* O textarea escondido e a fonte da verdade para o formulario. */
  _sincronizar() {
    const limpo = sanitizar(this.area.innerHTML);
    if (this.campo.value === limpo) return;
    this.campo.value = limpo;
    this.campo.dispatchEvent(new Event('input', { bubbles: true }));
    this.campo.dispatchEvent(new Event('change', { bubbles: true }));
  }

  _colar(e) {
    e.preventDefault();
    const texto = e.clipboardData?.getData('text/plain')
      ?? soTexto(e.clipboardData?.getData('text/html'));
    document.execCommand('insertText', false, texto);
  }

  _teclado(e) {
    if (e.key === 'Tab') {
      const celula = window.getSelection()?.anchorNode?.parentElement?.closest?.('th, td');
      if (celula) {
        e.preventDefault();
        let alvo = proximaCelula(celula, e.shiftKey);
        // Tab na ultima celula acrescenta uma linha: e como se preenche tabela
        // sem tirar as maos do teclado.
        if (!alvo && !e.shiftKey) {
          const corpo = celula.closest('table').querySelector('tbody') || celula.closest('table');
          const modelo = corpo.querySelector('tr') || celula.parentElement;
          const nova = document.createElement('tr');
          for (let i = 0; i < modelo.children.length; i++) {
            const td = document.createElement('td');
            td.append(document.createElement('br'));
            nova.append(td);
          }
          corpo.append(nova);
          alvo = nova.firstElementChild;
          this._sincronizar();
        }
        if (alvo) {
          const r = document.createRange();
          r.selectNodeContents(alvo);
          r.collapse(true);
          const s = window.getSelection();
          s.removeAllRanges();
          s.addRange(r);
        }
        return;
      }
    }
    const t = e.key.toLowerCase();
    if ((e.metaKey || e.ctrlKey) && ATALHOS[t]) {
      e.preventDefault();
      this.aplicar(ATALHOS[t]);
    }
  }

  /* Botao aceso quando o cursor esta dentro daquela formatacao. */
  _marcarAtivos() {
    for (const b of this.barra.querySelectorAll('[data-acao]')) {
      const cmd = ESTADOS[b.dataset.acao];
      if (!cmd) continue;
      let ativo = false;
      try { ativo = document.queryCommandState(cmd); } catch { /* sem selecao */ }
      b.setAttribute('aria-pressed', String(ativo));
      b.classList.toggle('is-ativo', ativo);
    }
  }

  aplicar(nome) {
    this.area.focus();
    if (nome === 'tabela') {
      const { linhas, colunas } = this.opts.tabela;
      const tabela = montarTabela(document, linhas, colunas);
      const sel = window.getSelection();
      if (sel?.rangeCount) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(tabela);
        // Um paragrafo depois da tabela: sem ele nao ha onde continuar
        // escrevendo quando ela e a ultima coisa do texto.
        const p = document.createElement('p');
        p.append(document.createElement('br'));
        tabela.after(p);
        const primeira = tabela.querySelector('th');
        if (primeira) {
          const r = document.createRange();
          r.selectNodeContents(primeira);
          r.collapse(true);
          sel.removeAllRanges();
          sel.addRange(r);
        }
      }
      this._sincronizar();
      return this;
    }
    if (nome === 'link') {
      const url = prompt('Endereço do link:', 'https://');
      if (url) document.execCommand('createLink', false, url);
    } else {
      COMANDOS[nome]?.();
    }
    this._sincronizar();
    this._marcarAtivos();
    return this;
  }

  getValue() { return sanitizar(this.area.innerHTML); }
  setValue(html) {
    this.area.innerHTML = sanitizar(html) || '<p><br></p>';
    this._sincronizar();
    return this;
  }

  destroy() {
    this._cleanups.forEach((fn) => fn());
    this.campo.hidden = false;
    this.raiz.parentNode?.insertBefore(this.campo, this.raiz);
    this.raiz.remove();
  }
}

export function autoInit(scope = document) {
  const out = [];
  for (const node of scope.querySelectorAll('[data-tuc-rico]:not([data-tuc-ready])')) {
    node.setAttribute('data-tuc-ready', '');
    out.push(new Rico(node, {
      minHeight: node.dataset.minHeight || undefined,
      placeholder: node.dataset.placeholder || undefined,
    }));
  }
  return out;
}
