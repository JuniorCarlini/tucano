import { el, icon, on } from '../core/dom.js';
import { sanitizar, soTexto } from '../core/sanitizar.js';
import { destacar } from '../core/destacar.js';

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
            'lista', 'numerada', 'esquerda', 'centro', 'direita', 'justificar',
            'citacao', 'codigo', 'link', 'tabela', 'limpar'],
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
  esquerda:   'M3 6h18M3 12h11M3 18h15',
  centro:     'M3 6h18M6 12h12M4 18h16',
  direita:    'M3 6h18M10 12h11M6 18h15',
  justificar: 'M3 6h18M3 12h18M3 18h18',
  codigo:     'M16 18l6-6-6-6M8 6l-6 6 6 6',
};

const ROTULOS = {
  negrito: 'Negrito', italico: 'Itálico', sublinhado: 'Sublinhado',
  titulo: 'Título', subtitulo: 'Subtítulo', lista: 'Lista',
  numerada: 'Lista numerada', citacao: 'Citação', link: 'Link',
  limpar: 'Limpar formatação', tabela: 'Inserir tabela',
  esquerda: 'Alinhar à esquerda', centro: 'Centralizar',
  direita: 'Alinhar à direita', justificar: 'Justificar',
  codigo: 'Código',
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
  esquerda:   () => document.execCommand('justifyLeft'),
  centro:     () => document.execCommand('justifyCenter'),
  direita:    () => document.execCommand('justifyRight'),
  justificar: () => document.execCommand('justifyFull'),
  codigo:     () => alternarCodigo(),
};

/* Estado que o proprio navegador informa. */
const ESTADOS = {
  negrito: 'bold', italico: 'italic', sublinhado: 'underline',
  lista: 'insertUnorderedList', numerada: 'insertOrderedList',
  esquerda: 'justifyLeft', centro: 'justifyCenter',
  direita: 'justifyRight', justificar: 'justifyFull',
};

/*
 * Estado que so o DOM sabe.
 *
 * Nao existe comando que responda "o cursor esta dentro de uma citacao?" —
 * queryCommandState cobre negrito, lista e alinhamento, e para ai. Para o resto
 * a pergunta e feita ao elemento em volta do cursor. Sem isto metade da barra
 * ficava apagada mesmo com o cursor dentro do bloco que ela aplica, e nao havia
 * como saber que clicar de novo desfaz.
 */
const ANCESTRAIS = {
  titulo: 'h2',
  subtitulo: 'h3',
  citacao: 'blockquote',
  codigo: 'pre, code',
  link: 'a',
  tabela: 'table',
};

const ATALHOS = { b: 'negrito', i: 'italico', u: 'sublinhado', k: 'link' };

/*
 * O execCommand nao tem comando de codigo, entao a marcacao e montada aqui —
 * mas entregue por insertHTML, e nao inserida direto no DOM. E o que mantem a
 * operacao dentro do desfazer nativo: um Ctrl+Z depois de aplicar codigo
 * precisa voltar como qualquer outra formatacao, senao o editor mente sobre o
 * proprio historico.
 */
const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };

function alternarCodigo() {
  const sel = window.getSelection();
  if (!sel?.rangeCount) return;
  const inicio = sel.anchorNode?.nodeType === Node.ELEMENT_NODE ? sel.anchorNode : sel.anchorNode?.parentElement;
  const dentro = inicio?.closest?.('pre, code');

  // Ja e codigo: seleciona a marcacao inteira e devolve o texto sem ela.
  if (dentro) {
    const alvo = dentro.closest('pre') || dentro;
    const texto = alvo.textContent;
    const r = document.createRange();
    /*
     * Em volta do elemento, e nao dentro dele. selectNode marca o conteudo, e
     * o insertHTML seguinte escrevia os paragrafos por dentro do <pre>, que
     * ficava de pe — sobrava um bloco de codigo com paragrafos la dentro.
     */
    r.setStartBefore(alvo);
    r.setEndAfter(alvo);
    sel.removeAllRanges();
    sel.addRange(r);
    /*
     * O bloco e trocado direto no DOM, e nao por execCommand.
     *
     * Tanto insertText quanto insertHTML escrevem *dentro* do <pre>, que fica
     * de pe: sobrava um bloco de codigo com paragrafos la dentro. Nem
     * selecionar em volta do elemento demove o insertHTML disso — ele respeita
     * o bloco em que o cursor esta.
     *
     * O custo e sair do desfazer nativo nesta operacao so. Preferi isso a
     * entregar um resultado errado: tirar a formatacao e a acao de quem se
     * arrependeu, e ela precisa funcionar de primeira.
     */
    if (alvo.tagName === 'PRE') {
      const bloco = document.createDocumentFragment();
      for (const linha of texto.split('\n')) {
        const par = document.createElement('p');
        if (linha) par.textContent = linha;
        else par.append(document.createElement('br'));
        bloco.append(par);
      }
      const primeiro = bloco.firstChild;
      alvo.replaceWith(bloco);
      if (primeiro) {
        const pos = document.createRange();
        pos.selectNodeContents(primeiro);
        pos.collapse(true);
        sel.removeAllRanges();
        sel.addRange(pos);
      }
      return;
    }
    document.execCommand('insertText', false, texto);
    return;
  }

  const texto = sel.toString();
  if (!texto) return;
  /*
   * Linha em branco dupla vira simples. A selecao atravessa paragrafos, e
   * toString junta cada um com duas quebras — o bloco saia com um vazio entre
   * todas as linhas, como se o codigo tivesse sido espacado de proposito.
   */
  const escapado = texto.replace(/\n{2,}/g, '\n').replace(/[&<>]/g, (c) => ESCAPES[c]);

  /*
   * Selecao que atravessa linhas vira bloco, e nao codigo no meio da frase.
   * Um <code> solto nao guarda quebra: o navegador dissolvia a marcacao e
   * sobravam paragrafos com o texto cru, sem formatacao nenhuma. <pre> e o
   * elemento que existe para preservar quebra e recuo.
   */
  if (/\n/.test(texto)) {
    document.execCommand('insertHTML', false, `<pre><code>${escapado}</code></pre><p><br></p>`);
    return;
  }
  document.execCommand('insertHTML', false, `<code>${escapado}</code>`);
}

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

