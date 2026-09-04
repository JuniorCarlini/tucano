#!/usr/bin/env node
/*
 * Gera a og.png — a imagem que aparece quando o link e compartilhado.
 * Existe como script para nao repetir o caminho do Chrome no package.json.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { exigirChrome, BANDEIRAS } from './chrome.mjs';

await promisify(execFile)(exigirChrome('og'), [
  ...BANDEIRAS, '--window-size=1200,630',
  '--virtual-time-budget=4000', '--screenshot=og.png', 'tools/og.html',
]);
console.log('og.png gerada — 1200x630');
