#!/usr/bin/env node
/*
 * Gera a referencia completa da API dentro do llms.txt.
 *
 * Roda no fim do build pelo mesmo motivo do carimbo de versao: referencia
 * escrita a mao envelhece na primeira opcao nova, e quem paga e a IA que le o
 * arquivo e sugere uma opcao que nao existe — ou deixa de sugerir a que existe.
 * Medido antes desta ferramenta: 40 opcoes, 8 metodos e 22 exports publicos nao
 * apareciam em lugar nenhum do llms.txt.
 *
 * A fonte e o codigo: DEFAULTS de cada componente, os metodos publicos, o
 * seletor do autoInit, os data-attributes que ele le e os eventos que dispara.
 * O texto explicativo continua escrito a mao acima; aqui so entra o inventario.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const INICIO = '## Referencia completa (gerada pelo build)';
const FIM = '## Ao gerar código que usa Tucano';

/* Metodos que vem da classe base, invisiveis no arquivo do componente. */
const HERDADOS = { modal: ['open', 'close', 'content'], drawer: ['open', 'close', 'content'] };

const IGNORAR = new Set(['constructor', 'if', 'for', 'while', 'switch', 'catch', 'return', 'get', 'set']);

const componentes = readdirSync('src/js/components').filter((f) => f.endsWith('.js')).map((f) => {
  const nome = f.replace('.js', '');
  const t = readFileSync(`src/js/components/${f}`, 'utf8');
  const d = t.match(/const DEFAULTS = \{([\s\S]*?)\n\};/);
  return {
    nome,
    classe: (t.match(/^export class (\w+)/m) || [])[1],
    atalhos: [...t.matchAll(/^export function (\w+)\(/gm)].map((m) => m[1]).filter((n) => n !== 'autoInit'),
    // O comentario ao lado da opcao explica o valor aceito; vale ouro para a IA.
    /*
     * Valor que abre em varias linhas (array, objeto) nao cabe no casamento de
     * uma linha so — `toolbar` sumia da referencia por isso. Aqui o valor e
     * lido ate o fecha-chave, e resumido.
     */
    opcoes: d ? [...d[1].matchAll(/^\s{2}(\w+):\s*([\s\S]*?)(?=\n\s{2}\w+:|$)/gm)].map((m) => {
      const bruto = m[2].replace(/,\s*$/, '').trim();
      const nota = (bruto.match(/\/\/\s*(.*)$/m) || [])[1]?.trim() ?? '';
      let padrao = bruto.replace(/\/\/.*$/gm, '').replace(/\s+/g, ' ').trim().replace(/,$/, '');
      if (padrao.length > 62) padrao = padrao.slice(0, 59) + '...';
      return { nome: m[1], padrao, nota };
    }) : [],
    metodos: [...new Set([...t.matchAll(/^  ([a-zA-Z]\w*)\s*\([^)]*\)\s*\{/gm)].map((m) => m[1])
      .filter((n) => !IGNORAR.has(n)).concat(HERDADOS[nome] ?? []))],
    /*
     * So o corpo do autoInit interessa: e la que os data-attributes sao lidos.
     * Varrer o arquivo inteiro trazia `d.getDate()` de uma variavel Date como
     * se fosse `data-get-date`.
     */
    seletores: [...new Set([...t.matchAll(/querySelectorAll\('([^']*data-tuc[^']*)'\)/g)]
      .map((m) => m[1].replace(/:not\(\[data-tuc-ready\]\)/g, '')))],
    atributos: (() => {
      const i = t.indexOf('export function autoInit');
      if (i < 0) return [];
      const corpo = t.slice(i);
      return [...new Set([...corpo.matchAll(/\bd\.(\w+)|\bdataset\.(\w+)/g)].map((m) => m[1] || m[2]))]
        .map((k) => 'data-' + k.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase())
        .filter((k) => k !== 'data-tuc-ready').sort();
    })(),
    eventos: [...new Set([...t.matchAll(/CustomEvent\('([^']+)'/g)].map((m) => m[1]))],
  };
}).sort((a, b) => a.nome.localeCompare(b.nome));

const css = readdirSync('src/styles/components')
  .map((f) => readFileSync(`src/styles/components/${f}`, 'utf8')).join('\n');
const classes = [...new Set([...css.matchAll(/\.(tuc-[\w-]+)/g)].map((m) => m[1]))].sort();
const tokens = [...new Set([...readFileSync('src/styles/core/tokens.css', 'utf8')
  .matchAll(/(--tuc-[\w-]+):/g)].map((m) => m[1]))].sort();

const linhas = [INICIO, '', 'Inventario extraido do codigo a cada build. Se algo nao esta aqui, nao existe.', ''];

for (const c of componentes) {
  linhas.push(`### ${c.classe ?? c.nome}`);
  if (c.seletores.length) linhas.push(`  marcacao   ${c.seletores.join('  ou  ')}`);
  linhas.push(`  em JS      new Tucano.${c.classe}(alvo, opcoes)`
    + (c.atalhos.length ? `   atalhos: ${c.atalhos.map((a) => `Tucano.${a}()`).join(', ')}` : ''));
  if (c.atributos.length) linhas.push(`  atributos  ${c.atributos.join(' ')}`);
  if (c.opcoes.length) {
    linhas.push('  opcoes');
    for (const o of c.opcoes) {
      // Comentario que continua na linha de baixo fica com reticencia, para a
      // IA nao ler meia frase como se fosse a regra inteira.
      const cortada = o.nota && !/[.)\]]$/.test(o.nota) && o.nota.split(' ').length > 6;
      const nota = o.nota ? `  — ${o.nota}${cortada ? '…' : ''}` : '';
      linhas.push(`    ${o.nome.padEnd(18)} = ${o.padrao}${nota}`);
    }
  }
  if (c.metodos.length) linhas.push(`  metodos    ${c.metodos.join(' ')}`);
  if (c.eventos.length) linhas.push(`  eventos    ${c.eventos.join(' ')}`);
  linhas.push('');
}

/*
 * As entradas do pacote. A IA precisa saber que existe um autoInit por
 * componente alem do init() geral — e do FORMATS, que lista as mascaras
 * prontas sem ela ter de adivinhar os nomes.
 */
const idx = readFileSync('src/js/index.js', 'utf8');
const exportados = [...new Set([...idx.matchAll(/export \{([^}]+)\}/g)]
  .flatMap((m) => m[1].split(',').map((x) => (x.split(' as ')[1] || x).trim())).filter(Boolean))];
const autos = exportados.filter((e) => e.startsWith('autoInit')).sort();
const outros = exportados.filter((e) => !e.startsWith('autoInit')).sort();
const formatos = Object.keys(JSON.parse(JSON.stringify(
  Object.fromEntries([...readFileSync('src/js/components/mask.js', 'utf8')
    .matchAll(/^  '?([\w-]+)'?: \{/gm)].map((m) => [m[1], 1])))));

linhas.push('### Entradas do pacote', '');
linhas.push('  Tucano.init(no)           inicializa todo data-tuc-* dentro de `no`');
linhas.push('  ' + autos.join(' '));
linhas.push('    → um por componente, quando voce quer inicializar so um tipo');
linhas.push('  ' + outros.join(' '));
linhas.push('  Tucano.mask / .dates / .color   modulos utilitarios (ver secao Utilitarios)');
linhas.push('');
linhas.push(`  FORMATS (mascaras prontas): ${formatos.join(' ')}`);
linhas.push('');
linhas.push('### Classes CSS', '');
linhas.push('Escritas por voce no template (as com __ sao internas, montadas pelo JS):');
linhas.push('  ' + classes.filter((c) => !c.includes('__')).join(' '));
linhas.push('');
linhas.push('### Tokens', '');
linhas.push('  ' + tokens.join(' '));
linhas.push('');

const txt = readFileSync('llms.txt', 'utf8');
const i = txt.indexOf(INICIO);
const j = txt.indexOf(FIM);
if (j < 0) { console.error('[referencia] marcador final nao encontrado em llms.txt'); process.exit(1); }
const antes = i >= 0 ? txt.slice(0, i) : txt.slice(0, j);
writeFileSync('llms.txt', antes + linhas.join('\n') + '\n' + txt.slice(j));

const nOpcoes = componentes.reduce((s, c) => s + c.opcoes.length, 0);
console.log(`referencia: ${componentes.length} componentes, ${nOpcoes} opcoes, ${classes.length} classes, ${tokens.length} tokens`);
