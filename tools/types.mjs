#!/usr/bin/env node
/*
 * Gera dist/tucano.d.ts: os tipos de quem usa a Tucano em TypeScript, ou em
 * JavaScript com checkJs.
 *
 * O codigo continua sem TypeScript, e os tipos nao pesam um byte no bundle. Eles
 * saem daqui a cada build, pelo mesmo motivo da referencia do llms.txt: escritos
 * a mao, envelhecem na primeira opcao nova. Tudo o que da para ler do codigo e
 * lido dele — as opcoes e o comentario que as explica (tools/api.mjs), os
 * metodos e getters (do prototipo de verdade), os exports do pacote, os eventos,
 * os grupos e chaves de setTexts, os nomes de FORMATS, as ferramentas do editor,
 * os motivos de fechar.
 *
 * O que o codigo nao diz — que `mode` aceita 'single' ou 'range', o que o
 * getValue devolve, a assinatura de um callback, o `detail` de um evento — mora
 * nas tabelas abaixo. E elas nao podem ficar para tras caladas: opcao, metodo,
 * getter, evento, export, texto em funcao ou utilitario que existe no codigo sem
 * tipo aqui, ou tipo aqui para algo que saiu do codigo, derruba o build com a
 * lista do que falta. Sem isso a opcao nova simplesmente nao existiria para o
 * editor de quem usa, e a removida continuaria sendo sugerida.
 *
 * `--check` nao escreve: compara com o dist/tucano.d.ts e falha se ele estiver
 * velho — e o que o test:types roda antes do tsc.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { components as inventory } from './api.mjs';

const OUT = 'dist/tucano.d.ts';
const CHECK = process.argv.includes('--check');
const problems = [];
const read = (file) => readFileSync(file, 'utf8');

/* ------------------------------------------------------------------ *
 * Tabelas escritas a mao: so o que o codigo nao diz                    *
 * ------------------------------------------------------------------ */

/* Tipos usados por mais de um componente ou utilitario. */
const SHARED = `
/**
 * Lado em que o painel abre e alinhamento com a ancora: \`'bottom-start'\`,
 * \`'top-center'\`, \`'right'\`. Sem alinhamento vale \`start\`. As bordas da tela
 * ainda mandam: sem espaco, o painel vira para o outro lado.
 */
export type Placement = PlacementSide | \`\${PlacementSide}-\${'start' | 'center' | 'end'}\`;
export type PlacementSide = 'top' | 'bottom' | 'left' | 'right';

/** \`{ silent: true }\` troca o valor sem avisar ninguem: nem \`onChange\`, nem \`tucano:change\`, nem o \`change\` do elemento nativo. */
export interface SilentOption {
  silent?: boolean;
}

/** Cor em RGB, cada canal de 0 a 255. */
export interface RGB {
  r: number;
  g: number;
  b: number;
}
/** RGB com opacidade de 0 a 1. */
export interface RGBA extends RGB {
  a: number;
}
/** Matiz em graus [0, 360); saturacao e brilho de 0 a 1. */
export interface HSV {
  h: number;
  s: number;
  v: number;
}
/** HSV com opacidade de 0 a 1 — a forma que o color picker guarda. */
export interface HSVA extends HSV {
  a: number;
}
/** Matiz em graus; saturacao e luminosidade de 0 a 1. */
export interface HSL {
  h: number;
  s: number;
  l: number;
}
export type ColorFormat = 'hex' | 'rgb' | 'hsl';

/** Casas, idioma e moeda de um valor em dinheiro. */
export interface CurrencyOptions {
  decimals?: number;
  locale?: string;
  /** Codigo ISO 4217: \`'BRL'\` escreve R$. Sem moeda, so o numero. */
  currency?: string | null;
}

/** Nomes, primeiro dia da semana e relogio de 12 horas de um idioma. */
export interface LocaleData {
  monthsLong: string[];
  monthsShort: string[];
  weekdaysNarrow: string[];
  weekdaysShort: string[];
  /** 0 = domingo. */
  firstDayOfWeek: number;
  hour12: boolean;
}

/** Botao de rodape de modal e gaveta. */
export interface DialogAction<T> {
  text: string;
  /** Variante do \`.tuc-btn\`. @default 'outline' */
  variant?: ButtonVariant;
  onClick?: (instance: T) => void;
  /** \`false\` mantem o dialogo aberto depois do clique. @default true */
  closes?: boolean;
}
export type DialogTone = 'default' | 'danger' | 'success' | 'warning';
/** O que \`content()\` aceita: no, texto, ou uma lista (vazios sao ignorados). */
export type DialogContent = Node | string | null | undefined | false;
`;

/* Variantes do .tuc-btn que servem de `variant`; cada uma precisa existir no CSS. */
const BUTTON_VARIANTS = ['primary', 'outline', 'ghost', 'danger', 'link'];

/*
 * Um bloco por componente. `options`, `methods`, `getters` e `events` sao
 * conferidos nos dois sentidos contra o codigo; `props` precisa ser atribuida no
 * codigo (`this.x =`). `docs` substitui o comentario da opcao quando ele nao
 * existe ou nao serve para quem usa (`ver _noChance()`).
 */