/*
 * Operacoes de tabela.
 *
 * Todas partem da celula onde o cursor esta, e nao de um indice guardado: o
 * conteudo pode ter sido editado entre um clique e outro, e posicao decorada
 * envelhece. Perguntar ao DOM na hora custa nada e nunca erra.
 */
const TABELA = {
  linhaAcima:   (c) => inserirLinha(c, 0),
  linhaAbaixo:  (c) => inserirLinha(c, 1),
  colunaAntes:  (c) => inserirColuna(c, 0),
  colunaDepois: (c) => inserirColuna(c, 1),
  removerLinha:  (c) => removerLinha(c),
  removerColuna: (c) => removerColuna(c),
  removerTabela: (c) => c.closest('table')?.remove(),
};

/*
 * O verbo vem primeiro porque sem ele o rotulo e ambiguo: "Coluna a esquerda"
 * tanto pode inserir quanto alinhar, e a barra tem as duas coisas.
 */
const ROTULOS_TABELA = {
  linhaAcima: 'Inserir linha acima', linhaAbaixo: 'Inserir linha abaixo',
  colunaAntes: 'Inserir coluna à esquerda', colunaDepois: 'Inserir coluna à direita',
  removerLinha: 'Excluir linha', removerColuna: 'Excluir coluna',
  removerTabela: 'Excluir tabela',
};

const ICONES_TABELA = {
  linhaAcima:    'M12 3v8M8 7h8M3 15h18M3 20h18',
  linhaAbaixo:   'M3 4h18M3 9h18M12 21v-8M8 17h8',
  colunaAntes:   'M3 12h8M7 8v8M15 3v18M20 3v18',
  colunaDepois:  'M4 3v18M9 3v18M21 12h-8M17 8v8',
  removerLinha:  'M3 6h18M3 18h18M9 12h6',
  removerColuna: 'M6 3v18M18 3v18M12 9v6',
  removerTabela: 'M4 7h16M10 11v6M14 11v6M5 7l1 13a2 2 0 002 2h8a2 2 0 002-2l1-13M9 7V4h6v3',
};

const celulaVazia = (tag) => {
  const c = document.createElement(tag);
  c.append(document.createElement('br'));
  return c;
};

function inserirLinha(celula, depois) {
  const linha = celula.parentElement;
  const nova = document.createElement('tr');
  for (let i = 0; i < linha.children.length; i++) nova.append(celulaVazia('td'));
  // Linha acima do cabecalho vira corpo, nao outro cabecalho.
  const corpo = celula.closest('table').querySelector('tbody');
  if (linha.parentElement.tagName === 'THEAD' && corpo) {
    depois ? corpo.prepend(nova) : corpo.prepend(nova);
  } else {
    linha.parentElement.insertBefore(nova, depois ? linha.nextSibling : linha);
  }
  return nova.firstElementChild;
}

function inserirColuna(celula, depois) {
  const i = [...celula.parentElement.children].indexOf(celula);
  for (const linha of celula.closest('table').querySelectorAll('tr')) {
    const modelo = linha.children[i];
    const nova = celulaVazia(modelo?.tagName === 'TH' ? 'th' : 'td');
    linha.insertBefore(nova, depois ? modelo?.nextSibling : modelo);
  }
  return celula.parentElement.children[depois ? i + 1 : i];
}

