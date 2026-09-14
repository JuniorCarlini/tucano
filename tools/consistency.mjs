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
import { pages } from './pages.mjs';

let failures = 0;
const fail = (msg) => { console.log(`  FALHA  ${msg}`); failures++; };
const ok = (msg) => console.log(`  ok     ${msg}`);

/*
 * O site sao varias paginas geradas, com o estilo em site/site.css e o script
 * comum em site/site.js. Cada pagina ainda pode trazer <style> e <script> seus.
 */
const html = pages.map((file) => readFileSync(file, 'utf8')).join('\n');
const styles = readFileSync('site/site.css', 'utf8') + ' '
  + [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join(' ');
const scripts = readFileSync('site/site.js', 'utf8') + ' '
  + [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join(' ');
/* Blocos de codigo trazem `class="..."` como texto de exemplo — classe do projeto
   de quem copia, e nao da pagina. Fora deles e que se confere. */
const htmlWithoutCode = html.replace(/<pre[\s\S]*?<\/pre>/g, '').replace(/<code>[\s\S]*?<\/code>/g, '');

/* 1. Classe da pagina definida no CSS, usada no HTML e escrita pelo JS. */
{
  const isName = (c) => /^[a-zA-Z][\w-]*$/.test(c);
  const isOwn = (c) => isName(c) && !c.startsWith('tuc-') && !c.startsWith('is-');
  const defined = new Set([...styles.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]).filter(isOwn));
  const used = new Set();
  // Os exemplos em <code> tambem trazem `class="..."`, mas como texto: o que
  // sai de la (`{% if ... == 'listar' %}`) nao tem forma de nome de classe.
  for (const m of htmlWithoutCode.matchAll(/class="([^"]*)"/g)) for (const c of m[1].split(/\s+/)) if (isName(c) && isOwn(c)) used.add(c);
  for (const m of scripts.matchAll(/className\s*=\s*'([^']*)'|classList\.(?:add|toggle|remove)\('([^']*)'/g)) {
    for (const c of (m[1] || m[2]).split(/\s+/)) if (isOwn(c)) used.add(c);
  }
  const orphans = [...defined].filter((c) => !used.has(c));
  // Ruido conhecido: trechos de template Django dentro dos exemplos de codigo.
  const noise = /^(if|endif|for|endfor|k|%\}|==)$/;
  const withoutRule = [...used].filter((c) => !defined.has(c) && !noise.test(c));
  if (orphans.length) fail(`classe no <style> da página que ninguém usa: ${orphans.join(' ')}`);
  else if (withoutRule.length) fail(`classe usada sem regra no <style>: ${withoutRule.join(' ')}`);
  else ok('classes da página: CSS, HTML e JS concordam');
}

/*
 * 1b. Bloco de codigo da pagina com destaque embrulhado duas vezes.
 *
 * Os <pre> sao coloridos a mao com <span class="t|a|s">. Um gerador que marcava
 * as tags antes dos atributos embrulhou o `class="t"` que ele mesmo tinha
 * acabado de inserir: saiu `<span <span class="a">class</span>=...>`, e a
 * pagina mostrava `<class="t">div` no lugar do exemplo. Nao quebra o build nem
 * aparece no console — e tag aberta dentro de outra tag.
 */
{
  const broken = [...html.matchAll(/<pre>([\s\S]*?)<\/pre>/g)]
    .filter((m) => /<[a-zA-Z][^<>]*</.test(m[1]))
    .map((m) => `página:${html.slice(0, m.index).split('\n').length}`);
  if (broken.length) fail(`bloco de código com tag dentro de tag: ${broken.join(' ')}`);
  else ok('blocos de código da página: marcação de destaque íntegra');
}

