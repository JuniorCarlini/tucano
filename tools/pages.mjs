/*
 * As paginas geradas do site, na ordem do menu, em todos os idiomas.
 *
 * Sai do mesmo site/nav.json que o gerador usa, para as ferramentas que leem a
 * documentacao (exemplos, consistencia) nunca conferirem uma lista diferente da
 * que foi publicada. Enquanto a documentacao era uma pagina so, bastava ler o
 * index.html; com uma pagina por componente, uma lista escrita a mao aqui
 * esqueceria a primeira pagina nova. As traducoes entram tambem: um exemplo
 * quebrado em ingles ou espanhol e o mesmo defeito que em portugues.
 */
import { readFileSync, existsSync } from 'node:fs';

const nav = JSON.parse(readFileSync('site/nav.json', 'utf8'));
const pastas = ['', 'en/', 'es/'];

export const paginas = pastas.flatMap((pasta) => nav
  .flatMap((g) => g.items)
  .map((i) => `${pasta}${i.slug === 'index' ? 'index.html' : `${i.slug}/index.html`}`)
  .filter((arq) => existsSync(arq)));