const COMPONENTS = {
  Accordion: {
    target: 'string | HTMLElement',
    options: { single: 'boolean' },
    methods: {
      open: '(item: HTMLDetailsElement): this',
      close: '(item: HTMLDetailsElement): this',
      destroy: '(): void',
    },
    getters: { items: 'HTMLDetailsElement[]' },
    props: { node: 'HTMLElement' },
    doc: 'Acordeao sobre `<details>`/`<summary>` nativos, com abrir e fechar animados.',
  },

  ColorPicker: {
    target: 'string | HTMLInputElement',
    types: `
export interface ColorPickerChangeDetail {
  value: string;
  rgb: RGBA;
  hsva: HSVA;
  instance: ColorPicker;
}`,
    options: {
      format: 'ColorFormat',
      alpha: 'boolean',
      swatches: 'string[] | false',
      placement: 'Placement',
      appendTo: 'HTMLElement',
      onChange: '((value: string, detail: ColorPickerChangeDetail) => void) | null',
      value: 'string',
    },
    docs: {
      appendTo: 'Onde o painel nasce. Padrao: o `<dialog>` aberto que contem o campo, ou o `<body>`.',
      value: 'Cor inicial, quando o `value` do campo esta vazio. Sem ela, o campo nasce sem cor.',
    },
    methods: {
      getValue: '(): string | null',
      getRgb: '(): RGBA | null',
      setValue: '(value: string | null, options?: SilentOption): boolean',
      open: '(): void',
      close: '(): void',
      toggle: '(): void',
      destroy: '(): void',
    },
    methodDocs: {
      getValue: '`null` enquanto ninguem escolheu: o campo nasce vazio.',
      setValue: 'Aplica a cor; `null` ou `\'\'` limpa. Devolve `false`, sem mudar nada, quando o texto nao e uma cor.',
    },
    props: { isOpen: 'boolean', input: 'HTMLInputElement' },
    events: { 'tucano:change': 'ColorPickerChangeDetail' },
  },

  DatePicker: {
    generic: "M extends DatePickerMode = 'single'",
    genericArgs: 'M',
    target: 'string | HTMLInputElement',
    autoInit: 'DatePicker<DatePickerMode>[]',
    types: `
export type DatePickerMode = 'single' | 'range';
/** Periodo. Uma ponta fica \`null\` enquanto nao ha valor. */
export interface DateRange {
  start: Date | null;
  end: Date | null;
}
/** Data de entrada: \`Date\`, ou texto em ISO (\`2026-03-01\`) ou no formato do idioma (\`01/03/2026\`). */
export type DateInput = Date | string;
/** Periodo de entrada: \`{ start, end }\` ou \`[start, end]\`. */
export type DateRangeInput =
  | { start?: DateInput | null; end?: DateInput | null }
  | [DateInput | null | undefined, DateInput | null | undefined];
/** O que \`getValue()\` devolve: \`Date | null\` em \`'single'\`, \`DateRange\` em \`'range'\`. */
export type DatePickerValue<M extends DatePickerMode = DatePickerMode> = M extends 'range' ? DateRange : Date | null;
/** O que \`setValue()\` aceita em cada modo. */
export type DatePickerInput<M extends DatePickerMode = DatePickerMode> = M extends 'range' ? DateRangeInput | null : DateInput | null;
/** Atalho de periodo proprio, em \`presets\`. */
export interface DatePreset {
  label: string;
  value: () => { start: Date; end: Date };
}
export interface DatePickerChangeDetail<M extends DatePickerMode = DatePickerMode> {
  value: DatePickerValue<M>;
  /** O valor em ISO local, como vai no input hidden: \`2026-03-01\`, \`2026-03-01T14:30\`, ou o par separado por virgula. */
  iso: string;
  instance: DatePicker<M>;
}`,
    options: {
      mode: 'M',
      time: 'boolean',
      seconds: 'boolean',
      minuteStep: 'number',
      locale: 'string',
      format: 'string',
      firstDayOfWeek: 'number',
      months: 'number',
      min: 'Date | string | null',
      max: 'Date | string | null',
      disabledDates: '((date: Date) => boolean) | null',
      presets: 'boolean | DatePreset[]',
      autoApply: 'boolean',
      clearable: 'boolean',
      weekNumbers: 'boolean',
      placement: 'Placement',
      appendTo: 'HTMLElement',
      isoName: 'string',
      native: "boolean | 'auto'",
      onChange: '((value: DatePickerValue<M>, detail: DatePickerChangeDetail<M>) => void) | null',
      onOpen: '((instance: DatePicker<M>) => void) | null',
      onClose: '((instance: DatePicker<M>) => void) | null',
      value: 'DateInput',
    },
    docs: {
      format: 'Formato de exibicao, por tokens: `dd/MM/yyyy`, `d \'de\' MMMM`. Padrao: o numerico do idioma.',
      firstDayOfWeek: '0 = domingo. Padrao: o do idioma.',
      min: 'Primeiro dia aceito, em ISO (`2026-01-01`) ou `Date`.',
      max: 'Ultimo dia aceito, em ISO (`2026-12-31`) ou `Date`.',
      appendTo: 'Onde o painel nasce. Padrao: o `<dialog>` aberto que contem o campo, ou o `<body>`.',
      value: 'Valor inicial. Sem ele vale o `value` do campo.',
    },
    methods: {
      getValue: '(): DatePickerValue<M>',
      setValue: '(value: DatePickerInput<M>, options?: SilentOption): void',
      clear: '(options?: SilentOption): void',
      open: '(): void',
      close: '(options?: { restoreFocus?: boolean }): void',
      toggle: '(): void',
      destroy: '(): void',
    },
    props: { isOpen: 'boolean', input: 'HTMLInputElement' },
    events: { 'tucano:change': 'DatePickerChangeDetail' },
    doc: 'Campo de data, hora e periodo. O campo visivel mostra o formato do idioma; um input hidden leva o ISO.',
  },

  Drawer: {
    options: {
      title: 'string | null',
      text: 'string',
      side: "'left' | 'right' | 'top' | 'bottom'",
      size: "'sm' | 'md' | 'lg'",
      tone: 'DialogTone',
      closable: 'boolean',
      closeOnBackdrop: 'boolean',
      actions: 'DialogAction<Drawer>[] | null',
      onClose: '((reason: DialogCloseReason, instance: Drawer) => void) | null',
      className: 'string',
    },
    methods: {
      open: '(): this',
      close: '(reason?: DialogCloseReason): this',
      content: '(node: DialogContent | DialogContent[]): this',
    },
    props: { node: 'HTMLDialogElement', panel: 'HTMLElement', body: 'HTMLElement | null', isOpen: 'boolean | undefined' },
    doc: 'Gaveta (off-canvas): `<dialog>` encostado numa borda da tela.',
  },

  Dropdown: {
    target: 'string | HTMLElement',
    types: `
/** Item de \`items\`. \`{ separator: true }\` vira uma linha; \`{ label }\` sozinho vira titulo de grupo. */
export interface DropdownItem {
  text?: string;
  /** Caminho SVG (o \`d\` de um \`<path>\`), como os \`ICON_*\`. */
  icon?: string;
  /** Texto do atalho de teclado, so exibido. */
  shortcut?: string;
  onClick?: (dropdown: Dropdown) => void;
  /** Com href o item e um link. */
  href?: string;
  variant?: 'danger' | (string & {});
  disabled?: boolean;
  separator?: boolean;
  label?: string;
}`,
    options: {
      placement: 'Placement',
      items: 'DropdownItem[] | null',
      closeOnPick: 'boolean',
      panel: 'HTMLElement',
    },
    docs: { panel: 'Painel ja escrito no template, com botoes `.tuc-dropdown__item`, no lugar de `items`.' },
    methods: {
      open: '(): this',
      openAt: '(x: number, y: number): this',
      close: '(): this',
      toggle: '(): this',
      destroy: '(): void',
    },
    methodDocs: { openAt: 'Abre ancorado num ponto da tela, em vez de no gatilho.' },
    getters: { items: 'HTMLElement[]' },
    props: { trigger: 'HTMLElement', panel: 'HTMLElement', isOpen: 'boolean | undefined' },
    doc: 'Menu suspenso ancorado num gatilho, com teclado de menu.',
  },

  ContextMenu: {
    target: 'string | HTMLElement',
    options: {
      placement: 'Placement',
      items: 'DropdownItem[] | ((target: HTMLElement, menu: ContextMenu) => DropdownItem[]) | null',
      match: 'string | null',
      closeOnPick: 'boolean',
      onOpen: '((target: HTMLElement, menu: ContextMenu) => void) | null',
      panel: 'HTMLElement',
    },
    docs: {
      items: 'Lista fixa, ou funcao que recebe o alvo e devolve a lista daquela linha.',
      match: 'Seletor do alvo dentro da area. Sem ele, o alvo e a area inteira; fora de um alvo, o menu do navegador continua valendo.',
      onOpen: 'Chamado antes de abrir, com o alvo do botao direito.',
      panel: 'Painel ja escrito no template, com botoes `.tuc-dropdown__item`, no lugar de `items`.',
    },
    methods: {
      openAt: '(x: number | null, y: number | null, target?: HTMLElement): this',
      open: '(): this',
      close: '(options?: { restoreFocus?: boolean }): this',
      toggle: '(): this',
      destroy: '(): void',
    },
    methodDocs: {
      openAt: 'Abre no ponto da tela. Sem `x` e `y`, ancora no alvo — e o que a tecla de menu e o Shift+F10 fazem.',
    },
    getters: { items: 'HTMLElement[]', area: 'HTMLElement', target: 'HTMLElement | null' },
    props: { trigger: 'HTMLElement', panel: 'HTMLElement', isOpen: 'boolean | undefined' },
    doc: 'Menu do botao direito: o mesmo menu suspenso, aberto no ponto do clique.',
  },

  Editor: {
    target: 'string | HTMLTextAreaElement',
    types: `
/** Variavel de \`variables\`, trocada pelos dados na hora de enviar o texto. */
export interface EditorVariable {
  /** O nome dentro das chaves: \`nome\` vira \`{{nome}}\`. */
  name: string;
  /** Como ela aparece na lista. Sem ele, vale o \`name\`. */
  label?: string;
  /** Valor de exemplo, para a previa do seu projeto. */
  example?: string;
}`,
    options: {
      toolbar: 'EditorTool[]',
      table: '{ rows: number; cols: number }',
      minHeight: 'string',
      placeholder: 'string',
      variables: 'EditorVariable[] | null',
    },
    docs: {
      toolbar: 'Botoes da barra, na ordem.',
      table: 'Tamanho da tabela inserida pelo botao, com a linha de cabecalho.',
      variables: 'Variaveis do texto. Com elas a barra ganha o botao da lista e o `{` digitado a abre; sem elas, nada muda.',
    },
    methods: {
      inTable: '(name: EditorTableAction): this',
      apply: '(name: EditorTool): this',
      openVariables: '(query?: string): this',
      insertVariable: '(name: string): this',
      unknownVariables: '(): string[]',
      getValue: '(): string',
      setValue: '(html: string | null | undefined): this',
      destroy: '(): void',
    },
    methodDocs: {
      apply: 'Aplica um botao da barra onde esta a selecao.',
      openVariables: 'Abre a lista de variaveis; com `query`, ja filtrada.',
      insertVariable: 'Escreve `{{nome}}` onde esta o cursor.',
      unknownVariables: 'Variaveis escritas no texto que nao estao em `variables` — o erro de digitacao. Vazio sem lista declarada.',
      getValue: 'HTML ja peneirado; editor vazio devolve `\'\'`.',
    },
    props: { field: 'HTMLTextAreaElement', area: 'HTMLElement', root: 'HTMLElement' },
    doc: 'Editor de texto formatado sobre um `<textarea>`, que continua guardando o HTML peneirado.',
  },

  Mask: {
    target: 'string | HTMLElement',
    types: `
/** Formato de mascara, como os de \`FORMATS\`. Gabarito: \`#\` digito, \`A\` letra, \`*\` digito ou letra. */
export interface MaskFormat {
  /** Um gabarito, ou varios escolhidos pelo tamanho do conteudo. */
  template?: string | string[];
  validate?: (raw: string) => boolean;
  /** Mensagem quando \`validate\` recusa. */
  error?: string;
  uppercase?: boolean;
  isCurrency?: boolean;
  currency?: string;
}
export interface MaskChangeDetail {
  /** O texto formatado, como esta no campo. */
  value: string;
  /** Sem formatacao: so digitos, ou digitos e letras. */
  raw: string;
  /** O numero, no formato moeda; \`null\` nos outros. */
  number: number | null;
  instance: Mask;
}`,
    options: {
      format: 'FormatName | (string & {}) | string[] | null',
      validate: 'boolean',
      decimals: 'number',
      currency: 'string | null',
      reveal: 'boolean',
      revealVisible: 'number',
      revealMode: 'RevealMode | null',
      locale: 'string',
      errorText: 'string | null',
      onChange: '((value: string, detail: MaskChangeDetail) => void) | null',
    },
    methods: {
      getRaw: '(): string',
      getNumber: '(): number | null',
      setValue: '(value: string | number | null): void',
      isValid: '(): boolean',
      destroy: '(): void',
    },
    props: { input: 'HTMLElement' },
    events: { 'tucano:change': 'MaskChangeDetail' },
  },

  Modal: {
    types: `
/** Opcoes do \`Tucano.confirm\`: as do modal, sem \`actions\`, com os rotulos dos dois botoes. */
export interface ConfirmOptions extends Omit<ModalOptions, 'actions'> {
  /** Rotulo do botao de confirmar. Padrao: setTexts ("Confirmar"). */
  confirm?: string;
  /** Rotulo do botao de cancelar. Padrao: setTexts ("Cancelar"). */
  cancel?: string;
}`,
    options: {
      title: 'string | null',
      text: 'string',
      size: "'sm' | 'md' | 'lg' | 'full'",
      tone: 'DialogTone',
      sheet: 'boolean',
      closable: 'boolean',
      closeOnBackdrop: 'boolean',
      actions: 'DialogAction<Modal>[] | null',
      onClose: '((reason: DialogCloseReason, instance: Modal) => void) | null',
      className: 'string',
    },
    methods: {
      open: '(): this',
      close: '(reason?: DialogCloseReason): this',
      content: '(node: DialogContent | DialogContent[]): this',
    },
    props: { node: 'HTMLDialogElement', panel: 'HTMLElement', body: 'HTMLElement | null', isOpen: 'boolean | undefined' },
    doc: 'Modal: `<dialog>` centrado, com foco preso, Escape e foco devolvido a quem abriu.',
  },

  Pagination: {
    options: {
      page: 'number',
      pages: 'number',
      param: 'string',
      around: 'number',
      edges: 'number',
      prevText: 'string',
      nextText: 'string',
      label: 'string',
      onChange: '((page: number, pagination: Pagination) => void) | null',
    },
    docs: { onChange: 'Definido, cancela a navegacao do link e recebe a pagina — para HTMX ou lista sem recarregar.' },
    methods: {
      href: '(page: number): string',
      render: '(): this',
      setPage: '(page: number): this',
      destroy: '(): void',
    },
    props: { node: 'HTMLElement' },
    doc: 'Paginacao com links de verdade (`?page=`), preservando o resto da query string.',
  },

  Select: {
    target: 'string | HTMLSelectElement',
    types: `
/** \`string\` no select simples, \`string[]\` no \`multiple\`, \`null\` sem valor. */
export type SelectValue = string | string[] | null;
/** Item aceito da busca no servidor: \`{ value, label }\`, texto solto, ou \`{ id, text }\` do Select2. */
export type SelectRemoteItem =
  | string
  | number
  | { value?: string | number; id?: string | number; label?: string; text?: string; disabled?: boolean; group?: string | null };
/** Resposta da busca no servidor: a lista, ou \`{ results, next }\` do DRF. */
export type SelectRemoteResponse = SelectRemoteItem[] | { results: SelectRemoteItem[]; next?: string | boolean | null };
export interface SelectChangeDetail {
  value: SelectValue;
  instance: Select;
}`,
    options: {
      search: 'boolean',
      searchMinItems: 'number',
      placeholder: 'string',
      searchPlaceholder: 'string',
      emptyText: 'string',
      clearable: 'boolean',
      maxItems: 'number | null',
      wrapTags: 'boolean',
      closeOnSelect: 'boolean',
      placement: 'Placement',
      appendTo: 'HTMLElement',
      url: 'string | null',
      loadOptions: '((term: string, context: { signal: AbortSignal; page: number }) => Promise<SelectRemoteResponse>) | null',
      queryParam: 'string',
      pageParam: 'string | null',
      minChars: 'number',
      debounce: 'number',
      cache: 'boolean',
      cacheSize: 'number',
      shortCircuit: 'boolean',
      loadingText: 'string',
      errorText: 'string',
      onChange: '((value: SelectValue, detail: SelectChangeDetail) => void) | null',
    },
    docs: {
      appendTo: 'Onde o menu nasce. Padrao: o `<dialog>` aberto que contem o campo, ou o `<body>`.',
      shortCircuit: 'Termo que nao trouxe nada nao e buscado de novo quando so cresce ("lucas" vazio, "lucass" nem pergunta). Serve so para busca por conter o termo.',
    },
    methods: {
      getValue: '(): SelectValue',
      setValue: '(value: string | number | ReadonlyArray<string | number> | null, options?: SilentOption): void',
      clear: '(options?: SilentOption): void',
      refresh: '(): void',
      open: '(): void',
      close: '(): void',
      toggle: '(): void',
      destroy: '(): void',
    },
    props: { isOpen: 'boolean', native: 'HTMLSelectElement', multiple: 'boolean' },
    events: { 'tucano:change': 'SelectChangeDetail' },
  },

  Table: {
    target: 'string | HTMLTableElement',
    types: `
export type SortDirection = 'asc' | 'desc';
export interface TableSortDetail {
  /** Indice da coluna. */
  column: number;
  /** O \`data-field\` do cabecalho, ou o indice em texto. */
  field: string;
  direction: SortDirection;
}
export interface TableSelectDetail {
  /** Os \`data-id\` das linhas marcadas — o que o formulario enviaria. */
  selected: string[];
  row: HTMLTableRowElement;
}`,
    options: {
      sortable: 'boolean',
      sortMode: "'server' | 'client'",
      sortParam: 'string',
      dirParam: 'string',
      selectable: 'boolean',
      selectName: 'string',
      onSort: '((detail: TableSortDetail, table: Table) => void) | null',
      onSelect: '((detail: TableSelectDetail, table: Table) => void) | null',
    },
    methods: {
      sort: '(index: number, direction?: SortDirection, type?: SortType): this',
      getSelected: '(): string[]',
      clearSelection: '(): this',
      destroy: '(): void',
    },
    getters: { rows: 'HTMLTableRowElement[]' },
    props: { node: 'HTMLTableElement', wrap: 'HTMLElement' },
    events: { 'tucano:sort': 'TableSortDetail', 'tucano:select': 'TableSelectDetail' },
    doc: 'Tabela: ordenar (pelo servidor, por padrao) e marcar linhas em massa.',
  },

  Tabs: {
    target: 'string | HTMLElement',
    types: `
export interface TabsChangeDetail {
  /** Indice da aba aberta. */
  value: number;
  tab: HTMLElement | undefined;
  panel: HTMLElement | undefined;
  instance: Tabs;
}`,
    options: {
      selected: 'number | null',
      manual: 'boolean',
      onChange: '((index: number, detail: TabsChangeDetail) => void) | null',
    },
    methods: {
      select: '(index: number, options?: SilentOption): this',
      destroy: '(): void',
    },
    getters: { tabs: 'HTMLElement[]', panels: 'HTMLElement[]', index: 'number' },
    props: { node: 'HTMLElement', list: 'HTMLElement' },
    events: { 'tucano:change': 'TabsChangeDetail' },
    doc: 'Abas com os papeis e o teclado do ARIA APG. O template ja traz as classes.',
  },

  Toast: {
    types: `
export type ToastPosition = \`\${'top' | 'bottom'}-\${'start' | 'center' | 'end'}\`;
export interface ToastAction {
  text: string;
  onClick?: (toast: Toast) => void;
}
/** Textos do \`toast.promise\`: fixos, ou funcoes que recebem o resultado ou o erro. */
export interface ToastPromiseMessages<T> extends Omit<ToastOptions, 'type' | 'text'> {
  loading?: string;
  success?: string | ((data: T) => string | null | undefined);
  error?: string | ((error: unknown) => string | null | undefined);
}`,
    options: {
      type: 'ToastType',
      title: 'string | null',
      text: 'string',
      duration: 'number | null',
      position: 'ToastPosition',
      closable: 'boolean',
      action: 'ToastAction | null',
      max: 'number',
    },
    methods: {
      update: '(options?: ToastOptions): this',
      close: '(): void',
    },
    props: { node: 'HTMLElement' },
    events: { 'tucano:toast-closed': 'null' },
    doc: 'Aviso temporario empilhado num canto da tela. Use o atalho `toast()`.',
  },

  Tooltip: {
    target: 'string | HTMLElement',
    options: {
      text: 'string',
      placement: 'Placement',
      delay: 'number',
      delayOut: 'number',
      maxWidth: 'string',
      className: 'string',
    },
    docs: { text: 'Texto da dica. Sem ele vale o `title` do elemento.' },
    methods: {
      setText: '(text: string): void',
      destroy: '(): void',
    },
    props: { anchor: 'HTMLElement', panel: 'HTMLElement', isOpen: 'boolean | undefined' },
  },

  Upload: {
    target: 'string | HTMLInputElement',
    types: `
export interface UploadFile {
  name: string;
  size: number;
  type: string;
  status: UploadStatus;
  /** De 0 a 1. */
  progress: number;
  /** Id devolvido pelo servidor (upload direto). */
  id: string | number | null;
  url: string | null;
  file: File;
}
/** No upload direto, os ids devolvidos pelo servidor; sem \`url\`, os proprios arquivos. */
export type UploadValue = Array<string | number> | File[];
export interface UploadChangeDetail {
  value: UploadValue;
  files: UploadFile[];
  instance: Upload;
}`,
    options: {
      url: 'string | null',
      method: 'string',
      fieldName: 'string',
      extraData: 'Record<string, string | Blob>',
      headers: 'Record<string, string>',
      csrf: 'boolean',
      responseId: 'string',
      responseUrl: 'string',
      deleteUrl: 'string | null',
      maxSize: 'string | number | null',
      maxFiles: 'number | null',
      autoUpload: 'boolean',
      locale: 'string',
      texts: 'Partial<UploadTexts>',
      onChange: '((value: UploadValue, detail: UploadChangeDetail) => void) | null',
      onError: '((error: Error, file: File) => void) | null',
    },
    methods: {
      getFiles: '(): UploadFile[]',
      getValue: '(): UploadValue',
      uploadAll: '(): void',
      clear: '(): void',
      destroy: '(): void',
    },
    props: { input: 'HTMLInputElement', multiple: 'boolean' },
    events: { 'tucano:change': 'UploadChangeDetail' },
  },
};

