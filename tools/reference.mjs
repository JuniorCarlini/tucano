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

const INICIO = '## Referência completa (gerada pelo build)';
const FIM = '## Ao gerar código que usa Tucano';

import { componentes } from './api.mjs';


const css = readdirSync('src/styles/components')
  .map((f) => readFileSync(`src/styles/components/${f}`, 'utf8')).join('\n');
const classes = [...new Set([...css.matchAll(/\.(tuc-[\w-]+)/g)].map((m) => m[1]))].sort();
/* Ganchos que o JS monta e o CSS nao estiliza — invisiveis para quem so le o
   CSS, e por isso listados a mao. A mesma lista guarda tools/consistency.mjs. */
const GANCHOS = ['tuc-table__sortable', 'tuc-table__check', 'tuc-toast__action', 'tuc-tip__text', 'tuc-pagination__edge'];
const tokens = [...new Set([...readFileSync('src/styles/core/tokens.css', 'utf8')
  .matchAll(/(--tuc-[\w-]+):/g)].map((m) => m[1]))].sort();

const linhas = [INICIO, '', 'Inventario extraido do codigo a cada build. Se algo nao esta aqui, nao existe.', ''];

for (const c of componentes) {
  linhas.push(`### ${c.classe ?? c.nome}`);
  if (c.seletores.length) linhas.push(`  marcacao   ${c.seletores.join('  ou  ')}`);
  linhas.push(`  em JS      new Tucano.${c.classe}(${c.argumentos})`
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
linhas.push('  Tucano.mask / .dates / .color   modulos utilitarios (ver seção Utilitários)');
linhas.push('');
linhas.push(`  FORMATS (mascaras prontas): ${formatos.join(' ')}`);
linhas.push('');
linhas.push('### Classes CSS', '');
linhas.push('Escritas por voce no template (as com __ sao internas, montadas pelo JS):');
linhas.push('  ' + classes.filter((c) => !c.includes('__')).join(' '));
linhas.push('');
linhas.push('Montadas pelo JS dentro do componente — nao escreva no template, mas');
linhas.push('sao nomes estaveis para o seu proprio CSS:');
linhas.push('  ' + [...new Set(classes.filter((c) => c.includes('__')).concat(GANCHOS))].sort().join(' '));
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