function removerLinha(celula) {
  const linha = celula.parentElement;
  const tabela = celula.closest('table');
  // Ultima linha: some a tabela inteira, senao sobra uma moldura vazia.
  if (tabela.querySelectorAll('tr').length <= 1) { tabela.remove(); return null; }
  const vizinha = linha.nextElementSibling || linha.previousElementSibling;
  linha.remove();
  return vizinha?.firstElementChild ?? null;
}

function removerColuna(celula) {
  // A linha e guardada antes do laco: ele apaga a coluna em todas as linhas,
  // inclusive nesta, e a partir dai a celula que recebemos nao tem mais pai.
  const linha = celula.parentElement;
  const i = [...linha.children].indexOf(celula);
  const tabela = celula.closest('table');
  if (linha.children.length <= 1) { tabela.remove(); return null; }
  for (const l of tabela.querySelectorAll('tr')) l.children[i]?.remove();
  return linha.children[Math.max(0, i - 1)] ?? null;
}

/** Poe o cursor no comeco de uma celula. */
function focarCelula(celula) {
  if (!celula) return;
  const r = document.createRange();
  r.selectNodeContents(celula);
  r.collapse(true);
  const s = window.getSelection();
  s.removeAllRanges();
  s.addRange(r);
}

/*
 * Cursor dentro de um bloco, contado em caracteres.
 *
 * Repintar troca o HTML por dentro, e o navegador perde a posicao: o cursor
 * salta para o comeco a cada tecla. Contar caracteres sobrevive a troca porque
 * o texto nao muda — so a marcacao em volta dele.
 */
function posicaoNoBloco(bloco) {
  const sel = window.getSelection();
  if (!sel?.rangeCount || !bloco.contains(sel.anchorNode)) return null;
  const r = sel.getRangeAt(0).cloneRange();
  r.selectNodeContents(bloco);
  r.setEnd(sel.getRangeAt(0).endContainer, sel.getRangeAt(0).endOffset);
  return r.toString().length;
}