/* 2. Opcao passada nos handlers inline que nenhum componente le. */
{
  const readOptions = new Set(['confirm', 'cancel']);
  for (const dir of ['src/js/components', 'src/js/core']) {
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.js'))) {
      const t = readFileSync(`${dir}/${f}`, 'utf8');
      const d = t.match(/const DEFAULTS = \{([\s\S]*?)\n\};/);
      if (d) for (const m of d[1].matchAll(/^\s{2}(\w+):/gm)) readOptions.add(m[1]);
      for (const m of t.matchAll(/this\.opts\.(\w+)|\ba\.(\w+)|\bmsgs\.(\w+)/g)) readOptions.add(m[1] || m[2] || m[3]);
      for (const m of t.matchAll(/\{\s*(\w+):\s*\w+Label/g)) readOptions.add(m[1]);
      for (const m of t.matchAll(/const \{([^}]*)\} = (?:msgs|options|opcoes)/g)) {
        for (const n of m[1].split(',')) readOptions.add(n.split(':')[0].trim().replace('...', ''));
      }
    }
  }
  const unknown = new Set();
  for (const m of html.matchAll(/\bon\w+="([^"]*)"/g)) {
    if (!m[1].includes('Tucano.')) continue;
    for (const k of m[1].matchAll(/[{,]\s*(\w+)\s*:/g)) if (!readOptions.has(k[1])) unknown.add(k[1]);
  }
  if (unknown.size) fail(`opção nos handlers que nenhum componente lê: ${[...unknown].join(' ')}`);
  else ok('opções dos handlers inline: todas existem');
}

/* 3. Classe que o JS monta e o CSS nao define (e vice-versa). */
{
  const css = readdirSync('src/styles/components')
    .map((f) => readFileSync(`src/styles/components/${f}`, 'utf8')).join('\n')
    + readFileSync('src/styles/core/base.css', 'utf8');
  const defined = new Set([...css.matchAll(/\.(tuc-[\w-]+)/g)].map((m) => m[1]));
  const js = ['src/js/index.js'].concat(
    readdirSync('src/js/components').map((f) => `src/js/components/${f}`),
    readdirSync('src/js/core').map((f) => `src/js/core/${f}`),
  ).map((f) => readFileSync(f, 'utf8')).join('\n');

  const suffixes = new Set([...js.matchAll(/\$\{[\w.?\s]*\}(__[\w-]+)/g)].map((m) => m[1]));
  // Uma aspa dentro do `${...}` fecha o literal cedo e o nome sai partido
  // (`tuc-select${this.multiple`). O sufixo variavel ja e conferido em
  // `suffixes`; aqui interessa so o nome literal antes da interpolacao.
  const used = new Set([...js.matchAll(/['"`]([^'"`]*\btuc-[\w-]+[^'"`]*)['"`]/g)]
    .flatMap((m) => m[1].split(/\s+/)).map((c) => c.split('${')[0])
    .filter((c) => /^tuc-[\w-]+$/.test(c)));

  const HOOKS = new Set(['tuc-table__sortable', 'tuc-table__check', 'tuc-toast__action', 'tuc-tip__text', 'tuc-pagination__edge']);
  const unstyled = [...used].filter((c) => !defined.has(c) && !HOOKS.has(c)
    && !c.startsWith('tuc-tok') && !/^tuc-(dp|select|colorpicker|upload|toast|tip|modal|drawer|accordion|menu|dropdown|table|pagination|badge|check|input|editor|prose|btn|field|color-field|input-group|copy|native|invalid|select-native|upload-native|native-wrap|table-wrap|toasts)$/.test(c));
  const orphans = [...defined].filter((c) => !used.has(c) && !c.includes('is-')
    && ![...suffixes].some((s) => c.endsWith(s)) && !/^tuc-(tok|prose|input|btn|menu|badge|check|radio|switch|choice|label|hint|error|tabs|alert|spinner|skeleton|timeline|field|input-group|table|dp|copy)/.test(c));

  if (unstyled.length) fail(`classe montada pelo JS sem regra no CSS: ${unstyled.join(' ')}`);
  else if (orphans.length) fail(`classe no CSS que ninguém monta: ${orphans.join(' ')}`);
  else ok('classes do pacote: CSS e JS concordam');
}

/* 4. Nome repetido dentro de si mesmo — o estrago do "x8". */
{
  const walk = (p) => readdirSync(p, { withFileTypes: true })
    .flatMap((e) => (e.isDirectory() ? walk(`${p}/${e.name}`) : [`${p}/${e.name}`]));
  const files = ['src/js', 'src/styles'].flatMap((d) => walk(d));
  // A unidade repetida e o par literal+interpolacao (`tuc-tok-${n}`), nao um
  // dos dois sozinho: foi assim que o estrago passou batido da primeira vez.
  const repeated = /((?:tuc-[\w-]{2,})(?:\$\{[^}]{1,60}\})?)\1+/;
  const findings = [];
  for (const f of files) {
    readFileSync(f, 'utf8').split('\n').forEach((l, i) => {
      if (repeated.test(l)) findings.push(`${f}:${i + 1}`);
    });
  }
  if (findings.length) fail(`trecho repetido em sequência (sinal do estrago "x8"): ${findings.join(' ')}`);
  else ok('nenhum nome multiplicado por repetição');
}

