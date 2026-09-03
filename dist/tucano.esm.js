var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

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
function abrirComTransicao(node, classe = "is-open") {
  void node.offsetHeight;
  node.classList.add(classe);
}

// src/js/core/popover.js
var DURACAO_SAIDA = 170;
var Popover = class {
  constructor(anchor, panel, options = {}) {
    this.anchor = anchor;
    this.panel = panel;
    this.placement = options.placement || "bottom-start";
    this.offset = options.offset ?? 8;
    this.padding = options.padding ?? 8;
    this.appendTo = options.appendTo || document.body;
    this.matchWidth = options.matchWidth || false;
    this.fecharSeSolto = options.fecharSeSolto || false;
    this.onDismiss = options.onDismiss || (() => {
    });
    this.open = false;
    this._cleanups = [];
    this._reposition = this._reposition.bind(this);
  }
  show() {
    if (this.open) return;
    this.open = true;
    clearTimeout(this._saida);
    this.panel.classList.remove("is-closing");
    this.panel.style.position = "absolute";
    this.panel.style.top = "0";
    this.panel.style.left = "0";
    this.panel.style.margin = "0";
    this.appendTo.append(this.panel);
    this._seta = this.panel.querySelector("[data-tuc-seta]");
    this._reposition();
    if (!this.open) return;
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
  /**
   * `animar` mantem o painel no DOM pelo tempo da transicao de saida. Sem
   * isso ele desaparece no mesmo quadro, e so a entrada tem movimento — o
   * fechamento fica seco em comparacao.
   */
  hide({ animar = true } = {}) {
    if (!this.open) return;
    this.open = false;
    this._cleanups.forEach((fn) => fn());
    this._cleanups = [];
    this._ro?.disconnect();
    this._ro = null;
    clearTimeout(this._saida);
    if (!animar) {
      this.panel.classList.remove("is-closing");
      this.panel.remove();
      return;
    }
    this.panel.classList.add("is-closing");
    this._saida = setTimeout(() => {
      this.panel.classList.remove("is-closing");
      this.panel.remove();
    }, DURACAO_SAIDA);
  }
  destroy() {
    this.hide();
  }
  _reposition() {
    if (!this.open) return;
    const a = this.anchor.getBoundingClientRect();
    if (this.matchWidth) this.panel.style.minWidth = `${Math.round(a.width)}px`;
    const p = { width: this.panel.offsetWidth, height: this.panel.offsetHeight };
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    if (this.fecharSeSolto && (a.bottom < 0 || a.top > vh || a.right < 0 || a.left > vw)) {
      this.onDismiss("solto");
      return;
    }
    const [side, align = "start"] = this.placement.split("-");
    const deitado = side === "left" || side === "right";
    let placeSide = side;
    let top;
    let left;
    if (deitado) {
      const folgaDir = vw - a.right - this.offset;
      const folgaEsq = a.left - this.offset;
      if (side === "right" && p.width > folgaDir && folgaEsq > folgaDir) placeSide = "left";
      if (side === "left" && p.width > folgaEsq && folgaDir > folgaEsq) placeSide = "right";
      left = placeSide === "left" ? a.left - p.width - this.offset : a.right + this.offset;
      if (align === "end") top = a.bottom - p.height;
      else if (align === "center") top = a.top + a.height / 2 - p.height / 2;
      else top = a.top;
    } else {
      const spaceBelow = vh - a.bottom - this.offset;
      const spaceAbove = a.top - this.offset;
      if (side === "bottom" && p.height > spaceBelow && spaceAbove > spaceBelow) placeSide = "top";
      if (side === "top" && p.height > spaceAbove && spaceBelow > spaceAbove) placeSide = "bottom";
      top = placeSide === "top" ? a.top - p.height - this.offset : a.bottom + this.offset;
      if (p.width >= vw * 0.85) {
        left = (vw - p.width) / 2;
      } else if (align === "end") {
        left = a.right - p.width;
      } else if (align === "center") {
        left = a.left + a.width / 2 - p.width / 2;
      } else {
        left = a.left;
      }
    }
    left = Math.min(Math.max(left, this.padding), Math.max(this.padding, vw - p.width - this.padding));
    top = Math.min(Math.max(top, this.padding), Math.max(this.padding, vh - p.height - this.padding));
    const host = this.appendTo === document.body ? { top: window.scrollY, left: window.scrollX } : (() => {
      const r = this.appendTo.getBoundingClientRect();
      return { top: -r.top + this.appendTo.scrollTop, left: -r.left + this.appendTo.scrollLeft };
    })();
    this.panel.style.left = `${Math.round(left + host.left)}px`;
    this.panel.style.top = `${Math.round(top + host.top)}px`;
    this.panel.dataset.side = placeSide;
    if (this._seta) {
      const meia = this._seta.offsetWidth / 2;
      const limite = 12 + meia;
      const preso = (v, total) => total <= limite * 2 ? total / 2 : Math.min(Math.max(v, limite), total - limite);
      if (deitado) {
        this._seta.style.top = `${preso(a.top + a.height / 2 - top, p.height)}px`;
        this._seta.style.left = placeSide === "left" ? `${p.width}px` : "0px";
      } else {
        this._seta.style.left = `${preso(a.left + a.width / 2 - left, p.width)}px`;
        this._seta.style.top = placeSide === "top" ? `${p.height}px` : "0px";
      }
    }
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
  // Painel proprio em todo lugar, por padrao: um so comportamento para
  // documentar, estilizar e testar. `true` liga o seletor do sistema no
  // celular, `'auto'` liga so onde o ponteiro e de toque.
  native: false,
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
      this.overlay?.showPicker?.();
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
    abrirComTransicao(this.panel);
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
    if (restoreFocus && !this._compacto) {
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
  /**
   * Layout compacto: tela estreita E ponteiro de toque.
   *
   * O 40rem espelha o breakpoint do CSS (core/tokens.css) — os dois precisam
   * concordar. A condicao de toque entra junto para nao desabilitar a
   * digitacao numa janela estreita de desktop.
   */
  get _compacto() {
    if (typeof window === "undefined") return false;
    return !!window.matchMedia?.("(max-width: 40rem) and (pointer: coarse)").matches;
  }
  _setupTarget() {
    if (this.native) return this._setupNative();
    const input = this.input;
    if (this._compacto) {
      input.readOnly = true;
      this._cleanups.push(on(input, "pointerdown", (e) => {
        e.preventDefault();
        this.isOpen ? this.close({ restoreFocus: false }) : this.open();
      }));
    }
    input.setAttribute("autocomplete", "off");
    this._mask = this._compacto ? null : this._maskTemplate();
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
        if (!this._suppressOpen && !this._compacto) this.open();
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
    input.readOnly = true;
    input.setAttribute("autocomplete", "off");
    if (!input.placeholder) input.placeholder = this._placeholder();
    this.overlay = el("input", {
      type: this.opts.time ? "datetime-local" : "date",
      class: "tuc-native",
      tabindex: -1,
      "aria-hidden": "true"
    });
    if (this.opts.min) this.overlay.min = this._nativeValue(this.opts.min);
    if (this.opts.max) this.overlay.max = this._nativeValue(this.opts.max);
    if (this.opts.time) this.overlay.step = this.opts.seconds ? 1 : this.opts.minuteStep * 60;
    this.wrap = el("span", { class: "tuc-native-wrap" });
    input.replaceWith(this.wrap);
    this.wrap.append(input, this.overlay);
    if (this.opts.isoName || input.name) {
      const name = this.opts.isoName || input.name;
      if (!this.opts.isoName && input.name) input.removeAttribute("name");
      this.isoInput = el("input", { type: "hidden", name });
      this.wrap.after(this.isoInput);
    }
    this._cleanups.push(on(this.overlay, "change", () => {
      if (this._emitting) return;
      this.start = this._normalize(parseISO(this.overlay.value));
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
    if (this.input) this.input.value = this._displayValue();
    if (this.overlay) this.overlay.value = this._nativeValue();
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
        class: "tuc-btn is-ghost is-sm",
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
        class: "tuc-btn is-primary is-sm",
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
  chevronDown: "M6 9l6 6 6-6",
  pipette: "M2 22l1-4 10-10 3 3L6 21l-4 1zM15 5l4-4 4 4-4 4-4-4z",
  upload: "M12 16V4M7 9l5-5 5 5M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2",
  file: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6",
  retry: "M21 12a9 9 0 11-9-9c2.5 0 4.9 1 6.7 2.7L21 8M21 3v5h-5",
  spinner: "M21 12a9 9 0 11-9-9",
  alert: "M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z",
  info: "M12 16v-4M12 8h.01M12 22a10 10 0 100-20 10 10 0 000 20z",
  eye: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z M12 15a3 3 0 100-6 3 3 0 000 6z",
  eyeOff: "M10.6 10.6a3 3 0 004.2 4.2 M9.4 5.2A9.7 9.7 0 0112 5c6.4 0 10 7 10 7a17 17 0 01-2.8 3.7 M6.6 6.6A17 17 0 002 12s3.6 7 10 7c1.7 0 3.2-.4 4.5-1 M2 2l20 20"
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
  // Busca no servidor
  url: null,
  // com url, a lista vem do servidor a cada digitacao
  loadOptions: null,
  // (termo) => Promise<[{value,label,disabled,group}]>
  queryParam: "q",
  pageParam: "page",
  // paginacao ao rolar; null desliga
  minChars: 1,
  debounce: 300,
  cache: true,
  // guarda o resultado de cada termo
  cacheSize: 60,
  shortCircuit: false,
  // ver _semChance()
  loadingText: "Buscando...",
  errorText: "Falha ao buscar",
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
    this.remoto = !!(this.opts.url || this.opts.loadOptions);
    this.opts.search = this.remoto ? true : this.opts.search ?? this.items.length >= this.opts.searchMinItems;
    this.estadoBusca = null;
    this._cache = /* @__PURE__ */ new Map();
    this._vazios = /* @__PURE__ */ new Set();
    this._pagina = 1;
    this._temMais = false;
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
    this._cache.clear();
    this._vazios.clear();
    this.items = readOptions(this.native);
    this._renderControl();
    if (this.isOpen) this._renderMenu();
  }
  open() {
    if (this.isOpen || this.native.disabled) return;
    this.isOpen = true;
    this.query = "";
    this.search.value = "";
    if (this.remoto) {
      this.items = this._escolhidos();
      this.estadoBusca = null;
    }
    this.activeIndex = this.items.findIndex((i) => i.selected && !i.disabled);
    this._renderMenu();
    this.popover = new Popover(this.control, this.menu, {
      placement: this.opts.placement,
      appendTo: this.opts.appendTo || document.body,
      matchWidth: true,
      onDismiss: () => this.close()
    });
    this.popover.show();
    abrirComTransicao(this.menu);
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
    clearTimeout(this._timerBusca);
    this._abortar();
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
        if (this.remoto) {
          this._agendarBusca();
          return;
        }
        this.activeIndex = this._filtered().findIndex((i) => !i.disabled);
        this._renderMenu();
        this._renderControl();
      }),
      on(this.search, "keydown", (e) => this._onKeydown(e)),
      // Se o valor mudar por fora (reset de formulario, JS de terceiros).
      on(this.native, "change", () => {
        if (!this._pushing) this._syncFromNative();
      }),
      on(this.list, "scroll", () => this._aoRolarLista())
    );
  }
  _syncFromNative() {
    const escolhidos = new Set([...this.native.selectedOptions].map((o) => o.value));
    for (const item of this.items) item.selected = escolhidos.has(item.value);
    this._renderControl();
  }
  _pushToNative() {
    this._pushing = true;
    if (this.remoto) {
      for (const item of this.items) {
        if (!item.selected) continue;
        if ([...this.native.options].some((o) => o.value === item.value)) continue;
        this.native.append(el("option", { value: item.value, text: item.label }));
      }
    }
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
   * Busca no servidor                                                 *
   * ---------------------------------------------------------------- */
  /**
   * Quatro filtros antes de chegar na rede, do mais barato ao mais caro:
   * tamanho minimo, cache, termo sem chance e requisicao ja em voo. Debounce
   * so no fim, para o que sobrou.
   */
  _agendarBusca() {
    clearTimeout(this._timerBusca);
    const termo = this.query.trim();
    this._pagina = 1;
    if (termo.length < this.opts.minChars) {
      this._abortar();
      this.estadoBusca = null;
      this.items = this._escolhidos();
      this._temMais = false;
      this._renderMenu();
      return;
    }
    const guardado = this.opts.cache ? this._cache.get(termo) : null;
    if (guardado) {
      this._abortar();
      this.estadoBusca = null;
      this._aplicarResultado(guardado, { anexar: false });
      return;
    }
    if (this._semChance(termo)) {
      this._abortar();
      this.estadoBusca = null;
      this._aplicarResultado([], { anexar: false });
      return;
    }
    if (this._termoEmVoo === termo) return;
    this.estadoBusca = "carregando";
    this._renderMenu();
    this._timerBusca = setTimeout(() => this._buscar(termo), this.opts.debounce);
  }
  /**
   * Se "lucas" nao trouxe nada, "lucass" tambem nao traz — desde que a busca
   * do servidor seja por conter o termo, como um icontains do Django.
   *
   * Fica desligado por padrao: com busca aproximada, por sinonimo ou por
   * relevancia, um termo maior pode sim trazer resultado, e cortar aqui
   * esconderia dados sem aviso.
   */
  _semChance(termo) {
    if (!this.opts.shortCircuit) return false;
    for (const vazio of this._vazios) if (termo.startsWith(vazio)) return true;
    return false;
  }
  _guardar(termo, itens) {
    if (!this.opts.cache) return;
    if (this._cache.size >= this.opts.cacheSize) {
      this._cache.delete(this._cache.keys().next().value);
    }
    this._cache.set(termo, itens);
    if (!itens.length) this._vazios.add(termo);
  }
  /** Junta o que veio com quem ja estava escolhido e desenha. */
  _aplicarResultado(vindos, { anexar }) {
    const escolhidos = this._escolhidos();
    const base = anexar ? this.items : escolhidos;
    const novos = vindos.filter((i) => !base.some((e) => e.value === i.value));
    this.items = [...base, ...novos];
    this.activeIndex = this.items.findIndex((i) => !i.disabled && !i.selected);
    this._renderMenu();
  }
  _abortar() {
    this._controle?.abort();
    this._controle = null;
  }
  async _buscar(termo, { pagina = 1 } = {}) {
    this._abortar();
    const controle = new AbortController();
    this._controle = controle;
    this._termoEmVoo = termo;
    try {
      const brutos = this.opts.loadOptions ? await this.opts.loadOptions(termo, { signal: controle.signal, page: pagina }) : await this._buscarUrl(termo, controle.signal, pagina);
      if (controle.signal.aborted) return;
      const vindos = normalizarOpcoes(brutos);
      this._temMais = temProximaPagina(brutos, vindos, this.opts.pageParam);
      this.estadoBusca = null;
      if (pagina === 1) this._guardar(termo, vindos);
      this._aplicarResultado(vindos, { anexar: pagina > 1 });
      return;
    } catch (e) {
      if (e.name === "AbortError" || controle.signal.aborted) return;
      this.estadoBusca = "erro";
      this._renderMenu();
    } finally {
      if (this._controle === controle) {
        this._controle = null;
        this._termoEmVoo = null;
      }
    }
  }
  async _buscarUrl(termo, signal, pagina = 1) {
    const url = new URL(this.opts.url, location.href);
    url.searchParams.set(this.opts.queryParam, termo);
    if (pagina > 1 && this.opts.pageParam) url.searchParams.set(this.opts.pageParam, String(pagina));
    const r = await fetch(url, { signal, headers: { Accept: "application/json" } });
    if (!r.ok) throw new Error(`O servidor respondeu ${r.status}`);
    return r.json();
  }
  /**
   * Proxima pagina ao chegar perto do fim da lista. Carregar de uma vez os
   * dez mil registros e o que trava a pagina; vinte por vez, nao.
   */
  _aoRolarLista() {
    if (!this.remoto || !this._temMais || this.estadoBusca === "carregando") return;
    const l = this.list;
    if (l.scrollTop + l.clientHeight < l.scrollHeight - 48) return;
    this._pagina += 1;
    this.estadoBusca = "carregando";
    this._renderMenu();
    this._buscar(this.query.trim(), { pagina: this._pagina });
  }
  _escolhidos() {
    return this.items.filter((i) => i.selected);
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
    if (this.remoto) return this.items;
    const q = this.query.trim().toLowerCase();
    if (!q) return this.items;
    return this.items.filter((i) => i.busca.includes(q));
  }
  _renderMenu() {
    const visiveis = this._filtered();
    this.list.replaceChildren();
    if (this.estadoBusca === "carregando") {
      this.list.append(el("div", { class: "tuc-select__empty is-loading", text: this.opts.loadingText }));
      return;
    }
    if (this.estadoBusca === "erro") {
      this.list.append(el("div", { class: "tuc-select__empty is-error", text: this.opts.errorText }));
      return;
    }
    if (!visiveis.length) {
      const faltaDigitar = this.remoto && this.query.trim().length < this.opts.minChars;
      this.list.append(el("div", {
        class: "tuc-select__empty",
        text: faltaDigitar ? `Digite ${this.opts.minChars} caractere${this.opts.minChars > 1 ? "s" : ""} para buscar` : this.opts.emptyText
      }));
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
function normalizarOpcoes(dados) {
  const lista = Array.isArray(dados) ? dados : dados?.results ?? dados?.items ?? dados?.data ?? [];
  return lista.map((o) => {
    if (o == null) return null;
    if (typeof o !== "object") return { value: String(o), label: String(o), disabled: false, group: null, selected: false, busca: normalize(String(o)) };
    const value = String(o.value ?? o.id ?? o.pk ?? "");
    const label = String(o.label ?? o.text ?? o.nome ?? o.name ?? value);
    return { value, label, disabled: !!o.disabled, group: o.group ?? o.grupo ?? null, selected: false, busca: normalize(`${label} ${value}`) };
  }).filter((o) => o && o.value !== "");
}
function temProximaPagina(brutos, itens, pageParam) {
  if (!pageParam) return false;
  if (brutos && typeof brutos === "object" && !Array.isArray(brutos)) {
    if ("next" in brutos) return !!brutos.next;
    if ("has_more" in brutos) return !!brutos.has_more;
  }
  return itens.length > 0;
}
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
      url: d.url || void 0,
      queryParam: d.queryParam || void 0,
      minChars: d.minChars ? +d.minChars : void 0,
      debounce: d.debounce ? +d.debounce : void 0,
      pageParam: d.pageParam === "false" ? null : d.pageParam || void 0,
      cache: d.cache === "false" ? false : void 0,
      shortCircuit: d.shortCircuit === "true" ? true : void 0,
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
    abrirComTransicao(this.panel);
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
        if (this._emitting) return;
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
    this._emitting = true;
    try {
      this.opts.onChange?.(value, detail);
      this.input.dispatchEvent(new CustomEvent("tucano:change", { detail, bubbles: true }));
      this.input.dispatchEvent(new Event("change", { bubbles: true }));
    } finally {
      this._emitting = false;
    }
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

// src/js/core/files.js
function formatSize(bytes, locale = "pt-BR") {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  const unidades = ["KB", "MB", "GB", "TB"];
  let n = bytes / 1024;
  let i = 0;
  while (n >= 1024 && i < unidades.length - 1) {
    n /= 1024;
    i++;
  }
  const casas = n < 10 ? 1 : 0;
  return `${n.toLocaleString(locale, { maximumFractionDigits: casas })} ${unidades[i]}`;
}
function parseSize(valor) {
  if (typeof valor === "number") return valor;
  const m = /^([\d.,]+)\s*(b|kb|mb|gb)?$/i.exec(String(valor || "").trim());
  if (!m) return null;
  const n = parseFloat(m[1].replace(",", "."));
  const fator = { b: 1, kb: 1024, mb: 1024 ** 2, gb: 1024 ** 3 }[(m[2] || "b").toLowerCase()];
  return Math.round(n * fator);
}
function matchesAccept(file, accept) {
  if (!accept) return true;
  const nome = file.name.toLowerCase();
  const tipo = (file.type || "").toLowerCase();
  return accept.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean).some((regra) => {
    if (regra.startsWith(".")) return nome.endsWith(regra);
    if (regra.endsWith("/*")) return tipo.startsWith(regra.slice(0, -1));
    return tipo === regra;
  });
}
function isImage(file) {
  return (file.type || "").startsWith("image/");
}
function csrfToken(nome = "csrftoken") {
  const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${nome}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}
function uploadFile({ url, file, campo = "file", extras = {}, headers = {}, onProgress }) {
  const xhr = new XMLHttpRequest();
  const promessa = new Promise((resolve, reject) => {
    const dados = new FormData();
    dados.append(campo, file);
    for (const [k, v] of Object.entries(extras)) dados.append(k, v);
    xhr.open("POST", url);
    xhr.responseType = "json";
    for (const [k, v] of Object.entries(headers)) if (v != null) xhr.setRequestHeader(k, v);
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total, e.loaded, e.total);
    });
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response ?? {});
      } else {
        reject(new Error(`O servidor respondeu ${xhr.status}`));
      }
    });
    xhr.addEventListener("error", () => reject(new Error("Falha de rede")));
    xhr.addEventListener("abort", () => reject(Object.assign(new Error("Cancelado"), { cancelado: true })));
    xhr.send(dados);
  });
  return { promessa, abortar: () => xhr.abort() };
}
var seq = 0;
function fileId() {
  return `f${Date.now().toString(36)}${(seq++).toString(36)}`;
}

