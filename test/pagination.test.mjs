/*
 * A janela de paginas: quais numeros aparecem quando nao cabe tudo.
 * E pura, entao da para provar em vez de olhar.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pageWindow } from '../src/js/components/pagination.js';

const j = (...a) => pageWindow(...a).map((n) => n ?? '…').join(' ');

test('cabendo tudo, mostra tudo sem reticencia', () => {
  assert.equal(j(3, 5, { around: 1, edges: 1 }), '1 2 3 4 5');
});

test('muitas paginas: pontas, vizinhanca e reticencia dos dois lados', () => {
  assert.equal(j(10, 20, { around: 1, edges: 1 }), '1 … 9 10 11 … 20');
});

test('perto do comeco e do fim, a reticencia so aparece de um lado', () => {
  assert.equal(j(2, 20, { around: 1, edges: 1 }), '1 2 3 … 20');
  assert.equal(j(19, 20, { around: 1, edges: 1 }), '1 … 18 19 20');
});

test('buraco de uma pagina vira o numero, nao reticencia', () => {
  // Mostrar "…" no lugar de um unico numero ocupa o mesmo espaco e tira um
  // destino de clique.
  assert.equal(j(4, 7, { around: 1, edges: 1 }), '1 2 3 4 5 6 7');
  assert.ok(!j(5, 9, { around: 1, edges: 1 }).includes('… …'), 'nunca duas seguidas');
});

test('around e edges mudam a largura da janela', () => {
  assert.equal(j(10, 20, { around: 2, edges: 1 }), '1 … 8 9 10 11 12 … 20');
  assert.equal(j(10, 20, { around: 1, edges: 2 }), '1 2 … 9 10 11 … 19 20');
});

test('uma pagina so, e bordas', () => {
  assert.equal(j(1, 1, { around: 1, edges: 1 }), '1');
  assert.equal(j(1, 2, { around: 1, edges: 1 }), '1 2');
});

test('nunca repete numero', () => {
  for (const p of [1, 2, 5, 10, 19, 20]) {
    const nums = pageWindow(p, 20, { around: 2, edges: 2 }).filter(Boolean);
    assert.equal(new Set(nums).size, nums.length, `pagina ${p}: ${nums}`);
  }
});

test('sempre em ordem crescente', () => {
  const nums = pageWindow(10, 40, { around: 2, edges: 2 }).filter(Boolean);
  assert.deepEqual(nums, [...nums].sort((a, b) => a - b));
});
