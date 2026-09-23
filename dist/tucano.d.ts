/*
 * Tipos da Tucano. Gerado por tools/types.mjs a partir do codigo-fonte, a cada
 * build: nao edite a mao, o proximo build sobrescreve.
 *
 * Com import: `import { DatePicker } from 'tucano'`.
 * Com <script> do CDN e checkJs: `/// <reference types="tucano" />` (ou o
 * caminho deste arquivo) no topo do script, e `Tucano.DatePicker` fica tipado.
 */

export as namespace Tucano;

/**
 * Lado em que o painel abre e alinhamento com a ancora: `'bottom-start'`,
 * `'top-center'`, `'right'`. Sem alinhamento vale `start`. As bordas da tela
 * ainda mandam: sem espaco, o painel vira para o outro lado.
 */
export type Placement = PlacementSide | `${PlacementSide}-${'start' | 'center' | 'end'}`;
export type PlacementSide = 'top' | 'bottom' | 'left' | 'right';

/** `{ silent: true }` troca o valor sem avisar ninguem: nem `onChange`, nem `tucano:change`, nem o `change` do elemento nativo. */
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
  /** Codigo ISO 4217: `'BRL'` escreve R$. Sem moeda, so o numero. */
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
  /** Variante do `.tuc-btn`. @default 'outline' */
  variant?: ButtonVariant;
  onClick?: (instance: T) => void;
  /** `false` mantem o dialogo aberto depois do clique. @default true */
  closes?: boolean;
}
export type DialogTone = 'default' | 'danger' | 'success' | 'warning';
/** O que `content()` aceita: no, texto, ou uma lista (vazios sao ignorados). */
export type DialogContent = Node | string | null | undefined | false;

export type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger' | 'link';

/** Nome de um formato pronto de `FORMATS`. */
export type FormatName = 'cpf' | 'cnpj' | 'cnpj-numeric' | 'cpf-cnpj' | 'phone' | 'mobile' | 'cep' | 'date' | 'time' | 'card' | 'currency' | 'brl';

/** Botao da barra do editor, na opcao `toolbar` e em `apply()`. */
export type EditorTool = 'bold' | 'italic' | 'underline' | 'title' | 'subheading' | 'list' | 'numbered' | 'quote' | 'clear' | 'left' | 'center' | 'right' | 'justify' | 'code' | 'table' | 'variable' | 'link';

/** Operacao da barra de tabela do editor, em `inTable()`. */
export type EditorTableAction = 'rowAbove' | 'rowBelow' | 'colBefore' | 'colAfter' | 'deleteRow' | 'deleteColumn' | 'deleteTable';

/** Por que o Popover pediu para fechar. */
export type PopoverDismissReason = 'outside' | 'escape' | 'focus' | 'detached';

/** Como o modal ou a gaveta fechou: `close()` sem motivo e `'api'`. */
export type DialogCloseReason = 'api' | 'escape' | 'backdrop' | 'button' | 'action';

/** Tipo do toast: cor, icone e duracao padrao. */
export type ToastType = 'info' | 'success' | 'warning' | 'error' | 'loading';

/** Estado de um arquivo no upload. */
export type UploadStatus = 'ready' | 'pending' | 'uploading' | 'error';

/** Como a tabela compara a coluna (`data-sort`). */
export type SortType = 'number' | 'date' | 'text' | 'numeric' | 'sensitivity';

/** Como o campo sensivel esconde: o fim a mostra, o dominio do e-mail, ou tudo. */
export type RevealMode = 'end' | 'email' | 'all';

export interface DatePickerTexts {
  /** @default 'Selecionar data' */
  dialog: string;
  /** @default 'Selecionar período' */
  dialogRange: string;
  /** @default 'Mês anterior' */
  previousMonth: string;
  /** @default 'Próximo mês' */
  nextMonth: string;
  /**
   * Setas da escolha de mes e de ano.
   * @default 'Anterior'
   */
  previous: string;
  /** @default 'Próximo' */
  next: string;
  /** @default 'Horário' */
  time: string;
  /** @default 'Início' */
  start: string;
  /** @default 'Fim' */
  end: string;
  /** @default 'Hora' */
  hour: string;
  /** @default 'Minuto' */
  minute: string;
  /** @default 'Segundo' */
  second: string;
  /** @default 'Limpar' */
  clear: string;
  /** @default 'Aplicar' */
  apply: string;
  /** @default 'Hoje' */
  today: string;
  /** @default 'Ontem' */
  yesterday: string;
  /** @default 'Últimos 7 dias' */
  last7Days: string;
  /** @default 'Últimos 30 dias' */
  last30Days: string;
  /** @default 'Este mês' */
  thisMonth: string;
  /** @default 'Mês passado' */
  lastMonth: string;
  /** @default 'Este ano' */
  thisYear: string;
  /**
   * Letras do placeholder, nesta ordem: ano, mes, dia, hora, minuto, segundo.
   * "amdhms" escreve dd/mm/aaaa; em ingles, "ymdhms" escreve mm/dd/yyyy.
   * @default 'amdhms'
   */
  placeholderLetters: string;
}

export interface SelectTexts {
  /** @default 'Selecione...' */
  placeholder: string;
  /** @default 'Buscar...' */
  searchPlaceholder: string;
  /** @default 'Nenhum resultado' */
  emptyText: string;
  /** @default 'Buscando...' */
  loadingText: string;
  /** @default 'Falha ao buscar' */
  errorText: string;
  /** @default (n) => `Digite ${n} caractere${n > 1 ? 's' : ''} para buscar` */
  typeToSearch: (n: number) => string;
  /** @default 'Limpar seleção' */
  clear: string;
  /** @default (label) => `Remover ${label}` */
  remove: (label: string) => string;
}

export interface ColorPickerTexts {
  /** @default 'Escolher cor' */
  pick: string;
  /** @default 'Seletor de cor' */
  dialog: string;
  /** @default 'Saturação e brilho' */
  area: string;
  /** @default 'Matiz' */
  hue: string;
  /** @default 'Opacidade' */
  alpha: string;
  /** @default 'Valor da cor' */
  value: string;
  /** @default 'Capturar cor da tela' */
  eyeDropper: string;
}

export interface UploadTexts {
  /** @default 'Arraste arquivos aqui ou clique para escolher' */
  zone: string;
  /** @default 'Arraste um arquivo aqui ou clique para escolher' */
  zoneOne: string;
  /** @default 'Solte para enviar' */
  drop: string;
  /** @default 'Cancelar' */
  cancel: string;
  /** @default 'Remover' */
  remove: string;
  /** @default 'Tentar de novo' */
  repeat: string;
  /** @default (max) => `Arquivo maior que ${max}` */
  large: (max: string) => string;
  /** @default 'Tipo de arquivo não aceito' */
  type: string;
  /** @default (n) => `No máximo ${n} arquivo${n > 1 ? 's' : ''}` */
  others: (n: number) => string;
  /** @default (size) => `até ${size}` */
  upTo: (size: string) => string;
  /** @default (status) => `O servidor respondeu ${status}` */
  serverError: (status: number) => string;
  /** @default 'Falha de rede' */
  networkError: string;
  /**
   * Resposta 2xx sem o id (responseId): sem ele o formulario nao teria o que postar.
   * @default 'O servidor não devolveu o id'
   */
  noId: string;
}

export interface MaskTexts {
  /** @default 'Mostrar' */
  show: string;
  /** @default 'Ocultar' */
  hide: string;
  /** @default 'Valor inválido' */
  invalid: string;
  /** @default 'CPF inválido' */
  cpf: string;
  /** @default 'CNPJ inválido' */
  cnpj: string;
  /** @default 'Documento inválido' */
  cpfCnpj: string;
}

export interface ToastTexts {
  /** @default 'Notificações' */
  region: string;
  /** @default 'Fechar' */
  close: string;
  /**
   * Padroes do toast.promise.
   * @default 'Carregando...'
   */
  loading: string;
  /** @default 'Pronto' */
  success: string;
  /** @default 'Algo deu errado' */
  error: string;
}

export interface ModalTexts {
  /** @default 'Fechar' */
  close: string;
  /**
   * Botoes do Tucano.confirm.
   * @default 'Confirmar'
   */
  confirm: string;
  /** @default 'Cancelar' */
  cancel: string;
}

export interface DrawerTexts {
  /** @default 'Fechar' */
  close: string;
}

export interface TableTexts {
  /** @default 'Selecionar todas as linhas desta página' */
  selectAll: string;
  /** @default 'Selecionar linha' */
  selectRow: string;
}

