/*
 * Tamanho em gzip que nao depende da versao do Node.
 *
 * O gzip do node:zlib muda de uma versao para outra: o mesmo tucano.min.js dava
 * 40.957 bytes no Node 26 e 41.125 no Node 24. O build carimba esses numeros no
 * README e no site, e o CI confere que os arquivos gerados batem com o commit —
 * entao um numero perto do arredondamento (39,7 contra 39,8 KB) derrubou a
 * publicacao da 0.34.0 so porque a maquina e o CI rodavam Nodes diferentes.
 *
 * O fflate e gzip em JavaScript puro, com a versao fixa no package.json: o
 * mesmo arquivo da o mesmo tamanho em qualquer Node e em qualquer sistema. Ele
 * comprime um pouco menos que o zlib, entao o numero anunciado sai alguns por
 * cento acima do que um servidor entrega — errar para cima, nunca para baixo.
 */
import { gzipSync } from 'fflate';

export const gzipBytes = (data) => gzipSync(data, { level: 9, mtime: 0 }).length;
