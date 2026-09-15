/*
 * Utilitarios do upload que nao precisam de DOM: tamanho, accept e origem.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchesAccept, parseSize, sameOrigin } from '../src/js/core/files.js';

test('parseSize le as grafias comuns, em base 1024', () => {
  assert.equal(parseSize(1048576), 1048576);
  assert.equal(parseSize('500'), 500);
  assert.equal(parseSize('500b'), 500);
  assert.equal(parseSize('5mb'), 5 * 1024 ** 2);
  assert.equal(parseSize('5 MB'), 5 * 1024 ** 2);
  assert.equal(parseSize('1,5mb'), Math.round(1.5 * 1024 ** 2));
  assert.equal(parseSize('500kb'), 500 * 1024);
  assert.equal(parseSize('1gb'), 1024 ** 3);
});

test('parseSize aceita a letra sozinha e MiB — "2M" virava sem limite', () => {
  assert.equal(parseSize('2M'), 2 * 1024 ** 2);
  assert.equal(parseSize('300k'), 300 * 1024);
  assert.equal(parseSize('1 MiB'), 1024 ** 2);
});

test('parseSize devolve null para o que nao le', () => {
  assert.equal(parseSize('muito'), null);
  assert.equal(parseSize('5tb'), null);
  assert.equal(parseSize(''), null);
  assert.equal(parseSize(null), null);
});

const file = (name, type = '') => ({ name, type });

test('accept por extensao ignora caixa e MIME vazio', () => {
  assert.equal(matchesAccept(file('dados.csv'), '.csv'), true);
  assert.equal(matchesAccept(file('FOTO.JPG', 'image/jpeg'), '.jpg'), true);
  assert.equal(matchesAccept(file('x.pdf'), '.PDF'), true);
  assert.equal(matchesAccept(file('README'), '.txt'), false);
  assert.equal(matchesAccept(file('nota.txt.exe'), '.txt'), false);
});

test('accept por familia e tipo exato, com espacos na lista', () => {
  assert.equal(matchesAccept(file('a.png', 'image/png'), 'image/*'), true);
  assert.equal(matchesAccept(file('a.png', 'image/png'), 'image/png, .pdf'), true);
  assert.equal(matchesAccept(file('dados.csv'), 'text/csv'), false);
  assert.equal(matchesAccept(file('x'), ''), true);
});

test('sameOrigin: relativa e mesma origem sim, outro host ou porta nao', () => {
  const base = 'https://app.exemplo.com/form/';
  assert.equal(sameOrigin('/upload/', base), true);
  assert.equal(sameOrigin('upload/', base), true);
  assert.equal(sameOrigin('https://app.exemplo.com/x', base), true);
  assert.equal(sameOrigin('https://s3.amazonaws.com/bucket', base), false);
  assert.equal(sameOrigin('https://app.exemplo.com:8443/x', base), false);
  assert.equal(sameOrigin('//cdn.exemplo.com/x', base), false);
});
