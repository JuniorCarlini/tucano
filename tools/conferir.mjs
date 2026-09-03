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
const INTERNOS = {
  'tag do select': { sel: '.tuc-select__tag', cabeEm: '.tuc-select' },
  'opção do menu': { sel: '.tuc-select__option', cabeEm: null },
};

/*
 * `digitavel` decide quem responde pela fonte minima. A regra dos 16px existe
 * para o iOS nao dar zoom ao focar um campo de texto — tocar num botao nao faz
 * isso, e cobrar 16px dele condenaria o is-sm, que existe justamente para ser
 * pequeno.
 */
const ALVOS = {
  'campo de data': { sel: '#c-data', digitavel: true },
  'select': { sel: '.tuc-select', digitavel: true },
  'campo com máscara': { sel: '#c-mask', digitavel: true },
  'campo de cor': { sel: '.tuc-color-field', digitavel: true },
  'campo de texto': { sel: '#c-input', digitavel: true },
  'botão padrão': { sel: '#c-btn' },
  'botão pequeno': { sel: '#c-btn-sm' },
  'botão grande': { sel: '#c-btn-lg' },
  'botão de ícone': { sel: '#c-icone' },
};

const ESPERADO = {
  desktop: { largura: 1280, altura: 38, variantes: { 'botão pequeno': 30, 'botão grande': 44 } },
  /*
   * 500 e nao 375: o Chrome sem cabeca nao encolhe a janela abaixo disso. Serve
   * ao proposito porque o corte do compacto e 40rem (640px), entao as regras de
   * toque entram do mesmo jeito — mas o numero relatado e o real, para ninguem
   * ler 375 e acreditar que foi medido ali.
   */
  celular: { largura: 500, altura: 44, fonteMinima: 16, variantes: { 'botão pequeno': 30, 'botão grande': 44 } },
};

const pagina = () => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<style>${readFileSync('dist/tucano.css', 'utf8')}
body{margin:0;padding:16px;font-family:system-ui,sans-serif}</style></head><body>
<input data-tuc-datepicker id="c-data">
<select data-tuc-select multiple id="c-select"><option value="a" selected>São Paulo</option><option value="b" selected>Rio</option><option value="c">Minas</option></select>
<input data-tuc-mask="cpfcnpj" id="c-mask">
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
    var alvos = ${JSON.stringify(ALVOS)}, out = {};
    for (var nome in alvos) {
      var el = document.querySelector(alvos[nome].sel);
      out[nome] = el ? { altura: Math.round(el.getBoundingClientRect().height), fonte: getComputedStyle(el).fontSize, digitavel: !!alvos[nome].digitavel } : null;
    }
    // O menu so existe aberto: precisa disso para medir a opcao.
    document.querySelector('#c-select')._tucano.open();
    var internos = ${JSON.stringify(INTERNOS)}, dentro = {};
    for (var k in internos) {
      var e = document.querySelector(internos[k].sel);
      if (!e) { dentro[k] = null; continue; }
      var pai = internos[k].cabeEm ? document.querySelector(internos[k].cabeEm) : null;
      dentro[k] = {
        altura: Math.round(e.getBoundingClientRect().height),
        fonte: getComputedStyle(e).fontSize,
        cabe: pai ? e.getBoundingClientRect().height <= pai.getBoundingClientRect().height : null,
      };
    }
    out.__internos = dentro;
    out.__largura = innerWidth;
    document.getElementById('resultado').textContent = JSON.stringify(out);
  } catch (e) {
    document.getElementById('resultado').textContent = JSON.stringify({ __erro: String(e) });
  }
})();
</script></body></html>`;

async function medir(largura, arquivo) {
  const { stdout } = await exec(CHROME, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars',
    `--window-size=${largura},900`, '--virtual-time-budget=3000',
    '--dump-dom', `file://${arquivo}`,
  ], { maxBuffer: 40 * 1024 * 1024 });
  const m = stdout.match(/<pre id="resultado">([\s\S]*?)<\/pre>/);
  if (!m || !m[1].trim()) throw new Error('a página de medidas não produziu resultado');
  const dados = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
  if (dados.__erro) throw new Error(dados.__erro);
  return dados;
}

const arquivo = join(tmpdir(), `tucano-medidas-${process.pid}.html`);
writeFileSync(arquivo, pagina());

let falhas = 0;
try {
  for (const [tela, regra] of Object.entries(ESPERADO)) {
    const medidas = await medir(regra.largura, arquivo);
    console.log(`\n${tela} (${medidas.__largura}px) — padrão ${regra.altura}px${regra.fonteMinima ? `, fonte mínima ${regra.fonteMinima}px` : ''}`);

    for (const [nome, valor] of Object.entries(medidas)) {
      if (nome.startsWith('__')) continue;
      if (!valor) { console.log(`  ausente  ${nome}`); falhas++; continue; }

      const alvo = regra.variantes[nome] ?? regra.altura;
      const erros = [];
      if (valor.altura !== alvo) erros.push(`altura ${valor.altura} ≠ ${alvo}`);
      if (valor.digitavel && regra.fonteMinima && parseFloat(valor.fonte) < regra.fonteMinima) {
        erros.push(`fonte ${valor.fonte} — abaixo de ${regra.fonteMinima}px o iOS dá zoom`);
      }
      console.log(`  ${erros.length ? 'FALHA ' : 'ok    '} ${nome.padEnd(20)} ${String(valor.altura).padStart(3)}px / ${valor.fonte.padStart(5)}${erros.length ? '   ' + erros.join('; ') : ''}`);
      falhas += erros.length ? 1 : 0;
    }

    console.log('  — partes internas, que tem altura propria —');
    for (const [nome, v] of Object.entries(medidas.__internos ?? {})) {
      if (!v) { console.log(`  ausente  ${nome}`); falhas++; continue; }
      const erros = [];
      if (v.cabe === false) erros.push('mais alta que o campo que a contém');
      console.log(`  ${erros.length ? 'FALHA ' : 'ok    '} ${nome.padEnd(20)} ${String(v.altura).padStart(3)}px / ${v.fonte.padStart(5)}${erros.length ? '   ' + erros.join('; ') : ''}`);
      falhas += erros.length ? 1 : 0;
    }
  }
} finally {
  unlinkSync(arquivo);
}

console.log(falhas ? `\n${falhas} fora do padrão` : '\ntodos os controles respeitam o padrão');
process.exit(falhas ? 1 : 0);
