import {
  addDays, addMonths, addYears, buildMonthGrid, clampDate, clone, compareDay,
  endOfMonth, format, getLocaleData, isSameDay, isSameMonth, isValid, localeDatePattern,
  parseISO, parseUserInput, startOfDay, startOfMonth, toISODate, toISODateTime, withTime,
} from '../core/dates.js';
import { el, icon, ICON_CHEVRON_DOWN, ICON_CHEVRON_LEFT, ICON_CHEVRON_RIGHT, nextId, omitUndefined, on } from '../core/dom.js';
import { Popover, trapFocus } from '../core/popover.js';
import { DATEPICKER_TEXTS as T } from '../core/texts.js';

/*
 * Separador de periodo digitado: "–" e "—" com ou sem espaco; "-", "a" e "até"
 * so entre espacos. Havia duas expressoes, e cada uma errava de um lado: uma
 * aceitava "aa" e "aé" por acidente, e as duas cortavam no hifen de dentro da
 * data — "25-12-2025 a 31-12-2025" virava 25 — 12. O "a" colado tambem partia
 * o "AM" de um horario de 12 horas.
 */
const RANGE_SEPARATOR = /\s*[–—]\s*|\s+(?:-{1,2}|at[ée]|a)\s+/i;

/*
 * Atributos que o componente escreve no campo. O destroy() devolve cada um ao
 * valor de antes: sem isso o campo ficava sem `name` (o formulario parava de
 * postar), com papel de combobox e com o placeholder do componente.
 */
