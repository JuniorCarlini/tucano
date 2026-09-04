/*
 * Mascara: as funcoes puras que decidem o que o usuario ve enquanto digita.
 *
 * Este e o modulo com mais regra de negocio brasileira do pacote — CPF, CNPJ,
 * moeda — e ate hoje nao tinha um teste. Os casos daqui sao os que ja quebraram
 * ou os que a documentacao promete.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  apply, capacity, clear, cursorAfter, isPlaceholder, maskEmail, maskMiddle,
  pickTemplate, placeholderFromTemplate, applyCurrency, validateCNPJ,
  validateCPF, validateCpfCnpj, format,
} from '../src/js/core/mask.js';

test('gabarito: # digito, A letra, * ambos', () => {
  assert.equal(isPlaceholder('#'), true);
  assert.equal(isPlaceholder('A'), true);
  assert.equal(isPlaceholder('*'), true);
  assert.equal(isPlaceholder('-'), false);
});

test('apply distribui os digitos e insere os separadores', () => {
  assert.equal(apply('12345678901', '###.###.###-##'), '123.456.789-01');
  assert.equal(apply('07092026', '##/##/####'), '07/09/2026');
});

test('apply nao inventa separador antes de o grupo fechar', () => {
  // O separador so entra quando o grupo anterior esta completo, senao o campo
  // "anda sozinho" e o cursor pula.
  assert.equal(apply('12', '###.###'), '12');
  assert.equal(apply('123', '###.###'), '123.');
});

test('clear tira o que veio do gabarito e deixa o cru', () => {
  assert.equal(clear('123.456.789-01', '###.###.###-##'), '12345678901');
  assert.equal(clear('(11) 98765-4321', '(##) #####-####'), '11987654321');
});

test('capacity conta quantos caracteres o gabarito aceita', () => {
  assert.equal(capacity('###.###.###-##'), 11);
  assert.equal(capacity('##/##/####'), 8);
});

test('pickTemplate escolhe pelo tamanho — e essa e a base do CPF/CNPJ', () => {
  const dois = ['###.###.###-##', '**.***.***/****-##'];
  assert.equal(pickTemplate('12345678901', dois), dois[0]);
  assert.equal(pickTemplate('12345678000199', dois), dois[1]);
});

test('placeholderFromTemplate: com dois gabaritos vale o primeiro', () => {
  assert.equal(placeholderFromTemplate('###.###.###-##'), '000.000.000-00');
  assert.equal(placeholderFromTemplate(['###.###.###-##', '**.***.***/****-##']), '000.000.000-00');
  assert.equal(placeholderFromTemplate(undefined), '');
});

test('cursorAfter aponta depois do n-esimo digito, e nao do n-esimo caractere', () => {
  // '123.456' — depois do 3o digito o cursor fica em 3, e nao em 4 (o ponto).
  assert.equal(cursorAfter('123.456', 3), 3);
  assert.equal(cursorAfter('123.456', 4), 5);
});

test('CPF valido e invalido', () => {
  assert.equal(validateCPF('529.982.247-25'), true);
  assert.equal(validateCPF('123.456.789-01'), false);
  assert.equal(validateCPF('111.111.111-11'), false, 'digito repetido nao passa');
});

test('CNPJ valido e invalido, inclusive o formato alfanumerico novo', () => {
  assert.equal(validateCNPJ('11.222.333/0001-81'), true);
  assert.equal(validateCNPJ('11.222.333/0001-00'), false);
});

test('validateCpfCnpj aceita os dois e recusa o que nao e nenhum', () => {
  assert.equal(validateCpfCnpj('529.982.247-25'), true);
  assert.equal(validateCpfCnpj('11.222.333/0001-81'), true);
  assert.equal(validateCpfCnpj('123'), false);
});

test('moeda formata a partir dos digitos, da direita para a esquerda', () => {
  assert.equal(applyCurrency('12345', { currency: 'BRL' }).replace(/ /g, ' '), 'R$ 123,45');
  assert.equal(applyCurrency('5', { currency: 'BRL' }).replace(/ /g, ' '), 'R$ 0,05');
  assert.equal(applyCurrency('', { currency: 'BRL' }), '');
});

test('maskMiddle esconde o meio e preserva o fim', () => {
  const r = maskMiddle('12345678901', 2, 'fim');
  assert.ok(r.endsWith('01'), `terminou com 01: ${r}`);
  assert.ok(!r.includes('345'), 'o meio nao aparece');
});

test('maskEmail preserva o dominio — e o que permite reconhecer a conta', () => {
  const r = maskEmail('contato@empresa.com.br');
  assert.ok(r.endsWith('@empresa.com.br'), r);
  assert.ok(r.startsWith('c'), r);
  assert.ok(!r.includes('ontato'), 'o usuario fica escondido');
});

test('format aplica um preset pelo nome', () => {
  assert.equal(format('12345678901', 'cpf'), '123.456.789-01');
});
