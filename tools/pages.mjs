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

/*
 * As paginas saem de `build/`, que e onde o gerador escreve e de onde o
 * workflow publica. Antes elas ficavam versionadas na raiz; quem conferisse a
 * raiz hoje leria o que sobrou de um build antigo, ou nada.
 */
const OUT = 'build';
const nav = JSON.parse(readFileSync('site/nav.json', 'utf8'));
const folders = ['', 'en/', 'es/'];

export const pages = folders.flatMap((folder) => nav
  .flatMap((g) => g.items)
  .map((i) => `${OUT}/${folder}${i.slug === 'index' ? 'index.html' : `${i.slug}/index.html`}`)
  .filter((file) => existsSync(file)));

/*
 * Sem paginas, quem usa esta lista passa calado — e um teste que confere nada
 * parece um teste que passou. Melhor parar e dizer o que falta.
 */
if (!pages.length) {
  throw new Error(`[pages] nenhuma página em ${OUT}/ — rode "npm run build" antes de conferir a documentação`);
}