// src/js/components/upload.js
var DEFAULTS4 = {
  url: null,
  // com url: upload direto. sem: os arquivos vao no submit
  method: "POST",
  fieldName: "file",
  // nome do campo no FormData do upload direto
  extraData: {},
  // campos extras enviados junto
  headers: {},
  csrf: true,
  // manda X-CSRFToken lido do cookie (Django)
  responseId: "id",
  // chave do id na resposta JSON
  responseUrl: "url",
  // chave da url na resposta JSON
  deleteUrl: null,
  // se definido, remover chama DELETE aqui
  maxSize: null,
  // '5mb' ou bytes
  maxFiles: null,
  autoUpload: true,
  // no modo direto, comeca ao soltar
  locale: void 0,
  texts: {},
  onChange: null,
  onError: null
};
var TEXTOS = {
  zona: "Arraste arquivos aqui ou clique para escolher",
  zonaUm: "Arraste um arquivo aqui ou clique para escolher",
  soltar: "Solte para enviar",
  enviando: "Enviando...",
  pronto: "Enviado",
  cancelar: "Cancelar",
  remover: "Remover",
  repetir: "Tentar de novo",
  grande: (max) => `Arquivo maior que ${max}`,
  tipo: "Tipo de arquivo n\xE3o aceito",
  demais: (n) => `No m\xE1ximo ${n} arquivo${n > 1 ? "s" : ""}`
};
var Upload = class {
  constructor(target, options = {}) {
    const node = typeof target === "string" ? document.querySelector(target) : target;
    if (!node) throw new Error("[Upload] elemento alvo nao encontrado");
    if (node.tagName !== "INPUT" || node.type !== "file") {
      throw new Error('[Upload] o alvo precisa ser um <input type="file">');
    }
    this.opts = { ...DEFAULTS4, ...omitUndefined4(options) };
    this.opts.locale = this.opts.locale || document.documentElement.lang || "pt-BR";
    this.t = { ...TEXTOS, ...this.opts.texts };
    this.opts.maxSize = this.opts.maxSize == null ? null : parseSize(this.opts.maxSize);
    this.input = node;
    this.direto = !!this.opts.url;
    this.multiplo = node.multiple;
    this.id = nextId("up");
    this.itens = [];
    this._cleanups = [];
    this._arrastando = 0;
    this._build();
    node._tucano = this;
  }
  /* ---------------------------------------------------------------- *
   * API publica                                                       *
   * ---------------------------------------------------------------- */
  /** Arquivos aceitos, na ordem. No modo direto inclui a resposta do servidor. */
  getFiles() {
    return this.itens.map((i) => ({
      name: i.file.name,
      size: i.file.size,
      type: i.file.type,
      status: i.estado,
      progress: i.progresso,
      id: i.idServidor ?? null,
      url: i.url ?? null,
      file: i.file
    }));
  }
  /** Ids devolvidos pelo servidor (modo direto). E o que o formulario posta. */
  getValue() {
    const prontos = this.itens.filter((i) => i.estado === "pronto" && i.idServidor != null);
    return this.direto ? prontos.map((i) => i.idServidor) : this.itens.map((i) => i.file);
  }
  /** Sobe o que estiver pendente. Util com autoUpload: false. */
  uploadAll() {
    for (const item of this.itens) if (item.estado === "pendente") this._enviar(item);
  }
  clear() {
    for (const item of [...this.itens]) this._remover(item, { silencioso: true });
    this._emit();
  }
  destroy() {
    this._cleanups.forEach((fn) => fn());
    this._cleanups = [];
    for (const i of this.itens) if (i.preview) URL.revokeObjectURL(i.preview);
    this.raiz.replaceWith(this.input);
    this.input.classList.remove("tuc-upload-native");
    this.hidden?.remove();
    delete this.input._tucano;
  }
  /* ---------------------------------------------------------------- *
   * Construcao                                                        *
   * ---------------------------------------------------------------- */
  _build() {
    const input = this.input;
    input.classList.add("tuc-upload-native");
    if (this.direto && input.name) {
      this.nomeCampo = input.name;
      input.removeAttribute("name");
    }
    this.zona = el("div", {
      class: "tuc-upload__zone",
      role: "button",
      tabindex: 0,
      "aria-describedby": `${this.id}-dica`
    }, [
      el("span", { class: "tuc-upload__icon" }, [icon(ICONS_EXTRA.upload, 20)]),
      el("span", { class: "tuc-upload__label", text: this.multiplo ? this.t.zona : this.t.zonaUm }),
      el("span", { class: "tuc-upload__hint", id: `${this.id}-dica`, text: this._dica() })
    ]);
    this.lista = el("ul", { class: "tuc-upload__list" });
    this.raiz = el("div", { class: "tuc-upload", id: this.id }, [this.zona, this.lista]);
    input.replaceWith(this.raiz);
    this.raiz.append(input);
    const abrir = () => input.click();
    this._cleanups.push(
      on(this.zona, "click", abrir),
      on(this.zona, "keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          abrir();
        }
      }),
      on(input, "change", () => {
        this._adicionar([...input.files]);
      }),
      ...this._arrastarESoltar()
    );
    this._renderLista();
  }
  _dica() {
    const partes = [];
    if (this.input.accept) partes.push(this.input.accept.split(",").map((s) => s.trim()).join(", "));
    if (this.opts.maxSize) partes.push(`at\xE9 ${formatSize(this.opts.maxSize, this.opts.locale)}`);
    if (this.opts.maxFiles) partes.push(this.t.demais(this.opts.maxFiles).toLowerCase());
    return partes.join(" \xB7 ");
  }
  /**
   * Arrastar e soltar. O contador existe porque `dragleave` dispara tambem ao
   * passar de um filho para outro dentro da zona — sem contar entradas e
   * saidas, o realce pisca.
   */
  _arrastarESoltar() {
    const parar = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    return [
      on(this.raiz, "dragenter", (e) => {
        parar(e);
        this._arrastando++;
        this.raiz.classList.add("is-dragging");
        this.zona.querySelector(".tuc-upload__label").textContent = this.t.soltar;
      }),
      on(this.raiz, "dragover", parar),
      on(this.raiz, "dragleave", (e) => {
        parar(e);
        if (--this._arrastando <= 0) this._pararArraste();
      }),
      on(this.raiz, "drop", (e) => {
        parar(e);
        this._arrastando = 0;
        this._pararArraste();
        this._adicionar([...e.dataTransfer?.files || []]);
      })
    ];
  }
  _pararArraste() {
    this._arrastando = 0;
    this.raiz.classList.remove("is-dragging");
    this.zona.querySelector(".tuc-upload__label").textContent = this.multiplo ? this.t.zona : this.t.zonaUm;
  }
  /* ---------------------------------------------------------------- *
   * Arquivos                                                          *
   * ---------------------------------------------------------------- */
  _adicionar(arquivos) {
    if (!arquivos.length) return;
    if (!this.multiplo) {
      for (const item of [...this.itens]) this._remover(item, { silencioso: true });
      arquivos = arquivos.slice(0, 1);
    }
    for (const file of arquivos) {
      const erro = this._validar(file);
      if (erro) {
        this._erro(erro, file);
        continue;
      }
      const item = {
        chave: fileId(),
        file,
        estado: "pendente",
        progresso: 0,
        preview: isImage(file) ? URL.createObjectURL(file) : null
      };
      this.itens.push(item);
      if (this.direto && this.opts.autoUpload) this._enviar(item);
    }
    this._sincronizarNativo();
    this._renderLista();
    this._emit();
  }
  _validar(file) {
    if (this.opts.maxFiles && this.itens.length >= this.opts.maxFiles) {
      return this.t.demais(this.opts.maxFiles);
    }
    if (this.opts.maxSize && file.size > this.opts.maxSize) {
      return this.t.grande(formatSize(this.opts.maxSize, this.opts.locale));
    }
    if (!matchesAccept(file, this.input.accept)) return this.t.tipo;
    return null;
  }
  /**
   * No modo formulario o <input type="file"> precisa carregar os arquivos —
   * inclusive os que vieram por arrastar. DataTransfer e a unica forma de
   * escrever em input.files.
   */
  _sincronizarNativo() {
    if (this.direto) return;
    try {
      const dt = new DataTransfer();
      for (const item of this.itens) dt.items.add(item.file);
      this.input.files = dt.files;
    } catch {
    }
  }
  _enviar(item) {
    item.estado = "enviando";
    item.progresso = 0;
    item.erro = null;
    this._renderLista();
    const headers = { ...this.opts.headers };
    if (this.opts.csrf && !headers["X-CSRFToken"]) {
      const token = csrfToken();
      if (token) headers["X-CSRFToken"] = token;
    }
    const { promessa, abortar } = uploadFile({
      url: this.opts.url,
      file: item.file,
      campo: this.opts.fieldName,
      extras: this.opts.extraData,
      headers,
      onProgress: (fracao) => {
        item.progresso = fracao;
        this._pintarProgresso(item);
      }
    });
    item.abortar = abortar;
    promessa.then((resposta) => {
      item.estado = "pronto";
      item.progresso = 1;
      item.resposta = resposta;
      item.idServidor = resposta?.[this.opts.responseId] ?? null;
      item.url = resposta?.[this.opts.responseUrl] ?? null;
    }).catch((e) => {
      if (e.cancelado) {
        const i = this.itens.indexOf(item);
        if (i >= 0) this.itens.splice(i, 1);
        if (item.preview) URL.revokeObjectURL(item.preview);
      } else {
        item.estado = "erro";
        item.erro = e.message;
        this.opts.onError?.(e, item.file);
      }
    }).finally(() => {
      item.abortar = null;
      this._renderLista();
      this._emit();
    });
  }
  _remover(item, { silencioso = false } = {}) {
    item.abortar?.();
    const i = this.itens.indexOf(item);
    if (i >= 0) this.itens.splice(i, 1);
    if (item.preview) URL.revokeObjectURL(item.preview);
    if (this.direto && this.opts.deleteUrl && item.idServidor != null) {
      const headers = { ...this.opts.headers };
      if (this.opts.csrf) {
        const t = csrfToken();
        if (t) headers["X-CSRFToken"] = t;
      }
      fetch(`${this.opts.deleteUrl}${item.idServidor}/`, { method: "DELETE", headers }).catch(() => {
      });
    }
    this._sincronizarNativo();
    this._renderLista();
    if (!silencioso) this._emit();
  }
  _erro(mensagem, file) {
    this.opts.onError?.(new Error(mensagem), file);
    const aviso = el("li", { class: "tuc-upload__item is-rejected" }, [
      el("span", { class: "tuc-upload__thumb" }, [icon(ICONS_EXTRA.alert, 16)]),
      el("div", { class: "tuc-upload__info" }, [
        el("span", { class: "tuc-upload__name", text: file.name }),
        el("span", { class: "tuc-upload__meta", text: mensagem })
      ])
    ]);
    this.lista.append(aviso);
    setTimeout(() => aviso.remove(), 5e3);
  }
  /* ---------------------------------------------------------------- *
   * Render                                                            *
   * ---------------------------------------------------------------- */
  /** So a barra: chamado a cada evento de progresso, nao pode refazer a lista. */
  _pintarProgresso(item) {
    const li = this.lista.querySelector(`[data-chave="${item.chave}"]`);
    if (!li) return;
    const barra = li.querySelector(".tuc-upload__barfill");
    if (barra) barra.style.width = `${Math.round(item.progresso * 100)}%`;
    const meta = li.querySelector(".tuc-upload__meta");
    if (meta) meta.textContent = `${Math.round(item.progresso * 100)}% \xB7 ${formatSize(item.file.size, this.opts.locale)}`;
  }
  _renderLista() {
    for (const n of [...this.lista.children]) if (!n.classList.contains("is-rejected")) n.remove();
    for (const item of this.itens) {
      const pct = Math.round(item.progresso * 100);
      const meta = item.estado === "enviando" ? `${pct}% \xB7 ${formatSize(item.file.size, this.opts.locale)}` : item.estado === "erro" ? item.erro : formatSize(item.file.size, this.opts.locale);
      const acoes = [];
      if (item.estado === "enviando") {
        acoes.push(this._botao(ICONS.x, this.t.cancelar, () => item.abortar?.()));
      } else if (item.estado === "erro") {
        acoes.push(this._botao(ICONS_EXTRA.retry, this.t.repetir, () => this._enviar(item)));
        acoes.push(this._botao(ICONS.x, this.t.remover, () => this._remover(item)));
      } else {
        acoes.push(this._botao(ICONS.x, this.t.remover, () => this._remover(item)));
      }
      this.lista.append(el("li", {
        class: `tuc-upload__item is-${item.estado}`,
        dataset: { chave: item.chave }
      }, [
        item.preview ? el("img", { class: "tuc-upload__thumb", src: item.preview, alt: "" }) : el("span", { class: "tuc-upload__thumb" }, [icon(ICONS_EXTRA.file, 16)]),
        el("div", { class: "tuc-upload__info" }, [
          el("span", { class: "tuc-upload__name", title: item.file.name, text: item.file.name }),
          el("span", { class: "tuc-upload__meta", text: meta }),
          item.estado === "enviando" ? el("span", { class: "tuc-upload__bar" }, [
            el("span", { class: "tuc-upload__barfill", style: `width:${pct}%` })
          ]) : null
        ]),
        item.estado === "pronto" ? el("span", { class: "tuc-upload__ok" }, [icon(ICONS_EXTRA.check, 15)]) : null,
        el("div", { class: "tuc-upload__actions" }, acoes)
      ]));
    }
    this._sincronizarHidden();
    this.raiz.classList.toggle("is-empty", !this.itens.length);
  }
  _botao(caminho, rotulo, aoClicar) {
    return el("button", {
      type: "button",
      class: "tuc-upload__action",
      "aria-label": rotulo,
      title: rotulo,
      onclick: (e) => {
        e.stopPropagation();
        aoClicar();
      }
    }, [icon(caminho, 14)]);
  }
  /** Modo direto: os ids prontos viram inputs hidden com o `name` original. */
  _sincronizarHidden() {
    if (!this.direto || !this.nomeCampo) return;
    this.hidden?.remove();
    this.hidden = el(
      "span",
      { class: "tuc-upload__hidden" },
      this.itens.filter((i) => i.estado === "pronto" && i.idServidor != null).map((i) => el("input", { type: "hidden", name: this.nomeCampo, value: String(i.idServidor) }))
    );
    this.raiz.append(this.hidden);
  }
  _emit() {
    const detail = { value: this.getValue(), files: this.getFiles(), instance: this };
    this.opts.onChange?.(detail.value, detail);
    this.input.dispatchEvent(new CustomEvent("tucano:change", { detail, bubbles: true }));
  }
};
function omitUndefined4(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) if (v !== void 0) out[k] = v;
  return out;
}
function autoInit4(scope = document) {
  const out = [];
  for (const node of scope.querySelectorAll("input[type=file][data-tuc-upload]:not([data-tuc-ready])")) {
    const d = node.dataset;
    node.setAttribute("data-tuc-ready", "");
    out.push(new Upload(node, {
      url: d.url || void 0,
      deleteUrl: d.deleteUrl || void 0,
      fieldName: d.fieldName || void 0,
      responseId: d.responseId || void 0,
      responseUrl: d.responseUrl || void 0,
      maxSize: d.maxSize || void 0,
      maxFiles: d.maxFiles ? +d.maxFiles : void 0,
      autoUpload: d.autoUpload === "false" ? false : void 0,
      csrf: d.csrf === "false" ? false : void 0
    }));
  }
  return out;
}

