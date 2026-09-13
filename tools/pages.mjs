/*
 * As paginas geradas do site, na ordem do menu.
 *
 * Sai do mesmo site/nav.json que o gerador usa, para as ferramentas que leem a
 * documentacao (exemplos, consistencia) nunca conferirem uma lista diferente da
 * que foi publicada. Enquanto a documentacao era uma pagina so, bastava ler o
 * index.html; com uma pagina por componente, uma lista escrita a mao aqui
 * esqueceria a primeira pagina nova.
 */
import { readFileSync, existsSync } from 'node:fs';

const nav = JSON.parse(readFileSync('site/nav.json', 'utf8'));

export const paginas = nav
  .flatMap((g) => g.items)
  .map((i) => (i.slug === 'index' ? 'index.html' : `${i.slug}/index.html`))
  .filter((arq) => existsSync(arq));
