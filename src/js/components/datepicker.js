import {
  addDays, addMonths, addYears, buildMonthGrid, clampDate, clone, compareDay,
  format, getLocaleData, isSameDay, isSameMonth, isValid, localeDatePattern,
  parseISO, parseUserInput, startOfDay, toISODate, toISODateTime, withTime,
} from '../core/dates.js';
import { abrirComTransicao, el, icon, ICONS, nextId, on } from '../core/dom.js';
import { Popover, trapFocus } from '../core/popover.js';

const DEFAULTS = {
  mode: 'single',        // 'single' | 'range'
  time: false,           // true habilita seletor de hora
  seconds: false,
  minuteStep: 5,
  locale: undefined,     // default: locale do documento/navegador
  format: undefined,     // default: padrao numerico do locale
  firstDayOfWeek: undefined,
  months: undefined,     // default: 2 em range, 1 em single
  min: null,
  max: null,
  disabledDates: null,   // (date) => boolean
  presets: false,        // atalhos de periodo (Hoje, Ultimos 7 dias...): opt-in
  autoApply: undefined,  // default: true sem hora, false com hora
  clearable: true,
  weekNumbers: false,
  placement: 'bottom-center',   // centralizado no campo; as bordas da tela ainda mandam
  appendTo: undefined,
  isoName: undefined,    // name do input hidden com o valor ISO
  openOnFocus: true,
  // Painel proprio em todo lugar, por padrao: um so comportamento para
  // documentar, estilizar e testar. `true` liga o seletor do sistema no
  // celular, `'auto'` liga so onde o ponteiro e de toque.
  native: false,
  onChange: null,
  onOpen: null,
  onClose: null,
};

export class DatePicker {
  constructor(target, options = {}) {
    const node = typeof target === 'string' ? document.querySelector(target) : target;
    if (!node) throw new Error('[DatePicker] elemento alvo nao encontrado');

    // Sem o filtro, um `undefined` explicito (vindo do autoInit) apagaria o default.
    this.opts = { ...DEFAULTS, ...omitUndefined(options) };
    this.opts.locale = this.opts.locale || document.documentElement.lang || navigator.language || 'pt-BR';
    this.L = getLocaleData(this.opts.locale);
    this.opts.format = this.opts.format || localeDatePattern(this.opts.locale);
    this.opts.firstDayOfWeek = this.opts.firstDayOfWeek ?? this.L.firstDayOfWeek;
    this.isRange = this.opts.mode === 'range';
    this.opts.months = this.opts.months ?? (this.isRange ? 2 : 1);
    this.opts.presets = this.opts.presets ?? false;
    this.opts.autoApply = this.opts.autoApply ?? !this.opts.time;
    this.opts.min = parseISO(this.opts.min);
    this.opts.max = parseISO(this.opts.max);

    this.native = this._useNative();
    this.id = nextId('dp');
    this.isOpen = false;
    this.view = 'days';
    this.start = null;
    this.end = null;
    this.hover = null;
    this.pendingRange = false;
    this._cleanups = [];

    // A instancia fica acessivel pelo elemento nos dois modos.
    node._tucano = this;
    this.input = node;
    // O componente e dono do proprio campo, entao ele veste a classe: quem
    // escreve o template nao deveria ter de lembrar disso, e sem ela o input
    // aparece com a caixa nativa do navegador ao lado dos nossos controles.
    node.classList.add('tuc-input');

    this._buildPanel();
    this._setupTarget();
    this._readInitialValue();
    this.viewDate = this._anchorMonth();
    this.focusDate = clone(this.viewDate);

  }

  /* ---------------------------------------------------------------- *
   * API publica                                                       *
   * ---------------------------------------------------------------- */

  getValue() {
    return this.isRange ? { start: this.start && clone(this.start), end: this.end && clone(this.end) } : (this.start && clone(this.start));
  }

  setValue(value, { silent = false } = {}) {
    if (this.isRange) {
      const v = value || {};
      this.start = this._normalize(parseISO(v.start ?? v[0]));
      this.end = this._normalize(parseISO(v.end ?? v[1]));
      if (this.start && this.end && compareDay(this.start, this.end) > 0) [this.start, this.end] = [this.end, this.start];
    } else {
      this.start = this._normalize(parseISO(value));
      this.end = null;
    }
    this.pendingRange = false;
    this.viewDate = this._anchorMonth();
    this._syncTarget();
    this._render();
    if (!silent) this._emit();
  }

  clear({ silent = false } = {}) {
    this.start = null;
    this.end = null;
    this.pendingRange = false;
    this._syncTarget();
    this._render();
    if (!silent) this._emit();
  }

  open() {
    if (this.native) { this.overlay?.showPicker?.(); return; }
    if (this.isOpen) return;
    this.isOpen = true;
    this.viewDate = this._anchorMonth();
    this.focusDate = clone(this.start || this.viewDate);
    this.view = 'days';
    this._render();

    this.popover = new Popover(this.input, this.panel, {
      placement: this.opts.placement,
      appendTo: this.opts.appendTo || document.body,
      fecharAoSairFoco: true,
      // Clique fora: nao devolvemos o foco, senao roubariamos de onde o usuario clicou.
      onDismiss: (reason) => this.close({ restoreFocus: reason === 'escape' }),
    });
    this.popover.show();
    // Agora que o painel esta no DOM as medidas valem — so aqui da para rolar.
    this._revealed = null;
    this._revealTimes();
    abrirComTransicao(this.panel);
    this._releaseFocus = trapFocus(this.panel);
    this.input.setAttribute('aria-expanded', 'true');
    this.opts.onOpen?.(this);
  }

