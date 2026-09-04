#!/usr/bin/env node
/*
 * Confere se os controles respeitam a mesma altura.
 *
 * Existe porque o mesmo erro aconteceu tres vezes: um componente novo nasce com
 * geometria propria, ninguem percebe, e o desalinhamento aparece so quando
 * alguem olha a tela. Botao de icone com 28px ao lado de um de 30; campo de
 * data com 38px e fonte 13 ao lado de um select de 44 e 16, esse ultimo ainda
 * fazendo o iOS dar zoom ao ser tocado.
 *
 * A regra vale para os dois tamanhos de tela: tudo em que se digita ou se toca
 * tem a altura de controle do momento — 38px no desktop, 44px no toque — e no
 * compacto ninguem fica abaixo de 16px de fonte. As variantes declaradas de
 * botao sao excecao conhecida: is-sm e is-lg existem para fugir do padrao.
 *
 * A pagina e montada aqui, com CSS e JS embutidos, porque o --dump-dom do
 * Chrome despeja o documento antes de um <script src> externo executar.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const exec = promisify(execFile);
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

/*
 * Alvos com altura propria: nao entram no padrao de controle, mas precisam ser
 * coerentes entre si e caber dentro do campo. Tag e opcao sao os dois casos —
 * ninguem espera que uma tag tenha a altura de um input, mas duas tags de
 * alturas diferentes, ou uma que estoure o campo, sao defeito.
 */
const INNER = {
  'tag do select': { sel: '.tuc-select__tag', fitsIn: '.tuc-select' },
  'opção do menu': { sel: '.tuc-select__option', fitsIn: null },
};

/*
 * `typable` decide quem responde pela fonte minima. A regra dos 16px existe
 * para o iOS nao dar zoom ao focar um campo de texto — tocar num botao nao faz
 * isso, e cobrar 16px dele condenaria o is-sm, que existe justamente para ser
 * pequeno.
 */
const TARGETS = {
  'campo de data': { sel: '#c-data', typable: true },
  'select': { sel: '.tuc-select', typable: true },
  'campo com máscara': { sel: '#c-mask', typable: true },
  'campo de cor': { sel: '.tuc-color-field', typable: true },
  'campo de texto': { sel: '#c-input', typable: true },
  'botão padrão': { sel: '#c-btn' },
  'botão pequeno': { sel: '#c-btn-sm' },
  'botão grande': { sel: '#c-btn-lg' },
  'botão de ícone': { sel: '#c-icone' },
};

const EXPECTED = {
  desktop: { width: 1280, height: 38, variants: { 'botão pequeno': 30, 'botão grande': 44 } },
  /*
   * 500 e nao 375: o Chrome sem cabeca nao encolhe a janela abaixo disso. Serve
   * ao proposito porque o corte do compacto e 40rem (640px), entao as regras de
   * toque entram do mesmo jeito — mas o numero relatado e o real, para ninguem
   * ler 375 e acreditar que foi medido ali.
   */
  mobile: { width: 500, height: 44, minFontSize: 16, variants: { 'botão pequeno': 30, 'botão grande': 44 } },
};

