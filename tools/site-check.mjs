#!/usr/bin/env node
/*
 * Confere a busca e o playground do site gerado, no navegador, nos tres motores.
 *
 * Os dois vivem so no site — nao sao componente da biblioteca, entao nem o
 * behavior.mjs nem o keyboard.mjs os alcancam. O que se confere aqui e o
 * caminho de quem usa, com teclado e mouse de verdade: "/" e Ctrl+K abrem, a
 * busca ignora acento, as setas e o Enter levam a ancora, o Esc devolve o foco;
 * no playground, trocar de componente e de opcao recria a previa sem erro no
 * console e sem deixar painel sobrando no <body>, e o codigo acompanha.
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

    /* ---- playground ---- */
    await page.goto(`${BASE}playground/`, { waitUntil: 'load' });
    await page.waitForSelector('#pg-controls [data-option="mode"]');
    const code = (id) => page.locator(`#${id} code`).textContent();
    const waitCode = (id, text) => page.waitForFunction(([i, t]) => document.querySelector(`#${i} code`)?.textContent.includes(t), [id, text], { timeout: 3000 })
      .then(() => true, () => false);
    const bodyChildren = () => page.evaluate(() => document.body.children.length);

    await page.click('#pg-stage #due-date');
    const opened = await page.waitForSelector('.tuc-dp.is-open', { timeout: 3000 }).then(() => true, () => false);
    check(opened, 'playground: date picker da prévia abre no clique');
    await page.keyboard.press('Escape');

    await page.locator('#pg-option-mode ~ .tuc-select').first().click();
    await page.getByRole('option', { name: 'range', exact: true }).click();
    check(await waitCode('pg-code-html', 'data-mode="range"'), 'playground: mode=range entra no HTML');
    check((await code('pg-code-js')).includes("mode: 'range'"), 'playground: e no JavaScript');
    check((await code('pg-code-django')).includes('"data-mode": "range"'), 'playground: e no widget do Django');
    // O painel nasce no primeiro abrir: conta-se depois de abrir o recriado.
    await page.click('#pg-stage #due-date');
    await page.waitForSelector('.tuc-dp.is-open');
    check(await page.locator('.tuc-dp').count() === 1, 'playground: recriar não deixa um segundo calendário');
    check(await page.locator('.tuc-dp.is-open .tuc-dp__month').count() === 2, 'playground: em range a prévia mostra dois meses');
    await page.keyboard.press('Escape');

    await page.click('[data-option="time"]');
    check(await waitCode('pg-code-html', 'data-time="true"'), 'playground: chave time atualiza o código');
    await page.fill('[data-option="minuteStep"]', '15');
    check(await waitCode('pg-code-html', 'data-minute-step="15"'), 'playground: número digitado atualiza o código');
    await page.click('[data-option="clearable"]');
    check(await waitCode('pg-code-js', 'clearable: false'), 'playground: opção só de JS vai só ao JavaScript');
    check(!(await code('pg-code-html')).includes('clearable'), 'playground: e fica fora do HTML');

    await page.focus('[data-option="minuteStep"]');
    await page.keyboard.press('/');
    check(await dialog.count() === 0 || !(await dialog.isVisible()), 'busca: "/" dentro de campo não abre a busca');

    // Copiar: o botão é o .tuc-copy do bloco de código da biblioteca.
    await page.getByRole('tab', { name: 'JavaScript' }).click();
    const jsText = (await code('pg-code-js')).trim();
    if (name === 'chromium') await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE.replace(/\/$/, '') });
    await page.hover('#pg-code-js pre');
    await page.click('#pg-code-js .tuc-copy');
    if (name === 'chromium') {
      const copied = await page.evaluate(() => navigator.clipboard.readText());
      check(copied === jsText, 'playground: copiar leva o código gerado');
    } else {
      const done = await page.evaluate(() => document.querySelector('#pg-code-js .tuc-copy').classList.contains('is-copied') || getSelection().toString().length > 0);
      check(done, 'playground: copiar responde (área de transferência ou seleção)');
    }
    await page.getByRole('tab', { name: 'HTML' }).click();

    // Troca pelo seletor de verdade, e depois passa por todos os componentes.
    await page.locator('#pg-component ~ .tuc-select').first().click();
    await page.getByRole('option', { name: 'Select', exact: true }).click();
    check(await waitCode('pg-code-html', 'data-tuc-select'), 'playground: seletor troca para o select');
    check(await page.locator('.tuc-dp').count() === 0, 'playground: calendário anterior destruído');
    // Base depois de abrir o seletor de componente pelo mouse: o menu dele mora
    // no <body> enquanto ele existir, e ele existe a pagina toda.
    // O menu que acabou de fechar ainda anima a saida e so sai do DOM depois do
    // tempo de saida do popover (200 ms). Contar antes pegava um painel a mais na
    // base, e o Firefox, mais lento, as vezes acusava 7 -> 6. Espera acima do tempo.
    const settle = () => page.waitForTimeout(400);
    await settle();
    const baseline = await bodyChildren();

    const names = ['mask', 'colorpicker', 'upload', 'editor', 'toast', 'modal', 'drawer', 'tooltip', 'tabs', 'table', 'pagination', 'select', 'datepicker'];
    const broken = [];
    for (const component of names) {
      await page.evaluate((n) => {
        const picker = document.getElementById('pg-component');
        picker.value = n;
        picker.dispatchEvent(new Event('change', { bubbles: true }));
      }, component);
      const ok = await page.evaluate((n) => {
        const stage = document.getElementById('pg-stage');
        const html = document.querySelector('#pg-code-html code').textContent;
        const mounted = ['toast', 'modal', 'drawer'].includes(n) ? stage.querySelector('button')
          : n === 'pagination' ? stage.querySelector('.tuc-pagination') : stage.querySelector('[data-pg-target]')?._tucano;
        return Boolean(mounted) && html.length > 10 && !stage.querySelector('.tuc-hint');
      }, component);
      if (!ok) broken.push(component);
    }
    check(!broken.length, 'playground: os 13 componentes montam e geram código', broken.join(', '));
    await settle();
    const after = await bodyChildren();
    check(after === baseline, 'playground: nenhum painel sobrando no <body> depois da volta', `${baseline} → ${after}`);

    // Modal: abre pela prévia, fecha no Esc, e o onClose aparece nos eventos.
    await page.evaluate(() => { const p = document.getElementById('pg-component'); p.value = 'modal'; p.dispatchEvent(new Event('change', { bubbles: true })); });
    await page.click('#pg-stage button');
    await page.waitForSelector('dialog.tuc-modal[open]');
    if (SHOTS) await shot(page, `${name}-playground-modal`);
    await page.keyboard.press('Escape');
    const logged = await page.waitForFunction(() => document.getElementById('pg-log').textContent.includes('"escape"'), null, { timeout: 3000 }).then(() => true, () => false);
    check(logged, 'playground: onClose do modal registrado com o motivo');

    // Paginação: o clique vira onChange, e o código segue a página nova.
    await page.evaluate(() => { const p = document.getElementById('pg-component'); p.value = 'pagination'; p.dispatchEvent(new Event('change', { bubbles: true })); });
    await page.locator('#pg-stage a', { hasText: /^5$/ }).click();
    check(await waitCode('pg-code-html', 'data-page="5"'), 'playground: página clicada entra no código');

    // Tabela com seleção: a coluna de caixas aparece na prévia.
    await page.evaluate(() => { const p = document.getElementById('pg-component'); p.value = 'table'; p.dispatchEvent(new Event('change', { bubbles: true })); });
    await page.click('[data-option="selectable"]');
    check(await waitCode('pg-code-html', 'data-selectable="true"'), 'playground: selectable entra no código');
    check(await page.locator('#pg-stage input[type=checkbox]').count() > 0, 'playground: e a prévia ganha a coluna de seleção');

    await page.evaluate(() => { const p = document.getElementById('pg-component'); p.value = 'datepicker'; p.dispatchEvent(new Event('change', { bubbles: true })); });
    if (SHOTS) {
      await shot(page, `${name}-playground-light`);
      await setTheme(page, 'dark');
      await page.waitForSelector('#pg-controls [data-option="mode"]');
      await shot(page, `${name}-playground-dark`);
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
      await page.goto(`${BASE}${dir}/playground/`, { waitUntil: 'load' });
      await page.waitForSelector('#pg-controls [data-option="mode"]');
      await page.click('#pg-stage #due-date');
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
    await p.goto(`${BASE}playground/`, { waitUntil: 'load' });
    await p.waitForSelector('#pg-controls [data-option="mode"]');
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    check(overflow <= 0, '390px: playground sem rolagem horizontal', `${overflow}px`);
    const order = await p.evaluate(() => document.getElementById('pg-stage').getBoundingClientRect().top < document.getElementById('pg-controls').getBoundingClientRect().top);
    check(order, '390px: prévia antes das opções');
    await p.click('#pg-stage #due-date');
    const panel = await p.waitForSelector('.tuc-dp.is-open', { timeout: 3000 }).then((h) => h.boundingBox(), () => null);
    check(panel && panel.x >= 0 && panel.x + panel.width <= 390, '390px: calendário da prévia cabe na tela');
    await p.keyboard.press('Escape');
    if (SHOTS) await shot(p, `${name}-mobile-playground-light`);

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
      await p.waitForSelector('#pg-controls [data-option="mode"]');
      await shot(p, `${name}-mobile-playground-dark`);
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
