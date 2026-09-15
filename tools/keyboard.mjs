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
import { requireChrome, FLAGS } from './chrome.mjs';

const CHROME = requireChrome('keyboard');
const PORT = 9000 + (process.pid % 1000);

const page = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<style>${readFileSync('dist/tucano.css', 'utf8')}</style></head><body>
<input id="cpf" data-tuc-mask="cpf">
<input id="doc" data-tuc-mask="cpf-cnpj">
<input id="amount" data-tuc-mask="brl">
<input id="date" data-tuc-mask="date">
<input id="dt" data-tuc-datepicker>
<select id="state" data-tuc-select><option value="">Selecione...</option><option value="SP">São Paulo</option><option value="RJ">Rio de Janeiro</option></select>
<select id="noEmpty" data-tuc-select><option value="UN">Unidade</option><option value="PC">Peça</option></select>
<select id="fixed" data-tuc-select data-clearable="false"><option value="SP">São Paulo</option><option value="RJ">Rio de Janeiro</option></select>
<select id="searchable" data-tuc-select><option value="AC">Acre</option><option value="BA">Bahia</option><option value="MG">Minas Gerais</option><option value="PR">Paraná</option><option value="SC">Santa Catarina</option><option value="SP">São Paulo</option></select>
<form id="resetForm"><select id="resetState" data-tuc-select><option value="SP" selected>São Paulo</option><option value="RJ">Rio de Janeiro</option></select></form>
<input id="revealPassword" type="password" name="token" data-tuc-reveal>
<input id="revealToken" type="text" name="api_key" data-tuc-reveal="all">
<textarea id="ked" data-tuc-editor></textarea>
<input id="color" data-tuc-color value="#4f46e5">
<dialog class="tuc-modal" id="kmodal"><div class="tuc-modal__panel">
  <select id="mstate" data-tuc-select><option value="SP">São Paulo</option><option value="RJ">Rio de Janeiro</option></select>
  <input id="mdate" data-tuc-datepicker>
  <input id="mcolor" data-tuc-color value="#4f46e5">
</div></dialog>
<div class="tuc-tabs" data-tuc-tabs id="tabs"><div class="tuc-tabs__list">
  <button class="tuc-tabs__tab" aria-selected="true">A</button><button class="tuc-tabs__tab">B</button>
  <button class="tuc-tabs__tab" disabled>C</button><button class="tuc-tabs__tab">D</button></div>
  <div class="tuc-tabs__panel">a</div><div class="tuc-tabs__panel" hidden>b</div>
  <div class="tuc-tabs__panel" hidden>c</div><div class="tuc-tabs__panel" hidden>d</div></div>
<script>${readFileSync('dist/tucano.js', 'utf8')}</script>
</body></html>`;

const file = join(tmpdir(), `tucano-keyboard-${process.pid}.html`);
writeFileSync(file, page);

const chrome = spawn(CHROME, [...FLAGS, `--remote-debugging-port=${PORT}`,
  '--user-data-dir=' + join(tmpdir(), `tucano-profile-${process.pid}`), `file://${file}`],
  { stdio: 'ignore' });

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* O Chrome demora alguns milissegundos para abrir a porta; sem isto o primeiro
   fetch falha com ECONNREFUSED e o teste culpa o produto. */
async function debuggerUrl() {
  for (let i = 0; i < 100; i++) {
    try {
      const list = await fetch(`http://127.0.0.1:${PORT}/json/list`).then((r) => r.json());
      const p = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (p) return p.webSocketDebuggerUrl;
    } catch { /* ainda subindo */ }
    await wait(50);
  }
  throw new Error('o Chrome não abriu a porta de depuração');
}

const ws = new WebSocket(await debuggerUrl());
await new Promise((r, x) => { ws.onopen = r; ws.onerror = () => x(new Error('não conectou')); });

let nextId = 1;
const pending = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
};
function cdp(method, params = {}) {
  const id = nextId++;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((r, x) => pending.set(id, (m) => (m.error ? x(new Error(m.method + ': ' + m.error.message)) : r(m.result))));
}

async function evaluate(expression) {
  const r = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'erro na página');
  return r.result.value;
}

