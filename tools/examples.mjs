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
 * A pagina roda no navegador porque so la existe o Tucano montado. O codigo que
 * roda la esta na funcao `audit` abaixo, injetada por toString(): escrita
 * dentro de um template literal, cada `\d` de regex viraria `d` calado.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFileSync, unlinkSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, normalize } from 'node:path';
import { exigirChrome } from './chrome.mjs';

const exec = promisify(execFile);
const CHROME = exigirChrome('examples');

/* ---- o que o codigo aceita, lido do proprio codigo ---- */

const ARQUIVOS = [];
for (const dir of ['src/js/components', 'src/js/core']) {
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.js'))) ARQUIVOS.push(`${dir}/${f}`);
}

const OPCOES = {};
{
  for (const arq of ARQUIVOS) {
    const t = readFileSync(arq, 'utf8');
    const d = t.match(/const DEFAULTS = \{([\s\S]*?)\n\};/);
    if (!d) continue;
    const chaves = [...d[1].matchAll(/^\s{2}(\w+):/gm)].map((m) => m[1]);
    const nome = (t.match(/^export class (\w+)/m) || [])[1];
    if (nome) OPCOES[nome] = chaves;
    for (const m of t.matchAll(/^export function (\w+)/gm)) OPCOES[m[1]] ??= chaves;
  }
}
/* Os atalhos herdam as opcoes da classe; confirm ainda aceita os dois rotulos. */
OPCOES.modal = OPCOES.Modal;
OPCOES.drawer = OPCOES.Drawer;
OPCOES.toast = OPCOES.Toast;
OPCOES.confirm = [...(OPCOES.Modal || []), 'confirm', 'cancel'];

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
const DE_ARRAY = new Set(['map', 'length', 'indexOf', 'forEach', 'filter', 'slice', 'push',
  'splice', 'find', 'findIndex', 'includes', 'concat', 'join', 'some', 'every', 'sort', 'at']);

const recorte = (src, i, abre, fecha) => {
  const a = src.indexOf(abre, i);
  let n = 0;
  for (let j = a; j < src.length; j++) {
    if (src[j] === abre) n++;
    else if (src[j] === fecha && --n === 0) return src.slice(a, j + 1);
  }
  return src.slice(a);
};

/* O arquivo que declara a opcao mais os que ele importa: `actions` e do modal,
   mas quem le as chaves e o core/dialog.js. Sem esse limite, o `items` do
   dropdown se mistura com o `items` do upload, que e outra coisa. */
function escopo(arq) {
  const src = readFileSync(arq, 'utf8');
  return [arq, ...[...src.matchAll(/from '(\.[^']+)'/g)]
    .map((m) => normalize(join(dirname(arq), m[1])))
    .filter((p) => ARQUIVOS.includes(p))];
}

function formaDe(arq, nome) {
  const chaves = new Set();
  for (const p of escopo(arq)) {
    const src = readFileSync(p, 'utf8');
    for (const m of src.matchAll(new RegExp(`\\b${nome}\\.(\\w+)`, 'g'))) chaves.add(m[1]);
    for (const m of src.matchAll(new RegExp(`\\b${nome}\\b[^\\n]*?\\.map\\(\\((\\w+)\\)\\s*=>`, 'g'))) {
      const bind = m[1];
      const trecho = recorte(src, src.indexOf('.map(', m.index) + 4, '(', ')');
      for (const k of trecho.matchAll(new RegExp(`\\b${bind}\\.(\\w+)`, 'g'))) chaves.add(k[1]);
      const salto = trecho.match(new RegExp(`this\\.(_\\w+)\\(${bind}\\)`));
      if (!salto) continue;
      const metodo = src.match(new RegExp(`\\n  ${salto[1]}\\((\\w+)\\)`));
      if (!metodo) continue;
      const dentro = recorte(src, metodo.index + metodo[0].length, '{', '}');
      for (const k of dentro.matchAll(new RegExp(`\\b${metodo[1]}\\.(\\w+)`, 'g'))) chaves.add(k[1]);
    }
  }
  for (const x of DE_ARRAY) chaves.delete(x);
  return [...chaves].sort();
}