  close({ restoreFocus = true } = {}) {
    if (!this.isOpen) return;
    // Range aberto pela metade e descartado: nao existe "meio intervalo".
    if (this.pendingRange) { this.pendingRange = false; this.end = null; this._syncTarget(); }
    this.isOpen = false;
    this.panel.classList.remove('is-open');
    this.popover?.destroy();
    this.popover = null;
    this._releaseFocus?.();
    this._releaseFocus = null;
    this.input.setAttribute('aria-expanded', 'false');

    if (restoreFocus && !this._compacto) {
      // Devolver o foco ao input dispararia 'focus' e reabriria o painel na hora
      // — era isso que fazia o calendario piscar ao escolher um dia.
      this._suppressOpen = true;
      this.input.focus();
      this._suppressOpen = false;
    }
    this.opts.onClose?.(this);
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  destroy() {
    // Ao destruir nao ha para onde devolver o foco — o input pode estar saindo junto.
    this.close({ restoreFocus: false });
    this._cleanups.forEach((fn) => fn());
    this._cleanups = [];
    this.panel.remove();
    this.isoInput?.remove();
    delete this.input._tucano;
  }

  /* ---------------------------------------------------------------- *
   * Setup                                                             *
   * ---------------------------------------------------------------- */

  _buildPanel() {
    this.panel = el('div', {
      class: `tuc-dp${this.isRange ? ' is-range' : ''}${this.opts.time ? ' is-timed' : ''}`,
      role: 'dialog',
      'aria-modal': 'false',
      'aria-label': this.isRange ? 'Selecionar periodo' : 'Selecionar data',
      id: this.id,
    });
    this._cleanups.push(
      on(this.panel, 'keydown', (e) => this._onPanelKeydown(e)),
      on(this.panel, 'mouseleave', () => { if (this.pendingRange) { this.hover = null; this._paintDays(); } }),
    );
  }

  /**
   * Em telas de toque o seletor do proprio sistema e melhor que qualquer painel:
   * roda fora da pagina, e otimizado para o dedo e o usuario ja conhece.
   * Mas nao existe intervalo nativo em HTML — nesse caso seguimos com o painel,
   * que tem layout proprio de celular.
   */
  _useNative() {
    if (this.opts.native === false) return false;
    if (this.isRange) return false;
    if (this.opts.native === true) return true;
    return typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches;
  }

  /**
   * Layout compacto: tela estreita E ponteiro de toque.
   *
   * O 40rem espelha o breakpoint do CSS (core/tokens.css) — os dois precisam
   * concordar. A condicao de toque entra junto para nao desabilitar a
   * digitacao numa janela estreita de desktop.
   */
  get _compacto() {
    if (typeof window === 'undefined') return false;
    return !!window.matchMedia?.('(max-width: 40rem) and (pointer: coarse)').matches;
  }

  _setupTarget() {
    if (this.native) return this._setupNative();
    const input = this.input;

    /*
     * Em telas de toque o campo nao recebe foco. O iOS aplica zoom ao focar
     * qualquer input com menos de 16px — e essa fonte e do projeto, nao nossa,
     * entao nao da para resolver por CSS daqui. Sem foco tambem nao sobe o
     * teclado, que cobriria o calendario. Quem digita e o desktop; no celular
     * a entrada e o proprio painel.
     */
    if (this._compacto) {
      input.readOnly = true;
      this._cleanups.push(on(input, 'pointerdown', (e) => {
        e.preventDefault();
        this.isOpen ? this.close({ restoreFocus: false }) : this.open();
      }));
    }

    input.setAttribute('autocomplete', 'off');
    this._mask = this._compacto ? null : this._maskTemplate();
    this._maskDigits = '';
    if (this._mask) {
      input.setAttribute('inputmode', 'numeric');
      this._cleanups.push(on(input, 'input', (e) => this._onMaskInput(e)));
    }
    input.setAttribute('aria-haspopup', 'dialog');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-controls', this.id);
    if (!input.placeholder) input.placeholder = this._placeholder();

    // Input hidden com ISO: o visivel mostra o formato do locale, o Django recebe ISO.
    if (this.opts.isoName || input.name) {
      const name = this.opts.isoName || input.name;
      if (!this.opts.isoName && input.name) input.removeAttribute('name');
      this.isoInput = el('input', { type: 'hidden', name });
      input.after(this.isoInput);
    }

    this._cleanups.push(
      on(input, 'focus', () => { if (this.opts.openOnFocus && !this._suppressOpen) this.open(); }),
      on(input, 'click', () => { if (!this._suppressOpen && !this._compacto) this.open(); }),
      on(input, 'keydown', (e) => {
        if (e.key === 'ArrowDown' && !this.isOpen) { e.preventDefault(); this.open(); }
        else if (e.key === 'Enter' && this.isOpen) { e.preventDefault(); this._commitTyped(); }
        else if (e.key === 'Escape' && this.isOpen) { e.preventDefault(); this.close(); }
      }),
      // Ignora o `change` que nos mesmos disparamos em _emit(); senao o texto
      // ja formatado seria reinterpretado como digitacao e perderia a hora.
      on(input, 'change', () => { if (!this._emitting) this._commitTyped(); }),
      // Sair do campo confirma o que foi digitado. Mas um range pela metade nao
      // se confirma por texto: reinterpretar "07/09/2026" zeraria o pendingRange
      // e o proximo clique comecaria um periodo novo em vez de fechar esse.
      // relatedTarget nao basta para detectar clique no painel — Safari e Firefox
      // nao focam botao no clique e mandam null.
      on(input, 'blur', (e) => {
        if (this._emitting || this.pendingRange) return;
        if (this.panel.contains(e.relatedTarget) || this.panel.contains(document.activeElement)) return;
        this._commitTyped();
      }),
    );
  }

  /**
   * Modo nativo: o proprio input carrega o valor ISO e mantem o `name`, entao o
   * que chega no servidor e identico ao do painel — nao precisa de hidden.
   */
  /**
   * Modo nativo por sobreposicao.
   *
   * A versao anterior trocava o `type` do input para "date". Isso abre o
   * seletor do sistema, mas faz todo CSS que o projeto escreveu como
   * `input[type=text]` parar de casar — o campo perdia borda, altura e padding
   * e virava um input cru do browser. Era invisivel no desktop e so aparecia
   * no celular.
   *
   * Agora o input do projeto continua sendo text e mantem o estilo dele. Por
   * cima fica um input nativo transparente, do tamanho exato do campo: tocar
   * em qualquer ponto abre o seletor do sistema.
   */
  _setupNative() {
    const input = this.input;
    input.readOnly = true;              // impede o teclado de abrir por cima
    input.setAttribute('autocomplete', 'off');
    if (!input.placeholder) input.placeholder = this._placeholder();

    this.overlay = el('input', {
      type: this.opts.time ? 'datetime-local' : 'date',
      class: 'tuc-native',
      tabindex: -1,
      'aria-hidden': 'true',
    });
    if (this.opts.min) this.overlay.min = this._nativeValue(this.opts.min);
    if (this.opts.max) this.overlay.max = this._nativeValue(this.opts.max);
    if (this.opts.time) this.overlay.step = this.opts.seconds ? 1 : this.opts.minuteStep * 60;

    this.wrap = el('span', { class: 'tuc-native-wrap' });
    input.replaceWith(this.wrap);
    this.wrap.append(input, this.overlay);

    // O hidden com o `name` continua sendo quem posta, igual ao desktop.
    if (this.opts.isoName || input.name) {
      const name = this.opts.isoName || input.name;
      if (!this.opts.isoName && input.name) input.removeAttribute('name');
      this.isoInput = el('input', { type: 'hidden', name });
      this.wrap.after(this.isoInput);
    }

    this._cleanups.push(on(this.overlay, 'change', () => {
      if (this._emitting) return;
      this.start = this._normalize(parseISO(this.overlay.value));
      this.end = null;
      this._syncTarget();
      this._emit();
    }));
  }

  _nativeValue(date = this.start) {
    if (!isValid(date)) return '';
    return this.opts.time ? toISODateTime(date, this.opts.seconds) : toISODate(date);
  }

  _readInitialValue() {
    const raw = this.opts.value ?? (this.input ? this.input.value : null);
    if (!raw) return;
    if (this.isRange) {
      const [a, b] = String(raw).split(/\s*(?:–|—|-{1,2}|a[téa]?)\s*/i);
      this.start = this._normalize(parseUserInput(a, this.opts.locale)) || this._normalize(parseISO(a));
      this.end = this._normalize(parseUserInput(b, this.opts.locale)) || this._normalize(parseISO(b));
    } else {
      this.start = this._normalize(parseISO(raw) || parseUserInput(raw, this.opts.locale));
    }
    this._syncTarget();
  }

  /** Aplica min/max e devolve null quando a data e invalida ou desabilitada. */
  _normalize(date) {
    if (!isValid(date)) return null;
    const d = clampDate(date, this.opts.min, this.opts.max);
    return this._isDisabled(d) ? null : d;
  }

  _isDisabled(date) {
    if (this.opts.min && compareDay(date, this.opts.min) < 0) return true;
    if (this.opts.max && compareDay(date, this.opts.max) > 0) return true;
    return typeof this.opts.disabledDates === 'function' ? !!this.opts.disabledDates(date) : false;
  }

  /**
   * Mes que abre por padrao: o do valor, senao o de hoje. Com min/max apenas
   * limitamos — abrir no `min` levaria o usuario para anos atras sem motivo.
   */
  _anchorMonth() {
    const base = this.start || clampDate(startOfDay(new Date()), this.opts.min, this.opts.max);
    return startOfDay(new Date(base.getFullYear(), base.getMonth(), 1));
  }

  /**
   * Gabarito da mascara derivado do formato de exibicao, entao ele acompanha o
   * locale sozinho. Formatos com nome de mes ou AM/PM nao sao mascaraveis —
   * nesse caso devolve null e o campo segue como texto livre (o parse tolerante
   * continua valendo).
   */
  _maskTemplate() {
    const widths = { yyyy: 4, yy: 2, MM: 2, M: 2, dd: 2, d: 2, HH: 2, H: 2, hh: 2, h: 2, mm: 2, m: 2, ss: 2, s: 2 };
    const naoNumerico = /MMMM|MMM|EEEE|EEE|(^|[^'])a([^']|$)/;
    const f = this._displayFormat();
    if (naoNumerico.test(f)) return null;
    const one = f.replace(/'[^']*'|yyyy|yy|MM|M|dd|d|HH|H|hh|h|mm|m|ss|s/g,
      (t) => (t.startsWith("'") ? t.slice(1, -1) : '#'.repeat(widths[t])));
    return this.isRange ? `${one} — ${one}` : one;
  }