export interface PaginationTexts {
  /** @default 'Anterior' */
  prevText: string;
  /** @default 'Próxima' */
  nextText: string;
  /** @default 'Paginação' */
  label: string;
}

export interface EditorTexts {
  /** @default 'Formatação' */
  toolbar: string;
  /** @default 'Tabela' */
  tableToolbar: string;
  /**
   * Botoes da barra, com o nome que eles tem na opcao `toolbar`.
   * @default 'Negrito'
   */
  bold: string;
  /** @default 'Itálico' */
  italic: string;
  /** @default 'Sublinhado' */
  underline: string;
  /** @default 'Título' */
  title: string;
  /** @default 'Subtítulo' */
  subheading: string;
  /** @default 'Lista' */
  list: string;
  /** @default 'Lista numerada' */
  numbered: string;
  /** @default 'Citação' */
  quote: string;
  /** @default 'Link' */
  link: string;
  /** @default 'Limpar formatação' */
  clear: string;
  /** @default 'Inserir tabela' */
  table: string;
  /** @default 'Alinhar à esquerda' */
  left: string;
  /** @default 'Centralizar' */
  center: string;
  /** @default 'Alinhar à direita' */
  right: string;
  /** @default 'Justificar' */
  justify: string;
  /** @default 'Código' */
  code: string;
  /** @default 'Variável' */
  variable: string;
  /**
   * Barra que aparece com o cursor dentro de uma tabela.
   * @default 'Inserir linha acima'
   */
  rowAbove: string;
  /** @default 'Inserir linha abaixo' */
  rowBelow: string;
  /** @default 'Inserir coluna à esquerda' */
  colBefore: string;
  /** @default 'Inserir coluna à direita' */
  colAfter: string;
  /** @default 'Excluir linha' */
  deleteRow: string;
  /** @default 'Excluir coluna' */
  deleteColumn: string;
  /** @default 'Excluir tabela' */
  deleteTable: string;
  /**
   * Caixa do link.
   * @default 'Inserir link'
   */
  insertLink: string;
  /** @default 'Editar link' */
  editLink: string;
  /** @default 'Cancelar' */
  cancel: string;
  /** @default 'Remover' */
  removeLink: string;
  /** @default 'Salvar' */
  save: string;
  /** @default 'Inserir' */
  insert: string;
}

export interface ProseTexts {
  /** @default 'Copiar código' */
  copy: string;
  /** @default 'Copiado' */
  copied: string;
}

/** Todos os textos da interface, por grupo — o formato de `getTexts()`. */
export interface TucanoTexts {
  datepicker: DatePickerTexts;
  select: SelectTexts;
  colorpicker: ColorPickerTexts;
  upload: UploadTexts;
  mask: MaskTexts;
  toast: ToastTexts;
  modal: ModalTexts;
  drawer: DrawerTexts;
  table: TableTexts;
  pagination: PaginationTexts;
  editor: EditorTexts;
  prose: ProseTexts;
}

/** O que `setTexts()` aceita: qualquer grupo, e dentro dele qualquer chave. O que nao for passado continua como estava. */
export type TucanoTextsInput = { [G in keyof TucanoTexts]?: Partial<TucanoTexts[G]> };

/** Opcoes de `Accordion`. Toda opcao e opcional; o padrao vem do codigo. */
export interface AccordionOptions {
  /**
   * abrir um recolhe os outros
   * @default false
   */
  single?: boolean;
}

/** Acordeao sobre `<details>`/`<summary>` nativos, com abrir e fechar animados. */
export declare class Accordion {
  constructor(target: string | HTMLElement, options?: AccordionOptions);
  /** Opcoes ja mescladas com os padroes. */
  readonly opts: AccordionOptions;
  readonly node: HTMLElement;
  readonly items: HTMLDetailsElement[];
  open(item: HTMLDetailsElement): this;
  close(item: HTMLDetailsElement): this;
  destroy(): void;
}

export interface ColorPickerChangeDetail {
  value: string;
  rgb: RGBA;
  hsva: HSVA;
  instance: ColorPicker;
}

/** Opcoes de `ColorPicker`. Toda opcao e opcional; o padrao vem do codigo. */
export interface ColorPickerOptions {
  /**
   * 'hex' | 'rgb' | 'hsl'
   * @default 'hex'
   */
  format?: ColorFormat;
  /** @default true */
  alpha?: boolean;
  /**
   * false desliga
   * @default PALETTE
   */
  swatches?: string[] | false;
  /**
   * mesma regra do date picker: centralizado, preso na borda da tela
   * @default 'bottom-center'
   */
  placement?: Placement;
  /** Onde o painel nasce. Padrao: o `<dialog>` aberto que contem o campo, ou o `<body>`. */
  appendTo?: HTMLElement;
  /** @default null */
  onChange?: ((value: string, detail: ColorPickerChangeDetail) => void) | null;
  /** Cor inicial, quando o `value` do campo esta vazio. Sem ela, o campo nasce sem cor. */
  value?: string;
}

/**
 * Seletor de cor ancorado num <input> de texto.
 *
 * O input do projeto nao e tocado — ele so ganha um botao de amostra ao lado,
 * dentro de um wrapper flex. Assim qualquer estilo que o projeto ja aplique no
 * campo continua valendo.
 */
export declare class ColorPicker {
  constructor(target: string | HTMLInputElement, options?: ColorPickerOptions);
  /** Opcoes ja mescladas com os padroes. */
  readonly opts: ColorPickerOptions;
  readonly isOpen: boolean;
  readonly input: HTMLInputElement;
  /** `null` enquanto ninguem escolheu: o campo nasce vazio. */
  getValue(): string | null;
  getRgb(): RGBA | null;
  /** Aplica a cor; `null` ou `''` limpa. Devolve `false`, sem mudar nada, quando o texto nao e uma cor. */
  setValue(value: string | null, options?: SilentOption): boolean;
  open(): void;
  close(): void;
  toggle(): void;
  destroy(): void;
}

/** Opcoes de `ContextMenu`. Toda opcao e opcional; o padrao vem do codigo. */
export interface ContextMenuOptions {
  /** @default 'bottom-start' */
  placement?: Placement;
  /**
   * Lista fixa, ou funcao que recebe o alvo e devolve a lista daquela linha.
   * @default null
   */
  items?: DropdownItem[] | ((target: HTMLElement, menu: ContextMenu) => DropdownItem[]) | null;
  /**
   * Seletor do alvo dentro da area. Sem ele, o alvo e a area inteira; fora de um alvo, o menu do navegador continua valendo.
   * @default null
   */
  match?: string | null;
  /** @default true */
  closeOnPick?: boolean;
  /**
   * Chamado antes de abrir, com o alvo do botao direito.
   * @default null
   */
  onOpen?: ((target: HTMLElement, menu: ContextMenu) => void) | null;
  /**
   * Painel ja escrito no template, com botoes `.tuc-dropdown__item`, no lugar de `items`.
   * @default null
   */
  panel?: HTMLElement;
}

/** Menu do botao direito: o mesmo menu suspenso, aberto no ponto do clique. */
export declare class ContextMenu {
  constructor(target: string | HTMLElement, options?: ContextMenuOptions);
  readonly trigger: HTMLElement;
  readonly panel: HTMLElement;
  readonly isOpen: boolean | undefined;
  readonly items: HTMLElement[];
  readonly area: HTMLElement;
  readonly target: HTMLElement | null;
  /** Abre no ponto da tela. Sem `x` e `y`, ancora no alvo — e o que a tecla de menu e o Shift+F10 fazem. */
  openAt(x: number | null, y: number | null, target?: HTMLElement): this;
  open(): this;
  close(options?: { restoreFocus?: boolean }): this;
  toggle(): this;
  destroy(): void;
}

export type DatePickerMode = 'single' | 'range';
/** Periodo. Uma ponta fica `null` enquanto nao ha valor. */
export interface DateRange {
  start: Date | null;
  end: Date | null;
}
/** Data de entrada: `Date`, ou texto em ISO (`2026-03-01`) ou no formato do idioma (`01/03/2026`). */
export type DateInput = Date | string;
/** Periodo de entrada: `{ start, end }` ou `[start, end]`. */
export type DateRangeInput =
  | { start?: DateInput | null; end?: DateInput | null }
  | [DateInput | null | undefined, DateInput | null | undefined];
