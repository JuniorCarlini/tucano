#!/usr/bin/env node
/*
 * Confere a busca do site gerado, no navegador, nos tres motores.
 *
 * Ela vive so no site — nao e componente da biblioteca, entao nem o
 * behavior.mjs nem o keyboard.mjs a alcancam. O que se confere aqui e o
 * caminho de quem usa, com teclado e mouse de verdade: "/" e Ctrl+K abrem, a
 * busca ignora acento, as setas e o Enter levam a ancora, o Esc devolve o foco,
 * e o indice de cada idioma e o do proprio idioma.
 *
 * Precisa do site servido (npm run serve, ou qualquer servidor estatico na raiz).
 *
 * Uso: node tools/site-check.mjs [--browsers=chromium,firefox,webkit]
 *   SITE_URL=http://127.0.0.1:4322/   endereco do site (padrao)
 *   SHOTS=pasta                        salva capturas claras e escuras, desktop e 390px
 */
import { mkdirSync } from 'node:fs';
import { openPage, selectedBrowsers } from './browsers.mjs';

const BASE = (process.env.SITE_URL || 'http://127.0.0.1:4322/').replace(/\/?$/, '/');
const SHOTS = process.env.SHOTS || '';
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

const fold = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/* Headless congela transicao (ver AGENTS.md): sem isto a captura pega o modal
   a meio caminho, transparente. A troca de pagina com view transition tambem. */
const NO_MOTION = '*,*::before,*::after{transition:none!important;animation:none!important}'
  + '::view-transition-group(*),::view-transition-old(*),::view-transition-new(*){animation:none!important}';

async function preparePage(page, errors) {
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.addInitScript((css) => {
    document.addEventListener('DOMContentLoaded', () => {
      const style = document.createElement('style');
      style.textContent = css;
      document.head.append(style);
    });
  }, NO_MOTION);
}