// src/js/core/mask.js
var mask_exports = {};
__export(mask_exports, {
  aplicar: () => aplicar,
  aplicarMoeda: () => aplicarMoeda,
  capacidade: () => capacidade,
  cursorApos: () => cursorApos,
  escolherGabarito: () => escolherGabarito,
  formatar: () => formatar,
  isMarcador: () => isMarcador,
  limpar: () => limpar,
  obscurecer: () => obscurecer,
  obscurecerEmail: () => obscurecerEmail,
  validarCNPJ: () => validarCNPJ,
  validarCPF: () => validarCPF,
  validarCpfCnpj: () => validarCpfCnpj
});
var MARCADORES = {
  "#": (c) => c >= "0" && c <= "9",
  "A": (c) => /[a-zA-Z]/.test(c),
  "*": (c) => /[0-9a-zA-Z]/.test(c)
};
function isMarcador(c) {
  return Object.hasOwn(MARCADORES, c);
}
function limpar(valor, gabarito) {
  const aceita = [...new Set([...gabarito].filter(isMarcador))].map((m) => MARCADORES[m]);
  if (!aceita.length) return "";
  return [...String(valor ?? "")].filter((c) => aceita.some((f) => f(c))).join("");
}
function capacidade(gabarito) {
  return [...gabarito].filter(isMarcador).length;
}
function aplicar(caracteres, gabarito) {
  if (!caracteres.length) return "";
  let saida = "";
  let i = 0;
  for (const ch of gabarito) {
    if (isMarcador(ch)) {
      let aceito = null;
      while (i < caracteres.length) {
        const candidato = caracteres[i++];
        if (MARCADORES[ch](candidato)) {
          aceito = candidato;
          break;
        }
      }
      if (aceito === null) break;
      saida += aceito;
    } else {
      saida += ch;
    }
  }
  return saida;
}
function cursorApos(texto, n) {
  if (n <= 0) return 0;
  let vistos = 0;
  for (let i = 0; i < texto.length; i++) {
    if (/[0-9A-Za-z]/.test(texto[i]) && ++vistos === n) return i + 1;
  }
  return texto.length;
}
function escolherGabarito(caracteres, gabaritos) {
  const lista = [].concat(gabaritos);
  if (lista.length === 1) return lista[0];
  const n = caracteres.length;
  return lista.find((g) => n <= capacidade(g)) || lista[lista.length - 1];
}
function aplicarMoeda(digitos, { decimais = 2, locale = "pt-BR", moeda = null } = {}) {
  const limpos = String(digitos).replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  if (!limpos) return "";
  const n = Number(limpos) / 10 ** decimais;
  return n.toLocaleString(locale, {
    minimumFractionDigits: decimais,
    maximumFractionDigits: decimais,
    ...moeda ? { style: "currency", currency: moeda } : {}
  });
}
function digitoModulo11(valores, pesoInicial) {
  let soma = 0;
  let peso = pesoInicial;
  for (const v of valores) {
    soma += v * peso;
    peso = peso === 2 ? 9 : peso - 1;
  }
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}
function validarCPF(valor) {
  const d = String(valor ?? "").replace(/\D/g, "");
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;
  const n = [...d].map(Number);
  const dv1 = digitoModulo11(n.slice(0, 9), 10);
  const dv2 = digitoModulo11(n.slice(0, 10), 11);
  return dv1 === n[9] && dv2 === n[10];
}
function validarCNPJ(valor) {
  const s = String(valor ?? "").toUpperCase().replace(/[^0-9A-Z]/g, "");
  if (s.length !== 14) return false;
  if (!/^[0-9A-Z]{12}\d{2}$/.test(s)) return false;
  if (/^(.)\1{13}$/.test(s)) return false;
  const valores = [...s].map((c) => c.charCodeAt(0) - 48);
  const dv1 = digitoModulo11(valores.slice(0, 12), 5);
  const dv2 = digitoModulo11(valores.slice(0, 13), 6);
  return dv1 === valores[12] && dv2 === valores[13];
}
function validarCpfCnpj(valor) {
  const s = String(valor ?? "").replace(/[^0-9A-Za-z]/g, "");
  if (s.length === 11) return validarCPF(s);
  if (s.length === 14) return validarCNPJ(s);
  return false;
}
function formatar(valor, formato, opcoes = {}) {
  const bruto = String(valor ?? "").trim();
  if (!bruto) return "";
  if (formato === "moeda" || formato === "real") {
    const n = typeof valor === "number" ? valor : Number(bruto.replace(/\.(?=\d{3}\b)/g, "").replace(",", "."));
    if (!Number.isFinite(n)) return bruto;
    const { decimais = 2, locale = "pt-BR" } = opcoes;
    const moeda = opcoes.moeda ?? (formato === "real" ? "BRL" : null);
    return n.toLocaleString(locale, {
      minimumFractionDigits: decimais,
      maximumFractionDigits: decimais,
      ...moeda ? { style: "currency", currency: moeda } : {}
    });
  }
  const gabaritos = GABARITOS_EXIBICAO[formato] ?? formato;
  const todos = [].concat(gabaritos).join("");
  const chars = limpar(bruto, todos);
  if (!chars) return bruto;
  const gabarito = escolherGabarito(chars, gabaritos);
  return chars.length === capacidade(gabarito) ? aplicar(chars, gabarito) : bruto;
}
var GABARITOS_EXIBICAO = {
  cpf: "###.###.###-##",
  cnpj: "**.***.***/****-##",
  "cpf-cnpj": ["###.###.###-##", "**.***.***/****-##"],
  documento: ["###.###.###-##", "**.***.***/****-##"],
  telefone: ["(##) ####-####", "(##) #####-####"],
  celular: "(##) #####-####",
  cep: "#####-###",
  cartao: "#### #### #### ####"
};
var PONTO = "\u2022";
function obscurecer(texto, visiveis = 2, modo = "fim") {
  const s = String(texto ?? "");
  if (!s) return s;
  if (modo === "email") return obscurecerEmail(s);
  const alfanumerico = (c) => /[0-9A-Za-z]/.test(c);
  const total = [...s].filter(alfanumerico).length;
  const mostrar = modo === "tudo" ? 0 : visiveis;
  let vistos = 0;
  return [...s].map((c) => {
    if (!alfanumerico(c)) return modo === "tudo" ? PONTO : c;
    vistos++;
    return vistos > total - mostrar ? c : PONTO;
  }).join("");
}
function obscurecerEmail(valor) {
  const s = String(valor ?? "");
  const arroba = s.lastIndexOf("@");
  if (arroba < 1) return obscurecer(s, 0, "tudo");
  const local = s.slice(0, arroba);
  const dominio = s.slice(arroba);
  return local[0] + PONTO.repeat(Math.max(local.length - 1, 1)) + dominio;
}

