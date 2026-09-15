/*
 * Comportamento compartilhado do site de documentacao.
 *
 * Roda depois do dist/tucano.js, entao usa o helper de icone da biblioteca em vez
 * de repetir SVG. O que e especifico de uma pagina fica no <script> dela.
 */
(() => {
  const root = document.documentElement;

  /*
   * Textos dos componentes na lingua da pagina. O pacote so traz o portugues; o
   * site em ingles e espanhol faz o que qualquer projeto faria, com setTexts. Roda
   * antes da inicializacao automatica, que espera o DOMContentLoaded. Meses, dias
   * da semana e formato de data ja seguem o lang da pagina pelo Intl.
   */
  const SITE_TEXTS = {
    en: {
      datepicker: {
        dialog: 'Choose a date', dialogRange: 'Choose a period', previousMonth: 'Previous month', nextMonth: 'Next month',
        previous: 'Previous', next: 'Next', time: 'Time', start: 'Start', end: 'End', hour: 'Hour', minute: 'Minute',
        second: 'Second', clear: 'Clear', apply: 'Apply', today: 'Today', yesterday: 'Yesterday', last7Days: 'Last 7 days',
        last30Days: 'Last 30 days', thisMonth: 'This month', lastMonth: 'Last month', thisYear: 'This year',
        placeholderLetters: 'ymdhms',
      },
      select: {
        placeholder: 'Select...', searchPlaceholder: 'Search...', emptyText: 'No results', loadingText: 'Searching...',
        errorText: 'Search failed', typeToSearch: (n) => `Type ${n} character${n > 1 ? 's' : ''} to search`,
        clear: 'Clear selection', remove: (label) => `Remove ${label}`,
      },
      colorpicker: {
        pick: 'Pick a color', dialog: 'Color picker', area: 'Saturation and brightness', hue: 'Hue', alpha: 'Opacity',
        value: 'Color value', eyeDropper: 'Pick a color from the screen',
      },
      upload: {
        zone: 'Drag files here or click to choose', zoneOne: 'Drag a file here or click to choose', drop: 'Drop to upload',
        cancel: 'Cancel', remove: 'Remove', repeat: 'Try again', large: (max) => `File larger than ${max}`,
        type: 'File type not accepted', others: (n) => `At most ${n} file${n > 1 ? 's' : ''}`, upTo: (size) => `up to ${size}`,
        serverError: (status) => `The server responded ${status}`, networkError: 'Network error',
      },
      mask: { show: 'Show', hide: 'Hide', invalid: 'Invalid value', cpf: 'Invalid CPF', cnpj: 'Invalid CNPJ', cpfCnpj: 'Invalid document' },
      toast: { region: 'Notifications', close: 'Close', loading: 'Loading...', success: 'Done', error: 'Something went wrong' },
      modal: { close: 'Close', confirm: 'Confirm', cancel: 'Cancel' },
      drawer: { close: 'Close' },
      table: { selectAll: 'Select all rows on this page', selectRow: 'Select row' },
      pagination: { prevText: 'Previous', nextText: 'Next', label: 'Pagination' },
      editor: {
        toolbar: 'Formatting', tableToolbar: 'Table', bold: 'Bold', italic: 'Italic', underline: 'Underline', title: 'Heading',
        subheading: 'Subheading', list: 'List', numbered: 'Numbered list', quote: 'Quote', link: 'Link', clear: 'Clear formatting',
        table: 'Insert table', left: 'Align left', center: 'Center', right: 'Align right', justify: 'Justify', code: 'Code',
        rowAbove: 'Insert row above', rowBelow: 'Insert row below', colBefore: 'Insert column left', colAfter: 'Insert column right',
        deleteRow: 'Delete row', deleteColumn: 'Delete column', deleteTable: 'Delete table', insertLink: 'Insert link',
        editLink: 'Edit link', cancel: 'Cancel', removeLink: 'Remove', save: 'Save', insert: 'Insert',
      },
      prose: { copy: 'Copy code', copied: 'Copied' },
    },
    es: {
      datepicker: {
        dialog: 'Elegir fecha', dialogRange: 'Elegir período', previousMonth: 'Mes anterior', nextMonth: 'Mes siguiente',
        previous: 'Anterior', next: 'Siguiente', time: 'Hora', start: 'Inicio', end: 'Fin', hour: 'Hora', minute: 'Minuto',
        second: 'Segundo', clear: 'Borrar', apply: 'Aplicar', today: 'Hoy', yesterday: 'Ayer', last7Days: 'Últimos 7 días',
        last30Days: 'Últimos 30 días', thisMonth: 'Este mes', lastMonth: 'Mes pasado', thisYear: 'Este año',
        placeholderLetters: 'amdhms',
      },
      select: {
        placeholder: 'Selecciona...', searchPlaceholder: 'Buscar...', emptyText: 'Sin resultados', loadingText: 'Buscando...',
        errorText: 'Error al buscar', typeToSearch: (n) => `Escribe ${n} carácter${n > 1 ? 'es' : ''} para buscar`,
        clear: 'Borrar selección', remove: (label) => `Quitar ${label}`,
      },
      colorpicker: {
        pick: 'Elegir color', dialog: 'Selector de color', area: 'Saturación y brillo', hue: 'Tono', alpha: 'Opacidad',
        value: 'Valor del color', eyeDropper: 'Capturar color de la pantalla',
      },
      upload: {
        zone: 'Arrastra archivos aquí o haz clic para elegir', zoneOne: 'Arrastra un archivo aquí o haz clic para elegir',
        drop: 'Suelta para subir', cancel: 'Cancelar', remove: 'Quitar', repeat: 'Reintentar',
        large: (max) => `Archivo mayor que ${max}`, type: 'Tipo de archivo no aceptado',
        others: (n) => `Como máximo ${n} archivo${n > 1 ? 's' : ''}`, upTo: (size) => `hasta ${size}`,
        serverError: (status) => `El servidor respondió ${status}`, networkError: 'Error de red',
      },
      mask: { show: 'Mostrar', hide: 'Ocultar', invalid: 'Valor no válido', cpf: 'CPF no válido', cnpj: 'CNPJ no válido', cpfCnpj: 'Documento no válido' },
      toast: { region: 'Notificaciones', close: 'Cerrar', loading: 'Cargando...', success: 'Listo', error: 'Algo salió mal' },
      modal: { close: 'Cerrar', confirm: 'Confirmar', cancel: 'Cancelar' },
      drawer: { close: 'Cerrar' },
      table: { selectAll: 'Seleccionar todas las filas de esta página', selectRow: 'Seleccionar fila' },
      pagination: { prevText: 'Anterior', nextText: 'Siguiente', label: 'Paginación' },
      editor: {
        toolbar: 'Formato', tableToolbar: 'Tabla', bold: 'Negrita', italic: 'Cursiva', underline: 'Subrayado', title: 'Título',
        subheading: 'Subtítulo', list: 'Lista', numbered: 'Lista numerada', quote: 'Cita', link: 'Enlace', clear: 'Borrar formato',
        table: 'Insertar tabla', left: 'Alinear a la izquierda', center: 'Centrar', right: 'Alinear a la derecha',
        justify: 'Justificar', code: 'Código', rowAbove: 'Insertar fila arriba', rowBelow: 'Insertar fila abajo',
        colBefore: 'Insertar columna a la izquierda', colAfter: 'Insertar columna a la derecha', deleteRow: 'Eliminar fila',
        deleteColumn: 'Eliminar columna', deleteTable: 'Eliminar tabla', insertLink: 'Insertar enlace', editLink: 'Editar enlace',
        cancel: 'Cancelar', removeLink: 'Quitar', save: 'Guardar', insert: 'Insertar',
      },
      prose: { copy: 'Copiar código', copied: 'Copiado' },
    },
  };
  const siteTexts = SITE_TEXTS[root.lang.slice(0, 2)];
  if (siteTexts) Tucano.setTexts(siteTexts);

  /* Tema: a classe .dark no <html>, lembrada entre paginas. Os rotulos vem do
     proprio botao, que o gerador escreve no idioma da pagina. */
  const updateLabels = () => {
    const dark = root.classList.contains('dark');
    document.querySelectorAll('[data-theme-toggle]').forEach((b) =>
      b.setAttribute('aria-label', dark ? b.dataset.labelLight : b.dataset.labelDark));
  };
  document.querySelectorAll('[data-theme-toggle]').forEach((b) => b.addEventListener('click', () => {
    root.classList.toggle('dark');
    try { localStorage.setItem('tucano-theme', root.classList.contains('dark') ? 'dark' : 'light'); } catch {}
    updateLabels();
  }));
  updateLabels();

  /* Menu do celular: a barra lateral vira o painel que o botao abre. */
  const sidebar = document.getElementById('side');
  const menu = document.getElementById('menu');
  const ICON_MENU = 'M3 6h18M3 12h18M3 18h18';
  const setOpen = (open) => {
    sidebar.classList.toggle('is-open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.replaceChildren(Tucano.icon(open ? Tucano.ICON_X : ICON_MENU, 16));
  };
  menu?.addEventListener('click', () => setOpen(!sidebar.classList.contains('is-open')));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && sidebar.classList.contains('is-open')) setOpen(false); });

  /*
   * Link para a propria pagina — o item atual do menu, a marca no inicio — so
   * volta ao topo. Seguir o link recarregava a pagina inteira, e recarregar nao
   * passa pela transicao entre paginas: a tela piscava sem nada ter mudado.
   * Link com ancora (#secao) continua descendo ate a secao, como sempre.
   */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank') return;
    const target = new URL(a.href, location.href);
    if (target.origin !== location.origin || target.pathname !== location.pathname || target.search !== location.search || target.hash) return;
    e.preventDefault();
    if (sidebar?.classList.contains('is-open')) setOpen(false);
    scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* Saida dos exemplos: o valor de cada campo aparece embaixo dele, em #<id>-out. */
  document.addEventListener('tucano:change', (e) => {
    const out = document.getElementById(`${e.target.id}-out`);
    if (!out) return;
    const d = e.detail;
    out.textContent = d.files
      ? (d.files.map((f) => f.name).join(', ') || '—')
      : d.iso ?? (Array.isArray(d.value) ? (d.value.join(', ') || '—') : (d.value || '—'));
  });

  /*
   * Busca do site.
   *
   * O indice (search.json, um por idioma) e gerado pelo tools/site.mjs e so e
   * baixado quando alguem abre a busca: quem so le a pagina nao paga por ele.
   * O dialogo e o Tucano.Modal da biblioteca, com o campo no lugar do titulo e a
   * lista no corpo — top layer, foco preso, Esc e o foco devolvido a quem abriu
   * vem dele. A lista segue o combobox do ARIA APG: o foco fica no campo, e as
   * setas movem a opcao ativa por aria-activedescendant.
   *
   * A comparacao ignora acento e caixa: "sensivel" acha "sensível", porque
   * ninguem digita acento numa busca. Pontuacao: titulo da pagina vale mais que
   * titulo de secao, que vale mais que o texto.
   */
  const labels = document.body.dataset;
  const triggers = document.querySelectorAll('[data-search]');
  const fold = (text) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  let search = null;

  /* Texto dobrado e, para cada caractere dele, a posicao no original: e o que
     permite marcar "sensível" a partir de "sensivel". */
  const foldWithMap = (text) => {
    let folded = '';
    const map = [];
    for (let i = 0; i < text.length; i++) {
      for (const ch of fold(text[i])) { folded += ch; map.push(i); }
    }
    map.push(text.length);
    return { folded, map };
  };

  /* Marca os termos com <mark>, montando nos e nao HTML. */
  const highlightTerms = (text, terms) => {
    const { folded, map } = foldWithMap(text);
    const ranges = [];
    for (const term of terms) {
      for (let at = folded.indexOf(term); at >= 0; at = folded.indexOf(term, at + term.length)) {
        ranges.push([map[at], map[at + term.length - 1] + 1]);
      }
    }
    ranges.sort((a, b) => a[0] - b[0]);
    const fragment = document.createDocumentFragment();
    let last = 0;
    for (const [start, end] of ranges) {
      if (end <= last) continue;
      const from = Math.max(start, last);
      fragment.append(text.slice(last, from));
      const mark = document.createElement('mark');
      mark.textContent = text.slice(from, end);
      fragment.append(mark);
      last = end;
    }
    fragment.append(text.slice(last));
    return fragment;
  };

  /* Trecho em volta do primeiro termo achado, para o resultado mostrar por que casou. */
  const excerpt = (text, terms) => {
    const { folded, map } = foldWithMap(text);
    const hits = terms.map((t) => folded.indexOf(t)).filter((i) => i >= 0);
    const at = hits.length ? map[Math.min(...hits)] : 0;
    const start = Math.max(0, at - 40);
    const cut = text.slice(start, start + 130).trim();
    return `${start ? '…' : ''}${cut}${start + 130 < text.length && !cut.endsWith('…') ? '…' : ''}`;
  };

  const rank = (query) => {
    const terms = fold(query).split(/\s+/).filter(Boolean);
    const { index, folded } = search;
    const results = [];
    index.pages.forEach((page, i) => {
      const [title, desc, , , intro] = folded.pages[i];
      let score = 0, where = null;
      for (const term of terms) {
        if (title.includes(term)) score += title.startsWith(term) ? 120 : 100;
        else if (desc.includes(term)) { score += 25; where ??= 1; }
        else if (intro.includes(term)) { score += 10; where = 4; }
        else { score = 0; break; }
      }
      if (score) results.push({ score, order: results.length, page: i, anchor: '', heading: page[0], meta: page[3], text: page[where ?? 1] });
    });
    index.sections.forEach((section, i) => {
      const [pageIndex, heading, text] = folded.sections[i];
      const title = folded.pages[pageIndex][0];
      let score = 0, own = false, inText = false;
      for (const term of terms) {
        if (heading.includes(term)) { score += heading.startsWith(term) ? 60 : 50; own = true; }
        else if (text.includes(term)) { score += 10; own = true; inText = true; }
        else if (title.includes(term)) score += 5;
        else { score = 0; break; }
      }
      // So o titulo da pagina casou: o resultado da propria pagina ja cobre.
      if (!score || !own) return;
      results.push({
        score, order: results.length, page: pageIndex, anchor: section[2], heading: section[1],
        meta: index.pages[pageIndex][0], text: inText ? section[3] : '',
      });
    });
    results.sort((a, b) => b.score - a.score || a.order - b.order);
    return { terms, results: results.slice(0, 40) };
  };

  const activate = (i) => {
    const { options, input } = search;
    options.forEach((option, k) => {
      option.classList.toggle('is-active', k === i);
      option.setAttribute('aria-selected', String(k === i));
    });
    search.active = i;
    if (options[i]) {
      input.setAttribute('aria-activedescendant', options[i].id);
      options[i].scrollIntoView({ block: 'nearest' });
    } else input.removeAttribute('aria-activedescendant');
  };

  /* Link para a propria pagina fecha o dialogo antes de descer ate a secao:
     com o dialogo aberto a pagina fica travada e a rolagem nao acontece. */
  const go = (href) => {
    const target = new URL(href);
    if (target.pathname !== location.pathname || target.search !== location.search) {
      location.href = href;
      return;
    }
    search.pendingHash = target.hash || '#';
    search.modal.close('action');
  };

  const render = () => {
    const { input, list, status } = search;
    const query = input.value.trim();
    search.options = [];
    list.replaceChildren();
    activate(-1);
    const empty = !search.index || !query;
    list.hidden = empty;
    input.setAttribute('aria-expanded', 'false');
    if (!search.index) {
      status.textContent = search.failed ? labels.searchError : labels.searchLoading;
      return;
    }
    if (empty) { status.textContent = ''; return; }

    const { terms, results } = rank(query);
    status.textContent = results.length
      ? labels.searchCount.replace('{n}', results.length)
      : labels.searchEmpty.replace('{q}', query);
    const base = new URL(labels.searchIndex, location.href);
    results.forEach((r, i) => {
      const option = document.createElement('a');
      option.className = 'tuc-menu__item search__option';
      option.id = `search-option-${i}`;
      option.setAttribute('role', 'option');
      option.setAttribute('tabindex', '-1');
      option.href = new URL(`${search.index.pages[r.page][2]}${r.anchor ? `#${r.anchor}` : ''}`, base).href;
      const title = document.createElement('span');
      title.className = 'search__title';
      title.append(highlightTerms(r.heading, terms));
      const meta = document.createElement('span');
      meta.className = 'search__meta';
      meta.append(highlightTerms(r.meta, terms));
      option.append(title, meta);
      if (r.text) {
        const snippet = document.createElement('span');
        snippet.className = 'search__snippet';
        snippet.append(highlightTerms(excerpt(r.text, terms), terms));
        option.append(snippet);
      }
      option.addEventListener('click', (e) => {
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        go(option.href);
      });
      option.addEventListener('mousemove', () => { if (search.active !== i) activate(i); });
      search.options.push(option);
    });
    list.append(...search.options);
    list.hidden = !results.length;
    input.setAttribute('aria-expanded', String(results.length > 0));
    if (results.length) activate(0);
  };

  const load = () => {
    search.failed = false;
    search.loading = true;
    fetch(labels.searchIndex)
      .then((response) => { if (!response.ok) throw new Error(String(response.status)); return response.json(); })
      .then((index) => {
        // Dobrado uma vez so, e nao a cada tecla.
        search.folded = {
          pages: index.pages.map((p) => [fold(p[0]), fold(p[1]), '', '', fold(p[4])]),
          sections: index.sections.map((s) => [s[0], fold(s[1]), fold(s[3])]),
        };
        search.index = index;
      })
      .catch(() => { search.failed = true; })
      .finally(() => { search.loading = false; if (search.modal.isOpen) render(); });
  };

  const build = () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'tuc-input search__input';
    for (const [name, value] of Object.entries({
      role: 'combobox', 'aria-autocomplete': 'list', 'aria-expanded': 'false', 'aria-controls': 'search-results',
      'aria-label': labels.searchDialog, placeholder: labels.searchPlaceholder, autocomplete: 'off',
      autocapitalize: 'off', spellcheck: 'false', enterkeyhint: 'go', autofocus: '',
    })) input.setAttribute(name, value);

    const list = document.createElement('div');
    list.id = 'search-results';
    list.className = 'tuc-menu search__results';
    list.setAttribute('role', 'listbox');
    list.setAttribute('aria-label', labels.searchResults);
    list.hidden = true;

    const status = document.createElement('p');
    status.className = 'tuc-hint search__status';
    status.setAttribute('role', 'status');

    const hint = document.createElement('p');
    hint.className = 'tuc-hint search__hint';
    hint.textContent = labels.searchHint;

    const modal = new Tucano.Modal({
      size: 'lg',
      onClose: () => {
        const hash = search.pendingHash;
        search.pendingHash = null;
        if (!hash) return;
        if (hash === '#') scrollTo({ top: 0 });
        else if (location.hash === hash) document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
        else location.hash = hash;
      },
    });
    modal.node.classList.add('search-dialog');
    modal.node.setAttribute('aria-label', labels.searchDialog);
    modal.panel.querySelector('.tuc-modal__header').append(input);
    modal.content([status, list, hint]);

    input.addEventListener('input', render);
    input.addEventListener('keydown', (e) => {
      if (e.isComposing) return;
      const count = search.options.length;
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && count) {
        e.preventDefault();
        activate((search.active + (e.key === 'ArrowDown' ? 1 : -1) + count) % count);
      } else if (e.key === 'Enter' && search.options[search.active]) {
        e.preventDefault();
        go(search.options[search.active].href);
      }
    });
    search = { modal, input, list, status, options: [], active: -1, index: null, folded: null, loading: false, failed: false, pendingHash: null };
  };

  const openSearch = () => {
    if (!search) build();
    if (sidebar?.classList.contains('is-open')) setOpen(false);
    if (!search.modal.isOpen) search.modal.open();
    search.input.focus();
    search.input.select();
    if (!search.index && !search.loading) load();
    render();
  };

  triggers.forEach((b) => b.addEventListener('click', openSearch));

  /* "/" fora de campo de texto e Ctrl+K / Cmd+K em qualquer lugar. Com outro
     dialogo aberto (um modal de exemplo) a busca nao abre por cima dele. */
  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.isComposing || !triggers.length) return;
    const shortcut = e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey;
    const typing = e.target instanceof Element
      && e.target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])');
    const slash = e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !typing;
    if (!shortcut && !slash) return;
    if (document.querySelector('dialog[open]:not(.search-dialog)')) return;
    e.preventDefault();
    openSearch();
  });
})();