  _maskSlots() {
    return this._mask ? (this._mask.match(/#/g) || []).length : 0;
  }

  /**
   * Reescreve o campo a cada tecla mantendo o gabarito. Apagar em cima de um
   * separador remove o digito anterior junto — senao a mascara o recolocaria
   * na hora e o campo travaria.
   */
  _onMaskInput(e) {
    const input = this.input;
    const raw = input.value;
    const caret = input.selectionStart ?? raw.length;
    const apagando = typeof e.inputType === 'string' && e.inputType.startsWith('delete');

    let digits = raw.replace(/\D/g, '');
    let antes = raw.slice(0, caret).replace(/\D/g, '').length;

    // Digitos iguais aos de antes = so um separador foi apagado. Nesse caso
    // removemos o digito vizinho ao cursor — senao a mascara recolocaria o
    // separador na hora e a tecla nao faria nada.
    if (apagando && digits === this._maskDigits) {
      const paraFrente = e.inputType === 'deleteContentForward';
      const idx = paraFrente ? antes : antes - 1;
      if (idx >= 0 && idx < digits.length) {
        digits = digits.slice(0, idx) + digits.slice(idx + 1);
        if (!paraFrente) antes -= 1;
      }
    }
    digits = digits.slice(0, this._maskSlots());

    const masked = maskFormat(digits, this._mask);
    this._maskDigits = digits;
    input.value = masked;
    const pos = caretAfterDigits(masked, Math.min(antes, digits.length));
    input.setSelectionRange(pos, pos);

    if (digits.length === this._maskSlots()) this._previewTyped();
  }

  /**
   * Com a mascara completa, move o calendario para a data digitada sem fechar
   * nem reescrever o campo — commit de verdade so no Enter ou ao sair.
   */
  _previewTyped() {
    const raw = this.input.value;
    if (this.isRange) {
      const [a, b] = raw.split(/\s*—\s*/);
      const inicio = this._keepTime(parseUserInput(a, this.opts.locale), this.start);
      if (!inicio) return;
      this.start = inicio;
      this.end = this._keepTime(parseUserInput(b, this.opts.locale), this.end);
      this.pendingRange = false;
    } else {
      const d = this._keepTime(parseUserInput(raw, this.opts.locale), this.start);
      if (!d) return;
      this.start = d;
    }
    this.viewDate = this._anchorMonth();
    this.focusDate = clone(this.start);
    if (this.isoInput) this.isoInput.value = this._isoValue();
    this._render();
  }

  _placeholder() {
    const sample = this._displayFormat().replace(/y/g, 'a').replace(/M/g, 'm').replace(/H|h/g, 'h');
    return this.isRange ? `${sample} — ${sample}` : sample;
  }

  /* ---------------------------------------------------------------- *
   * Valor <-> input                                                   *
   * ---------------------------------------------------------------- */

  _displayFormat() {
    if (!this.opts.time) return this.opts.format;
    const h = this.L.hour12 ? 'hh:mm' : 'HH:mm';
    return `${this.opts.format} ${h}${this.opts.seconds ? ':ss' : ''}${this.L.hour12 ? ' a' : ''}`;
  }

  _displayValue() {
    const f = this._displayFormat();
    if (!this.start) return '';
    const a = format(this.start, f, this.opts.locale);
    if (!this.isRange) return a;
    return this.end ? `${a} — ${format(this.end, f, this.opts.locale)}` : a;
  }

  _isoValue() {
    const enc = (d) => (this.opts.time ? toISODateTime(d, this.opts.seconds) : toISODate(d));
    if (!this.start) return '';
    return this.isRange ? `${enc(this.start)}${this.end ? `,${enc(this.end)}` : ''}` : enc(this.start);
  }

  _syncTarget() {
    if (this.input) this.input.value = this._displayValue();
    // O overlay guarda o ISO: e dele que o seletor do sistema parte.
    if (this.overlay) this.overlay.value = this._nativeValue();
    if (this.isoInput) this.isoInput.value = this._isoValue();
    // Mantem o contador da mascara alinhado com o texto escrito por codigo.
    if (this.input && this._mask) this._maskDigits = this.input.value.replace(/\D/g, '');
  }

  _commitTyped() {
    if (!this.input) return;
    const raw = this.input.value.trim();
    // Texto identico ao valor atual: nada a reinterpretar — e evita emitir de novo.
    if (raw === this._displayValue()) return;
    if (!raw) { this.clear(); return; }
    if (this.isRange) {
      const [a, b] = raw.split(/\s*(?:–|—|-{1,2}|at[ée]|a)\s*/i);
      const s = this._keepTime(parseUserInput(a, this.opts.locale), this.start);
      const e = this._keepTime(parseUserInput(b, this.opts.locale), this.end);
      if (s) this.setValue({ start: s, end: e });
      else this._syncTarget();
    } else {
      const d = this._keepTime(parseUserInput(raw, this.opts.locale), this.start);
      if (d) this.setValue(d);
      else this._syncTarget();
    }
  }

  /**
   * Normaliza o que foi digitado. Quando o texto nao traz hora (parseUserInput
   * marca isso em `hasTime`), mantem a hora que ja estava selecionada em vez de
   * jogar o valor para meia-noite.
   */
  _keepTime(parsed, previous) {
    if (!parsed) return null;
    const d = this.opts.time && !parsed.hasTime && previous ? withTime(parsed, previous) : parsed;
    return this._normalize(d);
  }

  _emit() {
    const value = this.getValue();
    const detail = { value, iso: this._isoValue(), instance: this };
    this._emitting = true;
    try {
      this.opts.onChange?.(value, detail);
      this.input.dispatchEvent(new CustomEvent('tucano:change', { detail, bubbles: true }));
      // 'change' nativo para que validacao de form e HTMX enxerguem o valor.
      this.input?.dispatchEvent(new Event('change', { bubbles: true }));
    } finally {
      this._emitting = false;
    }
  }

  /* ---------------------------------------------------------------- *
   * Selecao                                                           *
   * ---------------------------------------------------------------- */

  _selectDay(date) {
    if (this._isDisabled(date)) return;
    const keepTime = (target, source) => (this.opts.time && source ? withTime(target, source) : target);

    if (!this.isRange) {
      this.start = keepTime(clone(date), this.start);
      this._syncTarget();
      this._emit();
      this._render();
      if (this.opts.autoApply) this.close();
      return;
    }

    if (!this.pendingRange || !this.start || (this.start && this.end)) {
      this.start = keepTime(clone(date), this.start);
      this.end = null;
      this.pendingRange = true;
    } else {
      let a = this.start;
      let b = keepTime(clone(date), this.end);
      if (compareDay(b, a) < 0) {
        // Clicou antes do inicio: inverte, mantendo cada horario no seu lugar.
        b = this.opts.time ? withTime(clone(date), this.start) : clone(date);
        a = this.opts.time && this.end ? withTime(this.start, this.end) : this.start;
        [a, b] = [b, a];
      }
      this.start = a;
      this.end = b;
      this.pendingRange = false;
      this.hover = null;
    }
    this._syncTarget();
    this._render();
    if (!this.pendingRange) {
      this._emit();
      if (this.opts.autoApply) this.close();
    }
  }

  _applyPreset(preset) {
    const range = preset.value();
    this.start = this._normalize(range.start);
    this.end = this._normalize(range.end);
    this.pendingRange = false;
    this.viewDate = this._anchorMonth();
    this._syncTarget();
    this._emit();
    this._render();
    if (this.opts.autoApply) this.close();
  }

  _setTime(which, unit, value) {
    const target = which === 'end' ? this.end : this.start;
    if (!target) return;
    const d = clone(target);
    if (unit === 'h') d.setHours(value);
    if (unit === 'm') d.setMinutes(value);
    if (unit === 's') d.setSeconds(value);
    if (which === 'end') this.end = d; else this.start = d;
    if (this.isRange && this.start && this.end && this.start > this.end) {
      // Ajustar a hora nao pode inverter o intervalo.
      if (which === 'start') this.start = clone(this.end);
      else this.end = clone(this.start);
    }
    this._syncTarget();
    this._emit();
    this._render();
  }

  /* ---------------------------------------------------------------- *
   * Render                                                            *
   * ---------------------------------------------------------------- */

  _render() {
    // Guarda o scroll por coluna (chave estavel), nao por posicao no DOM.
    const scrollState = new Map();
    for (const n of this.panel.querySelectorAll('.tuc-dp__timelist')) {
      scrollState.set(`${n.dataset.which}|${n.dataset.unit}`, n.scrollTop);
    }
    this.panel.classList.toggle('is-picking', this.pendingRange && !!this.hover);
    this.panel.replaceChildren();

    if (this.opts.presets && this.isRange) this.panel.append(this._renderPresets());

    const main = el('div', { class: 'tuc-dp__main' });
    if (this.view === 'days') {
      const months = el('div', { class: 'tuc-dp__months' });
      for (let i = 0; i < this.opts.months; i++) months.append(this._renderMonth(addMonths(this.viewDate, i), i));
      main.append(months);
    } else {
      main.append(this._renderPeriodView());
    }

    if (this.opts.time && this.view === 'days') main.append(this._renderTime());
    if (this._needsFooter()) main.append(this._renderFooter());

    this.panel.append(main);
    for (const n of this.panel.querySelectorAll('.tuc-dp__timelist')) {
      const prev = scrollState.get(`${n.dataset.which}|${n.dataset.unit}`);
      if (prev !== undefined) n.scrollTop = prev;
    }
    this._revealTimes();
  }

  /**
   * Rola cada coluna de hora ate o valor selecionado — mas so quando esse valor
   * mudou. Assim o scroll que o usuario deu na coluna nao e desfeito a cada
   * re-render (que acontece a todo hover no modo periodo).
   */
  _revealTimes() {
    this._revealed = this._revealed || new Map();
    for (const list of this.panel.querySelectorAll('.tuc-dp__timelist')) {
      const key = `${list.dataset.which}|${list.dataset.unit}`;
      const selected = list.querySelector('.is-selected')?.textContent ?? null;
      if (this._revealed.get(key) === selected) continue;
      this._revealed.set(key, selected);
      revealSelected(list);
    }
  }

  _needsFooter() {
    return !this.opts.autoApply || this.opts.clearable;
  }

  _renderMonth(monthDate, index) {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const wrap = el('div', { class: 'tuc-dp__month' });

    const showPrev = index === 0;
    const showNext = index === this.opts.months - 1;
    const header = el('div', { class: 'tuc-dp__header' }, [
      showPrev
        ? el('button', {
            type: 'button', class: 'tuc-btn is-ghost is-icon is-sm tuc-dp__nav', 'aria-label': 'Mes anterior',
            disabled: this._navBlocked(-1), onclick: () => this._shiftView(-1),
          }, [icon(ICONS.chevronLeft)])
        : el('span', { class: 'tuc-dp__nav is-ghost' }),
      el('button', {
        type: 'button', class: 'tuc-dp__label', 'aria-live': 'polite',
        onclick: () => { this.view = 'months'; this.viewDate = clone(monthDate); this._render(); },
      }, [`${this.L.monthsLong[month]} ${year}`, icon(ICONS.chevronDown, 14)]),
      showNext
        ? el('button', {
            type: 'button', class: 'tuc-btn is-ghost is-icon is-sm tuc-dp__nav', 'aria-label': 'Proximo mes',
            disabled: this._navBlocked(1), onclick: () => this._shiftView(1),
          }, [icon(ICONS.chevronRight)])
        : el('span', { class: 'tuc-dp__nav is-ghost' }),
    ]);

    // Mesma classe da grade: com numero de semana sao 8 colunas, nao 7. Sem isso
    // o sabado quebrava para a linha de baixo e desalinhava o cabecalho inteiro.
    const weekdays = el('div', { class: `tuc-dp__weekdays${this.opts.weekNumbers ? ' has-weeknums' : ''}` });
    if (this.opts.weekNumbers) weekdays.append(el('span', { class: 'tuc-dp__weeknum-head' }));
    for (let i = 0; i < 7; i++) {
      const idx = (i + this.opts.firstDayOfWeek) % 7;
      weekdays.append(el('abbr', {
        class: 'tuc-dp__weekday', title: this.L.weekdaysShort[idx], text: this.L.weekdaysNarrow[idx],
      }));
    }

    const grid = el('div', {
      class: `tuc-dp__grid${this.opts.weekNumbers ? ' has-weeknums' : ''}`,
      role: 'grid', 'aria-label': `${this.L.monthsLong[month]} ${year}`,
    });
    const cells = buildMonthGrid(year, month, this.opts.firstDayOfWeek);
    cells.forEach((cell, i) => {
      if (this.opts.weekNumbers && i % 7 === 0) {
        grid.append(el('span', { class: 'tuc-dp__weeknum', text: isoWeek(cell.date) }));
      }
      grid.append(this._renderDay(cell, month));
    });

    wrap.append(header, weekdays, grid);
    return wrap;
  }

  /**
   * Classes de um dia. Fica separado do _renderDay porque o hover repinta as
   * celulas existentes em vez de recriar a grade — ver _paintDays().
   */
  _dayClasses(date, outside) {
    // Ponta "fantasma" do intervalo enquanto o usuario ainda escolhe o fim.
    let rStart = this.start;
    let rEnd = this.end;
    if (this.isRange && this.pendingRange && this.start && this.hover) {
      [rStart, rEnd] = compareDay(this.hover, this.start) < 0 ? [this.hover, this.start] : [this.start, this.hover];
    }

    const isStart = this.isRange ? isSameDay(date, rStart) : isSameDay(date, this.start);
    const isEnd = this.isRange && isSameDay(date, rEnd);
    const inRange = this.isRange && rStart && rEnd
      && compareDay(date, rStart) > 0 && compareDay(date, rEnd) < 0;
    const distintas = rStart && rEnd && !isSameDay(rStart, rEnd);

    const classes = ['tuc-dp__day'];
    if (outside) classes.push('is-outside');
    if (this._isDisabled(date)) classes.push('is-disabled');
    if (isSameDay(date, new Date())) classes.push('is-today');
    if (isStart || isEnd) classes.push('is-selected');
    if (isStart && distintas) classes.push('is-start');
    if (isEnd && distintas) classes.push('is-end');
    if (inRange) classes.push('is-in-range');
    // So a ponta sob o cursor e "preview"; o tom da faixa vem de .is-picking.
    if (this.pendingRange && isEnd) classes.push('is-preview');
    return classes;
  }

  /**
   * Repinta as celulas ja existentes. E o que roda a cada mouseenter: refazer a
   * grade ali trocaria o elemento entre o mousedown e o mouseup, e o browser
   * engoliria o clique — era isso que impedia de fechar o periodo.
   */
  _paintDays() {
    this.panel.classList.toggle('is-picking', this.pendingRange && !!this.hover);
    for (const btn of this.panel.querySelectorAll('.tuc-dp__day')) {
      const date = parseISO(btn.dataset.date);
      if (!date) continue;
      const classes = this._dayClasses(date, date.getMonth() !== +btn.dataset.month);
      btn.className = classes.join(' ');
      btn.setAttribute('aria-selected', classes.includes('is-selected') ? 'true' : 'false');
      btn.tabIndex = isSameDay(date, this.focusDate) ? 0 : -1;
    }
  }

  _renderDay(cell, month) {
    const { date, outside } = cell;
    const classes = this._dayClasses(date, outside);

    return el('button', {
      type: 'button',
      class: classes.join(' '),
      tabindex: isSameDay(date, this.focusDate) ? 0 : -1,
      disabled: this._isDisabled(date),
      role: 'gridcell',
      'aria-selected': classes.includes('is-selected') ? 'true' : 'false',
      'aria-label': format(date, "EEEE, d 'de' MMMM 'de' yyyy", this.opts.locale),
      dataset: { date: toISODate(date), month },
      onclick: () => this._selectDay(date),
      onmouseenter: () => {
        if (this.isRange && this.pendingRange) { this.hover = date; this._paintDays(); }
      },
      // Duas camadas: o botao desenha a faixa do intervalo (quadrada, encostando
      // na celula vizinha) e o span desenha a pilula do dia selecionado.
    }, [el('span', { class: 'tuc-dp__daynum', text: String(date.getDate()) })]);
  }

  _renderPeriodView() {
    const isMonths = this.view === 'months';
    const year = this.viewDate.getFullYear();
    const wrap = el('div', { class: 'tuc-dp__period' });

    const step = isMonths ? 1 : 12;
    const header = el('div', { class: 'tuc-dp__header' }, [
      el('button', {
        type: 'button', class: 'tuc-btn is-ghost is-icon is-sm tuc-dp__nav', 'aria-label': 'Anterior',
        onclick: () => { this.viewDate = addYears(this.viewDate, -step); this._render(); },
      }, [icon(ICONS.chevronLeft)]),
      el('button', {
        type: 'button', class: 'tuc-dp__label',
        onclick: () => { this.view = isMonths ? 'years' : 'days'; this._render(); },
      }, [isMonths ? String(year) : `${floorTo(year, 12)} – ${floorTo(year, 12) + 11}`]),
      el('button', {
        type: 'button', class: 'tuc-btn is-ghost is-icon is-sm tuc-dp__nav', 'aria-label': 'Proximo',
        onclick: () => { this.viewDate = addYears(this.viewDate, step); this._render(); },
      }, [icon(ICONS.chevronRight)]),
    ]);

    const grid = el('div', { class: 'tuc-dp__periodgrid' });
    const items = isMonths
      ? this.L.monthsShort.map((label, m) => ({ label, date: new Date(year, m, 1) }))
      : Array.from({ length: 12 }, (_, i) => {
          const y = floorTo(year, 12) + i;
          return { label: String(y), date: new Date(y, this.viewDate.getMonth(), 1) };
        });

    for (const item of items) {
      const active = isMonths
        ? this.start && isSameMonth(item.date, this.start)
        : this.start && item.date.getFullYear() === this.start.getFullYear();
      const current = isMonths
        ? isSameMonth(item.date, new Date())
        : item.date.getFullYear() === new Date().getFullYear();
      grid.append(el('button', {
        type: 'button',
        class: `tuc-dp__periodcell${active ? ' is-selected' : ''}${current ? ' is-today' : ''}`,
        text: item.label,
        onclick: () => {
          this.viewDate = startOfDay(item.date);
          this.view = isMonths ? 'days' : 'months';
          this._render();
        },
      }));
    }

    wrap.append(header, grid);
    return wrap;
  }

  _renderTime() {
    const row = el('div', { class: 'tuc-dp__time' });
    const targets = this.isRange ? [['start', 'Início'], ['end', 'Fim']] : [['start', 'Horário']];
    const pad2 = (n) => String(n).padStart(2, '0');

    for (const [which, label] of targets) {
      const value = which === 'end' ? this.end : this.start;
      const readout = value
        ? `${pad2(value.getHours())}:${pad2(value.getMinutes())}${this.opts.seconds ? `:${pad2(value.getSeconds())}` : ''}`
        : '--:--';

      const head = el('div', { class: 'tuc-dp__timehead' }, [
        el('span', { class: 'tuc-dp__timelabel', text: label }),
        el('span', { class: 'tuc-dp__timevalue', text: readout }),
      ]);

      const cols = el('div', { class: 'tuc-dp__timecols' }, [
        this._renderTimeList(which, 'h', 24, 1, value ? value.getHours() : null),
        this._renderTimeList(which, 'm', 60, this.opts.minuteStep, value ? value.getMinutes() : null),
        this.opts.seconds ? this._renderTimeList(which, 's', 60, 1, value ? value.getSeconds() : null) : null,
      ]);

      row.append(el('div', { class: 'tuc-dp__timegroup' }, [head, cols]));
    }
    return row;
  }

  _renderTimeList(which, unit, count, step, current) {
    const list = el('div', {
      class: 'tuc-dp__timelist', role: 'listbox', tabindex: 0,
      'aria-label': { h: 'Hora', m: 'Minuto', s: 'Segundo' }[unit],
      dataset: { which, unit },
    });
    for (let v = 0; v < count; v += step) {
      // Com step > 1 o minuto atual cai no degrau mais proximo abaixo.
      const selected = current !== null && (step > 1 ? Math.floor(current / step) * step === v : current === v);
      list.append(el('button', {
        type: 'button',
        class: `tuc-dp__timeitem${selected ? ' is-selected' : ''}`,
        text: String(v).padStart(2, '0'),
        role: 'option',
        'aria-selected': selected ? 'true' : 'false',
        disabled: !(which === 'end' ? this.end : this.start),
        onclick: () => this._setTime(which, unit, v),
      }));
    }
    return list;
  }

  _renderPresets() {
    const wrap = el('div', { class: 'tuc-dp__presets' });
    for (const preset of buildPresets(this.opts.presets)) {
      const r = preset.value();
      const active = this.start && this.end && isSameDay(this.start, r.start) && isSameDay(this.end, r.end);
      wrap.append(el('button', {
        type: 'button',
        class: `tuc-dp__preset${active ? ' is-selected' : ''}`,
        text: preset.label,
        onclick: () => this._applyPreset(preset),
      }));
    }
    return wrap;
  }

  _renderFooter() {
    const footer = el('div', { class: 'tuc-dp__footer' });
    if (this.opts.clearable) {
      footer.append(el('button', {
        type: 'button', class: 'tuc-btn is-ghost is-sm', text: 'Limpar',
        onclick: () => { this.clear(); if (this.opts.autoApply) this.close(); },
      }));
    }
    footer.append(el('span', { class: 'tuc-dp__spacer' }));
    if (!this.opts.autoApply) {
      footer.append(el('button', {
        type: 'button', class: 'tuc-btn is-primary is-sm', text: 'Aplicar',
        disabled: !this.start || (this.isRange && !this.end),
        onclick: () => { this._emit(); this.close(); },
      }));
    }
    return footer;
  }

  /* ---------------------------------------------------------------- *
   * Navegacao                                                         *
   * ---------------------------------------------------------------- */

  _shiftView(delta) {
    this.viewDate = addMonths(this.viewDate, delta);
    this._render();
  }

  /** Bloqueia a seta quando o mes vizinho ja esta todo fora de min/max. */
  _navBlocked(delta) {
    const target = addMonths(this.viewDate, delta === 1 ? this.opts.months : -1);
    if (delta < 0 && this.opts.min) return compareDay(new Date(target.getFullYear(), target.getMonth() + 1, 0), this.opts.min) < 0;
    if (delta > 0 && this.opts.max) return compareDay(target, this.opts.max) > 0;
    return false;
  }

  _onPanelKeydown(e) {
    if (!e.target.classList.contains('tuc-dp__day')) return;
    const moves = {
      ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7,
    };
    let next = null;
    if (e.key in moves) next = addDays(this.focusDate, moves[e.key]);
    else if (e.key === 'PageUp') next = addMonths(this.focusDate, e.shiftKey ? -12 : -1);
    else if (e.key === 'PageDown') next = addMonths(this.focusDate, e.shiftKey ? 12 : 1);
    else if (e.key === 'Home') next = addDays(this.focusDate, -((this.focusDate.getDay() - this.opts.firstDayOfWeek + 7) % 7));
    else if (e.key === 'End') next = addDays(this.focusDate, 6 - ((this.focusDate.getDay() - this.opts.firstDayOfWeek + 7) % 7));
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._selectDay(this.focusDate); return; }
    else return;

    e.preventDefault();
    this.focusDate = clampDate(next, this.opts.min, this.opts.max);
    // Traz o mes do foco para dentro da janela visivel.
    const last = addMonths(this.viewDate, this.opts.months - 1);
    if (compareDay(this.focusDate, this.viewDate) < 0) this.viewDate = startOfDay(new Date(this.focusDate.getFullYear(), this.focusDate.getMonth(), 1));
    else if (!isSameMonth(this.focusDate, last) && compareDay(this.focusDate, new Date(last.getFullYear(), last.getMonth() + 1, 0)) > 0) {
      this.viewDate = addMonths(startOfDay(new Date(this.focusDate.getFullYear(), this.focusDate.getMonth(), 1)), -(this.opts.months - 1));
    }
    this._render();
    this.panel.querySelector(`.tuc-dp__day[data-date="${toISODate(this.focusDate)}"]`)?.focus();
  }
}

/* ------------------------------------------------------------------ *
 * Presets                                                             *
 * ------------------------------------------------------------------ */

function buildPresets(option) {
  if (Array.isArray(option)) return option;
  const today = () => startOfDay(new Date());
  return [
    { label: 'Hoje', value: () => ({ start: today(), end: today() }) },
    { label: 'Ontem', value: () => ({ start: addDays(today(), -1), end: addDays(today(), -1) }) },
    { label: 'Últimos 7 dias', value: () => ({ start: addDays(today(), -6), end: today() }) },
    { label: 'Últimos 30 dias', value: () => ({ start: addDays(today(), -29), end: today() }) },
    { label: 'Este mês', value: () => { const t = today(); return { start: new Date(t.getFullYear(), t.getMonth(), 1), end: new Date(t.getFullYear(), t.getMonth() + 1, 0) }; } },
    { label: 'Mês passado', value: () => { const t = today(); return { start: new Date(t.getFullYear(), t.getMonth() - 1, 1), end: new Date(t.getFullYear(), t.getMonth(), 0) }; } },
    { label: 'Este ano', value: () => { const t = today(); return { start: new Date(t.getFullYear(), 0, 1), end: new Date(t.getFullYear(), 11, 31) }; } },
  ];
}

/** Remove chaves com valor undefined para que o spread nao apague defaults. */
function omitUndefined(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) if (v !== undefined) out[k] = v;
  return out;
}