const TOUCHED_ATTRS = ['name', 'role', 'aria-haspopup', 'aria-expanded', 'aria-controls', 'placeholder', 'autocomplete', 'inputmode', 'readonly'];

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
  autoApply: undefined,  // default: true sem hora, false com hora. Sem autoApply, a escolha so vale no Aplicar
  clearable: true,
  weekNumbers: false,
  placement: 'bottom-center',   // centralizado no campo; as bordas da tela ainda mandam
  appendTo: undefined,
  isoName: undefined,    // name do input hidden com o valor ISO
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
    // Segunda instancia no mesmo campo: a anterior sai antes. Duas ao mesmo tempo
    // criavam dois hidden com o mesmo name e dois paineis abrindo no clique.
    if (node._tucano instanceof DatePicker) {
      // O destroy tira o data-tuc-ready; quem chamou (o autoInit) acabou de po-lo.
      const ready = node.hasAttribute('data-tuc-ready');
      node._tucano.destroy();
      node.toggleAttribute('data-tuc-ready', ready);
    }

    // Sem o filtro, um `undefined` explicito (vindo do autoInit) apagaria o default.
    this.opts = { ...DEFAULTS, ...omitUndefined(options) };
    this.opts.locale = this.opts.locale || document.documentElement.lang || navigator.language || 'pt-BR';
    this.L = getLocaleData(this.opts.locale);
    // Nome do dia lido pelo leitor de tela, na forma completa do proprio idioma.
    // O padrao escrito a mao ("d 'de' MMMM 'de' yyyy") so servia ao portugues.
    this._dayName = new Intl.DateTimeFormat(this.opts.locale, { dateStyle: 'full' });
    this.opts.format = this.opts.format || localeDatePattern(this.opts.locale);
    this.opts.firstDayOfWeek = this.opts.firstDayOfWeek ?? this.L.firstDayOfWeek;
    this.isRange = this.opts.mode === 'range';
    this.opts.months = this.opts.months ?? (this.isRange ? 2 : 1);
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
    this._original = Object.fromEntries(TOUCHED_ATTRS.map((name) => [name, node.getAttribute(name)]));
    // O componente e dono do proprio campo, entao ele veste a classe: quem
    // escreve o template nao deveria ter de lembrar disso, e sem ela o input
    // aparece com a caixa nativa do navegador ao lado dos nossos controles.
    this._addedClass = !node.classList.contains('tuc-input');
    node.classList.add('tuc-input');

    this._buildPanel();
    this._setupTarget();
    this._readValue(this.opts.value ?? node.value);
    this._saved = [this.start, this.end];
    this._syncTarget();
    this.viewDate = this._anchorMonth();
    this.focusDate = clone(this.viewDate);

    /*
     * O reset do formulario volta o campo ao texto do atributo `value` sem
     * disparar change: a tela mostrava o texto cru, e o hidden e a instancia
     * seguiam com o valor antigo. O evento chega antes de os valores voltarem,
     * entao a leitura espera a vez — como no select.
     */
    if (node.form) this._cleanups.push(on(node.form, 'reset', () => setTimeout(() => this._resetFromField())));
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
      this.start = this._normalize(this._toDate(v.start ?? v[0]));
      this.end = this._normalize(this._toDate(v.end ?? v[1]));
      if (this.start && this.end && compareDay(this.start, this.end) > 0) [this.start, this.end] = [this.end, this.start];
    } else {
      this.start = this._normalize(this._toDate(value));
      this.end = null;
    }
    this.viewDate = this._anchorMonth();
    this._commit(silent);
  }

  clear({ silent = false } = {}) {
    this.start = null;
    this.end = null;
    this._commit(silent);
  }

  open() {
    if (this.native) { this.overlay?.showPicker?.(); return; }
    if (this.isOpen) return;
    this.isOpen = true;
    this._saved = [this.start, this.end];
    this.viewDate = this._anchorMonth();
    this.focusDate = this._initialFocus();
    this.view = 'days';
    this._render();

    this.popover = new Popover(this.input, this.panel, {
      placement: this.opts.placement,
      appendTo: this.opts.appendTo,
      closeOnFocusOut: true,
      onDismiss: (reason) => {
        // O clique fora chega antes do blur do campo, e o fechamento descartaria
        // o texto digitado. Confirmar aqui e o mesmo que o blur faria.
        if (reason === 'outside') this._commitTyped();
        // Clique fora: nao devolvemos o foco, senao roubariamos de onde o usuario clicou.
        this.close({ restoreFocus: reason === 'escape' });
      },
    });
    this.popover.show();
    // Agora que o painel esta no DOM as medidas valem — so aqui da para rolar.
    this._revealed = null;
    this._revealTimes();
    this._releaseFocus = trapFocus(this.panel);
    this.input.setAttribute('aria-expanded', 'true');
    // So agora: o painel entra no DOM ao abrir, e um aria-controls apontando
    // para um id que nao existe e valor invalido.
    this.input.setAttribute('aria-controls', this.id);
    this.opts.onOpen?.(this);
  }

  close({ restoreFocus = true } = {}) {
    if (!this.isOpen) return;
    /*
     * Fechar descarta o que nao foi confirmado: o periodo pela metade (nao
     * existe meio intervalo), a escolha feita antes do Aplicar e o texto
     * digitado e abandonado com Escape. Antes o periodo pela metade virava o
     * valor, e o par que ja estava confirmado se perdia.
     */
    [this.start, this.end] = this._saved;
    this.pendingRange = false;
    this.hover = null;
    this._syncTarget();
    this.isOpen = false;
    this.popover?.destroy();
    this.popover = null;
    this._releaseFocus?.();
    this._releaseFocus = null;
    this.input.setAttribute('aria-expanded', 'false');
    this.input.removeAttribute('aria-controls');

    if (restoreFocus && !this._isCompact) {
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
    // No modo nativo o campo volta ao lugar do envolucro, e o overlay sai junto.
    this.wrap?.replaceWith(this.input);
    const input = this.input;
    for (const [name, value] of Object.entries(this._original)) {
      if (value === null) input.removeAttribute(name);
      else input.setAttribute(name, value);
    }
    if (this._addedClass) input.classList.remove('tuc-input');
    // Sem isto o Tucano.init seguinte pulava o campo, que ficava sem componente.
    input.removeAttribute('data-tuc-ready');
    delete input._tucano;
  }

  /* ---------------------------------------------------------------- *
   * Setup                                                             *
   * ---------------------------------------------------------------- */

  _buildPanel() {
    this.panel = el('div', {
      class: 'tuc-dp',
      role: 'dialog',
      'aria-label': this.isRange ? T.dialogRange : T.dialog,
      id: this.id,
    });
    /*
     * Anuncio da troca de mes numa regiao que o render nao refaz. Com o
     * aria-live no rotulo do cabecalho, a regiao era recriada a cada render, e
     * leitor de tela nao anuncia regiao que acabou de nascer.
     */
    this._live = el('div', { class: 'tuc-dp__live', 'aria-live': 'polite' });
    this.panel.append(this._live);
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
    return matchMedia('(pointer: coarse)').matches;
  }

  _setupTarget() {
    const input = this.input;
    input.setAttribute('autocomplete', 'off');
    if (!input.placeholder) input.placeholder = this._placeholder();
    if (this.native) return this._setupNative();

    /*
     * Layout compacto: tela estreita E ponteiro de toque. O 40rem espelha o
     * breakpoint do CSS (core/tokens.css) — os dois precisam concordar. A
     * condicao de toque entra junto para nao desabilitar a digitacao numa
     * janela estreita de desktop.
     *
     * Reavaliado quando a condicao muda: decidido so na montagem, girar o
     * tablet ou alargar a janela deixava o campo sem digitacao e sem mascara.
     */
    const compact = matchMedia('(max-width: 40rem) and (pointer: coarse)');
    this._applyCompact(compact.matches);
    this._cleanups.push(on(compact, 'change', (e) => this._applyCompact(e.matches)));

    /*
     * Em telas de toque o campo nao recebe foco. O iOS aplica zoom ao focar
     * qualquer input com menos de 16px — e essa fonte e do projeto, nao nossa,
     * entao nao da para resolver por CSS daqui. Sem foco tambem nao sobe o
     * teclado, que cobriria o calendario. Quem digita e o desktop; no celular
     * a entrada e o proprio painel.
     */
    this._cleanups.push(
      on(input, 'pointerdown', (e) => {
        if (!this._isCompact) return;
        e.preventDefault();
        this.isOpen ? this.close({ restoreFocus: false }) : this.open();
      }),
      on(input, 'input', (e) => { if (this._mask) this._onMaskInput(e); }),
    );
    /*
     * combobox, e nao o textbox implicito do <input>: aria-expanded nao e
     * permitido num campo de texto comum, e o leitor de tela ignora o atributo
     * invalido. O combobox e o papel do ARIA para campo que abre um painel.
     */
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-haspopup', 'dialog');
    input.setAttribute('aria-expanded', 'false');
    this._addIsoInput(input);

    /*
     * Chegar de Tab nao abre o calendario. Quem tabula por um formulario para
     * alcancar o botao de salvar nao deveria levar um painel na cara a cada
     * campo, cobrindo o proximo — e era isso que fazia os paineis se empilharem.
     * Abre com seta para baixo, Espaco com o campo vazio, ou clique.
     */
    this._cleanups.push(
      on(input, 'click', () => { if (!this._suppressOpen && !this._isCompact) this.open(); }),
      on(input, 'keydown', (e) => {
        if (e.key === 'ArrowDown' && !this.isOpen) { e.preventDefault(); this.open(); this._focusGrid(); }
        /*
         * Espaco tambem abre, com a ressalva de o campo estar vazio: em modo
         * com hora se digita "07/09/2026 14:30", e ali o espaco e digitacao.
         *
         * Enter de proposito nao abre. Este e um campo de texto dentro de um
         * <form>, e Enter num campo de texto envia o formulario — e o que
         * qualquer pessoa espera depois de digitar a data. Sequestrar a tecla
         * para abrir o calendario quebraria o envio em silencio, em todo form
         * que ja existe.
         */
        else if (e.key === ' ' && !this.isOpen && !input.value) { e.preventDefault(); this.open(); this._focusGrid(); }
        // O Escape nao passa por aqui: com o painel aberto quem o trata e o Popover.
        else if (e.key === 'Enter' && this.isOpen) { e.preventDefault(); this._commitTyped(); this.close(); }
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

  /** Liga ou desliga o layout compacto: campo so de toque, sem mascara. */
  _applyCompact(compact) {
    this._isCompact = compact;
    const input = this.input;
    input.readOnly = compact || this._original.readonly !== null;
    this._mask = compact ? null : this._maskTemplate();
    this._maskDigits = input.value.replace(/\D/g, '');
    if (this._mask) input.setAttribute('inputmode', 'numeric');
    else if (this._original.inputmode === null) input.removeAttribute('inputmode');
  }

  /**
   * Input hidden com ISO, depois de `after`: o visivel mostra o formato do
   * locale, o Django recebe ISO. Leva o `isoName` ou toma o `name` do campo.
   */
  _addIsoInput(after) {
    const name = this.opts.isoName || this.input.name;
    if (!name) return;
    if (!this.opts.isoName) this.input.removeAttribute('name');
    this.isoInput = el('input', { type: 'hidden', name });
    after.after(this.isoInput);
  }

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
    const { min, max, time } = this.opts;

    this.overlay = el('input', {
      type: time ? 'datetime-local' : 'date',
      class: 'tuc-native',
      tabindex: -1,
      'aria-hidden': 'true',
    });
    if (min) this.overlay.min = this._nativeValue(min);
    // Com hora, o limite e o fim do dia: meia-noite bloqueava todo horario do ultimo dia.
    if (max) this.overlay.max = this._nativeValue(time ? new Date(max.getFullYear(), max.getMonth(), max.getDate(), 23, 59, 59) : max);
    if (time) this.overlay.step = this.opts.seconds ? 1 : this.opts.minuteStep * 60;

    this.wrap = el('span', { class: 'tuc-native-wrap' });
    input.replaceWith(this.wrap);
    this.wrap.append(input, this.overlay);

    // O hidden com o `name` continua sendo quem posta, igual ao desktop.
    this._addIsoInput(this.wrap);

    this._cleanups.push(on(this.overlay, 'change', () => {
      if (this._emitting) return;
      this.setValue(parseISO(this.overlay.value));
    }));
  }

  _nativeValue(date = this.start) {
    if (!isValid(date)) return '';
    return this.opts.time ? toISODateTime(date, this.opts.seconds) : toISODate(date);
  }

  /**
   * Date entra como esta; texto passa pelo parse do idioma, que tambem entende
   * ISO. O fallback antigo, `new Date(texto)`, lia "07/09/2026" no formato
   * americano e fazia 7 de setembro virar 9 de julho num campo em portugues.
   */
  _toDate(value) {
    if (value instanceof Date) return isValid(value) ? clone(value) : null;
    return parseUserInput(value, this.opts.locale);
  }

  /** Le um valor em texto (o `value` do campo ou da opcao) para start/end, sem emitir. */
  _readValue(raw) {
    this.start = null;
    this.end = null;
    if (!raw) return;
    if (!this.isRange) { this.start = this._normalize(this._toDate(raw)); return; }
    /*
     * O par em ISO separado por virgula e o que o proprio componente posta — e
     * o que o Django devolve ao campo quando o formulario volta com erro. Ele
     * vem antes do separador de digitacao, que ja cortou a data ISO no meio:
     * "2026-03-01,2026-03-15" virava 31/12/2025 — 01/03/2001, calado.
     */
    const iso = String(raw).match(/^\s*(\d{4}-\d{2}-\d{2}[T\d:.]*)\s*,\s*(\d{4}-\d{2}-\d{2}[T\d:.]*)\s*$/);
    const [a, b] = iso ? [iso[1], iso[2]] : String(raw).split(RANGE_SEPARATOR);
    this.start = this._normalize(this._toDate(a));
    this.end = this._normalize(this._toDate(b));
  }

  /** Depois do reset do formulario: le de novo o texto que o campo recebeu. */
  _resetFromField() {
    this.close({ restoreFocus: false });
    this._readValue(this.input.value);
    this.viewDate = this._anchorMonth();
    this._commit(true);
  }

  /**
   * Devolve null quando a data e invalida, desabilitada ou fora de min/max.
   * Fora dos limites e recusada, e nao puxada para o limite: a documentacao
   * sempre disse que ela nao e aceita, e trocar 2027 por 31/12/2026 calado
   * gravava uma data que ninguem escolheu.
   */
  _normalize(date) {
    return isValid(date) && !this._isDisabled(date) ? date : null;
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
    return startOfMonth(this.start || clampDate(new Date(), this.opts.min, this.opts.max));
  }

  /** O ultimo dia visivel na vista de dias (com dois meses, o fim do segundo). */
  _viewEnd() {
    return endOfMonth(addMonths(this.viewDate, this.opts.months - 1));
  }

  _inView(date) {
    return compareDay(date, this.viewDate) >= 0 && compareDay(date, this._viewEnd()) <= 0;
  }

  /**
   * Dia que recebe o foco: o selecionado, senao hoje, senao o primeiro dia
   * habilitado da vista. Antes era sempre o dia 1 — desabilitado quando o `min`
   * caia no meio do mes, e ai o foco nao chegava a grade.
   */
  _initialFocus() {
    for (const d of [this.start, startOfDay(new Date())]) {
      if (d && this._inView(d) && !this._isDisabled(d)) return clone(d);
    }
    for (let d = clone(this.viewDate); compareDay(d, this._viewEnd()) <= 0; d = addDays(d, 1)) {
      if (!this._isDisabled(d)) return d;
    }
    return clone(this.viewDate);
  }

  /**
   * Gabarito da mascara derivado do formato de exibicao, entao ele acompanha o
   * locale sozinho. Formatos com nome de mes ou AM/PM nao sao mascaraveis —
   * nesse caso devolve null e o campo segue como texto livre (o parse tolerante
   * continua valendo).
   */
  _maskTemplate() {
    const widths = { yyyy: 4, yy: 2, MM: 2, M: 2, dd: 2, d: 2, HH: 2, H: 2, hh: 2, h: 2, mm: 2, m: 2, ss: 2, s: 2 };
    const nonNumeric = /MMMM|MMM|EEEE|EEE|(^|[^'])a([^']|$)/;
    const f = this._displayFormat();
    if (nonNumeric.test(f)) return null;
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
    const deleting = e.inputType?.startsWith('delete');

    let digits = raw.replace(/\D/g, '');
    let before = raw.slice(0, caret).replace(/\D/g, '').length;

    // Digitos iguais aos de antes = so um separador foi apagado. Nesse caso
    // removemos o digito vizinho ao cursor — senao a mascara recolocaria o
    // separador na hora e a tecla nao faria nada.
    if (deleting && digits === this._maskDigits) {
      const forward = e.inputType === 'deleteContentForward';
      const idx = forward ? before : before - 1;
      if (idx >= 0 && idx < digits.length) {
        digits = digits.slice(0, idx) + digits.slice(idx + 1);
        if (!forward) before -= 1;
      }
    }
    digits = digits.slice(0, this._maskSlots());

    const masked = maskFormat(digits, this._mask);
    this._maskDigits = digits;
    input.value = masked;
    const pos = caretAfterDigits(masked, Math.min(before, digits.length));
    input.setSelectionRange(pos, pos);

    if (digits.length === this._maskSlots()) this._previewTyped();
  }

  /**
   * Com a mascara completa, leva o calendario ate a data digitada. So a vista
   * anda: valor, hidden e evento ficam para o Enter ou para a saida do campo.
   * Quando a previa gravava o valor, o commit achava tudo igual e nao emitia
   * nada — e o Escape ja nao tinha o que descartar.
   */
  _previewTyped() {
    const typed = this._parseTyped(this.input.value);
    if (!typed || !this.isOpen) return;
    this.viewDate = startOfMonth(typed.start);
    this.focusDate = clone(typed.start);
    this._render();
  }

  /**
   * Le o texto do campo: { start, end }, ou null quando nao vira valor. Periodo
   * sem fim valido e recusado inteiro, porque nao existe meio intervalo.
   */
  _parseTyped(raw) {
    const [a, b] = this.isRange ? raw.split(RANGE_SEPARATOR) : [raw];
    const start = this._keepTime(parseUserInput(a, this.opts.locale), this.start);
    const end = this.isRange ? this._keepTime(parseUserInput(b, this.opts.locale), this.end) : null;
    return start && (end || !this.isRange) ? { start, end } : null;
  }

  _placeholder() {
    // Cada letra do formato vira a do idioma: "yyyy" e "aaaa" em portugues.
    const sample = this._displayFormat().replace(/[yMdHhms]/g,
      (c) => T.placeholderLetters['yMdhms'.indexOf(c === 'H' ? 'h' : c)]);
    return this.isRange ? `${sample} — ${sample}` : sample;
  }

  /* ---------------------------------------------------------------- *
   * Valor <-> input                                                   *
   * ---------------------------------------------------------------- */

  /** Hora no formato do idioma: 12 horas com AM/PM onde o campo mostra assim. */
  _timeFormat() {
    const h12 = this.L.hour12;
    return `${h12 ? 'hh' : 'HH'}:mm${this.opts.seconds ? ':ss' : ''}${h12 ? ' a' : ''}`;
  }

  _displayFormat() {
    return this.opts.time ? `${this.opts.format} ${this._timeFormat()}` : this.opts.format;
  }

  _displayValue() {
    const f = this._displayFormat();
    if (!this.start) return '';
    const a = format(this.start, f, this.opts.locale);
    if (!this.isRange) return a;
    return this.end ? `${a} — ${format(this.end, f, this.opts.locale)}` : a;
  }

  _isoValue() {
    if (!this.start) return '';
    return this.isRange ? `${this._nativeValue()}${this.end ? `,${this._nativeValue(this.end)}` : ''}` : this._nativeValue();
  }

  _syncTarget() {
    this.input.value = this._displayValue();
    // O texto escrito por nos: o que diferir dele foi digitado.
    this._shown = this.input.value;
    // O overlay guarda o ISO: e dele que o seletor do sistema parte.
    if (this.overlay) this.overlay.value = this._nativeValue();
    if (this.isoInput) this.isoInput.value = this._isoValue();
    // Mantem o contador da mascara alinhado com o texto escrito por codigo.
    if (this._mask) this._maskDigits = this.input.value.replace(/\D/g, '');
  }

  /**
   * Confirma o que esta em start/end: vira o valor salvo (o que fechar o painel
   * nao desfaz), vai para o campo e o hidden e, sem `silent`, emite.
   */
  _commit(silent = false) {
    this.pendingRange = false;
    this.hover = null;
    this._saved = [this.start, this.end];
    this._syncTarget();
    // Fechado, o painel e refeito ao abrir; refazer aqui era trabalho jogado fora.
    if (this.isOpen) this._render();
    if (!silent) this._emit();
  }

  _commitTyped() {
    const raw = this.input.value.trim();
    // Texto identico ao que escrevemos: nada a reinterpretar — e evita emitir de novo.
    if (raw === this._shown) return;
    if (!raw) { this.clear(); return; }
    const typed = this._parseTyped(raw);
    // Recusado: volta o valor anterior, como com texto que nao vira data.
    if (typed) this.setValue(this.isRange ? typed : typed.start);
    else this._syncTarget();
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
      this.input.dispatchEvent(new Event('change', { bubbles: true }));
    } finally {
      this._emitting = false;
    }
  }

  /* ---------------------------------------------------------------- *
   * Selecao                                                           *
   * ---------------------------------------------------------------- */

  _selectDay(date) {
    if (this._isDisabled(date)) return;
    this.focusDate = clone(date);
    const keepTime = (target, source) => (this.opts.time && source ? withTime(target, source) : target);

    if (!this.isRange) {
      this.start = keepTime(clone(date), this.start);
    } else if (!this.pendingRange || !this.start || this.end) {
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
    this._picked(true);
  }

  /**
   * Escolha feita no painel. Com autoApply ela vale na hora (e o dia e o
   * atalho fecham o painel); sem autoApply fica pendente ate o Aplicar, e
   * fechar de outro jeito a descarta. Antes cada clique ja emitia, o Aplicar
   * emitia de novo e fechar fora mantinha a mudanca — o botao nao segurava nada.
   */
  _picked(closes) {
    if (this.pendingRange || !this.opts.autoApply) { this._render(); return; }
    this._commit();
    if (closes) this.close();
  }

  _applyPreset(preset) {
    const { min, max, time } = this.opts;
    const range = preset.value();
    this.start = this._normalize(clampDate(range.start, min, max));
    let end = clampDate(range.end, min, max);
    // Com hora, o atalho vai ate o fim do ultimo dia: "Hoje" era 00:00 — 00:00.
    if (time && isValid(end)) end = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, this.opts.seconds ? 59 : 0);
    this.end = this._normalize(end);
    this.pendingRange = false;
    this.viewDate = this._anchorMonth();
    this._picked(true);
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
    this._picked(false);
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
    /*
     * O render troca todos os elementos, e o que tinha foco saia do DOM: cada
     * clique ou Enter numa seta, rotulo, atalho ou hora mandava o foco para o
     * <body>. Guardamos a chave do controle focado para devolver o foco ao
     * equivalente.
     */
    const active = document.activeElement;
    const focusKey = this.panel.contains(active) ? (active.classList.contains('tuc-dp__day') ? 'day' : active.dataset.key) : null;

    this.panel.classList.toggle('is-picking', this.pendingRange && !!this.hover);
    // A regiao de anuncio fica: so o resto e refeito.
    for (const n of [...this.panel.children]) if (n !== this._live) n.remove();

    if (this.opts.presets && this.isRange) this.panel.insertBefore(this._renderPresets(), this._live);

    const main = el('div', { class: 'tuc-dp__main' });
    if (this.view === 'days') {
      // O dia focavel precisa estar na vista, senao a grade fica sem parada de Tab.
      if (!this.focusDate || !this._inView(this.focusDate)) this.focusDate = this._initialFocus();
      const months = el('div', { class: 'tuc-dp__months' });
      for (let i = 0; i < this.opts.months; i++) months.append(this._renderMonth(addMonths(this.viewDate, i), i));
      main.append(months);
    } else {
      main.append(this._renderPeriodView());
    }

    if (this.opts.time && this.view === 'days') main.append(this._renderTime());
    if (!this.opts.autoApply || this.opts.clearable) main.append(this._renderFooter());

    this.panel.insertBefore(main, this._live);
    const heading = [...main.querySelectorAll('.tuc-dp__label')].map((n) => n.textContent).join(' – ');
    if (this._live.textContent !== heading) this._live.textContent = heading;

    for (const n of this.panel.querySelectorAll('.tuc-dp__timelist')) {
      const prev = scrollState.get(`${n.dataset.which}|${n.dataset.unit}`);
      if (prev !== undefined) n.scrollTop = prev;
    }
    this._revealTimes();

    if (focusKey) {
      const target = focusKey === 'day'
        ? this.panel.querySelector('.tuc-dp__day[tabindex="0"]')
        : this.panel.querySelector(`[data-key="${focusKey}"]`);
      // Controle que sumiu ou ficou desativado (a seta no limite, a celula que
      // trocou de vista): o foco vai ao dia da grade, ou ao rotulo da vista.
      const fallback = this.panel.querySelector('.tuc-dp__day[tabindex="0"]') || this.panel.querySelector('.tuc-dp__label');
      (target && !target.disabled ? target : fallback)?.focus({ preventScroll: true });
    }
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
      const selected = list.querySelector('.is-selected');
      const value = selected?.textContent ?? null;
      if (this._revealed.get(key) === value) continue;
      this._revealed.set(key, value);
      if (selected) revealItem(list, selected);
    }
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
            type: 'button', class: 'tuc-btn is-ghost is-icon is-sm tuc-dp__nav', 'aria-label': T.previousMonth,
            dataset: { key: 'prev' }, disabled: this._navBlocked(-1), onclick: () => this._shiftView(-1),
          }, [icon(ICON_CHEVRON_LEFT)])
        : el('span', { class: 'tuc-btn is-icon is-sm tuc-dp__nav is-placeholder', 'aria-hidden': 'true' }),
      el('button', {
        type: 'button', class: 'tuc-btn is-ghost is-sm tuc-dp__label', dataset: { key: `label-${index}` },
        onclick: () => { this.view = 'months'; this.viewDate = clone(monthDate); this._render(); },
      }, [`${this.L.monthsLong[month]} ${year}`, icon(ICON_CHEVRON_DOWN, 14)]),
      showNext
        ? el('button', {
            type: 'button', class: 'tuc-btn is-ghost is-icon is-sm tuc-dp__nav', 'aria-label': T.nextMonth,
            dataset: { key: 'next' }, disabled: this._navBlocked(1), onclick: () => this._shiftView(1),
          }, [icon(ICON_CHEVRON_RIGHT)])
        : el('span', { class: 'tuc-btn is-icon is-sm tuc-dp__nav is-placeholder', 'aria-hidden': 'true' }),
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
    // Onde cai a segunda-feira na linha: a semana ISO e a dela. Pela primeira
    // celula, com a semana comecando no domingo, o numero saia uma semana atras.
    const monday = (8 - this.opts.firstDayOfWeek) % 7;
    for (let r = 0; r < cells.length; r += 7) {
      // `row` e exigido pelo grid; no CSS a linha e `display: contents`.
      const row = el('div', { class: 'tuc-dp__row', role: 'row' });
      if (this.opts.weekNumbers) {
        row.append(el('span', { class: 'tuc-dp__weeknum', role: 'rowheader', text: String(isoWeek(cells[r + monday].date)) }));
      }
      for (const cell of cells.slice(r, r + 7)) row.append(this._renderDay(cell, month));
      grid.append(row);
    }

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
    const distinct = rStart && rEnd && !isSameDay(rStart, rEnd);

    const classes = ['tuc-dp__day'];
    if (outside) classes.push('is-outside');
    if (this._isDisabled(date)) classes.push('is-disabled');
    if (isSameDay(date, new Date())) classes.push('is-today');
    if (isStart || isEnd) classes.push('is-selected');
    if (isStart && distinct) classes.push('is-start');
    if (isEnd && distinct) classes.push('is-end');
    if (inRange) classes.push('is-in-range');
    // So a ponta sob o cursor e "preview"; o tom da faixa vem de .is-picking.
    if (this.pendingRange && isEnd) classes.push('is-preview');
    return classes;
  }

  /**
   * Parada de Tab da grade: so o dia do foco, e so dentro do proprio mes. Com
   * dois meses lado a lado o mesmo dia aparece de novo como "de fora" no
   * vizinho, e os dois ficavam com tabindex 0.
   */
  _tabStop(date, outside) {
    return !outside && isSameDay(date, this.focusDate) ? 0 : -1;
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
      const outside = date.getMonth() !== +btn.dataset.month;
      const classes = this._dayClasses(date, outside);
      btn.className = classes.join(' ');
      btn.setAttribute('aria-selected', classes.includes('is-selected') ? 'true' : 'false');
      btn.tabIndex = this._tabStop(date, outside);
    }
  }

  _renderDay(cell, month) {
    const { date, outside } = cell;
    const classes = this._dayClasses(date, outside);

    return el('button', {
      type: 'button',
      class: classes.join(' '),
      tabindex: this._tabStop(date, outside),
      /*
       * aria-disabled, e nao disabled: botao desativado nao recebe foco, e a
       * seta que caia num fim de semana bloqueado mandava o foco para o <body>.
       * O clique continua sem efeito — _selectDay confere o dia.
       */
      'aria-disabled': this._isDisabled(date) ? 'true' : null,
      role: 'gridcell',
      'aria-selected': classes.includes('is-selected') ? 'true' : 'false',
      'aria-label': this._dayName.format(date),
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
    // Janela de doze anos que contem o ano da vista.
    const first = year - (year % 12);
    const wrap = el('div', { class: 'tuc-dp__period' });
    const { min, max } = this.opts;
    // Periodo inteiro fora de min/max: celula e seta desativadas, como na vista de dias.
    const outside = (from, to) => (min && compareDay(to, min) < 0) || (max && compareDay(from, max) > 0);
    const years = (a, b) => outside(new Date(a, 0, 1), new Date(b, 11, 31));

    const step = isMonths ? 1 : 12;
    const header = el('div', { class: 'tuc-dp__header' }, [
      el('button', {
        type: 'button', class: 'tuc-btn is-ghost is-icon is-sm tuc-dp__nav', 'aria-label': T.previous,
        dataset: { key: 'prev' }, disabled: isMonths ? years(year - 1, year - 1) : years(first - 12, first - 1),
        onclick: () => { this.viewDate = addYears(this.viewDate, -step); this._render(); },
      }, [icon(ICON_CHEVRON_LEFT)]),
      el('button', {
        type: 'button', class: 'tuc-btn is-ghost is-sm tuc-dp__label', dataset: { key: 'label-0' },
        onclick: () => { this.view = isMonths ? 'years' : 'days'; this._render(); },
      }, [isMonths ? String(year) : `${first} – ${first + 11}`]),
      el('button', {
        type: 'button', class: 'tuc-btn is-ghost is-icon is-sm tuc-dp__nav', 'aria-label': T.next,
        dataset: { key: 'next' }, disabled: isMonths ? years(year + 1, year + 1) : years(first + 12, first + 23),
        onclick: () => { this.viewDate = addYears(this.viewDate, step); this._render(); },
      }, [icon(ICON_CHEVRON_RIGHT)]),
    ]);

    const grid = el('div', { class: 'tuc-dp__periodgrid' });
    const items = isMonths
      ? this.L.monthsShort.map((label, m) => ({ label, date: new Date(year, m, 1), off: outside(new Date(year, m, 1), new Date(year, m + 1, 0)) }))
      : Array.from({ length: 12 }, (_, i) => {
          const y = first + i;
          return { label: String(y), date: new Date(y, this.viewDate.getMonth(), 1), off: years(y, y) };
        });

    items.forEach((item, i) => {
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
        disabled: item.off,
        dataset: { key: `cell-${i}` },
        onclick: () => {
          this.viewDate = startOfDay(item.date);
          this.view = isMonths ? 'days' : 'months';
          this._render();
        },
      }));
    });

    wrap.append(header, grid);
    return wrap;
  }

  _renderTime() {
    const row = el('div', { class: 'tuc-dp__time' });
    const targets = this.isRange ? [['start', T.start], ['end', T.end]] : [['start', T.time]];

    for (const [which, label] of targets) {
      const value = which === 'end' ? this.end : this.start;
      // No formato do campo: 13:05 no leitor e 01:05 PM no campo nao batiam.
      const readout = value ? format(value, this._timeFormat(), this.opts.locale) : '--:--';

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

  /*
   * Cada coluna e um grupo de botoes com uma parada de Tab so (tabindex
   * itinerante): as setas andam dentro da coluna e Enter ou Espaco escolhem.
   * Antes cada botao era uma parada — 194 Tabs num painel com segundos — e
   * listbox com botoes focaveis dentro nao e ARIA valido.
   */
  _renderTimeList(which, unit, count, step, current) {
    const list = el('div', {
      class: 'tuc-dp__timelist', role: 'group',
      'aria-label': { h: T.hour, m: T.minute, s: T.second }[unit],
      dataset: { which, unit },
    });
    // Com step > 1 o minuto atual cai no degrau mais proximo abaixo.
    const selectedValue = current === null ? null : Math.floor(current / step) * step;
    const disabled = !(which === 'end' ? this.end : this.start);
    for (let v = 0; v < count; v += step) {
      const selected = selectedValue === v;
      list.append(el('button', {
        type: 'button',
        class: `tuc-dp__timeitem${selected ? ' is-selected' : ''}`,
        text: String(v).padStart(2, '0'),
        // Em 12 horas o nome lido e o do campo ("1 PM"), nao o 13 da coluna.
        'aria-label': unit === 'h' && this.L.hour12 ? format(new Date(2000, 0, 1, v), 'h a') : null,
        'aria-pressed': selected ? 'true' : 'false',
        tabindex: v === (selectedValue ?? 0) ? 0 : -1,
        disabled,
        dataset: { key: `${which}-${unit}-${v}` },
        onclick: () => this._setTime(which, unit, v),
      }));
    }
    return list;
  }

  _renderPresets() {
    const wrap = el('div', { class: 'tuc-dp__presets' });
    buildPresets(this.opts.presets).forEach((preset, i) => {
      const r = preset.value();
      const active = this.start && this.end && isSameDay(this.start, r.start) && isSameDay(this.end, r.end);
      wrap.append(el('button', {
        type: 'button',
        class: `tuc-btn is-ghost is-sm tuc-dp__preset${active ? ' is-selected' : ''}`,
        title: preset.label,
        dataset: { key: `preset-${i}` },
        onclick: () => this._applyPreset(preset),
      }, [el('span', { text: preset.label })]));
    });
    return wrap;
  }

  _renderFooter() {
    const footer = el('div', { class: 'tuc-dp__footer' });
    if (this.opts.clearable) {
      footer.append(el('button', {
        type: 'button', class: 'tuc-btn is-ghost is-sm', text: T.clear, dataset: { key: 'clear' },
        onclick: () => { this.clear(); if (this.opts.autoApply) this.close(); },
      }));
    }
    footer.append(el('span', { class: 'tuc-dp__spacer' }));
    if (!this.opts.autoApply) {
      footer.append(el('button', {
        type: 'button', class: 'tuc-btn is-primary is-sm', text: T.apply, dataset: { key: 'apply' },
        disabled: !this.start || (this.isRange && !this.end),
        onclick: () => { this._commit(); this.close(); },
      }));
    }
    return footer;
  }

  /* ---------------------------------------------------------------- *
   * Navegacao                                                         *
   * ---------------------------------------------------------------- */

  /*
   * Abrir pelo teclado leva o foco ao dia, como no padrao de date picker do ARIA
   * APG. Antes o foco ficava no campo: as setas nao chegavam a grade, e o Tab
   * seguinte fechava o painel — quem so usa teclado nunca escolhia um dia. O
   * clique nao passa por aqui, porque quem clica pode querer digitar.
   */
  _focusGrid() {
    this.panel.querySelector('.tuc-dp__day[tabindex="0"]')?.focus();
  }

  _shiftView(delta) {
    this.viewDate = addMonths(this.viewDate, delta);
    this._render();
  }

  /** Bloqueia a seta quando o mes vizinho ja esta todo fora de min/max. */
  _navBlocked(delta) {
    const target = addMonths(this.viewDate, delta === 1 ? this.opts.months : -1);
    if (delta < 0 && this.opts.min) return compareDay(endOfMonth(target), this.opts.min) < 0;
    if (delta > 0 && this.opts.max) return compareDay(target, this.opts.max) > 0;
    return false;
  }

  _onPanelKeydown(e) {
    if (e.target.classList.contains('tuc-dp__timeitem')) { this._onTimeKeydown(e); return; }
    if (!e.target.classList.contains('tuc-dp__day')) return;
    const moves = {
      ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7,
    };
    let next = null;
    if (e.key in moves) next = addDays(this.focusDate, moves[e.key]);
    else if (e.key === 'PageUp') next = addMonths(this.focusDate, e.shiftKey ? -12 : -1);
    else if (e.key === 'PageDown') next = addMonths(this.focusDate, e.shiftKey ? 12 : 1);
    else if (e.key === 'Home' || e.key === 'End') {
      const weekday = (this.focusDate.getDay() - this.opts.firstDayOfWeek + 7) % 7;
      next = addDays(this.focusDate, e.key === 'Home' ? -weekday : 6 - weekday);
    }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._selectDay(this.focusDate); return; }
    else return;

    e.preventDefault();
    this.focusDate = clampDate(next, this.opts.min, this.opts.max);
    // Traz o mes do foco para dentro da janela visivel.
    const last = addMonths(this.viewDate, this.opts.months - 1);
    if (compareDay(this.focusDate, this.viewDate) < 0) this.viewDate = startOfMonth(this.focusDate);
    else if (compareDay(this.focusDate, endOfMonth(last)) > 0) this.viewDate = addMonths(startOfMonth(this.focusDate), 1 - this.opts.months);
    // O render devolve o foco ao dia com tabindex 0, que agora e o focusDate.
    this._render();
  }

  /** Setas, Home e End dentro de uma coluna de hora: movem o foco, sem escolher. */
  _onTimeKeydown(e) {
    const item = e.target;
    const items = [...item.parentElement.children];
    const index = { ArrowUp: items.indexOf(item) - 1, ArrowDown: items.indexOf(item) + 1, Home: 0, End: items.length - 1 }[e.key];
    if (index === undefined) return;
    e.preventDefault();
    const next = items[Math.max(0, Math.min(items.length - 1, index))];
    item.tabIndex = -1;
    next.tabIndex = 0;
    next.focus({ preventScroll: true });
    revealItem(item.parentElement, next);
  }
}