/* O Popover nao e componente (nao tem DEFAULTS nem autoInit), mas e exportado. */
const POPOVER = {
  ctor: '(anchor: HTMLElement, panel: HTMLElement, options?: PopoverOptions)',
  options: {
    placement: 'Placement',
    offset: 'number',
    padding: 'number',
    appendTo: 'HTMLElement',
    matchWidth: 'boolean',
    closeIfDetached: 'boolean',
    closeOnFocusOut: 'boolean',
    onDismiss: '(reason: PopoverDismissReason) => void',
  },
  docs: {
    placement: 'Lado e alinhamento. @default \'bottom-start\'',
    offset: 'Distancia da ancora, em px. @default 8',
    padding: 'Folga minima das bordas da tela, em px. @default 8',
    appendTo: 'Onde o painel nasce. Padrao: o `<dialog>` aberto que contem a ancora, ou o `<body>`.',
    matchWidth: 'Painel no minimo da largura da ancora, como o menu do select.',
    closeIfDetached: 'Chama `onDismiss(\'detached\')` quando a ancora sai da tela.',
    closeOnFocusOut: 'Chama `onDismiss(\'focus\')` quando o foco vai para fora do painel e da ancora.',
    onDismiss: 'Pedido de fechar: clique fora, Escape, foco fora ou ancora fora da tela. Quem fecha e voce.',
  },
  methods: {
    show: '(): void',
    hide: '(options?: { animate?: boolean }): void',
    destroy: '(): void',
  },
  props: { anchor: 'HTMLElement', panel: 'HTMLElement', open: 'boolean' },
};

