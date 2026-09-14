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
 *   - a grade de componentes do inicio (<!-- componentes -->), do nav.json
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
const pacote = JSON.parse(readFileSync('package.json', 'utf8'));

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ---- idiomas ---- */

/*
 * O portugues e o idioma de origem: os rotulos abaixo sao o padrao, e cada
 * site/i18n/<idioma>.json so traduz. Rotulo que falta no dicionario cai no
 * portugues, em vez de sair vazio.
 */
const IDIOMAS = [
  { code: 'pt-BR', dir: '', short: 'PT', name: 'Português', ogLocale: 'pt_BR' },
  { code: 'en', dir: 'en', short: 'EN', name: 'English', ogLocale: 'en_US' },
  { code: 'es', dir: 'es', short: 'ES', name: 'Español', ogLocale: 'es_ES' },
];

const UI_PT = {
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
};

const dicionarios = new Map(IDIOMAS.map((l) => {
  const arq = `site/i18n/${l.dir}.json`;
  return [l.code, l.dir && existsSync(arq) ? JSON.parse(readFileSync(arq, 'utf8')) : {}];
}));
const ui = (lang, chave) => dicionarios.get(lang).ui?.[chave] ?? UI_PT[chave];
const nomeGrupo = (lang, grupo) => dicionarios.get(lang).groups?.[grupo] ?? grupo;
const itemNoIdioma = (lang, item) => ({ ...item, ...(dicionarios.get(lang).items?.[item.slug] ?? {}) });

/* Caminho de uma pagina a partir da raiz do site: "", "select/", "en/", "en/select/". */
const caminho = (lang, slug) => {
  const { dir } = IDIOMAS.find((l) => l.code === lang);
  return `${dir ? `${dir}/` : ''}${slug === 'index' ? '' : `${slug}/`}`;
};

/* ---- paginas ---- */

