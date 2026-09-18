/*
 * Uso da Tucano por import, como faz quem empacota. O test:types compila este
 * arquivo com `tsc --noEmit --strict`: o uso certo precisa passar, e cada
 * `@ts-expect-error` precisa de fato dar erro. Se um tipo virar `any` calado, o
 * erro esperado some e o proprio tsc acusa a diretiva sem uso.
 *
 * O import e por nome de pacote, `tucano`, e nao por caminho: assim o teste passa
 * pelo `exports` do package.json, que e o que quem instala recebe.
 */
import {
  Accordion, ColorPicker, DatePicker, Drawer, Dropdown, Editor, FORMATS, ICON_X, Mask, Modal, Pagination,
  Popover, Select, Table, Tabs, Toast, Tooltip, Upload, color, confirm, dates, drawer, getTexts, highlight,
  icon, init, mask, modal, pageWindow, pagination, sanitize, setTexts, toast,
  type DateRange, type SelectValue, type TucanoTexts,
} from 'tucano';
import 'tucano/auto';

/* Igualdade exata: `any` nao passa por ela, ao contrario de uma atribuicao. */
type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
const is = <T>() => <U>(_value: U, ..._exact: Equals<T, U> extends true ? [] : [never]) => {};

/* ---------------------------------------------------------------- */
/* Date picker: o modo decide o que getValue devolve                 */

const single = new DatePicker('#entrega', {
  time: true,
  min: '2026-01-01',
  disabledDates: (d) => d.getDay() === 0,
  onChange: (value, { iso, instance }) => {
    is<Date | null>()(value);
    is<string>()(iso);
    instance.close({ restoreFocus: false });
  },
});
is<Date | null>()(single.getValue());
single.setValue('07/09/2026', { silent: true });

const range = new DatePicker('#periodo', { mode: 'range', presets: true, native: 'auto' });
is<DateRange>()(range.getValue());
range.setValue({ start: '2026-03-01', end: new Date() });
range.setValue(['2026-03-01', '2026-03-15']);

// @ts-expect-error opcao que nao existe (saiu na 0.34)
new DatePicker('#x', { openOnFocus: true });
// @ts-expect-error mode aceita so 'single' ou 'range'
new DatePicker('#x', { mode: 'multiple' });
// @ts-expect-error metodo que nao existe
single.show();
// @ts-expect-error periodo nao cabe no modo simples
single.setValue({ start: '2026-03-01', end: '2026-03-15' });

/* ---------------------------------------------------------------- */
/* Select                                                            */

const select = new Select(document.querySelector('select')!, {
  url: '/api/cidades',
  pageParam: null,
  loadOptions: async (term, { signal, page }) => {
    signal.throwIfAborted();
    return { results: [{ id: page, text: term }], next: null };
  },
  onChange: (value) => (Array.isArray(value) ? value.join() : value),
});
is<SelectValue>()(select.getValue());
select.setValue(['sp', 'rj']);
select.refresh();

// @ts-expect-error pageParam e texto ou null
new Select('#s', { pageParam: 2 });

/* ---------------------------------------------------------------- */
/* Eventos no DOM                                                    */

document.addEventListener('tucano:change', (e) => {
  is<CustomEvent>()(e as CustomEvent);
  void e.detail.value;
  void e.detail.instance;
});
document.querySelector('table')!.addEventListener('tucano:sort', (e) => {
  is<'asc' | 'desc'>()(e.detail.direction);
  // @ts-expect-error o detail do sort tem direction, nao dir
  void e.detail.dir;
});
window.addEventListener('tucano:select', (e) => e.detail.selected.length);
document.createElement('input').addEventListener('tucano:change', (e) => {
  // @ts-expect-error nenhum componente manda essa propriedade no detail
  void e.detail.nope;
});

/* ---------------------------------------------------------------- */
/* Toast, modal, gaveta                                              */

const saved = toast('Salvo');
toast.success('Pronto', { position: 'top-end' }).update({ type: 'error', text: 'Falhou' }).close();
saved.node.addEventListener('tucano:toast-closed', (e) => is<null>()(e.detail));
const upload: Promise<Response> = toast.promise(fetch('/x'), {
  loading: 'Enviando...',
  success: (r) => `Enviado (${r.status})`,
});
void upload;

// @ts-expect-error tipo de toast que nao existe
toast({ type: 'fatal', text: 'x' });
// @ts-expect-error posicao que nao existe
new Toast({ position: 'middle' });