function devolverPosicao(bloco, quantos) {
  if (quantos == null) return;
  const passo = document.createTreeWalker(bloco, NodeFilter.SHOW_TEXT);
  let contados = 0;
  let no;
  while ((no = passo.nextNode())) {
    if (contados + no.length >= quantos) {
      const r = document.createRange();
      r.setStart(no, quantos - contados);
      r.collapse(true);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(r);
      return;
    }
    contados += no.length;
  }
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

    // Onde a barra muda de assunto: marcacao de texto, alinhamento, blocos.
    const GRUPOS = new Set(['esquerda', 'citacao']);

    this.barra = el('div', { class: 'tuc-rico__barra', role: 'toolbar', 'aria-label': 'Formatação' },
      this.opts.toolbar.flatMap((nome) => {
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
        return GRUPOS.has(nome)
          ? [el('span', { class: 'tuc-rico__sep', 'aria-hidden': 'true' }), b]
          : [b];
      }));

    /*
     * Barra de tabela: so aparece com o cursor dentro de uma. Poe-la sempre
     * visivel encheria a barra principal de botoes inuteis na maior parte do
     * tempo, e escondida ela ensina onde procurar quando faz falta.
     */
    this.barraTabela = el('div', {
      class: 'tuc-rico__barra is-tabela',
      role: 'toolbar',
      'aria-label': 'Tabela',
      hidden: true,
    }, Object.keys(TABELA).map((nome) => el('button', {
      type: 'button',
      class: `tuc-btn is-ghost is-icon is-sm${nome.startsWith('remover') ? ' is-remover' : ''}`,
      'aria-label': ROTULOS_TABELA[nome],
      'data-tuc-tip': ROTULOS_TABELA[nome],
      onmousedown: (e) => { e.preventDefault(); this.naTabela(nome); },
    }, [icon(ICONES_TABELA[nome], 15)])));

    this.raiz = el('div', { class: 'tuc-rico' }, [this.barra, this.barraTabela, this.area]);
    campo.parentNode.insertBefore(this.raiz, campo);
    this.raiz.append(campo);
    campo.hidden = true;
    campo.classList.add('tuc-rico__valor');

    this._cleanups.push(
      on(this.area, 'input', () => { this._sincronizar(); this._agendarPintura(); }),
      on(this.area, 'blur', () => this._sincronizar()),
      on(this.area, 'paste', (e) => this._colar(e)),
      on(this.area, 'keydown', (e) => this._teclado(e)),
      on(this.area, 'keyup', () => this._marcarAtivos()),
      on(this.area, 'mouseup', () => this._marcarAtivos()),
      // selectionchange e global: e o unico evento que pega o cursor mudando
      // de lugar por qualquer caminho, inclusive clique fora e volta.
      on(document, 'selectionchange', () => { this._verTabela(); this._marcarAtivos(); }),
    );

    this._pintar();
    campo._tucano = this;
    this.area._tucano = this;
  }

  /*
   * Pinta os blocos de codigo. A coloracao e so exibicao: a peneira dissolve
   * <span>, entao nada disso chega ao valor salvo — e nem deveria, porque cor
   * e decisao de quem exibe, nao conteudo.
   */
  _pintar() {
    for (const code of this.area.querySelectorAll('pre > code')) {
      const cru = code.textContent;
      const pintado = destacar(cru);
      if (code.innerHTML === pintado) continue;
      const onde = posicaoNoBloco(code);
      code.innerHTML = pintado;
      devolverPosicao(code, onde);
    }
  }

  /* O textarea escondido e a fonte da verdade para o formulario. */
  _sincronizar() {
    const limpo = sanitizar(this.area.innerHTML);
    if (this.campo.value === limpo) return;
    this.campo.value = limpo;
    this.campo.dispatchEvent(new Event('input', { bubbles: true }));
    this.campo.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /* Adiado: repintar a cada tecla brigaria com a digitacao. */
  _agendarPintura() {
    clearTimeout(this._pincel);
    this._pincel = setTimeout(() => this._pintar(), 180);
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
  /* Elemento em volta do cursor, dentro da area. */
  _noAtual() {
    const sel = window.getSelection();
    if (!sel?.anchorNode || !this.area.contains(sel.anchorNode)) return null;
    return sel.anchorNode.nodeType === Node.ELEMENT_NODE ? sel.anchorNode : sel.anchorNode.parentElement;
  }

  _marcarAtivos() {
    const no = this._noAtual();
    for (const b of this.barra.querySelectorAll('[data-acao]')) {
      const acao = b.dataset.acao;
      const cmd = ESTADOS[acao];
      const seletor = ANCESTRAIS[acao];
      if (!cmd && !seletor) continue;

      let ativo = false;
      if (cmd) {
        try { ativo = document.queryCommandState(cmd); } catch { /* sem selecao */ }
      } else if (no) {
        ativo = !!no.closest?.(seletor);
      }
      b.setAttribute('aria-pressed', String(ativo));
      b.classList.toggle('is-ativo', ativo);
    }
  }

  /** Celula onde o cursor esta, ou nada. */
  _celulaAtual() {
    const sel = window.getSelection();
    if (!sel?.anchorNode || !this.area.contains(sel.anchorNode)) return null;
    const no = sel.anchorNode.nodeType === Node.ELEMENT_NODE ? sel.anchorNode : sel.anchorNode.parentElement;
    const celula = no?.closest?.('th, td') ?? null;
    /*
     * A selecao sobrevive ao no que ela apontava: remover uma linha deixa o
     * cursor num elemento que ja saiu do documento, e a operacao seguinte
     * receberia uma celula sem pai. Confirmar que ela ainda esta na area custa
     * uma checagem e evita quebrar no segundo clique.
     */
    return celula && this.area.contains(celula) ? celula : null;
  }

  _verTabela() {
    const dentro = !!this._celulaAtual();
    if (this.barraTabela.hidden !== !dentro) this.barraTabela.hidden = !dentro;
  }

  /** Operacao de tabela na celula onde o cursor esta. */
  naTabela(nome) {
    const celula = this._celulaAtual();
    if (!celula) return this;
    const destino = TABELA[nome]?.(celula);
    this.area.focus();
    focarCelula(destino);
    this._sincronizar();
    this._verTabela();
    return this;
  }

  aplicar(nome) {
    this.area.focus();
    if (nome === 'tabela') {
      const { linhas, colunas } = this.opts.tabela;
      const tabela = montarTabela(document, linhas, colunas);
      const sel = window.getSelection();

      /*
       * Com o cursor dentro de uma celula, a nova tabela nasce depois da
       * atual, e nao dentro dela. Tabela aninhada quase nunca e o que se
       * queria, e desfazer isso pelo editor e trabalhoso — o clique certo e
       * dificil de acertar entre duas molduras encaixadas.
       */
      const dentro = this._celulaAtual()?.closest('table');
      if (dentro) {
        dentro.after(tabela);
        const p = document.createElement('p');
        p.append(document.createElement('br'));
        tabela.after(p);
        focarCelula(tabela.querySelector('th'));
        this._sincronizar();
        return this;
      }

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
    this._pintar();
    return this;
  }

  getValue() { return sanitizar(this.area.innerHTML); }
  setValue(html) {
    this.area.innerHTML = sanitizar(html) || '<p><br></p>';
    this._pintar();
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
