/*
 * Datas: interpretar o que a pessoa digitou e devolver o que o servidor espera.
 * O erro tipico aqui e silencioso — um dia a menos, um mes trocado — e so
 * aparece no banco.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  addDays, addMonths, addYears, buildMonthGrid, clampDate, compareDay, daysInMonth,
  endOfMonth, format, isBetween, isMonthFirst, isSameDay, isSameMonth, isValid,
  localeDatePattern, parseISO, parseUserInput, startOfDay, startOfMonth, toISODate,
  toISODateTime, withTime,
} from '../src/js/core/dates.js';

const d = (a, m, dia, h = 0, min = 0) => new Date(a, m - 1, dia, h, min);

test('startOfDay zera a hora sem mudar o dia', () => {
  const x = startOfDay(d(2026, 9, 7, 15, 30));
  assert.equal(x.getHours(), 0);
  assert.equal(x.getDate(), 7);
});

test('isValid recusa data invalida', () => {
  assert.equal(isValid(d(2026, 9, 7)), true);
  assert.equal(isValid(new Date('nada')), false);
});

test('addMonths nao vaza para o mes seguinte quando o dia nao existe', () => {
  // 31 de janeiro + 1 mes: fevereiro nao tem 31. Sem cuidado, o JS entrega 3/3.
  assert.equal(toISODate(addMonths(d(2026, 1, 31), 1)), '2026-02-28');
});

test('addDays e addYears atravessam a virada', () => {
  assert.equal(toISODate(addDays(d(2026, 12, 31), 1)), '2027-01-01');
  assert.equal(toISODate(addYears(d(2024, 2, 29), 1)), '2025-02-28', 'bissexto para comum');
});

test('daysInMonth conhece fevereiro bissexto', () => {
  assert.equal(daysInMonth(2024, 1), 29);
  assert.equal(daysInMonth(2026, 1), 28);
  assert.equal(daysInMonth(2026, 0), 31);
});

test('startOfMonth e endOfMonth', () => {
  assert.equal(toISODate(startOfMonth(d(2026, 9, 17))), '2026-09-01');
  assert.equal(toISODate(endOfMonth(d(2026, 9, 17))), '2026-09-30');
});

test('compareDay ignora a hora', () => {
  assert.equal(compareDay(d(2026, 9, 7, 23), d(2026, 9, 7, 1)), 0);
  assert.ok(compareDay(d(2026, 9, 8), d(2026, 9, 7)) > 0);
});

test('isSameDay, isSameMonth e isBetween', () => {
  assert.equal(isSameDay(d(2026, 9, 7, 8), d(2026, 9, 7, 20)), true);
  assert.equal(isSameMonth(d(2026, 9, 1), d(2026, 9, 30)), true);
  assert.equal(isBetween(d(2026, 9, 7), d(2026, 9, 1), d(2026, 9, 30)), true);
  assert.equal(isBetween(d(2026, 10, 1), d(2026, 9, 1), d(2026, 9, 30)), false);
});

test('clampDate prende no minimo e no maximo', () => {
  const min = d(2026, 9, 1), max = d(2026, 9, 30);
  assert.equal(toISODate(clampDate(d(2026, 8, 1), min, max)), '2026-09-01');
  assert.equal(toISODate(clampDate(d(2026, 10, 1), min, max)), '2026-09-30');
  assert.equal(toISODate(clampDate(d(2026, 9, 15), min, max)), '2026-09-15');
});

test('withTime cola a hora de um Date no dia de outro', () => {
  const x = withTime(d(2026, 9, 7), d(2000, 1, 1, 14, 30));
  assert.equal(x.getDate(), 7);
  assert.equal(x.getHours(), 14);
  assert.equal(x.getMinutes(), 30);
});

test('buildMonthGrid entrega semanas completas', () => {
  const grade = buildMonthGrid(2026, 8, 0);      // setembro/2026
  assert.equal(grade.length % 7, 0, 'multiplo de 7');
  assert.ok(grade.some((c) => c.date.getMonth() === 8), 'tem dias do proprio mes');
  assert.ok(grade.some((c) => c.outside), 'tem dias de fora, para fechar a semana');
});

test('toISODate e toISODateTime usam a hora local, nao UTC', () => {
  // Converter por UTC muda o dia em quem esta a oeste de Greenwich — o Brasil
  // inteiro. Este e o erro classico do toISOString().
  assert.equal(toISODate(d(2026, 9, 7, 23, 59)), '2026-09-07');
  assert.equal(toISODate(d(2026, 9, 7, 0, 1)), '2026-09-07');
  assert.match(toISODateTime(d(2026, 9, 7, 14, 30)), /^2026-09-07T14:30/);
});

test('parseISO le o que toISODate escreveu', () => {
  assert.equal(toISODate(parseISO('2026-09-07')), '2026-09-07');
  assert.equal(parseISO('nada'), null);
});

test('parseUserInput entende o que a pessoa digita em pt-BR', () => {
  assert.equal(toISODate(parseUserInput('07/09/2026', 'pt-BR')), '2026-09-07');
  assert.equal(toISODate(parseUserInput('7/9/26', 'pt-BR')), '2026-09-07', 'ano de dois digitos');
  assert.equal(parseUserInput('99/99/9999', 'pt-BR'), null, 'data impossivel');
});

test('parseUserInput respeita a ordem do locale', () => {
  // 03/04 e 3 de abril no Brasil e 4 de marco nos EUA.
  assert.equal(toISODate(parseUserInput('03/04/2026', 'pt-BR')), '2026-04-03');
  assert.equal(toISODate(parseUserInput('03/04/2026', 'en-US')), '2026-03-04');
});

test('isMonthFirst e localeDatePattern seguem o locale', () => {
  assert.equal(isMonthFirst('pt-BR'), false);
  assert.equal(isMonthFirst('en-US'), true);
  assert.equal(localeDatePattern('pt-BR'), 'dd/MM/yyyy');
  assert.equal(localeDatePattern('en-US'), 'MM/dd/yyyy');
});

test('format escreve o padrao pedido', () => {
  assert.equal(format(d(2026, 9, 7), 'dd/MM/yyyy'), '07/09/2026');
  assert.equal(format(d(2026, 9, 7, 14, 30), 'dd/MM/yyyy HH:mm'), '07/09/2026 14:30');
});
