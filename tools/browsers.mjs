/*
 * Os navegadores dos testes, pelo Playwright.
 *
 * Um lugar so para abrir pagina: os testes rodavam num Chrome achado no disco,
 * e um defeito que so existe no Safari ou no Firefox — como o `relatedTarget`
 * nulo do focusout, registrado no AGENTS.md — passava por eles sem aviso.
 *
 * Quais motores rodam: `--browsers=chromium,webkit` na linha de comando ou
 * `BROWSERS=firefox` no ambiente; sem nenhum dos dois, os tres.
 */
import { chromium, firefox, webkit } from 'playwright';

export const ENGINES = { chromium, firefox, webkit };

export function selectedBrowsers(caller) {
  const flag = process.argv.find((a) => a.startsWith('--browsers='));
  const raw = flag ? flag.slice('--browsers='.length) : process.env.BROWSERS;
  const names = raw ? raw.split(',').map((n) => n.trim()).filter(Boolean) : Object.keys(ENGINES);
  const unknown = names.filter((n) => !ENGINES[n]);
  if (unknown.length || !names.length) {
    console.error(`[${caller}] navegador desconhecido: ${unknown.join(', ') || '(nenhum)'}. `
      + `Use ${Object.keys(ENGINES).join(', ')}.`);
    process.exit(1);
  }
  return names;
}

/*
 * Idioma e fuso fixos: o date picker le o dia da semana, o mes por extenso e o
 * "Hoje" dos atalhos pelo relogio local, e o resultado nao pode depender da
 * maquina de quem roda. Tema claro pelo mesmo motivo — o `auto` segue o sistema.
 */
export async function openPage(name, { viewport = { width: 1280, height: 900 } } = {}) {
  const browser = await ENGINES[name].launch();
  const context = await browser.newContext({
    viewport, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo', colorScheme: 'light',
  });
  const page = await context.newPage();
  return { browser, page };
}