/** O que `getValue()` devolve: `Date | null` em `'single'`, `DateRange` em `'range'`. */
export type DatePickerValue<M extends DatePickerMode = DatePickerMode> = M extends 'range' ? DateRange : Date | null;
/** O que `setValue()` aceita em cada modo. */
export type DatePickerInput<M extends DatePickerMode = DatePickerMode> = M extends 'range' ? DateRangeInput | null : DateInput | null;
/** Atalho de periodo proprio, em `presets`. */
export interface DatePreset {
  label: string;
  value: () => { start: Date; end: Date };
}
export interface DatePickerChangeDetail<M extends DatePickerMode = DatePickerMode> {
  value: DatePickerValue<M>;
  /** O valor em ISO local, como vai no input hidden: `2026-03-01`, `2026-03-01T14:30`, ou o par separado por virgula. */
  iso: string;
  instance: DatePicker<M>;
}

/** Opcoes de `DatePicker`. Toda opcao e opcional; o padrao vem do codigo. */
export interface DatePickerOptions<M extends DatePickerMode = 'single'> {
  /**
   * 'single' | 'range'
   * @default 'single'
   */
  mode?: M;
  /**
   * true habilita seletor de hora
   * @default false
   */
  time?: boolean;
  /** @default false */
  seconds?: boolean;
  /** @default 5 */
  minuteStep?: number;
  /** default: locale do documento/navegador */
  locale?: string;
  /** Formato de exibicao, por tokens: `dd/MM/yyyy`, `d 'de' MMMM`. Padrao: o numerico do idioma. */
  format?: string;
  /** 0 = domingo. Padrao: o do idioma. */
  firstDayOfWeek?: number;
  /** default: 2 em range, 1 em single */
  months?: number;
  /**
   * Primeiro dia aceito, em ISO (`2026-01-01`) ou `Date`.
   * @default null
   */
  min?: Date | string | null;
  /**
   * Ultimo dia aceito, em ISO (`2026-12-31`) ou `Date`.
   * @default null
   */
  max?: Date | string | null;
  /**
   * (date) => boolean
   * @default null
   */
  disabledDates?: ((date: Date) => boolean) | null;
  /**
   * atalhos de periodo (Hoje, Ultimos 7 dias...): opt-in
   * @default false
   */
  presets?: boolean | DatePreset[];
  /** default: true sem hora, false com hora. Sem autoApply, a escolha so vale no Aplicar */
  autoApply?: boolean;
  /** @default true */
  clearable?: boolean;
  /** @default false */
  weekNumbers?: boolean;
  /**
   * centralizado no campo; as bordas da tela ainda mandam
   * @default 'bottom-center'
   */
  placement?: Placement;
  /** Onde o painel nasce. Padrao: o `<dialog>` aberto que contem o campo, ou o `<body>`. */
  appendTo?: HTMLElement;
  /** name do input hidden com o valor ISO */
  isoName?: string;
  /**
   * Painel proprio em todo lugar, por padrao: um so comportamento para
   * documentar, estilizar e testar. `true` liga o seletor do sistema no
   * celular, `'auto'` liga so onde o ponteiro e de toque.
   * @default false
   */
  native?: boolean | 'auto';
  /** @default null */
  onChange?: ((value: DatePickerValue<M>, detail: DatePickerChangeDetail<M>) => void) | null;
  /** @default null */
  onOpen?: ((instance: DatePicker<M>) => void) | null;
  /** @default null */
  onClose?: ((instance: DatePicker<M>) => void) | null;
  /** Valor inicial. Sem ele vale o `value` do campo. */
  value?: DateInput;
}

/** Campo de data, hora e periodo. O campo visivel mostra o formato do idioma; um input hidden leva o ISO. */
export declare class DatePicker<M extends DatePickerMode = 'single'> {
  constructor(target: string | HTMLInputElement, options?: DatePickerOptions<M>);
  /** Opcoes ja mescladas com os padroes. */
  readonly opts: DatePickerOptions<M>;
  readonly isOpen: boolean;
  readonly input: HTMLInputElement;
  getValue(): DatePickerValue<M>;
  setValue(value: DatePickerInput<M>, options?: SilentOption): void;
  clear(options?: SilentOption): void;
  open(): void;
  close(options?: { restoreFocus?: boolean }): void;
  toggle(): void;
  destroy(): void;
}

/** Opcoes de `Drawer`. Toda opcao e opcional; o padrao vem do codigo. */
export interface DrawerOptions {
  /** @default null */
  title?: string | null;
  /** @default '' */
  text?: string;
  /**
   * left | right | top | bottom
   * @default 'right'
   */
  side?: 'left' | 'right' | 'top' | 'bottom';
  /**
   * sm | md | lg — nas laterais, largura da coluna
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * default | danger | success | warning
   * @default 'default'
   */
  tone?: DialogTone;
  /** @default true */
  closable?: boolean;
  /** @default true */
  closeOnBackdrop?: boolean;
  /**
   * [{ text, variant, onClick, closes }] — closes:false mantem aberto
   * @default null
   */
  actions?: DialogAction<Drawer>[] | null;
  /** @default null */
  onClose?: ((reason: DialogCloseReason, instance: Drawer) => void) | null;
  /** @default '' */
  className?: string;
}

/** Gaveta (off-canvas): `<dialog>` encostado numa borda da tela. */
export declare class Drawer {
  constructor(options?: DrawerOptions);
  /** Opcoes ja mescladas com os padroes. */
  readonly opts: DrawerOptions;
  readonly node: HTMLDialogElement;
  readonly panel: HTMLElement;
  readonly body: HTMLElement | null;
  readonly isOpen: boolean | undefined;
  open(): this;
  close(reason?: DialogCloseReason): this;
  /** Conteudo livre no corpo: um form do Django, uma tabela, o que for. */
  content(node: DialogContent | DialogContent[]): this;
}

/** Item de `items`. `{ separator: true }` vira uma linha; `{ label }` sozinho vira titulo de grupo. */
export interface DropdownItem {
  text?: string;
  /** Caminho SVG (o `d` de um `<path>`), como os `ICON_*`. */
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
}

/** Opcoes de `Dropdown`. Toda opcao e opcional; o padrao vem do codigo. */
export interface DropdownOptions {
  /** @default 'bottom-start' */
  placement?: Placement;
  /**
   * [{ text, icon, shortcut, onClick, href, variant, disabled, separator, label }]
   * separator: true vira uma linha; label sozinho vira titulo de grupo
   * ou { separator: true } / { label: 'Seção' }
   * @default null
   */
  items?: DropdownItem[] | null;
  /** @default true */
  closeOnPick?: boolean;
  /** Painel ja escrito no template, com botoes `.tuc-dropdown__item`, no lugar de `items`. */
  panel?: HTMLElement;
}

/** Menu suspenso ancorado num gatilho, com teclado de menu. */
export declare class Dropdown {
  constructor(target: string | HTMLElement, options?: DropdownOptions);
  /** Opcoes ja mescladas com os padroes. */
  readonly opts: DropdownOptions;
  readonly trigger: HTMLElement;
  readonly panel: HTMLElement;
  readonly isOpen: boolean | undefined;
  readonly items: HTMLElement[];
  open(): this;
  /** Abre ancorado num ponto da tela, em vez de no gatilho. */
  openAt(x: number, y: number): this;
  close(): this;
  toggle(): this;
  destroy(): void;
}

/** Variavel de `variables`, trocada pelos dados na hora de enviar o texto. */
export interface EditorVariable {
  /** O nome dentro das chaves: `nome` vira `{{nome}}`. */
  name: string;
  /** Como ela aparece na lista. Sem ele, vale o `name`. */
  label?: string;
  /** Valor de exemplo, para a previa do seu projeto. */
  example?: string;
}

/** Opcoes de `Editor`. Toda opcao e opcional; o padrao vem do codigo. */
export interface EditorOptions {
  /**
   * Botoes da barra, na ordem.
   * @default ['bold', 'italic', 'underline', 'title', 'subheading'
   */
  toolbar?: EditorTool[];
  /**
   * Tamanho da tabela inserida pelo botao, com a linha de cabecalho.
   * @default { rows: 3, cols: 3 }
   */
  table?: { rows: number; cols: number };
  /** @default '9rem' */
  minHeight?: string;
  /** @default '' */
  placeholder?: string;
  /**
   * Variaveis do texto. Com elas a barra ganha o botao da lista e o `{` digitado a abre; sem elas, nada muda.
   * @default null
   */
  variables?: EditorVariable[] | null;
}