/* Exports de index.js que nao sao classe, autoInit de componente, ICON_*, namespace nem init. */
const TOP = {
  toast: {
    call: ['(text: string, extra?: ToastOptions): Toast', '(options: ToastOptions, extra?: ToastOptions): Toast'],
    members: {
      info: '(text: string, extra?: ToastOptions): Toast',
      success: '(text: string, extra?: ToastOptions): Toast',
      warning: '(text: string, extra?: ToastOptions): Toast',
      error: '(text: string, extra?: ToastOptions): Toast',
      loading: '(text: string, extra?: ToastOptions): Toast',
      promise: '<P>(promise: P, messages?: ToastPromiseMessages<Awaited<P>>): P',
    },
    memberDocs: {
      loading: 'Toast de carregando: nao fecha sozinho. Troque com `update()`.',
      promise: 'Acompanha uma promessa num toast so: carregando, depois sucesso ou erro. Devolve a promessa recebida.',
    },
  },
  listenForEvents: 'function listenForEvents(): void',
  modal: 'function modal(optionsOrText: string | ModalOptions, extra?: ModalOptions): Modal',
  confirm: 'function confirm(options?: ConfirmOptions): Promise<boolean>',
  drawer: 'function drawer(optionsOrText: string | DrawerOptions, extra?: DrawerOptions): Drawer',
  pagination: 'function pagination(options?: PaginationOptions): HTMLElement',
  pageWindow: 'function pageWindow(page: number, pages: number, options?: { around?: number; edges?: number }): Array<number | null>',
  autoFormat: 'function autoFormat(scope?: ParentNode): HTMLElement[]',
  autoInitProse: 'function autoInitProse(scope?: ParentNode): HTMLElement[]',
  sanitize: 'function sanitize(html: string | null | undefined): string',
  highlight: 'function highlight(code: string | null | undefined): string',
  setTexts: 'function setTexts(texts?: TucanoTextsInput): void',
  getTexts: 'function getTexts(): TucanoTexts',
  icon: 'function icon(path: string, size?: number): SVGSVGElement',
  FORMATS: 'const FORMATS: Record<FormatName, MaskFormat> & { [name: string]: MaskFormat | undefined }',
};

