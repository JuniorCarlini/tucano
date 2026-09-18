#!/usr/bin/env node
/*
 * Gera o site de documentacao: uma pagina por componente, em tres idiomas.
 *
 * A pagina unica passou de 2.500 linhas e 28 secoes disputando a mesma rolagem.
 * Aqui cada assunto tem a propria URL, e o que se repete — cabecalho, barra
 * lateral, <head> — e escrito uma vez so, em site/layout.html. Copiar esse
 * esqueleto para cada pagina seria a mesma duplicacao que a biblioteca inteira
 * evita: o menu mudaria num lugar e nao nos outros.
 *
 * Entradas:
 *   site/layout.html              o esqueleto, com {{marcadores}}
 *   site/nav.json                 ordem e grupos do menu; e dele que sai anterior/proximo
 *   site/pages/<slug>.html        o conteudo em portugues; o comentario do topo traz o titulo
 *   site/pages/<idioma>/<slug>.html   a mesma pagina em outro idioma (en, es)
 *   site/i18n/<idioma>.json       menu e rotulos do layout no idioma
 *
 * O portugues fica na raiz do site e os outros idiomas numa pasta cada um
 * (/en/select/, /es/select/). Links entre paginas sao relativos dentro do
 * idioma, entao a mesma pagina traduzida usa os mesmos links; o que aponta para
 * a raiz (logo, llms.txt) usa {{root}}.
 *
 * Coisas geradas, e nao escritas a mao, pelo mesmo motivo do llms.txt:
 *   - a tabela de API (<!-- api -->), do mesmo extrator da referencia
 *   - a grade de componentes do inicio (<!-- components -->), do nav.json
 *   - os blocos de codigo: <pre data-code> vira .tuc-prose, e quem pinta e poe o
 *     copiar e o proprio destacador da biblioteca, em vez de <span> a mao
 *   - o changelog (<!-- changelog -->), do CHANGELOG.md, numa linha do tempo: a mesma nota
 *     serve a quem le no GitHub, no npm e no site
 *   - o hreflang e o seletor de idioma, das paginas que existem em cada idioma
 *
 * Uso: node tools/site.mjs [pasta de saida]   (padrao: a raiz do repositorio)
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { components } from './api.mjs';
// As setas do anterior/proxima sao as mesmas da biblioteca, e nao um SVG a mais.
import { ICON_CHEVRON_LEFT, ICON_CHEVRON_RIGHT } from '../src/js/core/dom.js';

const OUT = (process.argv[2] || '.').replace(/\/+$/, '');
const BASE_URL = 'https://juniorcarlini.github.io/tucano/';
const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
const kb = (file) => Math.round(gzipSync(readFileSync(file)).length / 1024);
const sizes = { js: kb('dist/tucano.min.js'), css: kb('dist/tucano.min.css') };

const layout = readFileSync('site/layout.html', 'utf8');
const nav = JSON.parse(readFileSync('site/nav.json', 'utf8'));
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ---- idiomas ---- */

/*
 * O portugues e o idioma de origem: os rotulos abaixo sao o padrao, e cada
 * site/i18n/<idioma>.json so traduz. Rotulo que falta no dicionario cai no
 * portugues, em vez de sair vazio.
 */
const LANGUAGES = [
  { code: 'pt-BR', dir: '', short: 'PT', name: 'Português', ogLocale: 'pt_BR' },
  { code: 'en', dir: 'en', short: 'EN', name: 'English', ogLocale: 'en_US' },
  { code: 'es', dir: 'es', short: 'ES', name: 'Español', ogLocale: 'es_ES' },
];

