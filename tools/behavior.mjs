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
<ol class="tuc-timeline" id="tl"><li class="tuc-timeline__item is-success"><div class="tuc-timeline__head"><span class="tuc-timeline__title">A</span></div></li><li class="tuc-timeline__item"><div class="tuc-timeline__head"><span class="tuc-timeline__title">B</span></div></li></ol>
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
    var setas = i.panel.querySelectorAll('.tuc-dp__nav:not(.is-placeholder)');
    if (!setas.length) throw new Error('sem setas');
    var proxima = setas[setas.length - 1], c = getComputedStyle(proxima);
    if (c.visibility !== 'visible' || c.pointerEvents === 'none') throw new Error('seta ' + c.visibility + ' / ' + c.pointerEvents);
    var antes = i.panel.querySelector('.tuc-dp__label').textContent;
    proxima.click();
    var depois = i.panel.querySelector('.tuc-dp__label').textContent;
    i.close();
    if (antes === depois) throw new Error('o mês não mudou: ' + depois);
  });
  t('arquivo recusado vira o aviso do sistema, anunciado', function () {
    document.getElementById('u')._tucano._fail('Maior que 5 MB', { name: 'contrato.pdf' });
    var aviso = document.querySelector('.tuc-upload .tuc-alert.is-danger[role="alert"]');
    if (!aviso) throw new Error('sem .tuc-alert is-danger com role=alert');
    if (aviso.querySelector('.tuc-alert__title').textContent !== 'contrato.pdf') throw new Error('título errado');
    aviso.remove();
  });
  t('toast de carregando usa o spinner do sistema', function () {
    var x = Tucano.toast({ type: 'loading', text: 'Enviando' });
    var ok = !!document.querySelector('.tuc-toast.is-loading .tuc-toast__icon > .tuc-spinner');
    x.close();
    if (!ok) throw new Error('sem .tuc-spinner');
  });
  t('limpar do select é o botão do sistema e some sem valor', function () {
    var nativo = document.createElement('select');
    nativo.innerHTML = '<option value="">—</option><option value="a">A</option>';
    document.body.append(nativo);
    var inst = new Tucano.Select(nativo, { clearable: true });
    var limpar = inst.control.querySelector('.tuc-select__clear');
    var erro = null;
    if (!limpar || !limpar.classList.contains('tuc-btn')) erro = 'não é .tuc-btn';
    else if (getComputedStyle(limpar).display !== 'none') erro = 'aparece sem valor';
    else {
      inst.setValue('a');
      if (getComputedStyle(limpar).display === 'none') erro = 'não aparece com valor';
    }
    inst.control.remove(); nativo.remove();
    if (erro) throw new Error(erro);
  });
  t('linha do tempo desenha ponto no tom e tira o trilho do último', function () {
    var itens = document.querySelectorAll('#tl .tuc-timeline__item');
    var cor = document.createElement('span');
    cor.style.color = 'var(--tuc-success)';
    document.body.append(cor);
    var sucesso = getComputedStyle(cor).color;
    cor.remove();
    if (getComputedStyle(document.getElementById('tl')).listStyleType !== 'none') throw new Error('lista com marcador');
    if (getComputedStyle(itens[0], '::after').borderTopColor !== sucesso) throw new Error('ponto fora do tom');
    if (getComputedStyle(itens[0], '::before').display === 'none') throw new Error('primeiro item sem trilho');
    if (getComputedStyle(itens[1], '::before').display !== 'none') throw new Error('último item com trilho');
  });
  t('toast do Django acha o tipo mesmo com extra_tags na frente', function () {
    var box = document.createElement('div');
    box.innerHTML = '<div data-tuc-toast data-type="destaque success">Salvo</div>';
    document.body.append(box);
    var criados = Tucano.autoInitToasts(box);
    var tipo = criados[0] && criados[0].node.className;
    criados.forEach(function (x) { x.close(); });
    box.remove();
    if (!/is-success/.test(tipo || '')) throw new Error('classe: ' + tipo);
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
    var painel = document.createElement('div');
    painel.innerHTML = '<button class="tuc-dropdown__item">A</button>';
    var gatilho = document.createElement('button');
    document.body.append(gatilho);
    var dd = new Tucano.Dropdown(gatilho, { panel: painel });
    var item = painel.querySelector('.tuc-dropdown__item');
    var papel = item.getAttribute('role'), tab = item.getAttribute('tabindex');
    dd.destroy(); gatilho.remove();
    if (papel !== 'menuitem' || tab !== '-1') throw new Error('role ' + papel + ', tabindex ' + tab);
  });
  t('período em ISO volta ao campo como as datas certas', function () {
    // É o que o Django devolve ao campo quando o formulário volta com erro.
    var box = document.createElement('div');
    box.innerHTML = '<input data-tuc-datepicker data-mode="range" value="2026-03-01,2026-03-15">';
    document.body.append(box);
    Tucano.init(box);
    var i = box.querySelector('input')._tucano;
    var ok = i.start && i.end && i.start.getMonth() === 2 && i.start.getDate() === 1 && i.end.getDate() === 15;
    var visto = box.querySelector('input').value;
    box.remove();
    if (!ok) throw new Error('lido como ' + visto);
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
    box.innerHTML = '<span class="tuc-badge is-info" id="padrao">a</span><div style="--tuc-info:#00aa00"><span class="tuc-badge is-info" id="trocado">b</span></div>';
    document.body.append(box);
    var a = getComputedStyle(box.querySelector('#padrao')).backgroundColor;
    var b = getComputedStyle(box.querySelector('#trocado')).backgroundColor;
    box.remove();
    if (a === b) throw new Error('fundo não mudou: ' + b);
  });
  t('painel do select dentro de um modal nasce no próprio diálogo', function () {
    // No body ele ficava atrás do <dialog>, que está na top layer.
    limpar();
    var m = Tucano.modal({ title: 'Com campo', text: 'x' });
    var dlg = document.querySelector('dialog[open]');
    var nativo = document.createElement('select');
    nativo.innerHTML = '<option>A</option><option>B</option>';
    dlg.querySelector('.tuc-modal__panel').append(nativo);
    var sel = new Tucano.Select(nativo);
    sel.open();
    // O menu desta instância: a página tem outro select, cujo menu mora no body.
    var menu = sel.menu;
    var dentro = !!menu && dlg.contains(menu);
    sel.close(); m.close(); limpar();
    if (!dentro) throw new Error('o menu não está dentro do diálogo');
  });
  t('modal sem título ganha nome pelo texto', function () {
    limpar();
    var m = Tucano.modal({ text: 'Excluir o contrato 12?' });
    var nome = document.querySelector('dialog[open]').getAttribute('aria-label');
    m.close(); limpar();
    if (nome !== 'Excluir o contrato 12?') throw new Error('aria-label ' + nome);
  });
  t('pontas da paginação têm nome, e setPage devolve o foco', function () {
    var box = document.createElement('div');
    document.body.append(box);
    var p = new Tucano.Pagination({ page: 2, pages: 9, onChange: function () {} });
    box.append(p.node);
    var pontas = p.node.querySelectorAll('a.tuc-pagination__edge');
    var nomes = [].map.call(pontas, function (a) { return a.getAttribute('aria-label'); }).join('|');
    p.node.querySelector('a[aria-current="page"]').focus();
    p.setPage(3);
    var foco = document.activeElement && document.activeElement.getAttribute('aria-current');
    var atual = document.activeElement && document.activeElement.textContent.trim();
    box.remove();
    if (nomes !== 'Anterior|Próxima') throw new Error('nomes ' + nomes);
    if (foco !== 'page' || atual !== '3') throw new Error('foco em ' + atual);
  });
  t('máscara não apaga o erro do servidor ao focar', function () {
    // O Django 5 escreve aria-invalid no campo que voltou com erro. A máscara sem
    // data-validate não é dona desse atributo e não pode zerá-lo no foco.
    var box = document.createElement('div');
    box.innerHTML = '<input data-tuc-mask="cpf" aria-invalid="true">';
    document.body.append(box);
    Tucano.init(box);
    var campo = box.querySelector('input');
    campo.dispatchEvent(new FocusEvent('focus'));
    var marca = campo.getAttribute('aria-invalid');
    box.remove();
    if (marca !== 'true') throw new Error('aria-invalid virou ' + marca);
  });
  t('máscara com validação fica verde quando o CPF fica certo, sem sair do campo', function () {
    // O acerto aparece na hora: antes, o valor certo não tinha estado nenhum e só o
    // erro, ao sair do campo, mudava a borda.
    var campo = document.createElement('input');
    campo.className = 'tuc-input';
    document.body.append(campo);
    var m = new Tucano.Mask(campo, { format: 'cpf', validate: true });
    campo.value = '11144477735';
    campo.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
    var verde = campo.hasAttribute('data-tuc-valid');
    var borda = getComputedStyle(campo).borderTopColor;
    var sonda = document.createElement('span');
    sonda.style.color = 'var(--tuc-success)';
    document.body.append(sonda);
    var sucesso = getComputedStyle(sonda).color;
    sonda.remove(); m.destroy(); campo.remove();
    if (!verde) throw new Error('sem data-tuc-valid com o CPF certo');
    if (borda !== sucesso) throw new Error('borda ' + borda + ', esperado ' + sucesso);
  });
  t('máscara com validação não acusa erro digitando, e acusa ao sair do campo', function () {
    var campo = document.createElement('input');
    campo.className = 'tuc-input';
    document.body.append(campo);
    var m = new Tucano.Mask(campo, { format: 'cpf', validate: true });
    campo.value = '11144477700';
    campo.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
    var digitando = { invalido: campo.getAttribute('aria-invalid'), verde: campo.hasAttribute('data-tuc-valid') };
    campo.dispatchEvent(new FocusEvent('blur'));
    var saiu = { invalido: campo.getAttribute('aria-invalid'), verde: campo.hasAttribute('data-tuc-valid') };
    m.destroy(); campo.remove();
    if (digitando.invalido === 'true') throw new Error('ficou vermelho no meio da digitação');
    if (digitando.verde) throw new Error('CPF errado ficou verde');
    if (saiu.invalido !== 'true' || saiu.verde) throw new Error('ao sair: ' + JSON.stringify(saiu));
  });
  t('setValue do campo sensível atualiza o que é enviado', function () {
    var box = document.createElement('div');
    box.innerHTML = '<input name="doc" data-tuc-mask="cpf" data-tuc-reveal>';
    document.body.append(box);
    Tucano.init(box);
    box.querySelector('input:not([type=hidden])')._tucano.setValue('11144477735');
    var escondido = box.querySelector('input[type=hidden]');
    var valor = escondido && escondido.value;
    box.remove();
    if (!escondido) throw new Error('sem campo escondido');
    if (valor !== '11144477735') throw new Error('escondido com "' + valor + '"');
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
  t('gaveta com conteúdo longo cabe na tela e rola no corpo', function () {
    // A grade do <dialog> crescia com o conteúdo: o painel ficava com a altura da
    // lista, passava da tela e o corpo, que devia rolar, nunca ficava menor que ela.
    limpar();
    var lista = document.createElement('nav');
    lista.className = 'tuc-menu';
    for (var i = 0; i < 60; i++) { var a = document.createElement('a'); a.className = 'tuc-menu__item'; a.href = '#'; a.textContent = 'Item ' + i; lista.append(a); }
    var g = Tucano.drawer({ title: 'Menu', side: 'left' });
    g.content(lista); g.open();
    var painel = document.querySelector('.tuc-drawer__panel'), corpo = document.querySelector('.tuc-drawer__body');
    if (painel.getBoundingClientRect().height > innerHeight + 1) throw new Error('painel passou da tela: ' + Math.round(painel.getBoundingClientRect().height) + 'px em ' + innerHeight);
    if (corpo.scrollHeight <= corpo.clientHeight) throw new Error('corpo não rola');
    g.close(); limpar();
  });
  t('diálogo aberto reserva o espaço da barra de rolagem, e só quando ela ocupa espaço', function () {
    // A trava de rolagem sumia com a barra, a página ganhava a largura dela e o
    // conteúdo de trás andava. Este Chrome roda com --hide-scrollbars, então a
    // barra nunca ocupa espaço aqui: o teste confere as duas metades do mecanismo.
    limpar();
    var raiz = document.documentElement;
    raiz.removeAttribute('data-tuc-gutter');
    var m = Tucano.modal({ title: 'M' });
    if (raiz.hasAttribute('data-tuc-gutter')) throw new Error('marcou sem barra que ocupa espaço');
    raiz.setAttribute('data-tuc-gutter', '');
    var comMarca = getComputedStyle(raiz).scrollbarGutter;
    m.close(); limpar();
    var fechado = getComputedStyle(raiz).scrollbarGutter;
    raiz.removeAttribute('data-tuc-gutter');
    if (comMarca !== 'stable') throw new Error('com a marca e diálogo aberto, scrollbar-gutter é ' + comMarca);
    if (fechado === 'stable') throw new Error('continuou reservando depois de fechar');
  });
  t('tabela larga rola sozinha no editor e no .tuc-prose, e a estreita ocupa a largura', function () {
    // Com a tabela presa em 100%, dez colunas viravam uma palavra por linha.
    // Vinte colunas: a página de teste é larga, e dez de 7rem ainda cabiam nela.
    var cols = function (n) { var h = ''; for (var i = 0; i < n; i++) h += '<td>Valor com texto ' + i + '</td>'; return '<table><tbody><tr>' + h + '</tr></tbody></table>'; };
    var ed = document.getElementById('ed')._tucano, antigo = ed.getValue();
    ed.setValue('<p>a</p>' + cols(20) + cols(2));
    var caixas = ed.area.querySelectorAll('.tuc-editor__scroll');
    if (caixas.length !== 2) throw new Error('editor: ' + caixas.length + ' caixa(s) para 2 tabelas');
    if (caixas[0].scrollWidth <= caixas[0].clientWidth) throw new Error('editor: tabela larga não rola');
    if (ed.area.scrollWidth > ed.area.clientWidth + 1) throw new Error('editor: a área inteira rola, e não só a tabela');
    var estreita = caixas[1].querySelector('table');
    if (Math.abs(estreita.getBoundingClientRect().width - caixas[1].clientWidth) > 1) throw new Error('editor: tabela de 2 colunas não ocupa a largura');
    if (ed.getValue().indexOf('div') >= 0) throw new Error('a caixa foi parar no valor salvo');
    caixas[0].querySelector('td').dispatchEvent(new Event('input', { bubbles: true }));
    ed.area.querySelector('table').remove();
    ed.area.dispatchEvent(new Event('input', { bubbles: true }));
    if (ed.area.querySelectorAll('.tuc-editor__scroll').length !== 1) throw new Error('editor: sobrou caixa vazia ao apagar a tabela');
    ed.setValue(antigo);

    var prose = document.createElement('div');
    prose.className = 'tuc-prose';
    prose.innerHTML = cols(20);
    document.body.append(prose);
    Tucano.init(prose);
    var caixa = prose.querySelector('.tuc-prose__scroll');
    var rola = caixa && caixa.scrollWidth > caixa.clientWidth, larguraProse = prose.scrollWidth <= prose.clientWidth + 1;
    Tucano.init(prose);
    var repetida = prose.querySelectorAll('.tuc-prose__scroll').length;
    prose.remove();
    if (!caixa) throw new Error('prose: tabela sem caixa');
    if (!rola) throw new Error('prose: tabela larga não rola');
    if (!larguraProse) throw new Error('prose: o bloco inteiro passou da largura');
    if (repetida !== 1) throw new Error('prose: init de novo criou ' + repetida + ' caixas');
  });
  t('menu numa coluna de altura fixa rola, em vez de vazar', function () {
    var coluna = document.createElement('div');
    coluna.style.cssText = 'display:flex;flex-direction:column;height:200px';
    var menu = document.createElement('nav');
    menu.className = 'tuc-menu';
    for (var i = 0; i < 30; i++) { var a = document.createElement('a'); a.className = 'tuc-menu__item'; a.href = '#'; a.textContent = 'Item ' + i; menu.append(a); }
    coluna.append(menu); document.body.append(coluna);
    var alto = menu.getBoundingClientRect().height, rola = menu.scrollHeight > menu.clientHeight;
    coluna.remove();
    if (alto > 201) throw new Error('menu vazou da coluna: ' + Math.round(alto) + 'px');
    if (!rola) throw new Error('menu não rola');
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