const TOP_DOCS = {
  pageWindow: 'Quais numeros aparecem: pontas, a atual e a vizinhanca; `null` onde entra a reticencia.',
  getTexts: 'Copia dos textos atuais, por grupo. Serve de ponto de partida e para restaurar.',
  FORMATS: 'Formatos prontos da mascara. Um formato novo acrescentado aqui passa a valer em `data-tuc-mask`.',
};

/* Tucano.mask, Tucano.dates e Tucano.color: cada export do modulo precisa de tipo. */
const NAMESPACES = {
  mask: {
    file: 'src/js/core/mask.js',
    members: {
      isPlaceholder: 'function isPlaceholder(char: string): boolean',
      clear: 'function clear(value: unknown, template: string): string',
      placeholderFromTemplate: 'function placeholderFromTemplate(template: string | string[]): string',
      capacity: 'function capacity(template: string): number',
      apply: 'function apply(chars: string, template: string): string',
      cursorAfter: 'function cursorAfter(text: string, n: number): number',
      pickTemplate: 'function pickTemplate(chars: ArrayLike<string>, templates: string | string[]): string',
      applyCurrency: 'function applyCurrency(digits: string | number, options?: CurrencyOptions): string',
      validateCPF: 'function validateCPF(value: string | number | null | undefined): boolean',
      validateCNPJ: 'function validateCNPJ(value: string | number | null | undefined): boolean',
      validateCpfCnpj: 'function validateCpfCnpj(value: string | number | null | undefined): boolean',
      format: 'function format(value: string | number | null | undefined, format: FormatName | (string & {}) | string[], options?: CurrencyOptions): string',
      maskMiddle: 'function maskMiddle(text: string | null | undefined, visible?: number, mode?: RevealMode): string',
      maskEmail: 'function maskEmail(value: string | null | undefined): string',
    },
  },
  color: {
    file: 'src/js/core/color.js',
    members: {
      clamp: 'function clamp(value: number, min: number, max: number): number',
      hsvToRgb: 'function hsvToRgb(hsv: HSV): RGB',
      rgbToHsv: 'function rgbToHsv(rgb: RGB): HSV',
      rgbToHex: 'function rgbToHex(rgb: RGB, alpha?: number): string',
      parseColor: 'function parseColor(input: string | null | undefined): HSVA | null',
      formatColor: 'function formatColor(hsva: HSVA, format?: ColorFormat): string',
      hsvToHsl: 'function hsvToHsl(hsv: HSV): HSL',
      luminance: 'function luminance(rgb: RGB): number',
      isDark: 'function isDark(color: string | HSVA): boolean',
    },
  },
  dates: {
    file: 'src/js/core/dates.js',
    members: {
      MS_DAY: 'const MS_DAY: number',
      startOfDay: 'function startOfDay(date: Date | string | number): Date',
      isValid: 'function isValid(date: unknown): date is Date',
      clone: 'function clone(date: Date): Date',
      addDays: 'function addDays(date: Date, n: number): Date',
      addMonths: 'function addMonths(date: Date, n: number): Date',
      addYears: 'function addYears(date: Date, n: number): Date',
      daysInMonth: 'function daysInMonth(year: number, month: number): number',
      startOfMonth: 'function startOfMonth(date: Date): Date',
      endOfMonth: 'function endOfMonth(date: Date): Date',
      compareDay: 'function compareDay(a: Date, b: Date): -1 | 0 | 1',
      isSameDay: 'function isSameDay(a: Date | null | undefined, b: Date | null | undefined): boolean',
      isSameMonth: 'function isSameMonth(a: Date | null | undefined, b: Date | null | undefined): boolean',
      isBetween: 'function isBetween(date: Date, start: Date, end: Date): boolean',
      clampDate: 'function clampDate(date: Date, min?: Date | null, max?: Date | null): Date',
      withTime: 'function withTime(day: Date, time: Date): Date',
      buildMonthGrid: 'function buildMonthGrid(year: number, month: number, firstDayOfWeek?: number): Array<{ date: Date; outside: boolean }>',
      getLocaleData: 'function getLocaleData(locale: string): LocaleData',
      format: 'function format(date: Date | null | undefined, pattern: string, locale?: string): string',
      toISODate: 'function toISODate(date: Date | null | undefined): string',
      toISODateTime: 'function toISODateTime(date: Date | null | undefined, seconds?: boolean): string',
      parseISO: 'function parseISO(value: string | Date | null | undefined): Date | null',
      parseUserInput: 'function parseUserInput(text: string | null | undefined, locale?: string, reference?: Date): (Date & { hasTime: boolean }) | null',
      isMonthFirst: 'function isMonthFirst(locale: string): boolean',
      localeDatePattern: "function localeDatePattern(locale: string): 'MM/dd/yyyy' | 'dd/MM/yyyy'",
    },
  },
};

/* Textos que sao funcao: o parametro que cada uma recebe. */
const TEXT_FUNCTIONS = {
  'select.typeToSearch': '(n: number) => string',
  'select.remove': '(label: string) => string',
  'upload.large': '(max: string) => string',
  'upload.others': '(n: number) => string',
  'upload.upTo': '(size: string) => string',
  'upload.serverError': '(status: number) => string',
};

/* Eventos que a Tucano escuta, e nao dispara. */
const LISTENED_EVENTS = {
  'tucano:toast': {
    detail: 'ToastOptions | string',
    doc: 'Abre um toast. Disparado no `<body>` pelo cabecalho `HX-Trigger` do HTMX, depois de `listenForEvents()`.',
  },
};

const EVENT_DOCS = {
  'tucano:change': 'Valor novo em date picker, select, color picker, upload, mascara ou abas. Borbulha.',
  'tucano:sort': 'Clique num cabecalho ordenavel da tabela. Borbulha.',
  'tucano:select': 'Linha marcada ou desmarcada na tabela. Borbulha.',
  'tucano:toast-closed': 'O toast saiu da tela. Disparado no proprio elemento do toast, sem borbulhar.',
};

/* ------------------------------------------------------------------ *
 * Leitura do codigo                                                    *
 * ------------------------------------------------------------------ */

const lib = await import('../src/js/index.js');
const { getTexts } = await import('../src/js/core/texts.js');