const DEFAULT_UI = {
  toggleTheme: 'Alternar tema',
  useLight: 'Usar tema claro',
  useDark: 'Usar tema escuro',
  openMenu: 'Abrir menu',
  docsNav: 'Documentação',
  llms: 'Referência da API para agentes de IA',
  language: 'Idioma',
  imageAlt: 'Tucano — componentes de formulário em JavaScript puro',
  prevPage: 'Página anterior',
  nextPage: 'Próxima página',
  docsPager: 'Paginação da documentação',
  soon: 'em breve',
  apiLead: 'Gerada do código a cada build — se algo não está aqui, não existe.',
  apiNotesNote: '',
  apiMarkup: 'Marcação',
  apiInJs: 'Em JS',
  apiAttributes: 'Atributos',
  apiMethods: 'Métodos',
  apiEvents: 'Eventos',
  apiOptions: 'Opções',
  apiOption: 'Opção',
  apiDefault: 'Padrão',
  apiWhat: 'Para quê',
  search: 'Buscar',
  searchDialog: 'Buscar na documentação',
  searchPlaceholder: 'Buscar componente, opção ou assunto',
  searchResults: 'Resultados da busca',
  searchLoading: 'Carregando o índice...',
  searchError: 'Não foi possível carregar a busca.',
  searchEmpty: 'Nenhum resultado para “{q}”.',
  searchCount: '{n} resultado(s).',
  searchHint: '↑ ↓ para navegar · Enter abre · Esc fecha',
};

const dictionaries = new Map(LANGUAGES.map((l) => {
  const file = `site/i18n/${l.dir}.json`;
  return [l.code, l.dir && existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {}];
}));
const ui = (lang, key) => dictionaries.get(lang).ui?.[key] ?? DEFAULT_UI[key];
/* O dicionario traduz o grupo pelo id; o rotulo em portugues do nav.json e o padrao. */
const groupName = (lang, group) => dictionaries.get(lang).groups?.[group.id] ?? group.group;
const localizeItem = (lang, item) => ({ ...item, ...(dictionaries.get(lang).items?.[item.slug] ?? {}) });

/* Caminho de uma pagina a partir da raiz do site: "", "select/", "en/", "en/select/". */
const pathFor = (lang, slug) => {
  const { dir } = LANGUAGES.find((l) => l.code === lang);
  return `${dir ? `${dir}/` : ''}${slug === 'index' ? '' : `${slug}/`}`;
};

/* ---- paginas ---- */

function readPage(file) {
  if (!existsSync(file)) return null;
  const src = readFileSync(file, 'utf8');
  const m = src.match(/^<!--\n([\s\S]*?)\n-->\n/);
  if (!m) throw new Error(`[site] ${file} sem o comentario de cabecalho`);
  const meta = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  if (!meta.title) throw new Error(`[site] ${file} sem title`);
  return { meta, body: src.slice(m[0].length) };
}

const items = nav.flatMap((g) => g.items.map((i) => ({ ...i, group: g.group })));

/* idioma -> (slug -> pagina). So entra a pagina que existe naquele idioma. */
const pages = new Map(LANGUAGES.map((l) => {
  const langPages = new Map();
  for (const item of items) {
    const p = readPage(`site/pages/${l.dir ? `${l.dir}/` : ''}${item.slug}.html`);
    if (p) langPages.set(item.slug, { ...localizeItem(l.code, item), lang: l.code, ...p });
  }
  return [l.code, langPages];
}));
const order = (lang) => items.filter((i) => pages.get(lang).has(i.slug)).map((i) => i.slug);

/* Caminho de uma pagina para outra do mesmo idioma, relativo: funciona no Pages,
   no CDN e aberto direto do disco, sem depender de onde o site foi publicado. */
const up = (slug) => (slug === 'index' ? '' : '../');
const link = (from, to) => (up(from) + (to === 'index' ? '' : `${to}/`)) || './';

/* ---- partes geradas ---- */

function codeBlocks(html) {
  return html.replace(/<pre data-code(?:="\w+")?>\n?([\s\S]*?)<\/pre>/g, (_, raw) => {
    const lines = raw.replace(/\s+$/, '').split('\n');
    const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
    const text = lines.map((l) => l.slice(indent)).join('\n');
    return `<div class="tuc-prose doc-code"><pre><code>${esc(text)}</code></pre></div>`;
  });
}