// src/js/components/mask.js
var FORMATOS = {
  cpf: { gabarito: "###.###.###-##", validar: validarCPF, erro: "CPF inv\xE1lido" },
  cnpj: { gabarito: "**.***.***/****-##", validar: validarCNPJ, erro: "CNPJ inv\xE1lido", maiusculas: true },
  "cnpj-numerico": { gabarito: "##.###.###/####-##", validar: validarCNPJ, erro: "CNPJ inv\xE1lido" },
  "cpf-cnpj": {
    gabarito: ["###.###.###-##", "**.***.***/****-##"],
    validar: validarCpfCnpj,
    erro: "Documento inv\xE1lido",
    maiusculas: true
  },
  telefone: { gabarito: ["(##) ####-####", "(##) #####-####"] },
  celular: { gabarito: "(##) #####-####" },
  cep: { gabarito: "#####-###" },
  data: { gabarito: "##/##/####" },
  hora: { gabarito: "##:##" },
  cartao: { gabarito: "#### #### #### ####" },
  moeda: { moeda: true },
  real: { moeda: true, currency: "BRL" }
};
var DEFAULTS5 = {
  format: null,
  // nome de FORMATOS ou gabarito livre
  validate: false,
  // valida no blur e bloqueia o submit
  decimals: 2,
  currency: null,
  // 'BRL' formata com R$
  reveal: false,
  // olhinho para mostrar e ocultar
  revealVisible: 2,
  // quantos caracteres ficam a mostra no modo 'fim'
  revealMode: null,
  // 'fim' | 'email' | 'tudo'. null decide pelo campo
  locale: void 0,
  errorText: null,
  onChange: null
};
var Mask = class {
  constructor(target, options = {}) {
    const node = typeof target === "string" ? document.querySelector(target) : target;
    if (!node) throw new Error("[Mask] elemento alvo nao encontrado");
    this.opts = { ...DEFAULTS5, ...omitUndefined5(options) };
    this.opts.locale = this.opts.locale || document.documentElement.lang || "pt-BR";
    this.input = node;
    const preset = FORMATOS[this.opts.format];
    this.preset = preset || null;
    this.moeda = !!preset?.moeda;
    this.gabaritos = preset ? preset.gabarito : this.opts.format;
    this.maiusculas = !!preset?.maiusculas;
    if (preset?.currency && !this.opts.currency) this.opts.currency = preset.currency;
    if (!this.moeda && !this.gabaritos && !this.opts.reveal) {
      throw new Error("[Mask] informe um formato ou gabarito");
    }
    this._cleanups = [];
    this._ligar();
    if (node.value && !this.moeda && this.gabaritos) this._formatar({ manterCursor: false });
    else if (node.value && this.moeda) this._formatar({ manterCursor: false });
    if (this.opts.reveal) this._montarOlho();
    node._tucano = this;
  }
  /* ---------------------------------------------------------------- *
   * API publica                                                       *
   * ---------------------------------------------------------------- */
  /** Conteudo sem formatacao: so digitos, ou digitos e letras. */
  getRaw() {
    const texto = this.valorReal ?? this.input.value;
    if (this.moeda) return texto.replace(/\D/g, "");
    if (!this.gabaritos) return texto;
    return limpar(texto, [].concat(this.gabaritos).join(""));
  }
  /** Numero, no formato moeda. */
  getNumber() {
    if (!this.moeda) return null;
    const d = this.getRaw();
    return d ? Number(d) / 10 ** this.opts.decimals : null;
  }
  setValue(valor) {
    this.input.value = String(valor ?? "");
    this._formatar({ manterCursor: false });
    this._emit();
  }
  isValid() {
    const validar = this.preset?.validar;
    if (!validar) return true;
    const bruto = this.getRaw();
    return bruto ? validar(bruto) : true;
  }
  destroy() {
    this._cleanups.forEach((fn) => fn());
    this._cleanups = [];
    if (this.envolucro) {
      if (this.valorReal != null) this.input.value = this.valorReal;
      if (this.nomeReal) this.input.name = this.nomeReal;
      this.input.readOnly = this.readOnlyOriginal ?? false;
      this.envolucro.replaceWith(this.input);
      this.oculto?.remove();
    }
    this.input.setCustomValidity?.("");
    this.input.classList.remove("tuc-invalid");
    delete this.input._tucano;
  }
  /* ---------------------------------------------------------------- *
   * Olhinho: mostrar e ocultar                                        *
   * ---------------------------------------------------------------- */
  /**
   * Campo sensivel.
   *
   * Num <input type="password"> o olho so alterna o `type`, que e o
   * comportamento que todo mundo espera.
   *
   * Nos demais, o valor real fica num input hidden que carrega o `name`, e o
   * campo visivel mostra `•••.•••.•••-01`. Assim o que aparece na tela nunca
   * e o dado inteiro, mas o formulario posta o valor certo — nada muda no
   * servidor. Campo vazio comeca visivel: quem esta digitando precisa ver.
   */
  _montarOlho() {
    const input = this.input;
    this.senha = input.type === "password";
    this.envolucro = el("span", { class: "tuc-field" });
    input.replaceWith(this.envolucro);
    this.envolucro.append(input);
    if (!this.senha && input.name) {
      this.nomeReal = input.name;
      input.removeAttribute("name");
      this.oculto = el("input", { type: "hidden", name: this.nomeReal, value: this.getRaw() });
      this.envolucro.append(this.oculto);
    }
    this.olho = el("button", {
      type: "button",
      class: "tuc-field__eye",
      "aria-label": "Mostrar",
      "aria-pressed": "false",
      onclick: () => this._alternar()
    });
    this.envolucro.append(this.olho);
    this.mostrando = !input.value;
    this._pintarOlho();
    this._cleanups.push(on(input, "input", () => {
      if (this.oculto) this.oculto.value = this.getRaw();
    }));
  }
  /**
   * Modo de esconder. Escolhido pelo campo quando nao informado: `type=email`
   * guarda o dominio, o resto guarda o fim.
   */
  _modoOculto() {
    if (this.opts.revealMode) return this.opts.revealMode;
    if (this.input.type === "email") return "email";
    return "fim";
  }
  _alternar() {
    this.mostrando = !this.mostrando;
    this._pintarOlho();
    if (this.mostrando) this.input.focus();
  }
  _pintarOlho() {
    const input = this.input;
    const mostrando = this.mostrando;
    if (this.senha) {
      input.type = mostrando ? "text" : "password";
    } else {
      if (mostrando) {
        if (this.valorReal != null) {
          input.value = this.valorReal;
          this.valorReal = null;
        }
        input.readOnly = this.readOnlyOriginal ?? false;
      } else {
        this.readOnlyOriginal = input.readOnly;
        this.valorReal = input.value;
        input.value = obscurecer(input.value, this.opts.revealVisible, this._modoOculto());
        input.readOnly = true;
      }
    }
    this.olho.replaceChildren(icon(mostrando ? ICONS_EXTRA.eyeOff : ICONS_EXTRA.eye, 16));
    this.olho.setAttribute("aria-label", mostrando ? "Ocultar" : "Mostrar");
    this.olho.setAttribute("aria-pressed", String(mostrando));
    this.envolucro.classList.toggle("is-hidden", !mostrando);
  }
  /* ---------------------------------------------------------------- *
   * Interno                                                           *
   * ---------------------------------------------------------------- */
  _gabarito(caracteres) {
    if (this.moeda) return "";
    const chars = caracteres ?? limpar(this.input.value, [].concat(this.gabaritos).join(""));
    return escolherGabarito(chars, this.gabaritos);
  }
  _ligar() {
    const input = this.input;
    if (!input.getAttribute("inputmode")) {
      input.setAttribute("inputmode", this.moeda || !/[A*]/.test([].concat(this.gabaritos).join("")) ? "numeric" : "text");
    }
    input.setAttribute("autocomplete", input.getAttribute("autocomplete") || "off");
    this._cleanups.push(
      on(input, "input", (e) => this._aoDigitar(e)),
      on(input, "blur", () => {
        if (this.opts.validate) this._validar();
      }),
      on(input, "focus", () => this._marcar(true))
    );
  }
  _aoDigitar(e) {
    const input = this.input;
    const cursor = input.selectionStart ?? input.value.length;
    const tipo = typeof e.inputType === "string" ? e.inputType : "";
    this._formatar({
      cursor,
      apagando: tipo.startsWith("delete"),
      paraFrente: tipo === "deleteContentForward"
    });
    this._emit();
    if (this.opts.validate) this._marcar(true);
  }
  _formatar({ cursor = null, apagando = false, paraFrente = false, manterCursor = true } = {}) {
    const input = this.input;
    const bruto = input.value;
    if (this.moeda) {
      const digitos = bruto.replace(/\D/g, "");
      const texto2 = aplicarMoeda(digitos, {
        decimais: this.opts.decimals,
        locale: this.opts.locale,
        moeda: this.opts.currency
      });
      input.value = texto2;
      if (manterCursor) input.setSelectionRange(texto2.length, texto2.length);
      return;
    }
    const todos = [].concat(this.gabaritos).join("");
    let chars = [...limpar(bruto, todos)];
    if (this.maiusculas) chars = chars.map((c) => c.toUpperCase());
    let antes = cursor === null ? chars.length : [...limpar(bruto.slice(0, cursor), todos)].length;
    if (apagando && chars.length === this._ultimo?.length) {
      const idx = paraFrente ? antes : antes - 1;
      if (idx >= 0 && idx < chars.length) {
        chars.splice(idx, 1);
        if (!paraFrente) antes -= 1;
      }
    }
    const gabarito = escolherGabarito(chars, this.gabaritos);
    chars = chars.slice(0, capacidade(gabarito));
    const texto = aplicar(chars.join(""), gabarito);
    this._ultimo = chars.join("");
    input.value = texto;
    if (manterCursor) {
      const pos = cursorApos(texto, Math.min(antes, chars.length));
      input.setSelectionRange(pos, pos);
    }
  }
  _validar() {
    const ok = this.isValid();
    this._marcar(ok);
    return ok;
  }
  /**
   * Marca o campo. setCustomValidity faz o formulario do navegador barrar o
   * submit sozinho, sem o projeto escrever nada.
   */
  _marcar(ok) {
    const msg = ok ? "" : this.opts.errorText || this.preset?.erro || "Valor inv\xE1lido";
    this.input.setCustomValidity?.(msg);
    this.input.classList.toggle("tuc-invalid", !ok);
    this.input.setAttribute("aria-invalid", ok ? "false" : "true");
  }
  _emit() {
    const detail = { value: this.input.value, raw: this.getRaw(), number: this.getNumber(), instance: this };
    this.opts.onChange?.(detail.value, detail);
    this.input.dispatchEvent(new CustomEvent("tucano:change", { detail, bubbles: true }));
  }
};
function omitUndefined5(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) if (v !== void 0) out[k] = v;
  return out;
}
function autoInit5(scope = document) {
  const out = [];
  const alvos = scope.querySelectorAll("[data-tuc-mask]:not([data-tuc-ready]), [data-tuc-reveal]:not([data-tuc-ready])");
  for (const node of alvos) {
    const d = node.dataset;
    node.setAttribute("data-tuc-ready", "");
    out.push(new Mask(node, {
      format: d.tucMask || null,
      validate: d.validate === "true" || d.validate === "",
      decimals: d.decimals ? +d.decimals : void 0,
      currency: d.currency || void 0,
      errorText: d.errorText || void 0,
      reveal: d.tucReveal !== void 0,
      revealVisible: d.revealVisible ? +d.revealVisible : void 0,
      revealMode: d.tucReveal || d.revealMode || void 0
    }));
  }
  return out;
}
function autoFormat(scope = document) {
  const out = [];
  for (const node of scope.querySelectorAll("[data-tuc-format]:not([data-tuc-formatted])")) {
    const d = node.dataset;
    node.setAttribute("data-tuc-formatted", "");
    const bruto = (node.dataset.value ?? node.textContent).trim();
    node.textContent = formatar(bruto, d.tucFormat, {
      decimais: d.decimals ? +d.decimals : void 0,
      moeda: d.currency || void 0
    });
    out.push(node);
  }
  return out;
}