/* Compara nos dois sentidos e anota o que falta e o que sobra. */
function compare(label, code, typed) {
  const missing = code.filter((n) => !typed.includes(n));
  const stale = typed.filter((n) => !code.includes(n));
  if (missing.length) problems.push(`${label}: sem tipo para ${missing.join(', ')}`);
  if (stale.length) problems.push(`${label}: tipo para ${stale.join(', ')}, que nao existe no codigo`);
}

const unique = (list) => [...new Set(list)];
const matches = (text, re, group = 1) => unique([...text.matchAll(re)].map((m) => m[group] ?? m[group + 1]));

/* Chaves de um `const NOME = { ... };`, em uma ou varias linhas. */
function objectKeys(source, name) {
  const body = source.match(new RegExp(String.raw`const ${name} = \{([\s\S]*?)\};`))?.[1];
  if (!body) { problems.push(`nao achei const ${name} no codigo`); return []; }
  return matches(body.replace(/\/\/.*$/gm, ''), /(?:^|[{,])\s*'?([\w-]+)'?\s*:/g);
}

/* O JSDoc (/** ... *\/) colado antes do trecho que casa com `after`. */
function jsdoc(source, after) {
  const m = source.match(new RegExp(String.raw`/\*\*((?:(?!\*/)[\s\S])*)\*/[ \t]*\n` + after));
  if (!m) return [];
  return m[1].split('\n').map((l) => l.replace(/^\s*\*?[ \t]?/, '').trimEnd());
}

/*
 * Comentarios das opcoes do DEFAULTS, inteiros. O api.mjs guarda so a primeira
 * linha, que basta para a tabela; no hover cabe a explicacao toda. Linha de
 * comentario com o recuo das chaves fala da opcao seguinte; com recuo maior,
 * continua a anterior (como os itens do dropdown).
 */
function optionComments(source) {
  const out = {};
  const body = source.match(/const DEFAULTS = \{([\s\S]*?)\n\};/)?.[1] ?? '';
  let pending = [];
  let last = null;
  for (const line of body.split('\n')) {
    const comment = line.match(/^(\s*)\/\/\s?(.*)$/);
    if (comment) {
      if (comment[1].length > 2 && last) out[last].push(comment[2]);
      else pending.push(comment[2]);
      continue;
    }
    const option = line.match(/^ {2}(\w+):/);
    if (!option) continue;
    last = option[1];
    const i = line.indexOf('//');
    out[last] = [...pending, ...(i >= 0 ? [line.slice(i + 2).trim()] : [])];
    pending = [];
  }
  return out;
}

function prototypeMembers(Class) {
  const methods = [];
  const getters = [];
  for (let p = Class.prototype; p && p !== Object.prototype; p = Object.getPrototypeOf(p)) {
    for (const name of Object.getOwnPropertyNames(p)) {
      if (name === 'constructor' || name.startsWith('_') || methods.includes(name) || getters.includes(name)) continue;
      (Object.getOwnPropertyDescriptor(p, name).get ? getters : methods).push(name);
    }
  }
  return { methods, getters };
}

const jsFiles = ['src/js', 'src/js/core', 'src/js/components']
  .flatMap((dir) => readdirSync(dir).filter((f) => f.endsWith('.js')).map((f) => `${dir}/${f}`));

/* ------------------------------------------------------------------ *
 * Emissao                                                              *
 * ------------------------------------------------------------------ */

function doc(lines, indent = '') {
  const clean = [].concat(lines).flatMap((l) => String(l).split('\n'))
    .map((l) => l.replace(/\*\//g, '*\\/').trimEnd());
  while (clean.length && !clean[0].trim()) clean.shift();
  while (clean.length && !clean.at(-1).trim()) clean.pop();
  if (!clean.length) return '';
  if (clean.length === 1) return `${indent}/** ${clean[0].trim()} */\n`;
  return `${indent}/**\n${clean.map((l) => `${indent} * ${l}`.trimEnd()).join('\n')}\n${indent} */\n`;
}

const union = (values) => values.map((v) => `'${v}'`).join(' | ');
const out = [];
const counts = { options: 0, methods: 0, events: 0, texts: 0, utilities: 0 };

/* Unioes lidas do codigo. */
const editorSource = read('src/js/components/editor.js');
const popoverSource = read('src/js/core/popover.js');
const dialogSources = ['src/js/core/dialog.js', 'src/js/components/modal.js', 'src/js/components/drawer.js'].map(read).join('\n');
const buttonCss = read('src/styles/components/button.css');
for (const v of BUTTON_VARIANTS) {
  if (!buttonCss.includes(`.tuc-btn.is-${v}`)) problems.push(`ButtonVariant: '${v}' nao existe em button.css`);
}
const UNIONS = [
  ['FormatName', 'Nome de um formato pronto de `FORMATS`.', Object.keys(lib.FORMATS)],
  ['EditorTool', 'Botao da barra do editor, na opcao `toolbar` e em `apply()`.', objectKeys(editorSource, 'COMMANDS')],
  ['EditorTableAction', 'Operacao da barra de tabela do editor, em `inTable()`.', objectKeys(editorSource, 'TABLE')],
  ['PopoverDismissReason', 'Por que o Popover pediu para fechar.', matches(popoverSource, /onDismiss\('(\w+)'\)/g)],
  ['DialogCloseReason', 'Como o modal ou a gaveta fechou: `close()` sem motivo e `\'api\'`.',
    unique([...matches(dialogSources, /close\(reason = '(\w+)'\)/g), ...matches(dialogSources, /\.close\('(\w+)'\)/g)])],
  ['ToastType', 'Tipo do toast: cor, icone e duracao padrao.', objectKeys(read('src/js/components/toast.js'), 'DURATION')],
  ['UploadStatus', 'Estado de um arquivo no upload.', matches(read('src/js/components/upload.js'), /state(?: ={1,3}|:) '(\w+)'/g)],
  ['SortType', 'Como a tabela compara a coluna (`data-sort`).', objectKeys(read('src/js/components/table.js'), 'COMPARE')],
  ['RevealMode', 'Como o campo sensivel esconde: o fim a mostra, o dominio do e-mail, ou tudo.',
    unique([...matches(read('src/js/core/mask.js'), /mode = '(\w+)'/g), ...matches(read('src/js/core/mask.js'), /mode === '(\w+)'/g)])],
];
for (const [name, text, values] of UNIONS) {
  if (!values.length) problems.push(`${name}: nenhum valor lido do codigo — a expressao deixou de casar`);
}

out.push(`/*
 * Tipos da Tucano. Gerado por tools/types.mjs a partir do codigo-fonte, a cada
 * build: nao edite a mao, o proximo build sobrescreve.
 *
 * Com import: \`import { DatePicker } from 'tucano'\`.
 * Com <script> do CDN e checkJs: \`/// <reference types="tucano" />\` (ou o
 * caminho deste arquivo) no topo do script, e \`Tucano.DatePicker\` fica tipado.
 */

export as namespace Tucano;
`);
out.push(SHARED.trim(), '');
out.push(`export type ButtonVariant = ${union(BUTTON_VARIANTS)};`, '');
for (const [name, text, values] of UNIONS) out.push(doc(text) + `export type ${name} = ${union(values)};`, '');

/* Textos. */
const textsSource = read('src/js/core/texts.js');
const groupConst = Object.fromEntries([...(textsSource.match(/const GROUPS = \{([\s\S]*?)\};/)?.[1] ?? '')
  .matchAll(/(\w+): (\w+)/g)].map((m) => [m[1], m[2]]));
const textInterface = (group) => `${inventory.find((c) => c.name === group)?.className ?? group[0].toUpperCase() + group.slice(1)}Texts`;
const seenFunctions = [];
const textGroups = Object.entries(getTexts());
for (const [group, values] of textGroups) {
  const body = textsSource.match(new RegExp(String.raw`export const ${groupConst[group]} = \{([\s\S]*?)\n\};`))?.[1] ?? '';
  const comments = {};
  let pending = [];
  for (const line of body.split('\n')) {
    const c = line.match(/^\s*\/\/\s?(.*)$/);
    if (c) { pending.push(c[1]); continue; }
    const k = line.match(/^\s+(\w+):/);
    if (k) { comments[k[1]] = pending; pending = []; }
  }
  const lines = [`export interface ${textInterface(group)} {`];
  for (const [key, value] of Object.entries(values)) {
    let type = 'string';
    let fallback = `@default '${value}'`;
    if (typeof value === 'function') {
      const id = `${group}.${key}`;
      seenFunctions.push(id);
      type = TEXT_FUNCTIONS[id];
      if (!type) { problems.push(`setTexts: ${id} e funcao e nao tem assinatura em TEXT_FUNCTIONS`); type = 'never'; }
      const params = type.match(/^\(([^)]*)\)/)?.[1].split(',').filter((p) => p.trim()).length;
      if (params !== undefined && params !== value.length) {
        problems.push(`setTexts: ${id} recebe ${value.length} parametro(s) no codigo e ${params} no tipo`);
      }
      fallback = `@default ${String(value)}`;
    }
    lines.push(doc([...(comments[key] ?? []), fallback], '  ') + `  ${key}: ${type};`);
    counts.texts++;
  }
  lines.push('}', '');
  out.push(lines.join('\n'));
}
compare('setTexts (textos em funcao)', seenFunctions, Object.keys(TEXT_FUNCTIONS));
out.push(doc('Todos os textos da interface, por grupo — o formato de `getTexts()`.')
  + `export interface TucanoTexts {\n${textGroups.map(([g]) => `  ${g}: ${textInterface(g)};`).join('\n')}\n}\n`);
out.push(doc('O que `setTexts()` aceita: qualquer grupo, e dentro dele qualquer chave. O que nao for passado continua como estava.')
  + 'export type TucanoTextsInput = { [G in keyof TucanoTexts]?: Partial<TucanoTexts[G]> };\n');

/* Classes. */
const events = {};
function emitClass(className, spec, info) {
  const { source, codeOptions, defaults = {}, comments = {} } = info;
  const G = spec.generic ? `<${spec.generic}>` : '';
  const A = spec.genericArgs ? `<${spec.genericArgs}>` : '';
  const { methods, getters } = prototypeMembers(info.Class);

  compare(`${className} (opcoes)`, codeOptions, Object.keys(spec.options ?? {}));
  compare(`${className} (metodos)`, methods, Object.keys(spec.methods ?? {}));
  compare(`${className} (getters)`, getters, Object.keys(spec.getters ?? {}));
  for (const prop of Object.keys(spec.props ?? {})) {
    if (!new RegExp(String.raw`\b(?:this|m|g)\.${prop}\s*=(?!=)`).test(info.sources)) {
      problems.push(`${className} (propriedades): ${prop} nao e atribuida no codigo`);
    }
  }
  if (spec.docs) {
    const stale = Object.keys(spec.docs).filter((k) => !(k in (spec.options ?? {})));
    if (stale.length) problems.push(`${className} (docs): comentario para ${stale.join(', ')}, que nao e opcao`);
  }

  if (spec.types) out.push(spec.types.trim(), '');

  if (spec.options) {
    const lines = [doc(`Opcoes de \`${className}\`. Toda opcao e opcional; o padrao vem do codigo.`) + `export interface ${className}Options${G} {`];
    for (const [name, type] of Object.entries(spec.options)) {
      const note = spec.docs?.[name] ?? comments[name] ?? [];
      const dv = defaults[name];
      const def = dv && dv !== 'undefined' && !dv.endsWith('...') && !String(note).includes('@default') ? [`@default ${dv}`] : [];
      lines.push(doc([...[].concat(note), ...def], '  ') + `  ${name}?: ${type};`);
      counts.options++;
    }
    lines.push('}', '');
    out.push(lines.join('\n'));
  }

  const classDoc = spec.doc ?? jsdoc(source, `export class ${className}\\b`);
  const lines = [doc(classDoc) + `export declare class ${className}${G} {`];
  const ctor = spec.ctor ?? (spec.target
    ? `(target: ${spec.target}, options?: ${className}Options${A})`
    : `(options?: ${className}Options${A})`);
  lines.push(`  constructor${ctor};`);
  if (spec.options && info.hasOpts) lines.push(doc('Opcoes ja mescladas com os padroes.', '  ') + `  readonly opts: ${className}Options${A};`);
  for (const [name, type] of Object.entries(spec.props ?? {})) lines.push(`  readonly ${name}: ${type};`);
  for (const [name, type] of Object.entries(spec.getters ?? {})) lines.push(`  readonly ${name}: ${type};`);
  for (const [name, signature] of Object.entries(spec.methods ?? {})) {
    const text = spec.methodDocs?.[name] ?? jsdoc(info.sources, String.raw` {2}${name}\s*\(`);
    lines.push(doc(text, '  ') + `  ${name}${signature};`);
    counts.methods++;
  }
  lines.push('}', '');
  out.push(lines.join('\n'));

  compare(`${className} (eventos)`, info.events ?? [], Object.keys(spec.events ?? {}));
  for (const [event, detail] of Object.entries(spec.events ?? {})) (events[event] ??= []).push(detail);
}

compare('componentes', inventory.map((c) => c.className), Object.keys(COMPONENTS));
for (const c of inventory) {
  const spec = COMPONENTS[c.className];
  if (!spec) continue;
  const file = `src/js/components/${c.name}.js`;
  const source = read(file);
  /*
   * Classe que herda: a fonte da mae entra junto, senao propriedade atribuida
   * la (this.panel, this.trigger) conta como inexistente. O modal e a gaveta
   * herdam do core/dialog.js; o menu do botao direito, do dropdown.
   */
  const parent = source.match(/^export class \w+ extends (\w+)/m)?.[1];
  const parentFile = !parent ? null
    : parent === 'Dialog' ? 'src/js/core/dialog.js'
      : `src/js/components/${parent.toLowerCase()}.js`;
  const sources = parentFile ? `${source}\n${read(parentFile)}` : source;
  if (Boolean(spec.target) !== c.args.startsWith('alvo')) {
    problems.push(`${c.className}: o construtor ${spec.target ? 'nao recebe' : 'recebe'} alvo no codigo`);
  }
  emitClass(c.className, spec, {
    Class: lib[c.className],
    source,
    sources,
    codeOptions: unique([...c.options.map((o) => o.name), ...matches(source, /\bthis\.opts\.(\w+)/g)]),
    defaults: Object.fromEntries(c.options.map((o) => [o.name, o.defaultValue])),
    comments: optionComments(source),
    hasOpts: /\b(?:this|m|g)\.opts\s*=/.test(source),
    events: c.events,
  });
}
emitClass('Popover', POPOVER, {
  Class: lib.Popover,
  source: popoverSource,
  sources: popoverSource,
  codeOptions: matches(popoverSource, /\boptions\.(\w+)/g),
});

/* Eventos: os disparados e os escutados, em todo o src/js. */
const codeEvents = unique(jsFiles.flatMap((f) => matches(read(f), /(?:new CustomEvent|addEventListener)\('(tucano:[\w-]+)'/g)));
compare('eventos', codeEvents, unique([...Object.keys(events), ...Object.keys(LISTENED_EVENTS)]));

/* Exports do pacote. */
const indexSource = read('src/js/index.js');
const exportFrom = {};
for (const m of indexSource.matchAll(/export \{([^}]+)\} from '\.\/([^']+)'/g)) {
  for (const part of m[1].split(',').map((s) => s.trim()).filter(Boolean)) {
    const [orig, alias = orig] = part.split(/\s+as\s+/);
    exportFrom[alias] = { file: `src/js/${m[2]}`, orig };
  }
}
for (const m of indexSource.matchAll(/export \* as (\w+) from '\.\/([^']+)'/g)) exportFrom[m[1]] = { file: `src/js/${m[2]}`, namespace: true };

const returns = {};
const classNames = [...Object.keys(COMPONENTS), 'Popover'];
const topSeen = [];
const exportLines = [];
for (const name of Object.keys(lib)) {
  const from = exportFrom[name];
  const source = from ? read(from.file) : indexSource;
  if (classNames.includes(name)) continue;

  if (name === 'init') continue;

  if (from?.namespace) {
    const ns = NAMESPACES[name];
    if (!ns) { problems.push(`Tucano.${name}: modulo exportado sem tipo em NAMESPACES`); continue; }
    compare(`Tucano.${name}`, Object.keys(lib[name]), Object.keys(ns.members));
    const nsSource = read(ns.file);
    const lines = [doc(`\`Tucano.${name}\`: o modulo que os componentes usam por dentro, exposto como utilitario.`)
      + `export declare namespace ${name} {`];
    for (const [member, decl] of Object.entries(ns.members)) {
      lines.push(doc(jsdoc(nsSource, String.raw`export (?:function|const) ${member}\b`), '  ') + `  ${decl};`);
      counts.utilities++;
    }
    lines.push('}', '');
    exportLines.push(lines.join('\n'));
    continue;
  }

  if (/^ICON_/.test(name) && typeof lib[name] === 'string') {
    exportLines.push(doc('Caminho SVG de um icone que os componentes usam, para `icon()`.') + `export declare const ${name}: string;\n`);
    continue;
  }

  const component = from && inventory.find((c) => `src/js/components/${c.name}.js` === from.file);
  if (name.startsWith('autoInit') && component && from.orig === 'autoInit' && !TOP[name]) {
    const type = COMPONENTS[component.className]?.autoInit ?? `${component.className}[]`;
    returns[name] = type;
    exportLines.push(doc(jsdoc(source, 'export function autoInit\\b').length
      ? jsdoc(source, 'export function autoInit\\b')
      : `Inicializa todo \`${component.selectors.join('`, `')}\` do escopo que ainda nao foi montado.`)
      + `export declare function ${name}(scope?: ParentNode): ${type};\n`);
    continue;
  }

  const spec = TOP[name];
  if (!spec) { problems.push(`export ${name}: sem tipo em TOP`); continue; }
  topSeen.push(name);
  const text = TOP_DOCS[name] ?? jsdoc(source, String.raw`export (?:function|const) ${from?.orig ?? name}\b`);
  if (typeof spec === 'string') {
    if (/^function autoInit|^function autoFormat/.test(spec)) returns[name] = spec.match(/\):\s*(.+)$/)[1];
    exportLines.push(doc(text) + `export declare ${spec};\n`);
    counts.utilities++;
    continue;
  }
  const iface = `${name[0].toUpperCase()}${name.slice(1)}Function`;
  compare(`${name} (membros)`, Object.keys(lib[name]), Object.keys(spec.members));
  const lines = [`export interface ${iface} {`];
  for (const call of spec.call) lines.push(doc(text, '  ') + `  ${call};`);
  for (const [member, signature] of Object.entries(spec.members)) {
    lines.push(doc(spec.memberDocs?.[member] ?? `Atalho de \`${name}({ type: '${member}', text })\`.`, '  ') + `  ${member}${signature};`);
  }
  lines.push('}', doc(text) + `export declare const ${name}: ${iface};`, '');
  exportLines.push(lines.join('\n'));
  counts.utilities++;
}
/* O que falta ja foi anotado acima, export por export; aqui, o que sobrou. */
const staleTop = Object.keys(TOP).filter((n) => !topSeen.includes(n));
if (staleTop.length) problems.push(`exports (TOP): tipo para ${staleTop.join(', ')}, que index.js nao exporta`);

