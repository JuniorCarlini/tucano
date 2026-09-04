#!/usr/bin/env node
/*
 * Escreve os tamanhos reais do dist onde eles sao anunciados.
 *
 * Roda no fim do build de proposito: numero escrito a mao envelhece na
 * primeira feature nova e ninguem lembra de conferir. A pagina chegou a
 * anunciar 15 KB de JS quando o arquivo ja tinha 27 — o pacote mentindo sobre
 * o proprio tamanho e justo o tipo de coisa que ninguem perdoa numa biblioteca
 * cujo argumento e ser leve.
 *
 * Cada substituicao e verificada: se um trecho mudar de forma no HTML e o
 * pattern deixar de casar, o build quebra em vez de seguir com numero velho.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const kb = (file) => Math.round(gzipSync(readFileSync(file)).length / 1024);

const js = kb('dist/tucano.min.js');
const css = kb('dist/tucano.min.css');
const total = js + css;

const files = {
  'index.html': [
    [/<b>\d+ KB<\/b> JS gzip/g, `<b>${js} KB</b> JS gzip`],
    [/<b>\d+ KB<\/b> CSS gzip/g, `<b>${css} KB</b> CSS gzip`],
    [/(<span class="ver">v[\d.]+ · )\d+ KB/g, `$1${total} KB`],
  ],
  'README.md': [
    [/\*\*\d+ KB de JS \+ \d+ KB de CSS\*\*/g, `**${js} KB de JS + ${css} KB de CSS**`],
  ],
  'llms.txt': [
    [/\d+ KB JS \+ \d+ KB CSS \(gzip\)/g, `${js} KB JS + ${css} KB CSS (gzip)`],
  ],
  'tools/og.html': [
    [/<b>\d+ KB<\/b> gzip/g, `<b>${total} KB</b> gzip`],
  ],
};

for (const [file, swaps] of Object.entries(files)) {
  let text = readFileSync(file, 'utf8');
  for (const [pattern, replacement] of swaps) {
    if (!pattern.test(text)) {
      console.error(`[tamanhos] padrão sem correspondência em ${file}: ${pattern}`);
      process.exit(1);
    }
    pattern.lastIndex = 0;
    text = text.replace(pattern, replacement);
  }
  writeFileSync(file, text);
}

console.log(`tamanhos: ${js} KB JS + ${css} KB CSS gzip (${total} KB no total)`);
