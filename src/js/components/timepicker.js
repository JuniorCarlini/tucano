import { clone, isValid, toISODateTime } from '../core/dates.js';
import { omitUndefined } from '../core/dom.js';
import { TIMEPICKER_TEXTS as T } from '../core/texts.js';
import { DatePicker } from './datepicker.js';

/*
 * Campo so de hora.
 *
 * E o date picker sem calendario: as colunas de hora, minuto e segundo, o
 * teclado delas, a mascara, o Aplicar, o modo nativo e o estado de espera ja
 * moravam la. Herdar em vez de copiar foi de proposito, como no menu do botao
 * direito — as duas colunas de hora da biblioteca nunca ficarao diferentes.
 *
 * Por dentro o valor continua sendo Date, num dia fixo, para a mae comparar e
 * formatar como sempre. Por fora sai como o `<input type="time">` posta:
 * `14:30`, ou `14:30:15` com segundos — o que o TimeField do Django le.
 */

const DEFAULTS = {
  mode: 'single',        // 'single' | 'range' (inicio e fim lado a lado)
  seconds: false,
  minuteStep: 5,
  locale: undefined,     // default: locale do documento/navegador; decide 24 h ou AM/PM
  min: null,             // '08:00': as horas antes ficam desativadas nas colunas
  max: null,             // '18:00'
  autoApply: false,      // true: cada clique numa coluna ja vale, sem o Aplicar
  clearable: true,
  now: false,            // botao "Agora" no rodape: aplica a hora atual e fecha. Opt-in
  placement: 'bottom-center',
  appendTo: undefined,
  isoName: undefined,    // name do input hidden com o valor HH:MM
  native: false,         // true ou 'auto': o seletor de hora do sistema no celular
  onChange: null,
  onOpen: null,
  onClose: null,
};

/*
 * O dia em que toda hora mora. Um 1o de janeiro nao e virada de horario de
 * verao em fuso nenhum, entao todo horario existe nele.
 */
const day = (h = 0, m = 0, s = 0) => new Date(2000, 0, 1, h, m, s);

/**
 * Hora em texto ou Date, num Date do dia fixo; null se nao for hora. Aceita
 * 14:30, 1430, 14h30, 14h, 2:30 PM e a hora de um ISO com data.
 */
function toTime(value) {
  if (value instanceof Date) return isValid(value) ? day(value.getHours(), value.getMinutes(), value.getSeconds()) : null;
  const m = /^(\d{1,2})(?:[:h.]?(\d{2}))?(?:[:.]?(\d{2}))?h?\s*(?:([ap])\.?\s*m?\.?)?$/i
    .exec(String(value ?? '').trim().replace(/^\d{4}-\d{2}-\d{2}[T ]/, ''));
  if (!m) return null;
  let h = +m[1];
  if (m[4]) {
    if (h < 1 || h > 12) return null;
    h = (h % 12) + (m[4].toLowerCase() === 'p' ? 12 : 0);
  }
  const [min, sec] = [+(m[2] || 0), +(m[3] || 0)];
  return h < 24 && min < 60 && sec < 60 ? day(h, min, sec) : null;
}

export class TimePicker extends DatePicker {
  constructor(target, options = {}) {
    const opts = { ...DEFAULTS, ...omitUndefined(options) };
    // Sem meses o painel da mae desenha so as colunas; min e max chegam como Date.
    // O "Agora" mora no lugar do "Hoje" da mae, no mesmo rodape.
    super(target, { ...opts, time: true, months: 0, today: opts.now, min: toTime(opts.min), max: toTime(opts.max) });
  }

  /** `'14:30'` ou `null`; no intervalo, `{ start, end }` com cada ponta assim. */
  getValue() {
    const time = (d) => this._nativeValue(d) || null;
    return this.isRange ? { start: time(this.start), end: time(this.end) } : time(this.start);
  }

  _buildPanel() {
    super._buildPanel();
    this.panel.classList.add('is-time');
    this.panel.setAttribute('aria-label', this.isRange ? T.dialogRange : T.dialog);
  }

  _setupNative() {
    super._setupNative();
    this.overlay.type = 'time';
    // A mae pos o limite no fim do dia, que aqui nao quer dizer nada.
    if (this.opts.max) this.overlay.max = this._nativeValue(this.opts.max);
  }

  _toDate(value) {
    return toTime(value);
  }

  _typed(text) {
    return this._normalize(toTime(text));
  }

  /* O par que o proprio campo posta vem separado por virgula. */
  _readValue(raw) {
    super._readValue(this.isRange && raw ? String(raw).replace(',', ' – ') : raw);
  }

  _isDisabled(date) {
    const { min, max } = this.opts;
    return Boolean((min && date < min) || (max && date > max));
  }

  _displayFormat() {
    return this._timeFormat();
  }

  _nativeValue(date = this.start) {
    return isValid(date) ? toISODateTime(date, this.opts.seconds).slice(11) : '';
  }