/** Editor de texto formatado sobre um `<textarea>`, que continua guardando o HTML peneirado. */
export declare class Editor {
  constructor(target: string | HTMLTextAreaElement, options?: EditorOptions);
  /** Opcoes ja mescladas com os padroes. */
  readonly opts: EditorOptions;
  readonly field: HTMLTextAreaElement;
  readonly area: HTMLElement;
  readonly root: HTMLElement;
  /** Operacao de tabela na celula onde o cursor esta. */
  inTable(name: EditorTableAction): this;
  /** Aplica um botao da barra onde esta a selecao. */
  apply(name: EditorTool): this;
  /** Abre a lista de variaveis; com `query`, ja filtrada. */
  openVariables(query?: string): this;
  /** Escreve `{{nome}}` onde esta o cursor. */
  insertVariable(name: string): this;
  /** Variaveis escritas no texto que nao estao em `variables` — o erro de digitacao. Vazio sem lista declarada. */
  unknownVariables(): string[];
  /** HTML ja peneirado; editor vazio devolve `''`. */
  getValue(): string;
  setValue(html: string | null | undefined): this;
  destroy(): void;
}

/** Formato de mascara, como os de `FORMATS`. Gabarito: `#` digito, `A` letra, `*` digito ou letra. */
export interface MaskFormat {
  /** Um gabarito, ou varios escolhidos pelo tamanho do conteudo. */
  template?: string | string[];
  validate?: (raw: string) => boolean;
  /** Mensagem quando `validate` recusa. */
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
  /** O numero, no formato moeda; `null` nos outros. */
  number: number | null;
  instance: Mask;
}

/** Opcoes de `Mask`. Toda opcao e opcional; o padrao vem do codigo. */
export interface MaskOptions {
  /**
   * nome de FORMATS ou gabarito livre
   * @default null
   */
  format?: FormatName | (string & {}) | string[] | null;
  /**
   * valida no blur e bloqueia o submit
   * @default false
   */
  validate?: boolean;
  /** @default 2 */
  decimals?: number;
  /**
   * 'BRL' formata com R$
   * @default null
   */
  currency?: string | null;
  /**
   * olhinho para mostrar e ocultar
   * @default false
   */
  reveal?: boolean;
  /**
   * quantos caracteres ficam a mostra no modo 'end'
   * @default 2
   */
  revealVisible?: number;
  /**
   * 'end' | 'email' | 'all'. null decide pelo campo
   * @default null
   */
  revealMode?: RevealMode | null;
  locale?: string;
  /** @default null */
  errorText?: string | null;
  /** @default null */
  onChange?: ((value: string, detail: MaskChangeDetail) => void) | null;
}

/**
 * *-##'],
 * validate: validateCpfCnpj, get error() { return T.cpfCnpj; }, uppercase: true,
 * },
 * phone: { template: ['(##) ####-####', '(##) #####-####'] },
 * mobile: { template: '(##) #####-####' },
 * cep: { template: '#####-###' },
 * date: { template: '##/##/####' },
 * time: { template: '##:##' },
 * card: { template: '#### #### #### ####' },
 * currency: { isCurrency: true },
 * brl: { isCurrency: true, currency: 'BRL' },
 * };
 *
 * const DEFAULTS = {
 * format: null,        // nome de FORMATS ou gabarito livre
 * validate: false,     // valida no blur e bloqueia o submit
 * decimals: 2,
 * currency: null,      // 'BRL' formata com R$
 * reveal: false,       // olhinho para mostrar e ocultar
 * revealVisible: 2,    // quantos caracteres ficam a mostra no modo 'end'
 * revealMode: null,    // 'end' | 'email' | 'all'. null decide pelo campo
 * locale: undefined,
 * errorText: null,
 * onChange: null,
 * };
 *
 * /**
 * Mascara de campo. Nao envolve nem substitui o input: e comportamento puro,
 * entao o estilo do projeto continua valendo sem nenhum ajuste.
 */
export declare class Mask {
  constructor(target: string | HTMLElement, options?: MaskOptions);
  /** Opcoes ja mescladas com os padroes. */
  readonly opts: MaskOptions;
  readonly input: HTMLElement;
  /** Conteudo sem formatacao: so digitos, ou digitos e letras. */
  getRaw(): string;
  /** Numero, no formato moeda. */
  getNumber(): number | null;
  setValue(value: string | number | null): void;
  isValid(): boolean;
  destroy(): void;
}

/** Opcoes do `Tucano.confirm`: as do modal, sem `actions`, com os rotulos dos dois botoes. */
export interface ConfirmOptions extends Omit<ModalOptions, 'actions'> {
  /** Rotulo do botao de confirmar. Padrao: setTexts ("Confirmar"). */
  confirm?: string;
  /** Rotulo do botao de cancelar. Padrao: setTexts ("Cancelar"). */
  cancel?: string;
}

/** Opcoes de `Modal`. Toda opcao e opcional; o padrao vem do codigo. */
export interface ModalOptions {
  /** @default null */
  title?: string | null;
  /** @default '' */
  text?: string;
  /**
   * sm | md | lg | full
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'full';
  /**
   * default | danger | success | warning
   * @default 'default'
   */
  tone?: DialogTone;
  /**
   * no celular sobe do rodape em vez de surgir no centro
   * @default false
   */
  sheet?: boolean;
  /**
   * botao X e Escape
   * @default true
   */
  closable?: boolean;
  /** @default true */
  closeOnBackdrop?: boolean;
  /**
   * [{ text, variant, onClick, closes }] — closes:false mantem aberto
   * @default null
   */
  actions?: DialogAction<Modal>[] | null;
  /** @default null */
  onClose?: ((reason: DialogCloseReason, instance: Modal) => void) | null;
  /** @default '' */
  className?: string;
}

/** Modal: `<dialog>` centrado, com foco preso, Escape e foco devolvido a quem abriu. */
export declare class Modal {
  constructor(options?: ModalOptions);
  /** Opcoes ja mescladas com os padroes. */
  readonly opts: ModalOptions;
  readonly node: HTMLDialogElement;
  readonly panel: HTMLElement;
  readonly body: HTMLElement | null;
  readonly isOpen: boolean | undefined;
  open(): this;
  close(reason?: DialogCloseReason): this;
  /** Conteudo livre no corpo: um form do Django, uma tabela, o que for. */
  content(node: DialogContent | DialogContent[]): this;
}

/** Opcoes de `Pagination`. Toda opcao e opcional; o padrao vem do codigo. */
export interface PaginationOptions {
  /** @default 1 */
  page?: number;
  /** @default 1 */
  pages?: number;
  /** @default 'page' */
  param?: string;
  /**
   * paginas visiveis de cada lado da atual
   * @default 1
   */
  around?: number;
  /**
   * paginas visiveis nas pontas
   * @default 1
   */
  edges?: number;
  /** default: setTexts ("Anterior") */
  prevText?: string;
  /** default: setTexts ("Próxima") */
  nextText?: string;
  /** default: setTexts ("Paginação") */
  label?: string;
  /**
   * Definido, cancela a navegacao do link e recebe a pagina — para HTMX ou lista sem recarregar.
   * @default null
   */
  onChange?: ((page: number, pagination: Pagination) => void) | null;
}

/** Paginacao com links de verdade (`?page=`), preservando o resto da query string. */
export declare class Pagination {
  constructor(options?: PaginationOptions);
  /** Opcoes ja mescladas com os padroes. */
  readonly opts: PaginationOptions;
  readonly node: HTMLElement;
  /** Monta o href preservando o resto da query string — filtros, busca, ordem. */
  href(page: number): string;
  render(): this;
  /** Troca a página mostrada como atual — para quem navega sem recarregar. */
  setPage(page: number): this;
  destroy(): void;
}

/** `string` no select simples, `string[]` no `multiple`, `null` sem valor. */
export type SelectValue = string | string[] | null;
/** Item aceito da busca no servidor: `{ value, label }`, texto solto, ou `{ id, text }` do Select2. */
export type SelectRemoteItem =
  | string
  | number
  | { value?: string | number; id?: string | number; label?: string; text?: string; disabled?: boolean; group?: string | null };
/** Resposta da busca no servidor: a lista, ou `{ results, next }` do DRF. */
export type SelectRemoteResponse = SelectRemoteItem[] | { results: SelectRemoteItem[]; next?: string | boolean | null };
export interface SelectChangeDetail {
  value: SelectValue;
  instance: Select;
}

