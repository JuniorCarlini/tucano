#!/usr/bin/env node
/*
 * Teste de comportamento, no navegador de verdade.
 *
 * O `audit` mede geometria; este mede o que o componente faz — abrir,
 * fechar, ordenar, marcar, emitir evento. Ate existir, este teste era uma sonda
 * escrita, rodada uma vez e apagada; foi reescrito umas dez vezes numa sessao
 * so, e cada reescrita perdia os casos da anterior.
 *
 * Roda no Chrome sem cabeca porque metade do que interessa nao existe fora dele:
 * <dialog>, top layer, execCommand, DOMParser, transicao.
 *
 * ARMADILHA: transicao nao avanca aqui. Nunca leia opacidade, posicao ou cor
 * logo depois de abrir algo — o valor lido e o do primeiro quadro. Onde o
 * estado final importa, a pagina injeta `transition: none`.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFileSync, unlinkSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { exigirChrome } from './chrome.mjs';

const exec = promisify(execFile);

const CHROME = exigirChrome('behavior');

const pagina = () => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<style>${readFileSync('dist/tucano.css', 'utf8')}
body{margin:0;padding:16px;font-family:system-ui}
*{transition:none!important;animation:none!important}</style></head><body>
<input data-tuc-datepicker id="d" name="quando">
<input data-tuc-datepicker id="dr" data-mode="range">
<select data-tuc-select multiple id="s" name="uf"><option selected>SP</option><option>RJ</option></select>
<input data-tuc-color id="c" value="#4f46e5">
<input data-tuc-mask="cpf-cnpj" id="m" name="doc">
<input data-tuc-mask="real" id="m2">
<input data-tuc-reveal type="password" id="rv" value="segredo">
<input type="file" data-tuc-upload id="u">
<textarea data-tuc-editor id="ed"><pre><code>const x = 1;</code></pre></textarea>
<div data-tuc-accordion id="ac"><details><summary>Um</summary><p>a</p></details><details><summary>Dois</summary><p>b</p></details></div>
<div class="tuc-tabs" data-tuc-tabs id="tb"><div class="tuc-tabs__list">
  <button class="tuc-tabs__tab" aria-selected="true">A</button><button class="tuc-tabs__tab">B</button><button class="tuc-tabs__tab" disabled>C</button></div>
  <div class="tuc-tabs__panel"><input id="tbin"></div><div class="tuc-tabs__panel" hidden>b</div><div class="tuc-tabs__panel" hidden>c</div></div>
<form id="tbform" onsubmit="window.__enviou = true; return false"><div class="tuc-tabs" data-tuc-tabs><div class="tuc-tabs__list">
  <button class="tuc-tabs__tab" aria-selected="true">X</button><button class="tuc-tabs__tab">Y</button></div>
  <div class="tuc-tabs__panel">x</div><div class="tuc-tabs__panel" hidden>y</div></div></form>
<nav class="tuc-menu" id="mn"><a class="tuc-menu__item" href="#">Item</a></nav>
<button class="tuc-btn" data-tuc-dropdown="#dd" id="bd">Ações</button>
<div class="tuc-dropdown" id="dd" hidden><button class="tuc-dropdown__item"><span class="tuc-dropdown__text">Editar</span></button></div>
<button data-tuc-tip="dica" id="tp">tip</button>
<table data-tuc-table data-selectable data-sort-mode="client" id="t">
  <thead><tr><th data-sort="text" data-field="n">N</th></tr></thead>
  <tbody><tr data-id="2"><td>Zé</td></tr><tr data-id="1"><td>Ana</td></tr></tbody></table>
<table data-tuc-table id="tsrv"><thead><tr><th data-sort="text" data-field="nome">N</th></tr></thead><tbody><tr><td>Ana</td></tr></tbody></table>
<div data-tuc-pagination data-page="2" data-pages="9" id="pg"></div>
<span class="tuc-badge is-success" id="bg">ok</span>
<input type="checkbox" class="tuc-check" id="ck">
<label class="tuc-choice" id="chl"><input type="radio" class="tuc-radio" name="r" id="rd"> Um</label>
<input type="checkbox" role="switch" class="tuc-switch" id="sw">
<style>.hostil label{display:block;margin-bottom:8px;font-weight:600}</style>
<div class="hostil"><label class="tuc-choice" id="chh"><input type="checkbox" class="tuc-check"> Dentro de um card</label></div>
<div class="tuc-prose" id="pr"><pre><code>npm run build // teste</code></pre></div>
<pre id="resultado"></pre>
<script>${readFileSync('dist/tucano.js', 'utf8')}</script>
<script>
(function () {
  var out = {}, erros = [];
  addEventListener('error', function (e) { erros.push(String(e.message)); });
  function t(nome, fn) { try { fn(); out[nome] = 'ok'; } catch (e) { out[nome] = 'ERRO: ' + e.message; } }
  function limpar() { document.querySelectorAll('dialog').forEach(function (n) { n.remove(); }); }
  function svg(sel) { if (!document.querySelector(sel + ' svg path[d]')) throw new Error('sem ícone em ' + sel); }

  Tucano.init(document);

  t('datepicker abre e guarda o valor', function () {
    var i = document.getElementById('d')._tucano;
    i.open(); svg('.tuc-dp'); i.setValue('2026-09-07');
    if (i.getValue() === null) throw new Error('sem valor');
    if (!document.querySelector('input[type=hidden][name=quando]')) throw new Error('sem hidden ISO');
    i.close();
  });
  t('datepicker período', function () {
    var i = document.getElementById('dr')._tucano;
    i.open(); if (!document.querySelector('.tuc-dp.is-range')) throw new Error('sem is-range'); i.close();
  });
  t('select lista, filtra e devolve array', function () {
    var i = document.getElementById('s')._tucano;
    i.open();
    if (document.querySelectorAll('.tuc-select__option').length !== 2) throw new Error('opções');
    i.setValue(['SP', 'RJ']);
    if (i.getValue().length !== 2) throw new Error('multiple devia devolver array');
    i.close();
  });
  t('select mantém o <select> nativo como dono do valor', function () {
    var nativo = document.getElementById('s');
    if (!nativo.isConnected) throw new Error('o nativo sumiu');
    if ([].filter.call(nativo.options, function (o) { return o.selected; }).length !== 2) throw new Error('o nativo não acompanhou');
  });
  t('colorpicker abre e converte', function () {
    var i = document.getElementById('c')._tucano;
    i.open(); if (!document.querySelector('.tuc-colorpicker__area')) throw new Error('sem área');
    i.setValue('#16a34a'); if (i.getValue().toLowerCase() !== '#16a34a') throw new Error(i.getValue());
    i.close();
  });
  t('máscara formata enquanto digita', function () {
    var e = document.getElementById('m'); e.focus(); e.value = '12345678901';
    e.dispatchEvent(new Event('input', { bubbles: true }));
    if (e.value !== '123.456.789-01') throw new Error(e.value);
  });
  t('máscara alterna CPF → CNPJ pelo tamanho', function () {
    var e = document.getElementById('m'); e.focus(); e.value = '11222333000181';
    e.dispatchEvent(new Event('input', { bubbles: true }));
    if (e.value !== '11.222.333/0001-81') throw new Error(e.value);
  });
  t('máscara de moeda', function () {
    var e = document.getElementById('m2'); e.focus(); e.value = '12345';
    e.dispatchEvent(new Event('input', { bubbles: true }));
    if (e.value.indexOf('R$') < 0) throw new Error(e.value);
  });
  t('placeholder sai do gabarito', function () {
    if (document.getElementById('m').placeholder !== '000.000.000-00') throw new Error('sem placeholder');
  });
  t('campo sensível ganha o olho', function () { svg('.tuc-field__eye'); });
  t('upload monta a zona', function () { svg('.tuc-upload'); });
  t('editor monta a barra e pinta o código', function () {
    if (document.querySelectorAll('.tuc-editor__toolbar button').length < 10) throw new Error('barra curta');
    if (!document.querySelector('.tuc-editor__area pre code span[class^="tuc-tok-"]')) throw new Error('sem cor');
  });
  t('editor mantém o textarea como dono do valor', function () {
    var ta = document.getElementById('ed');
    if (!ta.isConnected) throw new Error('o textarea sumiu');
  });
  t('acordeão abre e fecha', function () {
    var i = document.getElementById('ac')._tucano;
    svg('.tuc-accordion__arrow');
    var item = document.querySelectorAll('#ac details')[0];
    i.open(item); if (!item.open) throw new Error('não abriu');
    i.close(item);
  });
  t('abas ligam aba e painel pelos papéis', function () {
    var abas = document.querySelectorAll('#tb .tuc-tabs__tab'), paineis = document.querySelectorAll('#tb .tuc-tabs__panel');
    if (document.querySelector('#tb .tuc-tabs__list').getAttribute('role') !== 'tablist') throw new Error('sem tablist');
    [].forEach.call(abas, function (a, i) {
      if (a.getAttribute('role') !== 'tab') throw new Error('aba ' + i + ' sem role');
      if (a.getAttribute('aria-controls') !== paineis[i].id) throw new Error('aba ' + i + ' não aponta o painel');
      if (paineis[i].getAttribute('aria-labelledby') !== a.id) throw new Error('painel ' + i + ' sem nome');
    });
    if (abas[0].tabIndex !== 0 || abas[1].tabIndex !== -1) throw new Error('Tab devia parar só na aba aberta');
    // Painel com campo dentro não vira parada extra do Tab; sem nada, vira.
    if (paineis[0].hasAttribute('tabindex')) throw new Error('painel com campo ganhou tabindex');
    if (paineis[1].tabIndex !== 0) throw new Error('painel sem foco possível ficou fora do Tab');
  });
  t('clicar numa aba troca o painel e emite change', function () {
    var no = document.getElementById('tb'), visto = null;
    var ouvir = function (e) { visto = e.detail; };
    no.addEventListener('tucano:change', ouvir);
    no.querySelectorAll('.tuc-tabs__tab')[1].click();
    no.removeEventListener('tucano:change', ouvir);
    var paineis = no.querySelectorAll('.tuc-tabs__panel');
    if (!paineis[0].hidden || paineis[1].hidden) throw new Error('painel não trocou');
    if (!visto || visto.value !== 1 || visto.panel !== paineis[1]) throw new Error('evento: ' + JSON.stringify(visto && visto.value));
  });
  t('aba desativada não abre', function () {
    var i = document.getElementById('tb')._tucano;
    i.select(2);
    if (i.index !== 1) throw new Error('abriu a desativada');
    i.select(0);
  });
  t('aba dentro de formulário não envia o formulário', function () {
    document.querySelectorAll('#tbform .tuc-tabs__tab')[1].click();
    if (window.__enviou) throw new Error('enviou');
  });
  t('dropdown abre, foca o item e devolve o foco', function () {
    var g = document.getElementById('bd')._tucano;
    // O gatilho precisa estar na tela, como quando alguém clica nele. Fora dela o
    // Popover fecha o menu no primeiro reposicionamento (closeIfDetached), e foi
    // isso que as abas acrescentadas acima fizeram: empurraram #bd para 838px
    // numa janela de 813, e o teste passou a acusar "foco não voltou".
    document.getElementById('bd').scrollIntoView({ block: 'center' });
    g.open();
    if (!document.querySelector('.tuc-dropdown__item')) throw new Error('sem item');
    if (!document.activeElement.classList.contains('tuc-dropdown__item')) throw new Error('foco não entrou');
    g.close();
    if (document.activeElement !== document.getElementById('bd')) throw new Error('foco não voltou');
  });
  t('modal abre com tom, rótulo e classes', function () {
    limpar();
    var m = Tucano.modal({ title: 'Oi', text: 'x', tone: 'danger', actions: [{ text: 'Ok' }] });
    if (!document.querySelector('.tuc-modal.is-danger .tuc-modal__panel')) throw new Error('classes');
    if (document.querySelector('.tuc-modal__footer .tuc-btn').textContent.trim() !== 'Ok') throw new Error('rótulo vazio');
    m.close(); limpar();
  });
  t('confirmar devolve promessa e rotula o botão', function () {
    limpar();
    Tucano.confirm({ title: 'X', confirm: 'Excluir' });
    var b = [].map.call(document.querySelectorAll('.tuc-modal__footer .tuc-btn'), function (x) { return x.textContent.trim(); });
    if (b.join(',') !== 'Cancelar,Excluir') throw new Error(b.join(','));
    limpar();
  });
  t('gaveta abre no lado e no tamanho pedidos', function () {
    limpar();
    var g = Tucano.drawer({ title: 'F', side: 'right', size: 'lg' });
    if (!document.querySelector('.tuc-drawer.is-right.is-lg .tuc-drawer__panel')) throw new Error('classes');
    g.close(); limpar();
  });
  t('toast aparece na posição pedida', function () {
    var x = Tucano.toast({ type: 'success', text: 'ok', position: 'bottom-end' });
    if (!document.querySelector('.tuc-toasts.is-bottom-end .tuc-toast.is-success')) throw new Error('posição ou tom');
    x.close();
  });
  t('tooltip aparece no foco', function () {
    document.getElementById('tp').dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    if (!document.querySelector('.tuc-tip__arrow')) throw new Error('sem seta');
  });
  t('tabela ordena no cliente quando pedido', function () {
    document.querySelector('#t .tuc-table__sortbtn').click();
    if (document.querySelectorAll('#t tbody tr')[0].cells[1].textContent !== 'Ana') throw new Error('não ordenou');
  });
  t('tabela em modo servidor é link, e não reordena', function () {
    var a = document.querySelector('#tsrv .tuc-table__sortbtn');
    if (a.tagName !== 'A') throw new Error('devia ser <a>, é ' + a.tagName);
    if (a.getAttribute('href').indexOf('sort=nome') < 0) throw new Error(a.getAttribute('href'));
  });
  t('seleção em massa marca tudo e chega no formulário', function () {
    var tb = document.getElementById('t')._tucano;
    document.querySelector('#t thead .tuc-check').click();
    if (tb.getSelected().length !== 2) throw new Error('marcou ' + tb.getSelected().length);
    var todas = document.querySelectorAll('#t tbody .tuc-check');
    todas[0].click();
    if (!document.querySelector('#t thead .tuc-check').indeterminate) throw new Error('sem estado misto');
    tb.clearSelection();
    if (tb.getSelected().length !== 0) throw new Error('não limpou');
  });
  t('paginação monta os botões do sistema', function () {
    var bs = document.querySelectorAll('#pg .tuc-btn');
    if (bs.length < 5) throw new Error('só ' + bs.length + ' botões');
    if (document.querySelector('#pg .tuc-btn.is-outline').textContent.trim() !== '2') throw new Error('página atual errada');
  });
  t('caixa de seleção é desenhada, não a do sistema', function () {
    if (getComputedStyle(document.getElementById('ck')).appearance !== 'none') throw new Error('nativa');
  });
  t('opção e chave também são desenhadas', function () {
    ['rd', 'sw'].forEach(function (id) {
      if (getComputedStyle(document.getElementById(id)).appearance !== 'none') throw new Error(id + ' nativa');
    });
  });
  t('clicar no texto do rótulo marca a opção', function () {
    document.getElementById('chl').click();
    if (!document.getElementById('rd').checked) throw new Error('não marcou');
  });
  t('chave desliza o botão ao ligar', function () {
    var sw = document.getElementById('sw');
    var antes = getComputedStyle(sw, '::after').translate;
    sw.click();
    var depois = getComputedStyle(sw, '::after').translate;
    if (antes === depois) throw new Error('translate ficou ' + depois);
    sw.click();
  });
  t('aria-invalid pinta a borda de erro, inclusive nos controles montados', function () {
    // O atributo fica no nativo; a borda tem de aparecer no que a pessoa vê.
    var perigo = document.createElement('span');
    perigo.style.color = 'var(--tuc-danger)';
    document.body.append(perigo);
    var cor = getComputedStyle(perigo).color;
    perigo.remove();
    var alvos = {
      'campo de texto': [document.getElementById('m'), document.getElementById('m')],
      'select': [document.getElementById('s'), document.getElementById('s').nextElementSibling],
      'campo de cor': [document.getElementById('c'), document.getElementById('c').closest('.tuc-color-field')],
      'editor': [document.getElementById('ed'), document.getElementById('ed').closest('.tuc-editor')],
    };
    Object.keys(alvos).forEach(function (nome) {
      var nativo = alvos[nome][0], visto = alvos[nome][1];
      if (getComputedStyle(visto).borderTopColor === cor) throw new Error(nome + ' já nasceu vermelho');
      nativo.setAttribute('aria-invalid', 'true');
      var borda = getComputedStyle(visto).borderTopColor;
      nativo.removeAttribute('aria-invalid');
      if (borda !== cor) throw new Error(nome + ': borda ' + borda + ', esperado ' + cor);
    });
  });
  t('select nativo com tuc-input tem a altura e a cara do campo', function () {
    var s = document.createElement('select');
    s.className = 'tuc-input';
    s.innerHTML = '<option>Um</option>';
    document.body.append(s);
    var c = getComputedStyle(s), ref = getComputedStyle(document.getElementById('m'));
    var ok = c.appearance === 'none' && c.height === ref.height && c.borderTopLeftRadius === ref.borderTopLeftRadius;
    var msg = c.appearance + ' ' + c.height + ' ' + c.borderTopLeftRadius;
    s.remove();
    if (!ok) throw new Error(msg);
  });
  t('rótulo resiste ao CSS de label do projeto', function () {
    // .hostil label pesa 0,1,1 e declara display, margem e peso: é o que a
    // própria página de docs faz com .card label.
    var c = getComputedStyle(document.getElementById('chh'));
    if (c.display.indexOf('flex') < 0) throw new Error('display ' + c.display);
    if (c.marginBottom !== '0px') throw new Error('margem ' + c.marginBottom);
    if (c.fontWeight !== '400') throw new Error('peso ' + c.fontWeight);
  });
  t('prosa pinta o código e ganha copiar', function () {
    if (!document.querySelector('#pr code span[class^="tuc-tok-"]')) throw new Error('sem cor');
    var b = document.querySelector('#pr .tuc-copy');
    if (!b) throw new Error('sem botão');
    if (!b.classList.contains('tuc-btn')) throw new Error('não é o botão do sistema');
  });
  t('sanitize corta script, evento e href perigoso', function () {
    var s = Tucano.sanitize;
    if (s('<p onclick="x()">oi</p>').indexOf('onclick') >= 0) throw new Error('passou onclick');
    if (s('<script>1<\\/script>').indexOf('script') >= 0) throw new Error('passou script');
    if (s('<a href="javascript:alert(1)">x</a>').indexOf('javascript:') >= 0) throw new Error('passou javascript:');
    if (s('<div><b>oi</b></div>').indexOf('<div') >= 0) throw new Error('div devia ser dissolvida');
    // <b> e <i> viram <strong> e <em> de propósito: a peneira normaliza para a
    // tag com significado, e não só com aparência.
    if (s('<b>oi</b>') !== '<strong>oi</strong>') throw new Error('esperado <strong>, veio ' + s('<b>oi</b>'));
    if (s('<i>oi</i>') !== '<em>oi</em>') throw new Error('esperado <em>, veio ' + s('<i>oi</i>'));
  });
  t('sanitize preserva o alinhamento, que é o único estilo aceito', function () {
    var r = Tucano.sanitize('<p style="text-align:center;color:red">oi</p>');
    if (r.indexOf('center') < 0) throw new Error('perdeu o alinhamento');
    if (r.indexOf('red') >= 0) throw new Error('passou cor');
  });
  t('eventos trazem o formato documentado', function () {
    var visto = {};
    document.addEventListener('tucano:change', function (e) { visto.change = Object.keys(e.detail).join(','); });
    document.addEventListener('tuc:sort', function (e) { visto.sort = Object.keys(e.detail).join(','); });
    document.getElementById('c')._tucano.setValue('#000000');
    document.querySelector('#t .tuc-table__sortbtn').click();
    // Cada componente acrescenta o que so ele sabe: o color picker manda rgb e
    // hsva junto, para nao obrigar a converter de novo do lado de fora.
    if (visto.change !== 'value,rgb,hsva,instance') throw new Error('change: ' + visto.change);
    if (visto.sort !== 'column,field,direction') throw new Error('sort: ' + visto.sort);
  });
  t('init é idempotente: rodar de novo não duplica nada', function () {
    var antes = document.querySelectorAll('.tuc-editor__toolbar').length;
    Tucano.init(document);
    if (document.querySelectorAll('.tuc-editor__toolbar').length !== antes) throw new Error('duplicou');
  });

  out.__erros = erros;
  document.getElementById('resultado').textContent = JSON.stringify(out);
})();
</script></body></html>`;

const arquivo = join(tmpdir(), `tucano-testar-${process.pid}.html`);
writeFileSync(arquivo, pagina());
try {
  const { stdout } = await exec(CHROME, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars',
    '--window-size=1280,900', '--virtual-time-budget=6000',
    '--dump-dom', `file://${arquivo}`,
  ], { maxBuffer: 60 * 1024 * 1024 });
  const m = stdout.match(/<pre id="resultado">([\s\S]*?)<\/pre>/);
  if (!m || !m[1].trim()) throw new Error('a página de teste não produziu resultado');
  const r = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
  const erros = r.__erros; delete r.__erros;

  let falhas = 0;
  for (const [nome, valor] of Object.entries(r)) {
    console.log(`  ${valor === 'ok' ? 'ok    ' : 'FALHA '} ${nome}${valor === 'ok' ? '' : '  ' + valor}`);
    if (valor !== 'ok') falhas++;
  }
  if (erros.length) { console.log(`  FALHA  erro de console: ${erros.join(' | ')}`); falhas++; }
  console.log(falhas ? `\n${falhas} de ${Object.keys(r).length} com problema` : `\n${Object.keys(r).length} comportamentos verificados`);
  process.exit(falhas ? 1 : 0);
} finally {
  unlinkSync(arquivo);
}
