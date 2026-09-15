/*
 * Playground: um componente por vez, as opcoes num formulario, a previa viva e
 * o codigo nos tres jeitos de usar.
 *
 * As opcoes nao sao escritas aqui. O tools/site.mjs as tira do codigo no build
 * (nome, padrao, valores, atributo data-*) e as poe na pagina num
 * <script type="application/json">; este arquivo so sabe apresentar. O que mora
 * aqui e o que o codigo nao diz: a marcacao de exemplo de cada componente e os
 * textos de demonstracao em cada idioma.
 *
 * Carregado so na pagina do playground, depois do dist/tucano.js e do site.js.
 */
(() => {
  const root = document.getElementById('playground');
  const manifestNode = document.getElementById('playground-api');
  if (!root || !manifestNode) return;

  const manifest = JSON.parse(manifestNode.textContent);
  const lang = document.documentElement.lang.slice(0, 2);

  /* Textos de demonstracao. O texto de interface dos componentes ja segue o
     idioma pelo setTexts do site.js; aqui e o conteudo dos exemplos. */
  const TEXTS = {
    pt: {
      defaultValue: 'Padrão', auto: 'automático', jsOnly: 'Só no JavaScript: não há atributo data-* para esta opção.',
      multiple: 'Aceita vários (atributo multiple)', show: 'Mostrar toast', openModal: 'Abrir modal', openDrawer: 'Abrir gaveta',
      cancel: 'Cancelar', confirm: 'Confirmar', close: 'Fechar', error: 'Não montou com estas opções',
      dateLabel: 'Vencimento', stateLabel: 'Estado',
      states: ['São Paulo', 'Rio de Janeiro', 'Minas Gerais', 'Bahia', 'Paraná', 'Rio Grande do Sul', 'Pernambuco', 'Ceará'],
      documentLabel: 'CPF', colorLabel: 'Cor da marca', fileLabel: 'Anexo', editorLabel: 'Descrição',
      editorPlaceholder: 'Descreva o contrato...', tooltipButton: 'Salvar rascunho', tooltipText: 'Guarda sem publicar',
      toastText: 'Contrato salvo', modalTitle: 'Excluir contrato?', modalText: 'Esta ação não pode ser desfeita.',
      drawerTitle: 'Filtros', drawerText: 'Refine a lista de contratos.',
      tabs: ['Dados', 'Endereço', 'Faturas'], panels: ['Razão social e CNPJ.', 'Rua, número e CEP.', 'Três faturas em aberto.'],
      headers: ['Cliente', 'Vencimento', 'Valor'],
      rows: [['Construtora Vale', '2026-09-12', '12/09/2026', 12400, 'R$ 12.400,00'],
        ['Agropecuária Serra', '2026-08-30', '30/08/2026', 8150.5, 'R$ 8.150,50'],
        ['Transportes Lima', '2026-10-05', '05/10/2026', 23900, 'R$ 23.900,00']],
    },
    en: {
      defaultValue: 'Default', auto: 'auto', jsOnly: 'JavaScript only: there is no data-* attribute for this option.',
      multiple: 'Accepts several (multiple attribute)', show: 'Show toast', openModal: 'Open modal', openDrawer: 'Open drawer',
      cancel: 'Cancel', confirm: 'Confirm', close: 'Close', error: 'Could not mount with these options',
      dateLabel: 'Due date', stateLabel: 'State',
      states: ['California', 'Texas', 'New York', 'Florida', 'Washington', 'Oregon', 'Nevada', 'Arizona'],
      documentLabel: 'CPF', colorLabel: 'Brand color', fileLabel: 'Attachment', editorLabel: 'Description',
      editorPlaceholder: 'Describe the contract...', tooltipButton: 'Save draft', tooltipText: 'Keeps it without publishing',
      toastText: 'Contract saved', modalTitle: 'Delete contract?', modalText: 'This action cannot be undone.',
      drawerTitle: 'Filters', drawerText: 'Narrow down the contract list.',
      tabs: ['Details', 'Address', 'Invoices'], panels: ['Company name and tax ID.', 'Street, number and ZIP code.', 'Three open invoices.'],
      headers: ['Customer', 'Due date', 'Amount'],
      rows: [['Vale Construction', '2026-09-12', '09/12/2026', 12400, '$12,400.00'],
        ['Serra Farms', '2026-08-30', '08/30/2026', 8150.5, '$8,150.50'],
        ['Lima Transport', '2026-10-05', '10/05/2026', 23900, '$23,900.00']],
    },
    es: {
      defaultValue: 'Por defecto', auto: 'automático', jsOnly: 'Solo en JavaScript: no hay atributo data-* para esta opción.',
      multiple: 'Acepta varios (atributo multiple)', show: 'Mostrar toast', openModal: 'Abrir modal', openDrawer: 'Abrir panel',
      cancel: 'Cancelar', confirm: 'Confirmar', close: 'Cerrar', error: 'No se montó con estas opciones',
      dateLabel: 'Vencimiento', stateLabel: 'Provincia',
      states: ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Bilbao', 'Málaga', 'Zaragoza', 'Granada'],
      documentLabel: 'CPF', colorLabel: 'Color de marca', fileLabel: 'Adjunto', editorLabel: 'Descripción',
      editorPlaceholder: 'Describe el contrato...', tooltipButton: 'Guardar borrador', tooltipText: 'Lo guarda sin publicar',
      toastText: 'Contrato guardado', modalTitle: '¿Eliminar contrato?', modalText: 'Esta acción no se puede deshacer.',
      drawerTitle: 'Filtros', drawerText: 'Acota la lista de contratos.',
      tabs: ['Datos', 'Dirección', 'Facturas'], panels: ['Razón social y NIF.', 'Calle, número y código postal.', 'Tres facturas pendientes.'],
      headers: ['Cliente', 'Vencimiento', 'Importe'],
      rows: [['Construcciones Vale', '2026-09-12', '12/09/2026', 12400, '12.400,00 €'],
        ['Agropecuaria Sierra', '2026-08-30', '30/08/2026', 8150.5, '8.150,50 €'],
        ['Transportes Lima', '2026-10-05', '05/10/2026', 23900, '23.900,00 €']],
    },
  };
  const T = TEXTS[lang] || TEXTS.pt;

  const escapeHtml = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const X_ICON = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>';
  const label = (id, text) => `<label class="tuc-label" for="${id}">${escapeHtml(text)}</label>\n`;

  /*
   * O <dialog> escrito no template, para modal e gaveta. Tamanho, tom e lado
   * viram classe, como no JavaScript; o X so existe com closable.
   */
  const dialogTemplate = (kind, { attrs, values, django }) => {
    const id = kind === 'modal' ? 'confirm-delete' : 'filters';
    const classes = [`tuc-${kind}`, kind === 'drawer' ? `is-${values.side}` : '', `is-${values.size}`, `is-${values.tone}`,
      values.sheet ? 'is-sheet' : ''].filter(Boolean).join(' ');
    const title = values.title ?? '';
    const panelTag = django ? 'form' : 'div';
    const panelAttrs = django ? ` method="post" action="{% url '${kind === 'modal' ? 'contract-delete' : 'contract-list'}' %}"` : '';
    return [
      `<dialog class="${classes}" id="${id}"${title ? ` aria-labelledby="${id}-title"` : ''}${attrs}>`,
      `  <${panelTag} class="tuc-${kind}__panel"${panelAttrs}>`,
      django ? '    {% csrf_token %}' : null,
      `    <div class="tuc-${kind}__top">`,
      `      <div class="tuc-${kind}__header">`,
      title ? `        <h2 class="tuc-${kind}__title" id="${id}-title">${escapeHtml(title)}</h2>` : null,
      values.text ? `        <p class="tuc-${kind}__text">${escapeHtml(values.text)}</p>` : null,
      '      </div>',
      values.closable ? `      <button type="button" class="tuc-btn is-ghost is-icon is-sm tuc-${kind}__close" aria-label="${T.close}" data-tuc-${kind}-close>…</button>` : null,
      '    </div>',
      `    <div class="tuc-${kind}__footer">`,
      `      <button type="button" class="tuc-btn is-outline" data-tuc-${kind}-close>${T.cancel}</button>`,
      `      <button${django ? '' : ' type="button"'} class="tuc-btn is-primary"${django ? '' : ` data-tuc-${kind}-close`}>${T.confirm}</button>`,
      '    </div>',
      `  </${panelTag}>`,
      '</dialog>',
      '',
      `<button type="button" class="tuc-btn is-outline" data-tuc-${kind}="#${id}">${kind === 'modal' ? T.openModal : T.openDrawer}</button>`,
    ].filter((line) => line !== null).join('\n');
  };

  /* A acao de exemplo entra no codigo e na previa: sem ela, com closable e
     closeOnBackdrop desligados, o dialogo da previa nao teria como fechar. */
  const dialogActions = `[\n    { text: '${T.cancel.replace(/'/g, "\\'")}' },\n    { text: '${T.confirm.replace(/'/g, "\\'")}', variant: 'primary' },\n  ]`;

  /*
   * Cada componente: a marcacao do exemplo, o seletor que o JavaScript usa, o
   * atributo que o marca para a inicializacao automatica e, quando e campo de
   * formulario, o widget do Django. `html` recebe os atributos ja montados — na
   * previa, so o gancho data-pg-target, porque ali quem monta e o JavaScript.
   */
  const DEMOS = {
    datepicker: {
      selector: '#due-date', marker: 'data-tuc-datepicker', field: 'due_date', widget: () => 'forms.TextInput',
      html: ({ attrs }) => `${label('due-date', T.dateLabel)}<input type="text" id="due-date" name="due_date"${attrs}>`,
    },
    select: {
      selector: '#state', marker: 'data-tuc-select', field: 'state', extras: ['multiple'],
      widget: (v) => (v.multiple ? 'forms.SelectMultiple' : 'forms.Select'),
      html: ({ attrs, values }) => `${label('state', T.stateLabel)}<select id="state" name="state"${values.multiple ? ' multiple' : ''}${attrs}>\n${
        values.multiple ? '' : '  <option value=""></option>\n'}${T.states.map((s) => `  <option>${escapeHtml(s)}</option>`).join('\n')}\n</select>`,
    },
    mask: {
      selector: '#document', marker: null, field: 'document', widget: () => 'forms.TextInput', initial: { format: 'cpf' },
      html: ({ attrs }) => `${label('document', T.documentLabel)}<input type="text" class="tuc-input" id="document" name="document"${attrs}>`,
    },
    colorpicker: {
      selector: '#brand-color', marker: 'data-tuc-color', field: 'color', widget: () => 'forms.TextInput',
      html: ({ attrs }) => `${label('brand-color', T.colorLabel)}<input type="text" id="brand-color" name="color" value="#ff7501"${attrs}>`,
    },
    upload: {
      selector: '#attachment', marker: 'data-tuc-upload', field: 'attachment', extras: ['multiple'],
      widget: (v) => (v.multiple ? 'MultipleFileInput' : 'forms.ClearableFileInput'),
      html: ({ attrs, values }) => `${label('attachment', T.fileLabel)}<input type="file" id="attachment" name="attachment"${values.multiple ? ' multiple' : ''}${attrs}>`,
    },
    editor: {
      selector: '#description', marker: 'data-tuc-editor', field: 'description', widget: () => 'forms.Textarea',
      initial: { placeholder: T.editorPlaceholder },
      html: ({ attrs }) => `${label('description', T.editorLabel)}<textarea id="description" name="description"${attrs}></textarea>`,
    },
    tooltip: {
      selector: '#save-draft', marker: null, initial: { text: T.tooltipText },
      html: ({ attrs }) => `<div class="bar"><button type="button" class="tuc-btn is-outline" id="save-draft"${attrs}>${escapeHtml(T.tooltipButton)}</button></div>`,
    },
    tabs: {
      selector: '#customer-tabs', marker: 'data-tuc-tabs', htmlOptions: ['selected'],
      html: ({ attrs, values }) => {
        const selected = Math.min(Math.max(values.selected ?? 0, 0), T.tabs.length - 1);
        return `<div class="tuc-tabs" id="customer-tabs"${attrs}>\n  <div class="tuc-tabs__list">\n${
          T.tabs.map((t, i) => `    <button class="tuc-tabs__tab"${i === selected ? ' aria-selected="true"' : ''}>${escapeHtml(t)}</button>`).join('\n')
        }\n  </div>\n${T.panels.map((p, i) => `  <div class="tuc-tabs__panel"${i === selected ? '' : ' hidden'}><p>${escapeHtml(p)}</p></div>`).join('\n')}\n</div>`;
      },
    },
    table: {
      selector: "document.querySelector('#contracts')", marker: 'data-tuc-table',
      html: ({ attrs, django }) => {
        const [customer, due, amount] = T.headers.map(escapeHtml);
        const head = `  <thead><tr>\n    <th data-sort="text" data-field="customer">${customer}</th>\n    <th data-sort="date" data-field="due_date">${due}</th>\n    <th data-sort="number" data-field="amount" class="is-number">${amount}</th>\n  </tr></thead>`;
        const rows = django
          ? '    {% for contract in page_obj %}\n    <tr data-id="{{ contract.pk }}">\n      <td>{{ contract.customer }}</td>\n      <td data-sort-value="{{ contract.due_date|date:\'Y-m-d\' }}">{{ contract.due_date }}</td>\n      <td class="is-number" data-sort-value="{{ contract.amount }}">{{ contract.amount }}</td>\n    </tr>\n    {% endfor %}'
          : T.rows.map((r, i) => `    <tr data-id="${i + 1}"><td>${escapeHtml(r[0])}</td><td data-sort-value="${r[1]}">${r[2]}</td><td class="is-number" data-sort-value="${r[3]}">${escapeHtml(r[4])}</td></tr>`).join('\n');
        return `<table id="contracts"${attrs}>\n${head}\n  <tbody>\n${rows}\n  </tbody>\n</table>`;
      },
    },
    pagination: {
      selector: '#pages', marker: 'data-tuc-pagination', initial: { page: 4, pages: 12 },
      html: ({ attrs }) => `<div id="pages"${attrs}></div>`,
    },
    toast: {
      marker: 'data-tuc-toast', htmlOptions: ['text'], initial: { text: T.toastText, type: 'success' },
      html: ({ attrs, values }) => `<div${attrs}>${escapeHtml(values.text ?? '')}</div>`,
    },
    modal: {
      marker: null, htmlOptions: ['title', 'text', 'size', 'tone', 'sheet'], actions: true,
      initial: { title: T.modalTitle, text: T.modalText },
      html: (ctx) => dialogTemplate('modal', ctx),
    },
    drawer: {
      marker: null, htmlOptions: ['title', 'text', 'side', 'size', 'tone'], actions: true,
      initial: { title: T.drawerTitle, text: T.drawerText },
      html: (ctx) => dialogTemplate('drawer', ctx),
    },
  };

  const form = document.getElementById('pg-controls');
  const stage = document.getElementById('pg-stage');
  const logList = document.getElementById('pg-log');
  const logEmpty = document.getElementById('pg-empty');
  const picker = document.getElementById('pg-component');
  const specs = new Map(manifest.map((s) => [s.name, s]));
  const states = new Map();

  let spec = null;
  let instance = null;
  let dialogs = [];
  let controlSelects = [];
  let typingTimer = null;

  const initialState = (s) => ({
    ...Object.fromEntries(s.options.map((o) => [o.name, o.default])),
    ...Object.fromEntries((DEMOS[s.name].extras || []).map((name) => [name, false])),
    ...DEMOS[s.name].initial,
  });

  /* So entra no codigo o que difere do padrao: o resto nao precisa ser escrito. */
  const changed = (s, values) => s.options.filter((o) => {
    const v = values[o.name];
    return v !== undefined && v !== null && v !== '' && v !== o.default;
  });

  /* ---- log dos callbacks ---- */

  const serialize = (value, depth = 0) => {
    if (typeof value === 'function') return undefined;
    if (value === null || typeof value !== 'object') return value;
    if (value instanceof Date) return value.toISOString();
    if (typeof File !== 'undefined' && value instanceof File) return { name: value.name, size: value.size, type: value.type };
    if (value instanceof Error) return value.message;
    if (value instanceof Element) return `<${value.tagName.toLowerCase()}>`;
    if (value.opts) return `[${spec?.className ?? 'instance'}]`;
    if (depth > 2) return '…';
    if (Array.isArray(value)) return value.map((v) => serialize(v, depth + 1));
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, serialize(v, depth + 1)]).filter(([, v]) => v !== undefined));
  };

  const log = (name, args) => {
    const item = document.createElement('li');
    const code = document.createElement('code');
    code.textContent = name;
    let text;
    try { text = JSON.stringify(serialize(args)); } catch { text = String(args); }
    item.append(code, text);
    logList.prepend(item);
    while (logList.children.length > 30) logList.lastElementChild.remove();
    logEmpty.hidden = true;
  };

  document.getElementById('pg-clear').addEventListener('click', () => {
    logList.replaceChildren();
    logEmpty.hidden = false;
  });

  /* ---- codigo gerado ---- */

  const jsLiteral = (v) => (typeof v === 'string' ? `'${v.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'` : String(v));

  const htmlAttrs = (s, values, demo) => {
    const parts = demo.marker ? [` ${demo.marker}`] : [];
    for (const o of changed(s, values)) {
      if (!o.attr) continue;
      const v = values[o.name];
      // data-tuc-reveal vale pela presenca; o modo vai em data-reveal-mode.
      if (o.attr === 'data-tuc-reveal') { if (v) parts.push(` ${o.attr}`); continue; }
      parts.push(` ${o.attr}="${escapeHtml(v)}"`);
    }
    return parts.join('');
  };

  const htmlCode = (s, values, demo) => demo.html({ attrs: htmlAttrs(s, values, demo), values, django: false });

  const jsCode = (s, values, demo) => {
    const entries = changed(s, values).map((o) => `  ${o.name}: ${jsLiteral(values[o.name])},`);
    if (demo.actions) entries.push(`  actions: ${dialogActions},`);
    const object = entries.length ? `{\n${entries.join('\n')}\n}` : '';
    if (s.name === 'pagination') {
      return `document.querySelector('#pages').append(Tucano.pagination(${object || '{}'}));`;
    }
    if (s.shortcut) return `Tucano.${s.shortcut}(${object || '{}'});`;
    const target = demo.selector.startsWith('#') ? `'${demo.selector}'` : demo.selector;
    return `new Tucano.${s.className}(${target}${object ? `, ${object}` : ''});`;
  };

  const djangoCode = (s, values, demo) => {
    if (demo.widget) {
      const attrs = [[demo.marker, ''], ...changed(s, values).filter((o) => o.attr).map((o) => [o.attr, o.attr === 'data-tuc-reveal' ? '' : String(values[o.name])])]
        .filter(([name]) => name).map(([name, v]) => `${JSON.stringify(name)}: ${JSON.stringify(v)}`);
      const widget = demo.widget(values);
      const subclass = widget === 'MultipleFileInput'
        ? 'class MultipleFileInput(forms.ClearableFileInput):\n    allow_multiple_selected = True\n\n\n'
        : '';
      return `${subclass}class ContractForm(forms.ModelForm):\n    class Meta:\n        model = Contract\n        fields = ["${demo.field}"]\n        widgets = {\n            "${demo.field}": ${widget}(attrs={${attrs.join(', ')}}),\n        }`;
    }
    if (s.name === 'toast') {
      const attrs = htmlAttrs(s, values, demo).replace(/ data-type="[^"]*"/, '');
      return `{% for message in messages %}\n  <div data-tuc-toast${attrs.replace(' data-tuc-toast', '')} data-type="{{ message.tags }}">{{ message }}</div>\n{% endfor %}`;
    }
    if (s.name === 'pagination') {
      const attrs = htmlAttrs(s, values, demo).replace(/ data-page="[^"]*"| data-pages="[^"]*"/g, '');
      return `{% if page_obj.paginator.num_pages > 1 %}\n<div id="pages"${attrs} data-page="{{ page_obj.number }}" data-pages="{{ page_obj.paginator.num_pages }}"></div>\n{% endif %}`;
    }
    if (s.name === 'table' || s.name === 'modal' || s.name === 'drawer') {
      return demo.html({ attrs: htmlAttrs(s, values, demo), values, django: true });
    }
    return null;
  };

  const codeTabs = document.getElementById('pg-code');
  const writeCode = (id, text) => {
    const code = document.querySelector(`#${id} code`);
    if (code) code.innerHTML = Tucano.highlight(text);
  };

  const updateCode = () => {
    const values = states.get(spec.name);
    const demo = DEMOS[spec.name];
    writeCode('pg-code-html', htmlCode(spec, values, demo));
    writeCode('pg-code-js', jsCode(spec, values, demo));
    const django = djangoCode(spec, values, demo);
    writeCode('pg-code-django', django ?? '');
    // Sem versao Django, a aba sai da lista e do teclado; se estava aberta, volta ao HTML.
    const tab = codeTabs.querySelectorAll('.tuc-tabs__tab')[2];
    const wasOpen = tab.getAttribute('aria-selected') === 'true';
    tab.hidden = !django;
    tab.disabled = !django;
    if (!django && wasOpen) codeTabs._tucano?.select(0);
  };

  /* ---- previa ---- */

  const teardown = () => {
    try { instance?.destroy?.(); } catch (e) { log('destroy', [e]); }
    instance = null;
    for (const d of dialogs) if (d.isOpen) d.close();
    dialogs = [];
    stage.replaceChildren();
  };

  const mount = () => {
    const values = states.get(spec.name);
    const demo = DEMOS[spec.name];
    const options = Object.fromEntries(changed(spec, values).map((o) => [o.name, values[o.name]]));
    const callbacks = Object.fromEntries(spec.callbacks.map((name) => [name, (...args) => log(name, args)]));

    if (spec.name === 'toast') {
      stage.innerHTML = `<div class="bar"><button type="button" class="tuc-btn is-primary">${escapeHtml(T.show)}</button></div>`;
      stage.querySelector('button').addEventListener('click', () => {
        const toast = Tucano.toast(options);
        toast.node.addEventListener('tucano:toast-closed', () => log('tucano:toast-closed', []));
      });
      return;
    }
    if (spec.name === 'modal' || spec.name === 'drawer') {
      stage.innerHTML = `<div class="bar"><button type="button" class="tuc-btn is-primary">${escapeHtml(spec.name === 'modal' ? T.openModal : T.openDrawer)}</button></div>`;
      stage.querySelector('button').addEventListener('click', () => {
        dialogs = dialogs.filter((d) => d.isOpen);
        dialogs.push(Tucano[spec.shortcut]({ ...options, ...callbacks, actions: [{ text: T.cancel }, { text: T.confirm, variant: 'primary' }] }));
      });
      return;
    }
    if (spec.name === 'pagination') {
      // Com onChange a paginacao cancela a navegacao: a previa troca de pagina
      // pelo estado, e o controle "page" acompanha.
      instance = new Tucano.Pagination({
        ...options,
        onChange: (page, pagination) => {
          log('onChange', [page, pagination]);
          values.page = page;
          const input = form.querySelector('[data-option="page"]');
          if (input) input.value = page;
          queueMicrotask(render);
        },
      });
      stage.append(instance.node);
      return;
    }

    stage.innerHTML = demo.html({ attrs: ' data-pg-target', values, django: false });
    const target = stage.querySelector('[data-pg-target]');
    const extra = { ...callbacks };
    // onSort definido toma a ordenacao para si; no modo client a previa quer a da tabela.
    if (spec.name === 'table' && values.sortMode === 'client') delete extra.onSort;
    instance = new Tucano[spec.className](target, { ...options, ...extra });
  };

  const render = () => {
    clearTimeout(typingTimer);
    teardown();
    try {
      mount();
    } catch (e) {
      stage.replaceChildren();
      const alert = document.createElement('p');
      alert.className = 'tuc-hint';
      alert.textContent = `${T.error}: ${e.message}`;
      stage.append(alert);
      log('Error', [e.message]);
    }
    updateCode();
  };

  /* ---- controles ---- */

  const optionLabel = (name, forId, jsOnly) => {
    const node = document.createElement('label');
    node.className = 'tuc-label';
    if (forId) node.htmlFor = forId;
    const code = document.createElement('code');
    code.textContent = name;
    node.append(code);
    if (jsOnly) node.append(jsBadge());
    return node;
  };

  const jsBadge = () => {
    const badge = document.createElement('span');
    badge.className = 'tuc-badge is-plain';
    badge.textContent = 'JS';
    badge.title = T.jsOnly;
    return badge;
  };

  const hint = (o) => {
    const node = document.createElement('p');
    node.className = 'tuc-hint';
    const code = document.createElement('code');
    code.textContent = o.default === null ? '—' : JSON.stringify(o.default);
    node.append(`${T.defaultValue}: `, code);
    // As notas saem dos comentarios do codigo, que sao em portugues.
    if (lang === 'pt' && o.note) node.append(` · ${o.note}`);
    return node;
  };

  const buildControls = () => {
    for (const select of controlSelects) select.destroy();
    controlSelects = [];
    form.replaceChildren();
    const values = states.get(spec.name);
    const demo = DEMOS[spec.name];

    for (const o of spec.options) {
      const row = document.createElement('div');
      const id = `pg-option-${o.name}`;
      const jsOnly = !o.attr && !(demo.htmlOptions || []).includes(o.name);
      if (o.type === 'boolean') {
        const wrap = document.createElement('label');
        wrap.className = 'tuc-choice';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.className = 'tuc-switch';
        input.setAttribute('role', 'switch');
        input.dataset.option = o.name;
        input.checked = Boolean(values[o.name]);
        const code = document.createElement('code');
        code.textContent = o.name;
        wrap.append(input, ' ', code);
        if (jsOnly) wrap.append(jsBadge());
        row.append(wrap, hint(o));
      } else if (o.type === 'enum') {
        const select = document.createElement('select');
        select.id = id;
        select.dataset.option = o.name;
        for (const v of o.values) {
          const option = document.createElement('option');
          option.value = JSON.stringify(v);
          option.textContent = v === null ? T.auto : String(v);
          option.selected = v === values[o.name];
          select.append(option);
        }
        row.append(optionLabel(o.name, id, jsOnly), select, hint(o));
        form.append(row);
        controlSelects.push(new Tucano.Select(select, { search: o.values.length > 6, clearable: false }));
        continue;
      } else {
        const input = document.createElement('input');
        input.id = id;
        input.className = 'tuc-input';
        input.type = o.type === 'number' ? 'number' : 'text';
        if (o.type === 'number') input.inputMode = 'numeric';
        input.dataset.option = o.name;
        input.value = values[o.name] ?? '';
        input.autocomplete = 'off';
        if (o.default !== null && o.default !== '') input.placeholder = String(o.default);
        row.append(optionLabel(o.name, id, jsOnly), input, hint(o));
      }
      form.append(row);
    }

    // Atributo da propria marcacao, e nao opcao do componente.
    for (const name of demo.extras || []) {
      const row = document.createElement('div');
      const wrap = document.createElement('label');
      wrap.className = 'tuc-choice';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.className = 'tuc-switch';
      input.setAttribute('role', 'switch');
      input.dataset.option = name;
      input.dataset.extra = '';
      input.checked = Boolean(values[name]);
      const code = document.createElement('code');
      code.textContent = name;
      wrap.append(input, ' ', code);
      const note = document.createElement('p');
      note.className = 'tuc-hint';
      note.textContent = T.multiple;
      row.append(wrap, note);
      form.append(row);
    }
  };

  /* Le o controle; devolve true quando o valor mudou. */
  const read = (control) => {
    const name = control.dataset.option;
    if (!name || !spec) return false;
    const o = spec.options.find((x) => x.name === name);
    const values = states.get(spec.name);
    let value;
    if (control.type === 'checkbox') value = control.checked;
    else if (control.tagName === 'SELECT') value = JSON.parse(control.value);
    else if (control.value === '') value = o.default;
    else value = o.type === 'number' ? Number(control.value) : control.value;
    if (o?.type === 'number' && Number.isNaN(value)) return false;
    if (values[name] === value) return false;
    values[name] = value;
    return true;
  };

  // Digitando, espera uma pausa: recriar a cada tecla tiraria o foco de quem abriu o painel.
  form.addEventListener('input', (e) => {
    if (e.target.type !== 'text' && e.target.type !== 'number') return;
    if (!e.target.dataset.option) return;
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => { if (read(e.target)) render(); }, 300);
  });
  form.addEventListener('change', (e) => { if (read(e.target)) render(); });
  form.addEventListener('submit', (e) => e.preventDefault());

  const choose = (name, { push = true } = {}) => {
    spec = specs.get(name) || manifest[0];
    if (!states.has(spec.name)) states.set(spec.name, initialState(spec));
    logList.replaceChildren();
    logEmpty.hidden = false;
    buildControls();
    render();
    if (push) {
      const url = new URL(location.href);
      url.searchParams.set('component', spec.name);
      history.replaceState(null, '', url);
    }
  };

  document.getElementById('pg-reset').addEventListener('click', () => {
    states.set(spec.name, initialState(spec));
    buildControls();
    render();
  });

  /* A instancia das abas do codigo so existe depois do boot do Tucano, que
     espera o DOMContentLoaded; comecar antes deixaria updateCode sem ela. */
  const start = () => {
    const requested = new URLSearchParams(location.search).get('component');
    const first = specs.has(requested) ? requested : picker.value;
    picker.value = first;
    new Tucano.Select(picker, { clearable: false });
    picker.addEventListener('change', () => choose(picker.value));
    choose(first, { push: false });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
