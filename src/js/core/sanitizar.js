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

const PERMITIDAS = new Set([
  'P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'S',
  'H2', 'H3', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'CODE', 'PRE', 'A',
  'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD',
]);

/* Tag que so existe para agrupar: o conteudo sobe e ela some. */
const TRANSPARENTES = new Set(['DIV', 'SPAN', 'FONT', 'SECTION', 'ARTICLE', 'MAIN']);

const EQUIVALENTES = { B: 'STRONG', I: 'EM' };

/*
 * Alinhamento e a unica coisa de `style` que sobrevive — e nem ela passa como
 * veio. Lemos o valor ja interpretado pelo navegador, conferimos contra quatro
 * palavras conhecidas e reescrevemos a declaracao do zero. Assim nao existe
 * caminho por onde um `style` inteiro entre: o que sai daqui foi escrito aqui.
 */
const ALINHAMENTOS = new Set(['left', 'center', 'right', 'justify']);
const ALINHAVEIS = new Set(['P', 'H2', 'H3', 'LI', 'BLOCKQUOTE', 'TD', 'TH']);

function copiarAlinhamento(de, para) {
  if (!ALINHAVEIS.has(para.tagName)) return;
  const valor = (de.style?.textAlign || '').toLowerCase();
  if (ALINHAMENTOS.has(valor)) para.setAttribute('style', `text-align: ${valor}`);
}

function urlSegura(url) {
  const limpo = (url || '').trim();
  return /^(https?:|mailto:|tel:|#|\/)/i.test(limpo) ? limpo : '';
}

function limparNo(no, destino, doc) {
  for (const filho of [...no.childNodes]) {
    if (filho.nodeType === Node.TEXT_NODE) {
      destino.append(doc.createTextNode(filho.nodeValue));
      continue;
    }
    if (filho.nodeType !== Node.ELEMENT_NODE) continue;

    const tag = filho.tagName;

    // Script e style nao viram texto: o conteudo deles nao e para ser lido.
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'IFRAME' || tag === 'OBJECT') continue;

    if (TRANSPARENTES.has(tag) || !PERMITIDAS.has(tag)) {
      limparNo(filho, destino, doc);
      continue;
    }

    const novo = doc.createElement(EQUIVALENTES[tag] || tag);
    copiarAlinhamento(filho, novo);
    if (novo.tagName === 'A') {
      const href = urlSegura(filho.getAttribute('href'));
      if (!href) { limparNo(filho, destino, doc); continue; }
      novo.setAttribute('href', href);
      novo.setAttribute('target', '_blank');
      novo.setAttribute('rel', 'noopener noreferrer');
    }
    limparNo(filho, novo, doc);
    destino.append(novo);
  }
}

/** Devolve HTML com apenas as tags e atributos que aceitamos. */
export function sanitizar(html) {
  const doc = document.implementation.createHTMLDocument('');
  const entrada = doc.createElement('div');
  // innerHTML num documento solto: nada aqui executa nem carrega recurso.
  entrada.innerHTML = String(html ?? '');
  const saida = doc.createElement('div');
  limparNo(entrada, saida, doc);
  return saida.innerHTML;
}

/** Texto puro, para colar sem trazer a formatacao da origem. */
export function soTexto(html) {
  const doc = document.implementation.createHTMLDocument('');
  const d = doc.createElement('div');
  d.innerHTML = String(html ?? '');
  return d.textContent || '';
}
