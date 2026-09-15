/*
 * Todo texto que um componente mostra ou anuncia.
 *
 * O pacote nao traz dicionario de idiomas: cada um pesaria no bundle de todo
 * mundo, e quem precisa de ingles ou espanhol ja sabe escrever as frases. O
 * portugues fica como padrao, e `setTexts` troca o que o projeto quiser.
 *
 * Um objeto por componente, e nao um mapa unico: objeto e indivisivel para o
 * empacotador, e quem importa so o date picker levaria as frases do editor
 * junto. Separados, cada componente importa o seu, e o `GROUPS` la embaixo so
 * entra no bundle de quem usa `setTexts` ou `getTexts`.
 *
 * Os componentes leem daqui na hora de montar. Trocar depois nao reescreve o
 * que ja esta na tela: chame `setTexts` antes do init, ou antes de criar a
 * instancia.
 *
 * Funcao e aceita onde a frase depende de um numero ou de um nome.
 */

export const DATEPICKER_TEXTS = {
  dialog: 'Selecionar data',
  dialogRange: 'Selecionar período',
  previousMonth: 'Mês anterior',
  nextMonth: 'Próximo mês',
  // Setas da escolha de mes e de ano.
  previous: 'Anterior',
  next: 'Próximo',
  time: 'Horário',
  start: 'Início',
  end: 'Fim',
  hour: 'Hora',
  minute: 'Minuto',
  second: 'Segundo',
  clear: 'Limpar',
  apply: 'Aplicar',
  today: 'Hoje',
  yesterday: 'Ontem',
  last7Days: 'Últimos 7 dias',
  last30Days: 'Últimos 30 dias',
  thisMonth: 'Este mês',
  lastMonth: 'Mês passado',
  thisYear: 'Este ano',
  // Letras do placeholder, nesta ordem: ano, mes, dia, hora, minuto, segundo.
  // "amdhms" escreve dd/mm/aaaa; em ingles, "ymdhms" escreve mm/dd/yyyy.
  placeholderLetters: 'amdhms',
};

export const SELECT_TEXTS = {
  placeholder: 'Selecione...',
  searchPlaceholder: 'Buscar...',
  emptyText: 'Nenhum resultado',
  loadingText: 'Buscando...',
  errorText: 'Falha ao buscar',
  typeToSearch: (n) => `Digite ${n} caractere${n > 1 ? 's' : ''} para buscar`,
  clear: 'Limpar seleção',
  remove: (label) => `Remover ${label}`,
};

export const COLORPICKER_TEXTS = {
  pick: 'Escolher cor',
  dialog: 'Seletor de cor',
  area: 'Saturação e brilho',
  hue: 'Matiz',
  alpha: 'Opacidade',
  value: 'Valor da cor',
  eyeDropper: 'Capturar cor da tela',
};

export const UPLOAD_TEXTS = {
  zone: 'Arraste arquivos aqui ou clique para escolher',
  zoneOne: 'Arraste um arquivo aqui ou clique para escolher',
  drop: 'Solte para enviar',
  cancel: 'Cancelar',
  remove: 'Remover',
  repeat: 'Tentar de novo',
  large: (max) => `Arquivo maior que ${max}`,
  type: 'Tipo de arquivo não aceito',
  others: (n) => `No máximo ${n} arquivo${n > 1 ? 's' : ''}`,
  upTo: (size) => `até ${size}`,
  serverError: (status) => `O servidor respondeu ${status}`,
  networkError: 'Falha de rede',
};

export const MASK_TEXTS = {
  show: 'Mostrar',
  hide: 'Ocultar',
  invalid: 'Valor inválido',
  cpf: 'CPF inválido',
  cnpj: 'CNPJ inválido',
  cpfCnpj: 'Documento inválido',
};

export const TOAST_TEXTS = {
  region: 'Notificações',
  close: 'Fechar',
  // Padroes do toast.promise.
  loading: 'Carregando...',
  success: 'Pronto',
  error: 'Algo deu errado',
};

export const MODAL_TEXTS = {
  close: 'Fechar',
  // Botoes do Tucano.confirm.
  confirm: 'Confirmar',
  cancel: 'Cancelar',
};

export const DRAWER_TEXTS = {
  close: 'Fechar',
};

export const TABLE_TEXTS = {
  selectAll: 'Selecionar todas as linhas desta página',
  selectRow: 'Selecionar linha',
};

export const PAGINATION_TEXTS = {
  prevText: 'Anterior',
  nextText: 'Próxima',
  label: 'Paginação',
};

export const EDITOR_TEXTS = {
  toolbar: 'Formatação',
  tableToolbar: 'Tabela',
  // Botoes da barra, com o nome que eles tem na opcao `toolbar`.
  bold: 'Negrito',
  italic: 'Itálico',
  underline: 'Sublinhado',
  title: 'Título',
  subheading: 'Subtítulo',
  list: 'Lista',
  numbered: 'Lista numerada',
  quote: 'Citação',
  link: 'Link',
  clear: 'Limpar formatação',
  table: 'Inserir tabela',
  left: 'Alinhar à esquerda',
  center: 'Centralizar',
  right: 'Alinhar à direita',
  justify: 'Justificar',
  code: 'Código',
  // Barra que aparece com o cursor dentro de uma tabela.
  rowAbove: 'Inserir linha acima',
  rowBelow: 'Inserir linha abaixo',
  colBefore: 'Inserir coluna à esquerda',
  colAfter: 'Inserir coluna à direita',
  deleteRow: 'Excluir linha',
  deleteColumn: 'Excluir coluna',
  deleteTable: 'Excluir tabela',
  // Caixa do link.
  insertLink: 'Inserir link',
  editLink: 'Editar link',
  cancel: 'Cancelar',
  removeLink: 'Remover',
  save: 'Salvar',
  insert: 'Inserir',
};

export const PROSE_TEXTS = {
  copy: 'Copiar código',
  copied: 'Copiado',
};

const GROUPS = {
  datepicker: DATEPICKER_TEXTS,
  select: SELECT_TEXTS,
  colorpicker: COLORPICKER_TEXTS,
  upload: UPLOAD_TEXTS,
  mask: MASK_TEXTS,
  toast: TOAST_TEXTS,
  modal: MODAL_TEXTS,
  drawer: DRAWER_TEXTS,
  table: TABLE_TEXTS,
  pagination: PAGINATION_TEXTS,
  editor: EDITOR_TEXTS,
  prose: PROSE_TEXTS,
};

/**
 * Troca textos dos componentes, por grupo: `setTexts({ datepicker: { clear:
 * 'Clear' } })`. Mescla chave a chave dentro do grupo, entao o que nao foi
 * passado continua como estava. Vale para o que for montado depois.
 */
export function setTexts(texts = {}) {
  for (const [name, values] of Object.entries(texts)) {
    // Grupo desconhecido e ignorado: criar um aqui nao faria componente nenhum le-lo.
    if (GROUPS[name]) Object.assign(GROUPS[name], values);
  }
}

/** Copia dos textos atuais, por grupo. Serve de ponto de partida e para restaurar. */
export function getTexts() {
  return Object.fromEntries(Object.entries(GROUPS).map(([name, group]) => [name, { ...group }]));
}
