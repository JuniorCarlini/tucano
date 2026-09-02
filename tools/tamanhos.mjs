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
 * padrao deixar de casar, o build quebra em vez de seguir com numero velho.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const kb = (arquivo) => Math.round(gzipSync(readFileSync(arquivo)).length / 1024);

const js = kb('dist/tucano.min.js');
const css = kb('dist/tucano.min.css');
const total = js + css;

const arquivos = {
  'index.html': [
    [/<b>\d+ KB<\/b> JS gzip/g, `<b>${js} KB</b> JS gzip`],
    [/<b>\d+ KB<\/b> CSS gzip/g, `<b>${css} KB</b> CSS gzip`],
    [/(<span class="ver">v[\d.]+ · )\d+ KB/g, `$1${total} KB`],
    [/\d+ KB, zero dependências/g, `${total} KB, zero dependências`],
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

for (const [arquivo, trocas] of Object.entries(arquivos)) {
  let texto = readFileSync(arquivo, 'utf8');
  for (const [padrao, novo] of trocas) {
    if (!padrao.test(texto)) {
      console.error(`[tamanhos] padrão sem correspondência em ${arquivo}: ${padrao}`);
      process.exit(1);
    }
    padrao.lastIndex = 0;
    texto = texto.replace(padrao, novo);
  }
  writeFileSync(arquivo, texto);
}

console.log(`tamanhos: ${js} KB JS + ${css} KB CSS gzip (${total} KB no total)`);
