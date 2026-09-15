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
})();
