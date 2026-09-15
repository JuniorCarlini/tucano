#!/usr/bin/env node
/*
 * Build do CSS do pacote, sem os fallbacks que a Tailwind injeta.
 *
 * A CLI da Tailwind liga os polyfills de `color-mix` e `@property` sempre, e nao
 * tem opcao para desligar. Eles repetem cada cor misturada numa versao opaca e
 * registram variaveis `--tw-*` para navegadores abaixo da base da propria
 * Tailwind 4 (Chrome 111, Safari 16.2, Firefox 113) — quase 1 KB de gzip num
 * pacote de 14 KB, que o projeto que instala paga sem precisar. Aqui a mesma
 * compilacao roda pela API, com os polyfills desligados; com `Polyfills.All` a
 * saida e identica byte a byte a da CLI.
 *
 * Os `@property` que sobram vem de utilitario usado em `@apply` que registra
 * variavel propria (`font-medium`, `scale-105`...). Por isso esses utilitarios
 * sao escritos como declaracao no CSS dos componentes, e o consistency.mjs falha
 * se algum fallback voltar ao dist.
 *
 * Uso: node tools/css.mjs [--minify] <saida>
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { compile, optimize, Polyfills } from '@tailwindcss/node';

const args = process.argv.slice(2);
const minify = args.includes('--minify');
const output = args.find((a) => !a.startsWith('--')) ?? 'dist/tucano.css';
const input = resolve('src/styles/index.css');

const compiler = await compile(readFileSync(input, 'utf8'), {
  base: dirname(input),
  from: input,
  onDependency: () => {},
  polyfills: Polyfills.None,
});

// Nao ha classe a escanear no HTML: o pacote so usa @apply e @reference.
const css = compiler.build([]);
const code = minify ? optimize(css, { file: input, minify }).code : css;

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, code);
