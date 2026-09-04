/*
 * Cor: conversoes que o color picker faz a cada movimento do ponteiro.
 * Erro aqui aparece como cor "quase certa", que ninguem percebe olhando.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  clamp, formatColor, hsvToHsl, hsvToRgb, isDark, luminance, parseColor, rgbToHex, rgbToHsv,
} from '../src/js/core/color.js';

test('clamp prende nos limites', () => {
  assert.equal(clamp(5, 0, 1), 1);
  assert.equal(clamp(-5, 0, 1), 0);
  assert.equal(clamp(0.5, 0, 1), 0.5);
});

test('parseColor entende hex de 3, 6 e 8 digitos', () => {
  assert.deepEqual(parseColor('#fff').v, 1);
  assert.equal(Math.round(parseColor('#000').v), 0);
  assert.equal(parseColor('#4f46e5a0').a < 1, true, 'os dois ultimos digitos sao a opacidade');
});

test('parseColor entende rgb() e hsl()', () => {
  assert.ok(parseColor('rgb(79, 70, 229)'), 'rgb');
  assert.ok(parseColor('hsl(243, 75%, 59%)'), 'hsl');
  assert.equal(parseColor('nao-e-cor'), null);
});

test('ida e volta hex → hsv → hex nao perde a cor', () => {
  for (const hex of ['#4f46e5', '#16a34a', '#ffffff', '#000000']) {
    assert.equal(rgbToHex(hsvToRgb(parseColor(hex))).toLowerCase(), hex);
  }
});

test('rgbToHsv e hsvToRgb sao inversas', () => {
  const rgb = { r: 79, g: 70, b: 229 };
  const volta = hsvToRgb(rgbToHsv(rgb));
  for (const c of ['r', 'g', 'b']) {
    assert.ok(Math.abs(volta[c] - rgb[c]) <= 1, `${c}: ${volta[c]} ≈ ${rgb[c]}`);
  }
});

test('formatColor devolve cada formato pedido', () => {
  const c = parseColor('#4f46e5');
  assert.equal(formatColor(c, 'hex'), '#4f46e5');
  assert.match(formatColor(c, 'rgb'), /^rgba?\(/);
  assert.match(formatColor(c, 'hsl'), /^hsla?\(/);
});

test('luminance separa claro de escuro', () => {
  assert.ok(luminance({ r: 255, g: 255, b: 255 }) > 0.9);
  assert.ok(luminance({ r: 0, g: 0, b: 0 }) < 0.1);
});

test('isDark aceita string e objeto, e nao quebra com lixo', () => {
  // Aceitar string foi consertado depois de a documentacao ensinar o uso que
  // quebrava: quem escolhe texto sobre uma cor tem a string na mao.
  assert.equal(isDark('#4f46e5'), true);
  assert.equal(isDark('#fde047'), false);
  assert.equal(isDark(parseColor('#4f46e5')), true);
  assert.equal(isDark('nao-e-cor'), false);
});

test('hsvToHsl mantem o matiz', () => {
  const hsv = parseColor('#16a34a');
  assert.ok(Math.abs(hsvToHsl(hsv).h - hsv.h) < 1);
});