/*
 * 5. Identificador em portugues fora de comentario e string.
 *
 * A regra do projeto e codigo em ingles e comentario em portugues. Vale para a
 * biblioteca e tambem para o que roda em volta dela: as ferramentas, os testes,
 * o script do site e os <script> das paginas. A lista traz palavras que ja
 * apareceram como nome de variavel aqui, sem as que tambem sao ingles (data,
 * total, grade, ruins), para a checagem nao acusar codigo certo.
 */
{
  const PORTUGUESE = new RegExp(`\\b(${[
    // da biblioteca
    'mostrar', 'classe', 'alvo', 'alvos', 'texto', 'valor', 'campo', 'lista', 'painel', 'paineis', 'gatilho',
    'separador', 'gabarito', 'ordenadas', 'filhos', 'saida', 'anterior', 'proxima', 'proximo', 'marcar',
    'estado', 'tamanho', 'tom', 'lado', 'itens', 'acoes', 'conteudo', 'caixa', 'corpo', 'titulo', 'rotulo',
    'icone', 'atalho', 'atalhos', 'variante',
    // das ferramentas, testes e paginas
    'avaliar', 'falha', 'falhas', 'falhar', 'caso', 'partir', 'ler', 'focar', 'digitar', 'tecla', 'teclas',
    'espera', 'pendentes', 'arq', 'arquivo', 'arquivos', 'caminho', 'pasta', 'pastas', 'idioma', 'idiomas',
    'doIdioma', 'itemNoIdioma', 'porIdioma', 'itensMenu', 'nomeGrupo', 'bandeiras', 'exigirChrome', 'porta',
    'ganchos', 'sufixos', 'achados', 'usadas', 'definidas', 'orfas', 'semEstilo', 'anda', 'repetido', 'codigo',
    'codigos', 'herdados', 'ignorar', 'componente', 'componentes', 'argumentos', 'formatos', 'lerPagina',
    'htmlSemCodigo', 'palco', 'limpar', 'pagina', 'paginas', 'nome', 'nomes', 'chave', 'chaves', 'linha',
    'linhas', 'versao', 'versoes', 'grupo', 'grupos', 'opcao', 'opcoes', 'metodo', 'metodos', 'eventos',
    'atributos', 'seletores', 'padrao', 'bruto', 'nota', 'erro', 'erros', 'antes', 'depois', 'dentro',
    'onde', 'destino', 'atual', 'tipo', 'visto', 'nativo', 'borda', 'perigo', 'sucesso', 'escondido', 'aberto',
    'abrir', 'fechar', 'rotular', 'lateral', 'dicionarios', 'pacote', 'tamanhos', 'ordem', 'acima', 'recuo',
    'partes', 'publicada', 'numero', 'cabeca', 'miolo', 'botao', 'seta', 'setas', 'raiz', 'rota', 'escritas',
    'traduzido', 'marcado', 'blocos', 'recorte', 'escopo', 'trecho', 'salto', 'aninhados', 'declaradas',
    'reais', 'sobrando', 'faltando', 'rodavel', 'formatados', 'aceitas', 'raso', 'chamadas', 'dados',
    'problemas', 'faltam', 'sobram', 'inicio', 'fim', 'cortada', 'exportados', 'outros', 'resultado', 'medidas',
    'conferir', 'digitando', 'sonda', 'coluna', 'foco', 'aba', 'abas', 'papel', 'criados', 'ouvir', 'verde',
    'marca', 'pontas', 'todas', 'quebrados', 'lidas', 'ruido', 'semRegra', 'anunciadas', 'inventadas',
  ].join('|')})\\b`);

  /* Tira comentario, string e regex, trocando cada caractere por espaco: a
     linha continua a mesma, e o numero relatado aponta o lugar certo. O que
     fica dentro de `${...}` num template literal e codigo, e continua. */
  const codeOnly = (src) => {
    const out = src.split('');
    const blank = (from, to) => { for (let k = from; k < to; k++) if (out[k] !== '\n') out[k] = ' '; };
    const templates = [];   // profundidade de chaves de cada `${` aberto
    let i = 0, start = 0, state = null, inClass = false;
    while (i < src.length) {
      const c = src[i], d = src[i + 1];
      if (state === null) {
        if (c === '/' && d === '/') { start = i; state = '//'; i += 2; continue; }
        if (c === '/' && d === '*') { start = i; state = '/*'; i += 2; continue; }
        if (c === '/') {
          const before = src.slice(0, i).replace(/\s+$/, '').slice(-1);
          if (before === '' || '(,=:[!&|?{};+-*%~^<>'.includes(before)) { start = i; state = 'regex'; inClass = false; i++; continue; }
        }
        if (c === "'" || c === '"' || c === '`') { start = i; state = c; i++; continue; }
        if (templates.length && c === '{') templates[templates.length - 1]++;
        if (templates.length && c === '}') {
          if (templates[templates.length - 1] === 0) { templates.pop(); start = i; state = '`'; i++; continue; }
          templates[templates.length - 1]--;
        }
        i++; continue;
      }
      if (state === '//') { if (c === '\n') { blank(start, i); state = null; } i++; continue; }
      if (state === '/*') { if (c === '*' && d === '/') { i += 2; blank(start, i); state = null; continue; } i++; continue; }
      if (state === 'regex') {
        if (c === '\\') { i += 2; continue; }
        if (c === '[') inClass = true;
        else if (c === ']') inClass = false;
        else if ((c === '/' && !inClass) || c === '\n') { i++; blank(start, i); state = null; continue; }
        i++; continue;
      }
      if (c === '\\') { i += 2; continue; }
      if (state === '`' && c === '$' && d === '{') { blank(start, i); templates.push(0); state = null; i += 2; continue; }
      if (c === state) { i++; blank(start, i); state = null; continue; }
      i++;
    }
    if (state !== null) blank(start, src.length);
    return out.join('');
  };

  /* Fontes: o arquivo inteiro, ou so os <script> de uma pagina — com o que vem
     antes deles em branco, para a linha relatada ser a do arquivo. Exemplo em
     <pre> e texto para quem le, e nao entra. */
  const walk = (p) => readdirSync(p, { withFileTypes: true })
    .flatMap((e) => (e.isDirectory() ? walk(`${p}/${e.name}`) : [`${p}/${e.name}`]));
  const inside = (dir, ext) => readdirSync(dir).filter((x) => x.endsWith(ext)).map((x) => `${dir}/${x}`);
  const onlyScripts = (src) => {
    const withoutPre = src.replace(/<pre[\s\S]*?<\/pre>/g, (m) => m.replace(/[^\n]/g, ' '));
    let result = withoutPre.replace(/[^\n]/g, ' ');
    for (const m of withoutPre.matchAll(/(<script(?:\s[^>]*)?>)([\s\S]*?)<\/script>/g)) {
      const at = m.index + m[1].length;
      result = result.slice(0, at) + m[2] + result.slice(at + m[2].length);
    }
    return result;
  };
  const sources = [
    ...['src/js', 'src/js/components', 'src/js/core', 'tools', 'test'].flatMap((d) => inside(d, d === 'src/js' || d.startsWith('src/') ? '.js' : '.mjs'))
      .map((file) => ({ file, code: readFileSync(file, 'utf8') })),
    { file: 'site/site.js', code: readFileSync('site/site.js', 'utf8') },
    ...[...walk('site/pages'), ...inside('tools', '.html')].filter((f) => f.endsWith('.html'))
      .map((file) => ({ file, code: onlyScripts(readFileSync(file, 'utf8')) })),
  ];

  const findings = [];
  for (const { file, code } of sources) {
    codeOnly(code).split('\n').forEach((l, i) => {
      const m = l.match(PORTUGUESE);
      if (m) findings.push(`${file}:${i + 1} (${m[1]})`);
    });
  }
  if (findings.length) fail(`identificador em português no código: ${findings.slice(0, 5).join(' ')}`);
  else ok('nenhum identificador em português fora de comentário e texto');
}

