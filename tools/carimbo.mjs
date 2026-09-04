#!/usr/bin/env node
/*
 * Carimba tamanho e versao onde eles sao anunciados.
 *
 * Roda no fim do build de proposito: numero escrito a mao envelhece na primeira
 * feature nova e ninguem lembra de conferir. A pagina chegou a anunciar 15 KB
 * de JS quando o arquivo ja tinha 27, e o cabecalho ficou preso em v0.26.0
 * enquanto o package.json ia para 0.30.1 — o pacote mentindo sobre o proprio
 * tamanho, ou sobre a propria versao, e justo o tipo de coisa que ninguem
 * perdoa numa biblioteca.
 *
 * Pior que o cabecalho: o trecho de instalacao do README apontava para
 * @v0.9.2. Quem copiava levava uma versao de muitas iteracoes atras.
 *
 * A fonte da verdade e o package.json. Cada substituicao e verificada: se um
 * trecho mudar de forma e o padrao deixar de casar, o build quebra em vez de
 * seguir com numero velho.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const kb = (file) => Math.round(gzipSync(readFileSync(file)).length / 1024);

const js = kb('dist/tucano.min.js');
const css = kb('dist/tucano.min.css');
const total = js + css;
const v = JSON.parse(readFileSync('package.json', 'utf8')).version;

/* Cada entrada: [padrao, substituto]. O padrao precisa casar ao menos uma vez. */
const files = {
  'index.html': [
    [/<b>\d+ KB<\/b> JS gzip/g, `<b>${js} KB</b> JS gzip`],
    [/<b>\d+ KB<\/b> CSS gzip/g, `<b>${css} KB</b> CSS gzip`],
    [/<span class="ver">v[\d.]+<\/span>/g, `<span class="ver">v${v}</span>`],
    [/<span class="ver">v[\d.]+ · \d+ KB<\/span>/g, `<span class="ver">v${v} · ${total} KB</span>`],
    [/tucano@v[\d.]+/g, `tucano@v${v}`],
    [/(dist\/tucano(?:\.min)?\.(?:css|js))\?v=[\d.]+/g, `$1?v=${v}`],
  ],
  'README.md': [
    [/\*\*\d+ KB de JS \+ \d+ KB de CSS\*\*/g, `**${js} KB de JS + ${css} KB de CSS**`],
    [/tucano@v[\d.]+/g, `tucano@v${v}`],
    [/\(`@[\d.]+`\)/g, `(\`@${v}\`)`],
  ],
  'llms.txt': [
    [/\d+ KB JS \+ \d+ KB CSS \(gzip\)/g, `${js} KB JS + ${css} KB CSS (gzip)`],
    [/tucano@v[\d.]+/g, `tucano@v${v}`],
  ],
  'tools/og.html': [
    [/<b>\d+ KB<\/b> gzip/g, `<b>${total} KB</b> gzip`],
  ],
};

for (const [file, swaps] of Object.entries(files)) {
  let text = readFileSync(file, 'utf8');
  for (const [pattern, replacement] of swaps) {
    if (!pattern.test(text)) {
      console.error(`[carimbo] padrão sem correspondência em ${file}: ${pattern}`);
      process.exit(1);
    }
    pattern.lastIndex = 0;
    text = text.replace(pattern, replacement);
  }
  writeFileSync(file, text);
}

console.log(`carimbo: v${v} — ${js} KB JS + ${css} KB CSS gzip (${total} KB no total)`);
