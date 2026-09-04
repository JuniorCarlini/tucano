/*
 * Peneira de HTML para o editor de texto.
 *
 * A lista de tags e fechada e curta porque nos controlamos o que o editor
 * produz: qualquer outra coisa chegou colada de fora, ou de um navegador que
 * resolveu marcar diferente. O que nao esta na lista perde a tag e mantem o
 * texto — nada e apagado do que a pessoa escreveu, so a marcacao estranha.
 *
 * Atributo nenhum sobrevive, exceto o href de um link, e ainda assim so se
 * apontar para um destino aceitavel. E por ai que passariam `onclick`,
 * `onerror` e `javascript:`.
 *
 * Isto protege o editor, nao a publicacao: o servidor deve sanitizar de novo
 * antes de renderizar para o publico, porque o HTML chega por POST e ninguem
 * garante que veio daqui.
 */

const ALLOWED = new Set([
  'P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'S',
  'H2', 'H3', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'CODE', 'PRE', 'A',
  'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD',
]);

/* Tag que so existe para agrupar: o conteudo sobe e ela some. */
const TRANSPARENT = new Set(['DIV', 'SPAN', 'FONT', 'SECTION', 'ARTICLE', 'MAIN']);

const EQUIVALENTS = { B: 'STRONG', I: 'EM' };

/*
 * Alinhamento e a unica coisa de `style` que sobrevive — e nem ela passa como
 * veio. Lemos o valor ja interpretado pelo navegador, conferimos contra quatro
 * palavras conhecidas e reescrevemos a declaracao do zero. Assim nao existe
 * caminho por onde um `style` inteiro entre: o que sai daqui foi escrito aqui.
 */
const ALIGNMENTS = new Set(['left', 'center', 'right', 'justify']);
const ALIGNABLE = new Set(['P', 'H2', 'H3', 'LI', 'BLOCKQUOTE', 'TD', 'TH']);

function copyAlignment(de, para) {
  if (!ALIGNABLE.has(para.tagName)) return;
  const value = (de.style?.textAlign || '').toLowerCase();
  if (ALIGNMENTS.has(value)) para.setAttribute('style', `text-align: ${value}`);
}

function safeUrl(url) {
  const plain = (url || '').trim();
  return /^(https?:|mailto:|tel:|#|\/)/i.test(plain) ? plain : '';
}

function clearNode(no, destination, doc) {
  for (const child of [...no.childNodes]) {
    if (child.nodeType === Node.TEXT_NODE) {
      destination.append(doc.createTextNode(child.nodeValue));
      continue;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) continue;

    const tag = child.tagName;

    // Script e style nao viram texto: o conteudo deles nao e para ser lido.
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'IFRAME' || tag === 'OBJECT') continue;

    if (TRANSPARENT.has(tag) || !ALLOWED.has(tag)) {
      clearNode(child, destination, doc);
      continue;
    }

    const novo = doc.createElement(EQUIVALENTS[tag] || tag);
    copyAlignment(child, novo);
    if (novo.tagName === 'A') {
      const href = safeUrl(child.getAttribute('href'));
      if (!href) { clearNode(child, destination, doc); continue; }
      novo.setAttribute('href', href);
      novo.setAttribute('target', '_blank');
      novo.setAttribute('rel', 'noopener noreferrer');
    }
    clearNode(child, novo, doc);
    destination.append(novo);
  }
}

/** Devolve HTML com apenas as tags e atributos que aceitamos. */
export function sanitize(html) {
  const doc = document.implementation.createHTMLDocument('');
  const input = doc.createElement('div');
  // innerHTML num documento solto: nada aqui executa nem carrega recurso.
  input.innerHTML = String(html ?? '');
  const exit = doc.createElement('div');
  clearNode(input, exit, doc);
  return exit.innerHTML;
}

/** Texto puro, para colar sem trazer a formatacao da origem. */
export function textOnly(html) {
  const doc = document.implementation.createHTMLDocument('');
  const d = doc.createElement('div');
  d.innerHTML = String(html ?? '');
  return d.textContent || '';
}