/* init(): as chaves e o autoInit por tras de cada uma saem do proprio index.js. */
const importFrom = {};
for (const m of indexSource.matchAll(/import \{([^}]+)\} from '\.\/([^']+)'/g)) {
  for (const part of m[1].split(',').map((s) => s.trim()).filter(Boolean)) {
    const [orig, local = orig] = part.split(/\s+as\s+/);
    importFrom[local] = { file: `src/js/${m[2]}`, orig };
  }
}
const initBody = indexSource.match(/export function init\(scope = document\) \{([\s\S]*?)\n\}/)?.[1];
if (!initBody) problems.push('init: nao achei `export function init(scope = document)` em index.js');
const initLines = [doc('O que `init()` devolve: as instancias criadas por tipo de componente.') + 'export interface InitResult {'];
for (const m of (initBody ?? '').matchAll(/(\w+): (\w+)\(scope\)/g)) {
  const imported = importFrom[m[2]];
  const alias = imported && Object.keys(exportFrom).find((k) => exportFrom[k].file === imported.file && exportFrom[k].orig === imported.orig);
  if (!alias || !returns[alias]) { problems.push(`init: nao sei o tipo de ${m[1]} (${m[2]})`); continue; }
  initLines.push(`  ${m[1]}: ${returns[alias]};`);
}
initLines.push('}', doc(jsdoc(indexSource, 'export function init\\b')) + 'export declare function init(scope?: ParentNode): InitResult;', '');
exportLines.push(initLines.join('\n'));
out.push(...exportLines);

