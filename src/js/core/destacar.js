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

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };
const escapar = (t) => String(t).replace(/[&<>]/g, (c) => ESCAPES[c]);

const PALAVRAS = [
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
const REGRAS = [
  ['coment', /(&lt;!--[\s\S]*?--&gt;|\/\*[\s\S]*?\*\/|\/\/[^\n]*|#[^\n]*)/],
  ['texto',  /("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`)/],
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
   * texto solto no meio do codigo.
   */
  ['chave',  new RegExp(`\\b(${PALAVRAS})\\b`)],
];

const COMBINADA = new RegExp(REGRAS.map(([, re]) => re.source).join('|'), 'g');

/** Recebe codigo cru e devolve HTML com as marcacoes de cor. */
export function destacar(codigo) {
  const texto = escapar(codigo ?? '');
  return texto.replace(COMBINADA, (todo, ...grupos) => {
    const i = grupos.findIndex((g) => g !== undefined);
    const classe = REGRAS[i]?.[0];
    return classe ? `<span class="tuc-tok-${classe}">${todo}</span>` : todo;
  });
}

/**
 * Pinta os blocos de codigo do conteudo ja publicado.
 *
 * O que foi salvo e texto puro dentro de <pre><code>, porque cor nao e
 * conteudo. Aqui ela e reposta na hora de mostrar — e so aqui, do lado de quem
 * le. Roda sozinho pelo init(), inclusive no que chegar depois por HTMX.
 */
export function autoInit(scope = document) {
  const blocos = [...scope.querySelectorAll('.tuc-prosa pre > code:not([data-tuc-pintado])')];
  for (const code of blocos) {
    code.setAttribute('data-tuc-pintado', '');
    code.innerHTML = destacar(code.textContent);
  }
  return blocos;
}