const page = () => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<style>${readFileSync('dist/tucano.css', 'utf8')}
body{margin:0;padding:16px;font-family:system-ui,sans-serif}</style></head><body>
<input data-tuc-datepicker id="c-data">
<select data-tuc-select multiple id="c-select"><option value="a" selected>São Paulo</option><option value="b" selected>Rio</option><option value="c">Minas</option></select>
<input data-tuc-mask="cpf-cnpj" id="c-mask">
<input data-tuc-color id="c-cor">
<input type="text" class="tuc-input" id="c-input">
<button class="tuc-btn is-primary" id="c-btn">Botão</button>
<button class="tuc-btn is-outline is-sm" id="c-btn-sm">Pequeno</button>
<button class="tuc-btn is-outline is-lg" id="c-btn-lg">Grande</button>
<button class="tuc-btn is-ghost is-icon" id="c-icone">×</button>
<pre id="resultado"></pre>
<script>${readFileSync('dist/tucano.js', 'utf8')}</script>
<script>
(function () {
  try {
    Tucano.init(document);
    var targets = ${JSON.stringify(TARGETS)}, out = {};
    for (var name in targets) {
      var el = document.querySelector(targets[name].sel);
      out[name] = el ? { height: Math.round(el.getBoundingClientRect().height), fontSize: getComputedStyle(el).fontSize, typable: !!targets[name].typable } : null;
    }
    // O menu so existe aberto: precisa disso para medir a opcao.
    document.querySelector('#c-select')._tucano.open();
    var inner = ${JSON.stringify(INNER)}, within = {};
    for (var k in inner) {
      var e = document.querySelector(inner[k].sel);
      if (!e) { within[k] = null; continue; }
      var parent = inner[k].fitsIn ? document.querySelector(inner[k].fitsIn) : null;
      within[k] = {
        height: Math.round(e.getBoundingClientRect().height),
        fontSize: getComputedStyle(e).fontSize,
        fitsIn: parent ? e.getBoundingClientRect().height <= parent.getBoundingClientRect().height : null,
      };
    }
    out.__inner = within;
    out.__width = innerWidth;
    document.getElementById('resultado').textContent = JSON.stringify(out);
  } catch (e) {
    document.getElementById('resultado').textContent = JSON.stringify({ __error: String(e) });
  }
})();
</script></body></html>`;

async function measure(width, file) {
  const { stdout } = await exec(CHROME, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars',
    `--window-size=${width},900`, '--virtual-time-budget=3000',
    '--dump-dom', `file://${file}`,
  ], { maxBuffer: 40 * 1024 * 1024 });
  const m = stdout.match(/<pre id="resultado">([\s\S]*?)<\/pre>/);
  if (!m || !m[1].trim()) throw new Error('a página de medidas não produziu resultado');
  const data = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
  if (data.__error) throw new Error(data.__error);
  return data;
}

const file = join(tmpdir(), `tucano-medidas-${process.pid}.html`);
writeFileSync(file, page());

let failures = 0;
try {
  for (const [screen, rule] of Object.entries(EXPECTED)) {
    const measures = await measure(rule.width, file);
    console.log(`\n${screen} (${measures.__width}px) — padrão ${rule.height}px${rule.minFontSize ? `, fonte mínima ${rule.minFontSize}px` : ''}`);

    for (const [name, value] of Object.entries(measures)) {
      if (name.startsWith('__')) continue;
      if (!value) { console.log(`  ausente  ${name}`); failures++; continue; }

      const target = rule.variants[name] ?? rule.height;
      const errors = [];
      if (value.height !== target) errors.push(`altura ${value.height} ≠ ${target}`);
      if (value.typable && rule.minFontSize && parseFloat(value.fontSize) < rule.minFontSize) {
        errors.push(`fonte ${value.fontSize} — abaixo de ${rule.minFontSize}px o iOS dá zoom`);
      }
      console.log(`  ${errors.length ? 'FALHA ' : 'ok    '} ${name.padEnd(20)} ${String(value.height).padStart(3)}px / ${value.fontSize.padStart(5)}${errors.length ? '   ' + errors.join('; ') : ''}`);
      failures += errors.length ? 1 : 0;
    }

    console.log('  — partes internas, que tem altura propria —');
    for (const [name, v] of Object.entries(measures.__inner ?? {})) {
      if (!v) { console.log(`  ausente  ${name}`); failures++; continue; }
      const errors = [];
      if (v.fitsIn === false) errors.push('mais alta que o campo que a contém');
      console.log(`  ${errors.length ? 'FALHA ' : 'ok    '} ${name.padEnd(20)} ${String(v.height).padStart(3)}px / ${v.fontSize.padStart(5)}${errors.length ? '   ' + errors.join('; ') : ''}`);
      failures += errors.length ? 1 : 0;
    }
  }
} finally {
  unlinkSync(file);
}

