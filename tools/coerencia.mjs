#!/usr/bin/env node
/*
 * Checagens cruzadas: nome que existe em dois lugares e mudou so num.
 *
 * Tres defeitos desta biblioteca vieram exatamente disso, e nenhum quebrava o
 * build nem aparecia no console:
 *
 *   - `.block` no <style> e `'bloco'` no className do script: o botao de copiar
 *     ficava invisivel e fora do bloco.
 *   - `tamanho:` e `tom:` nos onclick= da pagina, que nenhum componente le: o
 *     modal ignorava o tom e a gaveta nem abria.
 *   - `.tuc-tok-${n}` repetido oito vezes no template do span: classe que nao
 *     casa com regra nenhuma, e o codigo saia sem cor.
 *
 * Cada um foi achado por um script de rascunho que nao ficou no repositorio.
 * Aqui ficam.
 */
import { readFileSync, readdirSync } from 'node:fs';

let falhas = 0;
const falhar = (msg) => { console.log(`  FALHA  ${msg}`); falhas++; };
const ok = (msg) => console.log(`  ok     ${msg}`);

const html = readFileSync('index.html', 'utf8');
const estilos = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join(' ');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join(' ');

/* 1. Classe da pagina definida no CSS, usada no HTML e escrita pelo JS. */
{
  const nome = (c) => /^[a-zA-Z][\w-]*$/.test(c);
  const proprias = (c) => nome(c) && !c.startsWith('tuc-') && !c.startsWith('is-');
  const definidas = new Set([...estilos.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]).filter(proprias));
  const usadas = new Set();
  // Os exemplos em <code> tambem trazem `class="..."`, mas como texto: o que
  // sai de la (`{% if ... == 'listar' %}`) nao tem forma de nome de classe.
  for (const m of html.matchAll(/class="([^"]*)"/g)) for (const c of m[1].split(/\s+/)) if (nome(c) && proprias(c)) usadas.add(c);
  for (const m of scripts.matchAll(/className\s*=\s*'([^']*)'|classList\.(?:add|toggle|remove)\('([^']*)'/g)) {
    for (const c of (m[1] || m[2]).split(/\s+/)) if (proprias(c)) usadas.add(c);
  }
  const orfas = [...definidas].filter((c) => !usadas.has(c));
  // Ruido conhecido: trechos de template Django dentro dos exemplos de codigo.
  const ruido = /^(if|endif|for|endfor|k|%\}|==)$/;
  const semRegra = [...usadas].filter((c) => !definidas.has(c) && !ruido.test(c));
  if (orfas.length) falhar(`classe no <style> da página que ninguém usa: ${orfas.join(' ')}`);
  else if (semRegra.length) falhar(`classe usada sem regra no <style>: ${semRegra.join(' ')}`);
  else ok('classes da página: CSS, HTML e JS concordam');
}

/* 2. Opcao passada nos handlers inline que nenhum componente le. */
{
  const lidas = new Set(['confirm', 'cancel']);
  for (const dir of ['src/js/components', 'src/js/core']) {
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.js'))) {
      const t = readFileSync(`${dir}/${f}`, 'utf8');
      const d = t.match(/const DEFAULTS = \{([\s\S]*?)\n\};/);
      if (d) for (const m of d[1].matchAll(/^\s{2}(\w+):/gm)) lidas.add(m[1]);
      for (const m of t.matchAll(/this\.opts\.(\w+)|\ba\.(\w+)|\bmsgs\.(\w+)/g)) lidas.add(m[1] || m[2] || m[3]);
      for (const m of t.matchAll(/\{\s*(\w+):\s*\w+Label/g)) lidas.add(m[1]);
      for (const m of t.matchAll(/const \{([^}]*)\} = (?:msgs|options|opcoes)/g)) {
        for (const n of m[1].split(',')) lidas.add(n.split(':')[0].trim().replace('...', ''));
      }
    }
  }
  const ruins = new Set();
  for (const m of html.matchAll(/\bon\w+="([^"]*)"/g)) {
    if (!m[1].includes('Tucano.')) continue;
    for (const k of m[1].matchAll(/[{,]\s*(\w+)\s*:/g)) if (!lidas.has(k[1])) ruins.add(k[1]);
  }
  if (ruins.size) falhar(`opção nos handlers que nenhum componente lê: ${[...ruins].join(' ')}`);
  else ok('opções dos handlers inline: todas existem');
}

