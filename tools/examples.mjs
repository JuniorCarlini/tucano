#!/usr/bin/env node
/*
 * Confere os exemplos da documentacao contra o codigo de verdade.
 *
 * Exemplo que nao funciona e pior que exemplo que falta: quem le confia. Tres
 * defeitos desta biblioteca sairam justamente daqui — `Tucano.gaveta()` que
 * deixou de existir, `tom:'perigo'` que nenhum componente le, e o `actions`
 * anunciado com as chaves antigas. Nenhum quebrava a pagina; todos quebravam
 * quem copiasse.
 *
 * O que e conferido, por bloco:
 *   HTML  — cola no documento, roda Tucano.init(), e exige que todo atributo
 *           data-tuc-* tenha virado componente e que nada tenha estourado.
 *   JS    — nao executa. Exemplo de documentacao cita `#entrega` e `formulario`,
 *           que nao existem, e rodar so daria ruido. O que vale conferir e o
 *           nome: se `Tucano.x` existe, se o metodo existe no prototipo, e se
 *           cada chave de opcao — inclusive dentro de `actions` e `items` — e
 *           lida por alguem. Foi por chave que os tres defeitos passaram.
 * Shell, Python e template Django ficam de fora: nao sao para rodar.
 *
 * A pagina roda no navegador porque so la existe o Tucano montado — no Chromium,
 * pelo Playwright: o que se confere aqui e nome, e nome nao muda de motor. O codigo que
 * roda la esta na funcao `check` abaixo, injetada por toString(): escrita
 * dentro de um template literal, cada `\d` de regex viraria `d` calado.
 */
import { writeFileSync, unlinkSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, normalize } from 'node:path';
import { pathToFileURL } from 'node:url';
import { openPage } from './browsers.mjs';
import { pages } from './pages.mjs';

/* ---- o que o codigo aceita, lido do proprio codigo ---- */

const FILES = [];
for (const dir of ['src/js/components', 'src/js/core']) {
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.js'))) FILES.push(`${dir}/${f}`);
}

const OPTIONS = {};
{
  for (const file of FILES) {
    const t = readFileSync(file, 'utf8');
    const d = t.match(/const DEFAULTS = \{([\s\S]*?)\n\};/);
    if (!d) continue;
    const keys = [...d[1].matchAll(/^\s{2}(\w+):/gm)].map((m) => m[1]);
    const name = (t.match(/^export class (\w+)/m) || [])[1];
    if (name) OPTIONS[name] = keys;
    for (const m of t.matchAll(/^export function (\w+)/gm)) OPTIONS[m[1]] ??= keys;
  }
}
/* Os atalhos herdam as opcoes da classe; confirm ainda aceita os dois rotulos. */
OPTIONS.modal = OPTIONS.Modal;
OPTIONS.drawer = OPTIONS.Drawer;
OPTIONS.toast = OPTIONS.Toast;
OPTIONS.confirm = [...(OPTIONS.Modal || []), 'confirm', 'cancel'];

/*
 * Objetos dentro de uma opcao — `actions: [{ text, ... }]`.
 *
 * A forma nao esta no DEFAULTS: quem le as chaves e outro arquivo, longe dali.
 * O que existe e o comentario ao lado da opcao, e e justamente ele que envelhece
 * calado — o modal anunciou `[{ texto, variante, onClick, fecha }]` durante toda
 * a padronizacao em ingles, com tres dos quatro nomes errados.
 *
 * Entao a forma sai do codigo, e o comentario e conferido contra ela. Uma opcao
 * entra aqui quando o comentario declara chaves entre chaves; as chaves de
 * verdade saem de onde elas sao lidas: acesso direto (`action.text`), o `.map`
 * que percorre a lista, e um salto para dentro do metodo quando o map so
 * encaminha (`items.map((i) => this._item(i))`).
 */
const ARRAY_MEMBERS = new Set(['map', 'length', 'indexOf', 'forEach', 'filter', 'slice', 'push',
  'splice', 'find', 'findIndex', 'includes', 'concat', 'join', 'some', 'every', 'sort', 'at']);

const enclosed = (src, i, open, close) => {
  const a = src.indexOf(open, i);
  let n = 0;
  for (let j = a; j < src.length; j++) {
    if (src[j] === open) n++;
    else if (src[j] === close && --n === 0) return src.slice(a, j + 1);
  }
  return src.slice(a);
};

/* O arquivo que declara a opcao mais os que ele importa: `actions` e do modal,
   mas quem le as chaves e o core/dialog.js. Sem esse limite, o `items` do
   dropdown se mistura com o `items` do upload, que e outra coisa. */
function scope(file) {
  const src = readFileSync(file, 'utf8');
  return [file, ...[...src.matchAll(/from '(\.[^']+)'/g)]
    .map((m) => normalize(join(dirname(file), m[1])))
    .filter((p) => FILES.includes(p))];
}

