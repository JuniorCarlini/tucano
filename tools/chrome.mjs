/*
 * Onde esta o Chrome.
 *
 * Tres ferramentas precisam dele e nenhuma pode fixar o caminho: no Mac ele
 * mora em /Applications, no CI do Linux em /usr/bin, e quem so tem Chromium
 * tambem tem que conseguir rodar. Quando nada casa, CHROME=/caminho resolve.
 */
import { existsSync } from 'node:fs';

const CANDIDATES = [
  process.env.CHROME,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/snap/bin/chromium',
];

export const CHROME = CANDIDATES.filter(Boolean).find((c) => existsSync(c));

/** Sai com uma mensagem util em vez de um ENOENT cru. */
export function requireChrome(caller) {
  if (CHROME) return CHROME;
  console.error(`[${caller}] Chrome não encontrado. Defina CHROME=/caminho/do/chrome.`);
  process.exit(1);
}

/* --no-sandbox porque em container o sandbox do Chrome nao sobe; --headless=new
   porque o antigo nao tem top layer, e sem ele <dialog> nao mede nada. */
export const FLAGS = ['--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars'];