/* 3. Classe que o JS monta e o CSS nao define (e vice-versa). */
{
  const css = readdirSync('src/styles/components')
    .map((f) => readFileSync(`src/styles/components/${f}`, 'utf8')).join('\n')
    + readFileSync('src/styles/core/base.css', 'utf8');
  const definidas = new Set([...css.matchAll(/\.(tuc-[\w-]+)/g)].map((m) => m[1]));
  const js = ['src/js/index.js'].concat(
    readdirSync('src/js/components').map((f) => `src/js/components/${f}`),
    readdirSync('src/js/core').map((f) => `src/js/core/${f}`),
  ).map((f) => readFileSync(f, 'utf8')).join('\n');

  const sufixos = new Set([...js.matchAll(/\$\{[\w.?\s]*\}(__[\w-]+)/g)].map((m) => m[1]));
  // Uma aspa dentro do `${...}` fecha o literal cedo e o nome sai partido
  // (`tuc-select${this.multiple`). O sufixo variavel ja e conferido em
  // `sufixos`; aqui interessa so o nome literal antes da interpolacao.
  const usadas = new Set([...js.matchAll(/['"`]([^'"`]*\btuc-[\w-]+[^'"`]*)['"`]/g)]
    .flatMap((m) => m[1].split(/\s+/)).map((c) => c.split('${')[0])
    .filter((c) => /^tuc-[\w-]+$/.test(c)));

  const GANCHOS = new Set(['tuc-table__sortable', 'tuc-table__check', 'tuc-toast__action', 'tuc-tip__text']);
  const semEstilo = [...usadas].filter((c) => !definidas.has(c) && !GANCHOS.has(c)
    && !c.startsWith('tuc-tok') && !/^tuc-(dp|select|colorpicker|upload|toast|tip|modal|drawer|accordion|menu|dropdown|table|pagination|badge|check|input|editor|prose|btn|field|color-field|input-group|copy|native|invalid|select-native|upload-native|native-wrap|table-wrap|toasts)$/.test(c));
  const orfas = [...definidas].filter((c) => !usadas.has(c) && !c.includes('is-')
    && ![...sufixos].some((s) => c.endsWith(s)) && !/^tuc-(tok|prose|input|btn|menu|badge|check|field|input-group|table|dp|copy)/.test(c));

  if (semEstilo.length) falhar(`classe montada pelo JS sem regra no CSS: ${semEstilo.join(' ')}`);
  else if (orfas.length) falhar(`classe no CSS que ninguém monta: ${orfas.join(' ')}`);
  else ok('classes do pacote: CSS e JS concordam');
}

/* 4. Nome repetido dentro de si mesmo — o estrago do "x8". */
{
  const arquivos = ['src/js', 'src/styles'].flatMap((d) => {
    const anda = (p) => readdirSync(p, { withFileTypes: true })
      .flatMap((e) => (e.isDirectory() ? anda(`${p}/${e.name}`) : [`${p}/${e.name}`]));
    return anda(d);
  });
  // A unidade repetida e o par literal+interpolacao (`tuc-tok-${n}`), nao um
  // dos dois sozinho: foi assim que o estrago passou batido da primeira vez.
  const repetido = /((?:tuc-[\w-]{2,})(?:\$\{[^}]{1,60}\})?)\1+/;
  const achados = [];
  for (const f of arquivos) {
    readFileSync(f, 'utf8').split('\n').forEach((l, i) => {
      if (repetido.test(l)) achados.push(`${f}:${i + 1}`);
    });
  }
  if (achados.length) falhar(`trecho repetido em sequência (sinal do estrago "x8"): ${achados.join(' ')}`);
  else ok('nenhum nome multiplicado por repetição');
}