function shapeOf(file, name) {
  const keys = new Set();
  for (const p of scope(file)) {
    const src = readFileSync(p, 'utf8');
    for (const m of src.matchAll(new RegExp(`\\b${name}\\.(\\w+)`, 'g'))) keys.add(m[1]);
    for (const m of src.matchAll(new RegExp(`\\b${name}\\b[^\\n]*?\\.map\\(\\((\\w+)\\)\\s*=>`, 'g'))) {
      const bind = m[1];
      const snippet = enclosed(src, src.indexOf('.map(', m.index) + 4, '(', ')');
      for (const k of snippet.matchAll(new RegExp(`\\b${bind}\\.(\\w+)`, 'g'))) keys.add(k[1]);
      const jump = snippet.match(new RegExp(`this\\.(_\\w+)\\(${bind}\\)`));
      if (!jump) continue;
      const method = src.match(new RegExp(`\\n  ${jump[1]}\\((\\w+)\\)`));
      if (!method) continue;
      const inner = enclosed(src, method.index + method[0].length, '{', '}');
      for (const k of inner.matchAll(new RegExp(`\\b${method[1]}\\.(\\w+)`, 'g'))) keys.add(k[1]);
    }
  }
  for (const x of ARRAY_MEMBERS) keys.delete(x);
  return [...keys].sort();
}

const NESTED = {};
const wrongComments = [];
for (const file of FILES) {
  const t = readFileSync(file, 'utf8');
  const d = t.match(/const DEFAULTS = \{([\s\S]*?)\n\};/);
  if (!d) continue;
  for (const m of d[1].matchAll(/^\s{2}(\w+):[^\n]*?\/\/[^\n]*?\{([^}]*)\}/gm)) {
    const declared = m[2].split(',').map((x) => x.trim()).filter((x) => /^\w+$/.test(x)).sort();
    if (declared.length < 2) continue;
    const actual = shapeOf(file, m[1]);
    if (!actual.length) continue;
    NESTED[m[1]] = actual;
    const extra = declared.filter((k) => !actual.includes(k));
    const missing = actual.filter((k) => !declared.includes(k));
    if (extra.length || missing.length) {
      wrongComments.push(`${file.replace('src/js/', '')}  ${m[1]}: o comentário diz `
        + `{ ${declared.join(', ')} }, o código lê { ${actual.join(', ')} }`);
    }
  }
}

/* ---- de onde saem os exemplos ---- */

const decode = (t) => t.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');

