/*
 * Onde esta o Chrome.
 *
 * Tres ferramentas precisam dele e nenhuma pode fixar o caminho: no Mac ele
 * mora em /Applications, no CI do Linux em /usr/bin, e quem so tem Chromium
 * tambem tem que conseguir rodar. Quando nada casa, CHROME=/caminho resolve.
 */
import { existsSync } from 'node:fs';

const CANDIDATOS = [
  process.env.CHROME,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/snap/bin/chromium',
];

export const CHROME = CANDIDATOS.filter(Boolean).find((c) => existsSync(c));

/** Sai com uma mensagem util em vez de um ENOENT cru. */
export function exigirChrome(quem) {
  if (CHROME) return CHROME;
  console.error(`[${quem}] Chrome não encontrado. Defina CHROME=/caminho/do/chrome.`);
  process.exit(1);
}

/* --no-sandbox porque em container o sandbox do Chrome nao sobe; --headless=new
   porque o antigo nao tem top layer, e sem ele <dialog> nao mede nada. */
export const BANDEIRAS = ['--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars'];