/* 5. Identificador em portugues fora de comentario e string. */
{
  const PT = /\b(mostrar|classe|alvo|texto|valor|campo|lista|painel|gatilho|separador|gabarito|ordenadas|filhos|saida|anterior|proxima|marcar|estado|tamanho|tom|lado|itens|acoes|conteudo|caixa|corpo|titulo|rotulo|icone|atalho|variante)\b/;
  const codigo = (src) => {
    let out = '', i = 0, ini = 0, s = null;
    while (i < src.length) {
      const c = src[i], d = src[i + 1];
      if (s === null) {
        if (c === '/' && d === '/') { out += src.slice(ini, i); s = '//'; i += 2; continue; }
        if (c === '/' && d === '*') { out += src.slice(ini, i); s = '/*'; i += 2; continue; }
        if (c === '/') {
          const antes = src.slice(0, i).replace(/\s+$/, '').slice(-1);
          if (antes === '' || '(,=:[!&|?{};+-*%~^<>'.includes(antes)) { out += src.slice(ini, i); s = 'regex'; i++; continue; }
        }
        if (c === "'" || c === '"' || c === '`') { out += src.slice(ini, i); s = c; i++; continue; }
        i++; continue;
      }
      if (s === '//') { if (c === '\n') { s = null; ini = i; } i++; continue; }
      if (s === '/*') { if (c === '*' && d === '/') { s = null; i += 2; ini = i; continue; } i++; continue; }
      if (s === 'regex') { if (c === '\\') { i += 2; continue; } if (c === '/') { s = null; i++; ini = i; continue; } i++; continue; }
      if (c === '\\') { i += 2; continue; }
      if (c === s) { s = null; i++; ini = i; continue; }
      i++;
    }
    return out + src.slice(ini);
  };
  const achados = [];
  for (const dir of ['src/js', 'src/js/components', 'src/js/core']) {
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.js'))) {
      codigo(readFileSync(`${dir}/${f}`, 'utf8')).split('\n').forEach((l, i) => {
        const m = l.match(PT);
        if (m) achados.push(`${dir}/${f}:${i + 1} (${m[1]})`);
      });
    }
  }
  if (achados.length) falhar(`identificador em português no código: ${achados.slice(0, 5).join(' ')}`);
  else ok('nenhum identificador em português fora de comentário e texto');
}

/* 5b. Nome em portugues sobrando numa classe CSS publica. */
{
  const PT = /^tuc-[\w-]*(secao|acoes|conteudo|titulo|rotulo|icone|corpo|caixa|texto|valor|campo|lista|painel|gatilho|separador|marcar|estado|tamanho|itens|filhos|saida)\b/;
  const css = readdirSync('src/styles/components')
    .map((f) => readFileSync(`src/styles/components/${f}`, 'utf8')).join('\n');
  const APELIDOS = new Set(['tuc-menu__secao']);   // nome antigo, mantido de proposito
  const achados = [...new Set([...css.matchAll(/\.(tuc-[\w-]+)/g)].map((m) => m[1]))]
    .filter((c) => PT.test(c) && !APELIDOS.has(c));
  if (achados.length) falhar(`classe CSS com nome em português: ${achados.join(' ')}`);
  else ok('classes CSS: nenhum nome em português fora dos apelidos antigos');
}

/* 6. Opcao anunciada no README que o componente nao le, e o contrario. */
{
  const readme = readFileSync('README.md', 'utf8');
  const lidas = new Map();   // opcao -> componente que a le
  for (const dir of ['src/js/components', 'src/js/core']) {
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.js'))) {
      const t = readFileSync(`${dir}/${f}`, 'utf8');
      const d = t.match(/const DEFAULTS = \{([\s\S]*?)\n\};/);
      if (!d) continue;
      for (const m of d[1].matchAll(/^\s{2}(\w+):/gm)) lidas.set(m[1], f.replace('.js', ''));
    }
  }
  // So as tabelas de opcao. O README tem outras — modos de reveal, tons de
  // etiqueta — com a mesma forma, e a primeira celula delas nao e uma opcao.
  const anunciadas = new Set();
  let dentro = false;
  for (const linha of readme.split('\n')) {
    if (/^\|\s*Opção\s*\|/.test(linha)) { dentro = true; continue; }
    if (!linha.startsWith('|')) { dentro = false; continue; }
    if (!dentro) continue;
    const m = linha.match(/^\| `([^`]+)` \|/);
    if (!m) continue;
    for (const nome of m[1].split(/`?\s*\/\s*`?/)) if (/^[a-z]\w*$/.test(nome)) anunciadas.add(nome);
  }
  // So numa direcao. O README e guia, nao inventario: ele escolhe o que contar,
  // e a lista completa sai gerada em llms.txt. O que nao pode e o contrario —
  // anunciar uma opcao que componente nenhum le, que foi o que a renomeacao fez.
  const inventadas = [...anunciadas].filter((o) => !lidas.has(o));
  if (inventadas.length) falhar(`opção na tabela do README que ninguém lê: ${inventadas.join(' ')}`);
  else ok(`README: ${anunciadas.size} opções nas tabelas, todas lidas por alguém`);
}

console.log(falhas ? `\n${falhas} incoerência(s)` : '\ntudo coerente');
process.exit(falhas ? 1 : 0);
