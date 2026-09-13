#!/usr/bin/env node
/*
 * Gera o site de documentacao: uma pagina por componente.
 *
 * A pagina unica passou de 2.500 linhas e 28 secoes disputando a mesma rolagem.
 * Aqui cada assunto tem a propria URL, e o que se repete — cabecalho, barra
 * lateral, <head> — e escrito uma vez so, em site/layout.html. Copiar esse
 * esqueleto para cada pagina seria a mesma duplicacao que a biblioteca inteira
 * evita: o menu mudaria num lugar e nao nos outros.
 *
 * Entradas:
 *   site/layout.html     o esqueleto, com {{marcadores}}
 *   site/nav.json        ordem e grupos do menu; e dele que sai anterior/proximo
 *   site/pages/<slug>.html   o conteudo; o comentario do topo traz o titulo
 *
 * Tres coisas sao geradas, e nao escritas a mao, pelo mesmo motivo do llms.txt:
 *   - a tabela de API (<!-- api -->), do mesmo extrator da referencia
 *   - a grade de componentes do inicio (<!-- componentes -->), do nav.json
 *   - os blocos de codigo: <pre data-code> vira .tuc-prose, e quem pinta e poe o
 *     copiar e o proprio destacador da biblioteca, em vez de <span> a mao
 *
 * Uso: node tools/site.mjs [pasta de saida]   (padrao: a raiz do repositorio)
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { componentes } from './api.mjs';

const OUT = (process.argv[2] || '.').replace(/\/+$/, '');
const BASE_URL = 'https://juniorcarlini.github.io/tucano/';
const versao = JSON.parse(readFileSync('package.json', 'utf8')).version;
const kb = (arq) => Math.round(gzipSync(readFileSync(arq)).length / 1024);
const tamanhos = { js: kb('dist/tucano.min.js'), css: kb('dist/tucano.min.css') };

const layout = readFileSync('site/layout.html', 'utf8');
const nav = JSON.parse(readFileSync('site/nav.json', 'utf8'));

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ---- paginas ---- */

function lerPagina(slug) {
  const arq = `site/pages/${slug}.html`;
  if (!existsSync(arq)) return null;
  const src = readFileSync(arq, 'utf8');
  const m = src.match(/^<!--\n([\s\S]*?)\n-->\n/);
  if (!m) throw new Error(`[site] ${arq} sem o comentario de cabecalho`);
  const meta = {};
  for (const linha of m[1].split('\n')) {
    const i = linha.indexOf(':');
    if (i > 0) meta[linha.slice(0, i).trim()] = linha.slice(i + 1).trim();
  }
  if (!meta.title) throw new Error(`[site] ${arq} sem title`);
  return { meta, corpo: src.slice(m[0].length) };
}

const itens = nav.flatMap((g) => g.items.map((i) => ({ ...i, group: g.group })));
const paginas = new Map();
for (const item of itens) {
  const p = lerPagina(item.slug);
  if (p) paginas.set(item.slug, { ...item, ...p });
}
const ordem = itens.filter((i) => paginas.has(i.slug)).map((i) => i.slug);

/* Caminho de uma pagina para outra, relativo: funciona no Pages, no CDN e aberto
   direto do disco, sem depender de onde o site foi publicado. */
const acima = (slug) => (slug === 'index' ? '' : '../');
const link = (de, para) => (acima(de) + (para === 'index' ? '' : `${para}/`)) || './';

/* ---- partes geradas ---- */