// src/js/components/toast.js
var DEFAULTS6 = {
  type: "info",
  // 'info' | 'sucesso' | 'aviso' | 'erro' | 'carregando'
  title: null,
  text: "",
  duration: void 0,
  // ms. null nao fecha sozinho. Padrao depende do tipo
  position: "bottom-end",
  // top-start|top-center|top-end|bottom-start|bottom-center|bottom-end
  closable: true,
  action: null,
  // { text, onClick }
  max: 4
  // toasts simultaneos na mesma posicao
};
var ICONE = {
  info: ICONS_EXTRA.info,
  sucesso: ICONS_EXTRA.check,
  aviso: ICONS_EXTRA.alert,
  erro: ICONS_EXTRA.alert,
  carregando: ICONS_EXTRA.spinner
};
var DURACAO = { info: 4e3, sucesso: 3500, aviso: 6e3, erro: 8e3, carregando: null };
var containers = /* @__PURE__ */ new Map();
function container(posicao) {
  if (containers.has(posicao)) return containers.get(posicao);
  const node = el("div", {
    class: `tuc-toasts is-${posicao}`,
    role: "region",
    "aria-label": "Notifica\xE7\xF5es"
  }, [
    el("div", { class: "tuc-toasts__palco" }, [
      el("div", { class: "tuc-toasts__live", "aria-live": "polite", "aria-atomic": "false" }),
      el("div", { class: "tuc-toasts__live is-urgente", "aria-live": "assertive", "aria-atomic": "false" })
    ])
  ]);
  node.style.setProperty("--tuc-toast-respiro", `${RESPIRO}px`);
  document.body.append(node);
  containers.set(posicao, node);
  const expandir = (sim) => {
    node.classList.toggle("is-expandido", sim);
    arranjar(node);
  };
  node.addEventListener("pointerenter", () => expandir(true));
  node.addEventListener("pointerleave", () => expandir(false));
  node.addEventListener("focusin", () => expandir(true));
  node.addEventListener("focusout", () => {
    if (!node.contains(document.activeElement)) expandir(false);
  });
  return node;
}
var RECUO = 14;
var VISIVEIS = 3;
var RESPIRO = 12;
var sequencia = 0;
function arranjar(cont) {
  void cont.offsetHeight;
  if (!cont.offsetWidth) return;
  const debaixo = cont.className.includes("is-bottom");
  const sentido = debaixo ? -1 : 1;
  const aberto2 = cont.classList.contains("is-expandido");
  const palco = cont.querySelector(".tuc-toasts__palco");
  const toasts = [...palco.querySelectorAll(".tuc-toast:not(.is-closing)")].sort((a, b) => +a.dataset.seq - +b.dataset.seq);
  const frente = toasts.length - 1;
  let acumulado = 0;
  for (let i = frente; i >= 0; i--) {
    const k = frente - i;
    const t = toasts[i];
    const y = aberto2 ? acumulado : k * RECUO;
    const escala = aberto2 ? 1 : 1 - k * 0.05;
    t.style.setProperty("--tuc-toast-y", `${sentido * y}px`);
    t.style.setProperty("--tuc-toast-escala", String(escala));
    t.style.zIndex = String(100 - k);
    t.classList.toggle("is-oculto", !aberto2 && k >= VISIVEIS);
    t.setAttribute("aria-hidden", !aberto2 && k >= VISIVEIS ? "true" : "false");
    acumulado += t.offsetHeight + RESPIRO;
  }
  const alturaFrente = toasts[frente]?.offsetHeight ?? 0;
  const total = aberto2 ? acumulado - RESPIRO : alturaFrente + Math.min(toasts.length - 1, VISIVEIS - 1) * RECUO;
  palco.style.height = toasts.length ? `${total}px` : "0px";
}
var Toast = class {
  constructor(opcoes = {}) {
    this.opts = { ...DEFAULTS6, ...omitUndefined6(opcoes) };
    if (this.opts.duration === void 0) {
      this.opts.duration = this.opts.type in DURACAO ? DURACAO[this.opts.type] : 4e3;
    }
    this.id = nextId("toast");
    this._cleanups = [];
    this._montar();
  }
  /** Os filhos do toast. Sai do _montar para que atualizar() reaproveite. */
  _conteudo() {
    const { type, title, text, closable, action } = this.opts;
    return [
      el("span", { class: "tuc-toast__icon" }, [icon(ICONE[type] ?? ICONE.info, 17)]),
      el("div", { class: "tuc-toast__body" }, [
        title ? el("strong", { class: "tuc-toast__title", text: title }) : null,
        el("span", { class: "tuc-toast__text", text })
      ]),
      action ? el("button", {
        type: "button",
        class: "tuc-btn is-outline is-sm tuc-toast__action",
        text: action.text,
        onclick: () => {
          action.onClick?.(this);
          this.close();
        }
      }) : null,
      closable ? el("button", {
        type: "button",
        class: "tuc-btn is-ghost is-icon is-sm tuc-toast__close",
        "aria-label": "Fechar",
        onclick: () => this.close()
      }, [icon(ICONS.x, 14)]) : null
    ];
  }
  /**
   * Troca o conteudo sem recriar o toast: e o que faz um "salvando" virar
   * "salvo" no mesmo cartao, sem a pilha reorganizar e sem o olho perder de
   * vista o aviso que ja estava lendo.
   */
  atualizar(opcoes = {}) {
    if (!this.node) return this;
    const anterior = this.opts.type;
    this.opts = { ...this.opts, ...omitUndefined6(opcoes) };
    const { type } = this.opts;
    if (opcoes.duration === void 0 && type !== anterior) {
      this.opts.duration = type in DURACAO ? DURACAO[type] : 4e3;
    }
    this.node.classList.replace(`is-${anterior}`, `is-${type}`);
    this.node.replaceChildren(...this._conteudo().filter(Boolean));
    const urgente = type === "erro";
    this.node.setAttribute("role", urgente ? "alert" : "status");
    const destino = this.container.querySelector(
      urgente ? ".is-urgente" : ".tuc-toasts__live:not(.is-urgente)"
    );
    if (destino !== this.regiao) {
      destino.append(this.node);
      this.regiao = destino;
    }
    clearTimeout(this.timer);
    if (this.opts.duration) this._iniciarRelogio();
    arranjar(this.container);
    return this;
  }
  _montar() {
    const urgente = this.opts.type === "erro";
    this.node = el("div", {
      class: `tuc-toast is-${this.opts.type}`,
      // role no proprio toast ajuda quem chega nele navegando.
      role: urgente ? "alert" : "status",
      id: this.id
    }, this._conteudo());
    this.node._tucano = this;
    this.node.dataset.seq = String(++sequencia);
    const alvo = container(this.opts.position);
    this.container = alvo;
    const regiao = alvo.querySelector(urgente ? ".is-urgente" : ".tuc-toasts__live:not(.is-urgente)");
    regiao.append(this.node);
    this.regiao = regiao;
    this._limitar(alvo);
    arranjar(alvo);
    if (this.opts.duration) {
      this._iniciarRelogio();
      this._cleanups.push(
        on(this.node, "mouseenter", () => this._pausar()),
        on(this.node, "mouseleave", () => this._retomar()),
        on(this.node, "focusin", () => this._pausar()),
        on(this.node, "focusout", () => this._retomar())
      );
    }
    abrirComTransicao(this.node);
  }
  /**
   * Fecha os mais antigos que passarem do limite.
   *
   * A instancia fica no proprio no: sem isso nao ha como chamar close() a
   * partir do elemento, e o limite nao acontece.
   */
  _limitar(cont) {
    const abertos = [...cont.querySelectorAll(".tuc-toast:not(.is-closing)")].sort((a, b) => +a.dataset.seq - +b.dataset.seq);
    const excedente = abertos.length - this.opts.max;
    for (let i = 0; i < excedente; i++) abertos[i]._tucano?.close();
  }
  _iniciarRelogio() {
    this.restante = this.opts.duration;
    this.inicio = Date.now();
    this.timer = setTimeout(() => this.close(), this.restante);
  }
  _pausar() {
    if (!this.timer) return;
    clearTimeout(this.timer);
    this.timer = null;
    this.restante -= Date.now() - this.inicio;
  }
  _retomar() {
    if (this.timer || !this.opts.duration) return;
    this.inicio = Date.now();
    this.timer = setTimeout(() => this.close(), Math.max(this.restante, 0));
  }
  close() {
    if (this._fechando) return;
    this._fechando = true;
    clearTimeout(this.timer);
    this._cleanups.forEach((fn) => fn());
    this.node.classList.remove("is-open");
    this.node.classList.add("is-closing");
    arranjar(this.container);
    const remover = () => {
      if (this._removido) return;
      this._removido = true;
      this.node.remove();
      arranjar(this.container);
      this.node.dispatchEvent(new CustomEvent("tucano:toast-fechado"));
    };
    this.node.addEventListener("transitionend", (e) => {
      if (e.propertyName === "opacity") remover();
    });
    setTimeout(remover, 500);
  }
};
function toast(opcoesOuTexto, extra = {}) {
  const base = typeof opcoesOuTexto === "string" ? { text: opcoesOuTexto } : opcoesOuTexto;
  return new Toast({ ...base, ...extra });
}
for (const tipo of ["info", "sucesso", "aviso", "erro", "carregando"]) {
  toast[tipo] = (texto, extra = {}) => toast({ type: tipo, text: texto, ...extra });
}
toast.promessa = (promessa, msgs = {}) => {
  const { carregando, sucesso, erro, ...resto } = msgs;
  const t = toast.carregando(carregando ?? "Carregando...", resto);
  const render = (v, dado, padrao) => {
    const r = typeof v === "function" ? v(dado) : v;
    return r ?? padrao;
  };
  Promise.resolve(promessa).then(
    (dado) => t.atualizar({ type: "sucesso", text: render(sucesso, dado, "Pronto") }),
    (falha) => t.atualizar({ type: "erro", text: render(erro, falha, "Algo deu errado") })
  );
  return promessa;
};
function omitUndefined6(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) if (v !== void 0) out[k] = v;
  return out;
}
var MAPA_DJANGO = { debug: "info", info: "info", success: "sucesso", warning: "aviso", error: "erro" };
function autoInit6(scope = document) {
  const out = [];
  for (const node of scope.querySelectorAll("[data-tuc-toast]:not([data-tuc-ready])")) {
    node.setAttribute("data-tuc-ready", "");
    const d = node.dataset;
    const bruto = (d.type || "info").trim().split(/\s+/)[0];
    out.push(toast({
      type: MAPA_DJANGO[bruto] ?? bruto,
      title: d.title || void 0,
      text: (d.text ?? node.textContent).trim(),
      duration: d.duration === "false" ? null : d.duration ? +d.duration : void 0,
      position: d.position || void 0
    }));
    node.remove();
  }
  return out;
}
function ouvirEventos() {
  if (typeof document === "undefined" || document.__tucToastOuvindo) return;
  document.__tucToastOuvindo = true;
  document.body?.addEventListener("tucano:toast", (e) => {
    const d = e.detail;
    if (!d) return;
    toast(typeof d === "string" ? { text: d } : d);
  });
}

