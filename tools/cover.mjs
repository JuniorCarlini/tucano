#!/usr/bin/env node
/*
 * Gera a cover.png e a cover-dark.png — a vitrine do README.
 *
 * Mesma ideia da og.mjs, com uma diferenca que importa: aqui os componentes sao
 * os de verdade, montados pelo dist, e nao marcacao escrita a mao. Assim a
 * imagem envelhece junto com a biblioteca, em vez de virar uma lembranca de
 * como ela era.
 */
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { openPage } from './browsers.mjs';

const { browser, page } = await openPage('chromium', { viewport: { width: 1200, height: 500 }, deviceScaleFactor: 2 });
try {
  await page.goto(pathToFileURL(resolve('tools/cover.html')).href);
  await page.evaluate(() => document.fonts.ready);
  for (const [file, dark] of [['cover.png', false], ['cover-dark.png', true]]) {
    await page.evaluate((d) => document.documentElement.classList.toggle('dark', d), dark);
    /*
     * Espera a transicao do tema acabar, e nao um tempo fixo. As animacoes sem
     * fim ficam de fora: o spinner gira para sempre, e esperar por ele e
     * esperar para sempre — foi o que travou a primeira versao deste script.
     */
    await page.evaluate(() => Promise.all(document.getAnimations()
      .filter((a) => a.effect?.getTiming().iterations !== Infinity)
      .map((a) => a.finished)));
    await page.waitForTimeout(150);
    await page.screenshot({ path: `site/assets/${file}` });
  }
} finally {
  await browser.close();
}
console.log('cover.png e cover-dark.png geradas — 1200x500');