const ANINHADOS = {};
const comentarioErrado = [];
for (const arq of ARQUIVOS) {
  const t = readFileSync(arq, 'utf8');
  const d = t.match(/const DEFAULTS = \{([\s\S]*?)\n\};/);
  if (!d) continue;
  for (const m of d[1].matchAll(/^\s{2}(\w+):[^\n]*?\/\/[^\n]*?\{([^}]*)\}/gm)) {
    const declaradas = m[2].split(',').map((x) => x.trim()).filter((x) => /^\w+$/.test(x)).sort();
    if (declaradas.length < 2) continue;
    const reais = formaDe(arq, m[1]);
    if (!reais.length) continue;
    ANINHADOS[m[1]] = reais;
    const sobrando = declaradas.filter((k) => !reais.includes(k));
    const faltando = reais.filter((k) => !declaradas.includes(k));
    if (sobrando.length || faltando.length) {
      comentarioErrado.push(`${arq.replace('src/js/', '')}  ${m[1]}: o comentário diz `
        + `{ ${declaradas.join(', ')} }, o código lê { ${reais.join(', ')} }`);
    }
  }
}

/* ---- de onde saem os exemplos ---- */

const decode = (t) => t.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');

/* Django, shell e prosa nao rodam; trecho sem tag nem chamada nao e exemplo. */
const rodavel = (c) => !/\{%|\{\{|^\s*(\$|pip |npm |python|git )/m.test(c)
  && (/<[a-z]+[\s>]/.test(c) || /Tucano\./.test(c));
const ehJs = (c) => /Tucano\.\w/.test(c) && !c.trimStart().startsWith('<');

const blocos = [];
for (const arq of ['README.md', 'llms.txt']) {
  const texto = readFileSync(arq, 'utf8');
  for (const m of texto.matchAll(/```(\w*)\n([\s\S]*?)```/g)) {
    const codigo = m[2].trim();
    if (!rodavel(codigo)) continue;
    blocos.push({ arq, linha: texto.slice(0, m.index).split('\n').length, tipo: ehJs(codigo) ? 'js' : 'html', codigo });
  }
}
/* Na pagina os exemplos vivem em <code>, escapados. */
const html = readFileSync('index.html', 'utf8');
for (const m of html.matchAll(/<code[^>]*>([\s\S]*?)<\/code>/g)) {
  const codigo = decode(m[1]).trim();
  if (codigo.length <= 20 || !rodavel(codigo)) continue;
  blocos.push({ arq: 'index.html', linha: html.slice(0, m.index).split('\n').length, tipo: ehJs(codigo) ? 'js' : 'html', codigo });
}

/* ---- o que roda no navegador ---- */

function conferir({ OPCOES, ANINHADOS, BLOCOS }) {
  const falhas = [];
  // Um exemplo que estoura fora do try — num setTimeout do componente, por
  // exemplo — so vira falha com nome e linha por causa deste handler.
  let ultimoErro = null;
  addEventListener('error', (e) => { ultimoErro = e.message; });

  const ATRIBUTOS = '[data-tuc-datepicker],[data-tuc-select],[data-tuc-color],[data-tuc-mask],'
    + '[data-tuc-upload],[data-tuc-editor],[data-tuc-accordion],[data-tuc-table],[data-tuc-tip],'
    + '[data-tuc-reveal],[data-tuc-dropdown]';
  // data-tuc-format nao monta componente: so reescreve o texto, e marca isso
  // com data-tuc-formatted. Sentinela diferente porque o estado e outro.
  const FORMATADOS = '[data-tuc-format]:not([data-tuc-formatted])';

  for (const b of BLOCOS) {
    const onde = b.arq + ':' + b.linha + '  ';
    const palco = document.getElementById('palco');
    palco.innerHTML = '';
    ultimoErro = null;
    try {
      if (b.tipo === 'html') {
        palco.innerHTML = b.codigo;
        Tucano.init(palco);
        // Atributo que nao virou componente significa nome que mudou.
        for (const p of palco.querySelectorAll(ATRIBUTOS)) {
          if (!p.hasAttribute('data-tuc-ready')) falhas.push(onde + 'não montou: ' + p.outerHTML.slice(0, 60));
        }
        for (const p of palco.querySelectorAll(FORMATADOS)) {
          falhas.push(onde + 'não formatou: ' + p.outerHTML.slice(0, 60));
        }
      } else {
        // Nome que deixou de existir e o defeito classico (Tucano.gaveta).
        for (const m of b.codigo.matchAll(/Tucano\.(\w+)/g)) {
          if (Tucano[m[1]] === undefined) falhas.push(onde + 'Tucano.' + m[1] + ' não existe');
        }
        // Metodo chamado numa instancia guardada em variavel. So vale para as
        // classes: `Tucano.toast(...)` devolve um Toast, e o prototipo do
        // atalho e vazio — comparar com ele acusaria metodo que existe.
        for (const m of b.codigo.matchAll(/(?:const|let|var)\s+(\w+)\s*=\s*(?:new\s+)?Tucano\.([A-Z]\w+)/g)) {
          const proto = Tucano[m[2]] && Tucano[m[2]].prototype;
          if (!proto) continue;
          for (const c of b.codigo.matchAll(new RegExp('\\b' + m[1] + '\\.(\\w+)\\s*\\(', 'g'))) {
            if (!(c[1] in proto)) falhas.push(onde + m[2] + ' não tem o método ' + c[1] + '()');
          }
        }
        // Chave que ninguem le nao quebra nada — so nao faz nada, calada.
        // Duas formas: o objeto em varias linhas e o objeto numa linha so. Foi
        // pela segunda que `sensivel: true` ficou anos na documentacao.
        const chamadas = [...b.codigo.matchAll(/Tucano\.(\w+)\s*\(\s*(?:'[^']*'\s*,\s*)?\{([\s\S]*?)\n\}\)/g)]
          .concat([...b.codigo.matchAll(/Tucano\.(\w+)\s*\(\s*(?:'[^']*'\s*,\s*)?\{([^\n{}]*)\}\s*\)/g)]);
        for (const m of chamadas) {
          const aceitas = OPCOES[m[1]];
          if (!aceitas) continue;
          // Sem os objetos e listas de dentro: as chaves deles sao conferidas
          // logo abaixo, contra a forma certa, e nao contra as opcoes de topo.
          const raso = m[2].replace(/\[[\s\S]*?\]|\{[\s\S]*?\}/g, '');
          for (const k of raso.matchAll(/(?:^|[{,])\s*(\w+):/gm)) {
            if (!aceitas.includes(k[1])) falhas.push(onde + m[1] + ' não lê a opção ' + k[1]);
          }
          for (const chave of Object.keys(ANINHADOS)) {
            const dentro = m[2].match(new RegExp(chave + ':\\s*[\\[{]([\\s\\S]*?)[\\]}],?\\n'));
            if (!dentro) continue;
            for (const k of dentro[1].matchAll(/[{,]\s*(\w+):/g)) {
              if (!ANINHADOS[chave].includes(k[1])) falhas.push(onde + chave + ' não tem a chave ' + k[1]);
            }
          }
        }
      }
      if (ultimoErro) falhas.push(onde + ultimoErro);
    } catch (e) {
      falhas.push(onde + e.message);
    }
  }
  document.title = JSON.stringify({ total: BLOCOS.length, falhas });
}

const dados = JSON.stringify({ OPCOES, ANINHADOS, BLOCOS: blocos })
  .replace(/<\//g, '<\\/');   // uma tag de fechamento num exemplo fecharia o bloco
const pagina = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<style>${readFileSync('dist/tucano.css', 'utf8')}
*{transition:none!important;animation:none!important}</style></head><body><div id="palco"></div>
<script>${readFileSync('dist/tucano.js', 'utf8')}</script>
<script>try { (${conferir.toString()})(${dados}); }
catch (e) { document.title = JSON.stringify({ erro: e.message + ' — ' + String(e.stack).slice(0, 200) }); }</script>
</body></html>`;

const arq = join(tmpdir(), `tucano-examples-${process.pid}.html`);
writeFileSync(arq, pagina);
let codigo = 0;
try {
  const { stdout } = await exec(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
    '--virtual-time-budget=8000', '--dump-dom', `file://${arq}`], { maxBuffer: 64 * 1024 * 1024 });
  const t = stdout.match(/<title>([\s\S]*?)<\/title>/);
  if (!t) {
    console.error('[examples] a página não terminou de rodar');
    codigo = 1;
  } else {
    const r = JSON.parse(decode(t[1]));
    if (r.erro) { console.error('[examples] ' + r.erro); codigo = 1; }
    else {
          for (const f of comentarioErrado) console.log('  FALHA  ' + f);
      for (const f of r.falhas) console.log('  FALHA  ' + f);
      const total = r.falhas.length + comentarioErrado.length;
      console.log(`${r.total} exemplos conferidos e ${Object.keys(ANINHADOS).length} formas aninhadas`
        + ` extraídas do código, ${total} com problema`);
      codigo = total ? 1 : 0;
    }
  }
} finally {
  if (process.env.MANTER) console.log('pagina em', arq); else unlinkSync(arq);
}
process.exit(codigo);
