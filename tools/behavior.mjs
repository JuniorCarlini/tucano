#!/usr/bin/env node
/*
 * Teste de comportamento, no navegador de verdade.
 *
 * O `audit` mede geometria; este mede o que o componente faz — abrir,
 * fechar, ordenar, marcar, emitir evento. Ate existir, este teste era uma sonda
 * escrita, rodada uma vez e apagada; foi reescrito umas dez vezes numa sessao
 * so, e cada reescrita perdia os casos da anterior.
 *
 * Roda num navegador de verdade porque metade do que interessa nao existe fora
 * dele: <dialog>, top layer, execCommand, DOMParser, transicao. E roda nos tres
 * motores — Chromium, Firefox e WebKit — pelo Playwright (tools/browsers.mjs):
 * a mesma pagina, os mesmos casos, um resultado por navegador.
 *
 * A pagina roda sozinha e escreve o resultado em <pre id="result">; o teste
 * espera esse bloco ser preenchido, e nao um tempo fixo.
 *
 * ARMADILHA: nunca leia opacidade, posicao ou cor logo depois de abrir algo —
 * o valor lido pode ser o do primeiro quadro. Por isso a pagina injeta
 * `transition: none` em tudo.
 */
import { writeFileSync, unlinkSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { selectedBrowsers, openPage } from './browsers.mjs';

const BROWSERS = selectedBrowsers('behavior');

const page = () => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<style>${readFileSync('dist/tucano.css', 'utf8')}
body{margin:0;padding:16px;font-family:system-ui}
*{transition:none!important;animation:none!important}</style></head><body>
<input data-tuc-datepicker id="d" name="when">
<input data-tuc-datepicker id="dr" data-mode="range">
<select data-tuc-select multiple id="s" name="uf"><option selected>SP</option><option>RJ</option></select>
<input data-tuc-color id="c" value="#4f46e5">
<input data-tuc-mask="cpf-cnpj" id="m" name="doc">
<input data-tuc-mask="brl" id="m2">
<input data-tuc-reveal type="password" id="rv" value="segredo">
<input type="file" data-tuc-upload id="u">
<textarea data-tuc-editor id="ed"><pre><code>const x = 1;</code></pre></textarea>
<div data-tuc-accordion id="ac"><details><summary>Um</summary><p>a</p></details><details><summary>Dois</summary><p>b</p></details></div>
<div class="tuc-tabs" data-tuc-tabs id="tb"><div class="tuc-tabs__list">
  <button class="tuc-tabs__tab" aria-selected="true">A</button><button class="tuc-tabs__tab">B</button><button class="tuc-tabs__tab" disabled>C</button></div>
  <div class="tuc-tabs__panel"><input id="tbin"></div><div class="tuc-tabs__panel" hidden>b</div><div class="tuc-tabs__panel" hidden>c</div></div>
<form id="tbform" onsubmit="window.__submitted = true; return false"><div class="tuc-tabs" data-tuc-tabs><div class="tuc-tabs__list">
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
<style>.hostile label{display:block;margin-bottom:8px;font-weight:600}</style>
<div class="hostile"><label class="tuc-choice" id="chh"><input type="checkbox" class="tuc-check"> Dentro de um card</label></div>
<ol class="tuc-timeline" id="tl"><li class="tuc-timeline__item is-success"><div class="tuc-timeline__head"><span class="tuc-timeline__title">A</span></div></li><li class="tuc-timeline__item"><div class="tuc-timeline__head"><span class="tuc-timeline__title">B</span></div></li></ol>
<div class="tuc-prose" id="pr"><pre><code>npm run build // teste</code></pre></div>
<pre id="result"></pre>
<script>${readFileSync('dist/tucano.js', 'utf8')}</script>
<script>
(function () {
  var out = {}, errors = [];
  addEventListener('error', function (e) { errors.push(String(e.message)); });
  function t(name, fn) { try { fn(); out[name] = 'ok'; } catch (e) { out[name] = 'ERRO: ' + e.message; } }
  function removeDialogs() { document.querySelectorAll('dialog').forEach(function (n) { n.remove(); }); }
  function svg(sel) { if (!document.querySelector(sel + ' svg path[d]')) throw new Error('sem ícone em ' + sel); }

  Tucano.init(document);

  t('datepicker abre e guarda o valor', function () {
    var i = document.getElementById('d')._tucano;
    i.open(); svg('.tuc-dp'); i.setValue('2026-09-07');
    if (i.getValue() === null) throw new Error('sem valor');
    if (!document.querySelector('input[type=hidden][name=when]')) throw new Error('sem hidden ISO');
    i.close();
  });
  t('datepicker período', function () {
    var i = document.getElementById('dr')._tucano;
    // Lido no painel desta instância: a classe is-range saiu, porque CSS nenhum a lia.
    i.open(); var months = i.panel.querySelectorAll('.tuc-dp__month').length; i.close();
    if (!i.isRange || months !== 2) throw new Error('período com ' + months + ' mês(es)');
  });
  t('período digitado aceita a, até, travessão e hífen entre espaços — e só eles', function () {
    // Eram duas expressões: uma aceitava "aa" por acidente, e as duas cortavam no
    // hífen de dentro da data, então "25-12-2025 a 31-12-2025" virava 25 — 12.
    var box = document.createElement('div');
    box.innerHTML = '<input data-tuc-datepicker data-mode="range">';
    document.body.append(box);
    Tucano.init(box);
    var field = box.querySelector('input'), i = field._tucano;
    var day = function (d) { return d ? d.getDate() + '/' + (d.getMonth() + 1) : 'nada'; };
    var cases = [
      ['01/03/2026 a 15/03/2026', '1/3', '15/3'],
      ['01/03/2026 até 15/03/2026', '1/3', '15/3'],
      ['01/03/2026 - 15/03/2026', '1/3', '15/3'],
      ['01/03/2026–15/03/2026', '1/3', '15/3'],
      ['01/03/2026 — 15/03/2026', '1/3', '15/3'],
      ['25-12-2025 a 31-12-2025', '25/12', '31/12'],
      // Sem separador válido não há fim, e período sem fim é recusado inteiro.
      ['01/03/2026 aa 15/03/2026', 'nada', 'nada'],
    ];
    var wrong = [];
    cases.forEach(function (c) {
      i.clear({ silent: true });
      field.value = c[0];
      field.dispatchEvent(new Event('change', { bubbles: true }));
      var got = day(i.start) + ' ' + day(i.end);
      if (got !== c[1] + ' ' + c[2]) wrong.push('"' + c[0] + '" → ' + got);
    });
    box.remove();
    if (wrong.length) throw new Error(wrong.join(' | '));
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
    var nativeSelect = document.getElementById('s');
    if (!nativeSelect.isConnected) throw new Error('o nativo sumiu');
    if ([].filter.call(nativeSelect.options, function (o) { return o.selected; }).length !== 2) throw new Error('o nativo não acompanhou');
  });
  t('select: escolher dispara input e depois change no nativo, como o <select> do navegador', function () {
    // So o change saia: hx-trigger="input" nunca disparava, e o balao de
    // validacao do Firefox nao fechava quando a pessoa escolhia a opcao.
    var box = document.createElement('div');
    box.innerHTML = '<select data-tuc-select><option value="">Selecione</option><option>SP</option></select>';
    document.body.append(box);
    Tucano.init(box);
    var nativo = box.querySelector('select');
    var ordem = [];
    nativo.addEventListener('input', function () { ordem.push('input'); });
    nativo.addEventListener('change', function () { ordem.push('change'); });
    nativo._tucano.setValue('SP');
    nativo._tucano.destroy(); box.remove();
    if (ordem.join() !== 'input,change') throw new Error(ordem.join() || 'nenhum evento');
  });
  t('select: setValue silencioso não dispara o change nativo', function () {
    // silent existe para trocar por codigo sem avisar ninguem; o change do
    // nativo escapava e um hx-trigger="change" mandava requisicao a toa.
    var box = document.createElement('div');
    box.innerHTML = '<select data-tuc-select name="uf"><option value="">Selecione</option><option>SP</option><option>RJ</option></select>';
    document.body.append(box);
    Tucano.init(box);
    var nativo = box.querySelector('select');
    var i = nativo._tucano;
    var avisos = 0;
    nativo.addEventListener('change', function () { avisos++; });
    i.setValue('SP', { silent: true });
    var calado = avisos === 0;
    var gravou = nativo.value === 'SP';
    i.setValue('RJ');
    var barulho = avisos;
    i.destroy(); box.remove();
    if (!calado) throw new Error('silent disparou change ' + avisos + ' vez(es)');
    if (!gravou) throw new Error('o nativo não recebeu o valor');
    if (barulho !== 1) throw new Error('sem silent devia disparar uma vez, veio ' + barulho);
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
  t('moeda nasce com o zero formatado de placeholder', function () {
    // toLocaleString separa o simbolo com espaco inquebravel; compara normalizado.
    // fromCharCode e nao \s: este codigo mora num template literal e perde a barra.
    var p = document.getElementById('m2').placeholder.split(String.fromCharCode(160)).join(' ');
    if (p !== 'R$ 0,00') throw new Error('placeholder: "' + p + '"');
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
  t('peneira recusa endereço de outro domínio disfarçado de caminho', function () {
    // Duas barras, ou barra e barra invertida, passavam pela regra do caminho local.
    // fromCharCode e nao a barra invertida: este codigo mora num template literal.
    var bs = String.fromCharCode(92);
    ['//evil.com/x', '/' + bs + 'evil.com'].forEach(function (href) {
      var out = Tucano.sanitize('<p><a href="' + href + '">x</a></p>');
      if (out.indexOf('href') >= 0) throw new Error(href + ' passou: ' + out);
    });
    if (Tucano.sanitize('<p><a href="/local">x</a></p>').indexOf('href="/local"') < 0) throw new Error('o caminho local caiu');
  });
  t('peneira dissolve parágrafo com lista dentro e tira parágrafo vazio', function () {
    // Lista aplicada num <p> saía como <p></p><ul>…</ul><p></p> no valor.
    var out = Tucano.sanitize('<p><ul><li>a</li></ul></p><p></p><p>b</p>');
    if (out !== '<ul><li>a</li></ul><p>b</p>') throw new Error(out);
  });
  t('editor vazio vale vazio e mostra o placeholder; destroy devolve o textarea limpo', function () {
    // A área vazia guarda <p><br></p>: o :empty nunca casava e o valor postado era a marcação.
    var box = document.createElement('div');
    box.innerHTML = '<textarea></textarea>';
    document.body.append(box);
    var ta = box.querySelector('textarea');
    var ed = new Tucano.Editor(ta, { placeholder: 'Escreva aqui' });
    try {
      if (ed.getValue() !== '') throw new Error('getValue do vazio: ' + ed.getValue());
      if (getComputedStyle(ed.area, '::before').content.indexOf('Escreva aqui') < 0) throw new Error('placeholder não aparece');
      ed.setValue('<p>oi</p>');
      if (ed.area.classList.contains('is-empty')) throw new Error('is-empty com texto');
      ed.setValue('');
      if (ta.value !== '') throw new Error('textarea do vazio: ' + ta.value);
      if (!ed.area.classList.contains('is-empty')) throw new Error('sem is-empty depois de esvaziar');
    } finally {
      ed.destroy();
      box.remove();
    }
    if (ta._tucano || ta.classList.contains('tuc-editor__value')) throw new Error('destroy deixou _tucano ou a classe no textarea');
  });
  t('acordeão abre e fecha', function () {
    var i = document.getElementById('ac')._tucano;
    svg('.tuc-accordion__arrow');
    var item = document.querySelectorAll('#ac details')[0];
    i.open(item); if (!item.open) throw new Error('não abriu');
    i.close(item);
  });
  t('datepicker mostra as setas e troca de mês por elas', function () {
    // As setas eram .tuc-btn is-ghost, e a regra do espaço reservado usava o
    // mesmo nome: ficavam invisíveis e sem clique, e nenhum teste as tocava.
    var i = document.getElementById('d')._tucano;
    i.open();
    // Tudo lido dentro do painel desta instância: a página tem outro calendário,
    // e ler o rótulo de um e clicar a seta do outro acusava "o mês não mudou".
    var arrows = i.panel.querySelectorAll('.tuc-dp__nav:not(.is-placeholder)');
    if (!arrows.length) throw new Error('sem setas');
    var next = arrows[arrows.length - 1], c = getComputedStyle(next);
    if (c.visibility !== 'visible' || c.pointerEvents === 'none') throw new Error('seta ' + c.visibility + ' / ' + c.pointerEvents);
    var before = i.panel.querySelector('.tuc-dp__label').textContent;
    next.click();
    var after = i.panel.querySelector('.tuc-dp__label').textContent;
    i.close();
    if (before === after) throw new Error('o mês não mudou: ' + after);
  });
  t('arquivo recusado vira o aviso do sistema, anunciado', function () {
    document.getElementById('u')._tucano._fail('Maior que 5 MB', { name: 'contrato.pdf' });
    var notice = document.querySelector('.tuc-upload .tuc-alert.is-danger[role="alert"]');
    if (!notice) throw new Error('sem .tuc-alert is-danger com role=alert');
    if (notice.querySelector('.tuc-alert__title').textContent !== 'contrato.pdf') throw new Error('título errado');
    notice.remove();
  });
  t('toast de carregando usa o spinner do sistema', function () {
    var x = Tucano.toast({ type: 'loading', text: 'Enviando' });
    var ok = !!document.querySelector('.tuc-toast.is-loading .tuc-toast__icon > .tuc-spinner');
    x.close();
    if (!ok) throw new Error('sem .tuc-spinner');
  });
  t('limpar do select é o botão do sistema e some sem valor', function () {
    var nativeSelect = document.createElement('select');
    nativeSelect.innerHTML = '<option value="">—</option><option value="a">A</option>';
    document.body.append(nativeSelect);
    var inst = new Tucano.Select(nativeSelect, { clearable: true });
    var clearButton = inst.control.querySelector('.tuc-select__clear');
    var error = null;
    if (!clearButton || !clearButton.classList.contains('tuc-btn')) error = 'não é .tuc-btn';
    else if (getComputedStyle(clearButton).display !== 'none') error = 'aparece sem valor';
    else {
      inst.setValue('a');
      if (getComputedStyle(clearButton).display === 'none') error = 'não aparece com valor';
    }
    inst.control.remove(); nativeSelect.remove();
    if (error) throw new Error(error);
  });
  t('linha do tempo desenha ponto no tom e tira o trilho do último', function () {
    var items = document.querySelectorAll('#tl .tuc-timeline__item');
    var probe = document.createElement('span');
    probe.style.color = 'var(--tuc-success)';
    document.body.append(probe);
    var success = getComputedStyle(probe).color;
    probe.remove();
    if (getComputedStyle(document.getElementById('tl')).listStyleType !== 'none') throw new Error('lista com marcador');
    if (getComputedStyle(items[0], '::after').borderTopColor !== success) throw new Error('ponto fora do tom');
    if (getComputedStyle(items[0], '::before').display === 'none') throw new Error('primeiro item sem trilho');
    if (getComputedStyle(items[1], '::before').display !== 'none') throw new Error('último item com trilho');
  });
  t('toast do Django acha o tipo mesmo com extra_tags na frente', function () {
    var box = document.createElement('div');
    box.innerHTML = '<div data-tuc-toast data-type="destaque success">Salvo</div>';
    document.body.append(box);
    var created = Tucano.autoInitToasts(box);
    var type = created[0] && created[0].node.className;
    created.forEach(function (x) { x.close(); });
    box.remove();
    if (!/is-success/.test(type || '')) throw new Error('classe: ' + type);
  });
  t('setText do tooltip troca o texto e mantém o painel', function () {
    var b = document.createElement('button');
    document.body.append(b);
    var tip = new Tucano.Tooltip(b, { text: 'antes' });
    tip.setText('depois');
    var span = tip.panel.querySelector('.tuc-tip__text');
    tip.destroy(); b.remove();
    if (!span || span.textContent !== 'depois') throw new Error('texto ' + (span && span.textContent));
  });
  t('tooltip sem texto não impede os seguintes de montar', function () {
    var box = document.createElement('div');
    box.innerHTML = '<button data-tuc-tip="">vazio</button><button data-tuc-tip="dica">cheio</button>';
    document.body.append(box);
    Tucano.autoInitTooltips(box);
    var ok = box.querySelectorAll('button')[1].hasAttribute('data-tuc-ready');
    box.remove();
    if (!ok) throw new Error('o segundo tooltip não montou');
  });
  t('dropdown com painel em JS marca os itens como opção de menu', function () {
    var panel = document.createElement('div');
    panel.innerHTML = '<button class="tuc-dropdown__item">A</button>';
    var trigger = document.createElement('button');
    document.body.append(trigger);
    var dd = new Tucano.Dropdown(trigger, { panel: panel });
    var item = panel.querySelector('.tuc-dropdown__item');
    var role = item.getAttribute('role'), tab = item.getAttribute('tabindex');
    dd.destroy(); trigger.remove();
    if (role !== 'menuitem' || tab !== '-1') throw new Error('role ' + role + ', tabindex ' + tab);
  });
  t('período em ISO volta ao campo como as datas certas', function () {
    // É o que o Django devolve ao campo quando o formulário volta com erro.
    var box = document.createElement('div');
    box.innerHTML = '<input data-tuc-datepicker data-mode="range" value="2026-03-01,2026-03-15">';
    document.body.append(box);
    Tucano.init(box);
    var i = box.querySelector('input')._tucano;
    var ok = i.start && i.end && i.start.getMonth() === 2 && i.start.getDate() === 1 && i.end.getDate() === 15;
    var shown = box.querySelector('input').value;
    box.remove();
    if (!ok) throw new Error('lido como ' + shown);
  });
  /* Date picker: um campo montado por caso, destruído no fim. */
  function dpBox(html, opts) {
    var box = document.createElement('div');
    box.innerHTML = html;
    document.body.append(box);
    var input = box.querySelector('input');
    if (opts) new Tucano.DatePicker(input, opts); else Tucano.init(box);
    return { box: box, input: input, dp: input._tucano, done: function () { if (input._tucano) input._tucano.destroy(); box.remove(); } };
  }
  var isoDay = function (d) { return d ? Tucano.dates.toISODate(d) : 'nada'; };

  t('date picker lê data ambígua no formato do idioma, não no americano', function () {
    // parseISO caía em new Date(texto), e 07/09/2026 virava 9 de julho.
    var a = dpBox('<input data-tuc-datepicker value="07/09/2026">');
    var b = dpBox('<input data-tuc-datepicker data-time="true" value="07/09/2026 14:30">');
    var got = [isoDay(a.dp.start), Tucano.dates.toISODateTime(b.dp.start)];
    a.dp.setValue('08/09/2026', { silent: true }); got.push(isoDay(a.dp.start));
    a.dp.setValue(new Date(2026, 8, 9), { silent: true }); got.push(isoDay(a.dp.start));
    a.done(); b.done();
    if (got.join(' ') !== '2026-09-07 2026-09-07T14:30 2026-09-08 2026-09-09') throw new Error(got.join(' '));
  });
  t('date picker recusa setValue fora de min/max em vez de puxar para o limite', function () {
    var x = dpBox('<input>', { min: '2026-01-01', max: '2026-12-31' });
    x.dp.setValue('2027-01-15', { silent: true });
    var value = x.dp.getValue();
    x.done();
    if (value) throw new Error('aceitou ' + isoDay(value));
  });
  t('número da semana com domingo primeiro é o da segunda-feira da linha', function () {
    var x = dpBox('<input>', { weekNumbers: true, firstDayOfWeek: 0 });
    x.dp.setValue('2026-09-07', { silent: true });
    x.dp.open();
    var rows = x.dp.panel.querySelectorAll('.tuc-dp__grid > [role=row]');
    var nums = [].map.call(rows, function (r) { return r.querySelector('[role=rowheader]').textContent; }).slice(0, 2).join(' ');
    var cells = rows[0].querySelectorAll('[role=gridcell]').length;
    x.done();
    if (rows.length !== 6 || cells !== 7) throw new Error(rows.length + ' linhas, ' + cells + ' dias na primeira');
    if (nums !== '36 37') throw new Error('semanas ' + nums);
  });
  t('date picker anuncia a troca de mês numa região estável', function () {
    var x = dpBox('<input>', {});
    x.dp.setValue('2026-09-07', { silent: true });
    x.dp.open();
    var live = x.dp.panel.querySelector('[aria-live]');
    x.dp.panel.querySelector('[data-key="next"]').click();
    var same = live === x.dp.panel.querySelector('[aria-live]') && live.isConnected;
    var text = live.textContent, labelLive = x.dp.panel.querySelector('.tuc-dp__label').hasAttribute('aria-live');
    x.done();
    if (!same) throw new Error('a região foi recriada');
    if (text !== 'Outubro 2026' || labelLive) throw new Error('anúncio "' + text + '", aria-live no rótulo ' + labelLive);
  });
  t('destroy do date picker devolve o campo como era, e o init monta de novo', function () {
    var x = dpBox('<form><input data-tuc-datepicker name="due" class="x" value="2026-09-07"></form>');
    x.dp.destroy();
    var i = x.input, r = [i.getAttribute('name'), i.getAttribute('role'), i.getAttribute('aria-expanded'), i.getAttribute('placeholder'),
      i.getAttribute('autocomplete'), i.className, i.hasAttribute('data-tuc-ready'), x.box.querySelectorAll('input[type=hidden]').length];
    Tucano.init(x.box);
    var again = !!i._tucano && x.box.querySelectorAll('input[type=hidden][name=due]').length === 1;
    x.done();
    var n = dpBox('<input data-tuc-datepicker data-native="true" name="nd">');
    n.dp.destroy();
    var native = [n.box.querySelectorAll('.tuc-native-wrap, .tuc-native').length, n.input.readOnly, n.input.parentElement === n.box];
    n.done();
    if (JSON.stringify(r) !== '["due",null,null,null,null,"x",false,0]') throw new Error('restou ' + JSON.stringify(r));
    if (!again) throw new Error('o init não montou de novo');
    if (native.join() !== '0,false,true') throw new Error('nativo: ' + native.join());
  });
  t('segundo DatePicker no mesmo campo substitui o primeiro', function () {
    var x = dpBox('<input name="twice">', {});
    var first = x.dp, second = new Tucano.DatePicker(x.input);
    var hiddens = x.box.querySelectorAll('input[type=hidden]').length;
    x.done();
    if (x.input._tucano) throw new Error('sobrou instância');
    if (hiddens !== 1 || first === second) throw new Error(hiddens + ' hidden(s)');
  });
  t('nativo com hora limita no fim do dia do max, e data-native="auto" é lido', function () {
    var x = dpBox('<input data-tuc-datepicker data-native="true" data-time="true" data-max="2026-12-31">');
    var max = x.dp.overlay.max;
    x.done();
    var y = dpBox('<input data-tuc-datepicker data-native="auto">');
    var mode = y.dp.opts.native;
    y.done();
    if (max !== '2026-12-31T23:59') throw new Error('max ' + max);
    if (mode !== 'auto') throw new Error('native ' + mode);
  });
  t('vistas de mês e de ano desativam o que está fora de min/max', function () {
    var x = dpBox('<input>', { min: '2026-03-10', max: '2026-10-05' });
    x.dp.setValue('2026-06-01', { silent: true });
    x.dp.open();
    var panel = x.dp.panel, count = function () {
      return [panel.querySelectorAll('.tuc-dp__periodcell:disabled').length,
        panel.querySelector('[data-key=prev]').disabled, panel.querySelector('[data-key=next]').disabled].join();
    };
    panel.querySelector('.tuc-dp__label').click();
    var months = count();
    panel.querySelector('.tuc-dp__label').click();
    var years = count();
    x.done();
    if (months !== '4,true,true') throw new Error('meses: ' + months);
    if (years !== '11,true,true') throw new Error('anos: ' + years);
  });
  t('em inglês com hora, a leitura da hora segue as 12 horas do campo', function () {
    var x = dpBox('<input>', { locale: 'en-US', time: true });
    x.dp.setValue('2026-09-07T13:05', { silent: true });
    x.dp.open();
    var r = [x.dp.panel.querySelector('.tuc-dp__timevalue').textContent, x.dp.panel.querySelector('[data-key="start-h-13"]').getAttribute('aria-label')];
    x.done();
    if (r.join('|') !== '01:05 PM|1 PM') throw new Error(r.join(' | '));
  });
  t('atalho de período com hora vai até o fim do último dia', function () {
    var x = dpBox('<input>', { mode: 'range', time: true, presets: true });
    x.dp.open();
    x.dp.panel.querySelector('.tuc-dp__preset').click();
    var r = [x.dp.start.getHours(), x.dp.end.getHours(), x.dp.end.getMinutes()].join(':');
    x.done();
    if (r !== '0:23:59') throw new Error('Hoje ficou ' + r);
  });

  t('URL em bloco de código não vira comentário', function () {
    var html = Tucano.highlight('curl https://exemplo.com/api');
    if (html.indexOf('tuc-tok-comment') >= 0) throw new Error(html);
    if (Tucano.highlight('x = 1 // nota').indexOf('tuc-tok-comment') < 0) throw new Error('comentário de verdade sumiu');
    if (Tucano.highlight('--tuc-accent: #4f46e5;').indexOf('tuc-tok-comment') >= 0) throw new Error('cor hex virou comentário');
    if (Tucano.highlight('x = 1  # nota').indexOf('tuc-tok-comment') < 0) throw new Error('comentário com # sumiu');
  });
  t('fundo suave acompanha o destaque trocado num contêiner', function () {
    var box = document.createElement('div');
    box.innerHTML = '<span class="tuc-badge is-info" id="default">a</span><div style="--tuc-info:#00aa00"><span class="tuc-badge is-info" id="swapped">b</span></div>';
    document.body.append(box);
    var a = getComputedStyle(box.querySelector('#default')).backgroundColor;
    var b = getComputedStyle(box.querySelector('#swapped')).backgroundColor;
    box.remove();
    if (a === b) throw new Error('fundo não mudou: ' + b);
  });
  t('painel do select dentro de um modal nasce no próprio diálogo', function () {
    // No body ele ficava atrás do <dialog>, que está na top layer.
    removeDialogs();
    var m = Tucano.modal({ title: 'Com campo', text: 'x' });
    var dlg = document.querySelector('dialog[open]');
    var nativeSelect = document.createElement('select');
    nativeSelect.innerHTML = '<option>A</option><option>B</option>';
    dlg.querySelector('.tuc-modal__panel').append(nativeSelect);
    var sel = new Tucano.Select(nativeSelect);
    sel.open();
    // O menu desta instância: a página tem outro select, cujo menu mora no body.
    var menu = sel.menu;
    var inside = !!menu && dlg.contains(menu);
    sel.close(); m.close(); removeDialogs();
    if (!inside) throw new Error('o menu não está dentro do diálogo');
  });
  t('modal sem título ganha nome pelo texto', function () {
    removeDialogs();
    var m = Tucano.modal({ text: 'Excluir o contrato 12?' });
    var name = document.querySelector('dialog[open]').getAttribute('aria-label');
    m.close(); removeDialogs();
    if (name !== 'Excluir o contrato 12?') throw new Error('aria-label ' + name);
  });
  t('pontas da paginação têm nome, e setPage devolve o foco', function () {
    var box = document.createElement('div');
    document.body.append(box);
    var p = new Tucano.Pagination({ page: 2, pages: 9, onChange: function () {} });
    box.append(p.node);
    var edges = p.node.querySelectorAll('a.tuc-pagination__edge');
    var names = [].map.call(edges, function (a) { return a.getAttribute('aria-label'); }).join('|');
    p.node.querySelector('a[aria-current="page"]').focus();
    p.setPage(3);
    var focused = document.activeElement && document.activeElement.getAttribute('aria-current');
    var current = document.activeElement && document.activeElement.textContent.trim();
    box.remove();
    if (names !== 'Anterior|Próxima') throw new Error('nomes ' + names);
    if (focused !== 'page' || current !== '3') throw new Error('foco em ' + current);
  });
  t('máscara não apaga o erro do servidor ao focar', function () {
    // O Django 5 escreve aria-invalid no campo que voltou com erro. A máscara sem
    // data-validate não é dona desse atributo e não pode zerá-lo no foco.
    var box = document.createElement('div');
    box.innerHTML = '<input data-tuc-mask="cpf" aria-invalid="true">';
    document.body.append(box);
    Tucano.init(box);
    var field = box.querySelector('input');
    field.dispatchEvent(new FocusEvent('focus'));
    var mark = field.getAttribute('aria-invalid');
    box.remove();
    if (mark !== 'true') throw new Error('aria-invalid virou ' + mark);
  });
  t('máscara com validação fica verde quando o CPF fica certo, sem sair do campo', function () {
    // O acerto aparece na hora: antes, o valor certo não tinha estado nenhum e só o
    // erro, ao sair do campo, mudava a borda.
    var field = document.createElement('input');
    field.className = 'tuc-input';
    document.body.append(field);
    var m = new Tucano.Mask(field, { format: 'cpf', validate: true });
    field.value = '11144477735';
    field.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
    var valid = field.hasAttribute('data-tuc-valid');
    var border = getComputedStyle(field).borderTopColor;
    var probe = document.createElement('span');
    probe.style.color = 'var(--tuc-success)';
    document.body.append(probe);
    var success = getComputedStyle(probe).color;
    probe.remove(); m.destroy(); field.remove();
    if (!valid) throw new Error('sem data-tuc-valid com o CPF certo');
    if (border !== success) throw new Error('borda ' + border + ', esperado ' + success);
  });
  t('máscara com validação não acusa erro digitando, e acusa ao sair do campo', function () {
    var field = document.createElement('input');
    field.className = 'tuc-input';
    document.body.append(field);
    var m = new Tucano.Mask(field, { format: 'cpf', validate: true });
    field.value = '11144477700';
    field.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
    var typing = { invalid: field.getAttribute('aria-invalid'), valid: field.hasAttribute('data-tuc-valid') };
    field.dispatchEvent(new FocusEvent('blur'));
    var afterBlur = { invalid: field.getAttribute('aria-invalid'), valid: field.hasAttribute('data-tuc-valid') };
    m.destroy(); field.remove();
    if (typing.invalid === 'true') throw new Error('ficou vermelho no meio da digitação');
    if (typing.valid) throw new Error('CPF errado ficou verde');
    if (afterBlur.invalid !== 'true' || afterBlur.valid) throw new Error('ao sair: ' + JSON.stringify(afterBlur));
  });
  t('setValue do campo sensível atualiza o que é enviado', function () {
    var box = document.createElement('div');
    box.innerHTML = '<input name="doc" data-tuc-mask="cpf" data-tuc-reveal>';
    document.body.append(box);
    Tucano.init(box);
    box.querySelector('input:not([type=hidden])')._tucano.setValue('11144477735');
    var hidden = box.querySelector('input[type=hidden]');
    var value = hidden && hidden.value;
    box.remove();
    if (!hidden) throw new Error('sem campo escondido');
    if (value !== '11144477735') throw new Error('escondido com "' + value + '"');
  });
  t('dado sensível em texto solto nasce escondido e o olho mostra e esconde', function () {
    // Fora de campo o reveal só desenhava o olho, e o texto continuava inteiro.
    var box = document.createElement('div');
    box.innerHTML = '<p><span id="revealText">4111 1111 1111 1234</span></p>'
      + '<table><tr><td><span id="revealCpf" data-tuc-format="cpf" data-tuc-reveal>11144477735</span></td></tr></table>'
      + '<p><span id="revealMail" data-tuc-reveal>joao.silva@empresa.com.br</span></p>';
    box.querySelector('#revealText').setAttribute('data-tuc-reveal', '');
    box.querySelector('#revealText').setAttribute('data-reveal-visible', '4');
    document.body.append(box);
    Tucano.init(box);
    var card = document.getElementById('revealText'), cpf = document.getElementById('revealCpf'), mail = document.getElementById('revealMail');
    var hiddenCard = card.textContent, hiddenCpf = cpf.textContent, hiddenMail = mail.textContent;
    var eye = cpf.parentElement.querySelector('.tuc-reveal__eye');
    var pressedBefore = eye && eye.getAttribute('aria-pressed');
    if (eye) eye.click();
    var shownCpf = cpf.textContent, pressedAfter = eye && eye.getAttribute('aria-pressed');
    cpf._tucano.destroy();
    var cell = box.querySelector('td');
    var restoredWrapper = !!cell.querySelector('.tuc-reveal'), restored = cell.textContent;
    box.remove();
    if (hiddenCard !== '•••• •••• •••• 1234') throw new Error('cartão: "' + hiddenCard + '"');
    if (hiddenCpf !== '•••.•••.•••-35') throw new Error('CPF formatado e escondido: "' + hiddenCpf + '"');
    if (hiddenMail.indexOf('@empresa.com.br') < 0 || hiddenMail.indexOf('silva') >= 0) throw new Error('e-mail: "' + hiddenMail + '"');
    if (!eye || pressedBefore !== 'false') throw new Error('olho ausente ou já marcado');
    if (shownCpf !== '111.444.777-35' || pressedAfter !== 'true') throw new Error('o olho não mostrou: "' + shownCpf + '"');
    if (restoredWrapper || restored !== '111.444.777-35') throw new Error('destroy não devolveu o texto: "' + restored + '"');
  });
  t('abas ligam aba e painel pelos papéis', function () {
    var tabs = document.querySelectorAll('#tb .tuc-tabs__tab'), panels = document.querySelectorAll('#tb .tuc-tabs__panel');
    if (document.querySelector('#tb .tuc-tabs__list').getAttribute('role') !== 'tablist') throw new Error('sem tablist');
    [].forEach.call(tabs, function (a, i) {
      if (a.getAttribute('role') !== 'tab') throw new Error('aba ' + i + ' sem role');
      if (a.getAttribute('aria-controls') !== panels[i].id) throw new Error('aba ' + i + ' não aponta o painel');
      if (panels[i].getAttribute('aria-labelledby') !== a.id) throw new Error('painel ' + i + ' sem nome');
    });
    if (tabs[0].tabIndex !== 0 || tabs[1].tabIndex !== -1) throw new Error('Tab devia parar só na aba aberta');
    // Painel com campo dentro não vira parada extra do Tab; sem nada, vira.
    if (panels[0].hasAttribute('tabindex')) throw new Error('painel com campo ganhou tabindex');
    if (panels[1].tabIndex !== 0) throw new Error('painel sem foco possível ficou fora do Tab');
  });
  t('clicar numa aba troca o painel e emite change', function () {
    var node = document.getElementById('tb'), seen = null;
    var listen = function (e) { seen = e.detail; };
    node.addEventListener('tucano:change', listen);
    node.querySelectorAll('.tuc-tabs__tab')[1].click();
    node.removeEventListener('tucano:change', listen);
    var panels = node.querySelectorAll('.tuc-tabs__panel');
    if (!panels[0].hidden || panels[1].hidden) throw new Error('painel não trocou');
    if (!seen || seen.value !== 1 || seen.panel !== panels[1]) throw new Error('evento: ' + JSON.stringify(seen && seen.value));
  });
  t('aba desativada não abre', function () {
    var i = document.getElementById('tb')._tucano;
    i.select(2);
    if (i.index !== 1) throw new Error('abriu a desativada');
    i.select(0);
  });
  t('aba dentro de formulário não envia o formulário', function () {
    document.querySelectorAll('#tbform .tuc-tabs__tab')[1].click();
    if (window.__submitted) throw new Error('enviou');
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
  t('menu do botão direito deixa passar fora de um alvo e com Shift', function () {
    // Sem alvo, o menu do navegador continua valendo: um menu de ações que não
    // sabe sobre o que age é pior que nenhum. E o Shift é o atalho de quem quer
    // o menu do navegador de propósito.
    var box = document.createElement('div');
    box.innerHTML = '<table id="ctxb"><thead><tr id="ctxhead"><th>Cliente</th></tr></thead>'
      + '<tbody><tr id="ctxline"><td>Padaria</td></tr></tbody></table>';
    document.body.append(box);
    var m = new Tucano.ContextMenu('#ctxb', { match: 'tbody tr', items: [{ text: 'Editar' }] });
    function rightClick(id, shift) {
      var e = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 120, clientY: 120, shiftKey: !!shift });
      document.getElementById(id).dispatchEvent(e);
      return e.defaultPrevented;
    }
    var onHead = rightClick('ctxhead');
    var withShift = rightClick('ctxline', true);
    var onRow = rightClick('ctxline');
    var opened = !!document.querySelector('.tuc-dropdown');
    m.destroy(); box.remove();
    if (onHead) throw new Error('segurou o menu do navegador no cabeçalho');
    if (withShift) throw new Error('segurou o menu do navegador com Shift');
    if (!onRow || !opened) throw new Error('não abriu na linha');
  });
  t('editor sem variáveis não ganha botão nem lista', function () {
    // Recurso opcional: quem não declara variáveis não vê nada de diferente.
    var box = document.createElement('div');
    box.innerHTML = '<textarea id="edplain"></textarea>';
    document.body.append(box);
    var ed = new Tucano.Editor('#edplain');
    var hasButton = !!box.querySelector('[data-action="variable"]');
    var unknown = ed.unknownVariables().length;
    ed.destroy(); box.remove();
    if (hasButton) throw new Error('apareceu botão de variável sem variáveis');
    if (unknown) throw new Error('acusou variável desconhecida sem lista declarada');
  });
  t('editor lista as variáveis na barra e acusa a que não existe', function () {
    var box = document.createElement('div');
    box.innerHTML = '<textarea id="edvars"></textarea>';
    document.body.append(box);
    var ed = new Tucano.Editor('#edvars', { variables: [
      { name: 'nome', label: 'Nome do responsável' },
      { name: 'prazo', label: 'Prazo' },
    ] });
    var button = box.querySelector('[data-action="variable"]');
    ed.openVariables();
    var items = [].map.call(document.querySelectorAll('.tuc-dropdown__item .tuc-dropdown__shortcut'), function (n) { return n.textContent; });
    // A inserção em si é do keyboard.mjs: com a página sem foco, o insertText
    // do navegador não escreve, e aqui o teste mediria o ambiente.
    ed.setValue('<p>{{nome}} e {{nomee}}</p>');
    var unknown = ed.unknownVariables().join();
    ed.destroy(); box.remove();
    if (!button) throw new Error('sem botão de variável na barra');
    if (items.join() !== '{{nome}},{{prazo}}') throw new Error('itens: ' + items.join());
    if (unknown !== 'nomee') throw new Error('desconhecidas: ' + unknown);
  });
  t('editor pinta as variáveis do texto sem mexer no valor salvo', function () {
    var box = document.createElement('div');
    box.innerHTML = '<textarea id="edpaint"></textarea>';
    document.body.append(box);
    var ed = new Tucano.Editor('#edpaint', { variables: [{ name: 'nome' }, { name: 'tarefa' }] });
    var html = '<p>Oi {{nome}} e {{tarefa}}, mas {{praz}} não existe</p><pre><code>{{ codigo }}</code></pre>';
    ed.setValue(html);
    var value = ed.getValue();
    var painted = window.CSS && CSS.highlights
      ? [CSS.highlights.get('tuc-variable').size, CSS.highlights.get('tuc-variable-unknown').size]
      : null;
    ed.destroy();
    var cleared = window.CSS && CSS.highlights ? CSS.highlights.get('tuc-variable').size : 0;
    box.remove();
    // A pintura é do navegador, sobre intervalos: o valor salvo sai igual ao que entrou.
    if (value !== html) throw new Error('o valor mudou: ' + value);
    // Onde a API não existe, o editor segue funcionando sem fundo nenhum.
    if (!painted) return;
    if (painted[0] !== 2) throw new Error('pintou ' + painted[0] + ' variáveis conhecidas, esperava 2');
    if (painted[1] !== 1) throw new Error('pintou ' + painted[1] + ' desconhecidas, esperava 1');
    if (cleared) throw new Error('a pintura ficou depois do destroy');
  });
  t('editor não acusa variável escrita dentro de bloco de código', function () {
    // Exemplo de template num bloco de código não é erro de digitação.
    var box = document.createElement('div');
    box.innerHTML = '<textarea id="edcode"></textarea>';
    document.body.append(box);
    var ed = new Tucano.Editor('#edcode', { variables: [{ name: 'nome', label: 'Nome' }] });
    ed.setValue('<pre><code>&lt;h1&gt;Oi, {{ usuario }}!&lt;/h1&gt;</code></pre><p>texto</p>');
    var inCode = ed.unknownVariables().join();
    ed.setValue('<p>Oi {{ usuario }}</p>');
    var inText = ed.unknownVariables().join();
    ed.destroy(); box.remove();
    if (inCode) throw new Error('acusou dentro do código: ' + inCode);
    if (inText !== 'usuario') throw new Error('no texto deveria acusar, veio "' + inText + '"');
  });
  t('menu do botão direito fecha na rolagem de quem usa, não na do foco', function () {
    // Dar foco a um item rola a página quando ele está perto da borda, e isso
    // dispara o evento de rolagem: com a regra nele, o menu se fechava sozinho
    // na primeira seta e devolvia o foco para a linha.
    var box = document.createElement('div');
    box.innerHTML = '<table id="ctxs"><tbody><tr id="ctxsrow"><td>Padaria</td></tr></tbody></table>';
    document.body.append(box);
    var m = new Tucano.ContextMenu('#ctxs', { match: 'tbody tr', items: [{ text: 'Editar' }, { text: 'Excluir' }] });
    document.getElementById('ctxsrow').dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 60, clientY: 60 }));
    var opened = !!m.isOpen;
    window.dispatchEvent(new Event('scroll'));
    var afterFocusScroll = !!m.isOpen;
    window.dispatchEvent(new WheelEvent('wheel', { bubbles: true }));
    var afterWheel = !!m.isOpen;
    m.destroy(); box.remove();
    if (!opened) throw new Error('não abriu');
    if (!afterFocusScroll) throw new Error('fechou com um scroll que não veio de quem usa');
    if (afterWheel) throw new Error('não fechou com a roda do mouse');
  });
  t('menu do botão direito aceita painel do template e limpa a âncora no destroy', function () {
    var box = document.createElement('div');
    box.innerHTML = '<div id="ctxarea">área</div>'
      + '<div class="tuc-dropdown" id="ctxpanel" hidden><button class="tuc-dropdown__item">Colar</button></div>';
    box.setAttribute('data-nothing', '');
    document.body.append(box);
    var area = box.querySelector('#ctxarea');
    area.setAttribute('data-tuc-contextmenu', '#ctxpanel');
    Tucano.init(box);
    var m = area._tucano;
    area.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 40, clientY: 40 }));
    var item = document.querySelector('#ctxpanel .tuc-dropdown__item');
    var role = item && item.getAttribute('role');
    var withPin = !!document.querySelector('.tuc-context-pin');
    m.destroy();
    var withoutPin = !document.querySelector('.tuc-context-pin');
    box.remove(); document.getElementById('ctxpanel')?.remove();
    if (role !== 'menuitem') throw new Error('item sem papel de menu: ' + role);
    if (!withPin) throw new Error('sem âncora no ponto do clique');
    if (!withoutPin) throw new Error('a âncora ficou no documento depois do destroy');
  });
  t('modal abre com tom, rótulo e classes', function () {
    removeDialogs();
    var m = Tucano.modal({ title: 'Oi', text: 'x', tone: 'danger', actions: [{ text: 'Ok' }] });
    if (!document.querySelector('.tuc-modal.is-danger .tuc-modal__panel')) throw new Error('classes');
    if (document.querySelector('.tuc-modal__footer .tuc-btn').textContent.trim() !== 'Ok') throw new Error('rótulo vazio');
    m.close(); removeDialogs();
  });
  t('confirmar devolve promessa e rotula o botão', function () {
    removeDialogs();
    Tucano.confirm({ title: 'X', confirm: 'Excluir' });
    var b = [].map.call(document.querySelectorAll('.tuc-modal__footer .tuc-btn'), function (x) { return x.textContent.trim(); });
    if (b.join(',') !== 'Cancelar,Excluir') throw new Error(b.join(','));
    removeDialogs();
  });
  t('gaveta abre no lado e no tamanho pedidos', function () {
    removeDialogs();
    var g = Tucano.drawer({ title: 'F', side: 'right', size: 'lg' });
    if (!document.querySelector('.tuc-drawer.is-right.is-lg .tuc-drawer__panel')) throw new Error('classes');
    g.close(); removeDialogs();
  });
  t('gaveta com conteúdo longo cabe na tela e rola no corpo', function () {
    // A grade do <dialog> crescia com o conteúdo: o painel ficava com a altura da
    // lista, passava da tela e o corpo, que devia rolar, nunca ficava menor que ela.
    removeDialogs();
    var list = document.createElement('nav');
    list.className = 'tuc-menu';
    for (var i = 0; i < 60; i++) { var a = document.createElement('a'); a.className = 'tuc-menu__item'; a.href = '#'; a.textContent = 'Item ' + i; list.append(a); }
    var g = Tucano.drawer({ title: 'Menu', side: 'left' });
    g.content(list); g.open();
    var panel = document.querySelector('.tuc-drawer__panel'), body = document.querySelector('.tuc-drawer__body');
    if (panel.getBoundingClientRect().height > innerHeight + 1) throw new Error('painel passou da tela: ' + Math.round(panel.getBoundingClientRect().height) + 'px em ' + innerHeight);
    if (body.scrollHeight <= body.clientHeight) throw new Error('corpo não rola');
    g.close(); removeDialogs();
  });
  t('diálogo aberto reserva o espaço da barra de rolagem, e só quando ela ocupa espaço', function () {
    // A trava de rolagem sumia com a barra, a página ganhava a largura dela e o
    // conteúdo de trás andava. Se a barra ocupa espaço depende do motor e do
    // sistema — sobreposta no macOS e no Chromium sem cabeça, fixa no Firefox do
    // Linux —, então a marca é conferida contra a medida deste navegador, e a
    // outra metade do mecanismo, o padding, é forçada com a marca posta à mão.
    removeDialogs();
    var root = document.documentElement;
    root.removeAttribute('data-tuc-gutter');
    var occupies = innerWidth - root.clientWidth > 0;
    var modal = Tucano.modal({ title: 'M' });
    if (root.hasAttribute('data-tuc-gutter') !== occupies) throw new Error(occupies ? 'não marcou com barra que ocupa espaço' : 'marcou sem barra que ocupa espaço');
    root.setAttribute('data-tuc-gutter', '');
    root.style.setProperty('--tuc-gutter-pad', '31px');
    var withMark = getComputedStyle(document.body).paddingRight;
    modal.close(); removeDialogs();
    root.setAttribute('data-tuc-gutter', '');
    var afterClose = getComputedStyle(document.body).paddingRight;
    root.removeAttribute('data-tuc-gutter');
    root.style.removeProperty('--tuc-gutter-pad');
    if (withMark !== '31px') throw new Error('com a marca e diálogo aberto, o padding do body é ' + withMark);
    if (afterClose === '31px') throw new Error('continuou reservando depois de fechar');
  });
  t('tabela larga rola sozinha no editor e no .tuc-prose, e a estreita ocupa a largura', function () {
    // Com a tabela presa em 100%, dez colunas viravam uma palavra por linha.
    // Vinte colunas: a página de teste é larga, e dez de 7rem ainda cabiam nela.
    var columns = function (n) { var cells = ''; for (var i = 0; i < n; i++) cells += '<td>Valor com texto ' + i + '</td>'; return '<table><tbody><tr>' + cells + '</tr></tbody></table>'; };
    var editor = document.getElementById('ed')._tucano, previous = editor.getValue();
    editor.setValue('<p>a</p>' + columns(20) + columns(2));
    var boxes = editor.area.querySelectorAll('.tuc-editor__scroll');
    if (boxes.length !== 2) throw new Error('editor: ' + boxes.length + ' caixa(s) para 2 tabelas');
    if (boxes[0].scrollWidth <= boxes[0].clientWidth) throw new Error('editor: tabela larga não rola');
    if (editor.area.scrollWidth > editor.area.clientWidth + 1) throw new Error('editor: a área inteira rola, e não só a tabela');
    var narrow = boxes[1].querySelector('table');
    if (Math.abs(narrow.getBoundingClientRect().width - boxes[1].clientWidth) > 1) throw new Error('editor: tabela de 2 colunas não ocupa a largura');
    if (editor.getValue().indexOf('div') >= 0) throw new Error('a caixa foi parar no valor salvo');
    boxes[0].querySelector('td').dispatchEvent(new Event('input', { bubbles: true }));
    editor.area.querySelector('table').remove();
    editor.area.dispatchEvent(new Event('input', { bubbles: true }));
    if (editor.area.querySelectorAll('.tuc-editor__scroll').length !== 1) throw new Error('editor: sobrou caixa vazia ao apagar a tabela');
    editor.setValue(previous);

    var prose = document.createElement('div');
    prose.className = 'tuc-prose';
    prose.innerHTML = columns(20);
    document.body.append(prose);
    Tucano.init(prose);
    var box = prose.querySelector('.tuc-prose__scroll');
    var scrolls = box && box.scrollWidth > box.clientWidth, proseFits = prose.scrollWidth <= prose.clientWidth + 1;
    Tucano.init(prose);
    var boxCount = prose.querySelectorAll('.tuc-prose__scroll').length;
    prose.remove();
    if (!box) throw new Error('prose: tabela sem caixa');
    if (!scrolls) throw new Error('prose: tabela larga não rola');
    if (!proseFits) throw new Error('prose: o bloco inteiro passou da largura');
    if (boxCount !== 1) throw new Error('prose: init de novo criou ' + boxCount + ' caixas');
  });
  t('onClose recebe os motivos em inglês: button no X, backdrop no fundo', function () {
    // O onClose só roda depois da animação de saída, e este teste é síncrono:
    // o motivo é lido na chamada de close(), que é o valor repassado ao callback.
    removeDialogs();
    var reasons = [];
    var spy = function (dialog) { var original = dialog.close; dialog.close = function (reason) { reasons.push(reason); return original.call(dialog, reason); }; return dialog; };
    var modal = spy(Tucano.modal({ title: 'A' }));
    modal.node.querySelector('.tuc-modal__close').click();
    var drawer = spy(Tucano.drawer({ title: 'B' }));
    drawer.node.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    removeDialogs();
    if (reasons.join(',') !== 'button,backdrop') throw new Error('motivos: ' + reasons.join(','));
  });
  t('máscara cnpj-numeric recusa letra', function () {
    var input = document.createElement('input');
    document.body.append(input);
    var mask = new Tucano.Mask(input, { format: 'cnpj-numeric' });
    mask.setValue('AB222333000181');
    var value = input.value;
    mask.destroy(); input.remove();
    if (/[A-Z]/.test(value)) throw new Error('aceitou letra: ' + value);
  });
  t('menu numa coluna de altura fixa rola, em vez de vazar', function () {
    var column = document.createElement('div');
    column.style.cssText = 'display:flex;flex-direction:column;height:200px';
    var menu = document.createElement('nav');
    menu.className = 'tuc-menu';
    for (var i = 0; i < 30; i++) { var a = document.createElement('a'); a.className = 'tuc-menu__item'; a.href = '#'; a.textContent = 'Item ' + i; menu.append(a); }
    column.append(menu); document.body.append(column);
    var height = menu.getBoundingClientRect().height, scrolls = menu.scrollHeight > menu.clientHeight;
    column.remove();
    if (height > 201) throw new Error('menu vazou da coluna: ' + Math.round(height) + 'px');
    if (!scrolls) throw new Error('menu não rola');
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
    var all = document.querySelectorAll('#t tbody .tuc-check');
    all[0].click();
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
    var before = getComputedStyle(sw, '::after').translate;
    sw.click();
    var after = getComputedStyle(sw, '::after').translate;
    if (before === after) throw new Error('translate ficou ' + after);
    sw.click();
  });
  t('aria-invalid pinta a borda de erro, inclusive nos controles montados', function () {
    // O atributo fica no nativo; a borda tem de aparecer no que a pessoa vê.
    var danger = document.createElement('span');
    danger.style.color = 'var(--tuc-danger)';
    document.body.append(danger);
    var color = getComputedStyle(danger).color;
    danger.remove();
    var targets = {
      'campo de texto': [document.getElementById('m'), document.getElementById('m')],
      'select': [document.getElementById('s'), document.getElementById('s').nextElementSibling],
      'campo de cor': [document.getElementById('c'), document.getElementById('c').closest('.tuc-color-field')],
      'editor': [document.getElementById('ed'), document.getElementById('ed').closest('.tuc-editor')],
    };
    Object.keys(targets).forEach(function (name) {
      var nativeField = targets[name][0], shown = targets[name][1];
      if (getComputedStyle(shown).borderTopColor === color) throw new Error(name + ' já nasceu vermelho');
      nativeField.setAttribute('aria-invalid', 'true');
      var border = getComputedStyle(shown).borderTopColor;
      nativeField.removeAttribute('aria-invalid');
      if (border !== color) throw new Error(name + ': borda ' + border + ', esperado ' + color);
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
    // .hostile label pesa 0,1,1 e declara display, margem e peso: é o que a
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
    var seen = {};
    document.addEventListener('tucano:change', function (e) { seen.change = Object.keys(e.detail).join(','); });
    document.addEventListener('tucano:sort', function (e) { seen.sort = Object.keys(e.detail).join(','); });
    document.getElementById('c')._tucano.setValue('#000000');
    document.querySelector('#t .tuc-table__sortbtn').click();
    // Cada componente acrescenta o que so ele sabe: o color picker manda rgb e
    // hsva junto, para nao obrigar a converter de novo do lado de fora.
    if (seen.change !== 'value,rgb,hsva,instance') throw new Error('change: ' + seen.change);
    if (seen.sort !== 'column,field,direction') throw new Error('sort: ' + seen.sort);
  });
  /*
   * Textos da interface. Cada leitura monta instâncias novas, porque o texto é
   * lido na montagem: as da página nasceram antes de qualquer setTexts.
   */
  function readTexts() {
    var box = document.createElement('div');
    box.innerHTML = '<input class="x-date"><select class="x-sel" multiple><option value="a" selected>A</option><option value="b">B</option></select>'
      + '<input type="password" class="x-pass" value="x"><textarea class="x-ed"></textarea><input type="file" class="x-up">'
      + '<table class="x-tb"><thead><tr><th>N</th></tr></thead><tbody><tr><td>a</td></tr></tbody></table>'
      + '<input class="x-color" value="#000000"><div class="tuc-prose"><pre><code>x</code></pre></div>';
    document.body.append(box);
    function q(sel) { return box.querySelector(sel); }
    var r = {};

    var dp = new Tucano.DatePicker(q('.x-date'), { time: true });
    dp.setValue('2026-09-07T10:00', { silent: true });
    dp.open();
    r.clear = dp.panel.querySelector('.tuc-dp__footer .is-ghost').textContent;
    r.apply = dp.panel.querySelector('.tuc-dp__footer .is-primary').textContent;
    r.previousMonth = dp.panel.querySelector('.tuc-dp__nav').getAttribute('aria-label');
    r.day = dp.panel.querySelector('[data-date="2026-09-07"]').getAttribute('aria-label');
    r.placeholder = q('.x-date').placeholder;
    dp.destroy();

    var sel = new Tucano.Select(q('.x-sel'), { search: true });
    r.remove = q('.tuc-select__tagx').getAttribute('aria-label');
    sel.open();
    sel.search.value = 'zzz';
    sel.search.dispatchEvent(new Event('input', { bubbles: true }));
    r.empty = sel.menu.querySelector('.tuc-select__empty').textContent;
    r.search = sel.search.placeholder;
    sel.destroy();

    var mask = new Tucano.Mask(q('.x-pass'), { reveal: true });
    r.show = mask.eye.getAttribute('aria-label');
    mask.eye.click();
    r.hide = mask.eye.getAttribute('aria-label');
    mask.destroy();

    var editor = new Tucano.Editor(q('.x-ed'));
    r.bold = editor.toolbar.querySelector('[data-action="bold"]').getAttribute('aria-label');
    editor.destroy();

    var upload = new Tucano.Upload(q('.x-up'));
    r.zone = upload.zone.querySelector('.tuc-upload__label').textContent;
    upload.destroy();

    new Tucano.Table(q('.x-tb'), { selectable: true, sortable: false });
    r.selectRow = q('.x-tb tbody .tuc-table__check').getAttribute('aria-label');

    var color = new Tucano.ColorPicker(q('.x-color'));
    r.pick = color.swatch.getAttribute('aria-label');
    color.destroy();

    r.modalClose = new Tucano.Modal({ title: 'x' }).panel.querySelector('.tuc-modal__close').getAttribute('aria-label');
    r.drawerClose = new Tucano.Drawer({ title: 'x' }).panel.querySelector('.tuc-drawer__close').getAttribute('aria-label');
    var toast = Tucano.toast({ text: 'x', duration: null });
    r.toastClose = toast.node.querySelector('.tuc-toast__close').getAttribute('aria-label');
    toast.close();
    r.prev = new Tucano.Pagination({ page: 2, pages: 5 }).node.querySelector('.tuc-pagination__word').textContent;
    Tucano.autoInitProse(box);
    r.copy = q('.tuc-copy').getAttribute('aria-label');
    r.cpfError = Tucano.FORMATS.cpf.error;

    box.remove();
    return r;
  }
  var ptTexts = {
    clear: 'Limpar', apply: 'Aplicar', previousMonth: 'Mês anterior', placeholder: 'dd/mm/aaaa hh:mm',
    day: 'segunda-feira, 7 de setembro de 2026', remove: 'Remover A', empty: 'Nenhum resultado', search: 'Buscar...',
    show: 'Mostrar', hide: 'Ocultar', bold: 'Negrito', zone: 'Arraste um arquivo aqui ou clique para escolher',
    selectRow: 'Selecionar linha', pick: 'Escolher cor', modalClose: 'Fechar', drawerClose: 'Fechar',
    toastClose: 'Fechar', prev: 'Anterior', copy: 'Copiar código', cpfError: 'CPF inválido',
  };
  function compare(got, expected) {
    var wrong = Object.keys(expected).filter(function (k) { return got[k] !== expected[k]; });
    if (wrong.length) throw new Error(wrong.map(function (k) { return k + ' = ' + got[k]; }).join(' | '));
  }
  t('textos: sem setTexts, tudo continua em português', function () {
    compare(readTexts(), ptTexts);
  });
  t('textos: setTexts troca o texto de quem monta depois', function () {
    var saved = Tucano.getTexts();
    try {
      Tucano.setTexts({
        datepicker: { clear: 'Clear', apply: 'Apply', previousMonth: 'Previous month', placeholderLetters: 'ymdhms' },
        select: { searchPlaceholder: 'Search...', emptyText: 'No results', remove: function (label) { return 'Remove ' + label; } },
        mask: { show: 'Show', hide: 'Hide', cpf: 'Invalid CPF' },
        editor: { bold: 'Bold' },
        upload: { zoneOne: 'Drop a file here' },
        table: { selectRow: 'Select row' },
        colorpicker: { pick: 'Pick a color' },
        modal: { close: 'Close' },
        drawer: { close: 'Close panel' },
        toast: { close: 'Dismiss' },
        pagination: { prevText: 'Previous' },
        prose: { copy: 'Copy code' },
      });
      compare(readTexts(), {
        clear: 'Clear', apply: 'Apply', previousMonth: 'Previous month', placeholder: 'dd/mm/yyyy hh:mm',
        remove: 'Remove A', empty: 'No results', search: 'Search...', show: 'Show', hide: 'Hide', bold: 'Bold',
        zone: 'Drop a file here', selectRow: 'Select row', pick: 'Pick a color', modalClose: 'Close',
        drawerClose: 'Close panel', toastClose: 'Dismiss', prev: 'Previous', copy: 'Copy code', cpfError: 'Invalid CPF',
      });
      // A troca é chave a chave: o que não foi passado continua em português.
      if (Tucano.getTexts().datepicker.nextMonth !== 'Próximo mês') throw new Error('apagou o resto do grupo');
    } finally {
      Tucano.setTexts(saved);
    }
  });
  t('textos: a opção da instância vence o setTexts', function () {
    var saved = Tucano.getTexts();
    var box = document.createElement('div');
    box.innerHTML = '<select multiple><option value="a">A</option></select><input type="file">';
    document.body.append(box);
    try {
      Tucano.setTexts({ select: { emptyText: 'No results' }, upload: { zoneOne: 'Drop a file here' }, pagination: { prevText: 'Previous' } });
      var sel = new Tucano.Select(box.querySelector('select'), { search: true, emptyText: 'Nada por aqui' });
      sel.open();
      sel.search.value = 'zzz';
      sel.search.dispatchEvent(new Event('input', { bubbles: true }));
      var empty = sel.menu.querySelector('.tuc-select__empty').textContent;
      sel.destroy();
      if (empty !== 'Nada por aqui') throw new Error('select: ' + empty);
      var upload = new Tucano.Upload(box.querySelector('input'), { texts: { zoneOne: 'Solte aqui' } });
      var zone = upload.zone.querySelector('.tuc-upload__label').textContent;
      upload.destroy();
      if (zone !== 'Solte aqui') throw new Error('upload: ' + zone);
      var prev = new Tucano.Pagination({ page: 2, pages: 5, prevText: 'Voltar' }).node.querySelector('.tuc-pagination__word').textContent;
      if (prev !== 'Voltar') throw new Error('paginação: ' + prev);
    } finally {
      box.remove();
      Tucano.setTexts(saved);
    }
  });
  t('textos: getTexts devolve cópia, e restaurar volta ao português', function () {
    Tucano.getTexts().datepicker.clear = 'mexido';
    if (Tucano.getTexts().datepicker.clear !== 'Limpar') throw new Error('getTexts devolveu o objeto de verdade');
    compare(readTexts(), ptTexts);
  });
  /* Color picker: cada caso monta o próprio campo num <form> e sai limpo. */
  function colorBox(html) {
    var box = document.createElement('form');
    box.innerHTML = html;
    document.body.append(box);
    Tucano.init(box);
    return box;
  }
  t('color picker: sem opacidade, o alfa do valor inicial sai', function () {
    // O construtor lia o valor sem passar pelo setValue, e #ff000080 ficava
    // no campo com a trilha de opacidade escondida.
    var box = colorBox('<input data-tuc-color data-alpha="false" value="#ff000080">');
    var value = box.querySelector('input').value;
    box.querySelector('input')._tucano.destroy(); box.remove();
    if (value !== '#ff0000') throw new Error(value);
  });
  t('color picker: campo sem valor nasce vazio, e o required barra o envio', function () {
    // Antes o componente escolhia uma cor sozinho: o formulario postava o que
    // ninguem escolheu e o required nunca barrava, porque nunca estava vazio.
    var box = colorBox('<input data-tuc-color name="cor" required>');
    var input = box.querySelector('input');
    var i = input._tucano;
    var inicial = input.value;
    var vazio = inicial === '' && i.getValue() === null && i.getRgb() === null;
    var barrou = !box.checkValidity();
    i.setValue('#16a34a');
    var escolheu = input.value === '#16a34a' && box.checkValidity();
    i.setValue('');
    var limpou = input.value === '' && i.getValue() === null;
    i.destroy(); box.remove();
    if (!vazio) throw new Error('nasceu com "' + inicial + '"');
    if (!barrou) throw new Error('required não barrou o campo vazio');
    if (!escolheu) throw new Error('escolher não preencheu o campo');
    if (!limpou) throw new Error('setValue("") não limpou');
  });
  t('color picker: campo desativado ou só leitura não abre', function () {
    var box = colorBox('<input data-tuc-color disabled><input data-tuc-color readonly>'
      + '<fieldset disabled><input data-tuc-color></fieldset>');
    var opened = [].map.call(box.querySelectorAll('input[data-tuc-color]'), function (i) {
      i._tucano.open(); var o = i._tucano.isOpen; i._tucano.destroy(); return o;
    });
    box.remove();
    if (opened.indexOf(true) >= 0) throw new Error('abriu: ' + opened.join(','));
  });
  t('color picker: segunda instância substitui a primeira, e o init volta depois do destroy', function () {
    var box = colorBox('<input data-tuc-color value="#123456">');
    var i = box.querySelector('input');
    new Tucano.ColorPicker(i);
    var fields = box.querySelectorAll('.tuc-color-field').length;
    i._tucano.destroy();
    var after = box.querySelectorAll('.tuc-color-field').length;
    var again = Tucano.init(box).colorpickers.length;
    i._tucano.destroy(); box.remove();
    if (fields !== 1) throw new Error(fields + ' envoltórios');
    if (after !== 0) throw new Error('destroy deixou ' + after + ' envoltório(s)');
    if (again !== 1) throw new Error('o init depois do destroy pulou o campo');
  });
  t('color picker: data-swatches com rgb() e amostra marcada pelo alfa', function () {
    var box = colorBox('<input data-tuc-color data-swatches="rgb(255, 0, 0),#00ff0080,#00ff00" value="#00ff00">');
    var c = box.querySelector('input')._tucano;
    c.open();
    var names = function (sel) { return [].map.call(c.panel.querySelectorAll(sel), function (b) { return b.getAttribute('aria-label'); }).join('|'); };
    var labels = names('.tuc-colorpicker__swatchbtn'), selected = names('.is-selected');
    c.destroy(); box.remove();
    if (labels !== 'rgb(255, 0, 0)|#00ff0080|#00ff00') throw new Error('amostras: ' + labels);
    if (selected !== '#00ff00') throw new Error('marcada: ' + selected);
  });
  t('color picker: cinza e preto guardam a matiz', function () {
    var box = colorBox('<input data-tuc-color value="#0284c7">');
    var c = box.querySelector('input')._tucano;
    c.setValue('#808080'); var gray = Math.round(c.hsva.h);
    c.setValue('#000000'); var black = Math.round(c.hsva.h);
    c.destroy(); box.remove();
    if (gray !== 200 || black !== 200) throw new Error('matiz ' + gray + ' / ' + black);
  });
  t('color picker: texto inválido no campo do painel volta ao valor', function () {
    // O change sai com o foco ainda no campo, e o _paint pula campo focado.
    var box = colorBox('<input data-tuc-color value="#4f46e5">');
    var c = box.querySelector('input')._tucano;
    c.open(); c.hexField.focus(); c.hexField.value = '#12';
    c.hexField.dispatchEvent(new Event('change', { bubbles: true }));
    var shown = c.hexField.value;
    c.destroy(); box.remove();
    if (shown !== '#4f46e5') throw new Error('o campo mostra ' + shown);
  });
  t('color picker: digitar no campo não repete o change, e tecla na borda não emite', function () {
    var box = colorBox('<input data-tuc-color value="#ffffff">');
    var i = box.querySelector('input'), c = i._tucano, n = { change: 0, tucano: 0 };
    i.addEventListener('change', function () { n.change++; });
    i.addEventListener('tucano:change', function () { n.tucano++; });
    i.value = '#FF0000';
    i.dispatchEvent(new Event('change', { bubbles: true }));
    var typed = n.change + '/' + n.tucano + ' ' + i.value;
    c.setValue('#ffffff', { silent: true }); c.open(); n.tucano = 0;
    c.area.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    var edge = n.tucano;
    c.destroy(); box.remove();
    if (typed !== '1/1 #ff0000') throw new Error('digitado: change/tucano:change ' + typed);
    if (edge !== 0) throw new Error('a tecla na borda emitiu ' + edge + ' vez(es)');
  });
  t('init é idempotente: rodar de novo não duplica nada', function () {
    var before = document.querySelectorAll('.tuc-editor__toolbar').length;
    Tucano.init(document);
    if (document.querySelectorAll('.tuc-editor__toolbar').length !== before) throw new Error('duplicou');
  });

  /*
   * Casos assincronos, um de cada vez: o upload direto resolve por promessa, e
   * os casos trocam o XMLHttpRequest global. O resultado so e escrito depois.
   */
  var chain = Promise.resolve();
  function ta(name, fn) {
    chain = chain.then(fn).then(function () { out[name] = 'ok'; }, function (e) { out[name] = 'ERRO: ' + e.message; });
  }
  function tick(ms) { return new Promise(function (ok) { setTimeout(ok, ms || 0); }); }
  /* XHR de mentira: guarda cada envio, e o caso decide quando e como termina. */
  function fakeXhr() {
    var Real = window.XMLHttpRequest, sent = [];
    window.XMLHttpRequest = function () {
      var x = new EventTarget();
      x.upload = new EventTarget(); x.headers = {}; x.status = 0; x.response = null;
      x.open = function (m, u) { x.url = u; };
      x.setRequestHeader = function (k, v) { x.headers[k] = v; };
      x.send = function () { sent.push(x); };
      x.abort = function () { x.aborted = true; x.dispatchEvent(new Event('abort')); };
      x.finish = function (status, response) { x.status = status; x.response = response; x.dispatchEvent(new Event('load')); };
      return x;
    };
    return { sent: sent, restore: function () { window.XMLHttpRequest = Real; } };
  }
  function uploadBox(html, opts) {
    var box = document.createElement('div');
    box.innerHTML = html;
    document.body.append(box);
    var input = box.querySelector('input[type=file]');
    return { box: box, input: input, up: new Tucano.Upload(input, opts || {}) };
  }
  function fileList(files) { var dt = new DataTransfer(); files.forEach(function (f) { dt.items.add(f); }); return dt; }
  /* O que a janela do sistema faz: troca input.files e dispara change. */
  function pick(input, files) { input.files = fileList(files).files; input.dispatchEvent(new Event('change', { bubbles: true })); }
  function drop(up, files) { up.zone.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: fileList(files) })); }
  function mkFile(name, type) { return new File(['x'], name, { type: type || 'text/plain' }); }
  function posted(form) { return [].map.call(new FormData(form).getAll('doc').concat(new FormData(form).getAll('f')), function (v) { return v.name || v; }).join(','); }

  ta('upload de um arquivo: recusado não apaga o anterior, nem no servidor', async function () {
    var a = uploadBox('<form><input type="file" name="doc" accept=".pdf"></form>');
    try {
      pick(a.input, [mkFile('contrato.pdf', 'application/pdf')]);
      pick(a.input, [mkFile('foto.png', 'image/png')]);
      if (posted(a.box.querySelector('form')) !== 'contrato.pdf') throw new Error('formulário posta: ' + posted(a.box.querySelector('form')));
      if (a.up.getFiles().length !== 1) throw new Error('lista com ' + a.up.getFiles().length);
    } finally { a.up.destroy(); a.box.remove(); }
    var x = fakeXhr(), realFetch = window.fetch, deletes = [];
    window.fetch = function (u) { deletes.push(u); return Promise.resolve(); };
    var b = uploadBox('<input type="file" name="doc" accept=".pdf">', { url: '/up/', deleteUrl: '/up/' });
    try {
      drop(b.up, [mkFile('contrato.pdf', 'application/pdf')]);
      x.sent[0].finish(200, { id: 7 });
      await tick();
      drop(b.up, [mkFile('foto.png', 'image/png')]);
      if (deletes.length) throw new Error('DELETE do anterior: ' + deletes);
      if (b.up.getValue().join() !== '7') throw new Error('valor ' + b.up.getValue());
    } finally { x.restore(); window.fetch = realFetch; b.up.destroy(); b.box.remove(); }
  });
  ta('upload no formulário: reset esvazia a lista junto com o input', async function () {
    var a = uploadBox('<form><input type="file" name="doc" multiple></form>');
    try {
      pick(a.input, [mkFile('a.txt'), mkFile('b.txt')]);
      a.box.querySelector('form').reset();
      await tick(20);
      if (a.up.getFiles().length || a.up.list.querySelector('.tuc-upload__item')) throw new Error('a lista ficou com ' + a.up.getFiles().length);
    } finally { a.up.destroy(); a.box.remove(); }
  });
  ta('upload: destroy no meio do envio aborta, não emite e devolve name e tabindex', async function () {
    var x = fakeXhr();
    var a = uploadBox('<form><input type="file" name="photos" tabindex="3"></form>', { url: '/up/' });
    var events = 0;
    a.input.addEventListener('tucano:change', function () { events++; });
    try {
      drop(a.up, [mkFile('a.png', 'image/png')]);
      events = 0;
      a.up.destroy();
      await tick();
      if (!x.sent[0].aborted) throw new Error('o XHR continuou');
      if (events) throw new Error(events + ' evento(s) depois do destroy');
      if (a.input.name !== 'photos') throw new Error('name: "' + a.input.name + '"');
      if (a.input.getAttribute('tabindex') !== '3') throw new Error('tabindex: ' + a.input.getAttribute('tabindex'));
    } finally { x.restore(); a.box.remove(); }
  });
  ta('upload direto: 2xx sem id vira erro, e não fica pronto sem postar nada', async function () {
    var x = fakeXhr();
    var a = uploadBox('<form><input type="file" name="f"></form>', { url: '/up/' });
    try {
      drop(a.up, [mkFile('a.txt')]);
      x.sent[0].finish(200, null);
      await tick();
      var f = a.up.getFiles()[0];
      if (f.status !== 'error' || f.id !== null) throw new Error(f.status + ' / ' + f.id);
      if (a.up.list.querySelector('.tuc-upload__meta').textContent !== 'O servidor não devolveu o id') throw new Error('mensagem');
    } finally { x.restore(); a.up.destroy(); a.box.remove(); }
  });
  ta('upload direto: CSRF só para a mesma origem, e o informado vence em qualquer caixa', async function () {
    var x = fakeXhr();
    Object.defineProperty(document, 'cookie', { configurable: true, get: function () { return 'csrftoken=DOCOOKIE'; } });
    var a = uploadBox('<input type="file" multiple>', { url: '/up/' });
    try {
      drop(a.up, [mkFile('a.txt')]);
      a.up.opts.headers = { 'x-csrftoken': 'MEU' };
      drop(a.up, [mkFile('b.txt')]);
      a.up.opts.headers = { 'X-CSRFToken': null };
      drop(a.up, [mkFile('n.txt')]);
      a.up.opts.headers = {};
      a.up.opts.url = 'https://outro.exemplo/up/';
      drop(a.up, [mkFile('c.txt')]);
      var h = x.sent.map(function (s) { return JSON.stringify(s.headers); });
      if (h[0] !== '{"X-CSRFToken":"DOCOOKIE"}') throw new Error('mesma origem: ' + h[0]);
      if (h[1] !== '{"x-csrftoken":"MEU"}') throw new Error('minúsculo: ' + h[1]);
      if (h[2] !== '{}') throw new Error('null não desliga: ' + h[2]);
      if (h[3] !== '{}') throw new Error('outra origem: ' + h[3]);
    } finally { delete document.cookie; x.restore(); a.up.destroy(); a.box.remove(); }
  });
  ta('upload direto: DELETE codifica o id, e o hidden leva o form= do input', async function () {
    var x = fakeXhr(), realFetch = window.fetch, deletes = [];
    window.fetch = function (u) { deletes.push(u); return Promise.resolve(); };
    var a = uploadBox('<form id="upf"></form><input type="file" name="f" form="upf">', { url: '/up/', deleteUrl: '/api/temp/' });
    try {
      drop(a.up, [mkFile('a.txt')]);
      x.sent[0].finish(200, { id: '../../admin/7' });
      await tick();
      var ids = new FormData(document.getElementById('upf')).getAll('f');
      if (ids.join() !== '../../admin/7') throw new Error('form= posta: ' + ids.join());
      a.up.clear();
      if (deletes[0] !== '/api/temp/..%2F..%2Fadmin%2F7/') throw new Error('DELETE em ' + deletes[0]);
    } finally { x.restore(); window.fetch = realFetch; a.up.destroy(); a.box.remove(); }
  });
  ta('upload: desativado não aceita arquivo solto; clear com envio emite uma vez', async function () {
    var x = fakeXhr();
    var a = uploadBox('<form><fieldset disabled><input type="file" name="f" multiple></fieldset></form>', { url: '/up/' });
    try {
      drop(a.up, [mkFile('a.txt')]);
      if (x.sent.length || a.up.getFiles().length) throw new Error('entrou com o campo desativado');
      a.box.querySelector('fieldset').disabled = false;
      drop(a.up, [mkFile('a.txt')]);
      var events = 0;
      a.input.addEventListener('tucano:change', function () { events++; });
      a.up.clear();
      await tick();
      if (events !== 1) throw new Error(events + ' eventos no clear');
    } finally { x.restore(); a.up.destroy(); a.box.remove(); }
  });

  chain.then(function () {
    out.__errors = errors;
    document.getElementById('result').textContent = JSON.stringify(out);
  });
})();
</script></body></html>`;

const file = join(tmpdir(), `tucano-behavior-${process.pid}.html`);
writeFileSync(file, page());

/* Um navegador: abre a pagina, espera o resultado e devolve as linhas e a contagem. */
async function run(name) {
  const lines = [];
  const { browser, page: tab } = await openPage(name);
  try {
    await tab.goto(pathToFileURL(file).href);
    await tab.waitForFunction(() => document.getElementById('result')?.textContent.trim(), null, { timeout: 30000 })
      .catch(() => { throw new Error('a página de teste não produziu resultado em 30 s'); });
    const r = JSON.parse(await tab.textContent('#result'));
    const errors = r.__errors; delete r.__errors;
    let failures = 0;
    for (const [test, value] of Object.entries(r)) {
      lines.push(`  ${value === 'ok' ? 'ok    ' : 'FALHA '} ${test}${value === 'ok' ? '' : '  ' + value}`);
      if (value !== 'ok') failures++;
    }
    if (errors.length) { lines.push(`  FALHA  erro de console: ${errors.join(' | ')}`); failures++; }
    return { name, lines, failures, total: Object.keys(r).length };
  } catch (e) {
    lines.push(`  FALHA  ${e.message}`);
    return { name, lines, failures: 1, total: 0 };
  } finally {
    await browser.close();
  }
}

let results;
try {
  // Em paralelo: cada motor tem o proprio processo e a propria pagina. A saida
  // e agrupada por navegador so no fim, para as linhas nao se misturarem.
  results = await Promise.all(BROWSERS.map(run));
} finally {
  unlinkSync(file);
}
for (const r of results) console.log(`\n[${r.name}]\n${r.lines.join('\n')}`);
console.log('\n' + results.map((r) => (r.failures
  ? `${r.name}: ${r.failures} de ${r.total} com problema`
  : `${r.name}: ${r.total} comportamentos verificados`)).join(' · '));
process.exit(results.some((r) => r.failures) ? 1 : 0);