/*
 * Estado de espera: o primeiro quadro, antes de o script rodar.
 *
 * Existe porque o mesmo erro ja aconteceu duas vezes seguidas. Os seletores
 * [data-tuc-*]:not([data-tuc-ready]) precisam estar em TODAS as listas de
 * escopo dos tokens — clara, escura por classe, escura por midia e compacta —
 * e esquecer uma e silencioso: o campo simplesmente pega o token da lista
 * errada. Da primeira vez a borda sumia; da segunda o campo piscava branco
 * numa pagina escura.
 *
 * A invariante conferida e a que importa para quem olha a tela: no primeiro
 * quadro o campo em espera tem de estar igual a um .tuc-input de verdade, que
 * e classe pura e nunca depende de JavaScript. Vale nos dois temas.
 */
const WAIT = ['[data-tuc-datepicker]', '[data-tuc-mask]', '[data-tuc-select]', '[data-tuc-color]'];

const waitPage = () => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<style>${readFileSync('dist/tucano.css', 'utf8')}
body{margin:0;padding:16px;font-family:system-ui,sans-serif}</style></head><body>
<div id="light">
  <input type="text" class="tuc-input" data-ref>
  <input data-tuc-datepicker><input data-tuc-mask="cpf-cnpj"><input data-tuc-color>
  <select data-tuc-select><option>Um</option></select>
</div>
<div id="dark" class="dark">
  <input type="text" class="tuc-input" data-ref>
  <input data-tuc-datepicker><input data-tuc-mask="cpf-cnpj"><input data-tuc-color>
  <select data-tuc-select><option>Um</option></select>
</div>
<pre id="resultado"></pre>
<script>
(function () {
  try {
    var targets = ${JSON.stringify(WAIT)}, out = {};
    ['light', 'dark'].forEach(function (theme) {
      var root = document.getElementById(theme);
      var read = function (el) {
        var c = getComputedStyle(el);
        return {
          height: Math.round(el.getBoundingClientRect().height),
          radius: c.borderTopLeftRadius, background: c.backgroundColor,
          border: c.borderTopWidth + ' ' + c.borderTopStyle + ' ' + c.borderTopColor,
        };
      };
      var group = { __ref: read(root.querySelector('[data-ref]')) };
      targets.forEach(function (sel) {
        var el = root.querySelector(sel);
        group[sel] = el ? read(el) : null;
      });
      out[theme] = group;
    });
    document.getElementById('resultado').textContent = JSON.stringify(out);
  } catch (e) {
    document.getElementById('resultado').textContent = JSON.stringify({ __error: String(e) });
  }
})();
</script></body></html>`;

const waitFile = join(tmpdir(), `tucano-espera-${process.pid}.html`);
writeFileSync(waitFile, waitPage());
try {
  const wait = await measure(1280, waitFile);
  console.log('\nestado de espera (antes do script) — igual a um .tuc-input de verdade');
  for (const [theme, group] of Object.entries(wait)) {
    const ref = group.__ref;
    for (const [sel, v] of Object.entries(group)) {
      if (sel === '__ref') continue;
      if (!v) { console.log(`  ausente  ${theme} ${sel}`); failures++; continue; }
      const errors = Object.keys(ref).filter((k) => v[k] !== ref[k])
        .map((k) => `${k} ${v[k]} ≠ ${ref[k]}`);
      console.log(`  ${errors.length ? 'FALHA ' : 'ok    '} ${(theme + ' ' + sel).padEnd(34)}${errors.length ? errors.join('; ') : v.height + 'px'}`);
      failures += errors.length ? 1 : 0;
    }
  }
} finally {
  unlinkSync(waitFile);
}

console.log(failures ? `\n${failures} fora do padrão` : '\ntodos os controles respeitam o padrão');
process.exit(failures ? 1 : 0);