/** Opcoes de `Select`. Toda opcao e opcional; o padrao vem do codigo. */
export interface SelectOptions {
  /** default: liga a partir de 6 opcoes */
  search?: boolean;
  /** @default 6 */
  searchMinItems?: number;
  /** default: do atributo, da <option value=""> ou setTexts ("Selecione...") */
  placeholder?: string;
  /** default: setTexts ("Buscar...") */
  searchPlaceholder?: string;
  /** default: setTexts ("Nenhum resultado") */
  emptyText?: string;
  /** @default true */
  clearable?: boolean;
  /**
   * limite no modo multiplo
   * @default null
   */
  maxItems?: number | null;
  /**
   * true deixa o campo crescer em varias linhas
   * @default false
   */
  wrapTags?: boolean;
  /** default: true em simples, false em multiplo */
  closeOnSelect?: boolean;
  /** @default 'bottom-start' */
  placement?: Placement;
  /** Onde o menu nasce. Padrao: o `<dialog>` aberto que contem o campo, ou o `<body>`. */
  appendTo?: HTMLElement;
  /**
   * Busca no servidor
   * com url, a lista vem do servidor a cada digitacao
   * @default null
   */
  url?: string | null;
  /**
   * (termo) => Promise<[{value,label,disabled,group}]>
   * @default null
   */
  loadOptions?: ((term: string, context: { signal: AbortSignal; page: number }) => Promise<SelectRemoteResponse>) | null;
  /** @default 'q' */
  queryParam?: string;
  /**
   * paginacao ao rolar; null desliga
   * @default 'page'
   */
  pageParam?: string | null;
  /** @default 1 */
  minChars?: number;
  /** @default 300 */
  debounce?: number;
  /**
   * guarda o resultado de cada termo
   * @default true
   */
  cache?: boolean;
  /** @default 60 */
  cacheSize?: number;
  /**
   * Termo que nao trouxe nada nao e buscado de novo quando so cresce ("lucas" vazio, "lucass" nem pergunta). Serve so para busca por conter o termo.
   * @default false
   */
  shortCircuit?: boolean;
  /** default: setTexts ("Buscando...") */
  loadingText?: string;
  /** default: setTexts ("Falha ao buscar") */
  errorText?: string;
  /** @default null */
  onChange?: ((value: SelectValue, detail: SelectChangeDetail) => void) | null;
}

/**
 * Enriquece um <select> nativo. O elemento original continua no DOM, guardando
 * o valor — entao `name`, `multiple` e `required` seguem funcionando e o Django
 * recebe exatamente o que receberia sem o componente.
 */
export declare class Select {
  constructor(target: string | HTMLSelectElement, options?: SelectOptions);
  /** Opcoes ja mescladas com os padroes. */
  readonly opts: SelectOptions;
  readonly isOpen: boolean;
  readonly native: HTMLSelectElement;
  readonly multiple: boolean;
  getValue(): SelectValue;
  setValue(value: string | number | ReadonlyArray<string | number> | null, options?: SilentOption): void;
  clear(options?: SilentOption): void;
  /**
   * Relê as <option> do select nativo — use depois de trocar as opções por HTMX.
   * É também o que roda no `change` de fora e no reset do formulário: no modo
   * remoto a lista guardada só tinha o que estava escolhido, e o reset que
   * voltava a uma opção fora dela deixava a tela vazia e o POST com valor.
   */
  refresh(): void;
  open(): void;
  close(): void;
  toggle(): void;
  destroy(): void;
}

export type SortDirection = 'asc' | 'desc';
export interface TableSortDetail {
  /** Indice da coluna. */
  column: number;
  /** O `data-field` do cabecalho, ou o indice em texto. */
  field: string;
  direction: SortDirection;
}
export interface TableSelectDetail {
  /** Os `data-id` das linhas marcadas — o que o formulario enviaria. */
  selected: string[];
  row: HTMLTableRowElement;
}

/** Opcoes de `Table`. Toda opcao e opcional; o padrao vem do codigo. */
export interface TableOptions {
  /** @default true */
  sortable?: boolean;
  /**
   * server | client
   * @default 'server'
   */
  sortMode?: 'server' | 'client';
  /** @default 'sort' */
  sortParam?: string;
  /** @default 'dir' */
  dirParam?: string;
  /**
   * coluna de selecao em massa
   * @default false
   */
  selectable?: boolean;
  /** @default 'selected' */
  selectName?: string;
  /**
   * definido, intercepta o clique e cancela a navegacao
   * @default null
   */
  onSort?: ((detail: TableSortDetail, table: Table) => void) | null;
  /** @default null */
  onSelect?: ((detail: TableSelectDetail, table: Table) => void) | null;
}

/** Tabela: ordenar (pelo servidor, por padrao) e marcar linhas em massa. */
export declare class Table {
  constructor(target: string | HTMLTableElement, options?: TableOptions);
  /** Opcoes ja mescladas com os padroes. */
  readonly opts: TableOptions;
  readonly node: HTMLTableElement;
  readonly wrap: HTMLElement;
  readonly rows: HTMLTableRowElement[];
  /** Ordena as linhas visíveis. `type`: text | number | date. */
  sort(index: number, direction?: SortDirection, type?: SortType): this;
  /** Valores marcados — os mesmos que o formulário enviaria. */
  getSelected(): string[];
  clearSelection(): this;
  destroy(): void;
}

export interface TabsChangeDetail {
  /** Indice da aba aberta. */
  value: number;
  tab: HTMLElement | undefined;
  panel: HTMLElement | undefined;
  instance: Tabs;
}

/** Opcoes de `Tabs`. Toda opcao e opcional; o padrao vem do codigo. */
export interface TabsOptions {
  /**
   * indice da aba inicial; sem ele vale a marcada com aria-selected="true", ou a primeira
   * @default null
   */
  selected?: number | null;
  /**
   * setas so movem o foco, e Enter ou Espaco trocam o painel — para painel que carrega por HTMX
   * @default false
   */
  manual?: boolean;
  /**
   * (index, detail) a cada troca feita pela pessoa ou por select()
   * @default null
   */
  onChange?: ((index: number, detail: TabsChangeDetail) => void) | null;
}

/** Abas com os papeis e o teclado do ARIA APG. O template ja traz as classes. */
export declare class Tabs {
  constructor(target: string | HTMLElement, options?: TabsOptions);
  /** Opcoes ja mescladas com os padroes. */
  readonly opts: TabsOptions;
  readonly node: HTMLElement;
  readonly list: HTMLElement;
  readonly tabs: HTMLElement[];
  readonly panels: HTMLElement[];
  readonly index: number;
  select(index: number, options?: SilentOption): this;
  destroy(): void;
}

export type ToastPosition = `${'top' | 'bottom'}-${'start' | 'center' | 'end'}`;
export interface ToastAction {
  text: string;
  onClick?: (toast: Toast) => void;
}
/** Textos do `toast.promise`: fixos, ou funcoes que recebem o resultado ou o erro. */
export interface ToastPromiseMessages<T> extends Omit<ToastOptions, 'type' | 'text'> {
  loading?: string;
  success?: string | ((data: T) => string | null | undefined);
  error?: string | ((error: unknown) => string | null | undefined);
}

/** Opcoes de `Toast`. Toda opcao e opcional; o padrao vem do codigo. */
export interface ToastOptions {
  /**
   * 'info' | 'success' | 'warning' | 'error' | 'loading'
   * @default 'info'
   */
  type?: ToastType;
  /** @default null */
  title?: string | null;
  /** @default '' */
  text?: string;
  /** ms. null nao fecha sozinho. Padrao depende do tipo */
  duration?: number | null;
  /**
   * top-start|top-center|top-end|bottom-start|bottom-center|bottom-end
   * @default 'bottom-end'
   */
  position?: ToastPosition;
  /** @default true */
  closable?: boolean;
  /**
   * { text, onClick }
   * @default null
   */
  action?: ToastAction | null;
  /**
   * toasts simultaneos na mesma posicao
   * @default 4
   */
  max?: number;
}

/** Aviso temporario empilhado num canto da tela. Use o atalho `toast()`. */
export declare class Toast {
  constructor(options?: ToastOptions);
  /** Opcoes ja mescladas com os padroes. */
  readonly opts: ToastOptions;
  readonly node: HTMLElement;
  /**
   * Troca o conteudo sem recriar o toast: e o que faz um "salvando" virar
   * "salvo" no mesmo cartao, sem a pilha reorganizar e sem o olho perder de
   * vista o aviso que ja estava lendo.
   */
  update(options?: ToastOptions): this;
  close(): void;
}

/** Opcoes de `Tooltip`. Toda opcao e opcional; o padrao vem do codigo. */
export interface TooltipOptions {
  /**
   * Texto da dica. Sem ele vale o `title` do elemento.
   * @default ''
   */
  text?: string;
  /** @default 'top-center' */
  placement?: Placement;
  /**
   * atraso ao apontar: evita piscar ao passar o mouse de raspao
   * @default 350
   */
  delay?: number;
  /** @default 120 */
  delayOut?: number;
  /** @default '16rem' */
  maxWidth?: string;
  /**
   * classe extra no balao, para variar a cor num caso so
   * @default ''
   */
  className?: string;
}