// src/js/components/tooltip.js
var DEFAULTS7 = {
  text: "",
  placement: "top-center",
  delay: 350,
  // atraso ao apontar: evita piscar ao passar o mouse de raspao
  delayOut: 120,
  maxWidth: "16rem",
  classe: ""
  // classe extra no balao, para variar a cor num caso so
};
var aberto = null;
var Tooltip = class {
  constructor(target, options = {}) {
    const node = typeof target === "string" ? document.querySelector(target) : target;
    if (!node) throw new Error("[Tooltip] elemento alvo nao encontrado");
    this.opts = { ...DEFAULTS7, ...omitUndefined7(options) };
    this.anchor = node;
    this.id = nextId("tip");
    this._cleanups = [];
    if (!this.opts.text && node.title) {
      this.opts.text = node.title;
      node.removeAttribute("title");
    }
    if (!this.opts.text) throw new Error("[Tooltip] informe o texto");
    this.painel = el("div", {
      class: `tuc-tip${this.opts.classe ? ` ${this.opts.classe}` : ""}`,
      role: "tooltip",
      id: this.id,
      style: `max-width:${this.opts.maxWidth}`
    }, [
      el("span", { class: "tuc-tip__texto", text: this.opts.text }),
      // aria-hidden: a seta e desenho, e o leitor de tela ja recebe o texto.
      el("span", { class: "tuc-tip__seta", "data-tuc-seta": "", "aria-hidden": "true" })
    ]);
    node.setAttribute("aria-describedby", this.id);
    if (!node.hasAttribute("tabindex") && !FOCAVEL.test(node.tagName)) node.tabIndex = 0;
    const toque = () => window.matchMedia?.("(pointer: coarse)").matches;
    this._cleanups.push(
      on(node, "pointerenter", (e) => {
        if (e.pointerType !== "touch") this._agendar(true);
      }),
      on(node, "pointerleave", (e) => {
        if (e.pointerType !== "touch") this._agendar(false);
      }),
      on(node, "focusin", () => this._mostrar()),
      on(node, "focusout", () => this._esconder()),
      on(node, "click", () => {
        if (toque()) this.aberto ? this._esconder() : this._mostrar();
      }),
      on(document, "keydown", (e) => {
        if (e.key === "Escape" && this.aberto) this._esconder();
      })
    );
    node._tucano = this;
  }
  _agendar(mostrar) {
    clearTimeout(this._timer);
    this._timer = setTimeout(
      () => mostrar ? this._mostrar() : this._esconder(),
      mostrar ? this.opts.delay : this.opts.delayOut
    );
  }
  _mostrar() {
    if (this.aberto) return;
    if (aberto && aberto !== this) aberto._esconder();
    this.aberto = true;
    aberto = this;
    this.popover = new Popover(this.anchor, this.painel, {
      placement: this.opts.placement,
      offset: 6,
      fecharSeSolto: true,
      onDismiss: () => this._esconder()
    });
    this.popover.show();
    abrirComTransicao(this.painel);
  }
  _esconder() {
    clearTimeout(this._timer);
    if (!this.aberto) return;
    this.aberto = false;
    if (aberto === this) aberto = null;
    this.painel.classList.remove("is-open");
    this.popover?.destroy();
    this.popover = null;
  }
  setText(texto) {
    this.opts.text = texto;
    this.painel.textContent = texto;
  }
  destroy() {
    this._esconder();
    this._cleanups.forEach((fn) => fn());
    this._cleanups = [];
    this.anchor.removeAttribute("aria-describedby");
    delete this.anchor._tucano;
  }
};
var FOCAVEL = /^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/;
function omitUndefined7(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) if (v !== void 0) out[k] = v;
  return out;
}
function autoInit7(scope = document) {
  const out = [];
  for (const node of scope.querySelectorAll("[data-tuc-tip]:not([data-tuc-ready])")) {
    node.setAttribute("data-tuc-ready", "");
    out.push(new Tooltip(node, {
      text: node.dataset.tucTip || void 0,
      placement: node.dataset.placement || void 0,
      delay: node.dataset.delay ? +node.dataset.delay : void 0,
      classe: node.dataset.tipClass || void 0
    }));
  }
  return out;
}

