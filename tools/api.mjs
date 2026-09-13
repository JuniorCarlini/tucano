/*
 * Inventario da API, extraido do codigo.
 *
 * Mora aqui, e nao dentro de reference.mjs, porque dois lugares precisam dele: a
 * referencia do llms.txt e as tabelas de opcoes das paginas do site. Extraido
 * duas vezes, os dois inventarios iam divergir na primeira opcao nova — e o
 * motivo de gerar do codigo e justamente nao ter duas fontes.
 */
import { readFileSync, readdirSync } from 'node:fs';

/* Metodos que vem da classe base, invisiveis no arquivo do componente. */
const HERDADOS = { modal: ['open', 'close', 'content'], drawer: ['open', 'close', 'content'] };

const IGNORAR = new Set(['constructor', 'if', 'for', 'while', 'switch', 'catch', 'return', 'get', 'set']);

export const componentes = readdirSync('src/js/components').filter((f) => f.endsWith('.js')).map((f) => {
  const nome = f.replace('.js', '');
  const t = readFileSync(`src/js/components/${f}`, 'utf8');
  const d = t.match(/const DEFAULTS = \{([\s\S]*?)\n\};/);
  return {
    nome,
    classe: (t.match(/^export class (\w+)/m) || [])[1],
    // Toast, Modal, Gaveta e Paginacao nao recebem alvo: so as opcoes.
    argumentos: /^\s{2}constructor\(\s*options\b/m.test(t) ? 'opcoes' : 'alvo, opcoes',
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