const answer: Promise<boolean> = confirm({ title: 'Excluir contrato?', confirm: 'Excluir', tone: 'danger' });
void answer;
modal({ title: 'Oi', actions: [{ text: 'Ok', variant: 'primary', onClick: (m) => m.close('action') }] })
  .content([document.createElement('form'), 'texto', null]);
drawer('Filtros', { side: 'left', size: 'lg', onClose: (reason) => is<'api' | 'escape' | 'backdrop' | 'button' | 'action'>()(reason) });
new Drawer({ title: 'x' }).open().node.showModal();

// @ts-expect-error motivo de fechar que nao existe
new Modal().close('fundo');
// @ts-expect-error variante de botao que nao existe
modal({ actions: [{ text: 'x', variant: 'huge' }] });

/* ---------------------------------------------------------------- */
/* Textos                                                            */

setTexts({
  datepicker: { clear: 'Clear', placeholderLetters: 'ymdhms' },
  select: { typeToSearch: (n) => `Type ${n.toFixed()} more` },
});
const texts: TucanoTexts = getTexts();
is<string>()(texts.upload.large('5 MB'));

// @ts-expect-error chave que nao existe no grupo
setTexts({ datepicker: { limpar: 'Clear' } });
// @ts-expect-error grupo que nao existe
setTexts({ calendario: {} });
// @ts-expect-error texto que e funcao nao aceita numero
setTexts({ upload: { others: 3 } });

/* ---------------------------------------------------------------- */
/* Utilitarios                                                       */

is<boolean>()(mask.validateCpfCnpj('123.456.789-01'));
is<string>()(mask.format('12345678901', 'cpf'));
is<Date | null>()(dates.parseISO('2026-01-01'));
is<boolean>()(color.isDark('#4f46e5'));
const hsva = color.parseColor('#fff');
if (hsva) color.formatColor(hsva, 'hsl');
is<string | string[] | undefined>()(FORMATS.cpf.template);
sanitize('<b>x</b>').trim();
highlight('const a = 1').trim();
icon(ICON_X, 14).setAttribute('class', 'x');
pageWindow(3, 10, { around: 2 }).map((n) => n ?? '…');

// @ts-expect-error formato de cor que nao existe
color.formatColor({ h: 0, s: 0, v: 0, a: 1 }, 'cmyk');
// @ts-expect-error modo de ocultar que nao existe
new Mask('#x', { revealMode: 'middle' });

/* ---------------------------------------------------------------- */
/* Os demais componentes                                             */

const result = init(document);
is<DatePicker<'single' | 'range'>[]>()(result.datepickers);
result.tables[0]?.sort(1, 'desc', 'number');

new Mask('#cpf', { format: 'cpf', validate: true, onChange: (_v, { raw, number }) => `${raw}${number ?? ''}` }).getRaw();
new Editor('#bio', { toolbar: ['bold', 'link', 'table'] }).apply('bold').inTable('rowBelow').getValue();
new Tabs('#abas', { onChange: (index, { tab }) => { tab?.focus(); return index; } }).select(1, { silent: true });
new Table('table', { selectable: true, onSort: ({ field, direction }) => `${field} ${direction}` }).clearSelection();
new Accordion('#faq', { single: true }).items.forEach((d) => d.open);
new Dropdown('#menu', { items: [{ text: 'Editar', onClick: (d) => d.close() }, { separator: true }, { label: 'Perigo' }] });
new Upload('input[type=file]', {
  url: '/upload',
  maxSize: '5mb',
  texts: { drop: 'Solte' },
  onError: (error, file) => `${error.message} ${file.name}`,
}).getFiles()[0]?.status;
new Tooltip('#ajuda', { text: 'Ajuda', placement: 'right-center' }).setText('Outra');
new ColorPicker('#cor', { format: 'rgb', swatches: false }).getRgb()?.a;   // null enquanto ninguem escolheu
new Pagination({ page: 2, pages: 10, onChange: (page, instance) => { instance.setPage(page); } }).render();
pagination({ page: 1, pages: 3 }).append('x');
new Popover(document.body, document.createElement('div'), {
  placement: 'top-end',
  onDismiss: (reason) => is<'outside' | 'escape' | 'focus' | 'detached'>()(reason),
}).show();

// @ts-expect-error botao que o editor nao tem
new Editor('#bio', { toolbar: ['strike'] });
// @ts-expect-error lado de painel que nao existe
new Tooltip('#ajuda', { placement: 'middle' });
// @ts-expect-error a paginacao nao recebe alvo
new Pagination('#paginas');