async function shot(page, file) {
  if (!SHOTS) return;
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${SHOTS}/${file}.png` });
}

async function setTheme(page, theme) {
  await page.evaluate((t) => localStorage.setItem('tucano-theme', t), theme);
  await page.reload({ waitUntil: 'load' });
}

async function run(name) {
  const results = [];
  const check = (ok, label, extra = '') => results.push({ ok: Boolean(ok), label: extra ? `${label} (${extra})` : label });
  const errors = [];
  const { browser, page } = await openPage(name);
  await preparePage(page, errors);
  const input = page.locator('.search__input');
  const dialog = page.locator('dialog.search-dialog');
  const active = (selector) => page.evaluate((s) => Boolean(document.activeElement?.matches(s)), selector);

  try {
    /* ---- busca ---- */
    const indexRequests = [];
    page.on('request', (r) => { if (r.url().endsWith('/search.json')) indexRequests.push(r.url()); });
    await page.goto(`${BASE}datepicker/`, { waitUntil: 'load' });
    check(indexRequests.length === 0, 'busca: índice não é baixado antes de abrir');

    const current = '.side .tuc-menu__item.is-active';
    await page.focus(current);
    await page.keyboard.press('/');
    await dialog.waitFor({ state: 'visible' });
    check(await active('.search__input'), 'busca: "/" abre com o foco no campo');
    await page.keyboard.type('sensivel');
    await page.locator('.search__option').first().waitFor();
    const firstText = await page.locator('.search__option').first().innerText();
    check(/sensível/i.test(firstText), 'busca: "sensivel" acha "sensível"', firstText.split('\n')[0]);
    const marked = await page.locator('.search__option mark').first().innerText();
    check(fold(marked) === 'sensivel', 'busca: termo marcado com <mark>', marked);
    check(indexRequests.length === 1, 'busca: índice baixado uma vez, ao abrir');
    check(await input.getAttribute('aria-activedescendant') === 'search-option-0', 'busca: primeira opção ativa');
    await page.keyboard.press('ArrowDown');
    check(await input.getAttribute('aria-activedescendant') === 'search-option-1', 'busca: ↓ move a opção ativa');
    await page.keyboard.press('ArrowUp');
    check(await page.locator('#search-option-0').getAttribute('aria-selected') === 'true', 'busca: ↑ volta, com aria-selected');
    if (SHOTS) await shot(page, `${name}-search-light`);
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden' });
    check(await active(current), 'busca: Esc fecha e devolve o foco');

    await page.keyboard.press('Control+k');
    await dialog.waitFor({ state: 'visible' });
    check(await active('.search__input'), 'busca: Ctrl+K abre');
    await page.locator('.search__option').first().waitFor();
    const href = await page.locator('#search-option-0').getAttribute('href');
    await Promise.all([page.waitForURL(href), page.keyboard.press('Enter')]);
    check(page.url() === href && href.includes('#'), 'busca: Enter abre a página na âncora', href.replace(BASE, ''));
    const inView = await page.waitForFunction(() => {
      const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      const r = target?.getBoundingClientRect();
      return r && r.top >= -2 && r.top < innerHeight / 2;
    }, null, { timeout: 4000 }).then(() => true, () => false);
    check(inView, 'busca: a seção da âncora está no topo da tela');

    // Resultado na mesma página: fecha o diálogo antes de descer.
    await page.click('.side .search-trigger');
    await dialog.waitFor({ state: 'visible' });
    await input.fill('texto solto na tela');
    const option = page.locator('.search__option').first();
    await option.waitFor();
    await option.click();
    await dialog.waitFor({ state: 'hidden' });
    const sameHash = await page.waitForFunction(() => location.hash === '#sensitive-text', null, { timeout: 3000 }).then(() => true, () => false);
    check(sameHash, 'busca: clique na mesma página fecha e vai à âncora');
    // Ir a uma ancora leva o foco para a pagina (o navegador o move ao trocar o
    // hash); o que nao pode e ele ficar preso no dialogo que saiu do DOM.
    check(await page.evaluate(() => document.activeElement && !document.activeElement.closest('dialog') && document.activeElement.isConnected),
      'busca: foco não fica preso no diálogo fechado');

    await page.focus(current);
    await page.keyboard.press('Control+k');
    await input.fill('zzzqqq');
    await page.waitForFunction(() => document.querySelector('.search__status')?.textContent.includes('zzzqqq'));
    check(await page.locator('.search__option').count() === 0, 'busca: sem resultado mostra a mensagem');
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden' });

    /* ---- "/" dentro de campo ---- */

    // Digitar "/" num campo escreve a barra, e nao abre a busca: sem isto,
    // quem preenche um formulario perde o que digitou para o dialogo.
    await page.goto(`${BASE}datepicker/`, { waitUntil: 'load' });
    await page.focus('#dp-due');
    await page.keyboard.press('/');
    check(await dialog.count() === 0 || !(await dialog.isVisible()), 'busca: "/" dentro de campo não abre a busca');
    await page.keyboard.press('Escape');

    if (SHOTS) {
      await setTheme(page, 'dark');
      await page.keyboard.press('/');
      await dialog.waitFor({ state: 'visible' });
      await page.keyboard.type('mascara');
      await page.locator('.search__option').first().waitFor();
      await shot(page, `${name}-search-dark`);
      await page.keyboard.press('Escape');
      await setTheme(page, 'light');
    }

    /* ---- idiomas ---- */
    for (const [dir, clear] of [['en', 'Clear'], ['es', 'Borrar']]) {
      await page.goto(`${BASE}${dir}/datepicker/`, { waitUntil: 'load' });
      await page.click('#dp-due');
      await page.waitForSelector('.tuc-dp.is-open');
      check((await page.locator('.tuc-dp.is-open').innerText()).includes(clear), `${dir}: textos do componente no idioma da página`, clear);
      await page.keyboard.press('Escape');
      await page.keyboard.press('Control+k');
      await input.fill(dir === 'en' ? 'sensitive' : 'sensible');
      const found = await page.locator('.search__option').first().waitFor({ timeout: 3000 }).then(() => true, () => false);
      check(found && (await page.locator('#search-option-0').getAttribute('href')).includes(`/${dir}/`), `${dir}: busca usa o índice do idioma`);
      await page.keyboard.press('Escape');
    }
  } catch (e) {
    check(false, 'execução', e.message.split('\n')[0]);
  } finally {
    await browser.close();
  }

  /* ---- 390px ---- */
  const mobile = await openPage(name, { viewport: { width: 390, height: 844 } });
  const mobileErrors = [];
  await preparePage(mobile.page, mobileErrors);
  try {
    const p = mobile.page;
    await p.goto(`${BASE}datepicker/`, { waitUntil: 'load' });
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    check(overflow <= 0, '390px: página sem rolagem horizontal', `${overflow}px`);
    await p.click('#dp-due');
    const panel = await p.waitForSelector('.tuc-dp.is-open', { timeout: 3000 }).then((h) => h.boundingBox(), () => null);
    check(panel && panel.x >= 0 && panel.x + panel.width <= 390, '390px: calendário cabe na tela');
    await p.keyboard.press('Escape');
    if (SHOTS) await shot(p, `${name}-mobile-light`);

    await p.click('.topbar [data-search]');
    await p.locator('dialog.search-dialog').waitFor({ state: 'visible' });
    check(await p.evaluate(() => document.activeElement?.matches('.search__input')), '390px: botão da barra abre a busca');
    await p.locator('.search__input').fill('mascara');
    await p.locator('.search__option').first().waitFor();
    const box = await p.locator('.search-dialog .tuc-modal__panel').boundingBox();
    check(box && box.x >= 0 && box.x + box.width <= 390, '390px: diálogo da busca cabe na tela', box ? `${Math.round(box.width)}px` : '');
    if (SHOTS) {
      await shot(p, `${name}-mobile-search-light`);
      await p.keyboard.press('Escape');
      await setTheme(p, 'dark');
      await shot(p, `${name}-mobile-dark`);
    }
  } catch (e) {
    check(false, '390px: execução', e.message.split('\n')[0]);
  } finally {
    await mobile.browser.close();
  }

  const unique = [...new Set([...errors, ...mobileErrors])];
  check(!unique.length, 'console sem erro', unique.slice(0, 3).join(' | '));
  return { name, results };
}

const reports = await Promise.all(selectedBrowsers('site-check').map(run));
let failures = 0;
for (const { name, results } of reports) {
  console.log(`\n${name}`);
  for (const r of results) {
    console.log(`  ${r.ok ? 'ok   ' : 'FALHA'}  ${r.label}`);
    if (!r.ok) failures++;
  }
}
const summary = reports.map(({ name, results }) => `${name} ${results.filter((r) => r.ok).length}/${results.length}`).join(' · ');
console.log(`\n${summary}${failures ? ` — ${failures} falha(s)` : ''}`);
process.exit(failures ? 1 : 0);
