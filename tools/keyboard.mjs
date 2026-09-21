#!/usr/bin/env node
/*
 * Teclado e mouse de verdade, nos tres motores, pelo Playwright.
 *
 * Por que nao entra no `behavior.mjs`: la a pagina roda sozinha e o teste le o
 * resultado no fim. Evento sintetico (`new KeyboardEvent`) nao dispara acao
 * padrao — apertar Backspace assim nao apaga nada, o campo so recebe o aviso.
 * Entao tudo que a mascara faz com o cursor estava provado pelo lado errado:
 * o teste mandava o `input` que ele mesmo queria ver.
 *
 * `page.keyboard` passa pela mesma porta que o teclado fisico, em Chromium,
 * Firefox e WebKit: o navegador apaga o caractere, move o cursor e so entao
 * dispara o `input` que a mascara escuta. E o unico jeito de provar o caminho
 * real — e o Safari e o Firefox tem caminhos proprios, que o Chrome nao prova.
 *
 * Os casos sao registrados primeiro e rodados depois, uma vez por navegador, os
 * navegadores em paralelo. Os helpers acham a pagina do navegador corrente pelo
 * AsyncLocalStorage, e por isso cada caso continua escrito como se so houvesse um.
 */
import { readFileSync } from 'node:fs';
import { AsyncLocalStorage } from 'node:async_hooks';
import { selectedBrowsers, openPage } from './browsers.mjs';

const BROWSERS = selectedBrowsers('keyboard');
const current = new AsyncLocalStorage();
const tab = () => current.getStore().page;

const page = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<style>${readFileSync('dist/tucano.css', 'utf8')}</style></head><body>
<!-- "fora" fica preso no canto: rolar para alcançar uma hora não pode pôr o painel em cima dele. -->
<button id="outside" style="position:fixed;right:0;bottom:0;z-index:2147483647">fora</button><div id="dpbox"></div>
<div id="selbox" style="max-width:320px"></div>
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
<table class="tuc-table" id="ctxtable"><tbody>
  <tr id="ctxrow1" tabindex="0"><td>Padaria Pão Quente</td></tr>
  <tr id="ctxrow2" tabindex="0"><td>Oficina Duas Rodas</td></tr>
</tbody></table>
<p id="kbold"><b>negrito fora do editor</b></p>
<form id="kedForm" onsubmit="window.__kedSubmits++; return false"><textarea id="ked2" name="body" data-tuc-editor required>&lt;p&gt;original&lt;/p&gt;</textarea><button id="kedSubmit">enviar</button></form>
<script>${readFileSync('dist/tucano.js', 'utf8')}</script>
<script>
  /* Monta um date picker novo em #dpbox e registra o que ele emite. Cada caso
     parte de um campo limpo; o anterior e destruido antes. */
  window.mk = function (html, opts) {
    if (window.dp) dp.destroy();
    const box = document.getElementById('dpbox');
    box.innerHTML = html;
    const input = box.querySelector('input:not([type=hidden])');
    if (opts) new Tucano.DatePicker(input, opts); else Tucano.init(box);
    window.dp = input._tucano;
    window.inp = input;
    window.log = [];
    dp.opts.onChange = (value, detail) => log.push('onChange ' + detail.iso);
    input.addEventListener('tucano:change', (e) => log.push('event ' + e.detail.iso));
    return true;
  };
  /* Menu do botao direito na tabela, com os itens da linha clicada. */
  window.mkCtx = function () {
    if (window.ctx) ctx.destroy();
    window.picked = [];
    window.ctx = new Tucano.ContextMenu('#ctxtable', {
      match: 'tbody tr',
      items: function (row) {
        return [{ label: row.textContent.trim() },
          { text: 'Editar', onClick: function () { picked.push('editar:' + row.id); } },
          { text: 'Excluir', variant: 'danger', onClick: function () { picked.push('excluir:' + row.id); } }];
      },
    });
    return true;
  };
  window.iso = (d) => (d ? Tucano.dates.toISODate(d) : null);
  window.hidden = () => document.querySelector('#dpbox input[type=hidden]').value;
