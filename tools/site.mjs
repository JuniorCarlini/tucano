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
 *   - o changelog (<!-- changelog -->), do CHANGELOG.md, numa linha do tempo: a mesma nota
 *     serve a quem le no GitHub, no npm e no site
 *
 * Uso: node tools/site.mjs [pasta de saida]   (padrao: a raiz do repositorio)
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { componentes } from './api.mjs';
// As setas do anterior/proxima sao as mesmas da biblioteca, e nao um SVG a mais.
import { ICON_CHEVRON_LEFT, ICON_CHEVRON_RIGHT } from '../src/js/core/dom.js';

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

/*
 * Paginas em outro idioma. So o inicio tem versao em ingles: e por ele que chega
 * quem nao le portugues, e os componentes nao tem texto a traduzir — cada projeto
 * escreve os proprios rotulos. Ficam fora do menu e do anterior/proxima, que sao
 * da documentacao em portugues; o que liga as duas versoes e o hreflang.
 */
const IDIOMAS = {
  'pt-BR': { ogLocale: 'pt_BR', imagemAlt: 'Tucano — componentes de formulário em JavaScript puro' },
  en: { ogLocale: 'en_US', imagemAlt: 'Tucano — form components in plain JavaScript' },
};
const extras = new Map();
for (const slug of ['en']) {
  const p = lerPagina(slug);
  if (p) extras.set(slug, { slug, title: p.meta.title, group: '', lang: p.meta.lang || 'pt-BR', ...p });
}
/* Versoes do inicio, na ordem do hreflang: a primeira e tambem o x-default. */
const versoesDoInicio = [['pt-BR', 'index'], ...[...extras.values()].map((p) => [p.lang, p.slug])];

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
    partes.push(`<div class="api-line"><span>Em JS</span><div><code>new Tucano.${esc(c.classe)}(${c.argumentos})</code>${
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

/*
 * O CHANGELOG.md vira uma linha do tempo (.tuc-timeline): uma versao por item.
 *
 * Le so o formato que o arquivo usa — `## versao — data`, `### grupo` e listas
 * com continuacao recuada. Cada grupo e um subtitulo em texto com a lista
 * embaixo, sem aviso nem etiqueta: numa pagina de dezenas de versoes, caixa
 * colorida em cada uma pesava mais que o conteudo. Quem diz o estado e o ponto:
 * vazado em "Ainda nao publicado", cheio na versao mais nova.
 */

function changelog(md) {
  const inline = (t) => esc(t).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  const slug = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  /* Arquivo -> [{ titulo, grupos: [{ nome, itens }] }]. Item sem grupo cai num grupo sem nome. */
  const versoes = [];
  let versao = null, grupo = null;
  for (const linha of md.split('\n')) {
    if (linha.startsWith('## ')) { versao = { titulo: linha.slice(3).trim(), grupos: [] }; versoes.push(versao); grupo = null; continue; }
    if (!versao) continue;
    if (linha.startsWith('### ')) { grupo = { nome: linha.slice(4).trim(), itens: [] }; versao.grupos.push(grupo); continue; }
    if (linha.startsWith('- ')) {
      if (!grupo) { grupo = { nome: '', itens: [] }; versao.grupos.push(grupo); }
      grupo.itens.push(linha.slice(2).trim());
    } else if (/^\s+\S/.test(linha) && grupo?.itens.length) {
      grupo.itens[grupo.itens.length - 1] += ` ${linha.trim()}`;
    }
  }

  const lista = (itens, classe) => `<ul class="${classe}">${itens.map((i) => `<li>${inline(i)}</li>`).join('')}</ul>`;
  const primeiraPublicada = versoes.findIndex((v) => /^\d/.test(v.titulo));

  const itens = versoes.map((v, i) => {
    const [numero, data] = v.titulo.split(' — ');
    const publicada = /^\d/.test(numero);
    const atual = i === primeiraPublicada;
    const tom = publicada ? (atual ? ' is-accent is-filled' : '') : ' is-accent';
    const [ano, mes, dia] = (data || '').split('-');
    const cabeca = [
      // Id com "v" na frente: um id que comeca com numero vale como ancora, mas nao
      // como seletor CSS — #0-31-0 quebra querySelector.
      `<h2 class="tuc-timeline__title" id="${slug(publicada ? `v${numero}` : numero)}">${inline(numero)}</h2>`,
      data ? `<time class="tuc-timeline__time" datetime="${data}">${dia}/${mes}/${ano}</time>` : '',
    ].join('');
    const corpo = v.grupos.map((g) => `<div class="release__group">${
      g.nome ? `<h3 class="release__heading">${inline(g.nome)}</h3>` : ''}${lista(g.itens, 'release__list')}</div>`).join('');
    return `<li class="tuc-timeline__item${tom}"><div class="tuc-timeline__head">${cabeca}</div><div class="tuc-timeline__body">${corpo}</div></li>`;
  });
  return `<ol class="tuc-timeline changelog">\n${itens.join('\n')}\n</ol>`;
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

/*
 * Anterior e proxima sao o .tuc-btn da biblioteca com a seta. Um cartao proprio
 * aqui ocupava a largura toda com o nome encostado num canto — era o segundo
 * desenho de botao que a pagina de vitrine nao pode ter.
 */
function paginador(de) {
  // Pagina de outro idioma nao faz parte da sequencia da documentacao.
  if (!ordem.includes(de)) return '';
  const i = ordem.indexOf(de);
  const ant = ordem[i - 1], prox = ordem[i + 1];
  const seta = (d) => `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
  const botao = (slug, lado) => {
    if (!slug) return '';
    const titulo = esc(paginas.get(slug).title);
    const rotulo = `${lado === 'prev' ? 'Página anterior' : 'Próxima página'}: ${titulo}`;
    const miolo = lado === 'prev' ? `${seta(ICON_CHEVRON_LEFT)}${titulo}` : `${titulo}${seta(ICON_CHEVRON_RIGHT)}`;
    return `<a class="tuc-btn is-outline is-lg pager__${lado}" href="${link(de, slug)}" aria-label="${rotulo}">${miolo}</a>`;
  };
  return `<nav class="pager" aria-label="Paginação da documentação">${botao(ant, 'prev')}${botao(prox, 'next')}</nav>`;
}

/* ---- busca: titulo, dados estruturados e sitemap ---- */

/*
 * O titulo e o que aparece no resultado da busca. "Tabela — Tucano" nao dizia
 * o que a pagina e para quem procura "tabela django htmx": o nome da biblioteca
 * ninguem digita antes de conhece-la. O <h1> continua curto; so o <title> leva
 * o contexto.
 */
function tituloDaPagina(slug, p) {
  // Nao e so Django: vale para qualquer back-end que devolve HTML do servidor.
  // O titulo cita os tres mais buscados; a lista completa fica no conteudo.
  if (slug === 'index') return 'Tucano — componentes JS para Django, Laravel, Rails e HTMX';
  if (slug === 'en') return 'Tucano — JS components for Django, Laravel, Rails and HTMX';
  if (slug === 'changelog') return 'Changelog da Tucano — o que mudou em cada versão';
  // Guia tem titulo proprio: o padrao dos componentes repetiria "Django" no guia
  // de Django e nao diria do que e o de tema.
  const guias = {
    django: 'Tucano com Django e HTMX — widgets, POST, erros e CSRF',
    theme: 'Tema da Tucano — tokens CSS, tema escuro e cor de destaque',
    keyboard: 'Teclado e acessibilidade nos componentes da Tucano',
    ai: 'Tucano para agentes de IA — llms.txt e AGENTS.md',
  };
  if (guias[slug]) return guias[slug];
  if (p.group === 'Guias') return `${p.meta.title} — guia da Tucano`;
  // A marca so entra quando cabe: o Google corta perto de 60 caracteres, e o que
  // precisa aparecer e o nome da pagina e para quem ela serve. "Tucano" continua
  // no og:site_name e no JSON-LD.
  const base = `${p.meta.title} — JavaScript puro para Django, Laravel e Rails`;
  return base.length + ' | Tucano'.length <= 60 ? `${base} | Tucano` : base;
}

const pacote = JSON.parse(readFileSync('package.json', 'utf8'));

/*
 * JSON-LD: e dele que buscador e assistente de IA tiram o que a pagina e, sem
 * adivinhar pelo layout. O inicio descreve o site e o codigo; cada pagina e um
 * artigo tecnico dentro dele, com a trilha de volta ao inicio. Nada de data: o
 * CI regera o site e exige a arvore limpa, e uma data mudaria a cada build.
 */
function jsonld(slug, p, titulo, canonical) {
  const site = { '@id': `${BASE_URL}#website` };
  const software = { '@id': `${BASE_URL}#software` };
  const autor = { '@type': 'Person', name: pacote.author, url: 'https://github.com/JuniorCarlini' };
  if (extras.has(slug)) {
    // A versao traduzida do inicio e uma pagina do mesmo site, sobre o mesmo codigo.
    const grafoExtra = [{
      '@type': 'WebPage', name: titulo, description: p.meta.description, url: canonical,
      inLanguage: p.lang, isPartOf: site, about: software, image: `${BASE_URL}og.png`,
    }];
    const jsonExtra = JSON.stringify({ '@context': 'https://schema.org', '@graph': grafoExtra }).replace(/</g, '\\u003c');
    return `<script type="application/ld+json">${jsonExtra}</script>`;
  }
  const grafo = slug === 'index'
    ? [
      { '@type': 'WebSite', ...site, name: 'Tucano', url: BASE_URL, inLanguage: 'pt-BR', description: p.meta.description, publisher: autor },
      {
        '@type': 'SoftwareSourceCode', ...software, name: 'Tucano', url: BASE_URL,
        description: p.meta.description, codeRepository: 'https://github.com/JuniorCarlini/tucano',
        programmingLanguage: ['JavaScript', 'CSS'], runtimePlatform: 'Navegador', version: versao,
        license: 'https://opensource.org/licenses/MIT', author: autor,
        // Os do package.json sao do npm; aqui entram os back-ends com que a
        // biblioteca funciona igual, que e o que se procura antes de conhece-la.
        keywords: [...pacote.keywords, 'laravel', 'rails', 'flask', 'fastapi', 'php', 'ruby', 'python', 'server-side rendering'].join(', '),
      },
    ]
    : [
      {
        '@type': 'TechArticle', headline: titulo, name: p.meta.title, description: p.meta.description,
        url: canonical, inLanguage: 'pt-BR', image: `${BASE_URL}og.png`, author: autor,
        isPartOf: site, about: software,
      },
      {
        '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Tucano', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: p.meta.title, item: canonical },
        ],
      },
    ];
  // `<` escapado: um texto com </script> fecharia o bloco no meio.
  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': grafo }).replace(/</g, '\\u003c');
  return `<script type="application/ld+json">${json}</script>`;
}