function lerPagina(arq) {
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

/* idioma -> (slug -> pagina). So entra a pagina que existe naquele idioma. */
const paginas = new Map(IDIOMAS.map((l) => {
  const doIdioma = new Map();
  for (const item of itens) {
    const p = lerPagina(`site/pages/${l.dir ? `${l.dir}/` : ''}${item.slug}.html`);
    if (p) doIdioma.set(item.slug, { ...itemNoIdioma(l.code, item), lang: l.code, ...p });
  }
  return [l.code, doIdioma];
}));
const ordem = (lang) => itens.filter((i) => paginas.get(lang).has(i.slug)).map((i) => i.slug);

/* Caminho de uma pagina para outra do mesmo idioma, relativo: funciona no Pages,
   no CDN e aberto direto do disco, sem depender de onde o site foi publicado. */
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

function api(nome, lang) {
  const c = componentes.find((x) => x.nome === nome);
  if (!c) throw new Error(`[site] componente "${nome}" nao existe em src/js/components`);
  const lista = (xs) => xs.map((x) => `<code>${esc(x)}</code>`).join(' ');
  const t = (chave) => esc(ui(lang, chave));
  const partes = [`<p class="lead">${t('apiLead')}</p>`];
  if (c.seletores.length || c.classe) {
    partes.push(`<div class="api-line"><span>${t('apiMarkup')}</span><div>${lista(c.seletores)}</div></div>`);
    partes.push(`<div class="api-line"><span>${t('apiInJs')}</span><div><code>new Tucano.${esc(c.classe)}(${c.argumentos})</code>${
      c.atalhos.length ? ` ${lista(c.atalhos.map((a) => `Tucano.${a}()`))}` : ''}</div></div>`);
  }
  if (c.atributos.length) partes.push(`<div class="api-line"><span>${t('apiAttributes')}</span><div>${lista(c.atributos)}</div></div>`);
  if (c.metodos.length) partes.push(`<div class="api-line"><span>${t('apiMethods')}</span><div>${lista(c.metodos)}</div></div>`);
  if (c.eventos.length) partes.push(`<div class="api-line"><span>${t('apiEvents')}</span><div>${lista(c.eventos)}</div></div>`);
  if (c.opcoes.length) {
    partes.push(`<h3>${t('apiOptions')}</h3>`);
    // As notas saem dos comentarios do codigo, que sao em portugues: fora dele,
    // uma frase avisa em vez de a coluna parecer um descuido.
    if (ui(lang, 'apiNotesNote')) partes.push(`<p>${t('apiNotesNote')}</p>`);
    partes.push(`<div class="tuc-table-wrap"><table class="tuc-table"><thead><tr><th style="width:26%">${t('apiOption')}</th><th style="width:22%">${t('apiDefault')}</th><th>${t('apiWhat')}</th></tr></thead><tbody>`);
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
 * vazado na versao ainda nao publicada, cheio na mais nova. Cada idioma tem o
 * proprio arquivo (CHANGELOG.en.md, CHANGELOG.es.md), no mesmo formato.
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

function grade(de, lang) {
  return nav.filter((g) => g.group !== 'Começar').map((g) => `
  <h3>${esc(nomeGrupo(lang, g.group))}</h3>
  <div class="cards">${g.items.map((cru) => {
    const i = itemNoIdioma(lang, cru);
    const pronto = paginas.get(lang).has(i.slug);
    const miolo = `<b>${esc(i.title)}</b><span>${esc(i.desc || '')}</span>`;
    return pronto
      ? `<a class="link-card" href="${link(de, i.slug)}">${miolo}</a>`
      : `<div class="link-card is-soon" aria-disabled="true">${miolo}<span class="tuc-badge is-plain">${esc(ui(lang, 'soon'))}</span></div>`;
  }).join('')}</div>`).join('\n');
}

function menu(de, lang) {
  return nav.map((g) => `<div class="tuc-menu__section">${esc(nomeGrupo(lang, g.group))}</div>\n${g.items.map((cru) => {
    const i = itemNoIdioma(lang, cru);
    if (!paginas.get(lang).has(i.slug)) return `    <span class="tuc-menu__item is-soon" aria-disabled="true">${esc(i.title)}</span>`;
    const atual = i.slug === de;
    return `    <a class="tuc-menu__item${atual ? ' is-active' : ''}" href="${link(de, i.slug)}"${atual ? ' aria-current="page"' : ''}>${esc(i.title)}</a>`;
  }).join('\n')}`).join('\n');
}

/*
 * Anterior e proxima sao o .tuc-btn da biblioteca com a seta. Um cartao proprio
 * aqui ocupava a largura toda com o nome encostado num canto — era o segundo
 * desenho de botao que a pagina de vitrine nao pode ter.
 */
function paginador(de, lang) {
  const seq = ordem(lang);
  const i = seq.indexOf(de);
  const ant = seq[i - 1], prox = seq[i + 1];
  const seta = (d) => `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
  const botao = (slug, lado) => {
    if (!slug) return '';
    const titulo = esc(paginas.get(lang).get(slug).title);
    const rotulo = `${esc(ui(lang, lado === 'prev' ? 'prevPage' : 'nextPage'))}: ${titulo}`;
    const miolo = lado === 'prev' ? `${seta(ICON_CHEVRON_LEFT)}${titulo}` : `${titulo}${seta(ICON_CHEVRON_RIGHT)}`;
    return `<a class="tuc-btn is-outline is-lg pager__${lado}" href="${link(de, slug)}" aria-label="${rotulo}">${miolo}</a>`;
  };
  return `<nav class="pager" aria-label="${esc(ui(lang, 'docsPager'))}">${botao(ant, 'prev')}${botao(prox, 'next')}</nav>`;
}

/*
 * Seletor de idioma: o menu suspenso da biblioteca, escrito no template, com um
 * link para a mesma pagina em cada idioma. Sai duas vezes (barra lateral e barra
 * do celular), com ids diferentes. Pagina sem traducao leva ao inicio do idioma.
 */
const ICONE_IDIOMA = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22a10 10 0 100-20 10 10 0 000 20zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>';

function seletorDeIdioma(slug, lang, raiz, id) {
  const atual = IDIOMAS.find((l) => l.code === lang);
  // Idioma sem nenhuma pagina fica fora: o link levaria a um 404.
  const itensMenu = IDIOMAS.filter((l) => paginas.get(l.code).size).map((l) => {
    const destino = paginas.get(l.code).has(slug) ? slug : 'index';
    const marcado = l.code === lang ? ' aria-current="true"' : '';
    // `|| './'`: do inicio em portugues para ele mesmo o caminho e vazio, e
    // href="" e fragil — depende de o navegador tratar como a propria pagina.
    const href = `${raiz}${caminho(l.code, destino)}` || './';
    return `<a class="tuc-dropdown__item" href="${href}" hreflang="${l.code}" lang="${l.code}"${marcado}><span class="tuc-dropdown__text">${esc(l.name)}</span></a>`;
  }).join('');
  return `<button class="tuc-btn is-outline is-sm" data-tuc-dropdown="#${id}" data-placement="bottom-end" aria-label="${esc(ui(lang, 'language'))}: ${esc(atual.name)}">${ICONE_IDIOMA}${atual.short}</button>`
    + `<div class="tuc-dropdown" id="${id}" hidden>${itensMenu}</div>`;
}

/* ---- busca: titulo, dados estruturados, hreflang e sitemap ---- */

/*
 * O titulo e o que aparece no resultado da busca. "Tabela — Tucano" nao dizia
 * o que a pagina e para quem procura "tabela django htmx": o nome da biblioteca
 * ninguem digita antes de conhece-la. O <h1> continua curto; so o <title> leva
 * o contexto.
 */
const TITULOS = {
  'pt-BR': {
    index: 'Tucano — componentes JS para Django, Laravel, Rails e HTMX',
    changelog: 'Changelog da Tucano — o que mudou em cada versão',
    // Guia tem titulo proprio: o padrao dos componentes repetiria "Django" no guia
    // de Django e nao diria do que e o de tema.
    django: 'Tucano com Django e HTMX — widgets, POST, erros e CSRF',
    theme: 'Tema da Tucano — tokens CSS, tema escuro e cor de destaque',
    keyboard: 'Teclado e acessibilidade nos componentes da Tucano',
    ai: 'Tucano para agentes de IA — llms.txt e AGENTS.md',
    componente: (t) => `${t} — JavaScript puro para Django, Laravel e Rails`,
  },
  en: {
    index: 'Tucano — JS components for Django, Laravel, Rails and HTMX',
    changelog: 'Tucano changelog — what changed in each version',
    django: 'Tucano with Django and HTMX — widgets, POST, errors and CSRF',
    theme: 'Tucano theme — CSS tokens, dark mode and accent color',
    keyboard: 'Keyboard and accessibility in Tucano components',
    ai: 'Tucano for AI agents — llms.txt and AGENTS.md',
    componente: (t) => `${t} — plain JavaScript for Django, Laravel and Rails`,
  },
  es: {
    index: 'Tucano — componentes JS para Django, Laravel, Rails y HTMX',
    changelog: 'Changelog de Tucano — qué cambió en cada versión',
    django: 'Tucano con Django y HTMX — widgets, POST, errores y CSRF',
    theme: 'Tema de Tucano — tokens CSS, modo oscuro y color de acento',
    keyboard: 'Teclado y accesibilidad en los componentes de Tucano',
    ai: 'Tucano para agentes de IA — llms.txt y AGENTS.md',
    componente: (t) => `${t} — JavaScript puro para Django, Laravel y Rails`,
  },
};

function tituloDaPagina(slug, p) {
  const t = TITULOS[p.lang];
  if (typeof t[slug] === 'string') return t[slug];
  // A marca so entra quando cabe: o Google corta perto de 60 caracteres, e o que
  // precisa aparecer e o nome da pagina e para quem ela serve. "Tucano" continua
  // no og:site_name e no JSON-LD.
  const base = t.componente(p.meta.title);
  return base.length + ' | Tucano'.length <= 60 ? `${base} | Tucano` : base;
}

/*
 * JSON-LD: e dele que buscador e assistente de IA tiram o que a pagina e, sem
 * adivinhar pelo layout. O inicio em portugues descreve o site e o codigo; o
 * inicio nos outros idiomas e uma pagina do mesmo site; cada pagina e um artigo
 * tecnico, com a trilha de volta ao inicio do idioma. Nada de data: o CI regera
 * o site e exige a arvore limpa, e uma data mudaria a cada build.
 */
function jsonld(slug, p, titulo, canonical) {
  const site = { '@id': `${BASE_URL}#website` };
  const software = { '@id': `${BASE_URL}#software` };
  const autor = { '@type': 'Person', name: pacote.author, url: 'https://github.com/JuniorCarlini' };
  const inicioDoIdioma = BASE_URL + caminho(p.lang, 'index');
  let grafo;
  if (slug === 'index' && p.lang === 'pt-BR') {
    grafo = [
      { '@type': 'WebSite', ...site, name: 'Tucano', url: BASE_URL, inLanguage: IDIOMAS.map((l) => l.code), description: p.meta.description, publisher: autor },
      {
        '@type': 'SoftwareSourceCode', ...software, name: 'Tucano', url: BASE_URL,
        description: p.meta.description, codeRepository: 'https://github.com/JuniorCarlini/tucano',
        programmingLanguage: ['JavaScript', 'CSS'], runtimePlatform: 'Navegador', version: versao,
        license: 'https://opensource.org/licenses/MIT', author: autor,
        // Os do package.json sao do npm; aqui entram os back-ends com que a
        // biblioteca funciona igual, que e o que se procura antes de conhece-la.
        keywords: [...pacote.keywords, 'laravel', 'rails', 'flask', 'fastapi', 'php', 'ruby', 'python', 'server-side rendering'].join(', '),
      },
    ];
  } else if (slug === 'index') {
    grafo = [{
      '@type': 'WebPage', name: titulo, description: p.meta.description, url: canonical,
      inLanguage: p.lang, isPartOf: site, about: software, image: `${BASE_URL}og.png`,
    }];
  } else {
    grafo = [
      {
        '@type': 'TechArticle', headline: titulo, name: p.meta.title, description: p.meta.description,
        url: canonical, inLanguage: p.lang, image: `${BASE_URL}og.png`, author: autor,
        isPartOf: site, about: software,
      },
      {
        '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Tucano', item: inicioDoIdioma },
          { '@type': 'ListItem', position: 2, name: p.meta.title, item: canonical },
        ],
      },
    ];
  }
  // `<` escapado: um texto com </script> fecharia o bloco no meio.
  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': grafo }).replace(/</g, '\\u003c');
  return `<script type="application/ld+json">${json}</script>`;
}

/*
 * hreflang: diz ao buscador que a mesma pagina existe em outros idiomas, para
 * mostrar a de cada um a quem procura. Cada versao lista todas as que existem,
 * inclusive ela mesma, e o x-default aponta o portugues.
 */
function hreflang(slug) {
  const versoes = IDIOMAS.filter((l) => paginas.get(l.code).has(slug));
  if (versoes.length < 2) return '';
  return [
    ...versoes.map((l) => `<link rel="alternate" hreflang="${l.code}" href="${BASE_URL}${caminho(l.code, slug)}">`),
    `<link rel="alternate" hreflang="x-default" href="${BASE_URL}${caminho('pt-BR', slug)}">`,
  ].join('\n');
}

/* Sitemap: sem ele o buscador so acha as paginas seguindo links. */
function sitemap() {
  const urls = IDIOMAS.flatMap((l) => ordem(l.code).map((slug) => `  <url><loc>${BASE_URL}${caminho(l.code, slug)}</loc></url>`));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

/* ---- escrita ---- */

const profundidadeDeOut = OUT === '.' ? 0 : OUT.split('/').length;
let escritas = 0;

for (const idioma of IDIOMAS) {
  const lang = idioma.code;
  for (const [slug, p] of paginas.get(lang)) {
    const rota = caminho(lang, slug);
    const raiz = '../'.repeat(profundidadeDeOut + rota.split('/').filter(Boolean).length);

    const scripts = [];
    let corpo = p.corpo.replace(/<script>([\s\S]*?)<\/script>\s*/g, (m) => { scripts.push(m.trim()); return ''; });
    corpo = corpo
      .replaceAll('{{version}}', versao)
      .replaceAll('{{kb-js}}', String(tamanhos.js))
      .replaceAll('{{kb-css}}', String(tamanhos.css))
      .replaceAll('{{root}}', raiz);
    corpo = codigos(corpo);
    corpo = corpo.replace(/<!-- api -->/g, () => api(p.meta.component, lang));
    corpo = corpo.replace(/<!-- componentes -->/g, () => grade(slug, lang));
    // Cada idioma le as notas no proprio idioma; sem o arquivo, cai no portugues
    // em vez de a pagina sair vazia.
    corpo = corpo.replace(/<!-- changelog -->/g, () => {
      const traduzido = idioma.dir ? `CHANGELOG.${idioma.dir}.md` : 'CHANGELOG.md';
      return changelog(readFileSync(existsSync(traduzido) ? traduzido : 'CHANGELOG.md', 'utf8'));
    });

    const titulo = tituloDaPagina(slug, p);
    const canonical = BASE_URL + rota;
    const html = layout
      .replaceAll('{{title}}', esc(titulo))
      .replaceAll('{{description}}', esc(p.meta.description || ''))
      .replaceAll('{{canonical}}', canonical)
      .replaceAll('{{lang}}', lang)
      .replaceAll('{{og-locale}}', idioma.ogLocale)
      .replaceAll('{{og-image-alt}}', esc(ui(lang, 'imageAlt')))
      .replaceAll('{{og-type}}', slug === 'index' ? 'website' : 'article')
      .replace('{{hreflang}}', () => hreflang(slug))
      .replace('{{jsonld}}', () => jsonld(slug, p, titulo, canonical))
      .replaceAll('{{ui-toggle-theme}}', esc(ui(lang, 'toggleTheme')))
      .replaceAll('{{ui-use-light}}', esc(ui(lang, 'useLight')))
      .replaceAll('{{ui-use-dark}}', esc(ui(lang, 'useDark')))
      .replaceAll('{{ui-open-menu}}', esc(ui(lang, 'openMenu')))
      .replaceAll('{{ui-docs-nav}}', esc(ui(lang, 'docsNav')))
      .replaceAll('{{ui-llms}}', esc(ui(lang, 'llms')))
      .replace('{{lang-switch-top}}', () => seletorDeIdioma(slug, lang, raiz, 'idiomas-topo'))
      .replace('{{lang-switch-side}}', () => seletorDeIdioma(slug, lang, raiz, 'idiomas-lateral'))
      .replaceAll('{{root}}', raiz)
      .replaceAll('{{home}}', link(slug, 'index'))
      .replaceAll('{{version}}', versao)
      .replaceAll('{{kb-total}}', String(tamanhos.js + tamanhos.css))
      .replace('{{nav}}', () => menu(slug, lang))
      .replace('{{pager}}', () => paginador(slug, lang))
      .replace('{{scripts}}', () => scripts.join('\n'))
      .replace('{{content}}', () => corpo);   // por ultimo: o conteudo traz {{ }} de template Django

    const pasta = `${OUT}/${rota}`.replace(/\/+$/, '');
    mkdirSync(pasta, { recursive: true });
    writeFileSync(`${pasta}/index.html`, html);
    escritas++;
  }
}

mkdirSync(OUT, { recursive: true });
writeFileSync(`${OUT}/sitemap.xml`, sitemap());

const porIdioma = IDIOMAS.map((l) => `${l.short} ${paginas.get(l.code).size}`).join(', ');
console.log(`site: ${escritas} página(s) (${porIdioma}) e sitemap.xml em ${OUT}/ · ${itens.length - paginas.get('pt-BR').size} ainda sem conteúdo`);