/**
 * Centraliza o item selecionado da coluna quando ele esta fora de vista.
 * Mexe so no scroll da lista — scrollIntoView arrastaria a pagina inteira junto.
 */
function revealSelected(list) {
  const item = list.querySelector('.is-selected');
  if (!item) return;
  const lr = list.getBoundingClientRect();
  const ir = item.getBoundingClientRect();
  // offsetTop seria relativo ao ancestral posicionado (o painel), nao a lista.
  const top = ir.top - lr.top + list.scrollTop;
  if (top < list.scrollTop || top + ir.height > list.scrollTop + list.clientHeight) {
    list.scrollTop = top - (list.clientHeight - ir.height) / 2;
  }
}

/**
 * Distribui os digitos pelo gabarito ("##/##/####"), inserindo os separadores.
 * O separador entra assim que o grupo anterior fecha, para o usuario nao
 * precisar digita-lo.
 */
function maskFormat(digits, template) {
  let out = '';
  let i = 0;
  for (const ch of template) {
    if (ch === '#') {
      if (i >= digits.length) break;
      out += digits[i++];
    } else {
      if (i === 0) break;
      out += ch;
    }
  }
  return out;
}

/** Posicao do cursor logo apos o n-esimo digito do texto ja mascarado. */
function caretAfterDigits(masked, n) {
  if (n <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < masked.length; i++) {
    if (masked[i] >= '0' && masked[i] <= '9' && ++seen === n) return i + 1;
  }
  return masked.length;
}