/* Django, shell e prosa nao rodam; trecho sem tag nem chamada nao e exemplo. */
const runnable = (c) => !/\{%|\{\{|^\s*(\$|pip |npm |python|git )/m.test(c)
  && (/<[a-z]+[\s>]/.test(c) || /Tucano\./.test(c));
const isJs = (c) => /Tucano\.\w/.test(c) && !c.trimStart().startsWith('<');

const blocks = [];
for (const file of ['README.md', 'llms.txt']) {
  const text = readFileSync(file, 'utf8');
  for (const m of text.matchAll(/```(\w*)\n([\s\S]*?)```/g)) {
    const code = m[2].trim();
    if (!runnable(code)) continue;
    blocks.push({ file, line: text.slice(0, m.index).split('\n').length, type: isJs(code) ? 'js' : 'html', code });
  }
}
/* No site os exemplos vivem em <code>, escapados — em todas as paginas geradas. */
for (const file of pages) {
  const html = readFileSync(file, 'utf8');
  for (const m of html.matchAll(/<code[^>]*>([\s\S]*?)<\/code>/g)) {
    const code = decode(m[1]).trim();
    if (code.length <= 20 || !runnable(code)) continue;
    blocks.push({ file, line: html.slice(0, m.index).split('\n').length, type: isJs(code) ? 'js' : 'html', code });
  }
}

/* ---- o que roda no navegador ---- */

function check({ OPTIONS, NESTED, BLOCKS }) {
  const failures = [];
  // Um exemplo que estoura fora do try — num setTimeout do componente, por
  // exemplo — so vira falha com nome e linha por causa deste handler.
  let lastError = null;
  addEventListener('error', (e) => { lastError = e.message; });

  const ATTRIBUTES = '[data-tuc-datepicker],[data-tuc-select],[data-tuc-color],[data-tuc-mask],'
    + '[data-tuc-upload],[data-tuc-editor],[data-tuc-accordion],[data-tuc-table],[data-tuc-tip],'
    + '[data-tuc-reveal],[data-tuc-dropdown],[data-tuc-tabs]';
  // data-tuc-format nao monta componente: so reescreve o texto, e marca isso
  // com data-tuc-formatted. Sentinela diferente porque o estado e outro.
  const FORMATTED = '[data-tuc-format]:not([data-tuc-formatted])';

  for (const b of BLOCKS) {
    const where = b.file + ':' + b.line + '  ';
    const stage = document.getElementById('stage');
    stage.innerHTML = '';
    lastError = null;
    try {
      if (b.type === 'html') {
        stage.innerHTML = b.code;
        Tucano.init(stage);
        // Atributo que nao virou componente significa nome que mudou.
        for (const p of stage.querySelectorAll(ATTRIBUTES)) {
          if (!p.hasAttribute('data-tuc-ready')) failures.push(where + 'não montou: ' + p.outerHTML.slice(0, 60));
        }
        for (const p of stage.querySelectorAll(FORMATTED)) {
          failures.push(where + 'não formatou: ' + p.outerHTML.slice(0, 60));
        }
      } else {
        // Nome que deixou de existir e o defeito classico (Tucano.gaveta).
        for (const m of b.code.matchAll(/Tucano\.(\w+)/g)) {
          if (Tucano[m[1]] === undefined) failures.push(where + 'Tucano.' + m[1] + ' não existe');
        }
        // Metodo chamado numa instancia guardada em variavel. So vale para as
        // classes: `Tucano.toast(...)` devolve um Toast, e o prototipo do
        // atalho e vazio — comparar com ele acusaria metodo que existe.
        for (const m of b.code.matchAll(/(?:const|let|var)\s+(\w+)\s*=\s*(?:new\s+)?Tucano\.([A-Z]\w+)/g)) {
          const proto = Tucano[m[2]] && Tucano[m[2]].prototype;
          if (!proto) continue;
          for (const c of b.code.matchAll(new RegExp('\\b' + m[1] + '\\.(\\w+)\\s*\\(', 'g'))) {
            if (!(c[1] in proto)) failures.push(where + m[2] + ' não tem o método ' + c[1] + '()');
          }
        }
        // Chave que ninguem le nao quebra nada — so nao faz nada, calada.
        // Duas formas: o objeto em varias linhas e o objeto numa linha so. Foi
        // pela segunda que `sensivel: true` ficou anos na documentacao.
        const calls = [...b.code.matchAll(/Tucano\.(\w+)\s*\(\s*(?:'[^']*'\s*,\s*)?\{([\s\S]*?)\n\}\)/g)]
          .concat([...b.code.matchAll(/Tucano\.(\w+)\s*\(\s*(?:'[^']*'\s*,\s*)?\{([^\n{}]*)\}\s*\)/g)]);
        for (const m of calls) {
          const accepted = OPTIONS[m[1]];
          if (!accepted) continue;
          // Sem os objetos e listas de dentro: as chaves deles sao conferidas
          // logo abaixo, contra a forma certa, e nao contra as opcoes de topo.
          const shallow = m[2].replace(/\[[\s\S]*?\]|\{[\s\S]*?\}/g, '');
          for (const k of shallow.matchAll(/(?:^|[{,])\s*(\w+):/gm)) {
            if (!accepted.includes(k[1])) failures.push(where + m[1] + ' não lê a opção ' + k[1]);
          }
          for (const key of Object.keys(NESTED)) {
            const inner = m[2].match(new RegExp(key + ':\\s*[\\[{]([\\s\\S]*?)[\\]}],?\\n'));
            if (!inner) continue;
            for (const k of inner[1].matchAll(/[{,]\s*(\w+):/g)) {
              if (!NESTED[key].includes(k[1])) failures.push(where + key + ' não tem a chave ' + k[1]);
            }
          }
        }
      }
      if (lastError) failures.push(where + lastError);
    } catch (e) {
      failures.push(where + e.message);
    }
  }
  document.title = JSON.stringify({ total: BLOCKS.length, failures });
}

const data = JSON.stringify({ OPTIONS, NESTED, BLOCKS: blocks })
  .replace(/<\//g, '<\\/');   // uma tag de fechamento num exemplo fecharia o bloco
const page = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<style>${readFileSync('dist/tucano.css', 'utf8')}
*{transition:none!important;animation:none!important}</style></head><body><div id="stage"></div>
<script>${readFileSync('dist/tucano.js', 'utf8')}</script>
<script>try { (${check.toString()})(${data}); }
catch (e) { document.title = JSON.stringify({ error: e.message + ' — ' + String(e.stack).slice(0, 200) }); }</script>
</body></html>`;

const file = join(tmpdir(), `tucano-examples-${process.pid}.html`);
writeFileSync(file, page);
let exitCode = 0;
const { browser, page: tab } = await openPage('chromium');
try {
  await tab.goto(pathToFileURL(file).href);
  // O resultado e escrito no titulo, de uma vez, no fim da checagem.
  const title = await tab.waitForFunction(() => document.title.startsWith('{') && document.title, null, { timeout: 60000 })
    .then((h) => h.jsonValue(), () => null);
  if (!title) {
    console.error('[examples] a página não terminou de rodar');
    exitCode = 1;
  } else {
    const r = JSON.parse(title);
    if (r.error) { console.error('[examples] ' + r.error); exitCode = 1; }
    else {
      for (const f of wrongComments) console.log('  FALHA  ' + f);
      for (const f of r.failures) console.log('  FALHA  ' + f);
      const total = r.failures.length + wrongComments.length;
      console.log(`${r.total} exemplos conferidos e ${Object.keys(NESTED).length} formas aninhadas`
        + ` extraídas do código, ${total} com problema`);
      exitCode = total ? 1 : 0;
    }
  }
} finally {
  await browser.close();
  if (process.env.KEEP) console.log('pagina em', file); else unlinkSync(file);
}
process.exit(exitCode);