/* Teclas de edicao vao sem `text`: com texto o Chrome as trata como digitacao. */
const KEYS = {
  Backspace: { code: 'Backspace', key: 'Backspace', vk: 8 },
  Delete: { code: 'Delete', key: 'Delete', vk: 46 },
  ArrowRight: { code: 'ArrowRight', key: 'ArrowRight', vk: 39 },
  ArrowLeft: { code: 'ArrowLeft', key: 'ArrowLeft', vk: 37 },
  Home: { code: 'Home', key: 'Home', vk: 36 },
  End: { code: 'End', key: 'End', vk: 35 },
  ArrowDown: { code: 'ArrowDown', key: 'ArrowDown', vk: 40 },
  Escape: { code: 'Escape', key: 'Escape', vk: 27 },
};
async function press(name, times = 1) {
  const t = KEYS[name];
  for (let i = 0; i < times; i++) {
    await cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...t, windowsVirtualKeyCode: t.vk, nativeVirtualKeyCode: t.vk });
    await cdp('Input.dispatchKeyEvent', { type: 'keyUp', ...t, windowsVirtualKeyCode: t.vk, nativeVirtualKeyCode: t.vk });
  }
}
async function typeText(text) {
  for (const c of text) {
    const vk = c.charCodeAt(0);
    await cdp('Input.dispatchKeyEvent', { type: 'keyDown', text: c, key: c, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
    await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: c, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
  }
}
/* Foca e posiciona o cursor sem passar por clique: o alvo e o texto, nao o pixel. */
const focusAt = (id, pos = null) => evaluate(`(() => {
  const el = document.getElementById('${id}');
  el.focus();
  const p = ${pos === null ? 'el.value.length' : pos};
  el.setSelectionRange(p, p);
  return el.value;
})()`);
/* Cada caso monta o proprio ponto de partida: encadear o estado de um no outro
   ja fez um caso falhar por causa do vizinho, e nao do produto. */
const startFrom = (id, value) => evaluate(`document.getElementById('${id}')._tucano.setValue('${value}')`);
const readField = (id) => evaluate(`(() => { const el = document.getElementById('${id}');
  return { value: el.value, cursor: el.selectionStart }; })()`);

let failures = 0;
async function testCase(name, fn) {
  try {
    const error = await fn();
    if (error) { console.log(`  FALHA  ${name}\n         ${error}`); failures++; }
    else console.log(`  ok     ${name}`);
  } catch (e) {
    console.log(`  FALHA  ${name}\n         ${e.message}`); failures++;
  }
}
const expectField = (r, value, cursor) => (r.value === value && (cursor === undefined || r.cursor === cursor)
  ? null : `esperado "${value}"${cursor === undefined ? '' : ` cursor ${cursor}`}, veio "${r.value}" cursor ${r.cursor}`);

await evaluate('new Promise((r) => (document.readyState === "complete" ? r() : addEventListener("load", r)))');

await testCase('digitar CPF põe os separadores enquanto se digita', async () => {
  await focusAt('cpf');
  await typeText('12345678901');
  return expectField(await readField('cpf'), '123.456.789-01', 14);
});

await testCase('Backspace apaga dígito por dígito, e o cursor para antes do separador', async () => {
  await startFrom('cpf', '12345678901');
  await focusAt('cpf');
  await press('Backspace');
  const one = await readField('cpf');
  if (one.value !== '123.456.789-0') return `depois de um Backspace veio "${one.value}"`;
  // O separador seguinte aparece assim que e certo — por isso sobra o '-' com
  // nove digitos, e o cursor fica em 11, antes dele, e nao depois.
  await press('Backspace');
  return expectField(await readField('cpf'), '123.456.789-', 11);
});

await testCase('Backspace em cima do separador que sobrou apaga o dígito', async () => {
  // Aqui a mascara recolocaria o '-' na hora e a tecla nao faria nada. O
  // _format percebe que a contagem de digitos nao mudou e tira o vizinho.
  await startFrom('cpf', '123456789');
  await focusAt('cpf');
  await press('Backspace');
  return expectField(await readField('cpf'), '123.456.78', 10);
});

await testCase('Backspace em cima de separador apaga o dígito vizinho', async () => {
  await startFrom('cpf', '12345678901');
  await focusAt('cpf', 4);           // logo depois do primeiro ponto: "123."
  await press('Backspace');
  return expectField(await readField('cpf'), '124.567.890-1', 2);
});

await testCase('Delete apaga para a frente sem travar no separador', async () => {
  await startFrom('cpf', '12345678901');
  await focusAt('cpf', 3);           // em cima do ponto de "123|.456"
  await press('Delete');
  return expectField(await readField('cpf'), '123.567.890-1');
});

await testCase('digitar no meio empurra o resto e mantém o cursor no lugar certo', async () => {
  await startFrom('cpf', '12345678901');
  await focusAt('cpf', 3);
  await typeText('9');
  return expectField(await readField('cpf'), '123.945.678-90', 5);
});

await testCase('cpf-cnpj troca de gabarito no 12º dígito, digitando', async () => {
  await focusAt('doc');
  await typeText('12345678901');
  const cpf = await readField('doc');
  if (cpf.value !== '123.456.789-01') return `com 11 dígitos veio "${cpf.value}"`;
  await typeText('2');
  const cnpj = await readField('doc');
  if (cnpj.value !== '12.345.678/9012-') return `com 12 dígitos veio "${cnpj.value}"`;
  await press('Backspace');
  return expectField(await readField('doc'), '123.456.789-01');
});

await testCase('moeda enche da direita e o cursor fica no fim', async () => {
  await startFrom('amount', '');
  await focusAt('amount');
  await typeText('12345');
  const r = await readField('amount');
  return r.value.endsWith('123,45') && r.cursor === r.value.length
    ? null : `veio "${r.value}" cursor ${r.cursor}`;
});

await testCase('Backspace na moeda tira um dígito, não um caractere da máscara', async () => {
  await focusAt('amount');   // continua de onde o caso acima parou: 123,45
  await press('Backspace');
  const r = await readField('amount');
  return r.value.endsWith('12,34') ? null : `veio "${r.value}"`;
});

await testCase('data recusa dia impossível enquanto se digita', async () => {
  await focusAt('date');
  await typeText('99999999');
  const r = await readField('date');
  return /^\d{2}\/\d{2}\/\d{4}$/.test(r.value) ? null : `veio "${r.value}"`;
});

await testCase('setas andam entre as abas, pulam a desativada e trocam o painel', async () => {
  const where = () => evaluate(`(() => { const a = document.getElementById('tabs');
    return document.activeElement.textContent + a._tucano.index + a.querySelectorAll('.tuc-tabs__panel:not([hidden])').length; })()`);
  await evaluate(`document.querySelector('#tabs .tuc-tabs__tab').focus()`);
  await press('ArrowRight');
  let r = await where();
  if (r !== 'B11') return `depois de → esperado B, índice 1 e um painel; veio ${r}`;
  await press('ArrowRight');           // C está desativada: vai direto para D
  r = await where();
  if (r !== 'D31') return `a seta não pulou a aba desativada: ${r}`;
  await press('ArrowRight');           // do fim volta ao começo
  r = await where();
  if (r !== 'A01') return `a seta não deu a volta: ${r}`;
  await press('End');
  r = await where();
  if (r !== 'D31') return `End não foi para a última: ${r}`;
  await press('Home');
  r = await where();
  return r === 'A01' ? null : `Home não voltou para a primeira: ${r}`;
});

await testCase('barra do editor aplica o comando pelo teclado, no texto selecionado', async () => {
  // Os botões agiam só no mousedown: com o foco no botão, Espaço e Enter não
  // faziam nada. Aqui a seleção é feita na área, o foco vai ao botão e a tecla
  // é de verdade — evento sintético numa página sem foco não prova isso.
  await evaluate(`(() => {
    const area = document.getElementById('ked').closest('.tuc-editor').querySelector('.tuc-editor__area');
    area.innerHTML = '<p>texto</p>';
    area.focus();
    const r = document.createRange();
    r.selectNodeContents(area.querySelector('p'));
    const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
  })()`);
  await wait(50);
  await evaluate(`document.getElementById('ked').closest('.tuc-editor').querySelector('[data-action="bold"]').focus()`);
  await typeText(' ');
  const html = await evaluate(`document.getElementById('ked').closest('.tuc-editor').querySelector('.tuc-editor__area').innerHTML`);
  return /<(b|strong)>/.test(html) ? null : `negrito não aplicado: ${html}`;
});

await testCase('↓ no campo de data abre o calendário e leva o foco ao dia', async () => {
  // Antes o foco ficava no campo: a seta não chegava à grade e o Tab fechava o
  // painel, e quem usa só teclado nunca escolhia um dia.
  await evaluate(`document.getElementById('dt').focus()`);
  await press('ArrowDown');
  const opened = await evaluate(`[document.activeElement.classList.contains('tuc-dp__day'), document.getElementById('dt')._tucano.isOpen]`);
  if (!opened[0] || !opened[1]) return `foco num dia: ${opened[0]}, aberto: ${opened[1]}`;
  const before = await evaluate('document.activeElement.dataset.date');
  await press('ArrowRight');
  const after = await evaluate('document.activeElement.dataset.date');
  if (!after || before === after) return `a seta não andou: ${before} → ${after}`;
  await press('Escape');
  const last = await evaluate(`[document.activeElement.id, document.getElementById('dt')._tucano.isOpen]`);
  return last[0] === 'dt' && !last[1] ? null : `Esc deixou o foco em "${last[0]}", aberto: ${last[1]}`;
});

await testCase('Backspace e Delete no select simples com a busca vazia limpam o valor', async () => {
  // So o multiplo respondia: no simples, esvaziar exigia o mouse no X.
  for (const t of ['Backspace', 'Delete']) {
    await startFrom('state', 'SP');
    await evaluate(`document.getElementById('state')._tucano.search.focus()`);
    await press(t);
    const v = await evaluate(`document.getElementById('state').value`);
    if (v !== '') return `${t} deixou o valor "${v}"`;
  }
  return null;
});

await testCase('limpar um select sem <option value=""> esvazia o nativo, não volta para a primeira opção', async () => {
  // A tela mostrava vazio e o formulário postava a primeira opção.
  await startFrom('noEmpty', 'PC');
  await evaluate(`document.getElementById('noEmpty')._tucano.search.focus()`);
  await press('Backspace');
  const r = await evaluate(`(() => { const s = document.getElementById('noEmpty');
    return [s.value, s.selectedIndex, s._tucano.getValue()]; })()`);
  return r[0] === '' && r[1] === -1 && r[2] === null ? null : `nativo "${r[0]}" índice ${r[1]}, componente ${r[2]}`;
});

await testCase('Backspace no select simples sem o X não limpa', async () => {
  await startFrom('fixed', 'RJ');
  await evaluate(`document.getElementById('fixed')._tucano.search.focus()`);
  await press('Backspace');
  const v = await evaluate(`document.getElementById('fixed').value`);
  return v === 'RJ' ? null : `com clearable false o valor virou "${v}"`;
});

await testCase('digitar com a lista do select fechada não perde a primeira letra', async () => {
  // A primeira letra abria a lista, e o open() zerava a busca junto: "sa" virava "a".
  await evaluate(`(() => { const c = document.getElementById('searchable')._tucano; c.close(); c.search.focus(); })()`);
  await typeText('sa');
  const r = await evaluate(`(() => { const c = document.getElementById('searchable')._tucano;
    const query = c.search.value; c.close(); return query; })()`);
  return r === 'sa' ? null : `a busca ficou "${r}"`;
});

await testCase('reset do formulário volta o select e o que ele mostra', async () => {
  // O reset não dispara change: o nativo voltava e a tela seguia com o valor antigo.
  await startFrom('resetState', 'RJ');
  const r = await evaluate(`(async () => {
    document.getElementById('resetForm').reset();
    await new Promise((ok) => setTimeout(ok, 30));
    const s = document.getElementById('resetState');
    return [s.value, s._tucano.getValue(), s._tucano.control.textContent.trim()]; })()`);
  return r[0] === 'SP' && r[1] === 'SP' && r[2].includes('São Paulo')
    ? null : `nativo "${r[0]}", componente ${JSON.stringify(r[1])}, tela "${r[2]}"`;
});

await testCase('digitar numa senha com o olho não lança erro e não expõe o que se digita', async () => {
  // Sem gabarito, cada tecla lançava "template is not iterable"; e a senha vazia
  // nascia a mostra, em type="text", com teclado numérico no celular.
  await evaluate(`(() => { window.__pageErrors = []; addEventListener('error', (e) => window.__pageErrors.push(e.message));
    document.getElementById('revealPassword').focus(); })()`);
  await typeText('sk_live_9');
  const r = await evaluate(`(() => { const i = document.getElementById('revealPassword');
    return { errors: window.__pageErrors, type: i.type, value: i.value, inputmode: i.getAttribute('inputmode') }; })()`);
  if (r.errors.length) return `erro na página: ${r.errors[0]}`;
  if (r.type !== 'password') return `o campo virou type="${r.type}"`;
  if (r.value !== 'sk_live_9') return `o valor ficou "${r.value}"`;
  return r.inputmode ? `inputmode "${r.inputmode}" num campo de senha` : null;
});

await testCase('digitar num token com o olho, sem máscara, guarda o texto como foi digitado', async () => {
  await evaluate(`(() => { window.__pageErrors = []; document.getElementById('revealToken').focus(); })()`);
  await typeText('sk_live_9');
  const r = await evaluate(`(() => { const hidden = document.querySelector('input[type=hidden][name=api_key]');
    return { errors: window.__pageErrors, posted: hidden && hidden.value }; })()`);
  if (r.errors.length) return `erro na página: ${r.errors[0]}`;
  return r.posted === 'sk_live_9' ? null : `o formulário enviaria "${r.posted}"`;
});

await testCase('Escape num painel dentro de um modal fecha só o painel', async () => {
  // O Popover parava a propagação do Escape, mas não a ação padrão: o <dialog>
  // recebia o cancel e o modal fechava junto com o select, o calendário e a cor.
  const modal = `document.getElementById('kmodal')._tucano`;
  const panels = {
    select: [`document.getElementById('mstate')._tucano.search.focus()`, `document.getElementById('mstate')._tucano`],
    datepicker: [`document.getElementById('mdate').focus()`, `document.getElementById('mdate')._tucano`],
    colorpicker: [`document.getElementById('mcolor')._tucano.swatch.focus()`, `document.getElementById('mcolor')._tucano`],
  };
  // `void`: open() e close() devolvem a instância, que o protocolo não serializa.
  // Um modal que ficasse aberto por erro deixaria o resto da página inerte, e o
  // caso seguinte falharia por causa deste.
  for (const [name, [focus, instance]] of Object.entries(panels)) {
    await evaluate(`void ${modal}.open()`);
    await wait(50);
    await evaluate(focus);
    await press('ArrowDown');
    const opened = await evaluate(`${instance}.isOpen`);
    if (opened) await press('Escape');
    const r = await evaluate(`[${instance}.isOpen, ${modal}.isOpen, document.getElementById('kmodal').open]`);
    await evaluate(`void ${modal}.close()`);
    // Espera o <dialog> fechar de fato, e não um tempo fixo: o close() só chega
    // ao nativo depois da animação, e com a máquina ocupada (logo após o build)
    // esse atraso passou dos 250ms e fechou o modal já reaberto pelo caso seguinte.
    for (let i = 0; i < 100 && await evaluate(`document.getElementById('kmodal').open`); i++) await wait(20);
    if (!opened) return `${name}: a seta não abriu o painel`;
    if (r[0]) return `${name}: o Escape não fechou o painel`;
    if (!r[1] || !r[2]) return `${name}: o Escape fechou o modal junto`;
  }
  return null;
});

await testCase('Escape no color picker devolve o foco à amostra', async () => {
  // O painel sai do DOM ao fechar; com o foco no campo hex dentro dele, o foco
  // caía no <body> e o Tab seguinte recomeçava do topo da página.
  await evaluate(`document.getElementById('color')._tucano.swatch.focus()`);
  await press('ArrowDown');
  await evaluate(`document.getElementById('color')._tucano.hexField.focus()`);
  await press('Escape');
  await wait(250);
  const r = await evaluate(`(() => { const c = document.getElementById('color')._tucano;
    return [c.isOpen, document.activeElement === c.swatch, document.activeElement.tagName]; })()`);
  if (r[0]) return 'o Escape não fechou o painel';
  return r[1] ? null : `o foco foi para ${r[2]}`;
});

await testCase('reabrir um modal logo depois de fechar deixa ele aberto', async () => {
  // O open() não cancelava o fechamento agendado, e o modal reaberto fechava sozinho.
  const r = await evaluate(`(async () => {
    const m = Tucano.modal({ title: 'Reaberto' });
    m.close();
    await new Promise((ok) => setTimeout(ok, 50));
    m.open();
    await new Promise((ok) => setTimeout(ok, 400));
    const result = [m.isOpen, m.node.open, m.node.classList.contains('is-closing')];
    m.close();
    await new Promise((ok) => setTimeout(ok, 300));
    return result; })()`);
  if (!r[0] || !r[1]) return `isOpen ${r[0]}, <dialog> aberto ${r[1]}`;
  return r[2] ? 'ficou com is-closing' : null;
});

ws.close();
chrome.kill();
unlinkSync(file);
console.log(failures ? `\n${failures} falha(s) no teclado` : '\n23 caminhos de teclado verificados');
process.exit(failures ? 1 : 0);