/**
 * Dica de texto ancorada a um elemento.
 *
 * Aparece no `hover` e tambem no `focus`: um tooltip que so responde ao mouse
 * nao existe para quem navega por teclado.
 *
 * Em tela de toque nao ha hover, entao o toque abre e o proximo toque fora
 * fecha. Sem isso a dica simplesmente nunca apareceria no celular.
 *
 * `Escape` fecha mesmo com o ponteiro parado em cima, como pede a WCAG 1.4.13.
 */
export declare class Tooltip {
  constructor(target: string | HTMLElement, options?: TooltipOptions);
  /** Opcoes ja mescladas com os padroes. */
  readonly opts: TooltipOptions;
  readonly anchor: HTMLElement;
  readonly panel: HTMLElement;
  readonly isOpen: boolean | undefined;
  setText(text: string): void;
  destroy(): void;
}

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
/** No upload direto, os ids devolvidos pelo servidor; sem `url`, os proprios arquivos. */
export type UploadValue = Array<string | number> | File[];
export interface UploadChangeDetail {
  value: UploadValue;
  files: UploadFile[];
  instance: Upload;
}

/** Opcoes de `Upload`. Toda opcao e opcional; o padrao vem do codigo. */
export interface UploadOptions {
  /**
   * com url: upload direto. sem: os arquivos vao no submit
   * @default null
   */
  url?: string | null;
  /** @default 'POST' */
  method?: string;
  /**
   * nome do campo no FormData do upload direto
   * @default 'file'
   */
  fieldName?: string;
  /**
   * campos extras enviados junto
   * @default {}
   */
  extraData?: Record<string, string | Blob>;
  /** @default {} */
  headers?: Record<string, string>;
  /**
   * manda X-CSRFToken lido do cookie (Django), so para a mesma origem
   * @default true
   */
  csrf?: boolean;
  /**
   * chave do id na resposta JSON
   * @default 'id'
   */
  responseId?: string;
  /**
   * chave da url na resposta JSON
   * @default 'url'
   */
  responseUrl?: string;
  /**
   * se definido, remover chama DELETE aqui
   * @default null
   */
  deleteUrl?: string | null;
  /**
   * '5mb' ou bytes
   * @default null
   */
  maxSize?: string | number | null;
  /** @default null */
  maxFiles?: number | null;
  /**
   * no modo direto, comeca ao soltar
   * @default true
   */
  autoUpload?: boolean;
  locale?: string;
  /**
   * por cima de Tucano.setTexts({ upload }), so nesta instancia
   * @default {}
   */
  texts?: Partial<UploadTexts>;
  /** @default null */
  onChange?: ((value: UploadValue, detail: UploadChangeDetail) => void) | null;
  /** @default null */
  onError?: ((error: Error, file: File) => void) | null;
}

/**
 * Campo de upload.
 *
 * Dois lugares, escolhidos pela presenca de `url`:
 *
 * - Sem `url` — o componente e um campo do formulario. Os arquivos ficam no
 *   <input type="file"> nativo e sobem no submit, entao o servidor recebe em
 *   request.FILES como sempre. Nao ha progresso por arquivo: num submit comum
 *   o navegador envia tudo num bloco so e nao reporta andamento.
 *
 * - Com `url` — cada arquivo sobe na hora, com barra propria, cancelar e
 *   repetir. O formulario posta so os ids devolvidos. Funciona tambem sem
 *   formulario nenhum, como zona de envio solta.
 */
export declare class Upload {
  constructor(target: string | HTMLInputElement, options?: UploadOptions);
  /** Opcoes ja mescladas com os padroes. */
  readonly opts: UploadOptions;
  readonly input: HTMLInputElement;
  readonly multiple: boolean;
  /** Arquivos aceitos, na ordem. No modo direto inclui a resposta do servidor. */
  getFiles(): UploadFile[];
  /** Ids devolvidos pelo servidor (modo direto). E o que o formulario posta. */
  getValue(): UploadValue;
  /** Sobe o que estiver pendente. Util com autoUpload: false. */
  uploadAll(): void;
  clear(): void;
  destroy(): void;
}

/** Opcoes de `Popover`. Toda opcao e opcional; o padrao vem do codigo. */
export interface PopoverOptions {
  /** Lado e alinhamento. @default 'bottom-start' */
  placement?: Placement;
  /** Distancia da ancora, em px. @default 8 */
  offset?: number;
  /** Folga minima das bordas da tela, em px. @default 8 */
  padding?: number;
  /** Onde o painel nasce. Padrao: o `<dialog>` aberto que contem a ancora, ou o `<body>`. */
  appendTo?: HTMLElement;
  /** Painel no minimo da largura da ancora, como o menu do select. */
  matchWidth?: boolean;
  /** Chama `onDismiss('detached')` quando a ancora sai da tela. */
  closeIfDetached?: boolean;
  /** Chama `onDismiss('focus')` quando o foco vai para fora do painel e da ancora. */
  closeOnFocusOut?: boolean;
  /** Pedido de fechar: clique fora, Escape, foco fora ou ancora fora da tela. Quem fecha e voce. */
  onDismiss?: (reason: PopoverDismissReason) => void;
}

/**
 * Posiciona um painel flutuante ancorado num elemento.
 * Escolhe lado com base no espaco disponivel (flip) e desloca no eixo
 * horizontal para nao vazar da viewport (shift). Nao usa dependencia externa.
 */
export declare class Popover {
  constructor(anchor: HTMLElement, panel: HTMLElement, options?: PopoverOptions);
  readonly anchor: HTMLElement;
  readonly panel: HTMLElement;
  readonly open: boolean;
  show(): void;
  /**
   * `animate` mantem o painel no DOM pelo tempo da transicao de saida. Sem
   * isso ele desaparece no mesmo quadro, e so a entrada tem movimento — o
   * fechamento fica seco em comparacao.
   */
  hide(options?: { animate?: boolean }): void;
  destroy(): void;
}

/** Formatos prontos da mascara. Um formato novo acrescentado aqui passa a valer em `data-tuc-mask`. */
export declare const FORMATS: Record<FormatName, MaskFormat> & { [name: string]: MaskFormat | undefined };

/** Caminho SVG de um icone que os componentes usam, para `icon()`. */
export declare const ICON_CHECK: string;

/** Caminho SVG de um icone que os componentes usam, para `icon()`. */
export declare const ICON_COPY: string;

/** Caminho SVG de um icone que os componentes usam, para `icon()`. */
export declare const ICON_X: string;

/**
 * Formata elementos de exibicao: <span data-tuc-format="cpf">12345678901</span>
 * vira 123.456.789-01. Serve para o que ja vem do banco, sem input nenhum.
 */
export declare function autoFormat(scope?: ParentNode): HTMLElement[];

/** Inicializa todo `[data-tuc-accordion]` do escopo que ainda nao foi montado. */
export declare function autoInitAccordions(scope?: ParentNode): Accordion[];

/** Inicializa todo `[data-tuc-color]` do escopo que ainda nao foi montado. */
export declare function autoInitColorPickers(scope?: ParentNode): ColorPicker[];

/**
 * Menu escrito no template, como o do dropdown — o caminho quando os itens vêm
 * do servidor:
 *
 *   <table data-tuc-contextmenu="#acoes-linha" data-match="tbody tr">…</table>
 *   <div class="tuc-dropdown" id="acoes-linha" hidden>
 *     <button class="tuc-dropdown__item">Editar</button>
 *   </div>
 */
export declare function autoInitContextMenus(scope?: ParentNode): ContextMenu[];

/**
 * Inicializa todo [data-tuc-datepicker] do escopo. Opcoes vem de data-attributes:
 * data-mode, data-time, data-min, data-max, data-months, data-locale, data-format...
 */
export declare function autoInitDatePickers(scope?: ParentNode): DatePicker<DatePickerMode>[];

/**
 * Gavetas escritas no template — o caminho quando o conteudo vem do servidor:
 *
 *   <dialog class="tuc-drawer is-right" id="filtros"> ... </dialog>
 *   <button data-tuc-drawer="#filtros">Filtros</button>
 */
export declare function autoInitDrawers(scope?: ParentNode): Drawer[];

/**
 * Menus escritos no template — o caminho quando os itens vêm do servidor:
 *
 *   <button data-tuc-dropdown="#acoes">Ações</button>
 *   <div class="tuc-dropdown" id="acoes" hidden>
 *     <button class="tuc-dropdown__item">Editar</button>
 *   </div>
 */
export declare function autoInitDropdowns(scope?: ParentNode): Dropdown[];

/** Inicializa todo `[data-tuc-editor]` do escopo que ainda nao foi montado. */
export declare function autoInitEditors(scope?: ParentNode): Editor[];

