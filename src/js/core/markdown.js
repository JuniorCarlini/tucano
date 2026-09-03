/*
 * Markdown para HTML, no subconjunto que um formulario de sistema usa.
 *
 * A ordem aqui e a propria seguranca: o texto e escapado ANTES de virar HTML.
 * Tudo o que o usuario digitou deixa de poder abrir uma tag, e so as marcacoes
 * que reconhecemos depois reintroduzem tags — que sao nossas, nao dele. O
 * caminho inverso, marcar primeiro e escapar depois, e como se escreve um XSS.
 *
 * Isto e pre-visualizacao, nao publicacao: o que vai para o banco e o markdown
 * cru, e quem o renderiza para o mundo e o servidor, com a biblioteca dele.
 */

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapar = (t) => String(t).replace(/[&<>"']/g, (c) => ESCAPES[c]);

/*
 * Endereco de link so passa se for http, https, mailto ou relativo. Sem esta
 * peneira, `[clique](javascript:...)` viraria um link executavel — a marcacao e
 * nossa, mas o destino veio de quem digitou.
 */
function limparUrl(url) {
  const limpo = url.trim();
  if (/^(https?:|mailto:|#|\/|\.{1,2}\/)/i.test(limpo)) return limpo;
  return '';
}

/** Marcacao dentro de uma linha: negrito, italico, codigo e link. */
function inline(texto) {
  return texto
    // Codigo primeiro: dentro dele, o resto nao deve ser interpretado.
    .replace(/`([^`]+)`/g, (_, c) => `<code>${c}</code>`)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/(^|[^_])_([^_]+)_/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (todo, rotulo, url) => {
      const destino = limparUrl(url);
      if (!destino) return rotulo;
      // rel: link de terceiro nao deve poder mexer na janela que o abriu.
      return `<a href="${destino}" target="_blank" rel="noopener noreferrer">${rotulo}</a>`;
    });
}

export function renderizar(markdown) {
  const linhas = escapar(markdown ?? '').split('\n');
  const saida = [];
  let lista = null;      // 'ul' | 'ol' enquanto uma lista esta aberta
  let citacao = false;
  let bloco = false;     // dentro de ``` ```
  let buffer = [];

  const fecharLista = () => { if (lista) { saida.push(`</${lista}>`); lista = null; } };
  const fecharCitacao = () => { if (citacao) { saida.push('</blockquote>'); citacao = false; } };
  const soltarParagrafo = () => {
    if (!buffer.length) return;
    saida.push(`<p>${inline(buffer.join(' '))}</p>`);
    buffer = [];
  };

  for (const linha of linhas) {
    if (/^```/.test(linha)) {
      soltarParagrafo(); fecharLista(); fecharCitacao();
      saida.push(bloco ? '</code></pre>' : '<pre><code>');
      bloco = !bloco;
      continue;
    }
    if (bloco) { saida.push(linha); continue; }

    if (!linha.trim()) { soltarParagrafo(); fecharLista(); fecharCitacao(); continue; }

    const titulo = linha.match(/^(#{1,6})\s+(.*)$/);
    if (titulo) {
      soltarParagrafo(); fecharLista(); fecharCitacao();
      const n = titulo[1].length;
      saida.push(`<h${n}>${inline(titulo[2])}</h${n}>`);
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(linha.trim())) {
      soltarParagrafo(); fecharLista(); fecharCitacao();
      saida.push('<hr>');
      continue;
    }

    const item = linha.match(/^\s*([-*+]|\d+\.)\s+(.*)$/);
    if (item) {
      soltarParagrafo(); fecharCitacao();
      const tipo = /\d/.test(item[1]) ? 'ol' : 'ul';
      if (lista !== tipo) { fecharLista(); saida.push(`<${tipo}>`); lista = tipo; }
      saida.push(`<li>${inline(item[2])}</li>`);
      continue;
    }

    const cita = linha.match(/^&gt;\s?(.*)$/);
    if (cita) {
      soltarParagrafo(); fecharLista();
      if (!citacao) { saida.push('<blockquote>'); citacao = true; }
      saida.push(`<p>${inline(cita[1])}</p>`);
      continue;
    }

    fecharLista();
    buffer.push(linha.trim());
  }

  soltarParagrafo(); fecharLista(); fecharCitacao();
  if (bloco) saida.push('</code></pre>');
  return saida.join('\n');
}
