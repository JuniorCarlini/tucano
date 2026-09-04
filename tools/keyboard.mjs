#!/usr/bin/env node
/*
 * Teclado de verdade, pelo protocolo de depuracao do Chrome.
 *
 * Por que nao entra no `behavior.mjs`: la a pagina roda sozinha e o teste le o
 * resultado no fim. Evento sintetico (`new KeyboardEvent`) nao dispara acao
 * padrao — apertar Backspace assim nao apaga nada, o campo so recebe o aviso.
 * Entao tudo que a mascara faz com o cursor estava provado pelo lado errado:
 * o teste mandava o `input` que ele mesmo queria ver.
 *
 * `Input.dispatchKeyEvent` passa pela mesma porta que o teclado fisico: o
 * Chrome apaga o caractere, move o cursor e so entao dispara o `input` que a
 * mascara escuta. E o unico jeito de provar o caminho real.
 *
 * Sem dependencia: o Node ja traz WebSocket e fetch.
 */
import { spawn } from 'node:child_process';
import { writeFileSync, unlinkSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { exigirChrome, BANDEIRAS } from './chrome.mjs';

const CHROME = exigirChrome('keyboard');
const PORTA = 9000 + (process.pid % 1000);

const pagina = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<style>${readFileSync('dist/tucano.css', 'utf8')}</style></head><body>
<input id="cpf" data-tuc-mask="cpf">
<input id="doc" data-tuc-mask="cpf-cnpj">
<input id="valor" data-tuc-mask="real">
<input id="data" data-tuc-mask="date">
<script>${readFileSync('dist/tucano.js', 'utf8')}</script>
</body></html>`;

const arq = join(tmpdir(), `tucano-keyboard-${process.pid}.html`);
writeFileSync(arq, pagina);

const chrome = spawn(CHROME, [...BANDEIRAS, `--remote-debugging-port=${PORTA}`,
  '--user-data-dir=' + join(tmpdir(), `tucano-perfil-${process.pid}`), `file://${arq}`],
  { stdio: 'ignore' });

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

/* O Chrome demora alguns milissegundos para abrir a porta; sem isto o primeiro
   fetch falha com ECONNREFUSED e o teste culpa o produto. */
async function alvo() {
  for (let i = 0; i < 100; i++) {
    try {
      const lista = await fetch(`http://127.0.0.1:${PORTA}/json/list`).then((r) => r.json());
      const p = lista.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (p) return p.webSocketDebuggerUrl;
    } catch { /* ainda subindo */ }
    await espera(50);
  }
  throw new Error('o Chrome não abriu a porta de depuração');
}

const ws = new WebSocket(await alvo());
await new Promise((r, x) => { ws.onopen = r; ws.onerror = () => x(new Error('não conectou')); });

let proximo = 1;
const pendentes = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pendentes.has(m.id)) { pendentes.get(m.id)(m); pendentes.delete(m.id); }
};
function cdp(method, params = {}) {
  const id = proximo++;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((r, x) => pendentes.set(id, (m) => (m.error ? x(new Error(m.method + ': ' + m.error.message)) : r(m.result))));
}