/** Inicializa todo `[data-tuc-mask], [data-tuc-reveal]`, `[data-tuc-format]:not([data-tuc-formatted])` do escopo que ainda nao foi montado. */
export declare function autoInitMasks(scope?: ParentNode): Mask[];

/**
 * Modais escritos no template — util quando o conteudo vem renderizado pelo
 * servidor, como um form do Django:
 *
 *   <dialog class="tuc-modal is-md" id="excluir"> ... </dialog>
 *   <button data-tuc-modal="#excluir">Excluir</button>
 */
export declare function autoInitModals(scope?: ParentNode): Modal[];

/**
 * Do template, com os números que o Paginator do Django já tem:
 *
 *   <div data-tuc-pagination
 *        data-page="{{ page_obj.number }}"
 *        data-pages="{{ page_obj.paginator.num_pages }}"></div>
 */
export declare function autoInitPagination(scope?: ParentNode): Pagination[];

/**
 * Pinta os blocos de codigo do conteudo ja publicado.
 *
 * O que foi salvo e texto puro dentro de <pre><code>, porque cor nao e
 * conteudo. Aqui ela e reposta na hora de exibir — e so do lado de quem le.
 * Roda sozinho pelo init(), inclusive no que chegar depois por HTMX.
 */
export declare function autoInitProse(scope?: ParentNode): HTMLElement[];

/** Inicializa todo `select[data-tuc-select]` do escopo que ainda nao foi montado. */
export declare function autoInitSelects(scope?: ParentNode): Select[];

/**
 * Tabelas escritas no template — o caminho normal num projeto Django:
 *
 *   <table data-tuc-table data-selectable>
 *     <thead><tr><th data-sort="text" data-field="nome">Nome</th></tr></thead>
 *     <tbody><tr data-id="12"><td>Ana</td></tr></tbody>
 *   </table>
 *
 * O cabecalho vira link para ?sort=nome&dir=asc. Numa tabela pequena e sem
 * paginacao, `data-sort-mode="client"` ordena na propria tela.
 */
export declare function autoInitTables(scope?: ParentNode): Table[];

/** Inicializa todo `[data-tuc-tabs]` do escopo que ainda nao foi montado. */
export declare function autoInitTabs(scope?: ParentNode): Tabs[];

/**
 * Converte mensagens ja renderizadas em toast — a saida do framework de
 * messages do Django entra direto, sem escrever JavaScript:
 *
 *   {% for m in messages %}
 *     <div data-tuc-toast data-type="{{ m.tags }}">{{ m }}</div>
 *   {% endfor %}
 */
export declare function autoInitToasts(scope?: ParentNode): Toast[];

/** Inicializa todo `[data-tuc-tip]` do escopo que ainda nao foi montado. */
export declare function autoInitTooltips(scope?: ParentNode): Tooltip[];

/** Inicializa todo `input[type=file][data-tuc-upload]` do escopo que ainda nao foi montado. */
export declare function autoInitUploads(scope?: ParentNode): Upload[];

/** `Tucano.color`: o modulo que os componentes usam por dentro, exposto como utilitario. */
export declare namespace color {
  function clamp(value: number, min: number, max: number): number;
  /** h em graus [0,360); s, v e a em [0,1]. */
  function hsvToRgb(hsv: HSV): RGB;
  function rgbToHsv(rgb: RGB): HSV;
  function rgbToHex(rgb: RGB, alpha?: number): string;
  /**
   * Le hex (#rgb, #rgba, #rrggbb, #rrggbbaa), rgb()/rgba() e hsl()/hsla().
   * Devolve { h, s, v, a } ou null.
   */
  function parseColor(input: string | null | undefined): HSVA | null;
  /** Serializa no formato pedido: 'hex', 'rgb' ou 'hsl'. */
  function formatColor(hsva: HSVA, format?: ColorFormat): string;
  function hsvToHsl(hsv: HSV): HSL;
  /**
   * Luminancia relativa (WCAG). Serve para escolher texto claro ou escuro por
   * cima da cor — o olho nao le luminosidade como media aritmetica dos canais.
   */
  function luminance(rgb: RGB): number;
  /**
   * Aceita string ou o objeto hsva. Por dentro sempre chega hsva, mas quem usa
   * `Tucano.color.isDark('#4f46e5')` para escolher texto claro ou escuro sobre
   * uma cor tem a string na mao — e exigir a conversao antes so passava o
   * trabalho adiante.
   */
  function isDark(color: string | HSVA): boolean;
}

/**
 * Confirmacao que devolve promessa — o caso mais comum de modal num CRUD:
 *
 *   if (await Tucano.confirm({ title: 'Excluir contrato?' })) remove();
 */
export declare function confirm(options?: ConfirmOptions): Promise<boolean>;

/** `Tucano.dates`: o modulo que os componentes usam por dentro, exposto como utilitario. */
export declare namespace dates {
  const MS_DAY: number;
  /** Novo Date normalizado para 00:00:00 local. */
  function startOfDay(date: Date | string | number): Date;
  function isValid(date: unknown): date is Date;
  function clone(date: Date): Date;
  function addDays(date: Date, n: number): Date;
  function addMonths(date: Date, n: number): Date;
  function addYears(date: Date, n: number): Date;
  function daysInMonth(year: number, month: number): number;
  function startOfMonth(date: Date): Date;
  function endOfMonth(date: Date): Date;
  /** Compara apenas ano/mes/dia. Retorna -1, 0 ou 1. */
  function compareDay(a: Date, b: Date): -1 | 0 | 1;
  function isSameDay(a: Date | null | undefined, b: Date | null | undefined): boolean;
  function isSameMonth(a: Date | null | undefined, b: Date | null | undefined): boolean;
  function isBetween(date: Date, start: Date, end: Date): boolean;
  function clampDate(date: Date, min?: Date | null, max?: Date | null): Date;
  /** Copia hora/minuto/segundo de `time` para o dia de `day`. */
  function withTime(day: Date, time: Date): Date;
  /**
   * Grade de 6 semanas (42 celulas) cobrindo o mes, sempre do mesmo tamanho
   * para o calendario nao "pular de altura" ao trocar de mes.
   */
  function buildMonthGrid(year: number, month: number, firstDayOfWeek?: number): Array<{ date: Date; outside: boolean }>;
  /** Nomes de mes/dia e primeiro dia da semana para um locale, memoizados. */
  function getLocaleData(locale: string): LocaleData;
  /**
   * Formata via tokens. Suporta: yyyy yy MMMM MMM MM M dd d EEEE EEE HH H mm ss a
   * Texto entre aspas simples e literal: "'de' MMMM".
   */
  function format(date: Date | null | undefined, pattern: string, locale?: string): string;
  /** ISO local (sem timezone) — o formato que o Django espera em DateField/DateTimeField. */
  function toISODate(date: Date | null | undefined): string;
  function toISODateTime(date: Date | null | undefined, seconds?: boolean): string;
  /**
   * Le "yyyy-mm-dd" e "yyyy-mm-ddTHH:MM[:SS]", ou um Date. So ISO: o fallback para
   * `new Date(texto)` lia "07/09/2026" no formato americano, e 7 de setembro virava
   * 9 de julho num campo em portugues. Texto no formato do idioma e com
   * parseUserInput.
   */
  function parseISO(value: string | Date | null | undefined): Date | null;
  /**
   * Parse tolerante do que o usuario digita: aceita 25/12/2025, 25-12-2025,
   * 25122025 e 2512 (ano corrente), respeitando a ordem dia/mes do locale.
   */
  function parseUserInput(text: string | null | undefined, locale?: string, reference?: Date): (Date & { hasTime: boolean }) | null;
  /** Descobre se o locale escreve mes antes do dia (en-US) ou dia antes (pt-BR). */
  function isMonthFirst(locale: string): boolean;
  /** Padrao numerico do locale, usado como formato de exibicao default. */
  function localeDatePattern(locale: string): 'MM/dd/yyyy' | 'dd/MM/yyyy';
}

/** Atalho: cria e abre num passo. */
export declare function drawer(optionsOrText: string | DrawerOptions, extra?: DrawerOptions): Drawer;

/** Copia dos textos atuais, por grupo. Serve de ponto de partida e para restaurar. */
export declare function getTexts(): TucanoTexts;

/** Recebe codigo cru e devolve HTML com as marcacoes de cor. */
export declare function highlight(code: string | null | undefined): string;

/** Icone inline como <svg>. Evita depender de icon font ou sprite externo. */
export declare function icon(path: string, size?: number): SVGSVGElement;