/* 5b. Nome em portugues sobrando numa classe CSS publica. */
{
  const PORTUGUESE = /^tuc-[\w-]*(secao|acoes|conteudo|titulo|rotulo|icone|corpo|caixa|texto|valor|campo|lista|painel|gatilho|separador|marcar|estado|tamanho|itens|filhos|saida)\b/;
  const css = readdirSync('src/styles/components')
    .map((f) => readFileSync(`src/styles/components/${f}`, 'utf8')).join('\n');
  const findings = [...new Set([...css.matchAll(/\.(tuc-[\w-]+)/g)].map((m) => m[1]))].filter((c) => PORTUGUESE.test(c));
  if (findings.length) fail(`classe CSS com nome em português: ${findings.join(' ')}`);
  else ok('classes CSS: nenhum nome em português');
}

/* 6. Opcao anunciada no README que o componente nao le, e o contrario. */
{
  const readme = readFileSync('README.md', 'utf8');
  const readOptions = new Map();   // opcao -> componente que a le
  for (const dir of ['src/js/components', 'src/js/core']) {
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.js'))) {
      const t = readFileSync(`${dir}/${f}`, 'utf8');
      const d = t.match(/const DEFAULTS = \{([\s\S]*?)\n\};/);
      if (!d) continue;
      for (const m of d[1].matchAll(/^\s{2}(\w+):/gm)) readOptions.set(m[1], f.replace('.js', ''));
    }
  }
  // So as tabelas de opcao. O README tem outras — modos de reveal, tons de
  // etiqueta — com a mesma forma, e a primeira celula delas nao e uma opcao.
  const announced = new Set();
  let inTable = false;
  for (const line of readme.split('\n')) {
    if (/^\|\s*Opção\s*\|/.test(line)) { inTable = true; continue; }
    if (!line.startsWith('|')) { inTable = false; continue; }
    if (!inTable) continue;
    const m = line.match(/^\| `([^`]+)` \|/);
    if (!m) continue;
    for (const name of m[1].split(/`?\s*\/\s*`?/)) if (/^[a-z]\w*$/.test(name)) announced.add(name);
  }
  // So numa direcao. O README e guia, nao inventario: ele escolhe o que contar,
  // e a lista completa sai gerada em llms.txt. O que nao pode e o contrario —
  // anunciar uma opcao que componente nenhum le, que foi o que a renomeacao fez.
  const invented = [...announced].filter((o) => !readOptions.has(o));
  if (invented.length) fail(`opção na tabela do README que ninguém lê: ${invented.join(' ')}`);
  else ok(`README: ${announced.size} opções nas tabelas, todas lidas por alguém`);
}

/*
 * 7. Changelog traduzido com uma versao a menos, ou com a nota pela metade.
 *
 * O site mostra as notas no idioma de cada pagina, e cada idioma tem o proprio
 * arquivo. A regra e escrever a nota nos tres; sem esta checagem, esquecer uma
 * tradução nao quebra nada, e a pagina em ingles simplesmente para numa versao
 * antiga. Compara, com o portugues, a lista de versoes (numero e data, na mesma
 * ordem) e a quantidade de itens de cada uma. A versao ainda nao publicada tem
 * titulo proprio em cada idioma e casa com as outras por nao comecar com numero.
 */
{
  const versions = (file) => {
    const list = [];
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      if (line.startsWith('## ')) {
        const title = line.slice(3).trim();
        list.push({ key: /^\d/.test(title) ? title : '(não publicada)', items: 0 });
      } else if (line.startsWith('- ') && list.length) list[list.length - 1].items++;
    }
    return list;
  };
  const pt = versions('CHANGELOG.md');
  const problems = [];
  for (const file of ['CHANGELOG.en.md', 'CHANGELOG.es.md']) {
    let tr;
    try { tr = versions(file); } catch { problems.push(`${file} não existe`); continue; }
    const ptKeys = pt.map((v) => v.key), trKeys = tr.map((v) => v.key);
    const missing = ptKeys.filter((c) => !trKeys.includes(c));
    const extra = trKeys.filter((c) => !ptKeys.includes(c));
    if (missing.length) problems.push(`${file} sem ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? '…' : ''}`);
    if (extra.length) problems.push(`${file} com versão que o português não tem: ${extra.slice(0, 3).join(', ')}`);
    if (!missing.length && !extra.length && ptKeys.join() !== trKeys.join()) problems.push(`${file} com as versões em outra ordem`);
    for (const v of pt) {
      const match = tr.find((x) => x.key === v.key);
      if (match && match.items !== v.items) problems.push(`${file} ${v.key}: ${match.items} itens, o português tem ${v.items}`);
    }
  }
  if (problems.length) fail(`changelog traduzido fora de compasso: ${problems.slice(0, 4).join(' · ')}`);
  else ok(`changelog: ${pt.length} versões iguais em português, inglês e espanhol`);
}

console.log(failures ? `\n${failures} incoerência(s)` : '\ntudo coerente');
process.exit(failures ? 1 : 0);