function api(name, lang) {
  const c = components.find((x) => x.name === name);
  if (!c) throw new Error(`[site] componente "${name}" nao existe em src/js/components`);
  const list = (xs) => xs.map((x) => `<code>${esc(x)}</code>`).join(' ');
  const t = (key) => esc(ui(lang, key));
  const parts = [`<p class="lead">${t('apiLead')}</p>`];
  if (c.selectors.length || c.className) {
    parts.push(`<div class="api-line"><span>${t('apiMarkup')}</span><div>${list(c.selectors)}</div></div>`);
    parts.push(`<div class="api-line"><span>${t('apiInJs')}</span><div><code>new Tucano.${esc(c.className)}(${c.args})</code>${
      c.shortcuts.length ? ` ${list(c.shortcuts.map((a) => `Tucano.${a}()`))}` : ''}</div></div>`);
  }
  if (c.attributes.length) parts.push(`<div class="api-line"><span>${t('apiAttributes')}</span><div>${list(c.attributes)}</div></div>`);
  if (c.methods.length) parts.push(`<div class="api-line"><span>${t('apiMethods')}</span><div>${list(c.methods)}</div></div>`);
  if (c.events.length) parts.push(`<div class="api-line"><span>${t('apiEvents')}</span><div>${list(c.events)}</div></div>`);
  if (c.options.length) {
    parts.push(`<h3>${t('apiOptions')}</h3>`);
    // As notas saem dos comentarios do codigo, que sao em portugues: fora dele,
    // uma frase avisa em vez de a coluna parecer um descuido.
    if (ui(lang, 'apiNotesNote')) parts.push(`<p>${t('apiNotesNote')}</p>`);
    parts.push(`<div class="tuc-table-wrap"><table class="tuc-table"><thead><tr><th style="width:26%">${t('apiOption')}</th><th style="width:22%">${t('apiDefault')}</th><th>${t('apiWhat')}</th></tr></thead><tbody>`);
    for (const o of c.options) {
      parts.push(`<tr><td><code>${esc(o.name)}</code></td><td><code>${esc(o.defaultValue)}</code></td><td>${esc(o.note)}</td></tr>`);
    }
    parts.push('</tbody></table></div>');
  }
  return parts.join('\n');
}

/*
 * O CHANGELOG.md vira uma linha do tempo (.tuc-timeline): uma versao por item.
 *
 * Le so o formato que o arquivo usa — `## versao — data`, `### grupo` e listas
 * com continuacao recuada. Cada grupo e um subtitulo em texto com a lista
 * embaixo, sem aviso nem etiqueta: numa pagina de dezenas de versoes, caixa
 * colorida em cada uma pesava mais que o conteudo. Quem diz o estado e o ponto:
 * vazado na versao ainda nao publicada, cheio na mais nova. Cada idioma tem o
 * proprio arquivo (CHANGELOG.en.md, CHANGELOG.es.md), no mesmo formato.
 */

function changelog(md) {
  const inline = (t) => esc(t).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  const slug = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  /* Arquivo -> [{ title, groups: [{ name, items }] }]. Item sem grupo cai num grupo sem nome. */
  const releases = [];
  let release = null, group = null;
  for (const line of md.split('\n')) {
    if (line.startsWith('## ')) { release = { title: line.slice(3).trim(), groups: [] }; releases.push(release); group = null; continue; }
    if (!release) continue;
    if (line.startsWith('### ')) { group = { name: line.slice(4).trim(), items: [] }; release.groups.push(group); continue; }
    if (line.startsWith('- ')) {
      if (!group) { group = { name: '', items: [] }; release.groups.push(group); }
      group.items.push(line.slice(2).trim());
    } else if (/^\s+\S/.test(line) && group?.items.length) {
      group.items[group.items.length - 1] += ` ${line.trim()}`;
    }
  }

  const list = (entries, className) => `<ul class="${className}">${entries.map((i) => `<li>${inline(i)}</li>`).join('')}</ul>`;
  const firstReleased = releases.findIndex((v) => /^\d/.test(v.title));

  const entries = releases.map((v, i) => {
    const [number, date] = v.title.split(' — ');
    const released = /^\d/.test(number);
    const current = i === firstReleased;
    const tone = released ? (current ? ' is-accent is-filled' : '') : ' is-accent';
    const [year, month, day] = (date || '').split('-');
    const head = [
      // Id com "v" na frente: um id que comeca com numero vale como ancora, mas nao
      // como seletor CSS — #0-31-0 quebra querySelector.
      `<h2 class="tuc-timeline__title" id="${slug(released ? `v${number}` : number)}">${inline(number)}</h2>`,
      date ? `<time class="tuc-timeline__time" datetime="${date}">${day}/${month}/${year}</time>` : '',
    ].join('');
    const body = v.groups.map((g) => `<div class="release__group">${
      g.name ? `<h3 class="release__heading">${inline(g.name)}</h3>` : ''}${list(g.items, 'release__list')}</div>`).join('');
    return `<li class="tuc-timeline__item${tone}"><div class="tuc-timeline__head">${head}</div><div class="tuc-timeline__body">${body}</div></li>`;
  });
  return `<ol class="tuc-timeline changelog">\n${entries.join('\n')}\n</ol>`;
}