function floorTo(value, size) {
  return Math.floor(value / size) * size;
}

/** Numero da semana ISO-8601. */
function isoWeek(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

/**
 * Inicializa todo [data-tuc-datepicker] do escopo. Opcoes vem de data-attributes:
 * data-mode, data-time, data-min, data-max, data-months, data-locale, data-format...
 */
export function autoInit(scope = document) {
  const out = [];
  for (const node of scope.querySelectorAll('[data-tuc-datepicker]:not([data-tuc-ready])')) {
    const d = node.dataset;
    node.setAttribute('data-tuc-ready', '');
    out.push(new DatePicker(node, {
      mode: d.mode || undefined,
      time: d.time === 'true' || d.time === '',
      seconds: d.seconds === 'true',
      minuteStep: d.minuteStep ? +d.minuteStep : undefined,
      locale: d.locale || undefined,
      format: d.format || undefined,
      months: d.months ? +d.months : undefined,
      min: d.min || null,
      max: d.max || null,
      presets: d.presets === 'true' ? true : undefined,
      weekNumbers: d.weekNumbers === 'true',
      isoName: d.isoName || undefined,
      placement: d.placement || undefined,
      native: d.native === 'true' ? true : d.native === 'false' ? false : undefined,
    }));
  }
  return out;
}