  /*
   * Sem dia a escolher antes, a coluna e quem cria o valor: o primeiro clique
   * parte de meia-noite, ou do `min`. Passar do limite (18 h com 30 min, e
   * maximo 18:00) encosta no limite, e no intervalo a outra ponta acompanha em
   * vez de desfazer o que acabou de ser escolhido.
   */
  _setTime(which, unit, value) {
    const { min, max } = this.opts;
    const d = clone(this[which] || min || day());
    if (unit === 'h') d.setHours(value);
    if (unit === 'm') d.setMinutes(value);
    if (unit === 's') d.setSeconds(value);
    this[which] = this._isDisabled(d) ? clone(min && d < min ? min : max) : d;
    if (this.isRange && this.start && this.end && this.start > this.end) {
      this[which === 'start' ? 'end' : 'start'] = clone(this[which]);
    }
    this._picked(false);
  }

  /*
   * Desativa o que fica inteiro fora de min/max: a hora 7 com minimo 08:00, e
   * na hora 8 os minutos antes do minimo. A parada de Tab vai para o primeiro
   * item que sobrou, senao a coluna ficaria fora do teclado.
   */
  _renderTimeList(which, unit, count, step, current) {
    const list = super._renderTimeList(which, unit, count, step, current);
    const { min, max } = this.opts;
    const base = this[which] || min || day();
    for (const item of list.children) {
      const v = +item.textContent;
      const from = clone(base);
      const to = clone(base);
      if (unit === 'h') { from.setHours(v, 0, 0); to.setHours(v, 59, 59); }
      if (unit === 'm') { from.setMinutes(v, 0); to.setMinutes(v, 59); }
      if (unit === 's') { from.setSeconds(v); to.setSeconds(v); }
      item.disabled = Boolean((min && to < min) || (max && from > max));
    }
    const stop = list.querySelector('[tabindex="0"]');
    if (stop?.disabled) {
      stop.tabIndex = -1;
      const first = list.querySelector(':enabled');
      if (first) first.tabIndex = 0;
    }
    return list;
  }

  /*
   * Coluna ainda sem escolha abre na parada de Tab: com min 08:00 ela abria no
   * 00, desativado, e as horas que valem ficavam fora de vista. So quando a
   * coluna esta no topo, para nao desfazer a rolagem de quem ja rolou.
   */
  _revealTimes() {
    super._revealTimes();
    for (const list of this.panel.querySelectorAll('.tuc-dp__timelist')) {
      const stop = list.querySelector('[tabindex="0"]');
      if (!list.scrollTop && stop && !list.querySelector('.is-selected')) list.scrollTop = stop.offsetTop - list.offsetTop;
    }
  }

  /*
   * A hora de agora, para baixo no degrau dos minutos: as 14:37 com degrau 5,
   * 14:35, que e o que a coluna marca. Arredondar para cima passaria de 23:59
   * para o dia seguinte. null quando agora esta fora de min/max.
   */
  _now() {
    const n = new Date();
    const step = this.opts.minuteStep;
    return this._normalize(day(n.getHours(), Math.floor(n.getMinutes() / step) * step, this.opts.seconds ? n.getSeconds() : 0));
  }

  _renderFooter() {
    const footer = super._renderFooter();
    const button = footer.querySelector('[data-key="today"]');
    if (button) {
      button.textContent = T.now;
      button.disabled = !this._now();
    }
    return footer;
  }

  /*
   * Agora e um atalho, e atalho nao pede confirmacao: aplica e fecha mesmo com
   * o Aplicar ligado. Quem quer ajustar o minuto depois reabre o painel ja na
   * hora certa. No intervalo, agora e o inicio; o fim so acompanha se ficou
   * para tras.
   */
  _pickToday() {
    const now = this._now();
    if (!now) return;
    this.start = now;
    if (this.isRange && (!this.end || this.end < now)) this.end = clone(now);
    this._commit();
    this.close();
  }

  /* Abrir pelo teclado leva o foco a coluna das horas, no lugar da grade de dias. */
  _focusGrid() {
    this.panel.querySelector('.tuc-dp__timeitem[tabindex="0"]')?.focus();
  }
}

/**
 * Inicializa todo [data-tuc-timepicker] do escopo. Opcoes vem de data-attributes:
 * data-mode, data-seconds, data-minute-step, data-min, data-max, data-locale...
 */
export function autoInit(scope = document) {
  const out = [];
  for (const node of scope.querySelectorAll('[data-tuc-timepicker]:not([data-tuc-ready])')) {
    const d = node.dataset;
    node.setAttribute('data-tuc-ready', '');
    out.push(new TimePicker(node, {
      mode: d.mode || undefined,
      seconds: d.seconds === 'true' || d.seconds === '',
      minuteStep: d.minuteStep ? +d.minuteStep : undefined,
      locale: d.locale || undefined,
      min: d.min || null,
      max: d.max || null,
      autoApply: d.autoApply === 'true' ? true : undefined,
      now: d.now === 'true',
      isoName: d.isoName || undefined,
      placement: d.placement || undefined,
      native: d.native === 'auto' ? 'auto' : d.native === 'true',
    }));
  }
  return out;
}