async function avaliar(expressao) {
  const r = await cdp('Runtime.evaluate', { expression: expressao, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'erro na página');
  return r.result.value;
}

/* Teclas de edicao vao sem `text`: com texto o Chrome as trata como digitacao. */
const TECLAS = {
  Backspace: { code: 'Backspace', key: 'Backspace', vk: 8 },
  Delete: { code: 'Delete', key: 'Delete', vk: 46 },
};
async function tecla(nome, vezes = 1) {
  const t = TECLAS[nome];
  for (let i = 0; i < vezes; i++) {
    await cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...t, windowsVirtualKeyCode: t.vk, nativeVirtualKeyCode: t.vk });
    await cdp('Input.dispatchKeyEvent', { type: 'keyUp', ...t, windowsVirtualKeyCode: t.vk, nativeVirtualKeyCode: t.vk });
  }
}
async function digitar(texto) {
  for (const c of texto) {
    const vk = c.charCodeAt(0);
    await cdp('Input.dispatchKeyEvent', { type: 'keyDown', text: c, key: c, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
    await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: c, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
  }
}
/* Foca e posiciona o cursor sem passar por clique: o alvo e o texto, nao o pixel. */
const focar = (id, pos = null) => avaliar(`(() => {
  const el = document.getElementById('${id}');
  el.focus();
  const p = ${pos === null ? 'el.value.length' : pos};
  el.setSelectionRange(p, p);
  return el.value;
})()`);
/* Cada caso monta o proprio ponto de partida: encadear o estado de um no outro
   ja fez um caso falhar por causa do vizinho, e nao do produto. */
const partir = (id, valor) => avaliar(`document.getElementById('${id}')._tucano.setValue('${valor}')`);
const ler = (id) => avaliar(`(() => { const el = document.getElementById('${id}');
  return { valor: el.value, cursor: el.selectionStart }; })()`);

let falhas = 0;
async function caso(nome, fn) {
  try {
    const erro = await fn();
    if (erro) { console.log(`  FALHA  ${nome}\n         ${erro}`); falhas++; }
    else console.log(`  ok     ${nome}`);
  } catch (e) {
    console.log(`  FALHA  ${nome}\n         ${e.message}`); falhas++;
  }
}
const conferir = (r, valor, cursor) => (r.valor === valor && (cursor === undefined || r.cursor === cursor)
  ? null : `esperado "${valor}"${cursor === undefined ? '' : ` cursor ${cursor}`}, veio "${r.valor}" cursor ${r.cursor}`);

await avaliar('new Promise((r) => (document.readyState === "complete" ? r() : addEventListener("load", r)))');

await caso('digitar CPF põe os separadores enquanto se digita', async () => {
  await focar('cpf');
  await digitar('12345678901');
  return conferir(await ler('cpf'), '123.456.789-01', 14);
});

await caso('Backspace apaga dígito por dígito, e o cursor para antes do separador', async () => {
  await partir('cpf', '12345678901');
  await focar('cpf');
  await tecla('Backspace');
  const um = await ler('cpf');
  if (um.valor !== '123.456.789-0') return `depois de um Backspace veio "${um.valor}"`;
  // O separador seguinte aparece assim que e certo — por isso sobra o '-' com
  // nove digitos, e o cursor fica em 11, antes dele, e nao depois.
  await tecla('Backspace');
  return conferir(await ler('cpf'), '123.456.789-', 11);
});

await caso('Backspace em cima do separador que sobrou apaga o dígito', async () => {
  // Aqui a mascara recolocaria o '-' na hora e a tecla nao faria nada. O
  // _format percebe que a contagem de digitos nao mudou e tira o vizinho.
  await partir('cpf', '123456789');
  await focar('cpf');
  await tecla('Backspace');
  return conferir(await ler('cpf'), '123.456.78', 10);
});

await caso('Backspace em cima de separador apaga o dígito vizinho', async () => {
  await partir('cpf', '12345678901');
  await focar('cpf', 4);           // logo depois do primeiro ponto: "123."
  await tecla('Backspace');
  return conferir(await ler('cpf'), '124.567.890-1', 2);
});

await caso('Delete apaga para a frente sem travar no separador', async () => {
  await partir('cpf', '12345678901');
  await focar('cpf', 3);           // em cima do ponto de "123|.456"
  await tecla('Delete');
  return conferir(await ler('cpf'), '123.567.890-1');
});

await caso('digitar no meio empurra o resto e mantém o cursor no lugar certo', async () => {
  await partir('cpf', '12345678901');
  await focar('cpf', 3);
  await digitar('9');
  return conferir(await ler('cpf'), '123.945.678-90', 5);
});

await caso('cpf-cnpj troca de gabarito no 12º dígito, digitando', async () => {
  await focar('doc');
  await digitar('12345678901');
  const cpf = await ler('doc');
  if (cpf.valor !== '123.456.789-01') return `com 11 dígitos veio "${cpf.valor}"`;
  await digitar('2');
  const cnpj = await ler('doc');
  if (cnpj.valor !== '12.345.678/9012-') return `com 12 dígitos veio "${cnpj.valor}"`;
  await tecla('Backspace');
  return conferir(await ler('doc'), '123.456.789-01');
});

await caso('moeda enche da direita e o cursor fica no fim', async () => {
  await partir('valor', '');
  await focar('valor');
  await digitar('12345');
  const r = await ler('valor');
  return r.valor.endsWith('123,45') && r.cursor === r.valor.length
    ? null : `veio "${r.valor}" cursor ${r.cursor}`;
});

await caso('Backspace na moeda tira um dígito, não um caractere da máscara', async () => {
  await focar('valor');   // continua de onde o caso acima parou: 123,45
  await tecla('Backspace');
  const r = await ler('valor');
  return r.valor.endsWith('12,34') ? null : `veio "${r.valor}"`;
});

await caso('data recusa dia impossível enquanto se digita', async () => {
  await focar('data');
  await digitar('99999999');
  const r = await ler('data');
  return /^\d{2}\/\d{2}\/\d{4}$/.test(r.valor) ? null : `veio "${r.valor}"`;
});

ws.close();
chrome.kill();
unlinkSync(arq);
console.log(falhas ? `\n${falhas} falha(s) no teclado` : '\n10 caminhos de teclado verificados');
process.exit(falhas ? 1 : 0);