/* Eventos no DOM. */
const eventLines = [doc([
  'Eventos da Tucano, com o `detail` tipado. Entram no mapa de eventos de',
  '`Element`, `HTMLElement`, `Document` e `Window`, entao `addEventListener` ja sabe o tipo.',
]) + 'export interface TucanoEventMap {'];
for (const [event, details] of Object.entries(events)) {
  eventLines.push(doc(EVENT_DOCS[event] ?? [], '  ') + `  '${event}': CustomEvent<${unique(details).join(' | ')}>;`);
  counts.events++;
}
for (const [event, { detail, doc: text }] of Object.entries(LISTENED_EVENTS)) {
  eventLines.push(doc(text, '  ') + `  '${event}': CustomEvent<${detail}>;`);
  counts.events++;
}
compare('eventos (documentacao)', Object.keys(events), Object.keys(EVENT_DOCS));
eventLines.push('}', '', `declare global {
  interface ElementEventMap extends TucanoEventMap {}
  interface DocumentEventMap extends TucanoEventMap {}
  interface WindowEventMap extends TucanoEventMap {}
}
`);
out.push(eventLines.join('\n'));

/* ------------------------------------------------------------------ */

if (problems.length) {
  console.error('[tipos] o codigo e tools/types.mjs discordam:');
  for (const p of problems) console.error(`  - ${p}`);
  console.error('Acrescente o tipo que falta ou tire o que sobrou nas tabelas de tools/types.mjs.');
  process.exit(1);
}

const text = out.join('\n').replace(/\n{3,}/g, '\n\n');
if (CHECK) {
  let current = '';
  try { current = read(OUT); } catch { /* ainda nao existe */ }
  if (current !== text) {
    console.error(`[tipos] ${OUT} esta velho em relacao ao codigo: rode \`node tools/types.mjs\``);
    process.exit(1);
  }
  console.log(`tipos: ${OUT} em dia`);
} else {
  writeFileSync(OUT, text);
}
console.log(`tipos: ${inventory.length} componentes + Popover, ${counts.options} opcoes, ${counts.methods} metodos, `
  + `${counts.events} eventos, ${counts.texts} textos, ${counts.utilities} utilitarios`);