function codigos(html) {
  return html.replace(/<pre data-code(?:="\w+")?>\n?([\s\S]*?)<\/pre>/g, (_, bruto) => {
    const linhas = bruto.replace(/\s+$/, '').split('\n');
    const recuo = Math.min(...linhas.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
    const texto = linhas.map((l) => l.slice(recuo)).join('\n');
    return `<div class="tuc-prose doc-code"><pre><code>${esc(texto)}</code></pre></div>`;
  });
}

function api(nome) {
  const c = componentes.find((x) => x.nome === nome);
  if (!c) throw new Error(`[site] componente "${nome}" nao existe em src/js/components`);
  const lista = (xs) => xs.map((x) => `<code>${esc(x)}</code>`).join(' ');
  const partes = [
    '<p class="lead">Gerada do código a cada build — se algo não está aqui, não existe.</p>',
  ];
  if (c.seletores.length || c.classe) {
    partes.push(`<div class="api-line"><span>Marcação</span><div>${lista(c.seletores)}</div></div>`);
    partes.push(`<div class="api-line"><span>Em JS</span><div><code>new Tucano.${esc(c.classe)}(alvo, opcoes)</code>${
      c.atalhos.length ? ` ${lista(c.atalhos.map((a) => `Tucano.${a}()`))}` : ''}</div></div>`);
  }
  if (c.atributos.length) partes.push(`<div class="api-line"><span>Atributos</span><div>${lista(c.atributos)}</div></div>`);
  if (c.metodos.length) partes.push(`<div class="api-line"><span>Métodos</span><div>${lista(c.metodos)}</div></div>`);
  if (c.eventos.length) partes.push(`<div class="api-line"><span>Eventos</span><div>${lista(c.eventos)}</div></div>`);
  if (c.opcoes.length) {
    partes.push('<h3>Opções</h3>');
    partes.push('<div class="tuc-table-wrap"><table class="tuc-table"><thead><tr><th>Opção</th><th>Padrão</th><th>Para quê</th></tr></thead><tbody>');
    for (const o of c.opcoes) {
      partes.push(`<tr><td><code>${esc(o.nome)}</code></td><td><code>${esc(o.padrao)}</code></td><td>${esc(o.nota)}</td></tr>`);
    }
    partes.push('</tbody></table></div>');
  }
  return partes.join('\n');
}

function grade(de) {
  return nav.filter((g) => g.group !== 'Começar').map((g) => `
  <h3>${esc(g.group)}</h3>
  <div class="cards">${g.items.map((i) => {
    const pronto = paginas.has(i.slug);
    const miolo = `<b>${esc(i.title)}</b><span>${esc(i.desc || '')}</span>`;
    return pronto
      ? `<a class="link-card" href="${link(de, i.slug)}">${miolo}</a>`
      : `<div class="link-card is-soon" aria-disabled="true">${miolo}<span class="tuc-badge is-plain">em breve</span></div>`;
  }).join('')}</div>`).join('\n');
}

function menu(de) {
  return nav.map((g) => `<div class="tuc-menu__section">${esc(g.group)}</div>\n${g.items.map((i) => {
    if (!paginas.has(i.slug)) return `    <span class="tuc-menu__item is-soon" aria-disabled="true">${esc(i.title)}</span>`;
    const atual = i.slug === de;
    return `    <a class="tuc-menu__item${atual ? ' is-active' : ''}" href="${link(de, i.slug)}"${atual ? ' aria-current="page"' : ''}>${esc(i.title)}</a>`;
  }).join('\n')}`).join('\n');
}

function paginador(de) {
  const i = ordem.indexOf(de);
  const ant = ordem[i - 1], prox = ordem[i + 1];
  const botao = (slug, lado) => {
    if (!slug) return '<span></span>';
    const p = paginas.get(slug);
    return `<a class="pager__link is-${lado}" href="${link(de, slug)}"><span>${lado === 'prev' ? 'Anterior' : 'Próxima'}</span><b>${esc(p.title)}</b></a>`;
  };
  return `<nav class="pager" aria-label="Paginação da documentação">${botao(ant, 'prev')}${botao(prox, 'next')}</nav>`;
}

/* ---- escrita ---- */

let escritas = 0;
for (const [slug, p] of paginas) {
  const profundidade = (OUT === '.' ? 0 : OUT.split('/').length) + (slug === 'index' ? 0 : 1);
  const raiz = '../'.repeat(profundidade);

  const scripts = [];
  let corpo = p.corpo.replace(/<script>([\s\S]*?)<\/script>\s*/g, (m) => { scripts.push(m.trim()); return ''; });
  corpo = corpo
    .replaceAll('{{version}}', versao)
    .replaceAll('{{kb-js}}', String(tamanhos.js))
    .replaceAll('{{kb-css}}', String(tamanhos.css));
  corpo = codigos(corpo);
  corpo = corpo.replace(/<!-- api -->/g, () => api(p.meta.component));
  corpo = corpo.replace(/<!-- componentes -->/g, () => grade(slug));

  const titulo = slug === 'index' ? 'Tucano — componentes de interface, sem dependências' : `${p.meta.title} — Tucano`;
  const html = layout
    .replaceAll('{{title}}', esc(titulo))
    .replaceAll('{{description}}', esc(p.meta.description || ''))
    .replaceAll('{{canonical}}', BASE_URL + (slug === 'index' ? '' : `${slug}/`))
    .replaceAll('{{root}}', raiz)
    .replaceAll('{{home}}', link(slug, 'index'))
    .replaceAll('{{version}}', versao)
    .replaceAll('{{kb-total}}', String(tamanhos.js + tamanhos.css))
    .replace('{{nav}}', () => menu(slug))
    .replace('{{pager}}', () => paginador(slug))
    .replace('{{scripts}}', () => scripts.join('\n'))
    .replace('{{content}}', () => corpo);   // por ultimo: o conteudo traz {{ }} de template Django

  const pasta = slug === 'index' ? OUT : `${OUT}/${slug}`;
  mkdirSync(pasta, { recursive: true });
  writeFileSync(`${pasta}/index.html`, html);
  escritas++;
}

console.log(`site: ${escritas} página(s) em ${OUT}/ · ${itens.length - escritas} ainda sem conteúdo`);