function grid(from, lang) {
  return nav.filter((g) => g.id !== 'get-started').map((g) => `
  <h3>${esc(groupName(lang, g))}</h3>
  <div class="cards">${g.items.map((raw) => {
    const i = localizeItem(lang, raw);
    const ready = pages.get(lang).has(i.slug);
    const inner = `<b>${esc(i.title)}</b><span>${esc(i.desc || '')}</span>`;
    return ready
      ? `<a class="link-card" href="${link(from, i.slug)}">${inner}</a>`
      : `<div class="link-card is-soon" aria-disabled="true">${inner}<span class="tuc-badge is-plain">${esc(ui(lang, 'soon'))}</span></div>`;
  }).join('')}</div>`).join('\n');
}

function menu(from, lang) {
  return nav.map((g) => `<div class="tuc-menu__section">${esc(groupName(lang, g))}</div>\n${g.items.map((raw) => {
    const i = localizeItem(lang, raw);
    if (!pages.get(lang).has(i.slug)) return `    <span class="tuc-menu__item is-soon" aria-disabled="true">${esc(i.title)}</span>`;
    const current = i.slug === from;
    return `    <a class="tuc-menu__item${current ? ' is-active' : ''}" href="${link(from, i.slug)}"${current ? ' aria-current="page"' : ''}>${esc(i.title)}</a>`;
  }).join('\n')}`).join('\n');
}

/*
 * Anterior e proxima sao o .tuc-btn da biblioteca com a seta. Um cartao proprio
 * aqui ocupava a largura toda com o nome encostado num canto — era o segundo
 * desenho de botao que a pagina de vitrine nao pode ter.
 */