// src/js/core/dialogo.js
var DURACAO_SAIDA2 = 160;
var Dialogo = class {
  /**
   * Adota um <dialog> ja escrito no template. O no e de quem escreveu o HTML:
   * abrir nao o insere e fechar nao o remove.
   */
  _adotar(node) {
    this._adotado = true;
    this.node = node;
    node._tucano = this;
    return this;
  }
  abrir() {
    if (this.aberto) return this;
    this.aberto = true;
    if (!this._adotado) document.body.append(this.node);
    this.node.showModal();
    this._ligar();
    void this.node.offsetHeight;
    this.node.classList.add("is-open");
    return this;
  }
  fechar(motivo = "api") {
    if (!this.aberto) return this;
    this.aberto = false;
    this._cleanups.forEach((fn) => fn());
    this._cleanups = [];
    this.node.classList.remove("is-open");
    this.node.classList.add("is-closing");
    clearTimeout(this._saida);
    this._saida = setTimeout(() => {
      this.node.classList.remove("is-closing");
      if (this.node.open) this.node.close();
      if (!this._adotado) this.node.remove();
      this.opts.aoFechar?.(motivo, this);
    }, DURACAO_SAIDA2);
    return this;
  }
  /** Conteudo livre no corpo: um form do Django, uma tabela, o que for. */
  conteudo(no) {
    this.corpo?.replaceChildren(...(Array.isArray(no) ? no : [no]).filter(Boolean));
    return this;
  }
  _ligar() {
    this._cleanups.push(
      // O Escape do <dialog> fecha na hora, sem animacao: interceptamos para
      // fechar pelo nosso caminho, que anima e devolve o motivo.
      on(this.node, "cancel", (e) => {
        e.preventDefault();
        if (this.opts.fechavel) this.fechar("escape");
      }),
      on(this.node, "click", (e) => {
        if (this.opts.fecharNoFundo && e.target === this.node) this.fechar("fundo");
      })
    );
  }
};
function montarCaixa(prefixo, opts, dono, tituloId) {
  const { title, text, acoes, fechavel } = opts;
  return el("div", { class: `${prefixo}__caixa` }, [
    el("div", { class: `${prefixo}__topo` }, [
      el("div", { class: `${prefixo}__cabecalho` }, [
        title ? el("h2", { class: `${prefixo}__titulo`, id: tituloId, text: title }) : null,
        text ? el("p", { class: `${prefixo}__texto`, text }) : null
      ]),
      fechavel ? el("button", {
        type: "button",
        class: `tuc-btn is-ghost is-icon is-sm ${prefixo}__fechar`,
        "aria-label": "Fechar",
        onclick: () => dono.fechar("botao")
      }, [icon(ICONS.x, 15)]) : null
    ]),
    el("div", { class: `${prefixo}__corpo` }),
    acoes?.length ? el("div", { class: `${prefixo}__rodape` }, acoes.map((a) => el("button", {
      type: "button",
      class: `tuc-btn is-${a.variante || "outline"}`,
      text: a.texto,
      onclick: () => {
        a.onClick?.(dono);
        if (a.fecha !== false) dono.fechar("acao");
      }
    }))) : null
  ]);
}
function semUndefined(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) if (v !== void 0) out[k] = v;
  return out;
}

