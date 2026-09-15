#!/usr/bin/env node
/*
 * Gera a og.png — a imagem que aparece quando o link e compartilhado.
 * Existe como script para o package.json nao carregar o passo a passo do navegador.
 */
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { openPage } from './browsers.mjs';

const { browser, page } = await openPage('chromium', { viewport: { width: 1200, height: 630 } });
try {
  await page.goto(pathToFileURL(resolve('tools/og.html')).href);
  // Fonte carregada antes do retrato: sem isso a imagem pode sair com a fonte de reserva.
  await page.evaluate(() => document.fonts.ready);
  // O calendario entra com transicao. O Chrome chamado direto adiantava o relogio
  // virtual ate ela acabar; aqui se espera o fim de cada animacao de verdade.
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished)));
  await page.waitForTimeout(100);
  await page.screenshot({ path: 'og.png' });
} finally {
  await browser.close();
}
console.log('og.png gerada — 1200x630');