function pager(from, lang) {
  const seq = order(lang);
  const i = seq.indexOf(from);
  const prev = seq[i - 1], next = seq[i + 1];
  const arrow = (d) => `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
  const button = (slug, side) => {
    if (!slug) return '';
    const title = esc(pages.get(lang).get(slug).title);
    const label = `${esc(ui(lang, side === 'prev' ? 'prevPage' : 'nextPage'))}: ${title}`;
    const inner = side === 'prev' ? `${arrow(ICON_CHEVRON_LEFT)}${title}` : `${title}${arrow(ICON_CHEVRON_RIGHT)}`;
    return `<a class="tuc-btn is-outline is-lg pager__${side}" href="${link(from, slug)}" aria-label="${label}">${inner}</a>`;
  };
  return `<nav class="pager" aria-label="${esc(ui(lang, 'docsPager'))}">${button(prev, 'prev')}${button(next, 'next')}</nav>`;
}

/*
 * Seletor de idioma: o menu suspenso da biblioteca, escrito no template, com um
 * link para a mesma pagina em cada idioma. Sai duas vezes (barra lateral e barra
 * do celular), com ids diferentes. Pagina sem traducao leva ao inicio do idioma.
 */
const LANGUAGE_ICON = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22a10 10 0 100-20 10 10 0 000 20zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>';

function languageSwitch(slug, lang, root, id) {
  const current = LANGUAGES.find((l) => l.code === lang);
  // Idioma sem nenhuma pagina fica fora: o link levaria a um 404.
  const menuItems = LANGUAGES.filter((l) => pages.get(l.code).size).map((l) => {
    const target = pages.get(l.code).has(slug) ? slug : 'index';
    const marked = l.code === lang ? ' aria-current="true"' : '';
    // `|| './'`: do inicio em portugues para ele mesmo o caminho e vazio, e
    // href="" e fragil — depende de o navegador tratar como a propria pagina.
    const href = `${root}${pathFor(l.code, target)}` || './';
    return `<a class="tuc-dropdown__item" href="${href}" hreflang="${l.code}" lang="${l.code}"${marked}><span class="tuc-dropdown__text">${esc(l.name)}</span></a>`;
  }).join('');
  return `<button class="tuc-btn is-outline is-sm" data-tuc-dropdown="#${id}" data-placement="bottom-end" aria-label="${esc(ui(lang, 'language'))}: ${esc(current.name)}">${LANGUAGE_ICON}${current.short}</button>`
    + `<div class="tuc-dropdown" id="${id}" hidden>${menuItems}</div>`;
}

/* ---- ancoras e indice da busca do site ---- */

const decodeEntities = (t) => t.replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const plain = (html) => decodeEntities(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const slugify = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/*
 * Todo h2 e h3 do conteudo ganha id, para a busca levar direto a secao. A maior
 * parte dos h3 nao tinha: o resultado caia no h2 de cima e a pessoa rolava
 * atras do assunto. O id do h3 leva o do h2 na frente ("usage-em-javascript"),
 * porque "Em JavaScript" se repete em varias secoes da mesma pagina. Titulo com
 * classe e peca de componente (o grupo do changelog, o titulo do modal escrito
 * no template) e fica de fora.
 */
function anchorHeadings(html) {
  const taken = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  let section = '';
  return html.replace(/<h([23])(\s[^>]*)?>([\s\S]*?)<\/h\1>/g, (whole, level, attrs = '', inner) => {
    const own = attrs.match(/\sid="([^"]+)"/);
    if (level === '2' && own) section = own[1];
    if (own || /\sclass=/.test(attrs)) return whole;
    const base = [level === '3' ? section : '', slugify(plain(inner))].filter(Boolean).join('-') || 'section';
    let id = base;
    for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;
    taken.add(id);
    if (level === '2') section = id;
    return `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
  });
}

