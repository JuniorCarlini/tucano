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

const START = '## Referência completa (gerada pelo build)';
const END = '## Ao gerar código que usa Tucano';

import { components } from './api.mjs';


const css = readdirSync('src/styles/components')
  .map((f) => readFileSync(`src/styles/components/${f}`, 'utf8')).join('\n');
const classes = [...new Set([...css.matchAll(/\.(tuc-[\w-]+)/g)].map((m) => m[1]))].sort();
/* Ganchos que o JS monta e o CSS nao estiliza — invisiveis para quem so le o
   CSS, e por isso listados a mao. A mesma lista guarda tools/consistency.mjs. */
const HOOKS = ['tuc-table__sortable', 'tuc-table__check', 'tuc-toast__action', 'tuc-tip__text', 'tuc-pagination__edge'];
const tokens = [...new Set([...readFileSync('src/styles/core/tokens.css', 'utf8')
  .matchAll(/(--tuc-[\w-]+):/g)].map((m) => m[1]))].sort();

const lines = [START, '', 'Inventario extraido do codigo a cada build. Se algo nao esta aqui, nao existe.', ''];

for (const c of components) {
  lines.push(`### ${c.className ?? c.name}`);
  if (c.selectors.length) lines.push(`  marcacao   ${c.selectors.join('  ou  ')}`);
  lines.push(`  em JS      new Tucano.${c.className}(${c.args})`
    + (c.shortcuts.length ? `   atalhos: ${c.shortcuts.map((a) => `Tucano.${a}()`).join(', ')}` : ''));
  if (c.attributes.length) lines.push(`  atributos  ${c.attributes.join(' ')}`);
  if (c.options.length) {
    lines.push('  opcoes');
    for (const o of c.options) {
      // Comentario que continua na linha de baixo fica com reticencia, para a
      // IA nao ler meia frase como se fosse a regra inteira.
      const truncated = o.note && !/[.)\]]$/.test(o.note) && o.note.split(' ').length > 6;
      const note = o.note ? `  — ${o.note}${truncated ? '…' : ''}` : '';
      lines.push(`    ${o.name.padEnd(18)} = ${o.defaultValue}${note}`);
    }
  }
  if (c.methods.length) lines.push(`  metodos    ${c.methods.join(' ')}`);
  if (c.events.length) lines.push(`  eventos    ${c.events.join(' ')}`);
  lines.push('');
}

/*
 * As entradas do pacote. A IA precisa saber que existe um autoInit por
 * componente alem do init() geral — e do FORMATS, que lista as mascaras
 * prontas sem ela ter de adivinhar os nomes.
 */
const idx = readFileSync('src/js/index.js', 'utf8');
const exported = [...new Set([...idx.matchAll(/export \{([^}]+)\}/g)]
  .flatMap((m) => m[1].split(',').map((x) => (x.split(' as ')[1] || x).trim())).filter(Boolean))];
const autos = exported.filter((e) => e.startsWith('autoInit')).sort();
const others = exported.filter((e) => !e.startsWith('autoInit')).sort();
const formats = Object.keys(JSON.parse(JSON.stringify(
  Object.fromEntries([...readFileSync('src/js/components/mask.js', 'utf8')
    .matchAll(/^  '?([\w-]+)'?: \{/gm)].map((m) => [m[1], 1])))));

lines.push('### Entradas do pacote', '');
lines.push('  Tucano.init(node)         inicializa todo data-tuc-* dentro de `node`');
lines.push('  ' + autos.join(' '));
lines.push('    → um por componente, quando voce quer inicializar so um tipo');
lines.push('  ' + others.join(' '));
lines.push('  Tucano.mask / .dates / .color   modulos utilitarios (ver seção Utilitários)');
lines.push('');
lines.push(`  FORMATS (mascaras prontas): ${formats.join(' ')}`);
lines.push('');

/*
 * Os textos da interface, com a chave e o padrao em portugues. Importados do
 * proprio modulo, e nao lidos por expressao: sao dados, e a funcao de plural
 * precisa aparecer inteira para a IA saber o que ela recebe.
 */
const { getTexts } = await import('../src/js/core/texts.js');
lines.push('### Textos (Tucano.setTexts)', '');
lines.push('  Tucano.setTexts({ grupo: { chave: texto } }) antes de os componentes montarem;');
lines.push('  mescla chave a chave dentro do grupo. Tucano.getTexts() devolve uma copia.');
lines.push('  A opcao da instancia (emptyText, prevText, texts do upload...) vence o texto global.');
for (const [group, values] of Object.entries(getTexts())) {
  lines.push(`  ${group}`);
  for (const [key, value] of Object.entries(values)) {
    lines.push(`    ${key.padEnd(18)} = ${typeof value === 'function' ? String(value) : `'${value}'`}`);
  }
}
lines.push('');
lines.push('### Classes CSS', '');
lines.push('Escritas por voce no template (as com __ sao internas, montadas pelo JS):');
lines.push('  ' + classes.filter((c) => !c.includes('__')).join(' '));
lines.push('');
lines.push('Montadas pelo JS dentro do componente — nao escreva no template, mas');
lines.push('sao nomes estaveis para o seu proprio CSS:');
lines.push('  ' + [...new Set(classes.filter((c) => c.includes('__')).concat(HOOKS))].sort().join(' '));
lines.push('');
lines.push('### Tokens', '');
lines.push('  ' + tokens.join(' '));
lines.push('');

const txt = readFileSync('llms.txt', 'utf8');
const i = txt.indexOf(START);
const j = txt.indexOf(END);
if (j < 0) { console.error('[referencia] marcador final nao encontrado em llms.txt'); process.exit(1); }
const before = i >= 0 ? txt.slice(0, i) : txt.slice(0, j);
writeFileSync('llms.txt', before + lines.join('\n') + '\n' + txt.slice(j));

const optionCount = components.reduce((s, c) => s + c.options.length, 0);
console.log(`referencia: ${components.length} componentes, ${optionCount} opcoes, ${classes.length} classes, ${tokens.length} tokens`);