</script>
</body></html>`;

const wait = (ms) => tab().waitForTimeout(ms);

async function evaluate(expression) {
  return tab().evaluate(expression);
}

async function press(name, times = 1) {
  for (let i = 0; i < times; i++) await tab().keyboard.press(name);
}
/* Caractere por caractere, como quem digita: keydown, beforeinput, input e keyup. */
const typeText = (text) => tab().keyboard.type(text);
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
const startFrom = (id, value) => evaluate(`void document.getElementById('${id}')._tucano.setValue('${value}')`);
const readField = (id) => evaluate(`(() => { const el = document.getElementById('${id}');
  return { value: el.value, cursor: el.selectionStart }; })()`);

/* Centro do elemento, depois de rola-lo para a tela. */
const centerOf = (expression) => evaluate(`(() => { const n = ${expression}; n.scrollIntoView({ block: 'nearest' });
  const r = n.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()`);

/* Clique de mouse de verdade no centro do elemento: passa por pointerdown,
   mousedown e foco, que element.click() pula. */
async function clickOn(expression) {
  const [x, y] = await centerOf(expression);
  await tab().mouse.click(x, y);
}

/*
 * `skip` e por motor, e sempre com motivo: { webkit: 'por que' }. O motivo sai
 * na saida — caso pulado em silencio e caso que ninguem mais olha.
 */
const CASES = [];
function testCase(name, fn, { skip = {} } = {}) {
  CASES.push({ name, fn, skip });
}
const expectField = (r, value, cursor) => (r.value === value && (cursor === undefined || r.cursor === cursor)
  ? null : `esperado "${value}"${cursor === undefined ? '' : ` cursor ${cursor}`}, veio "${r.value}" cursor ${r.cursor}`);

testCase('digitar CPF põe os separadores enquanto se digita', async () => {
  await focusAt('cpf');
  await typeText('12345678901');
  return expectField(await readField('cpf'), '123.456.789-01', 14);
});

testCase('Backspace apaga dígito por dígito, e o cursor para antes do separador', async () => {
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

testCase('Backspace em cima do separador que sobrou apaga o dígito', async () => {
  // Aqui a mascara recolocaria o '-' na hora e a tecla nao faria nada. O
  // _format percebe que a contagem de digitos nao mudou e tira o vizinho.
  await startFrom('cpf', '123456789');
  await focusAt('cpf');
  await press('Backspace');
  return expectField(await readField('cpf'), '123.456.78', 10);
});

testCase('Backspace em cima de separador apaga o dígito vizinho', async () => {
  await startFrom('cpf', '12345678901');
  await focusAt('cpf', 4);           // logo depois do primeiro ponto: "123."
  await press('Backspace');
  return expectField(await readField('cpf'), '124.567.890-1', 2);
});

testCase('Delete apaga para a frente sem travar no separador', async () => {
  await startFrom('cpf', '12345678901');
  await focusAt('cpf', 3);           // em cima do ponto de "123|.456"
  await press('Delete');
  return expectField(await readField('cpf'), '123.567.890-1');
});

testCase('digitar no meio empurra o resto e mantém o cursor no lugar certo', async () => {
  await startFrom('cpf', '12345678901');
  await focusAt('cpf', 3);
  await typeText('9');
  return expectField(await readField('cpf'), '123.945.678-90', 5);
});

testCase('cpf-cnpj troca de gabarito no 12º dígito, digitando', async () => {
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

testCase('moeda enche da direita e o cursor fica no fim', async () => {
  await startFrom('amount', '');
  await focusAt('amount');
  await typeText('12345');
  const r = await readField('amount');
  return r.value.endsWith('123,45') && r.cursor === r.value.length
    ? null : `veio "${r.value}" cursor ${r.cursor}`;
});

testCase('Backspace na moeda tira um dígito, não um caractere da máscara', async () => {
  await focusAt('amount');   // continua de onde o caso acima parou: 123,45
  await press('Backspace');
  const r = await readField('amount');
  return r.value.endsWith('12,34') ? null : `veio "${r.value}"`;
});

testCase('data recusa dia impossível enquanto se digita', async () => {
  await focusAt('date');
  await typeText('99999999');
  const r = await readField('date');
  return /^\d{2}\/\d{2}\/\d{4}$/.test(r.value) ? null : `veio "${r.value}"`;
});

testCase('setas andam entre as abas, pulam a desativada e trocam o painel', async () => {
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

testCase('barra do editor aplica o comando pelo teclado, no texto selecionado', async () => {
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

/* Editor: conteudo e cursor de partida. `where` recebe a area e devolve [no, offset]. */
const ED = (id) => `document.getElementById('${id}')._tucano`;
const edStart = (id, html, where) => evaluate(`(() => { const e = ${ED(id)}; e.setValue(${JSON.stringify(html)}); e.area.focus();
  const [node, offset] = (${where})(e.area); const r = document.createRange(); r.setStart(node, offset); r.collapse(true);
  const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()`);
const edSelectAll = (id, html) => evaluate(`(() => { const e = ${ED(id)}; e.setValue(${JSON.stringify(html)}); e.area.focus();
  const r = document.createRange(); r.selectNodeContents(e.area.querySelector('p'));
  const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()`);
/* Espera uma condicao da pagina, e nao um tempo: devolve false se ela nao chegar. */
const waitFor = (expression, ms = 2000) => tab().waitForFunction(expression, null, { timeout: ms }).then(() => true, () => false);
/*
 * Abre a caixa de link, digita o endereco e confirma com Enter de verdade. O
 * endereco vai tecla por tecla, como quem digita: o protocolo do Chrome, usado
 * antes, mandava o codigo do caractere como tecla, e "." chegava como Delete.
 */
async function linkDialog(id, url) {
  const open = `document.querySelector('dialog.tuc-modal:not(#kmodal)[open] input')`;
  await evaluate(`void ${ED(id)}.apply('link')`);
  if (!await waitFor(`!!${open}`)) throw new Error('a caixa de link não abriu');
  await evaluate(`(() => { const i = ${open}; i.focus(); i.select(); })()`);
  await typeText(url);
  await press('Enter');
  await waitFor(`!document.querySelector('dialog.tuc-modal:not(#kmodal)')`);
  await wait(50);
}

testCase('soltar HTML arrastado no editor entra como texto puro', async () => {
  // Colar já era texto puro; arrastar trazia <h1>, estilo e <img> para a tela.
  // A origem é um elemento arrastável que põe HTML e texto no dataTransfer, como
  // faz o trecho selecionado de outra página. O arrasto é do mouse, de verdade:
  // só assim o navegador chega ao beforeinput de insertFromDrop.
  await evaluate(`(() => { ${ED('ked')}.setValue('<p>alvo</p>');
    const src = document.createElement('div');
    src.id = 'dragsrc'; src.draggable = true; src.textContent = 'arrastar';
    src.style.cssText = 'position:fixed;left:0;bottom:0;z-index:2147483647;padding:8px;background:#eee';
    src.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/html', '<h1 style="color:red">Título</h1><img src="data:," onerror="window.__dropped=1">');
      e.dataTransfer.setData('text/plain', 'Título');
    });
    document.body.append(src); })()`);
  const from = await centerOf(`document.getElementById('dragsrc')`);
  const to = await evaluate(`(() => { const n = ${ED('ked')}.area.querySelector('p'); n.scrollIntoView({ block: 'nearest' });
    const b = n.getBoundingClientRect(); return [b.x + b.width - 2, b.y + b.height / 2]; })()`);
  const mouse = tab().mouse;
  await mouse.move(from[0], from[1]);
  await mouse.down();
  await mouse.move(to[0], to[1], { steps: 10 });
  await mouse.up();
  const arrived = await waitFor(`${ED('ked')}.area.textContent.includes('Título')`);
  await evaluate(`document.getElementById('dragsrc').remove()`);
  const html = await evaluate(`${ED('ked')}.area.innerHTML`);
  if (!arrived) return `o texto não entrou: ${html}`;
  if (!html.includes('Título')) return `o texto não entrou: ${html}`;
  return /<(h1|img|span|font)|style=/.test(html) ? `entrou HTML: ${html}` : null;
});

testCase('Enter e colar dentro do bloco de código mantêm as quebras depois da repintura', async () => {
  // A repintura lia textContent, que não vê <br>, e juntava as linhas numa só.
  await edStart('ked', '<pre><code>ab</code></pre><p>x</p>', "(a) => { const c = a.querySelector('code'); return [c, c.childNodes.length]; }");
  await press('Enter');
  await typeText('cd');
  // Colar pelo handler de verdade, com o texto que a área de transferência
  // entregaria: o Playwright só lê e escreve a área de transferência no
  // Chromium, e um ClipboardEvent sintético chega ao Firefox com os dados vazios.
  await evaluate(`${ED('ked')}._paste({ preventDefault() {}, clipboardData: { getData: () => ${JSON.stringify('\nef')} } })`);
  await wait(400);
  const text = await evaluate(`${ED('ked')}.area.querySelector('code').textContent`);
  return text === 'ab\ncd\nef' ? null : `bloco ficou ${JSON.stringify(text)}`;
});

testCase('Tab anda por todas as células, inclusive vazias, e cria linha na última', async () => {
  // Pegava a célula pelo pai do nó da seleção: numa célula vazia isso é a linha, e o Tab saía do editor.
  await edStart('ked', '<table><thead><tr><th><br></th><th><br></th></tr></thead><tbody><tr><td><br></td><td><br></td></tr></tbody></table>',
    "(a) => [a.querySelector('th'), 0]");
  const index = `(() => { const e = ${ED('ked')}; const c = e._currentCell(); return c ? [...e.area.querySelectorAll('th, td')].indexOf(c) : -1; })()`;
  const seen = [];
  for (let i = 0; i < 4; i++) { await press('Tab'); seen.push(await evaluate(index)); }
  const rows = await evaluate(`${ED('ked')}.area.querySelectorAll('tr').length`);
  return seen.join() === '1,2,3,4' && rows === 3 ? null : `células ${seen.join()}, ${rows} linhas`;
});

testCase('inserir tabela no fim de um parágrafo não a aninha no <p>, e desfazer tira só a tabela', async () => {
  await edStart('ked', '<p>abc</p>', "(a) => [a.querySelector('p').firstChild, 3]");
  await evaluate(`void ${ED('ked')}.apply('table')`);
  await wait(50);
  const r = await evaluate(`(() => { const e = ${ED('ked')}; return [!!e.area.querySelector('p table'), e.getValue()]; })()`);
  if (r[0]) return 'a tabela ficou dentro do <p>';
  if (!r[1].startsWith('<p>abc</p><table>') || r[1].includes('<p></p>')) return `valor: ${r[1]}`;
  await evaluate(`document.execCommand('undo')`);
  await wait(50);
  const u = await evaluate(`(() => { const a = ${ED('ked')}.area; return [a.querySelectorAll('table').length, a.textContent]; })()`);
  return u[0] === 0 && u[1].includes('abc') ? null : `depois de desfazer: ${u[0]} tabela(s), texto "${u[1]}"`;
});

testCase('caixa de link: javascript: digitado não vira link na área', async () => {
  // O valor salvo saía limpo, mas a área ficava com um <a href="javascript:…"> clicável.
  await edSelectAll('ked', '<p>texto</p>');
  await linkDialog('ked', 'javascript:alert(1)');
  const html = await evaluate(`${ED('ked')}.area.innerHTML`);
  return html.includes('<a') ? `virou link: ${html}` : null;
});

testCase('caixa de link: endereço sem esquema ganha https://', async () => {
  // "exemplo.com" virava link relativo, que a peneira descartava calada ao salvar.
  await edSelectAll('ked', '<p>texto</p>');
  await linkDialog('ked', 'exemplo.com');
  const v = await evaluate(`document.getElementById('ked').value`);
  return v.includes('href="https://exemplo.com"') ? null : `valor: ${v}`;
});

testCase('caixa de link: trocar o endereço com o cursor dentro não parte o link', async () => {
  await edStart('ked', '<p>clique <a href="https://a.com">aqui</a> fim</p>', "(a) => [a.querySelector('a').firstChild, 2]");
  await linkDialog('ked', 'https://b.com');
  const v = await evaluate(`document.getElementById('ked').value`);
  return (v.match(/<a /g) || []).length === 1 && /href="https:\/\/b\.com"[^>]*>aqui<\/a>/.test(v) ? null : `valor: ${v}`;
});

testCase('negrito selecionado fora do editor não acende o botão do editor', async () => {
  await evaluate(`(() => { document.activeElement?.blur(); const r = document.createRange();
    r.selectNodeContents(document.querySelector('#kbold b')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); })()`);
  await wait(50);
  const r = await evaluate(`document.getElementById('ked').closest('.tuc-editor').querySelector('[data-action="bold"]').getAttribute('aria-pressed')`);
  return r === 'false' ? null : `aria-pressed="${r}"`;
});

testCase('editor obrigatório vazio barra o envio e leva o foco à área; com texto, envia', async () => {
  // Esvaziado, postava <p><br></p> e passava; e o textarea escondido não recebia o foco do aviso.
  await evaluate(`(() => { window.__kedSubmits = 0; ${ED('ked2')}.setValue(''); })()`);
  await clickOn(`document.getElementById('kedSubmit')`);
  await wait(50);
  const r = await evaluate(`[window.__kedSubmits, document.getElementById('ked2').value, document.activeElement === ${ED('ked2')}.area]`);
  if (r[0]) return `enviou vazio, com valor ${JSON.stringify(r[1])}`;
  if (!r[2]) return 'o foco não foi para a área';
  await evaluate(`void ${ED('ked2')}.setValue('<p>ok</p>')`);
  await clickOn(`document.getElementById('kedSubmit')`);
  await wait(50);
  const n = await evaluate('window.__kedSubmits');
  return n === 1 ? null : `com texto, ${n} envio(s)`;
});

testCase('reset do formulário devolve o editor ao conteúdo de origem', async () => {
  const r = await evaluate(`(async () => { const e = ${ED('ked2')}; e.setValue('<p>mudado</p>');
    document.getElementById('kedForm').reset();
    await new Promise((ok) => setTimeout(ok, 30));
    return [document.getElementById('ked2').value, e.area.innerHTML]; })()`);
  return r[0] === '<p>original</p>' && r[1].includes('original') && !r[1].includes('mudado') ? null : JSON.stringify(r);
});

testCase('↓ no campo de data abre o calendário e leva o foco ao dia', async () => {
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

testCase('Backspace e Delete no select simples com a busca vazia limpam o valor', async () => {
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

testCase('limpar um select sem <option value=""> esvazia o nativo, não volta para a primeira opção', async () => {
  // A tela mostrava vazio e o formulário postava a primeira opção.
  await startFrom('noEmpty', 'PC');
  await evaluate(`document.getElementById('noEmpty')._tucano.search.focus()`);
  await press('Backspace');
  const r = await evaluate(`(() => { const s = document.getElementById('noEmpty');
    return [s.value, s.selectedIndex, s._tucano.getValue()]; })()`);
  return r[0] === '' && r[1] === -1 && r[2] === null ? null : `nativo "${r[0]}" índice ${r[1]}, componente ${r[2]}`;
});

testCase('Backspace no select simples sem o X não limpa', async () => {
  await startFrom('fixed', 'RJ');
  await evaluate(`document.getElementById('fixed')._tucano.search.focus()`);
  await press('Backspace');
  const v = await evaluate(`document.getElementById('fixed').value`);
  return v === 'RJ' ? null : `com clearable false o valor virou "${v}"`;
});

testCase('digitar com a lista do select fechada não perde a primeira letra', async () => {
  // A primeira letra abria a lista, e o open() zerava a busca junto: "sa" virava "a".
  await evaluate(`(() => { const c = document.getElementById('searchable')._tucano; c.close(); c.search.focus(); })()`);
  await typeText('sa');
  const r = await evaluate(`(() => { const c = document.getElementById('searchable')._tucano;
    const query = c.search.value; c.close(); return query; })()`);
  return r === 'sa' ? null : `a busca ficou "${r}"`;
});

testCase('reset do formulário volta o select e o que ele mostra', async () => {
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

testCase('digitar numa senha com o olho não lança erro e não expõe o que se digita', async () => {
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

testCase('digitar num token com o olho, sem máscara, guarda o texto como foi digitado', async () => {
  await evaluate(`(() => { window.__pageErrors = []; document.getElementById('revealToken').focus(); })()`);
  await typeText('sk_live_9');
  const r = await evaluate(`(() => { const hidden = document.querySelector('input[type=hidden][name=api_key]');
    return { errors: window.__pageErrors, posted: hidden && hidden.value }; })()`);
  if (r.errors.length) return `erro na página: ${r.errors[0]}`;
  return r.posted === 'sk_live_9' ? null : `o formulário enviaria "${r.posted}"`;
});

testCase('Escape num painel dentro de um modal fecha só o painel', async () => {
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
    await waitFor(`!document.getElementById('kmodal').open`);
    if (!opened) return `${name}: a seta não abriu o painel`;
    if (r[0]) return `${name}: o Escape não fechou o painel`;
    if (!r[1] || !r[2]) return `${name}: o Escape fechou o modal junto`;
  }
  return null;
});

testCase('Escape no color picker devolve o foco à amostra', async () => {
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

testCase('Enter na amostra do color picker leva o foco ao painel, e o Tab anda por dentro', async () => {
  // O painel mora no fim do <body>: com o foco na amostra, o Tab saía do campo,
  // o painel fechava e área, trilhas e valor ficavam fora do alcance do teclado.
  const c = `document.getElementById('color')._tucano`;
  await evaluate(`${c}.swatch.focus()`);
  await press('Enter');
  const opened = await evaluate(`[${c}.isOpen, document.activeElement === ${c}.area]`);
  await press('Tab');
  const tabbed = await evaluate(`[${c}.isOpen, ${c}.panel.contains(document.activeElement)]`);
  await press('Escape');
  await wait(250);
  if (!opened[0]) return 'o Enter não abriu o painel';
  if (!opened[1]) return 'o foco ficou fora do painel';
  return tabbed[0] && tabbed[1] ? null : 'o Tab saiu do painel e ele fechou';
});

/* Abre o painel de #color com a cor dada e devolve o centro da área, já posicionada. */
async function openColorArea(value) {
  await evaluate(`void document.getElementById('color')._tucano.setValue('${value}', { silent: true })`);
  await evaluate(`void document.getElementById('color')._tucano.open()`);
  await wait(50);
  await centerOf(`document.getElementById('color')._tucano.area`);
  await wait(50);
  return centerOf(`document.getElementById('color')._tucano.area`);
}

testCase('arrastar a área do color picker emite um change nativo só, ao soltar', async () => {
  // Com o change nativo a cada movimento, um hx-trigger="change" mandava uma
  // requisição por pixel arrastado.
  const [x, y] = await openColorArea('#4f46e5');
  await evaluate(`(() => { window.__cn = { change: 0, tucano: 0 }; const i = document.getElementById('color');
    i.addEventListener('change', () => __cn.change++); i.addEventListener('tucano:change', () => __cn.tucano++); })()`);
  await tab().mouse.move(x, y);
  await tab().mouse.down();
  await tab().mouse.move(x + 60, y + 40, { steps: 10 });
  const during = await evaluate(`({ ...__cn })`);
  await tab().mouse.up();
  const after = await evaluate(`({ ...__cn })`);
  await evaluate(`void document.getElementById('color')._tucano.close()`);
  await wait(250);
  if (during.change) return `${during.change} change nativo(s) durante o arrasto`;
  if (during.tucano < 2) return `tucano:change só ${during.tucano} vez(es) durante o arrasto`;
  return after.change === 1 ? null : `${after.change} change nativo(s) ao soltar`;
});

testCase('botão direito na área do color picker não muda a cor', async () => {
  const [x, y] = await openColorArea('#4f46e5');
  await tab().mouse.click(x + 50, y + 30, { button: 'right' });
  const value = await evaluate(`document.getElementById('color').value`);
  await evaluate(`void document.getElementById('color')._tucano.close()`);
  await wait(250);
  return value === '#4f46e5' ? null : `a cor mudou para ${value}`;
});

testCase('Home e End nas trilhas do color picker vão aos extremos', async () => {
  const c = `document.getElementById('color')._tucano`;
  await openColorArea('#4f46e5');
  await evaluate(`${c}.alpha.root.focus()`);
  await press('Home');
  const low = await evaluate(`${c}.hsva.a`);
  await press('End');
  const high = await evaluate(`${c}.hsva.a`);
  await evaluate(`${c}.hue.root.focus()`);
  await press('Home');
  const hue = await evaluate(`${c}.hue.root.getAttribute('aria-valuenow')`);
  await evaluate(`void ${c}.close()`);
  await wait(250);
  return low === 0 && high === 1 && hue === '0' ? null : `opacidade ${low} → ${high}, matiz ${hue}`;
});

testCase('reset do formulário devolve a cor ao color picker', async () => {
  // O reset volta o texto sem disparar change: a amostra e a instância seguiam
  // com a cor antiga, e o próximo envio mandava de novo a cor descartada.
  const r = await evaluate(`(async () => {
    const f = document.createElement('form');
    f.innerHTML = '<input data-tuc-color value="#4f46e5">';
    document.body.append(f);
    Tucano.init(f);
    const c = f.querySelector('input')._tucano;
    c.setValue('#000000');
    f.reset();
    await new Promise((ok) => setTimeout(ok, 30));
    const out = [c.getValue(), c.swatch.style.getPropertyValue('--color')];
    c.destroy(); f.remove();
    return out;
  })()`);
  return r[0] === '#4f46e5' && r[1] === '#4f46e5' ? null : `depois do reset: ${r.join(' / ')}`;
});

testCase('reabrir um modal logo depois de fechar deixa ele aberto', async () => {
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

/* ------------------------------------------------------------------ *
 * Date picker: digitacao, confirmacao, descarte, foco e tempo          *
 * ------------------------------------------------------------------ */

testCase('data digitada emite ao sair com Tab, e Enter com o painel aberto confirma e fecha', async () => {
  // A prévia gravava o valor enquanto se digitava, e o commit achava tudo igual:
  // nem tucano:change nem onChange saíam, e o Enter não fechava o painel.
  await evaluate(`mk('<input data-tuc-datepicker name="kd">')`);
  await evaluate('inp.focus()');
  await typeText('25122026');
  await press('Tab');
  let r = await evaluate(`[iso(dp.start), log.join('|'), hidden()]`);
  if (r[1] !== 'onChange 2026-12-25|event 2026-12-25' || r[2] !== '2026-12-25') return `Tab: ${JSON.stringify(r)}`;

  await evaluate(`mk('<input data-tuc-datepicker name="kd">'); inp.focus(); dp.open()`);
  await typeText('24122026');
  const typing = await evaluate(`[hidden(), log.length, dp.start]`);
  if (typing[0] !== '' || typing[1] || typing[2]) return `a prévia gravou o valor: ${JSON.stringify(typing)}`;
  await press('Enter');
  r = await evaluate(`[iso(dp.start), log.join('|'), dp.isOpen]`);
  return r[1] === 'onChange 2026-12-24|event 2026-12-24' && !r[2] ? null : `Enter: ${JSON.stringify(r)}`;
});

testCase('Escape depois de digitar descarta o texto e mantém o valor', async () => {
  await evaluate(`mk('<input data-tuc-datepicker name="kd">'); dp.setValue('2026-09-07', { silent: true });
    inp.focus(); dp.open(); inp.value = ''; inp.setSelectionRange(0, 0)`);
  await typeText('25122026');
  await press('Escape');
  const r = await evaluate(`[inp.value, hidden(), log.length, dp.isOpen]`);
  return r[0] === '07/09/2026' && r[1] === '2026-09-07' && !r[2] && !r[3] ? null : JSON.stringify(r);
});

testCase('período digitado emite com as duas datas; com o fim inválido é recusado inteiro', async () => {
  await evaluate(`mk('<input data-tuc-datepicker data-mode="range" name="kp">'); inp.focus()`);
  await typeText('0103202615032026');
  await press('Tab');
  let r = await evaluate(`[log.join('|'), hidden()]`);
  if (r[0] !== 'onChange 2026-03-01,2026-03-15|event 2026-03-01,2026-03-15') return `Tab: ${JSON.stringify(r)}`;
  // 31/02 não existe: antes o início valia sozinho e o evento saía com o fim vazio.
  await evaluate(`inp.focus(); dp.open(); inp.value = ''; inp.setSelectionRange(0, 0)`);
  await typeText('0103202631022026');
  await press('Enter');
  r = await evaluate(`[hidden(), log.length, inp.value]`);
  return r[0] === '2026-03-01,2026-03-15' && r[1] === 2 && r[2] === '01/03/2026 — 15/03/2026' ? null : `fim inválido: ${JSON.stringify(r)}`;
});

testCase('data digitada fora do max é recusada, e o valor anterior fica', async () => {
  await evaluate(`mk('<input name="km">', { max: '2026-12-31' }); dp.setValue('2026-06-01', { silent: true });
    inp.focus(); inp.value = ''; inp.setSelectionRange(0, 0)`);
  await typeText('15012027');
  await press('Tab');
  const r = await evaluate(`[iso(dp.start), inp.value, log.length]`);
  return r[0] === '2026-06-01' && r[1] === '01/06/2026' && !r[2] ? null : JSON.stringify(r);
});

testCase('período pela metade e Escape devolvem o período que já estava escolhido', async () => {
  await evaluate(`mk('<input data-tuc-datepicker data-mode="range" name="kr">');
    dp.setValue({ start: '2026-03-01', end: '2026-03-15' }, { silent: true }); inp.focus(); dp.open()`);
  await clickOn(`dp.panel.querySelector('.tuc-dp__day[data-date="2026-03-20"]:not(.is-outside)')`);
  const half = await evaluate('dp.pendingRange');
  await press('Escape');
  const r = await evaluate(`[iso(dp.start), iso(dp.end), hidden(), log.length]`);
  if (!half) return 'o clique não começou um período';
  return r.join(' ') === '2026-03-01 2026-03-15 2026-03-01,2026-03-15 0' ? null : JSON.stringify(r);
});

testCase('com Aplicar, dia e hora ficam pendentes: Aplicar emite uma vez e clicar fora descarta', async () => {
  await evaluate(`mk('<input data-tuc-datepicker data-time="true" name="kt">'); dp.setValue('2026-09-07T10:00', { silent: true })`);
  await clickOn('inp');
  await clickOn(`dp.panel.querySelector('.tuc-dp__day[data-date="2026-09-10"]:not(.is-outside)')`);
  await clickOn(`dp.panel.querySelector('[data-key="start-h-14"]')`);
  const pending = await evaluate(`[log.length, hidden()]`);
  if (pending[0] || pending[1] !== '2026-09-07T10:00') return `a escolha valeu antes do Aplicar: ${JSON.stringify(pending)}`;
  await clickOn(`dp.panel.querySelector('[data-key="apply"]')`);
  let r = await evaluate(`[log.join('|'), hidden(), dp.isOpen]`);
  if (r[0] !== 'onChange 2026-09-10T14:00|event 2026-09-10T14:00' || r[2]) return `Aplicar: ${JSON.stringify(r)}`;
  await clickOn('inp');
  await clickOn(`dp.panel.querySelector('[data-key="start-h-9"]')`);
  const hit = await evaluate(`(() => { const b = document.getElementById('outside').getBoundingClientRect();
    const n = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
    return n && (n.id || n.tagName + '.' + n.className + ' @' + Math.round(b.left) + ',' + Math.round(b.top) + ' vw ' + innerWidth + 'x' + innerHeight); })()`);
  if (hit !== 'outside') return `o clique "fora" cairia em outro elemento (${hit})`;
  await clickOn(`document.getElementById('outside')`);
  r = await evaluate(`[log.length, hidden(), inp.value, dp.isOpen]`);
  return r[0] === 2 && r[1] === '2026-09-10T14:00' && r[2] === '10/09/2026 14:00' && !r[3] ? null : `fora: ${JSON.stringify(r)}`;
});

testCase('fechar e reabrir em menos de 200 ms mantém o painel no DOM — date picker e select', async () => {
  // O timer de saída morava no Popover antigo, e tirava do DOM o painel que acabara de reabrir.
  const r = await evaluate(`(async () => {
    mk('<input data-tuc-datepicker>');
    dp.open(); await new Promise((ok) => setTimeout(ok, 50));
    dp.close({ restoreFocus: false }); dp.open();
    await new Promise((ok) => setTimeout(ok, 400));
    const date = [dp.isOpen, dp.panel.isConnected]; dp.close({ restoreFocus: false });
    const s = document.getElementById('state')._tucano;
    s.open(); await new Promise((ok) => setTimeout(ok, 50));
    s.close(); s.open();
    await new Promise((ok) => setTimeout(ok, 400));
    const select = [s.isOpen, s.menu.isConnected]; s.close();
    return [date, select]; })()`);
  if (!r[0][1]) return `date picker: aberto ${r[0][0]}, painel no DOM ${r[0][1]}`;
  return r[1][1] ? null : `select: aberto ${r[1][0]}, menu no DOM ${r[1][1]}`;
});

testCase('dia desativado recebe foco pela seta, e ↓ com min no meio do mês foca um dia habilitado', async () => {
  // Com disabled, a seta num fim de semana bloqueado mandava o foco ao <body>;
  // e o foco inicial ia ao dia 1, desativado pelo min.
  await evaluate(`(() => { const y = new Date().getFullYear() + 1;
    mk('<input>', { min: new Date(y, 8, 16), disabledDates: (d) => d.getDay() === 0 || d.getDay() === 6 });
    window.firstOk = (() => { let d = new Date(y, 8, 16); while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1); return iso(d); })();
    inp.focus(); })()`);
  await press('ArrowDown');
  const first = await evaluate(`[document.activeElement.dataset.date, firstOk]`);
  if (first[0] !== first[1]) return `foco inicial em ${first[0]}, esperado ${first[1]}`;
  let sawDisabled = false;
  for (let i = 0; i < 6; i++) {
    await press('ArrowRight');
    const r = await evaluate(`[document.activeElement.classList.contains('tuc-dp__day'), document.activeElement.getAttribute('aria-disabled'), document.activeElement.dataset.date, iso(dp.focusDate)]`);
    if (!r[0] || r[2] !== r[3]) return `depois de ${i + 1} seta(s) o foco foi para ${r[2] || 'fora da grade'}`;
    if (r[1] === 'true') { sawDisabled = true; await press('Enter'); break; }
  }
  const r = await evaluate(`[dp.start, dp.isOpen]`);
  await press('Escape');
  if (!sawDisabled) return 'a seta não passou por dia desativado';
  return !r[0] && r[1] ? null : 'Enter num dia desativado escolheu o dia';
});

testCase('Enter nas setas, no rótulo e na célula de mês mantém o foco no painel', async () => {
  // O render refazia tudo com replaceChildren, e cada ativação mandava o foco ao <body>.
  await evaluate(`mk('<input data-tuc-datepicker>'); dp.setValue('2026-09-07', { silent: true }); inp.focus()`);
  await press('ArrowDown');
  await evaluate(`dp.panel.querySelector('[data-key="next"]').focus()`);
  await press('Enter');
  let r = await evaluate(`[document.activeElement.dataset.key, dp.panel.querySelector('.tuc-dp__label').textContent]`);
  if (r[0] !== 'next' || !r[1].startsWith('Outubro')) return `seta: foco em ${r[0]}, mês ${r[1]}`;
  await evaluate(`dp.panel.querySelector('[data-key="label-0"]').focus()`);
  await press('Enter');
  r = await evaluate(`[document.activeElement.dataset.key, dp.view]`);
  if (r[0] !== 'label-0' || r[1] !== 'months') return `rótulo: ${JSON.stringify(r)}`;
  await evaluate(`dp.panel.querySelector('[data-key="cell-2"]').focus()`);
  await press('Enter');
  r = await evaluate(`[document.activeElement.classList.contains('tuc-dp__day'), dp.view, document.activeElement.dataset.date]`);
  await press('Escape');
  return r[0] && r[1] === 'days' && r[2].startsWith('2026-03') ? null : `célula de mês: ${JSON.stringify(r)}`;
});

testCase('colunas de hora: uma parada de Tab por coluna, setas andam e Enter escolhe', async () => {
  await evaluate(`mk('<input>', { time: true, seconds: true, minuteStep: 1 }); dp.setValue('2026-09-07T10:00', { silent: true }); dp.open()`);
  const stops = await evaluate(`[...dp.panel.querySelectorAll('.tuc-dp__timeitem')].filter((n) => n.tabIndex === 0).length`);
  if (stops !== 3) return `${stops} paradas de Tab nas colunas de hora (esperado 3)`;
  if (await evaluate(`!!dp.panel.querySelector('[role=listbox], [role=option]')`)) return 'ainda há listbox com botões dentro';
  await evaluate(`dp.panel.querySelector('[data-key="start-h-10"]').focus()`);
  await press('ArrowDown');
  let r = await evaluate('document.activeElement.dataset.key');
  if (r !== 'start-h-11') return `↓ levou o foco a ${r}`;
  await press('Enter');
  r = await evaluate(`[dp.start.getHours(), document.activeElement.dataset.key]`);
  if (r[0] !== 11 || r[1] !== 'start-h-11') return `Enter: hora ${r[0]}, foco ${r[1]}`;
  await press('End');
  r = await evaluate('document.activeElement.dataset.key');
  await press('Escape');
  return r === 'start-h-23' ? null : `End levou o foco a ${r}`;
});

testCase('dois meses lado a lado: uma parada de Tab na grade, e nunca no dia de fora', async () => {
  await evaluate(`mk('<input data-tuc-datepicker data-mode="range">'); dp.setValue({ start: '2026-09-28', end: '2026-09-29' }, { silent: true }); inp.focus()`);
  await press('ArrowDown');
  const r = await evaluate(`[dp.panel.querySelectorAll('.tuc-dp__day[tabindex="0"]').length, document.activeElement.dataset.date, document.activeElement.classList.contains('is-outside')]`);
  await press('Escape');
  return r[0] === 1 && r[1] === '2026-09-28' && !r[2] ? null : JSON.stringify(r);
});

testCase('reset do formulário volta o date picker, o hidden e a instância', async () => {
  const r = await evaluate(`(async () => {
    mk('<form><input data-tuc-datepicker name="kf" value="2026-09-07"></form>');
    dp.setValue('2026-10-01');
    inp.form.reset();
    await new Promise((ok) => setTimeout(ok, 30));
    return [inp.value, hidden(), iso(dp.start)]; })()`);
  return r.join(' ') === '07/09/2026 2026-09-07 2026-09-07' ? null : JSON.stringify(r);
});

/* Upload montado numa caixa propria; `pick` faz o que a janela do sistema faz. */
const mountUpload = (html, opts = '{}') => evaluate(`(() => {
  if (window.upBox) { window.up?.destroy(); upBox.remove(); }
  window.upBox = document.createElement('div');
  upBox.innerHTML = ${JSON.stringify(html)};
  document.body.prepend(upBox);
  window.upInput = upBox.querySelector('input[type=file]');
  window.up = new Tucano.Upload(upInput, ${opts});
  window.pick = (names) => { const dt = new DataTransfer(); names.forEach((n) => dt.items.add(new File(['x'], n))); upInput.files = dt.files; upInput.dispatchEvent(new Event('change')); };
  return true; })()`);

testCase('upload: Tab não para no input nativo escondido', async () => {
  await mountUpload('<label for="kup">Anexos</label><input type="file" id="kup" name="kup" multiple>');
  await evaluate(`pick(['a.txt']); up.zone.focus()`);
  const seen = [];
  for (let i = 0; i < 4; i++) { await press('Tab'); seen.push(await evaluate(`document.activeElement === upInput`)); }
  return seen.includes(true) ? `o foco parou no input escondido: ${JSON.stringify(seen)}` : null;
});

testCase('upload: remover pelo teclado deixa o foco na zona, não no body', async () => {
  await mountUpload('<input type="file" name="kup" multiple>');
  await evaluate(`pick(['a.txt']); up.list.querySelector('button').focus()`);
  await press('Enter');
  const r = await evaluate(`[up.getFiles().length, document.activeElement === up.zone, document.activeElement.tagName]`);
  return r[0] === 0 && r[1] ? null : JSON.stringify(r);
});

testCase('upload: o foco fica no botão quando outro arquivo termina de subir', async () => {
  // Cada envio refazia a lista inteira, e o botão focado saía do DOM.
  const r = await evaluate(`(async () => {
    const Real = window.XMLHttpRequest, sent = [];
    window.XMLHttpRequest = function () {
      const x = new EventTarget(); x.upload = new EventTarget(); x.status = 0; x.response = null;
      x.open = () => {}; x.setRequestHeader = () => {}; x.send = () => sent.push(x);
      x.abort = () => x.dispatchEvent(new Event('abort'));
      return x;
    };
    try {
      up.destroy(); upBox.innerHTML = '<input type="file" name="kup" multiple>';
      window.upInput = upBox.querySelector('input'); window.up = new Tucano.Upload(upInput, { url: '/up/' });
      pick(['lento.txt', 'rapido.txt']);
      up.list.querySelector('[data-key] button').focus();
      Object.assign(sent[1], { status: 200, response: { id: 1 } }).dispatchEvent(new Event('load'));
      await new Promise((ok) => setTimeout(ok));
      const a = document.activeElement;
      return [up.getFiles().map((f) => f.status).join(), a.getAttribute('aria-label'), a.closest('li')?.querySelector('.tuc-upload__name').textContent];
    } finally { window.XMLHttpRequest = Real; }
  })()`);
  return r.join('|') === 'uploading,ready|Cancelar|lento.txt' ? null : JSON.stringify(r);
});

testCase('upload dentro de <label>: um clique na zona clica o input uma vez só', async () => {
  // O label reativava o input, e Firefox e Safari abriam a janela duas vezes.
  await mountUpload('<label>Foto <input type="file" name="kup"></label>');
  await evaluate(`window.upClicks = 0; upInput.addEventListener('click', () => upClicks++)`);
  await clickOn('up.zone');
  await wait(300);
  const n = await evaluate('upClicks');
  await evaluate(`up.destroy(); upBox.remove(); window.upBox = null`);
  return n === 1 ? null : `${n} cliques no input`;
});

testCase('layout compacto acompanha a tela: alargar devolve a digitação e a máscara', async () => {
  // Decidido só na montagem, girar o tablet deixava o campo readOnly e sem máscara.
  // O Chrome sem cabeça não troca `pointer: coarse` pela emulação de toque, então
  // a consulta do layout compacto é trocada por uma que o teste controla; o
  // resto — ouvir o `change` e reconfigurar o campo — é o código de verdade.
  await evaluate(`(() => {
    const real = window.matchMedia;
    window.fakeCompact = Object.assign(new EventTarget(), { matches: true });
    window.matchMedia = (q) => (q.includes('max-width: 40rem') ? fakeCompact : real(q));
    mk('<input data-tuc-datepicker>');
    window.matchMedia = real; })()`);
  const narrow = await evaluate(`[inp.readOnly, !!dp._mask]`);
  await evaluate(`fakeCompact.matches = false; fakeCompact.dispatchEvent(Object.assign(new Event('change'), { matches: false }))`);
  const wide = await evaluate(`[inp.readOnly, !!dp._mask]`);
  const cleaned = await evaluate(`(() => { dp.destroy(); window.dp = null;
    return inp.readOnly === false && !inp.hasAttribute('inputmode'); })()`);
  if (!cleaned) return 'destroy deixou o campo readOnly ou com inputmode';
  if (narrow[0] !== true || narrow[1] !== false) return `estreito: readOnly ${narrow[0]}, máscara ${narrow[1]}`;
  return wide[0] === false && wide[1] === true ? null : `largo: readOnly ${wide[0]}, máscara ${wide[1]}`;
});


/* ------------------------------------------------------------------ *
 * Select: um caso por defeito que a auditoria reproduziu.             *
 * ------------------------------------------------------------------ */

/* Monta um select novo em #selbox; o anterior e destruido. `opts` e codigo JS. */
const selMount = (html, opts = '{}') => evaluate(`(() => {
  const box = document.getElementById('selbox');
  for (const s of box.querySelectorAll('select')) s._tucano?.destroy();
  box.innerHTML = ${JSON.stringify(html)};
  window.calls = []; window.changes = 0;
  const s = box.querySelector('select');
  s.addEventListener('change', () => changes++);
  window.sel = new Tucano.Select(s, ${opts});
  return true; })()`);
const UFS = '<option value="AC">Acre</option><option value="BA">Bahia</option><option value="PA">Pará</option>'
  + '<option value="PR">Paraná</option><option value="SC">Santa Catarina</option><option value="SP">São Paulo</option>';
const selText = () => evaluate(`sel.list.textContent`);
/*
 * Fechar anima a saida, e o painel so sai do DOM depois: o passo seguinte do
 * teste espera ele sair, para nunca clicar num painel que ainda esta sumindo.
 */
const closeSel = async () => {
  await evaluate(`void sel.close()`);
  await waitFor(`!sel.menu.isConnected`);
};

testCase('select: digitar "são" com acento acha São Paulo', async () => {
  // Só as opções perdiam o acento; o termo digitado não, e "são" não achava nada.
  await selMount(`<select>${UFS}</select>`);
  await evaluate(`sel.search.focus()`);
  await typeText('são');
  const r = await evaluate(`[...sel.list.querySelectorAll('[role=option]')].map((n) => n.textContent)`);
  await closeSel();
  return r.length === 1 && r[0] === 'São Paulo' ? null : `achou ${JSON.stringify(r)}`;
});

testCase('select: ↑ sem nada ativo vai à última; Home e End pulam as desativadas', async () => {
  // Do -1, a seta para cima caía na penúltima; Home e End paravam em opção desativada.
  await selMount('<select><option value="">-</option><option value="1" disabled>Um</option><option value="2">Dois</option><option value="3">Tres</option><option value="4" disabled>Quatro</option><option value="5">Cinco</option></select>');
  await evaluate(`sel.search.focus()`);
  await press('Enter');
  const active = () => evaluate(`sel.list.querySelector('.is-active')?.textContent`);
  await press('ArrowUp'); const up = await active();
  await press('Home'); const home = await active();
  await press('End'); const end = await active();
  await closeSel();
  return up === 'Cinco' && home === 'Dois' && end === 'Cinco' ? null : `↑ ${up}, Home ${home}, End ${end}`;
});

testCase('select múltiplo: Enter depois de filtrar mantém o destaque na opção marcada', async () => {
  // A busca zerava e o índice da lista filtrada passava a apontar outra opção: o segundo Enter marcava Acre.
  await selMount(`<select multiple>${UFS}</select>`);
  await evaluate(`sel.search.focus()`);
  await typeText('paran');
  await press('Enter');
  const first = await evaluate(`[sel.getValue().join(), sel.list.querySelector('.is-active')?.textContent]`);
  await press('Enter');
  const second = await evaluate(`sel.getValue().join()`);
  await closeSel();
  return first[0] === 'PR' && first[1] === 'Paraná' && second === '' ? null : `1º ${JSON.stringify(first)}, 2º "${second}"`;
});

testCase('select desativado não recebe texto, não limpa e não mostra o X', async () => {
  // A busca aceitava texto e Backspace/X limpavam um campo que o formulário nem envia.
  await selMount(`<select disabled>${UFS.replace('value="SP"', 'value="SP" selected')}</select>`, '{ search: true }');
  await evaluate(`sel.search.focus()`);
  await typeText('x');
  const r = await evaluate(`[sel.search.disabled, sel.search.value, sel.getValue(), getComputedStyle(sel.clearBtn).display]`);
  return r[0] === true && r[1] === '' && r[2] === 'SP' && r[3] === 'none' ? null : `disabled ${r[0]}, busca "${r[1]}", valor ${r[2]}, X ${r[3]}`;
});

testCase('select: clique dentro de <label> abre e fica aberto; <label for> e submit inválido levam o foco à busca', async () => {
  // O label ativado mandava o foco ao nativo escondido, e o Popover fechava a lista na hora.
  await selMount(`<label>Estado <select id="kwrap">${UFS}</select></label>`);
  await clickOn(`sel.control`);
  await wait(150);
  const wrapped = await evaluate(`[sel.isOpen, document.activeElement === sel.search]`);
  await closeSel();
  await selMount(`<form id="kform" onsubmit="return false"><label for="kfor" id="kforlabel">Estado</label><select id="kfor" required><option value="">-</option>${UFS}</select><button id="kgo">ok</button></form>`);
  await clickOn(`document.getElementById('kforlabel')`);
  const byLabel = await evaluate(`document.activeElement === sel.search`);
  await clickOn(`document.getElementById('kgo')`);
  await wait(50);
  const bySubmit = await evaluate(`document.activeElement === sel.search`);
  /*
   * Corrige o campo, como faria quem viu o erro: escolhe um estado. E o `input`
   * do nativo que fecha o balao de validacao; no Firefox sem tela ele nao some
   * sozinho, e cobria o canto da pagina onde os testes seguintes clicavam.
   */
  await press('ArrowDown');
  await wait(80);
  await press('ArrowDown');
  await press('Enter');
  const fixed = await evaluate(`sel.native.value`);
  const name = await evaluate(`sel.search.getAttribute('aria-label')`);
  if (!wrapped[0] || !wrapped[1]) return `dentro do label: aberto ${wrapped[0]}, foco na busca ${wrapped[1]}`;
  if (!byLabel || !bySubmit) return `foco na busca: label ${byLabel}, submit ${bySubmit}`;
  if (!fixed) return 'escolher pelo teclado depois do submit não preencheu o nativo';
  return name === 'Estado' ? null : `nome acessível da busca "${name}"`;
});

const REMOTE = (delay) => `{ debounce: 30, loadOptions: (t, { page }) => { calls.push(t + ':' + page);
  return new Promise((ok) => setTimeout(() => ok([{ value: t, label: 'R ' + t }]), ${delay})); } }`;

testCase('select remoto: voltar ao termo que estava em voo busca de novo, sem travar em "Buscando..."', async () => {
  // O termo abortado ficava marcado como em voo, e digitá-lo de novo não pedia nada.
  await selMount('<select></select>', REMOTE(300));
  await evaluate(`sel.search.focus()`);
  await typeText('ab');
  await wait(120);
  await press('ControlOrMeta+a'); await press('Backspace');
  await typeText('ab');
  const ok = await waitFor(`sel.list.textContent === 'R ab'`, 1500);
  const r = await evaluate(`[sel.list.textContent, calls.join()]`);
  await closeSel();
  return ok ? null : `lista "${r[0]}", pedidos ${r[1]}`;
});

testCase('select remoto: resposta de busca abandonada não aparece — nem no debounce, nem ao reabrir', async () => {
  // A busca antiga voltava no intervalo do debounce do termo novo, e a pendente enchia a lista reaberta.
  await selMount('<select></select>', `{ debounce: 150, loadOptions: (t) => { calls.push(t); return new Promise((ok) => setTimeout(() => ok([{ value: t, label: 'R ' + t }]), 60)); } }`);
  await evaluate(`sel.search.focus()`);
  await typeText('ab');
  await wait(180);
  await typeText('c');
  await wait(90);
  const during = await selText();
  await wait(300);
  const final = await selText();
  await closeSel();
  await typeText('pa');
  await press('Escape');
  await press('ArrowDown');
  await wait(400);
  const reopened = await evaluate(`[sel.search.value, sel.list.textContent]`);
  await closeSel();
  if (during === 'R ab') return 'mostrou o resultado de "ab" com "abc" digitado';
  if (final !== 'R abc') return `resultado final "${final}"`;
  return reopened[1].includes('R pa') ? `lista reaberta com "${reopened[1]}" e busca "${reopened[0]}"` : null;
});

testCase('select remoto: rolar pagina sem voltar ao topo, para quando nada novo chega, e erro não apaga a lista', async () => {
  const bottom = `(() => { const l = sel.list; l.scrollTop = 0; l.scrollTop = l.scrollHeight; return l.scrollTop; })()`;
  // Paginação de verdade: a lista esvaziava para mostrar "Buscando..." e a rolagem voltava a 0.
  await selMount('<select></select>', `{ debounce: 0, loadOptions: (t, { page }) => { calls.push(page); return new Promise((ok) => setTimeout(() => ok({ next: page < 3 ? 'x' : null,
    results: Array.from({ length: 20 }, (_, i) => ({ value: page + '-' + i, label: 'C ' + page + '-' + i })) }), 40)); } }`);
  await evaluate(`sel.search.focus()`);
  await typeText('a');
  await waitFor(`sel.list.querySelectorAll('[role=option]').length === 20`);
  const before = await evaluate(bottom);
  await waitFor(`sel.list.querySelectorAll('[role=option]').length === 40`);
  const top = await evaluate(`sel.list.scrollTop`);
  // Servidor que ignora `page`: a mesma página voltava a cada rolagem, sem fim.
  await selMount('<select></select>', `{ debounce: 0, loadOptions: (t, { page }) => { calls.push(page); return Promise.resolve(Array.from({ length: 20 }, (_, i) => ({ value: 'v' + i, label: 'C ' + i }))); } }`);
  await evaluate(`sel.search.focus()`);
  await typeText('a');
  await waitFor(`sel.list.querySelectorAll('[role=option]').length === 20`);
  for (let k = 0; k < 5; k++) { await evaluate(bottom); await wait(60); }
  const ignored = await evaluate(`calls.length`);
  // Erro na página 2: a página 1 sumia atrás de "Falha ao buscar".
  await selMount('<select></select>', `{ debounce: 0, loadOptions: (t, { page }) => page > 1 ? Promise.reject(new Error('500'))
    : Promise.resolve({ next: 'x', results: Array.from({ length: 20 }, (_, i) => ({ value: '' + i, label: 'C ' + i })) }) }`);
  await evaluate(`sel.search.focus()`);
  await typeText('a');
  await waitFor(`sel.list.querySelectorAll('[role=option]').length === 20`);
  await evaluate(bottom);
  await wait(100);
  const afterError = await evaluate(`[sel.list.querySelectorAll('[role=option]').length, sel.list.textContent.includes('Falha')]`);
  await closeSel();
  if (top < before - 1) return `a rolagem voltou de ${before} para ${top}`;
  if (ignored > 2) return `servidor que ignora page recebeu ${ignored} pedidos`;
  return afterError[0] === 20 && !afterError[1] ? null : `depois do erro: ${afterError[0]} opções, falha na lista ${afterError[1]}`;
});

testCase('select remoto: termo vindo do cache continua paginando', async () => {
  // O cache não guardava se havia mais páginas; o termo herdava o "acabou" do último buscado.
  await selMount('<select></select>', `{ debounce: 0, loadOptions: (t, { page }) => { calls.push(t + ':' + page); const more = t === 'a';
    return Promise.resolve({ next: more && page < 3 ? 'x' : null, results: Array.from({ length: more ? 20 : 3 }, (_, i) => ({ value: t + page + '-' + i, label: t + ' ' + i })) }); } }`);
  await evaluate(`sel.search.focus()`);
  await typeText('a'); await wait(60);
  await press('Backspace'); await typeText('b'); await wait(60);
  await press('Backspace'); await typeText('a'); await wait(60);
  await evaluate(`(() => { const l = sel.list; l.scrollTop = l.scrollHeight; })()`);
  const ok = await waitFor(`calls.includes('a:2')`, 1000);
  const r = await evaluate(`calls.join()`);
  await closeSel();
  return ok ? null : `pedidos ${r}`;
});

testCase('select remoto: minChars 0 busca ao abrir; reset do formulário volta à opção inicial', async () => {
  // Com minChars 0 abria em "Nenhum resultado"; e o reset voltava o nativo a uma opção que a lista já não tinha.
  await selMount('<select></select>', `{ minChars: 0, debounce: 0, loadOptions: (t) => { calls.push(t); return Promise.resolve([{ value: '1', label: 'Um' }]); } }`);
  await evaluate(`sel.search.focus()`);
  await press('Enter');
  const opened = await waitFor(`sel.list.textContent === 'Um'`, 1000);
  await closeSel();
  await selMount('<form id="kreset"><select><option value="1" selected>Ana</option></select></form>', `{ debounce: 0, loadOptions: () => Promise.resolve([{ value: '2', label: 'Bruno' }]) }`);
  await evaluate(`sel.search.focus()`);
  await typeText('b');
  await waitFor(`sel.list.textContent.includes('Bruno')`);
  await press('Enter');
  await press('ArrowDown'); await press('Escape');
  await evaluate(`document.getElementById('kreset').reset()`);
  await wait(40);
  const r = await evaluate(`[sel.getValue(), sel.native.value, sel.control.textContent]`);
  if (!opened) return 'minChars 0 não buscou ao abrir';
  return r[0] === '1' && r[1] === '1' && r[2].includes('Ana') ? null : `reset: componente ${r[0]}, nativo ${r[1]}, tela "${r[2]}"`;
});

testCase('select: aria-activedescendant sai sem resultado e ao fechar; reescolher a mesma opção não dispara change', async () => {
  await selMount(`<select>${UFS.replace('value="SP"', 'value="SP" selected')}</select>`);
  await evaluate(`sel.search.focus()`);
  await typeText('zzz');
  const empty = await evaluate(`sel.search.getAttribute('aria-activedescendant')`);
  await press('Escape');
  const closed = await evaluate(`sel.search.getAttribute('aria-activedescendant')`);
  await evaluate(`changes = 0`);
  await press('Enter');
  await press('Enter');
  const r = await evaluate(`[changes, sel.isOpen, sel.getValue()]`);
  if (empty !== null || closed !== null) return `aria-activedescendant sem resultado "${empty}", fechado "${closed}"`;
  return r[0] === 0 && !r[1] && r[2] === 'SP' ? null : `change ${r[0]}, aberto ${r[1]}, valor ${r[2]}`;
});

testCase('select: refresh liga a busca quando as opções chegam depois; setValue com dois valores no simples fica com um', async () => {
  // Um select de cidades que nasce vazio ficava sem busca depois do HTMX; e o nativo postava um valor diferente do mostrado.
  await selMount('<select><option value="">Cidade</option></select>');
  await evaluate(`(() => { sel.native.innerHTML = '<option value="">Cidade</option>' + Array.from({ length: 50 }, (_, i) => '<option value="' + i + '">Cidade ' + i + '</option>').join(''); sel.refresh(); })()`);
  const search = await evaluate(`sel.search.readOnly`);
  await selMount(`<select>${UFS}</select>`);
  const r = await evaluate(`(() => { sel.setValue(['PR', 'SP']); return [sel.getValue(), sel.native.value]; })()`);
  if (search) return 'a busca continuou desligada depois do refresh';
  return r[0] === 'PR' && r[1] === 'PR' ? null : `componente ${r[0]}, nativo ${r[1]}`;
});

testCase('select: destroy devolve o campo ao init; <option value=""> em branco não apaga o placeholder', async () => {
  await selMount(`<select data-tuc-select data-tuc-ready><option value=""></option>${UFS}</select>`);
  const placeholder = await evaluate(`sel.search.placeholder`);
  const r = await evaluate(`(() => { sel.destroy(); Tucano.init(document.getElementById('selbox'));
    const s = document.querySelector('#selbox select'); window.sel = s._tucano; return [!!s._tucano, document.querySelectorAll('#selbox .tuc-select').length]; })()`);
  if (placeholder !== 'Selecione...') return `placeholder "${placeholder}"`;
  return r[0] && r[1] === 1 ? null : `depois do destroy: instância ${r[0]}, controles ${r[1]}`;
});

testCase('select: rótulo longo não passa da largura de um celular de 390px', async () => {
  // O menu media o rótulo mais longo e levava a página a rolar de lado.
  await tab().setViewportSize({ width: 390, height: 800 });
  try {
    await selMount('<select><option value="1">Curto</option><option value="2">fornecedor.de.materiais.de.construcao.muito.longo@empresa-exemplo.com.br</option></select>');
    await evaluate(`sel.search.focus()`);
    await press('Enter');
    await wait(50);
    const r = await evaluate(`[document.documentElement.scrollWidth, Math.round(sel.menu.getBoundingClientRect().right)]`);
    await closeSel();
    return r[0] <= 390 && r[1] <= 390 ? null : `página ${r[0]}px, menu termina em ${r[1]}px`;
  } finally {
    await tab().setViewportSize({ width: 1280, height: 900 });
  }
});

testCase('select: ponteiro parado sobre a lista não rouba o destaque da seta', async () => {
  // A seta rolava a lista por baixo do ponteiro, e o mouseenter (e o mousemove do WebKit) trocava o destaque.
  await selMount('<select>' + Array.from({ length: 40 }, (_, i) => `<option value="${i}">Item ${i}</option>`).join('') + '</select>');
  await evaluate(`sel.search.focus()`);
  await press('Enter');
  const [x, y] = await centerOf(`sel.list.querySelectorAll('[role=option]')[1]`);
  await tab().mouse.move(x, y);
  await wait(50);
  const start = await evaluate(`sel.activeIndex`);
  for (let k = 0; k < 15; k++) { await press('ArrowDown'); await wait(30); }
  await wait(100);
  const end = await evaluate(`sel.activeIndex`);
  await tab().mouse.move(0, 0);
  await closeSel();
  return end === start + 15 ? null : `de ${start}, 15 setas, parou em ${end}`;
});

testCase('select: clique no título do grupo e no X de limpar mantêm o foco na busca', async () => {
  // O título do grupo mandava o foco ao body com a lista aberta; o X some sem valor e levava o foco junto.
  await selMount('<select><optgroup label="Mensal"><option value="1">Um</option></optgroup><optgroup label="Anual"><option value="2" selected>Dois</option></optgroup></select>', '{ search: true }');
  await evaluate(`sel.search.focus()`);
  await press('Enter');
  await clickOn(`sel.list.querySelector('.tuc-select__group')`);
  const group = await evaluate(`[sel.isOpen, document.activeElement === sel.search]`);
  await closeSel();
  await clickOn(`sel.clearBtn`);
  const clear = await evaluate(`[sel.getValue(), document.activeElement === sel.search]`);
  if (!group[1]) return `título do grupo: aberto ${group[0]}, foco na busca ${group[1]}`;
  return clear[0] === null && clear[1] ? null : `X: valor ${clear[0]}, foco na busca ${clear[1]}`;
});

testCase('select múltiplo: Backspace pula tag desativada; <optgroup disabled> não se escolhe', async () => {
  await selMount('<select multiple><option value="1" selected>Um</option><option value="2" selected disabled>Dois</option></select>');
  await evaluate(`sel.search.focus()`);
  await press('Backspace');
  const tags = await evaluate(`sel.getValue().join()`);
  await selMount('<select><option value="">-</option><optgroup label="Esgotado" disabled><option value="x">Item X</option></optgroup><option value="y">Item Y</option></select>');
  await evaluate(`sel.search.focus()`);
  await press('Enter');
  await clickOn(`sel.list.querySelector('[role=option]')`);
  const r = await evaluate(`[sel.getValue(), sel.native.value, sel.list.querySelector('[role=option]').getAttribute('aria-disabled')]`);
  await closeSel();
  if (tags !== '2') return `Backspace deixou "${tags}"`;
  return r[0] === null && r[1] === '' && r[2] === 'true' ? null : `optgroup desativado: componente ${r[0]}, nativo "${r[1]}", aria-disabled ${r[2]}`;
});

testCase('menu do botão direito: abre no ponto do clique, com os itens da linha', async () => {
  await evaluate(`mkCtx()`);
  const [x, y] = await centerOf(`document.getElementById('ctxrow2')`);
  await tab().mouse.click(x, y, { button: 'right' });
  /*
   * Espera a instancia abrir, e nao um `.tuc-dropdown` no documento: o painel do
   * caso anterior ainda esta saindo do DOM e dava o teste por aberto sozinho.
   * A segunda tentativa e do WebKit do Playwright, que de vez em quando move o
   * foco com o clique direito mas nao emite o `contextmenu`.
   */
  if (!await waitFor(`!!ctx.isOpen`, 800)) await tab().mouse.click(x, y, { button: 'right' });
  if (!await waitFor(`!!ctx.isOpen`)) return 'o menu não abriu';
  /*
   * Distancia do ponteiro ate a caixa do menu, e nao a posicao do canto: perto
   * da borda de baixo o popover vira o painel para cima, e ai o canto fica bem
   * acima do ponto — continua nascendo no ponteiro, que e o que se confere.
   */
  const r = await evaluate(`(() => { const p = document.querySelector('.tuc-dropdown').getBoundingClientRect();
    const dx = Math.max(p.left - ${Math.round(x)}, ${Math.round(x)} - p.right, 0);
    const dy = Math.max(p.top - ${Math.round(y)}, ${Math.round(y)} - p.bottom, 0);
    return { gap: Math.round(Math.max(dx, dy)),
      label: document.querySelector('.tuc-dropdown__label').textContent.trim(),
      highlighted: !!document.querySelector('.tuc-dropdown__item:focus') }; })()`);
  await press('ArrowDown');
  const first = await evaluate(`document.activeElement.textContent.trim()`);
  await press('Enter');
  const picked = await evaluate(`picked.join()`);
  const back = await evaluate(`document.activeElement.id`);
  // O painel nasce colado no ponto, com o respiro de 6px do popover.
  if (r.gap > 24) return `painel a ${r.gap}px do ponteiro`;
  if (r.label !== 'Oficina Duas Rodas') return `título "${r.label}"`;
  /*
   * Aberto pelo ponteiro, nada nasce aceso: so a primeira seta destaca. Confere
   * o comportamento, e nao onde o foco esta: no Safari ele as vezes volta para a
   * linha clicada, e o menu tem de seguir andando pelas setas mesmo assim.
   */
  if (r.highlighted) return 'um item já nasceu aceso';
  if (first !== 'Editar') return `a primeira seta acendeu "${first}"`;
  if (picked !== 'editar:ctxrow2') return `escolheu "${picked}"`;
  return back === 'ctxrow2' ? null : `foco voltou para "${back}"`;
});

testCase('menu do botão direito: a tecla de menu abre no alvo com foco, e o Esc devolve', async () => {
  // Sem ela, o que só existe neste menu fica inalcançável para quem não usa mouse.
  await evaluate(`mkCtx(); document.getElementById('ctxrow1').focus()`);
  await press('ContextMenu');
  const byKey = await evaluate(`[!!ctx.isOpen, ctx.target && ctx.target.id, document.activeElement.textContent.trim()]`);
  await press('Escape');
  const back = await evaluate(`document.activeElement.id`);
  if (!byKey[0] || byKey[1] !== 'ctxrow1') return `aberto ${byKey[0]}, alvo ${byKey[1]}`;
  // Pelo teclado o primeiro item já vem destacado: quem pediu o menu quer andar por ele.
  if (byKey[2] !== 'Editar') return `foco em "${byKey[2]}"`;
  return back === 'ctxrow1' ? null : `Esc devolveu o foco para "${back}"`;
});

testCase('menu do botão direito: Shift+F10 abre no alvo com foco', async () => {
  await evaluate(`mkCtx(); document.getElementById('ctxrow2').focus()`);
  await tab().keyboard.press('Shift+F10');
  const r = await evaluate(`[!!ctx.isOpen, ctx.target && ctx.target.id]`);
  await evaluate(`void ctx.close()`);
  return r[0] && r[1] === 'ctxrow2' ? null : `aberto ${r[0]}, alvo ${r[1]}`;
}, { skip: { webkit: 'Shift+F10 é convenção de Windows; no macOS o Safari não a entrega, e o WebKit do Playwright só às vezes' } });

/* Um navegador: uma pagina, os casos em ordem, a saida guardada para imprimir junta. */
async function run(name) {
  const lines = [];
  let failures = 0, passed = 0, skipped = 0;
  const { browser, page: tabPage } = await openPage(name);
  try {
    /*
     * setContent, e nao goto de um arquivo: o goto deixa about:blank no
     * historico, e no WebKit do Playwright Backspace fora de campo editavel e
     * "voltar" — o caso do select sem o X, com a busca readOnly, levava a pagina
     * embora e derrubava todos os seguintes. O Safari de verdade nao faz isso
     * desde a versao 12; sem historico, a tecla nao tem para onde voltar.
     */
    await tabPage.setContent(page);
    await current.run({ page: tabPage }, async () => {
      for (const c of CASES) {
        if (c.skip[name]) { lines.push(`  pulado no ${name}: ${c.name}\n         ${c.skip[name]}`); skipped++; continue; }
        try {
          const error = await c.fn();
          if (error) { lines.push(`  FALHA  ${c.name}\n         ${error}`); failures++; }
          else { lines.push(`  ok     ${c.name}`); passed++; }
        } catch (e) {
          lines.push(`  FALHA  ${c.name}\n         ${e.message.split('\n')[0]}`); failures++;
        }
      }
    });
  } catch (e) {
    lines.push(`  FALHA  ${e.message}`); failures++;
  } finally {
    await browser.close();
  }
  return { name, lines, failures, passed, skipped };
}

const results = await Promise.all(BROWSERS.map(run));
for (const r of results) console.log(`\n[${r.name}]\n${r.lines.join('\n')}`);
console.log('\n' + results.map((r) => `${r.name}: ${r.failures ? `${r.failures} falha(s), ` : ''}`
  + `${r.passed} caminhos de teclado verificados${r.skipped ? `, ${r.skipped} pulado(s)` : ''}`).join(' · '));
process.exit(results.some((r) => r.failures) ? 1 : 0);