/**
 * Deixa o servidor disparar um toast pelo cabecalho HX-Trigger do HTMX:
 *
 *   return HttpResponse(headers={"HX-Trigger": json.dumps(
 *       {"tucano:toast": {"type": "success", "text": "Salvo"}})})
 */
export declare function listenForEvents(): void;

/** `Tucano.mask`: o modulo que os componentes usam por dentro, exposto como utilitario. */
export declare namespace mask {
  function isPlaceholder(char: string): boolean;
  /** So os caracteres que podem ocupar um marcador do gabarito. */
  function clear(value: unknown, template: string): string;
  /**
   * Placeholder a partir do gabarito: `###.###.###-##` vira `000.000.000-00`.
   *
   * Existe porque escrever o placeholder a mao em cada campo e trabalho que a
   * biblioteca ja tem como fazer — e trabalho que se esquece: a pagina de
   * exemplos tinha cinco campos com placeholder e um sem, justamente o de
   * CPF/CNPJ. Com dois gabaritos (o campo aceita os dois), vale o primeiro, que
   * e o formato com que o campo comeca.
   */
  function placeholderFromTemplate(template: string | string[]): string;
  function capacity(template: string): number;
  /**
   * Distribui os caracteres pelo gabarito. O literal seguinte entra assim que o
   * grupo anterior fecha, para o usuario nao precisar digita-lo.
   */
  function apply(chars: string, template: string): string;
  /** Posicao do cursor logo apos o n-esimo caractere preenchido. */
  function cursorAfter(text: string, n: number): number;
  /**
   * Escolhe o gabarito pelo tamanho do conteudo — telefone com 8 ou 9 digitos,
   * documento que pode ser CPF ou CNPJ.
   */
  function pickTemplate(chars: ArrayLike<string>, templates: string | string[]): string;
  /**
   * Moeda enche da direita para a esquerda: digitar 1 2 3 vira 1,23 e depois
   * 12,34. E como todo campo de valor se comporta, e o contrario do resto.
   */
  function applyCurrency(digits: string | number, options?: CurrencyOptions): string;
  function validateCPF(value: string | number | null | undefined): boolean;
  /**
   * CNPJ, numerico ou alfanumerico.
   *
   * O novo formato mantem 14 posicoes e a mesma mascara: as 12 primeiras podem
   * ser letras ou digitos, as 2 ultimas continuam numericas. No calculo, cada
   * caractere vale o codigo ASCII menos 48 — assim '0' segue valendo 0 e o
   * algoritmo antigo continua valendo para CNPJ so de numeros.
   */
  function validateCNPJ(value: string | number | null | undefined): boolean;
  /** Aceita os dois, decidindo pelo tamanho. */
  function validateCpfCnpj(value: string | number | null | undefined): boolean;
  /**
   * Formata um valor pronto, para mostrar — nao para editar.
   *
   * Serve para o que ja vem do banco: um CPF em `12345678901` vira
   * `123.456.789-01` sem precisar de input nenhum.
   */
  function format(value: string | number | null | undefined, format: FormatName | (string & {}) | string[], options?: CurrencyOptions): string;
  /**
   * *-##'],
   * phone: ['(##) ####-####', '(##) #####-####'],
   * mobile: '(##) #####-####',
   * cep: '#####-###',
   * card: '#### #### #### ####',
   * };
   *
   * const DOT = '\u2022';
   *
   * /**
   * Esconde o conteudo. Os separadores ficam, para a forma continuar
   * reconhecivel: `123.456.789-01` vira `•••.•••.•••-01`.
   *
   * modo:
   *   'end'   (padrao) deixa os ultimos `visible` caracteres a mostra
   *   'email' deixa a primeira letra e o dominio: `j•••@empresa.com.br`
   *   'all'   esconde tudo — para senha, token e chave
   */
  function maskMiddle(text: string | null | undefined, visible?: number, mode?: RevealMode): string;
  /**
   * E-mail esconde ao contrario do resto: o dominio e o que ajuda a reconhecer a
   * conta, e a parte local e o que identifica a pessoa. Guardar o fim, como no
   * padrao, revelaria `om.br` e esconderia justamente o util.
   */
  function maskEmail(value: string | null | undefined): string;
}

/** Atalho: cria e abre num passo. */
export declare function modal(optionsOrText: string | ModalOptions, extra?: ModalOptions): Modal;

/** Quais numeros aparecem: pontas, a atual e a vizinhanca; `null` onde entra a reticencia. */
export declare function pageWindow(page: number, pages: number, options?: { around?: number; edges?: number }): Array<number | null>;

/** Atalho: devolve o elemento pronto para inserir. */
export declare function pagination(options?: PaginationOptions): HTMLElement;

/** Devolve HTML com apenas as tags e atributos que aceitamos. */
export declare function sanitize(html: string | null | undefined): string;

/**
 * Troca textos dos componentes, por grupo: `setTexts({ datepicker: { clear:
 * 'Clear' } })`. Mescla chave a chave dentro do grupo, entao o que nao foi
 * passado continua como estava. Vale para o que for montado depois.
 */
export declare function setTexts(texts?: TucanoTextsInput): void;

export interface ToastFunction {
  /** Atalho: Tucano.toast('Salvo') ou Tucano.toast({ type:'error', text:'...' }). */
  (text: string, extra?: ToastOptions): Toast;
  /** Atalho: Tucano.toast('Salvo') ou Tucano.toast({ type:'error', text:'...' }). */
  (options: ToastOptions, extra?: ToastOptions): Toast;
  /** Atalho de `toast({ type: 'info', text })`. */
  info(text: string, extra?: ToastOptions): Toast;
  /** Atalho de `toast({ type: 'success', text })`. */
  success(text: string, extra?: ToastOptions): Toast;
  /** Atalho de `toast({ type: 'warning', text })`. */
  warning(text: string, extra?: ToastOptions): Toast;
  /** Atalho de `toast({ type: 'error', text })`. */
  error(text: string, extra?: ToastOptions): Toast;
  /** Toast de carregando: nao fecha sozinho. Troque com `update()`. */
  loading(text: string, extra?: ToastOptions): Toast;
  /** Acompanha uma promessa num toast so: carregando, depois sucesso ou erro. Devolve a promessa recebida. */
  promise<P>(promise: P, messages?: ToastPromiseMessages<Awaited<P>>): P;
}
/** Atalho: Tucano.toast('Salvo') ou Tucano.toast({ type:'error', text:'...' }). */
export declare const toast: ToastFunction;

/** O que `init()` devolve: as instancias criadas por tipo de componente. */
export interface InitResult {
  datepickers: DatePicker<DatePickerMode>[];
  selects: Select[];
  colorpickers: ColorPicker[];
  uploads: Upload[];
  masks: Mask[];
  formatted: HTMLElement[];
  toasts: Toast[];
  modals: Modal[];
  drawers: Drawer[];
  accordions: Accordion[];
  tabs: Tabs[];
  dropdowns: Dropdown[];
  contextMenus: ContextMenu[];
  tables: Table[];
  pagination: Pagination[];
  editors: Editor[];
  prose: HTMLElement[];
  tooltips: Tooltip[];
}
/** Inicializa todos os componentes marcados por data-attribute no escopo dado. */
export declare function init(scope?: ParentNode): InitResult;

/**
 * Eventos da Tucano, com o `detail` tipado. Entram no mapa de eventos de
 * `Element`, `HTMLElement`, `Document` e `Window`, entao `addEventListener` ja sabe o tipo.
 */
export interface TucanoEventMap {
  /** Valor novo em date picker, select, color picker, upload, mascara ou abas. Borbulha. */
  'tucano:change': CustomEvent<ColorPickerChangeDetail | DatePickerChangeDetail | MaskChangeDetail | SelectChangeDetail | TabsChangeDetail | UploadChangeDetail>;
  /** Clique num cabecalho ordenavel da tabela. Borbulha. */
  'tucano:sort': CustomEvent<TableSortDetail>;
  /** Linha marcada ou desmarcada na tabela. Borbulha. */
  'tucano:select': CustomEvent<TableSelectDetail>;
  /** O toast saiu da tela. Disparado no proprio elemento do toast, sem borbulhar. */
  'tucano:toast-closed': CustomEvent<null>;
  /** Abre um toast. Disparado no `<body>` pelo cabecalho `HX-Trigger` do HTMX, depois de `listenForEvents()`. */
  'tucano:toast': CustomEvent<ToastOptions | string>;
}

declare global {
  interface ElementEventMap extends TucanoEventMap {}
  interface DocumentEventMap extends TucanoEventMap {}
  interface WindowEventMap extends TucanoEventMap {}
}