/* Sitemap: sem ele o buscador so acha as paginas seguindo links. */
function sitemap() {
  const urls = [...ordem, ...extras.keys()].map((slug) => `  <url><loc>${BASE_URL}${slug === 'index' ? '' : `${slug}/`}</loc></url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

/*
 * hreflang: diz ao buscador que o inicio em portugues e em ingles sao a mesma
 * pagina, para mostrar a de cada idioma a quem procura. Cada versao lista todas,
 * inclusive ela mesma, e o x-default aponta o portugues. So o inicio tem par.
 */
function hreflang(slug) {
  if (!versoesDoInicio.some(([, s]) => s === slug)) return '';
  const url = (s) => BASE_URL + (s === 'index' ? '' : `${s}/`);
  return [
    ...versoesDoInicio.map(([lang, s]) => `<link rel="alternate" hreflang="${lang}" href="${url(s)}">`),
    `<link rel="alternate" hreflang="x-default" href="${url('index')}">`,
  ].join('\n');
}

/* ---- escrita ---- */

let escritas = 0;
for (const [slug, p] of [...paginas, ...extras]) {
  const lang = p.lang || 'pt-BR';
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
  corpo = corpo.replace(/<!-- changelog -->/g, () => changelog(readFileSync('CHANGELOG.md', 'utf8')));

  const titulo = tituloDaPagina(slug, p);
  const canonical = BASE_URL + (slug === 'index' ? '' : `${slug}/`);
  const html = layout
    .replaceAll('{{title}}', esc(titulo))
    .replaceAll('{{description}}', esc(p.meta.description || ''))
    .replaceAll('{{canonical}}', canonical)
    .replaceAll('{{lang}}', lang)
    .replaceAll('{{og-locale}}', IDIOMAS[lang].ogLocale)
    .replaceAll('{{og-image-alt}}', esc(IDIOMAS[lang].imagemAlt))
    .replace('{{hreflang}}', () => hreflang(slug))
    .replaceAll('{{og-type}}', slug === 'index' || extras.has(slug) ? 'website' : 'article')
    .replace('{{jsonld}}', () => jsonld(slug, p, titulo, canonical))
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

mkdirSync(OUT, { recursive: true });
writeFileSync(`${OUT}/sitemap.xml`, sitemap());

console.log(`site: ${escritas} página(s) e sitemap.xml em ${OUT}/ · ${itens.length - paginas.size} ainda sem conteúdo`);