/* Corta no fim de uma palavra, para o trecho nao terminar em "valid". */
const clip = (text, max) => {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max * 0.7)).trim()}…`;
};

const INTRO_CHARS = 170;
const SECTION_CHARS = 150;

/*
 * Entrada de uma pagina no indice da busca. O indice e baixado inteiro na
 * primeira vez que alguem abre a busca, entao cada byte conta: codigo, <script>,
 * <dialog> de exemplo e SVG saem, e de cada secao fica so o comeco do texto — o
 * bastante para achar o assunto e mostrar de onde veio. Na secao de API entram,
 * em vez da prosa, os nomes de opcao, atributo, metodo e evento, que e o que se
 * procura ali ("minuteStep", "data-max-size").
 *
 * Forma compacta, em listas e nao em objetos, porque a chave se repetiria em
 * cada linha: pagina = [titulo, descricao, url, grupo, introducao];
 * secao = [indice da pagina, titulo, ancora, trecho].
 */
function searchEntry(slug, p, body, index) {
  const html = body
    .replace(/<(pre|script|style|svg|dialog|template)[\s>][\s\S]*?<\/\1>/g, ' ')
    .replace(/<!-- api -->/g, () => {
      const c = components.find((x) => x.name === p.meta.component);
      return c ? esc([...c.options.map((o) => o.name), ...c.attributes, ...c.methods, ...c.events].join(' ')) : '';
    });
  const headings = [...html.matchAll(/<h([23])[^>]*\sid="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g)];
  const withText = slug !== 'changelog';
  const intro = withText ? clip(plain(html.slice(0, headings[0]?.index ?? html.length).replace(/<h1[\s\S]*?<\/h1>/, '')), INTRO_CHARS) : '';
  const pageIndex = index.pages.length;
  const group = nav.find((g) => g.items.some((i) => i.slug === slug));
  index.pages.push([p.title, p.desc || clip(p.meta.description || '', 110),slug === 'index' ? '' : `${slug}/`, groupName(p.lang, group), intro]);
  headings.forEach((h, i) => {
    const end = headings[i + 1]?.index ?? html.length;
    const text = withText ? clip(plain(html.slice(h.index + h[0].length, end)), h[2] === 'api' && p.meta.component ? 900 : SECTION_CHARS) : '';
    index.sections.push([pageIndex, plain(h[3]), h[2], text]);
  });
}

/* ---- busca: titulo, dados estruturados, hreflang e sitemap ---- */

/*
 * O titulo e o que aparece no resultado da busca. "Tabela — Tucano" nao dizia
 * o que a pagina e para quem procura "tabela django htmx": o nome da biblioteca
 * ninguem digita antes de conhece-la. O <h1> continua curto; so o <title> leva
 * o contexto.
 */
const TITLES = {
  'pt-BR': {
    index: 'Tucano — componentes JS para Django, Laravel, Rails e HTMX',
    changelog: 'Changelog da Tucano — o que mudou em cada versão',
    // Guia tem titulo proprio: o padrao dos componentes repetiria "Django" no guia
    // de Django e nao diria do que e o de tema.
    django: 'Tucano com Django e HTMX — widgets, POST, erros e CSRF',
    theme: 'Tema da Tucano — tokens CSS, tema escuro e cor de destaque',
    keyboard: 'Teclado e acessibilidade nos componentes da Tucano',
    ai: 'Tucano para agentes de IA — llms.txt e AGENTS.md',
    component: (t) => `${t} — JavaScript puro para Django, Laravel e Rails`,
  },
  en: {
    index: 'Tucano — JS components for Django, Laravel, Rails and HTMX',
    changelog: 'Tucano changelog — what changed in each version',
    django: 'Tucano with Django and HTMX — widgets, POST, errors and CSRF',
    theme: 'Tucano theme — CSS tokens, dark mode and accent color',
    keyboard: 'Keyboard and accessibility in Tucano components',
    ai: 'Tucano for AI agents — llms.txt and AGENTS.md',
    component: (t) => `${t} — plain JavaScript for Django, Laravel and Rails`,
  },
  es: {
    index: 'Tucano — componentes JS para Django, Laravel, Rails y HTMX',
    changelog: 'Changelog de Tucano — qué cambió en cada versión',
    django: 'Tucano con Django y HTMX — widgets, POST, errores y CSRF',
    theme: 'Tema de Tucano — tokens CSS, modo oscuro y color de acento',
    keyboard: 'Teclado y accesibilidad en los componentes de Tucano',
    ai: 'Tucano para agentes de IA — llms.txt y AGENTS.md',
    component: (t) => `${t} — JavaScript puro para Django, Laravel y Rails`,
  },
};

function pageTitle(slug, p) {
  const t = TITLES[p.lang];
  if (typeof t[slug] === 'string') return t[slug];
  // A marca so entra quando cabe: o Google corta perto de 60 caracteres, e o que
  // precisa aparecer e o nome da pagina e para quem ela serve. "Tucano" continua
  // no og:site_name e no JSON-LD.
  const base = t.component(p.meta.title);
  return base.length + ' | Tucano'.length <= 60 ? `${base} | Tucano` : base;
}

/*
 * JSON-LD: e dele que buscador e assistente de IA tiram o que a pagina e, sem
 * adivinhar pelo layout. O inicio em portugues descreve o site e o codigo; o
 * inicio nos outros idiomas e uma pagina do mesmo site; cada pagina e um artigo
 * tecnico, com a trilha de volta ao inicio do idioma. Nada de data: o CI regera
 * o site e exige a arvore limpa, e uma data mudaria a cada build.
 */
function jsonld(slug, p, title, canonical) {
  const site = { '@id': `${BASE_URL}#website` };
  const software = { '@id': `${BASE_URL}#software` };
  const author = { '@type': 'Person', name: pkg.author, url: 'https://github.com/JuniorCarlini' };
  const langHome = BASE_URL + pathFor(p.lang, 'index');
  let graph;
  if (slug === 'index' && p.lang === 'pt-BR') {
    graph = [
      { '@type': 'WebSite', ...site, name: 'Tucano', url: BASE_URL, inLanguage: LANGUAGES.map((l) => l.code), description: p.meta.description, publisher: author },
      {
        '@type': 'SoftwareSourceCode', ...software, name: 'Tucano', url: BASE_URL,
        description: p.meta.description, codeRepository: 'https://github.com/JuniorCarlini/tucano',
        programmingLanguage: ['JavaScript', 'CSS'], runtimePlatform: 'Navegador', version,
        license: 'https://opensource.org/licenses/MIT', author,
        // Os do package.json sao do npm; aqui entram os back-ends com que a
        // biblioteca funciona igual, que e o que se procura antes de conhece-la.
        keywords: [...pkg.keywords, 'laravel', 'rails', 'flask', 'fastapi', 'php', 'ruby', 'python', 'server-side rendering'].join(', '),
      },
    ];
  } else if (slug === 'index') {
    graph = [{
      '@type': 'WebPage', name: title, description: p.meta.description, url: canonical,
      inLanguage: p.lang, isPartOf: site, about: software, image: `${BASE_URL}og.png`,
    }];
  } else {
    graph = [
      {
        '@type': 'TechArticle', headline: title, name: p.meta.title, description: p.meta.description,
        url: canonical, inLanguage: p.lang, image: `${BASE_URL}og.png`, author,
        isPartOf: site, about: software,
      },
      {
        '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Tucano', item: langHome },
          { '@type': 'ListItem', position: 2, name: p.meta.title, item: canonical },
        ],
      },
    ];
  }
  // `<` escapado: um texto com </script> fecharia o bloco no meio.
  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
  return `<script type="application/ld+json">${json}</script>`;
}

