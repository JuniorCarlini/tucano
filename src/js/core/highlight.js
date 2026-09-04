import { el, escapeHtml, icon, on } from './dom.js';
/*
 * Destaque de codigo, generico.
 *
 * Nao conhece linguagem nenhuma de proposito. Reconhece o que aparece em quase
 * todas — comentario, texto entre aspas, numero, tag, atributo e as chaves de
 * template — e para por ai. Um destacador de verdade custaria mais do que a
 * biblioteca inteira, e o ganho aqui e legibilidade, nao analise sintatica.
 *
 * Trabalha sobre texto ja escapado e devolve <span> com classe. Quem salva nao
 * precisa se preocupar: a peneira do editor dissolve span, entao a coloracao e
 * so exibicao e nunca entra no que vai para o banco.
 */


const WORDS = [
    // fluxo, comum a quase tudo
    'if', 'else', 'elif', 'for', 'while', 'return', 'break', 'continue', 'try', 'catch', 'except',
    'finally', 'switch', 'case', 'in', 'is', 'not', 'and', 'or', 'with', 'as', 'from',
    // declaracao
    'const', 'let', 'var', 'function', 'def', 'class', 'import', 'export', 'default',
    'async', 'await', 'new', 'this', 'self', 'lambda', 'pass', 'yield',
    // valores
    'true', 'false', 'null', 'undefined', 'None', 'True', 'False',
    // shell
    'npm', 'git', 'cd', 'echo', 'sudo', 'pip', 'python', 'node',
    // SQL costuma vir em caixa alta, entao as duas formas entram
    'select', 'SELECT', 'from', 'FROM', 'where', 'WHERE', 'join', 'JOIN',
    'insert', 'INSERT', 'update', 'UPDATE', 'delete', 'DELETE', 'values', 'VALUES',
    'order', 'ORDER', 'group', 'GROUP', 'limit', 'LIMIT', 'having', 'HAVING',
    // marcadores que aparecem em varias linguagens
    'public', 'private', 'static', 'void', 'int', 'float', 'string', 'bool',
    'struct', 'enum', 'interface', 'type', 'end', 'do', 'then', 'fn', 'func', 'let',
].join('|');

/*
 * A ordem importa e e por isso que tudo cabe numa expressao so: o primeiro
 * grupo que casar vence. Comentario antes de string, senao uma aspa dentro de
 * comentario abriria texto; string antes de tudo o mais, senao uma palavra
 * dentro de aspas seria pintada como palavra-chave.
 */
const RULES = [
  ['comment', /(&lt;!--[\s\S]*?--&gt;|\/\*[\s\S]*?\*\/|\/\/[^\n]*|#[^\n]*)/],
  ['text',  /("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`)/],
  ['tmpl',   /(\{%[\s\S]*?%\}|\{\{[\s\S]*?\}\})/],
  ['tag',    /(&lt;\/?[a-zA-Z][\w-]*)/],
  ['attr',   /([a-zA-Z-][\w-]*)(?==)/],
  ['num',    /\b(\d+(?:\.\d+)?)\b/],
  /*
   * As palavras entram na mesma expressao, e nao numa segunda passada.
   *
   * Separadas, elas eram procuradas de novo no HTML que a primeira passada
   * acabara de gerar — e `class` esta na lista, entao a palavra era encontrada
   * dentro do atributo `class="tuc-tok-attr"` e envolvida outra vez. O
   * resultado era marcacao aninhada quebrada, que o navegador mostrava como
   * text solto no meio do codigo.
   */
  ['key',  new RegExp(`\\b(${WORDS})\\b`)],
];

const COMBINADA = new RegExp(RULES.map(([, re]) => re.source).join('|'), 'g');

/** Recebe codigo cru e devolve HTML com as marcacoes de cor. */
export function highlight(code) {
  const text = escapeHtml(code ?? '');
  return text.replace(COMBINADA, (whole, ...groups) => {
    const i = groups.findIndex((g) => g !== undefined);
    const className = RULES[i]?.[0];
    return className ? `<span class="tuc-tok-${className}">${whole}</span>` : whole;
  });
}

/**
 * Pinta os blocos de codigo do conteudo ja publicado.
 *
 * O que foi salvo e texto puro dentro de <pre><code>, porque cor nao e
 * conteudo. Aqui ela e reposta na hora de exibir — e so do lado de quem le.
 * Roda sozinho pelo init(), inclusive no que chegar depois por HTMX.
 */
export function autoInit(scope = document) {
  const blocks = [...scope.querySelectorAll('.tuc-prose pre > code:not([data-tuc-painted])')];
  for (const code of blocks) {
    code.setAttribute('data-tuc-painted', '');
    code.innerHTML = highlight(code.textContent);
    addCopy(code.parentElement);
  }
  return blocks;
}

const ICON_COPY = 'M20 9h-9a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-9a2 2 0 00-2-2zM5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1';
const ICON_OK = 'M20 6L9 17l-5-5';

/*
 * Botao de copiar no bloco de codigo.
 *
 * O texto sai do `textContent`, e nao do HTML: assim vai o codigo cru, sem as
 * marcacoes de cor que acabamos de inserir.
 *
 * Ele so aparece no hover e no foco. Um botao permanente em cada bloco compete
 * com o codigo, que e o que a pessoa veio ler — mas quem navega por teclado
 * precisa alcanca-lo, entao ele continua no fluxo do Tab, apenas transparente.
 *
 * A area de transferencia exige contexto seguro; fora dele o retorno e
 * selecionar o bloco, que deixa o Ctrl+C a um toque.
 */
function addCopy(pre) {
  if (!pre || pre.querySelector('.tuc-copy')) return;
  pre.classList.add('tuc-prose__block');

  // O botao e o do sistema; .tuc-copy so o posiciona no canto do bloco.
  const btn = el('button', {
    type: 'button', class: 'tuc-btn is-outline is-icon is-sm tuc-copy',
    'aria-label': 'Copiar código',
  }, [icon(ICON_COPY, 14), icon(ICON_OK, 14)]);
  btn.children[1].classList.add('tuc-copy__ok');

  on(btn, 'click', async () => {
    const text = pre.querySelector('code')?.textContent ?? pre.textContent;
    try {
      await navigator.clipboard.writeText(text.trim());
    } catch {
      const sel = getSelection();
      sel.removeAllRanges();
      const r = document.createRange();
      r.selectNodeContents(pre);
      sel.addRange(r);
      return;
    }
    btn.classList.add('is-copied');
    btn.setAttribute('aria-label', 'Copiado');
    setTimeout(() => {
      btn.classList.remove('is-copied');
      btn.setAttribute('aria-label', 'Copiar código');
    }, 1600);
  });

  pre.append(btn);
}
