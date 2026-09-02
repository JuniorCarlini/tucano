var Tucano = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/js/index.js
  var index_exports = {};
  __export(index_exports, {
    ColorPicker: () => ColorPicker,
    DatePicker: () => DatePicker,
    Popover: () => Popover,
    Select: () => Select,
    autoInitColorPickers: () => autoInit3,
    autoInitDatePickers: () => autoInit,
    autoInitSelects: () => autoInit2,
    color: () => color_exports,
    dates: () => dates_exports,
    init: () => init
  });

  // src/js/core/dates.js
  var dates_exports = {};
  __export(dates_exports, {
    MS_DAY: () => MS_DAY,
    addDays: () => addDays,
    addMonths: () => addMonths,
    addYears: () => addYears,
    buildMonthGrid: () => buildMonthGrid,
    clampDate: () => clampDate,
    clone: () => clone,
    compareDay: () => compareDay,
    daysInMonth: () => daysInMonth,
    endOfMonth: () => endOfMonth,
    format: () => format,
    getLocaleData: () => getLocaleData,
    isBetween: () => isBetween,
    isMonthFirst: () => isMonthFirst,
    isSameDay: () => isSameDay,
    isSameMonth: () => isSameMonth,
    isValid: () => isValid,
    localeDatePattern: () => localeDatePattern,
    parseISO: () => parseISO,
    parseUserInput: () => parseUserInput,
    startOfDay: () => startOfDay,
    startOfMonth: () => startOfMonth,
    toISODate: () => toISODate,
    toISODateTime: () => toISODateTime,
    withTime: () => withTime
  });
  var MS_DAY = 864e5;
  function startOfDay(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }
  function isValid(d) {
    return d instanceof Date && !Number.isNaN(d.getTime());
  }
  function clone(d) {
    return new Date(d.getTime());
  }
  function addDays(d, n) {
    const x = clone(d);
    x.setDate(x.getDate() + n);
    return x;
  }
  function addMonths(d, n) {
    const x = clone(d);
    const day = x.getDate();
    x.setDate(1);
    x.setMonth(x.getMonth() + n);
    x.setDate(Math.min(day, daysInMonth(x.getFullYear(), x.getMonth())));
    return x;
  }
  function addYears(d, n) {
    return addMonths(d, n * 12);
  }
  function daysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }
  function startOfMonth(d) {
    const x = startOfDay(d);
    x.setDate(1);
    return x;
  }
  function endOfMonth(d) {
    const x = startOfDay(d);
    x.setMonth(x.getMonth() + 1, 0);
    return x;
  }
  function compareDay(a, b) {
    const av = a.getFullYear() * 1e4 + a.getMonth() * 100 + a.getDate();
    const bv = b.getFullYear() * 1e4 + b.getMonth() * 100 + b.getDate();
    return av === bv ? 0 : av < bv ? -1 : 1;
  }
  function isSameDay(a, b) {
    return isValid(a) && isValid(b) && compareDay(a, b) === 0;
  }
  function isSameMonth(a, b) {
    return isValid(a) && isValid(b) && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
  }
  function isBetween(d, start, end) {
    return compareDay(d, start) >= 0 && compareDay(d, end) <= 0;
  }
  function clampDate(d, min, max) {
    if (min && compareDay(d, min) < 0) return clone(min);
    if (max && compareDay(d, max) > 0) return clone(max);
    return d;
  }
  function withTime(day, time) {
    const x = clone(day);
    x.setHours(time.getHours(), time.getMinutes(), time.getSeconds(), 0);
    return x;
  }
  function buildMonthGrid(year, month, firstDayOfWeek = 0) {
    const first = new Date(year, month, 1);
    const offset = (first.getDay() - firstDayOfWeek + 7) % 7;
    const start = addDays(first, -offset);
    const cells = [];
    for (let i = 0; i < 42; i++) {
      const date = addDays(start, i);
      cells.push({ date, outside: date.getMonth() !== month });
    }
    return cells;
  }
  var localeCache = /* @__PURE__ */ new Map();
  function getLocaleData(locale) {
    if (localeCache.has(locale)) return localeCache.get(locale);
    const monthsLong = [];
    const monthsShort = [];
    const fmtLong = new Intl.DateTimeFormat(locale, { month: "long" });
    const fmtShort = new Intl.DateTimeFormat(locale, { month: "short" });
    for (let m = 0; m < 12; m++) {
      const d = new Date(2021, m, 1);
      monthsLong.push(capitalize(fmtLong.format(d)));
      monthsShort.push(capitalize(fmtShort.format(d).replace(".", "")));
    }
    const weekdaysNarrow = [];
    const weekdaysShort = [];
    const fmtNarrow = new Intl.DateTimeFormat(locale, { weekday: "narrow" });
    const fmtWdShort = new Intl.DateTimeFormat(locale, { weekday: "short" });
    for (let i = 0; i < 7; i++) {
      const d = new Date(2021, 7, 1 + i);
      weekdaysNarrow.push(fmtNarrow.format(d).toUpperCase());
      weekdaysShort.push(capitalize(fmtWdShort.format(d).replace(".", "")));
    }
    const data = {
      monthsLong,
      monthsShort,
      weekdaysNarrow,
      weekdaysShort,
      firstDayOfWeek: resolveFirstDayOfWeek(locale),
      hour12: resolveHour12(locale)
    };
    localeCache.set(locale, data);
    return data;
  }
  function resolveFirstDayOfWeek(locale) {
    try {
      const loc = new Intl.Locale(locale);
      const info = typeof loc.getWeekInfo === "function" ? loc.getWeekInfo() : loc.weekInfo;
      if (info && info.firstDay) return info.firstDay === 7 ? 0 : info.firstDay;
    } catch {
    }
    const lang = String(locale).toLowerCase();
    const sundayFirst = ["en-us", "en-ca", "ja", "pt-br", "es-mx", "ko", "zh-cn", "he", "ar"];
    return sundayFirst.some((l) => lang.startsWith(l)) ? 0 : 1;
  }
  function resolveHour12(locale) {
    try {
      const parts = new Intl.DateTimeFormat(locale, { hour: "numeric" }).formatToParts(new Date(2021, 0, 1, 13));
      return parts.some((p) => p.type === "dayPeriod");
    } catch {
      return false;
    }
  }
  function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  var pad = (n, len = 2) => String(n).padStart(len, "0");
  function format(date, pattern, locale = "pt-BR") {
    if (!isValid(date)) return "";
    const L = getLocaleData(locale);
    const h12 = date.getHours() % 12 || 12;
    const map = {
      yyyy: () => pad(date.getFullYear(), 4),
      yy: () => pad(date.getFullYear() % 100),
      MMMM: () => L.monthsLong[date.getMonth()],
      MMM: () => L.monthsShort[date.getMonth()],
      MM: () => pad(date.getMonth() + 1),
      M: () => String(date.getMonth() + 1),
      dd: () => pad(date.getDate()),
      d: () => String(date.getDate()),
      EEEE: () => new Intl.DateTimeFormat(locale, { weekday: "long" }).format(date),
      EEE: () => L.weekdaysShort[date.getDay()],
      HH: () => pad(date.getHours()),
      H: () => String(date.getHours()),
      hh: () => pad(h12),
      h: () => String(h12),
      mm: () => pad(date.getMinutes()),
      m: () => String(date.getMinutes()),
      ss: () => pad(date.getSeconds()),
      s: () => String(date.getSeconds()),
      a: () => date.getHours() < 12 ? "AM" : "PM"
    };
    const tokens = Object.keys(map).sort((a, b) => b.length - a.length);
    const re = new RegExp(`'[^']*'|${tokens.join("|")}`, "g");
    return pattern.replace(re, (t) => t.startsWith("'") ? t.slice(1, -1) : map[t]());
  }
  function toISODate(date) {
    return isValid(date) ? `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` : "";
  }
  function toISODateTime(date, seconds = false) {
    if (!isValid(date)) return "";
    const time = `${pad(date.getHours())}:${pad(date.getMinutes())}${seconds ? `:${pad(date.getSeconds())}` : ""}`;
    return `${toISODate(date)}T${time}`;
  }
  function parseISO(value) {
    if (!value) return null;
    if (value instanceof Date) return isValid(value) ? value : null;
    const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(String(value).trim());
    if (m) {
      const d2 = new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
      return isValid(d2) ? d2 : null;
    }
    const d = new Date(value);
    return isValid(d) ? d : null;
  }
  function parseUserInput(text, locale = "pt-BR", reference = /* @__PURE__ */ new Date()) {
    let raw = String(text || "").trim();
    if (!raw) return null;
    const iso = /^\d{4}-\d{2}-\d{2}/.test(raw) ? parseISO(raw) : null;
    if (iso) {
      iso.hasTime = /[T ]\d{2}:\d{2}/.test(raw);
      return iso;
    }
    let time = null;
    raw = raw.replace(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?/i, (_, h, m, sec, period) => {
      let hours = +h;
      if (period) hours = hours % 12 + (period.toLowerCase() === "pm" ? 12 : 0);
      time = { h: hours, m: +m, s: +(sec || 0) };
      return " ";
    }).trim();
    if (!raw && time) return null;
    const digits = raw.replace(/\D/g, "");
    const parts = raw.split(/[^\d]+/).filter(Boolean).map(Number);
    const monthFirst = isMonthFirst(locale);
    let day, month, year;
    if (parts.length >= 2) {
      [day, month] = monthFirst ? [parts[1], parts[0]] : [parts[0], parts[1]];
      year = parts[2];
    } else if (digits.length === 8) {
      const a = +digits.slice(0, 2), b = +digits.slice(2, 4);
      [day, month] = monthFirst ? [b, a] : [a, b];
      year = +digits.slice(4);
    } else if (digits.length === 4) {
      const a = +digits.slice(0, 2), b = +digits.slice(2, 4);
      [day, month] = monthFirst ? [b, a] : [a, b];
    } else {
      return null;
    }
    if (year === void 0) year = reference.getFullYear();
    else if (year < 100) year += year < 70 ? 2e3 : 1900;
    if (!(month >= 1 && month <= 12)) return null;
    if (!(day >= 1 && day <= daysInMonth(year, month - 1))) return null;
    const out = new Date(year, month - 1, day, time ? time.h : 0, time ? time.m : 0, time ? time.s : 0);
    out.hasTime = !!time;
    return out;
  }
  function isMonthFirst(locale) {
    try {
      const parts = new Intl.DateTimeFormat(locale).formatToParts(new Date(2021, 0, 2));
      const order = parts.filter((p) => p.type === "day" || p.type === "month").map((p) => p.type);
      return order[0] === "month";
    } catch {
      return false;
    }
  }
  function localeDatePattern(locale) {
    return isMonthFirst(locale) ? "MM/dd/yyyy" : "dd/MM/yyyy";
  }

  // src/js/core/dom.js
  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (value === null || value === void 0 || value === false) continue;
      if (key === "class") node.className = value;
      else if (key === "text") node.textContent = value;
      else if (key === "html") node.innerHTML = value;
      else if (key === "dataset") Object.assign(node.dataset, value);
      else if (key.startsWith("on") && typeof value === "function") {
        node.addEventListener(key.slice(2).toLowerCase(), value);
      } else node.setAttribute(key, value === true ? "" : value);
    }
    for (const child of [].concat(children)) {
      if (child === null || child === void 0 || child === false) continue;
      node.append(child.nodeType ? child : document.createTextNode(child));
    }
    return node;
  }
  function icon(path, size = 16) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", size);
    svg.setAttribute("height", size);
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("d", path);
    svg.append(p);
    return svg;
  }
  var ICONS = {
    chevronLeft: "M15 18l-6-6 6-6",
    chevronRight: "M9 18l6-6-6-6",
    chevronDown: "M6 9l6 6 6-6",
    calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
    clock: "M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2",
    x: "M18 6L6 18M6 6l12 12"
  };
  var uid = 0;
  function nextId(prefix = "ui") {
    return `${prefix}-${Date.now().toString(36)}-${(uid++).toString(36)}`;
  }
  function on(target, type, handler, options) {
    target.addEventListener(type, handler, options);
    return () => target.removeEventListener(type, handler, options);
  }

  // src/js/core/popover.js
  var Popover = class {
    constructor(anchor, panel, options = {}) {
      this.anchor = anchor;
      this.panel = panel;
      this.placement = options.placement || "bottom-start";
      this.offset = options.offset ?? 8;
      this.padding = options.padding ?? 8;
      this.appendTo = options.appendTo || document.body;
      this.matchWidth = options.matchWidth || false;
      this.onDismiss = options.onDismiss || (() => {
      });
      this.open = false;
      this._cleanups = [];
      this._reposition = this._reposition.bind(this);
    }
    show() {
      if (this.open) return;
      this.open = true;
      this.panel.style.position = "absolute";
      this.panel.style.top = "0";
      this.panel.style.left = "0";
      this.panel.style.margin = "0";
      this.appendTo.append(this.panel);
      this._reposition();
      this._cleanups.push(
        on(window, "scroll", this._reposition, true),
        on(window, "resize", this._reposition),
        on(document, "pointerdown", (e) => {
          if (!this.panel.contains(e.target) && !this.anchor.contains(e.target)) this.onDismiss("outside");
        }, true),
        on(document, "keydown", (e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            this.onDismiss("escape");
          }
        }, true)
      );
      if (typeof ResizeObserver !== "undefined") {
        this._ro = new ResizeObserver(this._reposition);
        this._ro.observe(this.panel);
        this._ro.observe(this.anchor);
      }
    }
    hide() {
      if (!this.open) return;
      this.open = false;
      this._cleanups.forEach((fn) => fn());
      this._cleanups = [];
      this._ro?.disconnect();
      this._ro = null;
      this.panel.remove();
    }
    destroy() {
      this.hide();
    }
    _reposition() {
      if (!this.open) return;
      const a = this.anchor.getBoundingClientRect();
      if (this.matchWidth) this.panel.style.minWidth = `${Math.round(a.width)}px`;
      const p = this.panel.getBoundingClientRect();
      const vw = document.documentElement.clientWidth;
      const vh = document.documentElement.clientHeight;
      const [side, align = "start"] = this.placement.split("-");
      let placeSide = side;
      const spaceBelow = vh - a.bottom - this.offset;
      const spaceAbove = a.top - this.offset;
      if (side === "bottom" && p.height > spaceBelow && spaceAbove > spaceBelow) placeSide = "top";
      if (side === "top" && p.height > spaceAbove && spaceBelow > spaceAbove) placeSide = "bottom";
      let top = placeSide === "top" ? a.top - p.height - this.offset : a.bottom + this.offset;
      let left;
      if (align === "end") left = a.right - p.width;
      else if (align === "center") left = a.left + a.width / 2 - p.width / 2;
      else left = a.left;
      left = Math.min(Math.max(left, this.padding), Math.max(this.padding, vw - p.width - this.padding));
      top = Math.min(Math.max(top, this.padding), Math.max(this.padding, vh - p.height - this.padding));
      const host = this.appendTo === document.body ? { top: window.scrollY, left: window.scrollX } : (() => {
        const r = this.appendTo.getBoundingClientRect();
        return { top: -r.top + this.appendTo.scrollTop, left: -r.left + this.appendTo.scrollLeft };
      })();
      this.panel.style.transform = `translate(${Math.round(left + host.left)}px, ${Math.round(top + host.top)}px)`;
      this.panel.dataset.side = placeSide;
    }
  };
  function trapFocus(panel) {
    const SELECTOR = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';
    const handler = (e) => {
      if (e.key !== "Tab") return;
      const items = [...panel.querySelectorAll(SELECTOR)].filter((n) => n.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    return on(panel, "keydown", handler);
  }

  // src/js/components/datepicker.js
  var DEFAULTS = {
    mode: "single",
    // 'single' | 'range'
    time: false,
    // true habilita seletor de hora
    seconds: false,
    minuteStep: 5,
    locale: void 0,
    // default: locale do documento/navegador
    format: void 0,
    // default: padrao numerico do locale
    firstDayOfWeek: void 0,
    months: void 0,
    // default: 2 em range, 1 em single
    min: null,
    max: null,
    disabledDates: null,
    // (date) => boolean
    presets: false,
    // atalhos de periodo (Hoje, Ultimos 7 dias...): opt-in
    autoApply: void 0,
    // default: true sem hora, false com hora
    clearable: true,
    weekNumbers: false,
    placement: "bottom-center",
    // centralizado no campo; as bordas da tela ainda mandam
    appendTo: void 0,
    isoName: void 0,
    // name do input hidden com o valor ISO
    openOnFocus: true,
    // 'auto' usa o seletor nativo do sistema onde o ponteiro e de toque.
    // true forca nativo, false forca o painel proprio.
    native: "auto",
    onChange: null,
    onOpen: null,
    onClose: null
  };
  var DatePicker = class {
    constructor(target, options = {}) {
      const node = typeof target === "string" ? document.querySelector(target) : target;
      if (!node) throw new Error("[DatePicker] elemento alvo nao encontrado");
      this.opts = { ...DEFAULTS, ...omitUndefined(options) };
      this.opts.locale = this.opts.locale || document.documentElement.lang || navigator.language || "pt-BR";
      this.L = getLocaleData(this.opts.locale);
      this.opts.format = this.opts.format || localeDatePattern(this.opts.locale);
      this.opts.firstDayOfWeek = this.opts.firstDayOfWeek ?? this.L.firstDayOfWeek;
      this.isRange = this.opts.mode === "range";
      this.opts.months = this.opts.months ?? (this.isRange ? 2 : 1);
      this.opts.presets = this.opts.presets ?? false;
      this.opts.autoApply = this.opts.autoApply ?? !this.opts.time;
      this.opts.min = parseISO(this.opts.min);
      this.opts.max = parseISO(this.opts.max);
      this.native = this._useNative();
      this.id = nextId("dp");
      this.isOpen = false;
      this.view = "days";
      this.start = null;
      this.end = null;
      this.hover = null;
      this.pendingRange = false;
      this._cleanups = [];
      node._tucano = this;
      this.input = node;
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
      return this.isRange ? { start: this.start && clone(this.start), end: this.end && clone(this.end) } : this.start && clone(this.start);
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
      if (this.native) {
        this.input.showPicker?.();
        return;
      }
      if (this.isOpen) return;
      this.isOpen = true;
      this.viewDate = this._anchorMonth();
      this.focusDate = clone(this.start || this.viewDate);
      this.view = "days";
      this._render();
      this.popover = new Popover(this.input, this.panel, {
        placement: this.opts.placement,
        appendTo: this.opts.appendTo || document.body,
        // Clique fora: nao devolvemos o foco, senao roubariamos de onde o usuario clicou.
        onDismiss: (reason) => this.close({ restoreFocus: reason === "escape" })
      });
      this.popover.show();
      this._revealed = null;
      this._revealTimes();
      requestAnimationFrame(() => this.panel.classList.add("is-open"));
      this._releaseFocus = trapFocus(this.panel);
      this.input.setAttribute("aria-expanded", "true");
      this.opts.onOpen?.(this);
    }
    close({ restoreFocus = true } = {}) {
      if (!this.isOpen) return;
      if (this.pendingRange) {
        this.pendingRange = false;
        this.end = null;
        this._syncTarget();
      }
      this.isOpen = false;
      this.panel.classList.remove("is-open");
      this.popover?.destroy();
      this.popover = null;
      this._releaseFocus?.();
      this._releaseFocus = null;
      this.input.setAttribute("aria-expanded", "false");
      if (restoreFocus) {
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
      this.panel = el("div", {
        class: `tuc-dp${this.isRange ? " is-range" : ""}${this.opts.time ? " is-timed" : ""}`,
        role: "dialog",
        "aria-modal": "false",
        "aria-label": this.isRange ? "Selecionar periodo" : "Selecionar data",
        id: this.id
      });
      this._cleanups.push(
        on(this.panel, "keydown", (e) => this._onPanelKeydown(e)),
        on(this.panel, "mouseleave", () => {
          if (this.pendingRange) {
            this.hover = null;
            this._paintDays();
          }
        })
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
      return typeof window !== "undefined" && !!window.matchMedia?.("(pointer: coarse)").matches;
    }
    _setupTarget() {
      if (this.native) return this._setupNative();
      const input = this.input;
      input.setAttribute("autocomplete", "off");
      this._mask = this._maskTemplate();
      this._maskDigits = "";
      if (this._mask) {
        input.setAttribute("inputmode", "numeric");
        this._cleanups.push(on(input, "input", (e) => this._onMaskInput(e)));
      }
      input.setAttribute("aria-haspopup", "dialog");
      input.setAttribute("aria-expanded", "false");
      input.setAttribute("aria-controls", this.id);
      if (!input.placeholder) input.placeholder = this._placeholder();
      if (this.opts.isoName || input.name) {
        const name = this.opts.isoName || input.name;
        if (!this.opts.isoName && input.name) input.removeAttribute("name");
        this.isoInput = el("input", { type: "hidden", name });
        input.after(this.isoInput);
      }
      this._cleanups.push(
        on(input, "focus", () => {
          if (this.opts.openOnFocus && !this._suppressOpen) this.open();
        }),
        on(input, "click", () => {
          if (!this._suppressOpen) this.open();
        }),
        on(input, "keydown", (e) => {
          if (e.key === "ArrowDown" && !this.isOpen) {
            e.preventDefault();
            this.open();
          } else if (e.key === "Enter" && this.isOpen) {
            e.preventDefault();
            this._commitTyped();
          } else if (e.key === "Escape" && this.isOpen) {
            e.preventDefault();
            this.close();
          }
        }),
        // Ignora o `change` que nos mesmos disparamos em _emit(); senao o texto
        // ja formatado seria reinterpretado como digitacao e perderia a hora.
        on(input, "change", () => {
          if (!this._emitting) this._commitTyped();
        }),
        // Sair do campo confirma o que foi digitado. Mas um range pela metade nao
        // se confirma por texto: reinterpretar "07/09/2026" zeraria o pendingRange
        // e o proximo clique comecaria um periodo novo em vez de fechar esse.
        // relatedTarget nao basta para detectar clique no painel — Safari e Firefox
        // nao focam botao no clique e mandam null.
        on(input, "blur", (e) => {
          if (this._emitting || this.pendingRange) return;
          if (this.panel.contains(e.relatedTarget) || this.panel.contains(document.activeElement)) return;
          this._commitTyped();
        })
      );
    }
    /**
     * Modo nativo: o proprio input carrega o valor ISO e mantem o `name`, entao o
     * que chega no servidor e identico ao do painel — nao precisa de hidden.
     */
    _setupNative() {
      const input = this.input;
      input.type = this.opts.time ? "datetime-local" : "date";
      if (this.opts.min) input.min = this._nativeValue(this.opts.min);
      if (this.opts.max) input.max = this._nativeValue(this.opts.max);
      if (this.opts.time) input.step = this.opts.seconds ? 1 : this.opts.minuteStep * 60;
      input.removeAttribute("placeholder");
      this._cleanups.push(on(input, "change", () => {
        if (this._emitting) return;
        this.start = this._normalize(parseISO(input.value));
        this.end = null;
        this._syncTarget();
        this._emit();
      }));
    }
    _nativeValue(date = this.start) {
      if (!isValid(date)) return "";
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
      return typeof this.opts.disabledDates === "function" ? !!this.opts.disabledDates(date) : false;
    }
    /**
     * Mes que abre por padrao: o do valor, senao o de hoje. Com min/max apenas
     * limitamos — abrir no `min` levaria o usuario para anos atras sem motivo.
     */
    _anchorMonth() {
      const base = this.start || clampDate(startOfDay(/* @__PURE__ */ new Date()), this.opts.min, this.opts.max);
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
      const one = f.replace(
        /'[^']*'|yyyy|yy|MM|M|dd|d|HH|H|hh|h|mm|m|ss|s/g,
        (t) => t.startsWith("'") ? t.slice(1, -1) : "#".repeat(widths[t])
      );
      return this.isRange ? `${one} \u2014 ${one}` : one;
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
      const apagando = typeof e.inputType === "string" && e.inputType.startsWith("delete");
      let digits = raw.replace(/\D/g, "");
      let antes = raw.slice(0, caret).replace(/\D/g, "").length;
      if (apagando && digits === this._maskDigits) {
        const paraFrente = e.inputType === "deleteContentForward";
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
      const sample = this._displayFormat().replace(/y/g, "a").replace(/M/g, "m").replace(/H|h/g, "h");
      return this.isRange ? `${sample} \u2014 ${sample}` : sample;
    }
    /* ---------------------------------------------------------------- *
     * Valor <-> input                                                   *
     * ---------------------------------------------------------------- */
    _displayFormat() {
      if (!this.opts.time) return this.opts.format;
      const h = this.L.hour12 ? "hh:mm" : "HH:mm";
      return `${this.opts.format} ${h}${this.opts.seconds ? ":ss" : ""}${this.L.hour12 ? " a" : ""}`;
    }
    _displayValue() {
      const f = this._displayFormat();
      if (!this.start) return "";
      const a = format(this.start, f, this.opts.locale);
      if (!this.isRange) return a;
      return this.end ? `${a} \u2014 ${format(this.end, f, this.opts.locale)}` : a;
    }
    _isoValue() {
      const enc = (d) => this.opts.time ? toISODateTime(d, this.opts.seconds) : toISODate(d);
      if (!this.start) return "";
      return this.isRange ? `${enc(this.start)}${this.end ? `,${enc(this.end)}` : ""}` : enc(this.start);
    }
    _syncTarget() {
      if (this.input) this.input.value = this.native ? this._nativeValue() : this._displayValue();
      if (this.isoInput) this.isoInput.value = this._isoValue();
      if (this.input && this._mask) this._maskDigits = this.input.value.replace(/\D/g, "");
    }
    _commitTyped() {
      if (!this.input) return;
      const raw = this.input.value.trim();
      if (raw === this._displayValue()) return;
      if (!raw) {
        this.clear();
        return;
      }
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
        this.input.dispatchEvent(new CustomEvent("tucano:change", { detail, bubbles: true }));
        this.input?.dispatchEvent(new Event("change", { bubbles: true }));
      } finally {
        this._emitting = false;
      }
    }
    /* ---------------------------------------------------------------- *
     * Selecao                                                           *
     * ---------------------------------------------------------------- */
    _selectDay(date) {
      if (this._isDisabled(date)) return;
      const keepTime = (target, source) => this.opts.time && source ? withTime(target, source) : target;
      if (!this.isRange) {
        this.start = keepTime(clone(date), this.start);
        this._syncTarget();
        this._emit();
        this._render();
        if (this.opts.autoApply) this.close();
        return;
      }
      if (!this.pendingRange || !this.start || this.start && this.end) {
        this.start = keepTime(clone(date), this.start);
        this.end = null;
        this.pendingRange = true;
      } else {
        let a = this.start;
        let b = keepTime(clone(date), this.end);
        if (compareDay(b, a) < 0) {
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
      const target = which === "end" ? this.end : this.start;
      if (!target) return;
      const d = clone(target);
      if (unit === "h") d.setHours(value);
      if (unit === "m") d.setMinutes(value);
      if (unit === "s") d.setSeconds(value);
      if (which === "end") this.end = d;
      else this.start = d;
      if (this.isRange && this.start && this.end && this.start > this.end) {
        if (which === "start") this.start = clone(this.end);
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
      const scrollState = /* @__PURE__ */ new Map();
      for (const n of this.panel.querySelectorAll(".tuc-dp__timelist")) {
        scrollState.set(`${n.dataset.which}|${n.dataset.unit}`, n.scrollTop);
      }
      this.panel.classList.toggle("is-picking", this.pendingRange && !!this.hover);
      this.panel.replaceChildren();
      if (this.opts.presets && this.isRange) this.panel.append(this._renderPresets());
      const main = el("div", { class: "tuc-dp__main" });
      if (this.view === "days") {
        const months = el("div", { class: "tuc-dp__months" });
        for (let i = 0; i < this.opts.months; i++) months.append(this._renderMonth(addMonths(this.viewDate, i), i));
        main.append(months);
      } else {
        main.append(this._renderPeriodView());
      }
      if (this.opts.time && this.view === "days") main.append(this._renderTime());
      if (this._needsFooter()) main.append(this._renderFooter());
      this.panel.append(main);
      for (const n of this.panel.querySelectorAll(".tuc-dp__timelist")) {
        const prev = scrollState.get(`${n.dataset.which}|${n.dataset.unit}`);
        if (prev !== void 0) n.scrollTop = prev;
      }
      this._revealTimes();
    }
    /**
     * Rola cada coluna de hora ate o valor selecionado — mas so quando esse valor
     * mudou. Assim o scroll que o usuario deu na coluna nao e desfeito a cada
     * re-render (que acontece a todo hover no modo periodo).
     */
    _revealTimes() {
      this._revealed = this._revealed || /* @__PURE__ */ new Map();
      for (const list of this.panel.querySelectorAll(".tuc-dp__timelist")) {
        const key = `${list.dataset.which}|${list.dataset.unit}`;
        const selected = list.querySelector(".is-selected")?.textContent ?? null;
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
      const wrap = el("div", { class: "tuc-dp__month" });
      const showPrev = index === 0;
      const showNext = index === this.opts.months - 1;
      const header = el("div", { class: "tuc-dp__header" }, [
        showPrev ? el("button", {
          type: "button",
          class: "tuc-dp__nav",
          "aria-label": "Mes anterior",
          disabled: this._navBlocked(-1),
          onclick: () => this._shiftView(-1)
        }, [icon(ICONS.chevronLeft)]) : el("span", { class: "tuc-dp__nav is-ghost" }),
        el("button", {
          type: "button",
          class: "tuc-dp__label",
          "aria-live": "polite",
          onclick: () => {
            this.view = "months";
            this.viewDate = clone(monthDate);
            this._render();
          }
        }, [`${this.L.monthsLong[month]} ${year}`, icon(ICONS.chevronDown, 14)]),
        showNext ? el("button", {
          type: "button",
          class: "tuc-dp__nav",
          "aria-label": "Proximo mes",
          disabled: this._navBlocked(1),
          onclick: () => this._shiftView(1)
        }, [icon(ICONS.chevronRight)]) : el("span", { class: "tuc-dp__nav is-ghost" })
      ]);
      const weekdays = el("div", { class: `tuc-dp__weekdays${this.opts.weekNumbers ? " has-weeknums" : ""}` });
      if (this.opts.weekNumbers) weekdays.append(el("span", { class: "tuc-dp__weeknum-head" }));
      for (let i = 0; i < 7; i++) {
        const idx = (i + this.opts.firstDayOfWeek) % 7;
        weekdays.append(el("abbr", {
          class: "tuc-dp__weekday",
          title: this.L.weekdaysShort[idx],
          text: this.L.weekdaysNarrow[idx]
        }));
      }
      const grid = el("div", {
        class: `tuc-dp__grid${this.opts.weekNumbers ? " has-weeknums" : ""}`,
        role: "grid",
        "aria-label": `${this.L.monthsLong[month]} ${year}`
      });
      const cells = buildMonthGrid(year, month, this.opts.firstDayOfWeek);
      cells.forEach((cell, i) => {
        if (this.opts.weekNumbers && i % 7 === 0) {
          grid.append(el("span", { class: "tuc-dp__weeknum", text: isoWeek(cell.date) }));
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
      let rStart = this.start;
      let rEnd = this.end;
      if (this.isRange && this.pendingRange && this.start && this.hover) {
        [rStart, rEnd] = compareDay(this.hover, this.start) < 0 ? [this.hover, this.start] : [this.start, this.hover];
      }
      const isStart = this.isRange ? isSameDay(date, rStart) : isSameDay(date, this.start);
      const isEnd = this.isRange && isSameDay(date, rEnd);
      const inRange = this.isRange && rStart && rEnd && compareDay(date, rStart) > 0 && compareDay(date, rEnd) < 0;
      const distintas = rStart && rEnd && !isSameDay(rStart, rEnd);
      const classes = ["tuc-dp__day"];
      if (outside) classes.push("is-outside");
      if (this._isDisabled(date)) classes.push("is-disabled");
      if (isSameDay(date, /* @__PURE__ */ new Date())) classes.push("is-today");
      if (isStart || isEnd) classes.push("is-selected");
      if (isStart && distintas) classes.push("is-start");
      if (isEnd && distintas) classes.push("is-end");
      if (inRange) classes.push("is-in-range");
      if (this.pendingRange && isEnd) classes.push("is-preview");
      return classes;
    }
    /**
     * Repinta as celulas ja existentes. E o que roda a cada mouseenter: refazer a
     * grade ali trocaria o elemento entre o mousedown e o mouseup, e o browser
     * engoliria o clique — era isso que impedia de fechar o periodo.
     */
    _paintDays() {
      this.panel.classList.toggle("is-picking", this.pendingRange && !!this.hover);
      for (const btn of this.panel.querySelectorAll(".tuc-dp__day")) {
        const date = parseISO(btn.dataset.date);
        if (!date) continue;
        const classes = this._dayClasses(date, date.getMonth() !== +btn.dataset.month);
        btn.className = classes.join(" ");
        btn.setAttribute("aria-selected", classes.includes("is-selected") ? "true" : "false");
        btn.tabIndex = isSameDay(date, this.focusDate) ? 0 : -1;
      }
    }
    _renderDay(cell, month) {
      const { date, outside } = cell;
      const classes = this._dayClasses(date, outside);
      return el("button", {
        type: "button",
        class: classes.join(" "),
        tabindex: isSameDay(date, this.focusDate) ? 0 : -1,
        disabled: this._isDisabled(date),
        role: "gridcell",
        "aria-selected": classes.includes("is-selected") ? "true" : "false",
        "aria-label": format(date, "EEEE, d 'de' MMMM 'de' yyyy", this.opts.locale),
        dataset: { date: toISODate(date), month },
        onclick: () => this._selectDay(date),
        onmouseenter: () => {
          if (this.isRange && this.pendingRange) {
            this.hover = date;
            this._paintDays();
          }
        }
        // Duas camadas: o botao desenha a faixa do intervalo (quadrada, encostando
        // na celula vizinha) e o span desenha a pilula do dia selecionado.
      }, [el("span", { class: "tuc-dp__daynum", text: String(date.getDate()) })]);
    }
    _renderPeriodView() {
      const isMonths = this.view === "months";
      const year = this.viewDate.getFullYear();
      const wrap = el("div", { class: "tuc-dp__period" });
      const step = isMonths ? 1 : 12;
      const header = el("div", { class: "tuc-dp__header" }, [
        el("button", {
          type: "button",
          class: "tuc-dp__nav",
          "aria-label": "Anterior",
          onclick: () => {
            this.viewDate = addYears(this.viewDate, -step);
            this._render();
          }
        }, [icon(ICONS.chevronLeft)]),
        el("button", {
          type: "button",
          class: "tuc-dp__label",
          onclick: () => {
            this.view = isMonths ? "years" : "days";
            this._render();
          }
        }, [isMonths ? String(year) : `${floorTo(year, 12)} \u2013 ${floorTo(year, 12) + 11}`]),
        el("button", {
          type: "button",
          class: "tuc-dp__nav",
          "aria-label": "Proximo",
          onclick: () => {
            this.viewDate = addYears(this.viewDate, step);
            this._render();
          }
        }, [icon(ICONS.chevronRight)])
      ]);
      const grid = el("div", { class: "tuc-dp__periodgrid" });
      const items = isMonths ? this.L.monthsShort.map((label, m) => ({ label, date: new Date(year, m, 1) })) : Array.from({ length: 12 }, (_, i) => {
        const y = floorTo(year, 12) + i;
        return { label: String(y), date: new Date(y, this.viewDate.getMonth(), 1) };
      });
      for (const item of items) {
        const active = isMonths ? this.start && isSameMonth(item.date, this.start) : this.start && item.date.getFullYear() === this.start.getFullYear();
        const current = isMonths ? isSameMonth(item.date, /* @__PURE__ */ new Date()) : item.date.getFullYear() === (/* @__PURE__ */ new Date()).getFullYear();
        grid.append(el("button", {
          type: "button",
          class: `tuc-dp__periodcell${active ? " is-selected" : ""}${current ? " is-today" : ""}`,
          text: item.label,
          onclick: () => {
            this.viewDate = startOfDay(item.date);
            this.view = isMonths ? "days" : "months";
            this._render();
          }
        }));
      }
      wrap.append(header, grid);
      return wrap;
    }
    _renderTime() {
      const row = el("div", { class: "tuc-dp__time" });
      const targets = this.isRange ? [["start", "In\xEDcio"], ["end", "Fim"]] : [["start", "Hor\xE1rio"]];
      const pad2 = (n) => String(n).padStart(2, "0");
      for (const [which, label] of targets) {
        const value = which === "end" ? this.end : this.start;
        const readout = value ? `${pad2(value.getHours())}:${pad2(value.getMinutes())}${this.opts.seconds ? `:${pad2(value.getSeconds())}` : ""}` : "--:--";
        const head = el("div", { class: "tuc-dp__timehead" }, [
          el("span", { class: "tuc-dp__timelabel", text: label }),
          el("span", { class: "tuc-dp__timevalue", text: readout })
        ]);
        const cols = el("div", { class: "tuc-dp__timecols" }, [
          this._renderTimeList(which, "h", 24, 1, value ? value.getHours() : null),
          this._renderTimeList(which, "m", 60, this.opts.minuteStep, value ? value.getMinutes() : null),
          this.opts.seconds ? this._renderTimeList(which, "s", 60, 1, value ? value.getSeconds() : null) : null
        ]);
        row.append(el("div", { class: "tuc-dp__timegroup" }, [head, cols]));
      }
      return row;
    }
    _renderTimeList(which, unit, count, step, current) {
      const list = el("div", {
        class: "tuc-dp__timelist",
        role: "listbox",
        tabindex: 0,
        "aria-label": { h: "Hora", m: "Minuto", s: "Segundo" }[unit],
        dataset: { which, unit }
      });
      for (let v = 0; v < count; v += step) {
        const selected = current !== null && (step > 1 ? Math.floor(current / step) * step === v : current === v);
        list.append(el("button", {
          type: "button",
          class: `tuc-dp__timeitem${selected ? " is-selected" : ""}`,
          text: String(v).padStart(2, "0"),
          role: "option",
          "aria-selected": selected ? "true" : "false",
          disabled: !(which === "end" ? this.end : this.start),
          onclick: () => this._setTime(which, unit, v)
        }));
      }
      return list;
    }
    _renderPresets() {
      const wrap = el("div", { class: "tuc-dp__presets" });
      for (const preset of buildPresets(this.opts.presets)) {
        const r = preset.value();
        const active = this.start && this.end && isSameDay(this.start, r.start) && isSameDay(this.end, r.end);
        wrap.append(el("button", {
          type: "button",
          class: `tuc-dp__preset${active ? " is-selected" : ""}`,
          text: preset.label,
          onclick: () => this._applyPreset(preset)
        }));
      }
      return wrap;
    }
    _renderFooter() {
      const footer = el("div", { class: "tuc-dp__footer" });
      if (this.opts.clearable) {
        footer.append(el("button", {
          type: "button",
          class: "tuc-dp__btn is-ghost",
          text: "Limpar",
          onclick: () => {
            this.clear();
            if (this.opts.autoApply) this.close();
          }
        }));
      }
      footer.append(el("span", { class: "tuc-dp__spacer" }));
      if (!this.opts.autoApply) {
        footer.append(el("button", {
          type: "button",
          class: "tuc-dp__btn is-primary",
          text: "Aplicar",
          disabled: !this.start || this.isRange && !this.end,
          onclick: () => {
            this._emit();
            this.close();
          }
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
      if (!e.target.classList.contains("tuc-dp__day")) return;
      const moves = {
        ArrowLeft: -1,
        ArrowRight: 1,
        ArrowUp: -7,
        ArrowDown: 7
      };
      let next = null;
      if (e.key in moves) next = addDays(this.focusDate, moves[e.key]);
      else if (e.key === "PageUp") next = addMonths(this.focusDate, e.shiftKey ? -12 : -1);
      else if (e.key === "PageDown") next = addMonths(this.focusDate, e.shiftKey ? 12 : 1);
      else if (e.key === "Home") next = addDays(this.focusDate, -((this.focusDate.getDay() - this.opts.firstDayOfWeek + 7) % 7));
      else if (e.key === "End") next = addDays(this.focusDate, 6 - (this.focusDate.getDay() - this.opts.firstDayOfWeek + 7) % 7);
      else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this._selectDay(this.focusDate);
        return;
      } else return;
      e.preventDefault();
      this.focusDate = clampDate(next, this.opts.min, this.opts.max);
      const last = addMonths(this.viewDate, this.opts.months - 1);
      if (compareDay(this.focusDate, this.viewDate) < 0) this.viewDate = startOfDay(new Date(this.focusDate.getFullYear(), this.focusDate.getMonth(), 1));
      else if (!isSameMonth(this.focusDate, last) && compareDay(this.focusDate, new Date(last.getFullYear(), last.getMonth() + 1, 0)) > 0) {
        this.viewDate = addMonths(startOfDay(new Date(this.focusDate.getFullYear(), this.focusDate.getMonth(), 1)), -(this.opts.months - 1));
      }
      this._render();
      this.panel.querySelector(`.tuc-dp__day[data-date="${toISODate(this.focusDate)}"]`)?.focus();
    }
  };
  function buildPresets(option) {
    if (Array.isArray(option)) return option;
    const today = () => startOfDay(/* @__PURE__ */ new Date());
    return [
      { label: "Hoje", value: () => ({ start: today(), end: today() }) },
      { label: "Ontem", value: () => ({ start: addDays(today(), -1), end: addDays(today(), -1) }) },
      { label: "\xDAltimos 7 dias", value: () => ({ start: addDays(today(), -6), end: today() }) },
      { label: "\xDAltimos 30 dias", value: () => ({ start: addDays(today(), -29), end: today() }) },
      { label: "Este m\xEAs", value: () => {
        const t = today();
        return { start: new Date(t.getFullYear(), t.getMonth(), 1), end: new Date(t.getFullYear(), t.getMonth() + 1, 0) };
      } },
      { label: "M\xEAs passado", value: () => {
        const t = today();
        return { start: new Date(t.getFullYear(), t.getMonth() - 1, 1), end: new Date(t.getFullYear(), t.getMonth(), 0) };
      } },
      { label: "Este ano", value: () => {
        const t = today();
        return { start: new Date(t.getFullYear(), 0, 1), end: new Date(t.getFullYear(), 11, 31) };
      } }
    ];
  }
  function omitUndefined(obj) {
    const out = {};
    for (const [k, v] of Object.entries(obj || {})) if (v !== void 0) out[k] = v;
    return out;
  }
  function revealSelected(list) {
    const item = list.querySelector(".is-selected");
    if (!item) return;
    const lr = list.getBoundingClientRect();
    const ir = item.getBoundingClientRect();
    const top = ir.top - lr.top + list.scrollTop;
    if (top < list.scrollTop || top + ir.height > list.scrollTop + list.clientHeight) {
      list.scrollTop = top - (list.clientHeight - ir.height) / 2;
    }
  }
  function maskFormat(digits, template) {
    let out = "";
    let i = 0;
    for (const ch of template) {
      if (ch === "#") {
        if (i >= digits.length) break;
        out += digits[i++];
      } else {
        if (i === 0) break;
        out += ch;
      }
    }
    return out;
  }
  function caretAfterDigits(masked, n) {
    if (n <= 0) return 0;
    let seen = 0;
    for (let i = 0; i < masked.length; i++) {
      if (masked[i] >= "0" && masked[i] <= "9" && ++seen === n) return i + 1;
    }
    return masked.length;
  }
  function floorTo(value, size) {
    return Math.floor(value / size) * size;
  }
  function isoWeek(date) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d - week1) / 864e5 - 3 + (week1.getDay() + 6) % 7) / 7);
  }
  function autoInit(scope = document) {
    const out = [];
    for (const node of scope.querySelectorAll("[data-tuc-datepicker]:not([data-tuc-ready])")) {
      const d = node.dataset;
      node.setAttribute("data-tuc-ready", "");
      out.push(new DatePicker(node, {
        mode: d.mode || void 0,
        time: d.time === "true" || d.time === "",
        seconds: d.seconds === "true",
        minuteStep: d.minuteStep ? +d.minuteStep : void 0,
        locale: d.locale || void 0,
        format: d.format || void 0,
        months: d.months ? +d.months : void 0,
        min: d.min || null,
        max: d.max || null,
        presets: d.presets === "true" ? true : void 0,
        weekNumbers: d.weekNumbers === "true",
        isoName: d.isoName || void 0,
        placement: d.placement || void 0,
        native: d.native === "true" ? true : d.native === "false" ? false : void 0
      }));
    }
    return out;
  }

  // src/js/core/dom-extra.js
  var ICONS_EXTRA = {
    check: "M20 6L9 17l-5-5",
    search: "M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35",
    chevronsUpDown: "M7 15l5 5 5-5M7 9l5-5 5 5",
    pipette: "M2 22l1-4 10-10 3 3L6 21l-4 1zM15 5l4-4 4 4-4 4-4-4z"
  };

  // src/js/components/select.js
  var DEFAULTS2 = {
    search: void 0,
    // default: liga a partir de 6 opcoes
    searchMinItems: 6,
    placeholder: void 0,
    // default: do atributo ou "Selecione..."
    searchPlaceholder: "Buscar...",
    emptyText: "Nenhum resultado",
    clearable: true,
    maxItems: null,
    // limite no modo multiplo
    wrapTags: false,
    // true deixa o campo crescer em varias linhas
    closeOnSelect: void 0,
    // default: true em simples, false em multiplo
    placement: "bottom-start",
    appendTo: void 0,
    onChange: null
  };
  var Select = class {
    constructor(target, options = {}) {
      const node = typeof target === "string" ? document.querySelector(target) : target;
      if (!node) throw new Error("[Select] elemento alvo nao encontrado");
      if (node.tagName !== "SELECT") throw new Error("[Select] o alvo precisa ser um <select>");
      this.opts = { ...DEFAULTS2, ...omitUndefined2(options) };
      this.native = node;
      this.multiple = node.multiple;
      this.opts.closeOnSelect = this.opts.closeOnSelect ?? !this.multiple;
      this.opts.placeholder = this.opts.placeholder ?? node.dataset.placeholder ?? (this.multiple ? "Selecione..." : firstEmptyLabel(node) ?? "Selecione...");
      this.id = nextId("sel");
      this.isOpen = false;
      this.query = "";
      this.activeIndex = -1;
      this._cleanups = [];
      this.items = readOptions(node);
      this.opts.search = this.opts.search ?? this.items.length >= this.opts.searchMinItems;
      this._build();
      this._syncFromNative();
      node._tucano = this;
    }
    /* ---------------------------------------------------------------- *
     * API publica                                                       *
     * ---------------------------------------------------------------- */
    getValue() {
      const escolhidos = this.items.filter((i) => i.selected).map((i) => i.value);
      return this.multiple ? escolhidos : escolhidos[0] ?? null;
    }
    setValue(value, { silent = false } = {}) {
      const alvo = new Set([].concat(value ?? []).map(String));
      for (const item of this.items) item.selected = alvo.has(item.value);
      this._pushToNative();
      this._renderControl();
      if (this.isOpen) this._renderMenu();
      if (!silent) this._emit();
    }
    clear({ silent = false } = {}) {
      this.setValue([], { silent });
    }
    /** Relê as <option> do select nativo — use depois de trocar as opções por HTMX. */
    refresh() {
      this.items = readOptions(this.native);
      this._renderControl();
      if (this.isOpen) this._renderMenu();
    }
    open() {
      if (this.isOpen || this.native.disabled) return;
      this.isOpen = true;
      this.query = "";
      this.search.value = "";
      this.activeIndex = this.items.findIndex((i) => i.selected && !i.disabled);
      this._renderMenu();
      this.popover = new Popover(this.control, this.menu, {
        placement: this.opts.placement,
        appendTo: this.opts.appendTo || document.body,
        matchWidth: true,
        onDismiss: () => this.close()
      });
      this.popover.show();
      requestAnimationFrame(() => this.menu.classList.add("is-open"));
      this.control.classList.add("is-open");
      this.control.setAttribute("aria-expanded", "true");
      this.search.focus();
      this._scrollToActive();
    }
    close() {
      if (!this.isOpen) return;
      this.isOpen = false;
      this.menu.classList.remove("is-open");
      this.control.classList.remove("is-open");
      this.control.setAttribute("aria-expanded", "false");
      this.popover?.destroy();
      this.popover = null;
      this.query = "";
      this.search.value = "";
      this._renderControl();
    }
    toggle() {
      this.isOpen ? this.close() : this.open();
    }
    destroy() {
      this.close();
      this._cleanups.forEach((fn) => fn());
      this._cleanups = [];
      this.control.remove();
      this.menu.remove();
      this.native.classList.remove("tuc-select-native");
      this.native.removeAttribute("aria-hidden");
      this.native.removeAttribute("tabindex");
      delete this.native._tucano;
    }
    /* ---------------------------------------------------------------- *
     * Construcao                                                        *
     * ---------------------------------------------------------------- */
    _build() {
      this.native.classList.add("tuc-select-native");
      this.native.setAttribute("aria-hidden", "true");
      this.native.tabIndex = -1;
      this.values = el("div", { class: "tuc-select__values" });
      this.search = el("input", {
        class: "tuc-select__search",
        type: "text",
        autocomplete: "off",
        spellcheck: "false",
        "aria-autocomplete": "list",
        "aria-controls": `${this.id}-list`
      });
      this.clearBtn = el("button", {
        type: "button",
        class: "tuc-select__clear",
        "aria-label": "Limpar selecao",
        tabindex: -1,
        onclick: (e) => {
          e.stopPropagation();
          this.clear();
        }
      }, [icon(ICONS.x, 14)]);
      this.control = el("div", {
        class: `tuc-select${this.multiple ? " is-multiple" : ""}${this.opts.wrapTags ? " is-wrap" : ""}`,
        role: "combobox",
        "aria-haspopup": "listbox",
        "aria-expanded": "false",
        "aria-controls": `${this.id}-list`,
        id: this.id
      }, [
        this.values,
        this.opts.clearable ? this.clearBtn : null,
        el("span", { class: "tuc-select__arrow" }, [icon(ICONS_EXTRA.chevronsUpDown, 15)])
      ]);
      this.list = el("div", { class: "tuc-select__list", role: "listbox", id: `${this.id}-list`, "aria-multiselectable": this.multiple ? "true" : null });
      this.menu = el("div", { class: "tuc-select__menu" }, [this.list]);
      this.native.after(this.control);
      this.values.append(this.search);
      this._cleanups.push(
        on(this.control, "mousedown", (e) => {
          if (e.target.closest(".tuc-select__clear, .tuc-select__tagx")) return;
          e.preventDefault();
          this.isOpen ? this.search.focus() : this.open();
        }),
        on(this.search, "input", () => {
          this.query = this.search.value;
          if (!this.isOpen) this.open();
          this.activeIndex = this._filtered().findIndex((i) => !i.disabled);
          this._renderMenu();
          this._renderControl();
        }),
        on(this.search, "keydown", (e) => this._onKeydown(e)),
        // Se o valor mudar por fora (reset de formulario, JS de terceiros).
        on(this.native, "change", () => {
          if (!this._pushing) this._syncFromNative();
        })
      );
    }
    _syncFromNative() {
      const escolhidos = new Set([...this.native.selectedOptions].map((o) => o.value));
      for (const item of this.items) item.selected = escolhidos.has(item.value);
      this._renderControl();
    }
    _pushToNative() {
      this._pushing = true;
      const escolhidos = new Set(this.items.filter((i) => i.selected).map((i) => i.value));
      for (const opt of this.native.options) opt.selected = escolhidos.has(opt.value);
      if (!this.multiple && !escolhidos.size) {
        const vazia = [...this.native.options].find((o) => o.value === "");
        if (vazia) vazia.selected = true;
      }
      this.native.dispatchEvent(new Event("change", { bubbles: true }));
      this._pushing = false;
    }
    /* ---------------------------------------------------------------- *
     * Render                                                            *
     * ---------------------------------------------------------------- */
    _renderControl() {
      const escolhidos = this.items.filter((i) => i.selected);
      for (const n of [...this.values.children]) if (n !== this.search) n.remove();
      if (this.multiple) {
        for (const item of escolhidos) {
          this.values.insertBefore(el("span", { class: "tuc-select__tag" }, [
            el("span", { class: "tuc-select__tagtext", text: item.label }),
            el("button", {
              type: "button",
              class: "tuc-select__tagx",
              tabindex: -1,
              "aria-label": `Remover ${item.label}`,
              onclick: (e) => {
                e.stopPropagation();
                this._toggleItem(item);
              }
            }, [icon(ICONS.x, 12)])
          ]), this.search);
        }
      } else if (escolhidos.length && !this.query) {
        this.values.insertBefore(
          el("span", { class: "tuc-select__single", text: escolhidos[0].label }),
          this.search
        );
      }
      const vazio = !escolhidos.length && !this.query;
      this.search.placeholder = vazio ? this.opts.placeholder : this.isOpen && this.opts.search ? this.opts.searchPlaceholder : "";
      this.control.classList.toggle("is-empty", vazio);
      this.control.classList.toggle("has-value", escolhidos.length > 0);
      this.search.readOnly = !this.opts.search;
    }
    _filtered() {
      const q = this.query.trim().toLowerCase();
      if (!q) return this.items;
      return this.items.filter((i) => i.busca.includes(q));
    }
    _renderMenu() {
      const visiveis = this._filtered();
      this.list.replaceChildren();
      if (!visiveis.length) {
        this.list.append(el("div", { class: "tuc-select__empty", text: this.opts.emptyText }));
        return;
      }
      let grupoAtual = null;
      visiveis.forEach((item, i) => {
        if (item.group && item.group !== grupoAtual) {
          grupoAtual = item.group;
          this.list.append(el("div", { class: "tuc-select__group", text: item.group, role: "presentation" }));
        }
        const ativo = i === this.activeIndex;
        const node = el("div", {
          class: `tuc-select__option${item.selected ? " is-selected" : ""}${ativo ? " is-active" : ""}${item.disabled ? " is-disabled" : ""}`,
          role: "option",
          id: `${this.id}-opt-${i}`,
          "aria-selected": item.selected ? "true" : "false",
          "aria-disabled": item.disabled ? "true" : null,
          onmousedown: (e) => {
            e.preventDefault();
            if (!item.disabled) this._toggleItem(item);
          },
          onmouseenter: () => {
            this.activeIndex = i;
            this._paintActive();
          }
        }, [
          el("span", { class: "tuc-select__label", text: item.label }),
          item.selected ? el("span", { class: "tuc-select__check" }, [icon(ICONS_EXTRA.check, 15)]) : null
        ]);
        this.list.append(node);
      });
      this.search.setAttribute(
        "aria-activedescendant",
        this.activeIndex >= 0 ? `${this.id}-opt-${this.activeIndex}` : ""
      );
    }
    /** Move o destaque sem refazer a lista — mesma razao do calendario. */
    _paintActive() {
      const opcoes = this.list.querySelectorAll(".tuc-select__option");
      opcoes.forEach((n, i) => n.classList.toggle("is-active", i === this.activeIndex));
      this.search.setAttribute(
        "aria-activedescendant",
        this.activeIndex >= 0 ? `${this.id}-opt-${this.activeIndex}` : ""
      );
    }
    _scrollToActive() {
      const node = this.list.querySelectorAll(".tuc-select__option")[this.activeIndex];
      if (!node) return;
      const lr = this.list.getBoundingClientRect();
      const nr = node.getBoundingClientRect();
      if (nr.top < lr.top) this.list.scrollTop -= lr.top - nr.top;
      else if (nr.bottom > lr.bottom) this.list.scrollTop += nr.bottom - lr.bottom;
    }
    /* ---------------------------------------------------------------- *
     * Interacao                                                         *
     * ---------------------------------------------------------------- */
    _toggleItem(item) {
      if (item.disabled) return;
      if (this.multiple) {
        if (!item.selected && this.opts.maxItems && this.items.filter((i) => i.selected).length >= this.opts.maxItems) return;
        item.selected = !item.selected;
      } else {
        for (const i of this.items) i.selected = i === item;
      }
      this._pushToNative();
      this.query = "";
      this.search.value = "";
      this._renderControl();
      this._emit();
      if (this.opts.closeOnSelect) this.close();
      else if (this.isOpen) {
        this._renderMenu();
        this.search.focus();
      }
    }
    _onKeydown(e) {
      const visiveis = this._filtered();
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!this.isOpen) return this.open();
        const passo = e.key === "ArrowDown" ? 1 : -1;
        for (let n = 1; n <= visiveis.length; n++) {
          const i = (this.activeIndex + passo * n + visiveis.length * n) % visiveis.length;
          if (!visiveis[i].disabled) {
            this.activeIndex = i;
            break;
          }
        }
        this._paintActive();
        this._scrollToActive();
      } else if (e.key === "Enter") {
        if (!this.isOpen) return;
        e.preventDefault();
        const item = visiveis[this.activeIndex];
        if (item) this._toggleItem(item);
      } else if (e.key === "Escape") {
        if (this.isOpen) {
          e.preventDefault();
          e.stopPropagation();
          this.close();
          this.control.focus?.();
        }
      } else if (e.key === "Backspace" && !this.search.value && this.multiple) {
        const escolhidos = this.items.filter((i) => i.selected);
        if (escolhidos.length) this._toggleItem(escolhidos[escolhidos.length - 1]);
      } else if (e.key === "Home" || e.key === "End") {
        if (!this.isOpen) return;
        e.preventDefault();
        this.activeIndex = e.key === "Home" ? 0 : visiveis.length - 1;
        this._paintActive();
        this._scrollToActive();
      }
    }
    _emit() {
      const value = this.getValue();
      const detail = { value, instance: this };
      this.opts.onChange?.(value, detail);
      this.native.dispatchEvent(new CustomEvent("tucano:change", { detail, bubbles: true }));
    }
  };
  function readOptions(select) {
    return [...select.options].filter((o) => o.value !== "").map((o) => ({
      value: o.value,
      label: o.textContent.trim(),
      disabled: o.disabled,
      group: o.parentElement.tagName === "OPTGROUP" ? o.parentElement.label : null,
      selected: o.selected,
      // Normaliza acentos: buscar "sao" acha "São Paulo".
      busca: normalize(`${o.textContent} ${o.value}`)
    }));
  }
  function normalize(s) {
    return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  }
  function firstEmptyLabel(select) {
    const o = [...select.options].find((x) => x.value === "");
    return o ? o.textContent.trim() : null;
  }
  function omitUndefined2(obj) {
    const out = {};
    for (const [k, v] of Object.entries(obj || {})) if (v !== void 0) out[k] = v;
    return out;
  }
  function autoInit2(scope = document) {
    const out = [];
    for (const node of scope.querySelectorAll("select[data-tuc-select]:not([data-tuc-ready])")) {
      const d = node.dataset;
      node.setAttribute("data-tuc-ready", "");
      out.push(new Select(node, {
        search: d.search === "true" ? true : d.search === "false" ? false : void 0,
        placeholder: d.placeholder || void 0,
        emptyText: d.emptyText || void 0,
        maxItems: d.maxItems ? +d.maxItems : void 0,
        clearable: d.clearable === "false" ? false : void 0,
        wrapTags: d.wrapTags === "true" ? true : void 0,
        closeOnSelect: d.closeOnSelect === "false" ? false : d.closeOnSelect === "true" ? true : void 0
      }));
    }
    return out;
  }

  // src/js/core/color.js
  var color_exports = {};
  __export(color_exports, {
    clamp: () => clamp,
    formatColor: () => formatColor,
    hsvToHsl: () => hsvToHsl,
    hsvToRgb: () => hsvToRgb,
    isDark: () => isDark,
    luminance: () => luminance,
    parseColor: () => parseColor,
    rgbToHex: () => rgbToHex,
    rgbToHsv: () => rgbToHsv
  });
  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }
  var round = (n) => Math.round(n * 255);
  var hex2 = (n) => n.toString(16).padStart(2, "0");
  function hsvToRgb({ h, s, v }) {
    const c = v * s;
    const x = c * (1 - Math.abs(h / 60 % 2 - 1));
    const m = v - c;
    const setor = Math.floor(h / 60) % 6;
    const [r, g, b] = [
      [c, x, 0],
      [x, c, 0],
      [0, c, x],
      [0, x, c],
      [x, 0, c],
      [c, 0, x]
    ][setor];
    return { r: round(r + m), g: round(g + m), b: round(b + m) };
  }
  function rgbToHsv({ r, g, b }) {
    const rn = r / 255, gn = g / 255, bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const d = max - min;
    let h = 0;
    if (d !== 0) {
      if (max === rn) h = (gn - bn) / d % 6;
      else if (max === gn) h = (bn - rn) / d + 2;
      else h = (rn - gn) / d + 4;
      h *= 60;
      if (h < 0) h += 360;
    }
    return { h, s: max === 0 ? 0 : d / max, v: max };
  }
  function rgbToHex({ r, g, b }, a = 1) {
    const base = `#${hex2(r)}${hex2(g)}${hex2(b)}`;
    return a >= 1 ? base : base + hex2(Math.round(a * 255));
  }
  function parseColor(input) {
    if (!input) return null;
    const texto = String(input).trim().toLowerCase();
    const hex = /^#?([0-9a-f]{3,8})$/.exec(texto);
    if (hex) {
      const d = hex[1];
      let r, g, b, a = 1;
      if (d.length === 3 || d.length === 4) {
        [r, g, b] = [0, 1, 2].map((i) => parseInt(d[i] + d[i], 16));
        if (d.length === 4) a = parseInt(d[3] + d[3], 16) / 255;
      } else if (d.length === 6 || d.length === 8) {
        [r, g, b] = [0, 2, 4].map((i) => parseInt(d.slice(i, i + 2), 16));
        if (d.length === 8) a = parseInt(d.slice(6, 8), 16) / 255;
      } else return null;
      return { ...rgbToHsv({ r, g, b }), a };
    }
    const rgb = /^rgba?\(([^)]+)\)$/.exec(texto);
    if (rgb) {
      const p = rgb[1].split(/[\s,/]+/).filter(Boolean).map(Number);
      if (p.length < 3 || p.slice(0, 3).some(Number.isNaN)) return null;
      return {
        ...rgbToHsv({ r: clamp(p[0], 0, 255), g: clamp(p[1], 0, 255), b: clamp(p[2], 0, 255) }),
        a: p[3] === void 0 ? 1 : clamp(p[3], 0, 1)
      };
    }
    const hsl = /^hsla?\(([^)]+)\)$/.exec(texto);
    if (hsl) {
      const p = hsl[1].replace(/%/g, "").split(/[\s,/]+/).filter(Boolean).map(Number);
      if (p.length < 3 || p.slice(0, 3).some(Number.isNaN)) return null;
      return { ...hslToHsv(p[0], p[1] / 100, p[2] / 100), a: p[3] === void 0 ? 1 : clamp(p[3], 0, 1) };
    }
    return null;
  }
  function hslToHsv(h, s, l) {
    const v = l + s * Math.min(l, 1 - l);
    return { h: (h % 360 + 360) % 360, s: v === 0 ? 0 : 2 * (1 - l / v), v };
  }
  function formatColor(hsva, format2 = "hex") {
    const { r, g, b } = hsvToRgb(hsva);
    const a = Math.round(hsva.a * 100) / 100;
    if (format2 === "rgb") {
      return a >= 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${a})`;
    }
    if (format2 === "hsl") {
      const { h, s, l } = hsvToHsl(hsva);
      const hs = `${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%`;
      return a >= 1 ? `hsl(${hs})` : `hsla(${hs}, ${a})`;
    }
    return rgbToHex({ r, g, b }, hsva.a);
  }
  function hsvToHsl({ h, s, v }) {
    const l = v * (1 - s / 2);
    return { h, s: l === 0 || l === 1 ? 0 : (v - l) / Math.min(l, 1 - l), l };
  }
  function luminance({ r, g, b }) {
    const canal = (c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
  }
  function isDark(hsva) {
    return luminance(hsvToRgb(hsva)) < 0.4;
  }

  // src/js/components/colorpicker.js
  var PALETA = [
    "#0a0a0a",
    "#525252",
    "#a3a3a3",
    "#e5e5e5",
    "#ffffff",
    "#e11d48",
    "#ea580c",
    "#f59e0b",
    "#16a34a",
    "#0d9488",
    "#0284c7",
    "#4f46e5",
    "#7c3aed",
    "#c026d3",
    "#be123c"
  ];
  var DEFAULTS3 = {
    format: "hex",
    // 'hex' | 'rgb' | 'hsl'
    alpha: true,
    swatches: PALETA,
    // false desliga
    placement: "bottom-center",
    // mesma regra do date picker: centralizado, preso na borda da tela
    appendTo: void 0,
    onChange: null
  };
  var ColorPicker = class {
    constructor(target, options = {}) {
      const node = typeof target === "string" ? document.querySelector(target) : target;
      if (!node) throw new Error("[ColorPicker] elemento alvo nao encontrado");
      this.opts = { ...DEFAULTS3, ...omitUndefined3(options) };
      this.input = node;
      this.id = nextId("cor");
      this.isOpen = false;
      this._cleanups = [];
      this._arrastando = null;
      this.hsva = parseColor(node.value) || parseColor(this.opts.value) || { h: 243, s: 0.7, v: 0.9, a: 1 };
      this._build();
      this._syncInput();
      node._tucano = this;
    }
    /* ---------------------------------------------------------------- *
     * API publica                                                       *
     * ---------------------------------------------------------------- */
    getValue() {
      return formatColor(this.hsva, this.opts.format);
    }
    getRgb() {
      return { ...hsvToRgb(this.hsva), a: this.hsva.a };
    }
    setValue(value, { silent = false } = {}) {
      const cor = parseColor(value);
      if (!cor) return false;
      this.hsva = this.opts.alpha ? cor : { ...cor, a: 1 };
      this._syncInput();
      if (this.isOpen) this._paint();
      if (!silent) this._emit();
      return true;
    }
    open() {
      if (this.isOpen) return;
      this.isOpen = true;
      this._paint();
      this.popover = new Popover(this.field, this.panel, {
        placement: this.opts.placement,
        appendTo: this.opts.appendTo || document.body,
        onDismiss: () => this.close()
      });
      this.popover.show();
      requestAnimationFrame(() => this.panel.classList.add("is-open"));
      this.swatch.setAttribute("aria-expanded", "true");
    }
    close() {
      if (!this.isOpen) return;
      this.isOpen = false;
      this.panel.classList.remove("is-open");
      this.popover?.destroy();
      this.popover = null;
      this.swatch.setAttribute("aria-expanded", "false");
    }
    toggle() {
      this.isOpen ? this.close() : this.open();
    }
    destroy() {
      this.close();
      this._cleanups.forEach((fn) => fn());
      this._cleanups = [];
      this.input.classList.remove("tuc-color-field__value");
      this.field.replaceWith(this.input);
      this.panel.remove();
      delete this.input._tucano;
    }
    /* ---------------------------------------------------------------- *
     * Construcao                                                        *
     * ---------------------------------------------------------------- */
    _build() {
      this.swatch = el("button", {
        type: "button",
        class: "tuc-color-field__swatch",
        "aria-label": "Escolher cor",
        "aria-haspopup": "dialog",
        "aria-expanded": "false",
        onclick: () => this.toggle()
      });
      this.field = el("div", { class: "tuc-color-field" });
      this.input.replaceWith(this.field);
      this.input.classList.add("tuc-color-field__value");
      this.field.append(this.swatch, this.input);
      this._cleanups.push(on(this.field, "mousedown", (e) => {
        if (e.target === this.field) {
          e.preventDefault();
          this.input.focus();
        }
      }));
      this.area = el("div", {
        class: "tuc-colorpicker__area",
        tabindex: 0,
        role: "application",
        "aria-label": "Saturacao e brilho"
      }, [el("span", { class: "tuc-colorpicker__thumb" })]);
      this.hue = this._buildSlider("hue", "Matiz", 360);
      this.alpha = this.opts.alpha ? this._buildSlider("alpha", "Opacidade", 1) : null;
      this.preview = el("span", { class: "tuc-colorpicker__preview" });
      this.hexField = el("input", {
        class: "tuc-colorpicker__field",
        type: "text",
        spellcheck: "false",
        autocomplete: "off",
        "aria-label": "Valor da cor"
      });
      const conta = el("div", { class: "tuc-colorpicker__row" }, [
        this.preview,
        this.hexField,
        supportsEyeDropper() ? el("button", {
          type: "button",
          class: "tuc-colorpicker__pick",
          "aria-label": "Capturar cor da tela",
          onclick: () => this._capturarDaTela()
        }, [icon(ICONS_EXTRA.pipette, 15)]) : null
      ]);
      const trilhas = el("div", { class: "tuc-colorpicker__tracks" }, [this.hue.root, this.alpha?.root]);
      this.panel = el("div", {
        class: "tuc-colorpicker",
        role: "dialog",
        "aria-label": "Seletor de cor",
        id: this.id
      }, [this.area, trilhas, conta, this.opts.swatches ? this._buildSwatches() : null]);
      this._cleanups.push(
        this._dragHandler(this.area, (x, y) => {
          this.hsva = { ...this.hsva, s: x, v: 1 - y };
          this._commit();
        }),
        on(this.area, "keydown", (e) => this._teclasArea(e)),
        on(this.input, "change", () => {
          if (!this.setValue(this.input.value)) this._syncInput();
        }),
        on(this.input, "focus", () => this.open()),
        on(this.hexField, "change", () => {
          if (!this.setValue(this.hexField.value)) this._paint();
        }),
        on(this.panel, "keydown", (e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            this.close();
            this.swatch.focus();
          }
        })
      );
    }
    _buildSlider(tipo, rotulo, max) {
      const thumb = el("span", { class: "tuc-colorpicker__thumb" });
      const root = el("div", {
        class: `tuc-colorpicker__slider is-${tipo}`,
        tabindex: 0,
        role: "slider",
        "aria-label": rotulo,
        "aria-valuemin": "0",
        "aria-valuemax": String(max)
      }, [el("span", { class: "tuc-colorpicker__track" }), thumb]);
      this._cleanups.push(
        this._dragHandler(root, (x) => {
          this.hsva = tipo === "hue" ? { ...this.hsva, h: x * 360 } : { ...this.hsva, a: x };
          this._commit();
        }),
        on(root, "keydown", (e) => {
          const passo = e.shiftKey ? 10 : 1;
          const delta = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[e.key];
          if (!delta) return;
          e.preventDefault();
          this.hsva = tipo === "hue" ? { ...this.hsva, h: (this.hsva.h + delta * passo + 360) % 360 } : { ...this.hsva, a: clamp(this.hsva.a + delta * passo / 100, 0, 1) };
          this._commit();
        })
      );
      return { root, thumb };
    }
    _buildSwatches() {
      return el(
        "div",
        { class: "tuc-colorpicker__swatches" },
        this.opts.swatches.map((cor) => el("button", {
          type: "button",
          class: "tuc-colorpicker__swatchbtn",
          style: `--cor: ${cor}`,
          "aria-label": cor,
          title: cor,
          dataset: { cor: normalizar(cor) },
          onclick: () => {
            this.setValue(cor);
          }
        }))
      );
    }
    /**
     * Arrasto normalizado em [0,1]. Usa pointer capture para o gesto continuar
     * valendo quando o cursor sai do elemento — sem isso o thumb "gruda" na borda.
     */
    _dragHandler(node, aoMover) {
      const mover = (e) => {
        const r = node.getBoundingClientRect();
        aoMover(clamp((e.clientX - r.left) / r.width, 0, 1), clamp((e.clientY - r.top) / r.height, 0, 1));
      };
      const down = (e) => {
        e.preventDefault();
        node.setPointerCapture(e.pointerId);
        node.focus();
        mover(e);
      };
      const move = (e) => {
        if (node.hasPointerCapture(e.pointerId)) mover(e);
      };
      const up = (e) => {
        if (node.hasPointerCapture(e.pointerId)) node.releasePointerCapture(e.pointerId);
      };
      const offs = [on(node, "pointerdown", down), on(node, "pointermove", move), on(node, "pointerup", up)];
      return () => offs.forEach((f) => f());
    }
    _teclasArea(e) {
      const passo = (e.shiftKey ? 10 : 2) / 100;
      const mapa = {
        ArrowLeft: { s: -passo },
        ArrowRight: { s: passo },
        ArrowUp: { v: passo },
        ArrowDown: { v: -passo }
      };
      const d = mapa[e.key];
      if (!d) return;
      e.preventDefault();
      this.hsva = {
        ...this.hsva,
        s: clamp(this.hsva.s + (d.s || 0), 0, 1),
        v: clamp(this.hsva.v + (d.v || 0), 0, 1)
      };
      this._commit();
    }
    async _capturarDaTela() {
      try {
        const { sRGBHex } = await new window.EyeDropper().open();
        this.setValue(sRGBHex);
      } catch {
      }
    }
    /* ---------------------------------------------------------------- *
     * Render                                                            *
     * ---------------------------------------------------------------- */
    _commit() {
      this._syncInput();
      this._paint();
      this._emit();
    }
    _syncInput() {
      const valor = this.getValue();
      this.input.value = valor;
      this.swatch.style.setProperty("--cor", valor);
    }
    /** Repinta os controles a partir do HSVA atual. */
    _paint() {
      const { h, s, v, a } = this.hsva;
      const puro = rgbToHex(hsvToRgb({ h, s: 1, v: 1 }));
      const solido = rgbToHex(hsvToRgb(this.hsva));
      this.area.style.setProperty("--matiz", puro);
      this.area.firstElementChild.style.left = `${s * 100}%`;
      this.area.firstElementChild.style.top = `${(1 - v) * 100}%`;
      this.area.firstElementChild.style.setProperty("--cor", solido);
      this.area.firstElementChild.classList.toggle("is-dark", isDark(this.hsva));
      this.hue.thumb.style.left = `${h / 360 * 100}%`;
      this.hue.thumb.style.setProperty("--cor", puro);
      this.hue.root.setAttribute("aria-valuenow", String(Math.round(h)));
      if (this.alpha) {
        this.alpha.root.style.setProperty("--cor", solido);
        this.alpha.thumb.style.left = `${a * 100}%`;
        this.alpha.thumb.style.setProperty("--cor", solido);
        this.alpha.root.setAttribute("aria-valuenow", a.toFixed(2));
      }
      this.preview.style.setProperty("--cor", formatColor(this.hsva, "rgb"));
      const atual = rgbToHex(hsvToRgb(this.hsva));
      for (const btn of this.panel.querySelectorAll(".tuc-colorpicker__swatchbtn")) {
        btn.classList.toggle("is-selected", btn.dataset.cor === atual);
      }
      if (document.activeElement !== this.hexField) this.hexField.value = this.getValue();
    }
    _emit() {
      const value = this.getValue();
      const detail = { value, rgb: this.getRgb(), hsva: { ...this.hsva }, instance: this };
      this.opts.onChange?.(value, detail);
      this.input.dispatchEvent(new CustomEvent("tucano:change", { detail, bubbles: true }));
      this.input.dispatchEvent(new Event("change", { bubbles: true }));
    }
  };
  function normalizar(cor) {
    const p = parseColor(cor);
    return p ? rgbToHex(hsvToRgb(p)) : String(cor).toLowerCase();
  }
  function supportsEyeDropper() {
    return typeof window !== "undefined" && "EyeDropper" in window;
  }
  function omitUndefined3(obj) {
    const out = {};
    for (const [k, v] of Object.entries(obj || {})) if (v !== void 0) out[k] = v;
    return out;
  }
  function autoInit3(scope = document) {
    const out = [];
    for (const node of scope.querySelectorAll("[data-tuc-color]:not([data-tuc-ready])")) {
      const d = node.dataset;
      node.setAttribute("data-tuc-ready", "");
      out.push(new ColorPicker(node, {
        format: d.format || void 0,
        alpha: d.alpha === "false" ? false : void 0,
        swatches: d.swatches === "false" ? false : d.swatches ? d.swatches.split(/\s*,\s*/) : void 0,
        placement: d.placement || void 0
      }));
    }
    return out;
  }

  // src/js/index.js
  function init(scope = document) {
    return {
      datepickers: autoInit(scope),
      selects: autoInit2(scope),
      colorpickers: autoInit3(scope)
    };
  }
  if (typeof document !== "undefined") {
    const boot = () => init(document);
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
    document.addEventListener("htmx:afterSwap", (e) => init(e.target));
  }
  return __toCommonJS(index_exports);
})();