// src/js/components/modal.js
var DEFAULTS8 = {
  title: null,
  text: "",
  tamanho: "md",
  // sm | md | lg | full
  tom: "padrao",
  // padrao | perigo | sucesso | aviso
  folha: false,
  // no celular sobe do rodape em vez de surgir no centro
  fechavel: true,
  // botao X e Escape
  fecharNoFundo: true,
  acoes: null,
  // [{ texto, variante, onClick, fecha }]
  aoFechar: null,
  classe: ""
};
var Modal = class extends Dialogo {
  constructor(opcoes = {}) {
    super();
    this.opts = { ...DEFAULTS8, ...semUndefined(opcoes) };
    this.id = nextId("modal");
    this._cleanups = [];
    this._montar();
  }
  _montar() {
    const tituloId = `${this.id}-titulo`;
    this.caixa = montarCaixa("tuc-modal", this.opts, this, tituloId);
    this.node = el("dialog", {
      class: [
        "tuc-modal",
        `is-${this.opts.tamanho}`,
        `is-${this.opts.tom}`,
        this.opts.folha ? "is-folha" : "",
        this.opts.classe
      ].filter(Boolean).join(" "),
      id: this.id,
      // O titulo nomeia o dialogo; sem titulo o proprio texto serve.
      ...this.opts.title ? { "aria-labelledby": tituloId } : {}
    }, [this.caixa]);
    this.corpo = this.caixa.querySelector(".tuc-modal__corpo");
    this.node._tucano = this;
  }
};
function modal(opcoesOuTexto, extra = {}) {
  const base = typeof opcoesOuTexto === "string" ? { text: opcoesOuTexto } : opcoesOuTexto;
  return new Modal({ ...base, ...extra }).abrir();
}
function confirmar(opcoes = {}) {
  const { confirmar: rotuloOk = "Confirmar", cancelar = "Cancelar", ...resto } = opcoes;
  const tom = resto.tom ?? "perigo";
  return new Promise((resolve) => {
    let decidido = false;
    const responder = (v) => {
      decidido = true;
      resolve(v);
    };
    new Modal({
      ...resto,
      tom,
      acoes: [
        { texto: cancelar, variante: "outline", onClick: () => responder(false) },
        { texto: rotuloOk, variante: tom === "perigo" ? "danger" : "primary", onClick: () => responder(true) }
      ],
      // Fechar pelo X, pelo Escape ou pelo fundo e uma recusa, nao um limbo:
      // sem isto a promessa ficaria pendente para sempre.
      aoFechar: (motivo, m) => {
        if (!decidido) resolve(false);
        resto.aoFechar?.(motivo, m);
      }
    }).abrir();
  });
}
function autoInit8(scope = document) {
  const out = [];
  for (const node of scope.querySelectorAll("dialog.tuc-modal:not([data-tuc-ready])")) {
    node.setAttribute("data-tuc-ready", "");
    const d = node.dataset;
    const m = Object.create(Modal.prototype);
    m.opts = { ...DEFAULTS8, fechavel: d.fechavel !== "false", fecharNoFundo: d.fundo !== "false" };
    m.id = node.id || nextId("modal");
    m._cleanups = [];
    m.caixa = node.querySelector(".tuc-modal__caixa");
    m.corpo = node.querySelector(".tuc-modal__corpo");
    m._adotar(node);
    for (const b of node.querySelectorAll("[data-tuc-modal-close]")) {
      b.addEventListener("click", () => m.fechar("botao"));
    }
    out.push(m);
  }
  for (const gatilho of scope.querySelectorAll("[data-tuc-modal]:not([data-tuc-ready])")) {
    gatilho.setAttribute("data-tuc-ready", "");
    gatilho.addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelector(gatilho.dataset.tucModal)?._tucano?.abrir();
    });
  }
  return out;
}

// src/js/components/offcanvas.js
var DEFAULTS9 = {
  title: null,
  text: "",
  lado: "direita",
  // esquerda | direita | cima | baixo
  tamanho: "md",
  // sm | md | lg — nas laterais, largura da coluna
  tom: "padrao",
  // padrao | perigo | sucesso | aviso
  fechavel: true,
  fecharNoFundo: true,
  acoes: null,
  aoFechar: null,
  classe: ""
};
var Gaveta = class extends Dialogo {
  constructor(opcoes = {}) {
    super();
    this.opts = { ...DEFAULTS9, ...semUndefined(opcoes) };
    this.id = nextId("gaveta");
    this._cleanups = [];
    this._montar();
  }
  _montar() {
    const tituloId = `${this.id}-titulo`;
    this.caixa = montarCaixa("tuc-gaveta", this.opts, this, tituloId);
    this.node = el("dialog", {
      class: [
        "tuc-gaveta",
        `is-${this.opts.lado}`,
        `is-${this.opts.tamanho}`,
        `is-${this.opts.tom}`,
        this.opts.classe
      ].filter(Boolean).join(" "),
      id: this.id,
      ...this.opts.title ? { "aria-labelledby": tituloId } : {}
    }, [this.caixa]);
    this.corpo = this.caixa.querySelector(".tuc-gaveta__corpo");
    this.node._tucano = this;
  }
};
function gaveta(opcoesOuTexto, extra = {}) {
  const base = typeof opcoesOuTexto === "string" ? { text: opcoesOuTexto } : opcoesOuTexto;
  return new Gaveta({ ...base, ...extra }).abrir();
}
function autoInit9(scope = document) {
  const out = [];
  for (const node of scope.querySelectorAll("dialog.tuc-gaveta:not([data-tuc-ready])")) {
    node.setAttribute("data-tuc-ready", "");
    const d = node.dataset;
    const g = Object.create(Gaveta.prototype);
    g.opts = { ...DEFAULTS9, fechavel: d.fechavel !== "false", fecharNoFundo: d.fundo !== "false" };
    g.id = node.id || nextId("gaveta");
    g._cleanups = [];
    g.caixa = node.querySelector(".tuc-gaveta__caixa");
    g.corpo = node.querySelector(".tuc-gaveta__corpo");
    g._adotar(node);
    for (const b of node.querySelectorAll("[data-tuc-gaveta-close]")) {
      b.addEventListener("click", () => g.fechar("botao"));
    }
    out.push(g);
  }
  for (const gatilho of scope.querySelectorAll("[data-tuc-gaveta]:not([data-tuc-ready])")) {
    gatilho.setAttribute("data-tuc-ready", "");
    gatilho.addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelector(gatilho.dataset.tucGaveta)?._tucano?.abrir();
    });
  }
  return out;
}

// src/js/components/acordeon.js
var DEFAULTS10 = {
  unico: false
  // abrir um recolhe os outros
};
var DURACAO2 = 220;
var Acordeon = class {
  constructor(alvo, opcoes = {}) {
    this.node = typeof alvo === "string" ? document.querySelector(alvo) : alvo;
    if (!this.node) throw new Error("[Acordeon] elemento n\xE3o encontrado");
    this.opts = { ...DEFAULTS10, ...opcoes };
    this._cleanups = [];
    this._montar();
  }
  get itens() {
    return [...this.node.querySelectorAll(":scope > details")];
  }
  _montar() {
    this.node.classList.add("tuc-acordeon");
    for (const item of this.itens) {
      item.classList.add("tuc-acordeon__item");
      const gatilho = item.querySelector(":scope > summary");
      if (!gatilho) continue;
      gatilho.classList.add("tuc-acordeon__gatilho");
      if (!gatilho.querySelector(".tuc-acordeon__seta")) {
        gatilho.append(el(
          "span",
          { class: "tuc-acordeon__seta", "aria-hidden": "true" },
          [icon(ICONS_EXTRA.chevronDown, 16)]
        ));
      }
      if (!item.querySelector(":scope > .tuc-acordeon__corpo")) {
        const resto = [...item.childNodes].filter((n) => n !== gatilho);
        const conteudo = el("div", { class: "tuc-acordeon__conteudo" });
        conteudo.append(...resto);
        item.append(el("div", { class: "tuc-acordeon__corpo" }, [conteudo]));
      }
      this._cleanups.push(on(gatilho, "click", (e) => this._alternar(e, item)));
    }
  }
  _alternar(e, item) {
    e.preventDefault();
    if (item.open) this.fechar(item);
    else this.abrir(item);
  }
  abrir(item) {
    if (item.open) return this;
    if (this.opts.unico) {
      for (const outro of this.itens) if (outro !== item && outro.open) this.fechar(outro);
    }
    clearTimeout(item._tucSaida);
    item.classList.remove("is-fechando");
    item.open = true;
    return this;
  }
  fechar(item) {
    if (!item.open || item.classList.contains("is-fechando")) return this;
    item.classList.add("is-fechando");
    clearTimeout(item._tucSaida);
    item._tucSaida = setTimeout(() => {
      item.open = false;
      item.classList.remove("is-fechando");
    }, DURACAO2);
    return this;
  }
  destroy() {
    this._cleanups.forEach((fn) => fn());
    this._cleanups = [];
  }
};
function autoInit10(scope = document) {
  const out = [];
  for (const node of scope.querySelectorAll("[data-tuc-acordeon]:not([data-tuc-ready])")) {
    node.setAttribute("data-tuc-ready", "");
    out.push(new Acordeon(node, { unico: node.dataset.unico === "true" }));
  }
  return out;
}

// src/js/index.js
function init(scope = document) {
  return {
    datepickers: autoInit(scope),
    selects: autoInit2(scope),
    colorpickers: autoInit3(scope),
    uploads: autoInit4(scope),
    masks: autoInit5(scope),
    formatted: autoFormat(scope),
    toasts: autoInit6(scope),
    tooltips: autoInit7(scope),
    modals: autoInit8(scope),
    gavetas: autoInit9(scope),
    acordeoes: autoInit10(scope)
  };
}
if (typeof document !== "undefined") {
  const boot = () => {
    ouvirEventos();
    init(document);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  document.addEventListener("htmx:afterSwap", (e) => init(e.target));
}
export {
  Acordeon,
  ColorPicker,
  DatePicker,
  FORMATOS,
  Gaveta,
  Mask,
  Modal,
  Popover,
  Select,
  Toast,
  Tooltip,
  Upload,
  autoFormat,
  autoInit10 as autoInitAcordeoes,
  autoInit3 as autoInitColorPickers,
  autoInit as autoInitDatePickers,
  autoInit9 as autoInitGavetas,
  autoInit5 as autoInitMasks,
  autoInit8 as autoInitModals,
  autoInit2 as autoInitSelects,
  autoInit6 as autoInitToasts,
  autoInit7 as autoInitTooltips,
  autoInit4 as autoInitUploads,
  color_exports as color,
  confirmar,
  dates_exports as dates,
  gaveta,
  init,
  mask_exports as mask,
  modal,
  ouvirEventos,
  toast
};