/* ------------------------------------------------------------------ *
 * Presets                                                             *
 * ------------------------------------------------------------------ */

function buildPresets(option) {
  if (Array.isArray(option)) return option;
  const today = () => startOfDay(new Date());
  return [
    { label: T.today, value: () => ({ start: today(), end: today() }) },
    { label: T.yesterday, value: () => ({ start: addDays(today(), -1), end: addDays(today(), -1) }) },
    { label: T.last7Days, value: () => ({ start: addDays(today(), -6), end: today() }) },
    { label: T.last30Days, value: () => ({ start: addDays(today(), -29), end: today() }) },
    { label: T.thisMonth, value: () => { const t = today(); return { start: new Date(t.getFullYear(), t.getMonth(), 1), end: new Date(t.getFullYear(), t.getMonth() + 1, 0) }; } },
    { label: T.lastMonth, value: () => { const t = today(); return { start: new Date(t.getFullYear(), t.getMonth() - 1, 1), end: new Date(t.getFullYear(), t.getMonth(), 0) }; } },
    { label: T.thisYear, value: () => { const t = today(); return { start: new Date(t.getFullYear(), 0, 1), end: new Date(t.getFullYear(), 11, 31) }; } },
  ];
}

/**
 * Centraliza o item da coluna quando ele esta fora de vista.
 * Mexe so no scroll da lista — scrollIntoView arrastaria a pagina inteira junto.
 */
function revealItem(list, item) {
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
 *
 * Parece o apply/cursorAfter de core/mask.js, e nao e o mesmo de proposito. O
 * gabarito daqui vem do formato de data do idioma, e um literal entre aspas do
 * formato entra como esta, com letras. La, `A` e `*` sao marcadores e o cursor
 * conta letras; aqui so `#` e marcador e o cursor conta so digitos. Unificar
 * erraria a mascara e o cursor num formato com literal, por dezenas de bytes.
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
      native: d.native === 'auto' ? 'auto' : d.native === 'true',
    }));
  }
  return out;
}