/*
 * hreflang: diz ao buscador que a mesma pagina existe em outros idiomas, para
 * mostrar a de cada um a quem procura. Cada versao lista todas as que existem,
 * inclusive ela mesma, e o x-default aponta o portugues.
 */
function hreflang(slug) {
  const versions = LANGUAGES.filter((l) => pages.get(l.code).has(slug));
  if (versions.length < 2) return '';
  return [
    ...versions.map((l) => `<link rel="alternate" hreflang="${l.code}" href="${BASE_URL}${pathFor(l.code, slug)}">`),
    `<link rel="alternate" hreflang="x-default" href="${BASE_URL}${pathFor('pt-BR', slug)}">`,
  ].join('\n');
}

/* Sitemap: sem ele o buscador so acha as paginas seguindo links. */
function sitemap() {
  const urls = LANGUAGES.flatMap((l) => order(l.code).map((slug) => `  <url><loc>${BASE_URL}${pathFor(l.code, slug)}</loc></url>`));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

/* ---- escrita ---- */

const outDepth = OUT === '.' ? 0 : OUT.split('/').length;
let written = 0;

const searchSizes = [];
for (const language of LANGUAGES) {
  const lang = language.code;
  const index = { pages: [], sections: [] };
  for (const [slug, p] of pages.get(lang)) {
    const route = pathFor(lang, slug);
    const root = '../'.repeat(outDepth + route.split('/').filter(Boolean).length);

    // Script com src tambem vai para o fim do body: e o jeito de uma pagina
    // carregar o proprio arquivo depois do dist/tucano.js.
    const scripts = [];
    let body = p.body.replace(/<script(?: src="[^"]*")?>([\s\S]*?)<\/script>\s*/g, (m) => {
      scripts.push(m.trim().replaceAll('{{root}}', root).replaceAll('{{version}}', version));
      return '';
    });
    body = body
      .replaceAll('{{version}}', version)
      .replaceAll('{{kb-js}}', String(sizes.js))
      .replaceAll('{{kb-css}}', String(sizes.css))
      .replaceAll('{{root}}', root);
    body = codeBlocks(body);
    body = anchorHeadings(body);
    searchEntry(slug, p, body, index);
    body = body.replace(/<!-- api -->/g, () => api(p.meta.component, lang));
    body = body.replace(/<!-- components -->/g, () => grid(slug, lang));
    // Cada idioma le as notas no proprio idioma; sem o arquivo, cai no portugues
    // em vez de a pagina sair vazia.
    body = body.replace(/<!-- changelog -->/g, () => {
      const translated = language.dir ? `CHANGELOG.${language.dir}.md` : 'CHANGELOG.md';
      return changelog(readFileSync(existsSync(translated) ? translated : 'CHANGELOG.md', 'utf8'));
    });

    const title = pageTitle(slug, p);
    const canonical = BASE_URL + route;
    const html = layout
      .replaceAll('{{title}}', esc(title))
      .replaceAll('{{description}}', esc(p.meta.description || ''))
      .replaceAll('{{canonical}}', canonical)
      .replaceAll('{{lang}}', lang)
      .replaceAll('{{og-locale}}', language.ogLocale)
      .replaceAll('{{og-image-alt}}', esc(ui(lang, 'imageAlt')))
      .replaceAll('{{og-type}}', slug === 'index' ? 'website' : 'article')
      .replace('{{hreflang}}', () => hreflang(slug))
      .replace('{{jsonld}}', () => jsonld(slug, p, title, canonical))
      .replaceAll('{{ui-toggle-theme}}', esc(ui(lang, 'toggleTheme')))
      .replaceAll('{{ui-use-light}}', esc(ui(lang, 'useLight')))
      .replaceAll('{{ui-use-dark}}', esc(ui(lang, 'useDark')))
      .replaceAll('{{ui-open-menu}}', esc(ui(lang, 'openMenu')))
      .replaceAll('{{ui-docs-nav}}', esc(ui(lang, 'docsNav')))
      .replaceAll('{{ui-llms}}', esc(ui(lang, 'llms')))
      .replace(/\{\{ui-(search[\w-]*)\}\}/g, (_, key) => esc(ui(lang, key.replace(/-(\w)/g, (__, ch) => ch.toUpperCase()))))
      .replaceAll('{{search-index}}', `${link(slug, 'index')}search.json`)
      .replace('{{lang-switch-top}}', () => languageSwitch(slug, lang, root, 'languages-top'))
      .replace('{{lang-switch-side}}', () => languageSwitch(slug, lang, root, 'languages-side'))
      .replaceAll('{{root}}', root)
      .replaceAll('{{home}}', link(slug, 'index'))
      .replaceAll('{{version}}', version)
      .replaceAll('{{kb-total}}', String(sizes.js + sizes.css))
      .replace('{{nav}}', () => menu(slug, lang))
      .replace('{{pager}}', () => pager(slug, lang))
      .replace('{{scripts}}', () => scripts.join('\n'))
      .replace('{{content}}', () => body);   // por ultimo: o conteudo traz {{ }} de template Django

    const folder = `${OUT}/${route}`.replace(/\/+$/, '');
    mkdirSync(folder, { recursive: true });
    writeFileSync(`${folder}/index.html`, html);
    written++;
  }
  if (!index.pages.length) continue;
  const json = JSON.stringify(index);
  const folder = `${OUT}/${pathFor(lang, 'index')}`.replace(/\/+$/, '');
  mkdirSync(folder, { recursive: true });
  writeFileSync(`${folder}/search.json`, json);
  searchSizes.push(`${language.short} ${(json.length / 1024).toFixed(1)} KB (${(gzipSync(json).length / 1024).toFixed(1)} gzip)`);
}

mkdirSync(OUT, { recursive: true });
writeFileSync(`${OUT}/sitemap.xml`, sitemap());

const perLanguage = LANGUAGES.map((l) => `${l.short} ${pages.get(l.code).size}`).join(', ');
console.log(`site: ${written} página(s) (${perLanguage}) e sitemap.xml em ${OUT}/ · ${items.length - pages.get('pt-BR').size} ainda sem conteúdo`);
console.log(`busca: search.json por idioma — ${searchSizes.join(', ')}`);
