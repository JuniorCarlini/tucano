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
var FORMAT_TOKENS = /'[^']*'|yyyy|yy|MMMM|MMM|MM|M|dd|d|EEEE|EEE|HH|H|hh|h|mm|m|ss|s|a/g;
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
  return pattern.replace(FORMAT_TOKENS, (t) => t.startsWith("'") ? t.slice(1, -1) : map[t]());
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
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
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
var ICON_CHEVRON_LEFT = "M15 18l-6-6 6-6";
var ICON_CHEVRON_RIGHT = "M9 18l6-6-6-6";
var ICON_CHEVRON_DOWN = "M6 9l6 6 6-6";
var ICON_X = "M18 6L6 18M6 6l12 12";
var ICON_CHECK = "M20 6L9 17l-5-5";
var ICON_COPY = "M20 9h-9a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-9a2 2 0 00-2-2zM5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1";
var ICON_CHEVRONS_UP_DOWN = "M7 15l5 5 5-5M7 9l5-5 5 5";
var ICON_PIPETTE = "M2 22l1-4 10-10 3 3L6 21l-4 1zM15 5l4-4 4 4-4 4-4-4z";
var ICON_UPLOAD = "M12 16V4M7 9l5-5 5 5M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2";
var ICON_FILE = "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6";
var ICON_RETRY = "M21 12a9 9 0 11-9-9c2.5 0 4.9 1 6.7 2.7L21 8M21 3v5h-5";
var ICON_ALERT = "M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z";
var ICON_INFO = "M12 16v-4M12 8h.01M12 22a10 10 0 100-20 10 10 0 000 20z";
var ICON_EYE = "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z M12 15a3 3 0 100-6 3 3 0 000 6z";
var ICON_EYE_OFF = "M10.6 10.6a3 3 0 004.2 4.2 M9.4 5.2A9.7 9.7 0 0112 5c6.4 0 10 7 10 7a17 17 0 01-2.8 3.7 M6.6 6.6A17 17 0 002 12s3.6 7 10 7c1.7 0 3.2-.4 4.5-1 M2 2l20 20";
function omitUndefined(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) if (v !== void 0) out[k] = v;
  return out;
}
var ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;" };
var escapeHtml = (t) => String(t).replace(/[&<>]/g, (c) => ESCAPES[c]);
var uid = 0;
function nextId(prefix = "ui") {
  return `${prefix}-${Date.now().toString(36)}-${(uid++).toString(36)}`;
}
function on(target, type, handler, options) {
  target.addEventListener(type, handler, options);
  return () => target.removeEventListener(type, handler, options);
}
function openWithTransition(node, className = "is-open") {
  void node.offsetHeight;
  node.classList.add(className);
}

// src/js/core/popover.js
var EXIT_MS = 200;
var exitTimers = /* @__PURE__ */ new WeakMap();
var Popover = class {
  constructor(anchor, panel, options = {}) {
    this.anchor = anchor;
    this.panel = panel;
    this.placement = options.placement || "bottom-start";
    this.offset = options.offset ?? 8;
    this.padding = options.padding ?? 8;
    this.appendTo = options.appendTo || this.anchor.closest("dialog[open]") || document.body;
    this.matchWidth = options.matchWidth || false;
    this.closeIfDetached = options.closeIfDetached || false;
    this.closeOnFocusOut = options.closeOnFocusOut || false;
    this.onDismiss = options.onDismiss || (() => {
    });
    this.open = false;
    this._cleanups = [];
    this._reposition = this._reposition.bind(this);
    this._scheduleReposition = () => {
      if (this._frame) return;
      this._frame = requestAnimationFrame(() => {
        this._frame = 0;
        this._reposition();
      });
    };
  }
  show() {
    if (this.open) return;
    this.open = true;
    clearTimeout(exitTimers.get(this.panel));
    this.panel.classList.remove("is-closing");
    this.panel.style.position = "absolute";
    this.panel.style.top = "0";
    this.panel.style.left = "0";
    this.panel.style.margin = "0";
    this.appendTo.append(this.panel);
    this._arrow = this.panel.querySelector("[data-tuc-arrow]");
    this._reposition();
    if (!this.open) return;
    this._cleanups.push(
      on(window, "scroll", this._scheduleReposition, true),
      on(window, "resize", this._scheduleReposition),
      on(document, "pointerdown", (e) => {
        if (!this.panel.contains(e.target) && !this.anchor.contains(e.target)) this.onDismiss("outside");
      }, true),
      /*
       * O Escape e so do painel. stopPropagation segura os ouvintes da pagina,
       * mas nao o <dialog>: o cancel dele e acao padrao da tecla, e sem o
       * preventDefault um select aberto num modal fechava o modal junto.
       */
      on(document, "keydown", (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          this.onDismiss("escape");
        }
      }, true)
    );
    if (this.closeOnFocusOut) {
      this._cleanups.push(on(document, "focusin", (e) => {
        if (this.panel.contains(e.target) || this.anchor.contains(e.target)) return;
        this.onDismiss("focus");
      }, true));
    }
    this._ro = new ResizeObserver(this._reposition);
    this._ro.observe(this.panel);
    this._ro.observe(this.anchor);
    openWithTransition(this.panel);
  }
  /**
   * `animate` mantem o painel no DOM pelo tempo da transicao de saida. Sem
   * isso ele desaparece no mesmo quadro, e so a entrada tem movimento — o
   * fechamento fica seco em comparacao.
   */
  hide({ animate = true } = {}) {
    if (!this.open) return;
    this.open = false;
    this.panel.classList.remove("is-open");
    this._cleanups.forEach((fn) => fn());
    this._cleanups = [];
    if (this._frame) {
      cancelAnimationFrame(this._frame);
      this._frame = 0;
    }
    this._ro?.disconnect();
    this._ro = null;
    clearTimeout(exitTimers.get(this.panel));
    if (!animate) {
      this.panel.classList.remove("is-closing");
      this.panel.remove();
      return;
    }
    this.panel.classList.add("is-closing");
    exitTimers.set(this.panel, setTimeout(() => {
      this.panel.classList.remove("is-closing");
      this.panel.remove();
    }, EXIT_MS));
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
    if (this.closeIfDetached && (a.bottom < 0 || a.top > vh || a.right < 0 || a.left > vw)) {
      this.onDismiss("detached");
      return;
    }
    const [side, align = "start"] = this.placement.split("-");
    const landscape = side === "left" || side === "right";
    let placeSide = side;
    let top;
    let left;
    if (landscape) {
      const gapRight = vw - a.right - this.offset;
      const gapLeft = a.left - this.offset;
      if (side === "right" && p.width > gapRight && gapLeft > gapRight) placeSide = "left";
      if (side === "left" && p.width > gapLeft && gapRight > gapLeft) placeSide = "right";
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
    if (this._arrow) {
      const half = this._arrow.offsetWidth / 2;
      const limit = 12 + half;
      const trapped = (v, total) => total <= limit * 2 ? total / 2 : Math.min(Math.max(v, limit), total - limit);
      if (landscape) {
        this._arrow.style.top = `${trapped(a.top + a.height / 2 - top, p.height)}px`;
        this._arrow.style.left = placeSide === "left" ? `${p.width}px` : "0px";
      } else {
        this._arrow.style.left = `${trapped(a.left + a.width / 2 - left, p.width)}px`;
        this._arrow.style.top = placeSide === "top" ? `${p.height}px` : "0px";
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

// src/js/core/texts.js
var DATEPICKER_TEXTS = {
  dialog: "Selecionar data",
  dialogRange: "Selecionar per\xEDodo",
  previousMonth: "M\xEAs anterior",
  nextMonth: "Pr\xF3ximo m\xEAs",
  // Setas da escolha de mes e de ano.
  previous: "Anterior",
  next: "Pr\xF3ximo",
  time: "Hor\xE1rio",
  start: "In\xEDcio",
  end: "Fim",
  hour: "Hora",
  minute: "Minuto",
  second: "Segundo",
  clear: "Limpar",
  apply: "Aplicar",
  today: "Hoje",
  yesterday: "Ontem",
  last7Days: "\xDAltimos 7 dias",
  last30Days: "\xDAltimos 30 dias",
  thisMonth: "Este m\xEAs",
  lastMonth: "M\xEAs passado",
  thisYear: "Este ano",
  // Letras do placeholder, nesta ordem: ano, mes, dia, hora, minuto, segundo.
  // "amdhms" escreve dd/mm/aaaa; em ingles, "ymdhms" escreve mm/dd/yyyy.
  placeholderLetters: "amdhms"
};
var SELECT_TEXTS = {
  placeholder: "Selecione...",
  searchPlaceholder: "Buscar...",
  emptyText: "Nenhum resultado",
  loadingText: "Buscando...",
  errorText: "Falha ao buscar",
  typeToSearch: (n) => `Digite ${n} caractere${n > 1 ? "s" : ""} para buscar`,
  clear: "Limpar sele\xE7\xE3o",
  remove: (label) => `Remover ${label}`
};
var COLORPICKER_TEXTS = {
  pick: "Escolher cor",
  dialog: "Seletor de cor",
  area: "Satura\xE7\xE3o e brilho",
  hue: "Matiz",
  alpha: "Opacidade",
  value: "Valor da cor",
  eyeDropper: "Capturar cor da tela"
};
var UPLOAD_TEXTS = {
  zone: "Arraste arquivos aqui ou clique para escolher",
  zoneOne: "Arraste um arquivo aqui ou clique para escolher",
  drop: "Solte para enviar",
  cancel: "Cancelar",
  remove: "Remover",
  repeat: "Tentar de novo",
  large: (max) => `Arquivo maior que ${max}`,
  type: "Tipo de arquivo n\xE3o aceito",
  others: (n) => `No m\xE1ximo ${n} arquivo${n > 1 ? "s" : ""}`,
  upTo: (size) => `at\xE9 ${size}`,
  serverError: (status) => `O servidor respondeu ${status}`,
  networkError: "Falha de rede",
  // Resposta 2xx sem o id (responseId): sem ele o formulario nao teria o que postar.
  noId: "O servidor n\xE3o devolveu o id"
};
var MASK_TEXTS = {
  show: "Mostrar",
  hide: "Ocultar",
  invalid: "Valor inv\xE1lido",
  cpf: "CPF inv\xE1lido",
  cnpj: "CNPJ inv\xE1lido",
  cpfCnpj: "Documento inv\xE1lido"
};
var TOAST_TEXTS = {
  region: "Notifica\xE7\xF5es",
  close: "Fechar",
  // Padroes do toast.promise.
  loading: "Carregando...",
  success: "Pronto",
  error: "Algo deu errado"
};
var MODAL_TEXTS = {
  close: "Fechar",
  // Botoes do Tucano.confirm.
  confirm: "Confirmar",
  cancel: "Cancelar"
};
var DRAWER_TEXTS = {
  close: "Fechar"
};
var TABLE_TEXTS = {
  selectAll: "Selecionar todas as linhas desta p\xE1gina",
  selectRow: "Selecionar linha"
};
var PAGINATION_TEXTS = {
  prevText: "Anterior",
  nextText: "Pr\xF3xima",
  label: "Pagina\xE7\xE3o"
};
var EDITOR_TEXTS = {
  toolbar: "Formata\xE7\xE3o",
  tableToolbar: "Tabela",
  // Botoes da barra, com o nome que eles tem na opcao `toolbar`.
  bold: "Negrito",
  italic: "It\xE1lico",
  underline: "Sublinhado",
  title: "T\xEDtulo",
  subheading: "Subt\xEDtulo",
  list: "Lista",
  numbered: "Lista numerada",
  quote: "Cita\xE7\xE3o",
  link: "Link",
  clear: "Limpar formata\xE7\xE3o",
  table: "Inserir tabela",
  left: "Alinhar \xE0 esquerda",
  center: "Centralizar",
  right: "Alinhar \xE0 direita",
  justify: "Justificar",
  code: "C\xF3digo",
  // Barra que aparece com o cursor dentro de uma tabela.
  rowAbove: "Inserir linha acima",
  rowBelow: "Inserir linha abaixo",
  colBefore: "Inserir coluna \xE0 esquerda",
  colAfter: "Inserir coluna \xE0 direita",
  deleteRow: "Excluir linha",
  deleteColumn: "Excluir coluna",
  deleteTable: "Excluir tabela",
  // Caixa do link.
  insertLink: "Inserir link",
  editLink: "Editar link",
  cancel: "Cancelar",
  removeLink: "Remover",
  save: "Salvar",
  insert: "Inserir"
};
var PROSE_TEXTS = {
  copy: "Copiar c\xF3digo",
  copied: "Copiado"
};
var GROUPS = {
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
  prose: PROSE_TEXTS
};
function setTexts(texts = {}) {
  for (const [name, values] of Object.entries(texts)) {
    if (GROUPS[name]) Object.assign(GROUPS[name], values);
  }
}
function getTexts() {
  return Object.fromEntries(Object.entries(GROUPS).map(([name, group]) => [name, { ...group }]));
}

// src/js/components/datepicker.js
var RANGE_SEPARATOR = /\s*[–—]\s*|\s+(?:-{1,2}|at[ée]|a)\s+/i;
var TOUCHED_ATTRS = ["name", "role", "aria-haspopup", "aria-expanded", "aria-controls", "placeholder", "autocomplete", "inputmode", "readonly"];
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
  // default: true sem hora, false com hora. Sem autoApply, a escolha so vale no Aplicar
  clearable: true,
  weekNumbers: false,
  placement: "bottom-center",
  // centralizado no campo; as bordas da tela ainda mandam
  appendTo: void 0,
  isoName: void 0,
  // name do input hidden com o valor ISO
  // Painel proprio em todo lugar, por padrao: um so comportamento para
  // documentar, estilizar e testar. `true` liga o seletor do sistema no
  // celular, `'auto'` liga so onde o ponteiro e de toque.
  native: false,
  onChange: null,
  onOpen: null,
  onClose: null
};
var DatePicker = class _DatePicker {
  constructor(target, options = {}) {
    const node = typeof target === "string" ? document.querySelector(target) : target;
    if (!node) throw new Error("[DatePicker] elemento alvo nao encontrado");
    if (node._tucano instanceof _DatePicker) {
      const ready = node.hasAttribute("data-tuc-ready");
      node._tucano.destroy();
      node.toggleAttribute("data-tuc-ready", ready);
    }
    this.opts = { ...DEFAULTS, ...omitUndefined(options) };
    this.opts.locale = this.opts.locale || document.documentElement.lang || navigator.language || "pt-BR";
    this.L = getLocaleData(this.opts.locale);
    this._dayName = new Intl.DateTimeFormat(this.opts.locale, { dateStyle: "full" });
    this.opts.format = this.opts.format || localeDatePattern(this.opts.locale);
    this.opts.firstDayOfWeek = this.opts.firstDayOfWeek ?? this.L.firstDayOfWeek;
    this.isRange = this.opts.mode === "range";
    this.opts.months = this.opts.months ?? (this.isRange ? 2 : 1);
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
    this._original = Object.fromEntries(TOUCHED_ATTRS.map((name) => [name, node.getAttribute(name)]));
    this._addedClass = !node.classList.contains("tuc-input");
    node.classList.add("tuc-input");
    this._buildPanel();
    this._setupTarget();
    this._readValue(this.opts.value ?? node.value);
    this._saved = [this.start, this.end];
    this._syncTarget();
    this.viewDate = this._anchorMonth();
    this.focusDate = clone(this.viewDate);
    if (node.form) this._cleanups.push(on(node.form, "reset", () => setTimeout(() => this._resetFromField())));
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
    if (this.native) {
      this.overlay?.showPicker?.();
      return;
    }
    if (this.isOpen) return;
    this.isOpen = true;
    this._saved = [this.start, this.end];
    this.viewDate = this._anchorMonth();
    this.focusDate = this._initialFocus();
    this.view = "days";
    this._render();
    this.popover = new Popover(this.input, this.panel, {
      placement: this.opts.placement,
      appendTo: this.opts.appendTo,
      closeOnFocusOut: true,
      onDismiss: (reason) => {
        if (reason === "outside") this._commitTyped();
        this.close({ restoreFocus: reason === "escape" });
      }
    });
    this.popover.show();
    this._revealed = null;
    this._revealTimes();
    this._releaseFocus = trapFocus(this.panel);
    this.input.setAttribute("aria-expanded", "true");
    this.input.setAttribute("aria-controls", this.id);
    this.opts.onOpen?.(this);
  }
  close({ restoreFocus = true } = {}) {
    if (!this.isOpen) return;
    [this.start, this.end] = this._saved;
    this.pendingRange = false;
    this.hover = null;
    this._syncTarget();
    this.isOpen = false;
    this.popover?.destroy();
    this.popover = null;
    this._releaseFocus?.();
    this._releaseFocus = null;
    this.input.setAttribute("aria-expanded", "false");
    this.input.removeAttribute("aria-controls");
    if (restoreFocus && !this._isCompact) {
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
    this.wrap?.replaceWith(this.input);
    const input = this.input;
    for (const [name, value] of Object.entries(this._original)) {
      if (value === null) input.removeAttribute(name);
      else input.setAttribute(name, value);
    }
    if (this._addedClass) input.classList.remove("tuc-input");
    input.removeAttribute("data-tuc-ready");
    delete input._tucano;
  }
  /* ---------------------------------------------------------------- *
   * Setup                                                             *
   * ---------------------------------------------------------------- */
  _buildPanel() {
    this.panel = el("div", {
      class: "tuc-dp",
      role: "dialog",
      "aria-label": this.isRange ? DATEPICKER_TEXTS.dialogRange : DATEPICKER_TEXTS.dialog,
      id: this.id
    });
    this._live = el("div", { class: "tuc-dp__live", "aria-live": "polite" });
    this.panel.append(this._live);
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
    return matchMedia("(pointer: coarse)").matches;
  }
  _setupTarget() {
    const input = this.input;
    input.setAttribute("autocomplete", "off");
    if (!input.placeholder) input.placeholder = this._placeholder();
    if (this.native) return this._setupNative();
    const compact = matchMedia("(max-width: 40rem) and (pointer: coarse)");
    this._applyCompact(compact.matches);
    this._cleanups.push(on(compact, "change", (e) => this._applyCompact(e.matches)));
    this._cleanups.push(
      on(input, "pointerdown", (e) => {
        if (!this._isCompact) return;
        e.preventDefault();
        this.isOpen ? this.close({ restoreFocus: false }) : this.open();
      }),
      on(input, "input", (e) => {
        if (this._mask) this._onMaskInput(e);
      })
    );
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-haspopup", "dialog");
    input.setAttribute("aria-expanded", "false");
    this._addIsoInput(input);
    this._cleanups.push(
      on(input, "click", () => {
        if (!this._suppressOpen && !this._isCompact) this.open();
      }),
      on(input, "keydown", (e) => {
        if (e.key === "ArrowDown" && !this.isOpen) {
          e.preventDefault();
          this.open();
          this._focusGrid();
        } else if (e.key === " " && !this.isOpen && !input.value) {
          e.preventDefault();
          this.open();
          this._focusGrid();
        } else if (e.key === "Enter" && this.isOpen) {
          e.preventDefault();
          this._commitTyped();
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
  /** Liga ou desliga o layout compacto: campo so de toque, sem mascara. */
  _applyCompact(compact) {
    this._isCompact = compact;
    const input = this.input;
    input.readOnly = compact || this._original.readonly !== null;
    this._mask = compact ? null : this._maskTemplate();
    this._maskDigits = input.value.replace(/\D/g, "");
    if (this._mask) input.setAttribute("inputmode", "numeric");
    else if (this._original.inputmode === null) input.removeAttribute("inputmode");
  }
  /**
   * Input hidden com ISO, depois de `after`: o visivel mostra o formato do
   * locale, o Django recebe ISO. Leva o `isoName` ou toma o `name` do campo.
   */
  _addIsoInput(after) {
    const name = this.opts.isoName || this.input.name;
    if (!name) return;
    if (!this.opts.isoName) this.input.removeAttribute("name");
    this.isoInput = el("input", { type: "hidden", name });
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
    input.readOnly = true;
    const { min, max, time } = this.opts;
    this.overlay = el("input", {
      type: time ? "datetime-local" : "date",
      class: "tuc-native",
      tabindex: -1,
      "aria-hidden": "true"
    });
    if (min) this.overlay.min = this._nativeValue(min);
    if (max) this.overlay.max = this._nativeValue(time ? new Date(max.getFullYear(), max.getMonth(), max.getDate(), 23, 59, 59) : max);
    if (time) this.overlay.step = this.opts.seconds ? 1 : this.opts.minuteStep * 60;
    this.wrap = el("span", { class: "tuc-native-wrap" });
    input.replaceWith(this.wrap);
    this.wrap.append(input, this.overlay);
    this._addIsoInput(this.wrap);
    this._cleanups.push(on(this.overlay, "change", () => {
      if (this._emitting) return;
      this.setValue(parseISO(this.overlay.value));
    }));
  }
  _nativeValue(date = this.start) {
    if (!isValid(date)) return "";
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
    if (!this.isRange) {
      this.start = this._normalize(this._toDate(raw));
      return;
    }
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
    return typeof this.opts.disabledDates === "function" ? !!this.opts.disabledDates(date) : false;
  }
  /**
   * Mes que abre por padrao: o do valor, senao o de hoje. Com min/max apenas
   * limitamos — abrir no `min` levaria o usuario para anos atras sem motivo.
   */
  _anchorMonth() {
    return startOfMonth(this.start || clampDate(/* @__PURE__ */ new Date(), this.opts.min, this.opts.max));
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
    for (const d of [this.start, startOfDay(/* @__PURE__ */ new Date())]) {
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
    const deleting = e.inputType?.startsWith("delete");
    let digits = raw.replace(/\D/g, "");
    let before = raw.slice(0, caret).replace(/\D/g, "").length;
    if (deleting && digits === this._maskDigits) {
      const forward = e.inputType === "deleteContentForward";
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
    const sample = this._displayFormat().replace(
      /[yMdHhms]/g,
      (c) => DATEPICKER_TEXTS.placeholderLetters["yMdhms".indexOf(c === "H" ? "h" : c)]
    );
    return this.isRange ? `${sample} \u2014 ${sample}` : sample;
  }
  /* ---------------------------------------------------------------- *
   * Valor <-> input                                                   *
   * ---------------------------------------------------------------- */
  /** Hora no formato do idioma: 12 horas com AM/PM onde o campo mostra assim. */
  _timeFormat() {
    const h12 = this.L.hour12;
    return `${h12 ? "hh" : "HH"}:mm${this.opts.seconds ? ":ss" : ""}${h12 ? " a" : ""}`;
  }
  _displayFormat() {
    return this.opts.time ? `${this.opts.format} ${this._timeFormat()}` : this.opts.format;
  }
  _displayValue() {
    const f = this._displayFormat();
    if (!this.start) return "";
    const a = format(this.start, f, this.opts.locale);
    if (!this.isRange) return a;
    return this.end ? `${a} \u2014 ${format(this.end, f, this.opts.locale)}` : a;
  }
  _isoValue() {
    if (!this.start) return "";
    return this.isRange ? `${this._nativeValue()}${this.end ? `,${this._nativeValue(this.end)}` : ""}` : this._nativeValue();
  }
  _syncTarget() {
    this.input.value = this._displayValue();
    this._shown = this.input.value;
    if (this.overlay) this.overlay.value = this._nativeValue();
    if (this.isoInput) this.isoInput.value = this._isoValue();
    if (this._mask) this._maskDigits = this.input.value.replace(/\D/g, "");
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
    if (this.isOpen) this._render();
    if (!silent) this._emit();
  }
  _commitTyped() {
    const raw = this.input.value.trim();
    if (raw === this._shown) return;
    if (!raw) {
      this.clear();
      return;
    }
    const typed = this._parseTyped(raw);
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
      this.input.dispatchEvent(new CustomEvent("tucano:change", { detail, bubbles: true }));
      this.input.dispatchEvent(new Event("change", { bubbles: true }));
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
    const keepTime = (target, source) => this.opts.time && source ? withTime(target, source) : target;
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
    if (this.pendingRange || !this.opts.autoApply) {
      this._render();
      return;
    }
    this._commit();
    if (closes) this.close();
  }
  _applyPreset(preset) {
    const { min, max, time } = this.opts;
    const range = preset.value();
    this.start = this._normalize(clampDate(range.start, min, max));
    let end = clampDate(range.end, min, max);
    if (time && isValid(end)) end = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, this.opts.seconds ? 59 : 0);
    this.end = this._normalize(end);
    this.pendingRange = false;
    this.viewDate = this._anchorMonth();
    this._picked(true);
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
    this._picked(false);
  }
  /* ---------------------------------------------------------------- *
   * Render                                                            *
   * ---------------------------------------------------------------- */
  _render() {
    const scrollState = /* @__PURE__ */ new Map();
    for (const n of this.panel.querySelectorAll(".tuc-dp__timelist")) {
      scrollState.set(`${n.dataset.which}|${n.dataset.unit}`, n.scrollTop);
    }
    const active = document.activeElement;
    const focusKey = this.panel.contains(active) ? active.classList.contains("tuc-dp__day") ? "day" : active.dataset.key : null;
    this.panel.classList.toggle("is-picking", this.pendingRange && !!this.hover);
    for (const n of [...this.panel.children]) if (n !== this._live) n.remove();
    if (this.opts.presets && this.isRange) this.panel.insertBefore(this._renderPresets(), this._live);
    const main = el("div", { class: "tuc-dp__main" });
    if (this.view === "days") {
      if (!this.focusDate || !this._inView(this.focusDate)) this.focusDate = this._initialFocus();
      const months = el("div", { class: "tuc-dp__months" });
      for (let i = 0; i < this.opts.months; i++) months.append(this._renderMonth(addMonths(this.viewDate, i), i));
      main.append(months);
    } else {
      main.append(this._renderPeriodView());
    }
    if (this.opts.time && this.view === "days") main.append(this._renderTime());
    if (!this.opts.autoApply || this.opts.clearable) main.append(this._renderFooter());
    this.panel.insertBefore(main, this._live);
    const heading = [...main.querySelectorAll(".tuc-dp__label")].map((n) => n.textContent).join(" \u2013 ");
    if (this._live.textContent !== heading) this._live.textContent = heading;
    for (const n of this.panel.querySelectorAll(".tuc-dp__timelist")) {
      const prev = scrollState.get(`${n.dataset.which}|${n.dataset.unit}`);
      if (prev !== void 0) n.scrollTop = prev;
    }
    this._revealTimes();
    if (focusKey) {
      const target = focusKey === "day" ? this.panel.querySelector('.tuc-dp__day[tabindex="0"]') : this.panel.querySelector(`[data-key="${focusKey}"]`);
      const fallback = this.panel.querySelector('.tuc-dp__day[tabindex="0"]') || this.panel.querySelector(".tuc-dp__label");
      (target && !target.disabled ? target : fallback)?.focus({ preventScroll: true });
    }
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
      const selected = list.querySelector(".is-selected");
      const value = selected?.textContent ?? null;
      if (this._revealed.get(key) === value) continue;
      this._revealed.set(key, value);
      if (selected) revealItem(list, selected);
    }
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
        class: "tuc-btn is-ghost is-icon is-sm tuc-dp__nav",
        "aria-label": DATEPICKER_TEXTS.previousMonth,
        dataset: { key: "prev" },
        disabled: this._navBlocked(-1),
        onclick: () => this._shiftView(-1)
      }, [icon(ICON_CHEVRON_LEFT)]) : el("span", { class: "tuc-btn is-icon is-sm tuc-dp__nav is-placeholder", "aria-hidden": "true" }),
      el("button", {
        type: "button",
        class: "tuc-btn is-ghost is-sm tuc-dp__label",
        dataset: { key: `label-${index}` },
        onclick: () => {
          this.view = "months";
          this.viewDate = clone(monthDate);
          this._render();
        }
      }, [`${this.L.monthsLong[month]} ${year}`, icon(ICON_CHEVRON_DOWN, 14)]),
      showNext ? el("button", {
        type: "button",
        class: "tuc-btn is-ghost is-icon is-sm tuc-dp__nav",
        "aria-label": DATEPICKER_TEXTS.nextMonth,
        dataset: { key: "next" },
        disabled: this._navBlocked(1),
        onclick: () => this._shiftView(1)
      }, [icon(ICON_CHEVRON_RIGHT)]) : el("span", { class: "tuc-btn is-icon is-sm tuc-dp__nav is-placeholder", "aria-hidden": "true" })
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
    const monday = (8 - this.opts.firstDayOfWeek) % 7;
    for (let r = 0; r < cells.length; r += 7) {
      const row = el("div", { class: "tuc-dp__row", role: "row" });
      if (this.opts.weekNumbers) {
        row.append(el("span", { class: "tuc-dp__weeknum", role: "rowheader", text: String(isoWeek(cells[r + monday].date)) }));
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
    let rStart = this.start;
    let rEnd = this.end;
    if (this.isRange && this.pendingRange && this.start && this.hover) {
      [rStart, rEnd] = compareDay(this.hover, this.start) < 0 ? [this.hover, this.start] : [this.start, this.hover];
    }
    const isStart = this.isRange ? isSameDay(date, rStart) : isSameDay(date, this.start);
    const isEnd = this.isRange && isSameDay(date, rEnd);
    const inRange = this.isRange && rStart && rEnd && compareDay(date, rStart) > 0 && compareDay(date, rEnd) < 0;
    const distinct = rStart && rEnd && !isSameDay(rStart, rEnd);
    const classes = ["tuc-dp__day"];
    if (outside) classes.push("is-outside");
    if (this._isDisabled(date)) classes.push("is-disabled");
    if (isSameDay(date, /* @__PURE__ */ new Date())) classes.push("is-today");
    if (isStart || isEnd) classes.push("is-selected");
    if (isStart && distinct) classes.push("is-start");
    if (isEnd && distinct) classes.push("is-end");
    if (inRange) classes.push("is-in-range");
    if (this.pendingRange && isEnd) classes.push("is-preview");
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
    this.panel.classList.toggle("is-picking", this.pendingRange && !!this.hover);
    for (const btn of this.panel.querySelectorAll(".tuc-dp__day")) {
      const date = parseISO(btn.dataset.date);
      if (!date) continue;
      const outside = date.getMonth() !== +btn.dataset.month;
      const classes = this._dayClasses(date, outside);
      btn.className = classes.join(" ");
      btn.setAttribute("aria-selected", classes.includes("is-selected") ? "true" : "false");
      btn.tabIndex = this._tabStop(date, outside);
    }
  }
  _renderDay(cell, month) {
    const { date, outside } = cell;
    const classes = this._dayClasses(date, outside);
    return el("button", {
      type: "button",
      class: classes.join(" "),
      tabindex: this._tabStop(date, outside),
      /*
       * aria-disabled, e nao disabled: botao desativado nao recebe foco, e a
       * seta que caia num fim de semana bloqueado mandava o foco para o <body>.
       * O clique continua sem efeito — _selectDay confere o dia.
       */
      "aria-disabled": this._isDisabled(date) ? "true" : null,
      role: "gridcell",
      "aria-selected": classes.includes("is-selected") ? "true" : "false",
      "aria-label": this._dayName.format(date),
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
    const first = year - year % 12;
    const wrap = el("div", { class: "tuc-dp__period" });
    const { min, max } = this.opts;
    const outside = (from, to) => min && compareDay(to, min) < 0 || max && compareDay(from, max) > 0;
    const years = (a, b) => outside(new Date(a, 0, 1), new Date(b, 11, 31));
    const step = isMonths ? 1 : 12;
    const header = el("div", { class: "tuc-dp__header" }, [
      el("button", {
        type: "button",
        class: "tuc-btn is-ghost is-icon is-sm tuc-dp__nav",
        "aria-label": DATEPICKER_TEXTS.previous,
        dataset: { key: "prev" },
        disabled: isMonths ? years(year - 1, year - 1) : years(first - 12, first - 1),
        onclick: () => {
          this.viewDate = addYears(this.viewDate, -step);
          this._render();
        }
      }, [icon(ICON_CHEVRON_LEFT)]),
      el("button", {
        type: "button",
        class: "tuc-btn is-ghost is-sm tuc-dp__label",
        dataset: { key: "label-0" },
        onclick: () => {
          this.view = isMonths ? "years" : "days";
          this._render();
        }
      }, [isMonths ? String(year) : `${first} \u2013 ${first + 11}`]),
      el("button", {
        type: "button",
        class: "tuc-btn is-ghost is-icon is-sm tuc-dp__nav",
        "aria-label": DATEPICKER_TEXTS.next,
        dataset: { key: "next" },
        disabled: isMonths ? years(year + 1, year + 1) : years(first + 12, first + 23),
        onclick: () => {
          this.viewDate = addYears(this.viewDate, step);
          this._render();
        }
      }, [icon(ICON_CHEVRON_RIGHT)])
    ]);
    const grid = el("div", { class: "tuc-dp__periodgrid" });
    const items = isMonths ? this.L.monthsShort.map((label, m) => ({ label, date: new Date(year, m, 1), off: outside(new Date(year, m, 1), new Date(year, m + 1, 0)) })) : Array.from({ length: 12 }, (_, i) => {
      const y = first + i;
      return { label: String(y), date: new Date(y, this.viewDate.getMonth(), 1), off: years(y, y) };
    });
    items.forEach((item, i) => {
      const active = isMonths ? this.start && isSameMonth(item.date, this.start) : this.start && item.date.getFullYear() === this.start.getFullYear();
      const current = isMonths ? isSameMonth(item.date, /* @__PURE__ */ new Date()) : item.date.getFullYear() === (/* @__PURE__ */ new Date()).getFullYear();
      grid.append(el("button", {
        type: "button",
        class: `tuc-dp__periodcell${active ? " is-selected" : ""}${current ? " is-today" : ""}`,
        text: item.label,
        disabled: item.off,
        dataset: { key: `cell-${i}` },
        onclick: () => {
          this.viewDate = startOfDay(item.date);
          this.view = isMonths ? "days" : "months";
          this._render();
        }
      }));
    });
    wrap.append(header, grid);
    return wrap;
  }
  _renderTime() {
    const row = el("div", { class: "tuc-dp__time" });
    const targets = this.isRange ? [["start", DATEPICKER_TEXTS.start], ["end", DATEPICKER_TEXTS.end]] : [["start", DATEPICKER_TEXTS.time]];
    for (const [which, label] of targets) {
      const value = which === "end" ? this.end : this.start;
      const readout = value ? format(value, this._timeFormat(), this.opts.locale) : "--:--";
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
  /*
   * Cada coluna e um grupo de botoes com uma parada de Tab so (tabindex
   * itinerante): as setas andam dentro da coluna e Enter ou Espaco escolhem.
   * Antes cada botao era uma parada — 194 Tabs num painel com segundos — e
   * listbox com botoes focaveis dentro nao e ARIA valido.
   */
  _renderTimeList(which, unit, count, step, current) {
    const list = el("div", {
      class: "tuc-dp__timelist",
      role: "group",
      "aria-label": { h: DATEPICKER_TEXTS.hour, m: DATEPICKER_TEXTS.minute, s: DATEPICKER_TEXTS.second }[unit],
      dataset: { which, unit }
    });
    const selectedValue = current === null ? null : Math.floor(current / step) * step;
    const disabled = !(which === "end" ? this.end : this.start);
    for (let v = 0; v < count; v += step) {
      const selected = selectedValue === v;
      list.append(el("button", {
        type: "button",
        class: `tuc-dp__timeitem${selected ? " is-selected" : ""}`,
        text: String(v).padStart(2, "0"),
        // Em 12 horas o nome lido e o do campo ("1 PM"), nao o 13 da coluna.
        "aria-label": unit === "h" && this.L.hour12 ? format(new Date(2e3, 0, 1, v), "h a") : null,
        "aria-pressed": selected ? "true" : "false",
        tabindex: v === (selectedValue ?? 0) ? 0 : -1,
        disabled,
        dataset: { key: `${which}-${unit}-${v}` },
        onclick: () => this._setTime(which, unit, v)
      }));
    }
    return list;
  }
  _renderPresets() {
    const wrap = el("div", { class: "tuc-dp__presets" });
    buildPresets(this.opts.presets).forEach((preset, i) => {
      const r = preset.value();
      const active = this.start && this.end && isSameDay(this.start, r.start) && isSameDay(this.end, r.end);
      wrap.append(el("button", {
        type: "button",
        class: `tuc-btn is-ghost is-sm tuc-dp__preset${active ? " is-selected" : ""}`,
        title: preset.label,
        dataset: { key: `preset-${i}` },
        onclick: () => this._applyPreset(preset)
      }, [el("span", { text: preset.label })]));
    });
    return wrap;
  }
  _renderFooter() {
    const footer = el("div", { class: "tuc-dp__footer" });
    if (this.opts.clearable) {
      footer.append(el("button", {
        type: "button",
        class: "tuc-btn is-ghost is-sm",
        text: DATEPICKER_TEXTS.clear,
        dataset: { key: "clear" },
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
        text: DATEPICKER_TEXTS.apply,
        dataset: { key: "apply" },
        disabled: !this.start || this.isRange && !this.end,
        onclick: () => {
          this._commit();
          this.close();
        }
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
    if (e.target.classList.contains("tuc-dp__timeitem")) {
      this._onTimeKeydown(e);
      return;
    }
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
    else if (e.key === "Home" || e.key === "End") {
      const weekday = (this.focusDate.getDay() - this.opts.firstDayOfWeek + 7) % 7;
      next = addDays(this.focusDate, e.key === "Home" ? -weekday : 6 - weekday);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this._selectDay(this.focusDate);
      return;
    } else return;
    e.preventDefault();
    this.focusDate = clampDate(next, this.opts.min, this.opts.max);
    const last = addMonths(this.viewDate, this.opts.months - 1);
    if (compareDay(this.focusDate, this.viewDate) < 0) this.viewDate = startOfMonth(this.focusDate);
    else if (compareDay(this.focusDate, endOfMonth(last)) > 0) this.viewDate = addMonths(startOfMonth(this.focusDate), 1 - this.opts.months);
    this._render();
  }
  /** Setas, Home e End dentro de uma coluna de hora: movem o foco, sem escolher. */
  _onTimeKeydown(e) {
    const item = e.target;
    const items = [...item.parentElement.children];
    const index = { ArrowUp: items.indexOf(item) - 1, ArrowDown: items.indexOf(item) + 1, Home: 0, End: items.length - 1 }[e.key];
    if (index === void 0) return;
    e.preventDefault();
    const next = items[Math.max(0, Math.min(items.length - 1, index))];
    item.tabIndex = -1;
    next.tabIndex = 0;
    next.focus({ preventScroll: true });
    revealItem(item.parentElement, next);
  }
};
function buildPresets(option) {
  if (Array.isArray(option)) return option;
  const today = () => startOfDay(/* @__PURE__ */ new Date());
  return [
    { label: DATEPICKER_TEXTS.today, value: () => ({ start: today(), end: today() }) },
    { label: DATEPICKER_TEXTS.yesterday, value: () => ({ start: addDays(today(), -1), end: addDays(today(), -1) }) },
    { label: DATEPICKER_TEXTS.last7Days, value: () => ({ start: addDays(today(), -6), end: today() }) },
    { label: DATEPICKER_TEXTS.last30Days, value: () => ({ start: addDays(today(), -29), end: today() }) },
    { label: DATEPICKER_TEXTS.thisMonth, value: () => {
      const t = today();
      return { start: new Date(t.getFullYear(), t.getMonth(), 1), end: new Date(t.getFullYear(), t.getMonth() + 1, 0) };
    } },
    { label: DATEPICKER_TEXTS.lastMonth, value: () => {
      const t = today();
      return { start: new Date(t.getFullYear(), t.getMonth() - 1, 1), end: new Date(t.getFullYear(), t.getMonth(), 0) };
    } },
    { label: DATEPICKER_TEXTS.thisYear, value: () => {
      const t = today();
      return { start: new Date(t.getFullYear(), 0, 1), end: new Date(t.getFullYear(), 11, 31) };
    } }
  ];
}
function revealItem(list, item) {
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
      native: d.native === "auto" ? "auto" : d.native === "true"
    }));
  }
  return out;
}

// src/js/components/select.js
var TEXT_OPTIONS = ["searchPlaceholder", "emptyText", "loadingText", "errorText"];
var DEFAULTS2 = {
  search: void 0,
  // default: liga a partir de 6 opcoes
  searchMinItems: 6,
  placeholder: void 0,
  // default: do atributo, da <option value=""> ou setTexts ("Selecione...")
  searchPlaceholder: void 0,
  // default: setTexts ("Buscar...")
  emptyText: void 0,
  // default: setTexts ("Nenhum resultado")
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
  // ver _noChance()
  loadingText: void 0,
  // default: setTexts ("Buscando...")
  errorText: void 0,
  // default: setTexts ("Falha ao buscar")
  onChange: null
};
var Select = class {
  constructor(target, options = {}) {
    const node = typeof target === "string" ? document.querySelector(target) : target;
    if (!node) throw new Error("[Select] elemento alvo nao encontrado");
    if (node.tagName !== "SELECT") throw new Error("[Select] o alvo precisa ser um <select>");
    this.opts = { ...DEFAULTS2, ...omitUndefined(options) };
    this.native = node;
    this.multiple = node.multiple;
    this.opts.closeOnSelect = this.opts.closeOnSelect ?? !this.multiple;
    for (const key of TEXT_OPTIONS) this.opts[key] ??= SELECT_TEXTS[key];
    this.opts.placeholder = this.opts.placeholder ?? node.dataset.placeholder ?? (!this.multiple && firstEmptyLabel(node) || SELECT_TEXTS.placeholder);
    this.id = nextId("sel");
    this.isOpen = false;
    this.query = "";
    this.activeIndex = -1;
    this._cleanups = [];
    this.remote = !!(this.opts.url || this.opts.loadOptions);
    this._autoSearch = !this.remote && this.opts.search === void 0;
    if (this.remote) this.opts.search = true;
    this.searchState = null;
    this._cache = /* @__PURE__ */ new Map();
    this._page = 1;
    this._hasMore = false;
    this._build();
    this.refresh();
    node._tucano = this;
  }
  /* ---------------------------------------------------------------- *
   * API publica                                                       *
   * ---------------------------------------------------------------- */
  getValue() {
    const chosen = this._chosen().map((i) => i.value);
    return this.multiple ? chosen : chosen[0] ?? null;
  }
  setValue(value, { silent = false } = {}) {
    const target = new Set([].concat(value ?? []).map(String).slice(0, this.multiple ? void 0 : 1));
    for (const item of this.items) item.selected = target.has(item.value);
    this._pushToNative({ silent });
    this._renderControl();
    if (this.isOpen) this._renderMenu();
    if (!silent) this._emit();
  }
  clear({ silent = false } = {}) {
    this.setValue([], { silent });
  }
  /**
   * Relê as <option> do select nativo — use depois de trocar as opções por HTMX.
   * É também o que roda no `change` de fora e no reset do formulário: no modo
   * remoto a lista guardada só tinha o que estava escolhido, e o reset que
   * voltava a uma opção fora dela deixava a tela vazia e o POST com valor.
   */
  refresh() {
    this._cache.clear();
    this.items = readOptions(this.native);
    if (this._autoSearch) this.opts.search = this.items.length >= this.opts.searchMinItems;
    this._renderControl();
    if (this.isOpen) this._renderMenu();
  }
  open() {
    if (this.isOpen || this.native.disabled) return;
    this.isOpen = true;
    this.query = "";
    this.search.value = "";
    if (this.remote) {
      this.items = this._chosen();
      this.searchState = null;
    }
    this.activeIndex = this.items.findIndex((i) => i.selected && !i.disabled);
    this._renderMenu();
    this.popover = new Popover(this.control, this.menu, {
      placement: this.opts.placement,
      appendTo: this.opts.appendTo,
      matchWidth: true,
      closeOnFocusOut: true,
      onDismiss: () => this.close()
    });
    this.popover.show();
    this.control.classList.add("is-open");
    this.control.setAttribute("aria-expanded", "true");
    this.control.setAttribute("aria-controls", `${this.id}-list`);
    this.search.setAttribute("aria-controls", `${this.id}-list`);
    this.search.focus();
    this._scrollToActive();
    if (this.remote && !this.opts.minChars) this._scheduleSearch();
  }
  close() {
    clearTimeout(this._searchTimer);
    this._abort();
    if (!this.isOpen) return;
    this.isOpen = false;
    this.control.classList.remove("is-open");
    this.control.setAttribute("aria-expanded", "false");
    this.control.removeAttribute("aria-controls");
    this.search.removeAttribute("aria-controls");
    this.search.removeAttribute("aria-activedescendant");
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
    this.native.removeAttribute("data-tuc-ready");
    delete this.native._tucano;
  }
  /* ---------------------------------------------------------------- *
   * Construcao                                                        *
   * ---------------------------------------------------------------- */
  _build() {
    const node = this.native;
    node.classList.add("tuc-select-native");
    node.setAttribute("aria-hidden", "true");
    node.tabIndex = -1;
    const labelledBy = node.getAttribute("aria-labelledby");
    const name = labelledBy ? null : node.getAttribute("aria-label") || [...node.labels].map(labelText).join(" ") || null;
    this.values = el("div", { class: "tuc-select__values" });
    this.search = el("input", {
      class: "tuc-select__search",
      type: "text",
      autocomplete: "off",
      spellcheck: "false",
      "aria-autocomplete": "list",
      "aria-label": name,
      "aria-labelledby": labelledBy
    });
    this.clearBtn = el("button", {
      type: "button",
      class: "tuc-btn is-ghost is-icon tuc-select__clear",
      "aria-label": SELECT_TEXTS.clear,
      tabindex: -1,
      // O foco volta para a busca: o X some sem valor e levava o foco junto para o body.
      onclick: (e) => {
        e.stopPropagation();
        this.clear();
        this.search.focus();
      }
    }, [icon(ICON_X, 14)]);
    this.control = el("div", {
      class: `tuc-select${this.opts.wrapTags ? " is-wrap" : ""}`,
      role: "combobox",
      "aria-haspopup": "listbox",
      "aria-expanded": "false",
      "aria-label": name,
      "aria-labelledby": labelledBy,
      id: this.id
    }, [
      this.values,
      this.opts.clearable ? this.clearBtn : null,
      el("span", { class: "tuc-select__arrow" }, [icon(ICON_CHEVRONS_UP_DOWN, 15)])
    ]);
    this.list = el("div", { class: "tuc-select__list", role: "listbox", id: `${this.id}-list`, "aria-multiselectable": this.multiple ? "true" : null });
    this.menu = el("div", { class: "tuc-select__menu" }, [this.list]);
    node.after(this.control);
    this.values.append(this.search);
    this._cleanups.push(
      on(this.control, "mousedown", (e) => {
        if (e.target.closest(".tuc-select__clear, .tuc-select__tagx")) return;
        e.preventDefault();
        this.isOpen ? this.search.focus() : this.open();
      }),
      /*
       * Dentro de um <label>, o clique no controle ativava o label, que mandava
       * o foco ao nativo escondido: o Popover via o foco sair e fechava a lista
       * que acabara de abrir. E o <label for>, o submit invalido do `required` e
       * qualquer .focus() no nativo deixavam o foco num elemento invisivel.
       */
      on(this.control, "click", (e) => e.preventDefault()),
      on(node, "focus", () => this.search.focus()),
      on(this.search, "input", () => {
        const typed = this.search.value;
        if (!this.isOpen) {
          this.open();
          this.search.value = typed;
        }
        this.query = typed;
        if (this.remote) {
          this._scheduleSearch();
          return;
        }
        this.activeIndex = this._filtered().findIndex((i) => !i.disabled);
        this._renderMenu();
        this._renderControl();
      }),
      on(this.search, "keydown", (e) => this._onKeydown(e)),
      // Se o valor mudar por fora, por JS de terceiros que dispara change.
      on(node, "change", () => {
        if (!this._pushing) this.refresh();
      }),
      /*
       * O reset do formulario volta o <select> aos valores iniciais sem disparar
       * change: o nativo mudava e a tela continuava mostrando o valor antigo. O
       * evento chega antes de os valores voltarem, entao a leitura espera a vez.
       */
      node.form ? on(node.form, "reset", () => setTimeout(() => this.refresh())) : () => {
      },
      /*
       * Um ouvinte no painel, e nao dois por opcao: com 2.000 opcoes eram 4.000
       * funcoes novas a cada tecla. E o clique em qualquer ponto do painel nao
       * tira o foco da busca — no titulo de um grupo o foco ia para o body e a
       * lista ficava aberta sem teclado. A barra de rolagem da lista fica de
       * fora, para continuar arrastavel.
       */
      on(this.menu, "mousedown", (e) => {
        if (e.target !== this.list) e.preventDefault();
        const i = optionIndex(e.target);
        if (i >= 0) this._toggleItem(this._filtered()[i]);
      }),
      /*
       * So o ponteiro que de fato andou muda o destaque. A seta rola a lista por
       * baixo do ponteiro parado, e a opcao que passava por ali roubava o
       * destaque do teclado — pelo mouseenter em todo motor, e o WebKit ainda
       * dispara mousemove sem movimento ao rolar, por isso a coordenada.
       */
      on(this.list, "mousemove", (e) => {
        const at = e.clientX + "," + e.clientY;
        const i = optionIndex(e.target);
        if (at === this._pointer || i < 0) return;
        this._pointer = at;
        this.activeIndex = i;
        this._paintActive();
      }),
      on(this.list, "scroll", () => this._onListScroll())
    );
  }
  /*
   * `silent` segura tambem o `change` do nativo, e nao so os eventos da Tucano.
   * Ele existe para trocar o valor por codigo sem avisar ninguem, e um
   * hx-trigger="change" transformava cada troca silenciosa numa requisicao. E o
   * que o DOM faz: atribuir `select.value` por script nunca dispara `change`.
   * A escolha de quem clica ou digita continua disparando, por _toggleItem.
   */
  _pushToNative({ silent = false } = {}) {
    this._pushing = true;
    if (this.remote) {
      for (const item of this.items) {
        if (!item.selected) continue;
        if ([...this.native.options].some((o) => o.value === item.value)) continue;
        this.native.append(el("option", { value: item.value, text: item.label }));
      }
    }
    const chosen = new Set(this._chosen().map((i) => i.value));
    for (const opt of this.native.options) opt.selected = chosen.has(opt.value);
    if (!this.multiple && !chosen.size) {
      const empty = [...this.native.options].find((o) => o.value === "");
      if (empty) empty.selected = true;
      else this.native.selectedIndex = -1;
    }
    if (!silent) {
      this.native.dispatchEvent(new Event("input", { bubbles: true }));
      this.native.dispatchEvent(new Event("change", { bubbles: true }));
    }
    this._pushing = false;
  }
  /* ---------------------------------------------------------------- *
   * Busca no servidor                                                 *
   * ---------------------------------------------------------------- */
  /**
   * Tres filtros antes de chegar na rede, do mais barato ao mais caro: tamanho
   * minimo, cache e termo sem chance. Debounce so no fim, para o que sobrou.
   *
   * A busca anterior morre ja na tecla, e nao quando a proxima sai: no intervalo
   * do debounce ela voltava e mostrava o resultado de um termo abandonado. E
   * nao ha mais o atalho de "termo ja em voo": abortado por um termo do cache,
   * ele ficava marcado como em voo, e digitar o mesmo termo de novo deixava a
   * lista em "Buscando..." para sempre.
   */
  _scheduleSearch() {
    clearTimeout(this._searchTimer);
    this._abort();
    this.searchState = null;
    const term = this.query.trim();
    this._page = 1;
    if (term.length < this.opts.minChars) {
      this.items = this._chosen();
      this._hasMore = false;
      this._renderMenu();
      return;
    }
    const saved = this.opts.cache && this._cache.get(term);
    if (saved || this._noChance(term)) {
      this._applyResult(saved ? saved.items : [], { more: !!saved && saved.more });
      return;
    }
    this.searchState = "loading";
    this._renderMenu();
    this._searchTimer = setTimeout(() => this._fetch(term), this.opts.debounce);
  }
  /**
   * Se "lucas" nao trouxe nada, "lucass" tambem nao traz — desde que a busca
   * do servidor seja por conter o termo, como um icontains do Django.
   *
   * Fica desligado por padrao: com busca aproximada, por sinonimo ou por
   * relevancia, um termo maior pode sim trazer resultado, e cortar aqui
   * esconderia dados sem aviso.
   *
   * Os termos vazios sao lidos do proprio cache, sem um Set a parte para manter.
   */
  _noChance(term) {
    if (this.opts.shortCircuit) {
      for (const [t, saved] of this._cache) if (!saved.items.length && term.startsWith(t)) return true;
    }
    return false;
  }
  /** Guarda tambem se havia mais paginas: sem isso o termo vindo do cache herdava o `hasMore` do ultimo termo buscado. */
  _store(term, items, more) {
    if (!this.opts.cache) return;
    if (this._cache.size >= this.opts.cacheSize) {
      this._cache.delete(this._cache.keys().next().value);
    }
    this._cache.set(term, { items, more });
  }
  /** Junta o que veio com quem ja estava escolhido e desenha. */
  _applyResult(incoming, { append = false, more }) {
    const base = append ? this.items : this._chosen();
    const fresh = incoming.filter((i) => !base.some((e) => e.value === i.value));
    this._hasMore = more && (!append || fresh.length > 0);
    this.items = [...base, ...fresh];
    const top = this.list.scrollTop;
    if (!append) this.activeIndex = this.items.findIndex((i) => !i.disabled && !i.selected);
    this._renderMenu();
    if (append) this.list.scrollTop = top;
  }
  _abort() {
    this._control?.abort();
    this._control = null;
    this._more = null;
  }
  async _fetch(term, { page = 1 } = {}) {
    this._abort();
    const control = new AbortController();
    this._control = control;
    try {
      const raws = this.opts.loadOptions ? await this.opts.loadOptions(term, { signal: control.signal, page }) : await this._fetchUrl(term, control.signal, page);
      if (control.signal.aborted) return;
      const incoming = normalizeOptions(raws);
      const more = hasNextPage(raws, incoming, this.opts.pageParam);
      this.searchState = null;
      if (page === 1) this._store(term, incoming, more);
      this._applyResult(incoming, { append: page > 1, more });
    } catch (e) {
      if (e.name === "AbortError" || control.signal.aborted) return;
      if (page > 1) {
        this._hasMore = false;
        this._more?.remove();
        return;
      }
      this.searchState = "error";
      this._renderMenu();
    } finally {
      if (this._control === control) {
        this._control = null;
        this._more = null;
      }
    }
  }
  async _fetchUrl(term, signal, page = 1) {
    const url = new URL(this.opts.url, location.href);
    url.searchParams.set(this.opts.queryParam, term);
    if (page > 1 && this.opts.pageParam) url.searchParams.set(this.opts.pageParam, String(page));
    const r = await fetch(url, { signal, headers: { Accept: "application/json" } });
    if (!r.ok) throw new Error(`O servidor respondeu ${r.status}`);
    return r.json();
  }
  /**
   * Proxima pagina ao chegar perto do fim da lista. Carregar de uma vez os
   * dez mil registros e o que trava a pagina; vinte por vez, nao.
   *
   * O "Buscando..." entra no fim da lista, sem redesenhar: redesenhar esvaziava
   * a lista, e a rolagem voltava ao topo a cada pagina.
   */
  _onListScroll() {
    if (!this.remote || !this._hasMore || this.searchState || this._more) return;
    const l = this.list;
    if (l.scrollTop + l.clientHeight < l.scrollHeight - 48) return;
    this._fetch(this.query.trim(), { page: ++this._page });
    this._more = l.appendChild(loadingRow(this.opts.loadingText));
  }
  _chosen() {
    return this.items.filter((i) => i.selected);
  }
  /* ---------------------------------------------------------------- *
   * Render                                                            *
   * ---------------------------------------------------------------- */
  _renderControl() {
    const chosen = this._chosen();
    for (const n of [...this.values.children]) if (n !== this.search) n.remove();
    if (this.multiple) {
      for (const item of chosen) {
        this.values.insertBefore(el("span", { class: "tuc-select__tag" }, [
          el("span", { class: "tuc-select__tagtext", text: item.label }),
          el("button", {
            type: "button",
            class: "tuc-select__tagx",
            tabindex: -1,
            "aria-label": SELECT_TEXTS.remove(item.label),
            onclick: (e) => {
              e.stopPropagation();
              this._toggleItem(item);
            }
          }, [icon(ICON_X, 12)])
        ]), this.search);
      }
    } else if (chosen.length && !this.query) {
      this.values.insertBefore(
        el("span", { class: "tuc-select__single", text: chosen[0].label }),
        this.search
      );
    }
    const empty = !chosen.length && !this.query;
    this.search.placeholder = empty ? this.opts.placeholder : this.isOpen && this.opts.search ? this.opts.searchPlaceholder : "";
    this.control.classList.toggle("has-value", chosen.length > 0);
    this.search.readOnly = !this.opts.search;
    this.search.disabled = this.native.disabled;
    this.control.classList.toggle("is-disabled", this.native.disabled);
  }
  _filtered() {
    if (this.remote) return this.items;
    const q = normalize(this.query);
    return q ? this.items.filter((i) => i.search.includes(q)) : this.items;
  }
  _renderMenu() {
    const visible = this._filtered();
    const list = this.list;
    list.replaceChildren();
    if (this.searchState === "loading") {
      list.append(loadingRow(this.opts.loadingText));
    } else if (this.searchState === "error") {
      list.append(el("div", { class: "tuc-select__empty is-error", text: this.opts.errorText }));
    } else if (!visible.length) {
      list.append(el("div", {
        class: "tuc-select__empty",
        text: this.remote && this.query.trim().length < this.opts.minChars ? SELECT_TEXTS.typeToSearch(this.opts.minChars) : this.opts.emptyText
      }));
    } else {
      let currentGroup = null;
      visible.forEach((item, i) => {
        if (item.group && item.group !== currentGroup) {
          currentGroup = item.group;
          list.append(el("div", { class: "tuc-select__group", text: item.group, role: "presentation" }));
        }
        list.append(el("div", {
          class: `tuc-select__option${item.selected ? " is-selected" : ""}${item.disabled ? " is-disabled" : ""}`,
          role: "option",
          id: `${this.id}-opt-${i}`,
          "aria-selected": item.selected ? "true" : "false",
          "aria-disabled": item.disabled ? "true" : null
        }, [
          el("span", { class: "tuc-select__label", text: item.label }),
          item.selected ? el("span", { class: "tuc-select__check" }, [icon(ICON_CHECK, 15)]) : null
        ]));
      });
    }
    this._paintActive();
  }
  /**
   * Move o destaque sem refazer a lista — mesma razao do calendario. Sem opcao
   * ativa na tela o aria-activedescendant sai: apontava para um id que nao
   * existia mais, com a busca sem resultado ou com a lista fechada.
   */
  _paintActive() {
    for (const n of this.list.querySelectorAll(".is-active")) n.classList.remove("is-active");
    const id = `${this.id}-opt-${this.activeIndex}`;
    const node = this.list.querySelector(`[id="${id}"]`);
    if (node) {
      node.classList.add("is-active");
      this.search.setAttribute("aria-activedescendant", id);
    } else {
      this.search.removeAttribute("aria-activedescendant");
    }
    return node;
  }
  _scrollToActive() {
    const node = this._paintActive();
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
      if (!item.selected && this.opts.maxItems && this._chosen().length >= this.opts.maxItems) return;
      item.selected = !item.selected;
    } else if (item.selected) {
      if (this.opts.closeOnSelect) this.close();
      return;
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
      this.activeIndex = this._filtered().indexOf(item);
      this._renderMenu();
      this._scrollToActive();
    }
    this.search.focus();
  }
  _onKeydown(e) {
    const { key } = e;
    const visible = this._filtered();
    if (key === "ArrowDown" || key === "ArrowUp" || this.isOpen && (key === "Home" || key === "End")) {
      e.preventDefault();
      if (!this.isOpen) return this.open();
      const len = visible.length;
      const step = key === "ArrowDown" || key === "Home" ? 1 : -1;
      const from = key === "Home" ? -1 : key === "End" || step < 0 && this.activeIndex < 0 ? len : this.activeIndex;
      for (let n = 1; n <= len; n++) {
        const i = ((from + step * n) % len + len) % len;
        if (!visible[i].disabled) {
          this.activeIndex = i;
          break;
        }
      }
      this._scrollToActive();
    } else if (key === "Enter" || key === " ") {
      if (!this.isOpen) {
        if (key === " " && this.search.value) return;
        e.preventDefault();
        return this.open();
      }
      if (key === " ") return;
      e.preventDefault();
      const item = visible[this.activeIndex];
      if (item) this._toggleItem(item);
    } else if (key === "Backspace" && !this.search.value && this.multiple) {
      const last = this._chosen().filter((i) => !i.disabled).pop();
      if (last) this._toggleItem(last);
    } else if ((key === "Backspace" || key === "Delete") && !this.search.value && !this.multiple) {
      if (this.opts.clearable && this.getValue() !== null) {
        e.preventDefault();
        this.clear();
      }
    }
  }
  _emit() {
    const value = this.getValue();
    const detail = { value, instance: this };
    this.opts.onChange?.(value, detail);
    this.native.dispatchEvent(new CustomEvent("tucano:change", { detail, bubbles: true }));
  }
};
function optionIndex(target) {
  const node = target.closest("[role=option]");
  return node ? +node.id.slice(node.id.lastIndexOf("-") + 1) : -1;
}
function loadingRow(text) {
  return el("div", { class: "tuc-select__empty is-loading" }, [
    el("span", { class: "tuc-spinner", "aria-hidden": "true" }),
    text
  ]);
}
function labelText(label) {
  const copy = label.cloneNode(true);
  for (const n of copy.querySelectorAll("select")) n.remove();
  return copy.textContent.trim();
}
function normalizeOptions(data) {
  const list = Array.isArray(data) ? data : data?.results ?? [];
  return list.map((o) => {
    if (typeof o !== "object") o = { value: o };
    const value = String(o?.value ?? o?.id ?? "");
    return { value, label: String(o?.label ?? o?.text ?? value), disabled: !!o?.disabled, group: o?.group ?? null, selected: false };
  }).filter((o) => o.value !== "");
}
function hasNextPage(raws, items, pageParam) {
  if (!pageParam) return false;
  if (raws && typeof raws === "object" && "next" in raws) return !!raws.next;
  return items.length > 0;
}
function readOptions(select2) {
  return [...select2.options].filter((o) => o.value !== "").map((o) => ({
    value: o.value,
    label: o.textContent.trim(),
    // :disabled pega tambem a <optgroup disabled>, que o `o.disabled` ignora.
    disabled: o.matches(":disabled"),
    group: o.parentElement.tagName === "OPTGROUP" ? o.parentElement.label : null,
    selected: o.selected,
    // Normaliza acentos: buscar "sao" acha "São Paulo".
    search: normalize(`${o.textContent} ${o.value}`)
  }));
}
function normalize(s) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}
function firstEmptyLabel(select2) {
  const o = [...select2.options].find((x) => x.value === "");
  return o ? o.textContent.trim() : null;
}
function autoInit2(scope = document) {
  const out = [];
  for (const node of scope.querySelectorAll("select[data-tuc-select]:not([data-tuc-ready])")) {
    const d = node.dataset;
    node.setAttribute("data-tuc-ready", "");
    out.push(new Select(node, {
      // data-placeholder nao entra aqui: o construtor ja o le do proprio elemento.
      search: d.search === "true" ? true : d.search === "false" ? false : void 0,
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
  const sector = Math.floor(h / 60) % 6;
  const [r, g, b] = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x]
  ][sector];
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
  const alpha = Math.round(a * 255);
  return alpha < 255 ? base + hex2(alpha) : base;
}
var num = (t, scale) => t.endsWith("%") ? t.slice(0, -1) / 100 * scale : Number(t);
function parseColor(input) {
  if (!input) return null;
  const text = String(input).trim().toLowerCase();
  const hex = /^#?([0-9a-f]{3,8})$/.exec(text);
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
  const fn = /^(rgb|hsl)a?\(([^)]+)\)$/.exec(text);
  if (!fn) return null;
  const p = fn[2].split(/[\s,/]+/).filter(Boolean);
  if (p.length < 3) return null;
  const pct = (t) => clamp(num(t.endsWith("%") ? t : `${t}%`, 1), 0, 1);
  const unit = /^(.+?)(deg|turn)?$/.exec(p[0]);
  const color = fn[1] === "rgb" ? rgbToHsv({ r: clamp(num(p[0], 255), 0, 255), g: clamp(num(p[1], 255), 0, 255), b: clamp(num(p[2], 255), 0, 255) }) : hslToHsv(unit[1] * (unit[2] === "turn" ? 360 : 1), pct(p[1]), pct(p[2]));
  color.a = p[3] === void 0 ? 1 : clamp(num(p[3], 1), 0, 1);
  return Object.values(color).some(Number.isNaN) ? null : color;
}
function hslToHsv(h, s, l) {
  const v = l + s * Math.min(l, 1 - l);
  return { h: (h % 360 + 360) % 360, s: v === 0 ? 0 : 2 * (1 - l / v), v };
}
function formatColor(hsva, format3 = "hex") {
  const { r, g, b } = hsvToRgb(hsva);
  const a = Math.round(hsva.a * 100) / 100;
  if (format3 === "rgb") {
    return a >= 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  if (format3 === "hsl") {
    const { h, s, l } = hsvToHsl(hsva);
    const hs = `${Math.round(h) % 360}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%`;
    return a >= 1 ? `hsl(${hs})` : `hsla(${hs}, ${a})`;
  }
  return rgbToHex({ r, g, b }, hsva.a);
}
function hsvToHsl({ h, s, v }) {
  const l = v * (1 - s / 2);
  return { h, s: l === 0 || l === 1 ? 0 : (v - l) / Math.min(l, 1 - l), l };
}
function luminance({ r, g, b }) {
  const channel = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}
function isDark(color) {
  const hsva = typeof color === "string" ? parseColor(color) : color;
  if (!hsva) return false;
  return luminance(hsvToRgb(hsva)) < 0.4;
}

// src/js/components/colorpicker.js
var PALETTE = [
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
  swatches: PALETTE,
  // false desliga
  placement: "bottom-center",
  // mesma regra do date picker: centralizado, preso na borda da tela
  appendTo: void 0,
  onChange: null
};
var ColorPicker = class _ColorPicker {
  constructor(target, options = {}) {
    const node = typeof target === "string" ? document.querySelector(target) : target;
    if (!node) throw new Error("[ColorPicker] elemento alvo nao encontrado");
    if (node._tucano instanceof _ColorPicker) {
      const ready = node.hasAttribute("data-tuc-ready");
      node._tucano.destroy();
      node.toggleAttribute("data-tuc-ready", ready);
    }
    this.opts = { ...DEFAULTS3, ...omitUndefined(options) };
    this.input = node;
    this.id = nextId("color");
    this.isOpen = false;
    this._cleanups = [];
    this.hsva = { h: 243, s: 0.7, v: 0.9, a: 1 };
    this.empty = true;
    this._build();
    const initial = node.value || this.opts.value || "";
    if (!initial || !this.setValue(initial, { silent: true })) this._syncInput();
    node._tucano = this;
  }
  /* ---------------------------------------------------------------- *
   * API publica                                                       *
   * ---------------------------------------------------------------- */
  getValue() {
    return this.empty ? null : this._color();
  }
  getRgb() {
    return this.empty ? null : { ...hsvToRgb(this.hsva), a: this.hsva.a };
  }
  /** A cor do HSVA atual, mesmo com o campo vazio: e por onde o painel pinta. */
  _color() {
    return formatColor(this.hsva, this.opts.format);
  }
  setValue(value, { silent = false } = {}) {
    if (value == null || value === "") {
      this.empty = true;
      this._commit(silent);
      return true;
    }
    const color = parseColor(value);
    if (!color) return false;
    this.empty = false;
    const { h, s } = this.hsva;
    this.hsva = {
      h: color.s && color.v ? color.h : h,
      s: color.v ? color.s : s,
      v: color.v,
      a: this.opts.alpha ? color.a : 1
    };
    this._commit(silent);
    return true;
  }
  open() {
    if (this.isOpen || this.input.matches(":disabled, [readonly]")) return;
    this.isOpen = true;
    this._paint();
    this.popover = new Popover(this.field, this.panel, {
      placement: this.opts.placement,
      appendTo: this.opts.appendTo,
      closeOnFocusOut: true,
      /*
       * No Escape o foco volta a amostra, como nos outros campos. Sem isto ele
       * ficava no campo hex ou na area, que saem do DOM junto com o painel, e
       * caia no <body>: o Tab seguinte recomecava do topo da pagina.
       */
      onDismiss: (reason) => {
        const inside = this.panel.contains(document.activeElement);
        this.close();
        if (reason === "escape" && inside) this.swatch.focus();
      }
    });
    this.popover.show();
    this.swatch.setAttribute("aria-expanded", "true");
  }
  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
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
    this.input.removeAttribute("data-tuc-ready");
    delete this.input._tucano;
  }
  /* ---------------------------------------------------------------- *
   * Construcao                                                        *
   * ---------------------------------------------------------------- */
  _build() {
    const openInto = () => {
      this.open();
      if (this.isOpen) this.area.focus();
    };
    this.swatch = el("button", {
      type: "button",
      class: "tuc-color-field__swatch",
      "aria-label": COLORPICKER_TEXTS.pick,
      "aria-haspopup": "dialog",
      "aria-expanded": "false",
      onclick: (e) => this.isOpen || e.detail ? this.toggle() : openInto()
    });
    this.field = el("div", { class: "tuc-color-field" });
    this.input.replaceWith(this.field);
    this.input.classList.add("tuc-color-field__value");
    this.field.append(this.swatch, this.input);
    this.area = el("div", {
      class: "tuc-colorpicker__area",
      tabindex: 0,
      role: "application",
      "aria-label": COLORPICKER_TEXTS.area
    }, [el("span", { class: "tuc-colorpicker__thumb" })]);
    this.hue = this._buildSlider("hue", COLORPICKER_TEXTS.hue, 360);
    this.alpha = this.opts.alpha ? this._buildSlider("alpha", COLORPICKER_TEXTS.alpha, 1) : null;
    this.preview = el("span", { class: "tuc-colorpicker__preview" });
    this.hexField = el("input", {
      class: "tuc-input tuc-colorpicker__field",
      type: "text",
      spellcheck: "false",
      autocomplete: "off",
      "aria-label": COLORPICKER_TEXTS.value
    });
    const fieldRow = el("div", { class: "tuc-colorpicker__row" }, [
      this.preview,
      this.hexField,
      // O conta-gotas ainda e so do Chrome e do Edge: esta checagem continua valendo.
      "EyeDropper" in window ? el("button", {
        type: "button",
        class: "tuc-btn is-outline is-icon is-sm tuc-colorpicker__pick",
        "aria-label": COLORPICKER_TEXTS.eyeDropper,
        onclick: () => this._pickFromScreen()
      }, [icon(ICON_PIPETTE, 15)]) : null
    ]);
    const tracks = el("div", { class: "tuc-colorpicker__tracks" }, [this.hue.root, this.alpha?.root]);
    this.panel = el("div", {
      class: "tuc-colorpicker",
      role: "dialog",
      "aria-label": COLORPICKER_TEXTS.dialog,
      id: this.id
    }, [this.area, tracks, fieldRow, this.opts.swatches ? this._buildSwatches() : null]);
    this._cleanups.push(
      // Clicar em qualquer parte do controle leva o cursor ao valor.
      on(this.field, "mousedown", (e) => {
        if (e.target === this.field) {
          e.preventDefault();
          this.input.focus();
        }
      }),
      /*
       * Abrir no foco do campo de texto atrapalhava duas vezes: o painel subia
       * so de tabular por um formulario, e cobria o proprio campo de quem
       * queria digitar o hex. O gatilho e a amostra, que e <button> e ja
       * responde a Enter e Espaco. Aqui fica so a seta para baixo, igual a do
       * campo de data, ouvida no envolucro para valer na amostra e no campo.
       */
      on(this.field, "keydown", (e) => {
        if (e.key === "ArrowDown" && !this.isOpen) {
          e.preventDefault();
          openInto();
        }
      }),
      ...this._dragHandler(this.area, (x, y) => {
        this.hsva = { ...this.hsva, s: x, v: 1 - y };
        this.empty = false;
        this._commit(false, false);
      }),
      on(this.area, "keydown", (e) => this._areaKeys(e)),
      on(this.input, "change", () => {
        if (this._emitting) return;
        if (!this.setValue(this.input.value, { silent: true })) return this._syncInput();
        this._emit(false);
      }),
      // Sempre reescrito: o foco ainda esta no campo quando o change sai, e o
      // _paint pula campo focado — texto invalido ficava la, mentindo o valor.
      on(this.hexField, "change", () => {
        this.setValue(this.hexField.value);
        this.hexField.value = this.empty ? "" : this._color();
      })
    );
    if (this.input.form) {
      this._cleanups.push(on(this.input.form, "reset", () => setTimeout(() => {
        this.setValue(this.input.value, { silent: true }) || this._syncInput();
      })));
    }
  }
  _buildSlider(type, label, max) {
    const thumb = el("span", { class: "tuc-colorpicker__thumb" });
    const root = el("div", {
      class: `tuc-colorpicker__slider is-${type}`,
      tabindex: 0,
      role: "slider",
      "aria-label": label,
      "aria-valuemin": "0",
      "aria-valuemax": String(max)
    }, [el("span", { class: "tuc-colorpicker__track" }), thumb]);
    const hue = type === "hue";
    const set = (x, native) => {
      this.hsva = hue ? { ...this.hsva, h: x * 360 } : { ...this.hsva, a: x };
      this.empty = false;
      this._commit(false, native);
    };
    this._cleanups.push(
      ...this._dragHandler(root, (x) => set(x, false)),
      on(root, "keydown", (e) => {
        const step = (e.shiftKey ? 10 : 1) / (hue ? 360 : 100);
        const delta = { ArrowLeft: -step, ArrowDown: -step, ArrowRight: step, ArrowUp: step, Home: -1, End: 1 }[e.key];
        if (!delta) return;
        e.preventDefault();
        set(clamp((hue ? this.hsva.h / 360 : this.hsva.a) + delta, 0, 1));
      })
    );
    return { root, thumb };
  }
  _buildSwatches() {
    return el(
      "div",
      { class: "tuc-colorpicker__swatches" },
      this.opts.swatches.map((color) => {
        const parsed = parseColor(color);
        return el("button", {
          type: "button",
          class: "tuc-colorpicker__swatchbtn",
          style: `--color: ${color}`,
          "aria-label": color,
          title: color,
          // Comparada com o alfa: `#00ff0080` marcado como a cor `#00ff00` indicava a amostra errada.
          dataset: { color: parsed && formatColor(this.opts.alpha ? parsed : { ...parsed, a: 1 }) },
          onclick: () => {
            this.setValue(color);
          }
        });
      })
    );
  }
  /**
   * Arrasto normalizado em [0,1]. Usa pointer capture para o gesto continuar
   * valendo quando o cursor sai do elemento — sem isso o thumb "gruda" na borda.
   * O navegador solta a captura sozinho no pointerup e no pointercancel, e
   * avisa com `lostpointercapture`.
   */
  _dragHandler(node, onMove) {
    let start;
    const apply2 = (e) => {
      const r = node.getBoundingClientRect();
      onMove(clamp((e.clientX - r.left) / r.width, 0, 1), clamp((e.clientY - r.top) / r.height, 0, 1));
    };
    return [
      on(node, "pointerdown", (e) => {
        if (e.button) return;
        e.preventDefault();
        node.setPointerCapture(e.pointerId);
        node.focus();
        start = this.input.value;
        apply2(e);
      }),
      on(node, "pointermove", (e) => {
        if (node.hasPointerCapture(e.pointerId)) apply2(e);
      }),
      /*
       * O change nativo sai uma vez, ao soltar, como no <input type="range">; o
       * tucano:change continua a cada movimento. Com o nativo a cada pixel, um
       * `hx-trigger="change"` mandava uma requisicao por movimento do mouse.
       */
      on(node, "lostpointercapture", () => {
        if (this.input.value !== start) this._change();
      })
    ];
  }
  _areaKeys(e) {
    const step = (e.shiftKey ? 10 : 2) / 100;
    const map = {
      ArrowLeft: { s: -step },
      ArrowRight: { s: step },
      ArrowUp: { v: step },
      ArrowDown: { v: -step }
    };
    const d = map[e.key];
    if (!d) return;
    e.preventDefault();
    this.empty = false;
    this.hsva = {
      ...this.hsva,
      s: clamp(this.hsva.s + (d.s || 0), 0, 1),
      v: clamp(this.hsva.v + (d.v || 0), 0, 1)
    };
    this._commit();
  }
  async _pickFromScreen() {
    try {
      const { sRGBHex } = await new window.EyeDropper().open();
      this.setValue(sRGBHex);
    } catch {
    }
  }
  /* ---------------------------------------------------------------- *
   * Render                                                            *
   * ---------------------------------------------------------------- */
  /**
   * Grava no campo, repinta e emite — mas so quando o texto mudou. Tecla na
   * borda da area e movimento abaixo de um degrau de cor emitiam o mesmo valor
   * de novo. `native` falso segura o change nativo (arrasto e texto digitado).
   */
  _commit(silent, native = true) {
    const before = this.input.value;
    this._syncInput();
    if (this.isOpen) this._paint();
    if (!silent && this.input.value !== before) this._emit(native);
  }
  _syncInput() {
    const value = this.empty ? "" : this._color();
    this.input.value = value;
    this.swatch.style.setProperty("--color", value || "transparent");
  }
  /** Repinta os controles a partir do HSVA atual. */
  _paint() {
    const { h, s, v, a } = this.hsva;
    const pure = rgbToHex(hsvToRgb({ h, s: 1, v: 1 }));
    const solid = rgbToHex(hsvToRgb(this.hsva));
    const thumb = this.area.firstElementChild;
    const value = this.empty ? "" : this._color();
    this.area.style.setProperty("--hue", pure);
    thumb.style.left = `${s * 100}%`;
    thumb.style.top = `${(1 - v) * 100}%`;
    thumb.style.setProperty("--color", solid);
    thumb.classList.toggle("is-dark", isDark(this.hsva));
    this.hue.thumb.style.left = `${h / 360 * 100}%`;
    this.hue.thumb.style.setProperty("--color", pure);
    this.hue.root.setAttribute("aria-valuenow", String(Math.round(h)));
    if (this.alpha) {
      this.alpha.root.style.setProperty("--color", solid);
      this.alpha.thumb.style.left = `${a * 100}%`;
      this.alpha.thumb.style.setProperty("--color", solid);
      this.alpha.root.setAttribute("aria-valuenow", a.toFixed(2));
    }
    this.preview.style.setProperty("--color", value || "transparent");
    const current = this.empty ? null : formatColor(this.hsva);
    for (const btn of this.panel.querySelectorAll(".tuc-colorpicker__swatchbtn")) {
      btn.classList.toggle("is-selected", btn.dataset.color === current);
    }
    if (document.activeElement !== this.hexField) this.hexField.value = value;
  }
  _emit(native = true) {
    const value = this.getValue();
    const detail = { value, rgb: this.getRgb(), hsva: { ...this.hsva }, instance: this };
    this.opts.onChange?.(value, detail);
    this.input.dispatchEvent(new CustomEvent("tucano:change", { detail, bubbles: true }));
    if (native) this._change();
  }
  /** 'change' nativo para validacao de formulario e HTMX enxergarem o valor. */
  _change() {
    this._emitting = true;
    try {
      this.input.dispatchEvent(new Event("change", { bubbles: true }));
    } finally {
      this._emitting = false;
    }
  }
};
function autoInit3(scope = document) {
  const out = [];
  for (const node of scope.querySelectorAll("[data-tuc-color]:not([data-tuc-ready])")) {
    const d = node.dataset;
    node.setAttribute("data-tuc-ready", "");
    out.push(new ColorPicker(node, {
      format: d.format || void 0,
      alpha: d.alpha === "false" ? false : void 0,
      // Virgula dentro de parenteses nao separa: `rgb(255, 0, 0)` virava tres amostras quebradas.
      swatches: d.swatches === "false" ? false : d.swatches ? d.swatches.split(/\s*,\s*(?![^(]*\))/) : void 0,
      placement: d.placement || void 0
    }));
  }
  return out;
}

// src/js/core/files.js
function formatSize(bytes, locale = "pt-BR") {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let n = bytes / 1024;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  const places = n < 10 ? 1 : 0;
  return `${n.toLocaleString(locale, { maximumFractionDigits: places })} ${units[i]}`;
}
function parseSize(value) {
  if (typeof value === "number") return value;
  const m = /^([\d.,]+)\s*([kmg]?)(?:i?b)?$/i.exec(String(value ?? "").trim());
  return m ? Math.round(parseFloat(m[1].replace(",", ".")) * 1024 ** " kmg".indexOf(m[2].toLowerCase() || " ")) : null;
}
function matchesAccept(file, accept) {
  if (!accept) return true;
  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();
  return accept.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean).some((rule) => {
    if (rule.startsWith(".")) return name.endsWith(rule);
    if (rule.endsWith("/*")) return type.startsWith(rule.slice(0, -1));
    return type === rule;
  });
}
function isImage(file) {
  return (file.type || "").startsWith("image/");
}
function csrfToken() {
  const m = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]*)/);
  return m ? decodeURIComponent(m[1]) : null;
}
function sameOrigin(url, base = location.href) {
  try {
    return new URL(url, base).origin === new URL(base).origin;
  } catch {
    return false;
  }
}
function uploadFile({ url, file, field, extras, headers, method, texts, onProgress }) {
  const xhr = new XMLHttpRequest();
  const promise = new Promise((resolve, reject) => {
    const data = new FormData();
    data.append(field, file);
    for (const [k, v] of Object.entries(extras)) data.append(k, v);
    xhr.open(method, url);
    xhr.responseType = "json";
    for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total);
    });
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response ?? {});
      } else {
        reject(new Error(texts.serverError(xhr.status)));
      }
    });
    xhr.addEventListener("error", () => reject(new Error(texts.networkError)));
    xhr.addEventListener("abort", () => reject(Object.assign(new Error("Cancelado"), { canceled: true })));
    xhr.send(data);
  });
  return { promise, abort: () => xhr.abort() };
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
  // manda X-CSRFToken lido do cookie (Django), so para a mesma origem
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
  // por cima de Tucano.setTexts({ upload }), so nesta instancia
  onChange: null,
  onError: null
};
var Upload = class {
  constructor(target, options = {}) {
    const node = typeof target === "string" ? document.querySelector(target) : target;
    if (!node) throw new Error("[Upload] elemento alvo nao encontrado");
    if (node.tagName !== "INPUT" || node.type !== "file") {
      throw new Error('[Upload] o alvo precisa ser um <input type="file">');
    }
    this.opts = { ...DEFAULTS4, ...omitUndefined(options) };
    this.opts.locale = this.opts.locale || document.documentElement.lang || "pt-BR";
    this.t = { ...UPLOAD_TEXTS, ...this.opts.texts };
    const maxSize = this.opts.maxSize;
    this.opts.maxSize = maxSize == null ? null : parseSize(maxSize);
    if (maxSize != null && this.opts.maxSize == null) console.warn(`[Upload] maxSize invalido: ${maxSize}`);
    this.input = node;
    this.direct = !!this.opts.url;
    this.multiple = node.multiple;
    this.id = nextId("up");
    this.items = [];
    this._cleanups = [];
    this._dragging = 0;
    this._build();
    node._tucano = this;
  }
  /* ---------------------------------------------------------------- *
   * API publica                                                       *
   * ---------------------------------------------------------------- */
  /** Arquivos aceitos, na ordem. No modo direto inclui a resposta do servidor. */
  getFiles() {
    return this.items.map((i) => ({
      name: i.file.name,
      size: i.file.size,
      type: i.file.type,
      status: i.state,
      progress: i.progress,
      id: i.serverId ?? null,
      url: i.url ?? null,
      file: i.file
    }));
  }
  /** Ids devolvidos pelo servidor (modo direto). E o que o formulario posta. */
  getValue() {
    return this.direct ? this.items.filter((i) => i.state === "ready" && i.serverId != null).map((i) => i.serverId) : this.items.map((i) => i.file);
  }
  /** Sobe o que estiver pendente. Util com autoUpload: false. */
  uploadAll() {
    for (const item of this.items) if (item.state === "pending") this._upload(item);
    this._renderList();
  }
  clear() {
    for (const item of [...this.items]) this._remove(item, { silent: true });
    this._emit();
  }
  destroy() {
    this._destroyed = true;
    this._cleanups.forEach((fn) => fn());
    this._cleanups = [];
    for (const i of this.items) {
      i.abort?.();
      if (i.preview) URL.revokeObjectURL(i.preview);
    }
    this.root.replaceWith(this.input);
    this.input.classList.remove("tuc-upload-native");
    if (this.fieldName) this.input.name = this.fieldName;
    if (this._tabindex == null) this.input.removeAttribute("tabindex");
    else this.input.setAttribute("tabindex", this._tabindex);
    this.input.removeAttribute("data-tuc-ready");
    delete this.input._tucano;
  }
  /* ---------------------------------------------------------------- *
   * Construcao                                                        *
   * ---------------------------------------------------------------- */
  _build() {
    const input = this.input;
    input.classList.add("tuc-upload-native");
    this._tabindex = input.getAttribute("tabindex");
    input.tabIndex = -1;
    if (this.direct && input.name) {
      this.fieldName = input.name;
      input.removeAttribute("name");
    }
    this.zone = el("div", {
      class: "tuc-upload__zone",
      role: "button",
      tabindex: 0,
      "aria-describedby": `${this.id}-hint`
    }, [
      el("span", { class: "tuc-upload__icon" }, [icon(ICON_UPLOAD, 20)]),
      el("span", { class: "tuc-upload__label", text: this.multiple ? this.t.zone : this.t.zoneOne }),
      el("span", { class: "tuc-upload__hint", id: `${this.id}-hint`, text: this._hint() })
    ]);
    this.list = el("ul", { class: "tuc-upload__list" });
    this.root = el("div", { class: "tuc-upload", id: this.id }, [this.zone, this.list]);
    input.replaceWith(this.root);
    this.root.append(input);
    const open = () => input.click();
    this._cleanups.push(
      // preventDefault: dentro de um <label>, o clique tambem ativaria o label,
      // que clica no input de novo — Firefox e Safari abriam a janela duas vezes.
      on(this.zone, "click", (e) => {
        e.preventDefault();
        open();
      }),
      on(this.zone, "keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      }),
      on(input, "change", () => {
        this._add([...input.files]);
      }),
      ...this._dragAndDrop()
    );
    if (!this.direct && input.form) {
      this._cleanups.push(on(input.form, "reset", () => setTimeout(() => this.clear())));
    }
    this._renderList();
  }
  _hint() {
    const parts = [];
    if (this.input.accept) parts.push(this.input.accept.split(",").map((s) => s.trim()).join(", "));
    if (this.opts.maxSize) parts.push(this.t.upTo(formatSize(this.opts.maxSize, this.opts.locale)));
    if (this.opts.maxFiles) parts.push(this.t.others(this.opts.maxFiles).toLowerCase());
    return parts.join(" \xB7 ");
  }
  /**
   * Arrastar e soltar. O contador existe porque `dragleave` dispara tambem ao
   * passar de um filho para outro dentro da zona — sem contar entradas e
   * saidas, o realce pisca.
   */
  _dragAndDrop() {
    const stop = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    return [
      on(this.root, "dragenter", (e) => {
        stop(e);
        this._dragging++;
        this.root.classList.add("is-dragging");
        this.zone.querySelector(".tuc-upload__label").textContent = this.t.drop;
      }),
      on(this.root, "dragover", stop),
      on(this.root, "dragleave", (e) => {
        stop(e);
        if (--this._dragging <= 0) this._stopDrag();
      }),
      on(this.root, "drop", (e) => {
        stop(e);
        this._stopDrag();
        this._add([...e.dataTransfer?.files || []]);
      })
    ];
  }
  _stopDrag() {
    this._dragging = 0;
    this.root.classList.remove("is-dragging");
    this.zone.querySelector(".tuc-upload__label").textContent = this.multiple ? this.t.zone : this.t.zoneOne;
  }
  /* ---------------------------------------------------------------- *
   * Arquivos                                                          *
   * ---------------------------------------------------------------- */
  _add(files) {
    if (!files.length || this.input.matches(":disabled")) return;
    if (!this.multiple) {
      const error = this._validate(files[0], 0);
      if (error) {
        this._fail(error, files[0]);
        this._syncNative();
        return;
      }
      for (const item of [...this.items]) this._remove(item, { silent: true });
      files = files.slice(0, 1);
    }
    for (const file of files) {
      const error = this._validate(file, this.items.length);
      if (error) {
        this._fail(error, file);
        continue;
      }
      const item = {
        key: nextId("f"),
        file,
        state: "pending",
        progress: 0,
        preview: isImage(file) ? URL.createObjectURL(file) : null
      };
      this.items.push(item);
      if (this.direct && this.opts.autoUpload) this._upload(item);
    }
    this._syncNative();
    this._renderList();
    this._emit();
  }
  _validate(file, count) {
    if (this.opts.maxFiles && count >= this.opts.maxFiles) {
      return this.t.others(this.opts.maxFiles);
    }
    if (this.opts.maxSize && file.size > this.opts.maxSize) {
      return this.t.large(formatSize(this.opts.maxSize, this.opts.locale));
    }
    if (!matchesAccept(file, this.input.accept)) return this.t.type;
    return null;
  }
  /**
   * No modo formulario o <input type="file"> precisa carregar os arquivos —
   * inclusive os que vieram por arrastar. DataTransfer e a unica forma de
   * escrever em input.files, e todo navegador atual a aceita.
   */
  _syncNative() {
    if (this.direct) return;
    const dt = new DataTransfer();
    for (const item of this.items) dt.items.add(item.file);
    this.input.files = dt.files;
  }
  /**
   * Cabecalhos da instancia com o CSRF do Django, sem passar por cima de um que
   * ja veio — em qualquer caixa: `x-csrftoken` e o mesmo cabecalho, e o XHR
   * juntava os dois num "MEU, DO_COOKIE" que o Django recusa. O token so vai
   * para a mesma origem, como na receita do Django: para outro dominio ele
   * vazava junto do arquivo.
   */
  _headers(url) {
    const headers = { ...this.opts.headers };
    const given = Object.keys(headers).some((k) => k.toLowerCase() === "x-csrftoken");
    if (this.opts.csrf && !given && sameOrigin(url)) {
      const token = csrfToken();
      if (token) headers["X-CSRFToken"] = token;
    }
    for (const k in headers) if (headers[k] == null) delete headers[k];
    return headers;
  }
  /** Comeca o envio. Nao redesenha: quem chama redesenha uma vez, depois de todos. */
  _upload(item) {
    item.state = "uploading";
    item.progress = 0;
    item.error = null;
    const { promise, abort } = uploadFile({
      url: this.opts.url,
      file: item.file,
      field: this.opts.fieldName,
      extras: this.opts.extraData,
      headers: this._headers(this.opts.url),
      method: this.opts.method,
      texts: this.t,
      onProgress: (fraction) => {
        item.progress = fraction;
        this._paintProgress(item);
      }
    });
    item.abort = abort;
    promise.then((response) => {
      item.serverId = response?.[this.opts.responseId] ?? null;
      item.url = response?.[this.opts.responseUrl] ?? null;
      if (this.fieldName && (item.serverId == null || item.serverId === "")) throw new Error(this.t.noId);
      item.state = "ready";
      item.progress = 1;
    }).catch((e) => {
      if (!e.canceled) {
        item.state = "error";
        item.error = e.message;
        this.opts.onError?.(e, item.file);
        return;
      }
      const i = this.items.indexOf(item);
      if (i < 0 || this._destroyed) return false;
      this.items.splice(i, 1);
      if (item.preview) URL.revokeObjectURL(item.preview);
    }).then((changed) => {
      item.abort = null;
      if (changed === false || this._destroyed) return;
      this._renderList();
      this._emit();
    });
  }
  _remove(item, { silent = false } = {}) {
    item.abort?.();
    const i = this.items.indexOf(item);
    if (i >= 0) this.items.splice(i, 1);
    if (item.preview) URL.revokeObjectURL(item.preview);
    if (this.direct && this.opts.deleteUrl && item.serverId != null) {
      const url = `${this.opts.deleteUrl}${encodeURIComponent(item.serverId)}/`;
      fetch(url, { method: "DELETE", headers: this._headers(url) }).catch(() => {
      });
    }
    this._syncNative();
    this._renderList();
    if (!silent) this._emit();
  }
  _fail(message, file) {
    this.opts.onError?.(new Error(message), file);
    const warning = el("li", { class: "tuc-alert is-danger tuc-upload__rejected", role: "alert" }, [
      icon(ICON_ALERT, 16),
      el("div", { class: "tuc-alert__body" }, [
        el("p", { class: "tuc-alert__title", text: file.name }),
        el("p", { text: message })
      ])
    ]);
    this.list.append(warning);
    setTimeout(() => warning.remove(), 5e3);
  }
  /* ---------------------------------------------------------------- *
   * Render                                                            *
   * ---------------------------------------------------------------- */
  _meta(item) {
    const size = formatSize(item.file.size, this.opts.locale);
    if (item.state === "uploading") return `${Math.round(item.progress * 100)}% \xB7 ${size}`;
    return item.state === "error" ? item.error : size;
  }
  /** So a barra: chamado a cada evento de progresso, nao pode refazer a lista. */
  _paintProgress(item) {
    const li = this.list.querySelector(`[data-key="${item.key}"]`);
    if (!li) return;
    const fill = li.querySelector(".tuc-upload__barfill");
    if (fill) fill.style.width = `${Math.round(item.progress * 100)}%`;
    li.querySelector(".tuc-upload__meta").textContent = this._meta(item);
  }
  _renderList() {
    const focused = this.list.contains(document.activeElement) ? document.activeElement : null;
    const focusedKey = focused?.closest("[data-key]")?.dataset.key;
    const focusedLabel = focused?.getAttribute("aria-label");
    for (const n of [...this.list.children]) if (!n.classList.contains("tuc-upload__rejected")) n.remove();
    for (const item of this.items) {
      const actions = [];
      if (item.state === "uploading") {
        actions.push(this._button(ICON_X, this.t.cancel, () => item.abort?.()));
      } else {
        if (item.state === "error") {
          actions.push(this._button(ICON_RETRY, this.t.repeat, () => {
            this._upload(item);
            this._renderList();
          }));
        }
        actions.push(this._button(ICON_X, this.t.remove, () => this._remove(item)));
      }
      this.list.append(el("li", {
        class: `tuc-upload__item is-${item.state}`,
        dataset: { key: item.key }
      }, [
        item.preview ? el("img", { class: "tuc-upload__thumb", src: item.preview, alt: "" }) : el("span", { class: "tuc-upload__thumb" }, [icon(ICON_FILE, 16)]),
        el("div", { class: "tuc-upload__info" }, [
          el("span", { class: "tuc-upload__name", title: item.file.name, text: item.file.name }),
          el("span", { class: "tuc-upload__meta", text: this._meta(item) }),
          item.state === "uploading" ? el("span", { class: "tuc-upload__bar" }, [
            el("span", { class: "tuc-upload__barfill", style: `width:${Math.round(item.progress * 100)}%` })
          ]) : null
        ]),
        item.state === "ready" ? el("span", { class: "tuc-upload__ok" }, [icon(ICON_CHECK, 15)]) : null,
        el("div", { class: "tuc-upload__actions" }, actions)
      ]));
    }
    if (focused) {
      const li = [...this.list.children].find((n) => n.dataset.key === focusedKey);
      const buttons = li ? [...li.querySelectorAll("button")] : [];
      (buttons.find((b) => b.getAttribute("aria-label") === focusedLabel) || buttons[0] || this.zone).focus();
    }
    this._syncHidden();
  }
  _button(path, label, onClick) {
    return el("button", {
      type: "button",
      class: "tuc-btn is-ghost is-icon is-sm",
      "aria-label": label,
      title: label,
      onclick: (e) => {
        e.stopPropagation();
        onClick();
      }
    }, [icon(path, 14)]);
  }
  /**
   * Modo direto: os ids prontos viram inputs hidden com o `name` original — e
   * com o `form` original, senao um input ligado a um formulario por atributo
   * tinha os ids fora dele.
   */
  _syncHidden() {
    if (!this.direct || !this.fieldName) return;
    this.hidden?.remove();
    const form = this.input.getAttribute("form");
    this.hidden = el(
      "span",
      { class: "tuc-upload__hidden" },
      this.getValue().map((id) => el("input", { type: "hidden", name: this.fieldName, value: String(id), form }))
    );
    this.root.append(this.hidden);
  }
  _emit() {
    const detail = { value: this.getValue(), files: this.getFiles(), instance: this };
    this.opts.onChange?.(detail.value, detail);
    this.input.dispatchEvent(new CustomEvent("tucano:change", { detail, bubbles: true }));
  }
};
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
  apply: () => apply,
  applyCurrency: () => applyCurrency,
  capacity: () => capacity,
  clear: () => clear,
  cursorAfter: () => cursorAfter,
  format: () => format2,
  isPlaceholder: () => isPlaceholder,
  maskEmail: () => maskEmail,
  maskMiddle: () => maskMiddle,
  pickTemplate: () => pickTemplate,
  placeholderFromTemplate: () => placeholderFromTemplate,
  validateCNPJ: () => validateCNPJ,
  validateCPF: () => validateCPF,
  validateCpfCnpj: () => validateCpfCnpj
});
var MARKERS = {
  "#": (c) => c >= "0" && c <= "9",
  "A": (c) => /[a-zA-Z]/.test(c),
  "*": (c) => /[0-9a-zA-Z]/.test(c)
};
function isPlaceholder(c) {
  return Object.hasOwn(MARKERS, c);
}
function clear(value, template) {
  const accepts = [...new Set([...template].filter(isPlaceholder))].map((m) => MARKERS[m]);
  if (!accepts.length) return "";
  return [...String(value ?? "")].filter((c) => accepts.some((f) => f(c))).join("");
}
function placeholderFromTemplate(template) {
  const t = Array.isArray(template) ? template[0] : template;
  if (typeof t !== "string") return "";
  return t.replace(/[#*]/g, "0");
}
function capacity(template) {
  return [...template].filter(isPlaceholder).length;
}
function apply(chars, template) {
  if (!chars.length) return "";
  let exit = "";
  let i = 0;
  for (const ch of template) {
    if (isPlaceholder(ch)) {
      let accepted = null;
      while (i < chars.length) {
        const candidate = chars[i++];
        if (MARKERS[ch](candidate)) {
          accepted = candidate;
          break;
        }
      }
      if (accepted === null) break;
      exit += accepted;
    } else {
      exit += ch;
    }
  }
  return exit;
}
function cursorAfter(text, n) {
  if (n <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < text.length; i++) {
    if (/[0-9A-Za-z]/.test(text[i]) && ++seen === n) return i + 1;
  }
  return text.length;
}
function pickTemplate(chars, templates) {
  const list = [].concat(templates);
  if (list.length === 1) return list[0];
  const n = chars.length;
  return list.find((g) => n <= capacity(g)) || list[list.length - 1];
}
function applyCurrency(digits, options = {}) {
  const cleaned = String(digits).replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  if (!cleaned) return "";
  return formatNumber(Number(cleaned) / 10 ** (options.decimals ?? 2), options);
}
function formatNumber(n, { decimals = 2, locale = "pt-BR", currency = null } = {}) {
  return n.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    ...currency ? { style: "currency", currency } : {}
  });
}
function mod11Digit(values, startWeight) {
  let sum = 0;
  let weight = startWeight;
  for (const v of values) {
    sum += v * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
}
function validateCPF(value) {
  const d = String(value ?? "").replace(/\D/g, "");
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;
  const n = [...d].map(Number);
  const check1 = mod11Digit(n.slice(0, 9), 10);
  const check2 = mod11Digit(n.slice(0, 10), 11);
  return check1 === n[9] && check2 === n[10];
}
function validateCNPJ(value) {
  const s = String(value ?? "").toUpperCase().replace(/[^0-9A-Z]/g, "");
  if (s.length !== 14) return false;
  if (!/^[0-9A-Z]{12}\d{2}$/.test(s)) return false;
  if (/^(.)\1{13}$/.test(s)) return false;
  const values = [...s].map((c) => c.charCodeAt(0) - 48);
  const check1 = mod11Digit(values.slice(0, 12), 5);
  const check2 = mod11Digit(values.slice(0, 13), 6);
  return check1 === values[12] && check2 === values[13];
}
function validateCpfCnpj(value) {
  const s = String(value ?? "").replace(/[^0-9A-Za-z]/g, "");
  if (s.length === 11) return validateCPF(s);
  if (s.length === 14) return validateCNPJ(s);
  return false;
}
function format2(value, format3, options = {}) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (format3 === "currency" || format3 === "brl") {
    const n = typeof value === "number" ? value : Number(raw.replace(/\.(?=\d{3}\b)/g, "").replace(",", "."));
    if (!Number.isFinite(n)) return raw;
    return formatNumber(n, { ...options, currency: options.currency ?? (format3 === "brl" ? "BRL" : null) });
  }
  const templates = DISPLAY_TEMPLATES[format3] ?? format3;
  const all = [].concat(templates).join("");
  const chars = clear(raw, all);
  if (!chars) return raw;
  const template = pickTemplate(chars, templates);
  return chars.length === capacity(template) ? apply(chars, template) : raw;
}
var DISPLAY_TEMPLATES = {
  cpf: "###.###.###-##",
  cnpj: "**.***.***/****-##",
  "cpf-cnpj": ["###.###.###-##", "**.***.***/****-##"],
  phone: ["(##) ####-####", "(##) #####-####"],
  mobile: "(##) #####-####",
  cep: "#####-###",
  card: "#### #### #### ####"
};
var DOT = "\u2022";
function maskMiddle(text, visible = 2, mode = "end") {
  const s = String(text ?? "");
  if (!s) return s;
  if (mode === "email") return maskEmail(s);
  const alphanumeric = (c) => /[0-9A-Za-z]/.test(c);
  const total = [...s].filter(alphanumeric).length;
  const show = mode === "all" ? 0 : visible;
  let seen = 0;
  return [...s].map((c) => {
    if (!alphanumeric(c)) return mode === "all" ? DOT : c;
    seen++;
    return seen > total - show ? c : DOT;
  }).join("");
}
function maskEmail(value) {
  const s = String(value ?? "");
  const atSign = s.lastIndexOf("@");
  if (atSign < 1) return maskMiddle(s, 0, "all");
  const local = s.slice(0, atSign);
  const domain = s.slice(atSign);
  return local[0] + DOT.repeat(Math.max(local.length - 1, 1)) + domain;
}

// src/js/components/mask.js
var FORMATS = {
  cpf: { template: "###.###.###-##", validate: validateCPF, get error() {
    return MASK_TEXTS.cpf;
  } },
  cnpj: { template: "**.***.***/****-##", validate: validateCNPJ, get error() {
    return MASK_TEXTS.cnpj;
  }, uppercase: true },
  "cnpj-numeric": { template: "##.###.###/####-##", validate: validateCNPJ, get error() {
    return MASK_TEXTS.cnpj;
  } },
  "cpf-cnpj": {
    template: ["###.###.###-##", "**.***.***/****-##"],
    validate: validateCpfCnpj,
    get error() {
      return MASK_TEXTS.cpfCnpj;
    },
    uppercase: true
  },
  phone: { template: ["(##) ####-####", "(##) #####-####"] },
  mobile: { template: "(##) #####-####" },
  cep: { template: "#####-###" },
  date: { template: "##/##/####" },
  time: { template: "##:##" },
  card: { template: "#### #### #### ####" },
  currency: { isCurrency: true },
  brl: { isCurrency: true, currency: "BRL" }
};
var DEFAULTS5 = {
  format: null,
  // nome de FORMATS ou gabarito livre
  validate: false,
  // valida no blur e bloqueia o submit
  decimals: 2,
  currency: null,
  // 'BRL' formata com R$
  reveal: false,
  // olhinho para mostrar e ocultar
  revealVisible: 2,
  // quantos caracteres ficam a mostra no modo 'end'
  revealMode: null,
  // 'end' | 'email' | 'all'. null decide pelo campo
  locale: void 0,
  errorText: null,
  onChange: null
};
var Mask = class {
  constructor(target, options = {}) {
    const node = typeof target === "string" ? document.querySelector(target) : target;
    if (!node) throw new Error("[Mask] elemento alvo nao encontrado");
    this.opts = { ...DEFAULTS5, ...omitUndefined(options) };
    this.opts.locale = this.opts.locale || document.documentElement.lang || "pt-BR";
    this.input = node;
    if (this.opts.reveal && !node.matches("input, textarea")) {
      this._cleanups = [];
      this._buildTextReveal();
      node._tucano = this;
      return;
    }
    node.classList.add("tuc-input");
    const preset = FORMATS[this.opts.format];
    this.preset = preset || null;
    this.isCurrency = !!preset?.isCurrency;
    this.templates = preset ? preset.template : this.opts.format;
    this.uppercase = !!preset?.uppercase;
    if (preset?.currency && !this.opts.currency) this.opts.currency = preset.currency;
    if (!this.isCurrency && !this.templates && !this.opts.reveal) {
      throw new Error("[Mask] informe um formato ou gabarito");
    }
    if (!node.getAttribute("placeholder")) {
      if (this.isCurrency) {
        node.placeholder = applyCurrency("0", {
          decimals: this.opts.decimals,
          locale: this.opts.locale,
          currency: this.opts.currency
        });
      } else if (this.templates) {
        node.placeholder = placeholderFromTemplate(this.templates);
      }
    }
    this._cleanups = [];
    this._wire();
    if (node.value && (this.isCurrency || this.templates)) this._format({ keepCursor: false });
    if (this.opts.reveal) this._buildEye();
    node._tucano = this;
  }
  /* ---------------------------------------------------------------- *
   * API publica                                                       *
   * ---------------------------------------------------------------- */
  /** Conteudo sem formatacao: so digitos, ou digitos e letras. */
  getRaw() {
    if (this.textMode) return this.rawText;
    const text = this.rawValue ?? this.input.value;
    if (this.isCurrency) return text.replace(/\D/g, "");
    if (!this.templates) return text;
    return clear(text, [].concat(this.templates).join(""));
  }
  /** Numero, no formato moeda. */
  getNumber() {
    if (!this.isCurrency) return null;
    const d = this.getRaw();
    return d ? Number(d) / 10 ** this.opts.decimals : null;
  }
  setValue(value) {
    this.input.value = String(value ?? "");
    this._format({ keepCursor: false });
    if (this.hidden) this.hidden.value = this.getRaw();
    this._emit();
  }
  isValid() {
    const validate = this.preset?.validate;
    if (!validate) return true;
    const raw = this.getRaw();
    return raw ? validate(raw) : true;
  }
  destroy() {
    this._cleanups.forEach((fn) => fn());
    this._cleanups = [];
    if (this.wrapper && this.textMode) {
      this.input.textContent = this.rawText;
      this.wrapper.replaceWith(this.input);
    } else if (this.wrapper) {
      if (this.rawValue != null) this.input.value = this.rawValue;
      if (this.realName) this.input.name = this.realName;
      this.input.readOnly = this.readOnlyOriginal ?? false;
      this.wrapper.replaceWith(this.input);
      this.hidden?.remove();
    }
    this.input.setCustomValidity?.("");
    this.input.classList.remove("tuc-invalid");
    this.input.removeAttribute("data-tuc-valid");
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
  _buildEye() {
    const input = this.input;
    this.password = input.type === "password";
    this.wrapper = el("span", { class: "tuc-field" });
    input.replaceWith(this.wrapper);
    this.wrapper.append(input);
    if (!this.password && input.name) {
      this.realName = input.name;
      input.removeAttribute("name");
      this.hidden = el("input", { type: "hidden", name: this.realName, value: this.getRaw() });
      this.wrapper.append(this.hidden);
    }
    this.eye = el("button", {
      type: "button",
      class: "tuc-btn is-ghost is-icon is-sm tuc-field__eye",
      "aria-label": MASK_TEXTS.show,
      "aria-pressed": "false",
      onclick: () => this._toggle()
    });
    this.wrapper.append(this.eye);
    this.showing = !this.password && !input.value;
    this._paintEye();
    this._cleanups.push(on(input, "input", () => {
      if (this.hidden) this.hidden.value = this.getRaw();
    }));
  }
  /**
   * Dado sensivel fora de campo: o CPF num perfil, o cartao numa celula de
   * tabela. O texto aparece escondido, com o olho ao lado, nos mesmos modos do
   * campo. E so visual: o valor inteiro esta no HTML, entao o que nao pode chegar
   * ao navegador tem de ser escondido no servidor.
   */
  _buildTextReveal() {
    const node = this.input;
    const raw = (node.dataset.value ?? node.textContent).trim();
    const name = this.opts.format || node.dataset.tucFormat;
    this.rawText = name ? format2(raw, name, { decimals: this.opts.decimals, currency: this.opts.currency ?? void 0, locale: this.opts.locale }) : raw;
    node.setAttribute("data-tuc-formatted", "");
    this.textMode = true;
    this.wrapper = el("span", { class: "tuc-reveal" });
    node.replaceWith(this.wrapper);
    this.wrapper.append(node);
    this.eye = el("button", {
      type: "button",
      class: "tuc-btn is-ghost is-icon is-sm tuc-reveal__eye",
      onclick: () => this._toggle()
    });
    this.wrapper.append(this.eye);
    this.showing = false;
    this._paintEye();
  }
  /**
   * Modo de esconder. Escolhido pelo campo quando nao informado: `type=email`
   * guarda o dominio, o resto guarda o fim.
   */
  _hiddenMode() {
    if (this.opts.revealMode) return this.opts.revealMode;
    if (this.textMode) return this.rawText.includes("@") ? "email" : "end";
    if (this.input.type === "email") return "email";
    return "end";
  }
  _toggle() {
    this.showing = !this.showing;
    this._paintEye();
    if (this.showing && !this.textMode) this.input.focus();
  }
  _paintEye() {
    const input = this.input;
    const showing = this.showing;
    if (this.textMode) {
      input.textContent = showing ? this.rawText : maskMiddle(this.rawText, this.opts.revealVisible, this._hiddenMode());
    } else if (this.password) {
      input.type = showing ? "text" : "password";
    } else {
      if (showing) {
        if (this.rawValue != null) {
          input.value = this.rawValue;
          this.rawValue = null;
        }
        input.readOnly = this.readOnlyOriginal ?? false;
      } else {
        this.readOnlyOriginal = input.readOnly;
        this.rawValue = input.value;
        input.value = maskMiddle(input.value, this.opts.revealVisible, this._hiddenMode());
        input.readOnly = true;
      }
    }
    this.eye.replaceChildren(icon(showing ? ICON_EYE_OFF : ICON_EYE, 16));
    this.eye.setAttribute("aria-label", showing ? MASK_TEXTS.hide : MASK_TEXTS.show);
    this.eye.setAttribute("aria-pressed", String(showing));
    this.wrapper.classList.toggle("is-hidden", !showing);
  }
  /* ---------------------------------------------------------------- *
   * Interno                                                           *
   * ---------------------------------------------------------------- */
  _wire() {
    const input = this.input;
    if (!input.getAttribute("inputmode") && (this.isCurrency || this.templates)) {
      input.setAttribute("inputmode", this.isCurrency || !/[A*]/.test([].concat(this.templates).join("")) ? "numeric" : "text");
    }
    if (input.type !== "password") input.setAttribute("autocomplete", input.getAttribute("autocomplete") || "off");
    this._cleanups.push(
      on(input, "input", (e) => this._onType(e)),
      on(input, "blur", () => {
        if (this.opts.validate) this._validate();
      }),
      // So quem valida mexe no erro. Sem `validate`, o aria-invalid e de quem
      // renderizou o campo — o Django 5 o escreve no campo que voltou com erro — e
      // zera-lo no foco apagava a marca vermelha no primeiro clique. No foco o
      // vermelho sai, mas o verde de um valor ja certo fica.
      on(input, "focus", () => {
        if (this.opts.validate) this._mark(true, this._complete());
      })
    );
  }
  _onType(e) {
    const input = this.input;
    const cursor = input.selectionStart ?? input.value.length;
    const type = typeof e.inputType === "string" ? e.inputType : "";
    this._format({
      cursor,
      deleting: type.startsWith("delete"),
      forward: type === "deleteContentForward"
    });
    this._emit();
    if (this.opts.validate) this._mark(true, this._complete());
  }
  /** Valor inteiro (do tamanho do gabarito escolhido) e aprovado pela validacao. */
  _complete() {
    if (!this.templates) return false;
    const raw = this.getRaw();
    if (!raw) return false;
    return raw.length >= capacity(pickTemplate([...raw], this.templates)) && this.isValid();
  }
  _format({ cursor = null, deleting = false, forward = false, keepCursor = true } = {}) {
    const input = this.input;
    const raw = input.value;
    if (this.isCurrency) {
      const digits = raw.replace(/\D/g, "");
      const text2 = applyCurrency(digits, {
        decimals: this.opts.decimals,
        locale: this.opts.locale,
        currency: this.opts.currency
      });
      input.value = text2;
      if (keepCursor) input.setSelectionRange(text2.length, text2.length);
      return;
    }
    if (!this.templates) return;
    const all = [].concat(this.templates).join("");
    let chars = [...clear(raw, all)];
    if (this.uppercase) chars = chars.map((c) => c.toUpperCase());
    let before = cursor === null ? chars.length : [...clear(raw.slice(0, cursor), all)].length;
    if (deleting && chars.length === this._last?.length) {
      const idx = forward ? before : before - 1;
      if (idx >= 0 && idx < chars.length) {
        chars.splice(idx, 1);
        if (!forward) before -= 1;
      }
    }
    const template = pickTemplate(chars, this.templates);
    chars = chars.slice(0, capacity(template));
    const text = apply(chars.join(""), template);
    this._last = chars.join("");
    input.value = text;
    if (keepCursor) {
      const pos = cursorAfter(text, Math.min(before, chars.length));
      input.setSelectionRange(pos, pos);
    }
  }
  _validate() {
    const ok = this.isValid();
    this._mark(ok, ok && this._complete());
    return ok;
  }
  /**
   * Marca o campo. setCustomValidity faz o formulario do navegador barrar o
   * submit sozinho, sem o projeto escrever nada.
   *
   * `approved` acende o verde (data-tuc-valid): so para valor preenchido e certo.
   * Vazio fica neutro — obrigatoriedade e assunto do `required`, nao da mascara.
   */
  _mark(ok, approved = false) {
    const msg = ok ? "" : this.opts.errorText || this.preset?.error || MASK_TEXTS.invalid;
    this.input.setCustomValidity?.(msg);
    this.input.classList.toggle("tuc-invalid", !ok);
    this.input.setAttribute("aria-invalid", ok ? "false" : "true");
    this.input.toggleAttribute("data-tuc-valid", ok && approved);
  }
  _emit() {
    const detail = { value: this.input.value, raw: this.getRaw(), number: this.getNumber(), instance: this };
    this.opts.onChange?.(detail.value, detail);
    this.input.dispatchEvent(new CustomEvent("tucano:change", { detail, bubbles: true }));
  }
};
function autoInit5(scope = document) {
  const out = [];
  const targets = scope.querySelectorAll("[data-tuc-mask]:not([data-tuc-ready]), [data-tuc-reveal]:not([data-tuc-ready])");
  for (const node of targets) {
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
    const raw = (node.dataset.value ?? node.textContent).trim();
    node.textContent = format2(raw, d.tucFormat, {
      decimals: d.decimals ? +d.decimals : void 0,
      currency: d.currency || void 0
    });
    out.push(node);
  }
  return out;
}

// src/js/components/toast.js
var DEFAULTS6 = {
  type: "info",
  // 'info' | 'success' | 'warning' | 'error' | 'loading'
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
var ICON = {
  info: ICON_INFO,
  success: ICON_CHECK,
  warning: ICON_ALERT,
  error: ICON_ALERT
};
var DURATION = { info: 4e3, success: 3500, warning: 6e3, error: 8e3, loading: null };
var durationFor = (type) => type in DURATION ? DURATION[type] : 4e3;
var containers = /* @__PURE__ */ new Map();
function container(position) {
  if (containers.has(position)) return containers.get(position);
  const node = el("div", {
    class: `tuc-toasts is-${position}`,
    role: "region",
    "aria-label": TOAST_TEXTS.region
  }, [
    el("div", { class: "tuc-toasts__stage" }, [
      el("div", { class: "tuc-toasts__live", "aria-live": "polite", "aria-atomic": "false" }),
      el("div", { class: "tuc-toasts__live is-urgent", "aria-live": "assertive", "aria-atomic": "false" })
    ])
  ]);
  node.style.setProperty("--tuc-toast-gap", `${GAP}px`);
  document.body.append(node);
  containers.set(position, node);
  const expand = (yes) => {
    node.classList.toggle("is-expanded", yes);
    arrange(node);
  };
  node.addEventListener("pointerenter", () => expand(true));
  node.addEventListener("pointerleave", () => expand(false));
  node.addEventListener("focusin", () => expand(true));
  node.addEventListener("focusout", () => {
    if (!node.contains(document.activeElement)) expand(false);
  });
  return node;
}
var INDENT = 14;
var VISIBLE = 3;
var GAP = 12;
var seq = 0;
function arrange(container2) {
  void container2.offsetHeight;
  if (!container2.offsetWidth) return;
  const below = container2.className.includes("is-bottom");
  const direction = below ? -1 : 1;
  const isOpen2 = container2.classList.contains("is-expanded");
  const stage = container2.querySelector(".tuc-toasts__stage");
  const toasts = [...stage.querySelectorAll(".tuc-toast:not(.is-closing)")].sort((a, b) => +a.dataset.seq - +b.dataset.seq);
  const front = toasts.length - 1;
  let accrued = 0;
  for (let i = front; i >= 0; i--) {
    const k = front - i;
    const t = toasts[i];
    const y = isOpen2 ? accrued : k * INDENT;
    const scale = isOpen2 ? 1 : 1 - k * 0.05;
    t.style.setProperty("--tuc-toast-y", `${direction * y}px`);
    t.style.setProperty("--tuc-toast-scale", String(scale));
    t.style.zIndex = String(100 - k);
    t.classList.toggle("is-hidden", !isOpen2 && k >= VISIBLE);
    t.setAttribute("aria-hidden", !isOpen2 && k >= VISIBLE ? "true" : "false");
    accrued += t.offsetHeight + GAP;
  }
  const frontHeight = toasts[front]?.offsetHeight ?? 0;
  const total = isOpen2 ? accrued - GAP : frontHeight + Math.min(toasts.length - 1, VISIBLE - 1) * INDENT;
  stage.style.height = toasts.length ? `${total}px` : "0px";
}
var Toast = class {
  constructor(options = {}) {
    this.opts = { ...DEFAULTS6, ...omitUndefined(options) };
    if (this.opts.duration === void 0) this.opts.duration = durationFor(this.opts.type);
    this.id = nextId("toast");
    this._cleanups = [];
    this._build();
  }
  /** Os filhos do toast. Sai do _build para que update() reaproveite. */
  _content() {
    const { type, title, text, closable, action } = this.opts;
    return [
      // Carregando e o spinner do sistema; os outros tipos, o icone do tom.
      el("span", { class: "tuc-toast__icon" }, [type === "loading" ? el("span", { class: "tuc-spinner" }) : icon(ICON[type] ?? ICON.info, 17)]),
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
        "aria-label": TOAST_TEXTS.close,
        onclick: () => this.close()
      }, [icon(ICON_X, 14)]) : null
    ];
  }
  /**
   * Troca o conteudo sem recriar o toast: e o que faz um "salvando" virar
   * "salvo" no mesmo cartao, sem a pilha reorganizar e sem o olho perder de
   * vista o aviso que ja estava lendo.
   */
  update(options = {}) {
    if (!this.node) return this;
    const previous = this.opts.type;
    this.opts = { ...this.opts, ...omitUndefined(options) };
    const { type } = this.opts;
    if (options.duration === void 0 && type !== previous) {
      this.opts.duration = durationFor(type);
    }
    this.node.classList.replace(`is-${previous}`, `is-${type}`);
    this.node.replaceChildren(...this._content().filter(Boolean));
    const urgent = type === "error";
    this.node.setAttribute("role", urgent ? "alert" : "status");
    const destination = this.container.querySelector(
      urgent ? ".is-urgent" : ".tuc-toasts__live:not(.is-urgent)"
    );
    if (destination !== this.region) {
      destination.append(this.node);
      this.region = destination;
    }
    clearTimeout(this.timer);
    if (this.opts.duration) this._startClock();
    arrange(this.container);
    return this;
  }
  _build() {
    const urgent = this.opts.type === "error";
    this.node = el("div", {
      class: `tuc-toast is-${this.opts.type}`,
      // role no proprio toast ajuda quem chega nele navegando.
      role: urgent ? "alert" : "status",
      id: this.id
    }, this._content());
    this.node._tucano = this;
    this.node.dataset.seq = String(++seq);
    const target = container(this.opts.position);
    this.container = target;
    const region = target.querySelector(urgent ? ".is-urgent" : ".tuc-toasts__live:not(.is-urgent)");
    region.append(this.node);
    this.region = region;
    this._capStack(target);
    arrange(target);
    if (this.opts.duration) {
      this._startClock();
      this._cleanups.push(
        on(this.node, "mouseenter", () => this._pause()),
        on(this.node, "mouseleave", () => this._resume()),
        on(this.node, "focusin", () => this._pause()),
        on(this.node, "focusout", () => this._resume())
      );
    }
    openWithTransition(this.node);
  }
  /**
   * Fecha os mais antigos que passarem do limite.
   *
   * A instancia fica no proprio no: sem isso nao ha como chamar close() a
   * partir do elemento, e o limite nao acontece.
   */
  _capStack(container2) {
    const openOnes = [...container2.querySelectorAll(".tuc-toast:not(.is-closing)")].sort((a, b) => +a.dataset.seq - +b.dataset.seq);
    const overflow = openOnes.length - this.opts.max;
    for (let i = 0; i < overflow; i++) openOnes[i]._tucano?.close();
  }
  _startClock() {
    this.remaining = this.opts.duration;
    this.start = Date.now();
    this.timer = setTimeout(() => this.close(), this.remaining);
  }
  _pause() {
    if (!this.timer) return;
    clearTimeout(this.timer);
    this.timer = null;
    this.remaining -= Date.now() - this.start;
  }
  _resume() {
    if (this.timer || !this.opts.duration) return;
    this.start = Date.now();
    this.timer = setTimeout(() => this.close(), Math.max(this.remaining, 0));
  }
  close() {
    if (this._closing) return;
    this._closing = true;
    clearTimeout(this.timer);
    this._cleanups.forEach((fn) => fn());
    this.node.classList.remove("is-open");
    this.node.classList.add("is-closing");
    arrange(this.container);
    const remove = () => {
      if (this._removed) return;
      this._removed = true;
      this.node.remove();
      arrange(this.container);
      this.node.dispatchEvent(new CustomEvent("tucano:toast-closed"));
    };
    this.node.addEventListener("transitionend", (e) => {
      if (e.propertyName === "opacity") remove();
    });
    setTimeout(remove, 500);
  }
};
function toast(optionsOrText, extra = {}) {
  const base = typeof optionsOrText === "string" ? { text: optionsOrText } : optionsOrText;
  return new Toast({ ...base, ...extra });
}
for (const type of ["info", "success", "warning", "error", "loading"]) {
  toast[type] = (text, extra = {}) => toast({ type, text, ...extra });
}
toast.promise = (promise, msgs = {}) => {
  const { loading, success, error, ...rest } = msgs;
  const t = toast.loading(loading ?? TOAST_TEXTS.loading, rest);
  const render = (v, data, fallback) => {
    const r = typeof v === "function" ? v(data) : v;
    return r ?? fallback;
  };
  Promise.resolve(promise).then(
    (data) => t.update({ type: "success", text: render(success, data, TOAST_TEXTS.success) }),
    (failure) => t.update({ type: "error", text: render(error, failure, TOAST_TEXTS.error) })
  );
  return promise;
};
var DJANGO_MAP = { debug: "info" };
function autoInit6(scope = document) {
  const out = [];
  for (const node of scope.querySelectorAll("[data-tuc-toast]:not([data-tuc-ready])")) {
    node.setAttribute("data-tuc-ready", "");
    const d = node.dataset;
    const words = (d.type || "info").trim().split(/\s+/).map((w) => DJANGO_MAP[w] ?? w);
    const type = words.find((w) => w in DURATION) ?? words[0];
    out.push(toast({
      type,
      title: d.title || void 0,
      text: (d.text ?? node.textContent).trim(),
      duration: d.duration === "false" ? null : d.duration ? +d.duration : void 0,
      position: d.position || void 0
    }));
    node.remove();
  }
  return out;
}
function listenForEvents() {
  if (typeof document === "undefined" || document.__tucToastListening) return;
  document.__tucToastListening = true;
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
  className: ""
  // classe extra no balao, para variar a cor num caso so
};
var isOpen = null;
var Tooltip = class {
  constructor(target, options = {}) {
    const node = typeof target === "string" ? document.querySelector(target) : target;
    if (!node) throw new Error("[Tooltip] elemento alvo nao encontrado");
    this.opts = { ...DEFAULTS7, ...omitUndefined(options) };
    this.anchor = node;
    this.id = nextId("tip");
    this._cleanups = [];
    if (!this.opts.text && node.title) {
      this.opts.text = node.title;
      node.removeAttribute("title");
    }
    if (!this.opts.text) throw new Error("[Tooltip] informe o texto");
    this.panel = el("div", {
      class: `tuc-tip${this.opts.className ? ` ${this.opts.className}` : ""}`,
      role: "tooltip",
      id: this.id,
      style: `max-width:${this.opts.maxWidth}`
    }, [
      el("span", { class: "tuc-tip__text", text: this.opts.text }),
      // aria-hidden: a seta e desenho, e o leitor de tela ja recebe o texto.
      el("span", { class: "tuc-tip__arrow", "data-tuc-arrow": "", "aria-hidden": "true" })
    ]);
    node.setAttribute("aria-describedby", this.id);
    if (!node.hasAttribute("tabindex") && !FOCUSABLE.test(node.tagName)) node.tabIndex = 0;
    const isTouch = () => matchMedia("(pointer: coarse)").matches;
    this._cleanups.push(
      on(node, "pointerenter", (e) => {
        if (e.pointerType !== "touch") this._schedule(true);
      }),
      on(node, "pointerleave", (e) => {
        if (e.pointerType !== "touch") this._schedule(false);
      }),
      on(node, "focusin", () => this._show()),
      on(node, "focusout", () => this._hide()),
      on(node, "click", () => {
        if (isTouch()) this.isOpen ? this._hide() : this._show();
      })
    );
    node._tucano = this;
  }
  _schedule(show) {
    clearTimeout(this._timer);
    this._timer = setTimeout(
      () => show ? this._show() : this._hide(),
      show ? this.opts.delay : this.opts.delayOut
    );
  }
  _show() {
    if (this.isOpen) return;
    if (isOpen && isOpen !== this) isOpen._hide();
    this.isOpen = true;
    isOpen = this;
    this.popover = new Popover(this.anchor, this.panel, {
      placement: this.opts.placement,
      /*
       * 13 e nao 6 por causa da seta. Ela e um quadrado de 10px girado 45
       * graus: a diagonal da 14,1px, e metade disso — 7,1px — projeta para
       * fora do balao. Com o afastamento antigo a ponta encostava no gatilho,
       * e o que se via era a dica colada nele. 13 menos os 7 da seta deixam
       * uns 6px de respiro, que e o que o balao sozinho tinha antes.
       */
      offset: 13,
      closeIfDetached: true,
      onDismiss: () => this._hide()
    });
    this.popover.show();
  }
  _hide() {
    clearTimeout(this._timer);
    if (!this.isOpen) return;
    this.isOpen = false;
    if (isOpen === this) isOpen = null;
    this.popover?.destroy();
    this.popover = null;
  }
  setText(text) {
    this.opts.text = text;
    this.panel.querySelector(".tuc-tip__text").textContent = text;
  }
  destroy() {
    this._hide();
    this._cleanups.forEach((fn) => fn());
    this._cleanups = [];
    this.anchor.removeAttribute("aria-describedby");
    delete this.anchor._tucano;
  }
};
var FOCUSABLE = /^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/;
function autoInit7(scope = document) {
  const out = [];
  for (const node of scope.querySelectorAll("[data-tuc-tip]:not([data-tuc-ready])")) {
    if (!node.dataset.tucTip && !node.title) continue;
    node.setAttribute("data-tuc-ready", "");
    out.push(new Tooltip(node, {
      text: node.dataset.tucTip || void 0,
      placement: node.dataset.placement || void 0,
      delay: node.dataset.delay ? +node.dataset.delay : void 0,
      className: node.dataset.tipClass || void 0
    }));
  }
  return out;
}

// src/js/core/dialog.js
var EXIT_MS2 = 200;
function reserveScrollbar() {
  if (document.querySelector("dialog.tuc-modal[open], dialog.tuc-drawer[open]")) return;
  const root = document.documentElement;
  const bar = innerWidth - root.clientWidth;
  root.toggleAttribute("data-tuc-gutter", bar > 0);
  if (bar > 0) {
    const own = parseFloat(getComputedStyle(document.body).paddingRight) || 0;
    root.style.setProperty("--tuc-gutter-pad", `${own + bar}px`);
  }
}
var Dialog = class {
  /**
   * Adota um <dialog> ja escrito no template. O no e de quem escreveu o HTML:
   * abrir nao o insere e fechar nao o remove.
   */
  _adopt(node) {
    this._adopted = true;
    this.node = node;
    node._tucano = this;
    return this;
  }
  open() {
    if (this.isOpen) return this;
    this.isOpen = true;
    if (this._exitTimer) {
      clearTimeout(this._exitTimer);
      this._exitTimer = null;
      this.node.classList.remove("is-closing");
    }
    reserveScrollbar();
    if (!this._adopted) document.body.append(this.node);
    if (!this.node.open) this.node.showModal();
    this._wire();
    void this.node.offsetHeight;
    this.node.classList.add("is-open");
    return this;
  }
  close(reason = "api") {
    if (!this.isOpen) return this;
    this.isOpen = false;
    this._cleanups.forEach((fn) => fn());
    this._cleanups = [];
    this.node.classList.remove("is-open");
    this.node.classList.add("is-closing");
    clearTimeout(this._exitTimer);
    this._exitTimer = setTimeout(() => {
      this._exitTimer = null;
      this.node.classList.remove("is-closing");
      if (this.node.open) this.node.close();
      if (!this._adopted) this.node.remove();
      this.opts.onClose?.(reason, this);
    }, EXIT_MS2);
    return this;
  }
  /** Conteudo livre no corpo: um form do Django, uma tabela, o que for. */
  content(node) {
    this.body?.replaceChildren(...(Array.isArray(node) ? node : [node]).filter(Boolean));
    return this;
  }
  _wire() {
    this._cleanups.push(
      // O Escape do <dialog> fecha na hora, sem animacao: interceptamos para
      // fechar pelo nosso caminho, que anima e devolve o motivo.
      on(this.node, "cancel", (e) => {
        e.preventDefault();
        if (this.opts.closable) this.close("escape");
      }),
      on(this.node, "click", (e) => {
        if (this.opts.closeOnBackdrop && e.target === this.node) this.close("backdrop");
      })
    );
  }
};
function buildPanel(prefix, opts, owner, titleId, closeLabel) {
  const { title, text, actions, closable } = opts;
  return el("div", { class: `${prefix}__panel` }, [
    el("div", { class: `${prefix}__top` }, [
      el("div", { class: `${prefix}__header` }, [
        title ? el("h2", { class: `${prefix}__title`, id: titleId, text: title }) : null,
        text ? el("p", { class: `${prefix}__text`, text }) : null
      ]),
      closable ? el("button", {
        type: "button",
        class: `tuc-btn is-ghost is-icon is-sm ${prefix}__close`,
        // O rotulo vem de quem monta: modal e gaveta tem cada um o seu grupo de textos.
        "aria-label": closeLabel,
        onclick: () => owner.close("button")
      }, [icon(ICON_X, 15)]) : null
    ]),
    el("div", { class: `${prefix}__body` }),
    actions?.length ? el("div", { class: `${prefix}__footer` }, actions.map((a) => el("button", {
      type: "button",
      class: `tuc-btn is-${a.variant || "outline"}`,
      text: a.text,
      onclick: () => {
        a.onClick?.(owner);
        if (a.closes !== false) owner.close("action");
      }
    }))) : null
  ]);
}

// src/js/components/modal.js
var DEFAULTS8 = {
  title: null,
  text: "",
  size: "md",
  // sm | md | lg | full
  tone: "default",
  // default | danger | success | warning
  sheet: false,
  // no celular sobe do rodape em vez de surgir no centro
  closable: true,
  // botao X e Escape
  closeOnBackdrop: true,
  actions: null,
  // [{ text, variant, onClick, closes }] — closes:false mantem aberto
  onClose: null,
  className: ""
};
var Modal = class extends Dialog {
  constructor(options = {}) {
    super();
    this.opts = { ...DEFAULTS8, ...omitUndefined(options) };
    this.id = nextId("modal");
    this._cleanups = [];
    this._build();
  }
  _build() {
    const titleId = `${this.id}-title`;
    this.panel = buildPanel("tuc-modal", this.opts, this, titleId, MODAL_TEXTS.close);
    this.node = el("dialog", {
      class: [
        "tuc-modal",
        `is-${this.opts.size}`,
        `is-${this.opts.tone}`,
        this.opts.sheet ? "is-sheet" : "",
        this.opts.className
      ].filter(Boolean).join(" "),
      id: this.id,
      // O titulo nomeia o dialogo; sem titulo o proprio texto serve — e o
      // comentario dizia isso sem que nada fosse posto.
      ...this.opts.title ? { "aria-labelledby": titleId } : this.opts.text ? { "aria-label": this.opts.text } : {}
    }, [this.panel]);
    this.body = this.panel.querySelector(".tuc-modal__body");
    this.node._tucano = this;
  }
};
function modal(optionsOrText, extra = {}) {
  const base = typeof optionsOrText === "string" ? { text: optionsOrText } : optionsOrText;
  return new Modal({ ...base, ...extra }).open();
}
function confirm(options = {}) {
  const { confirm: okLabel = MODAL_TEXTS.confirm, cancel = MODAL_TEXTS.cancel, ...rest } = options;
  const tone = rest.tone ?? "danger";
  return new Promise((resolve) => {
    let decided = false;
    const answer = (v) => {
      decided = true;
      resolve(v);
    };
    new Modal({
      ...rest,
      tone,
      actions: [
        { text: cancel, variant: "outline", onClick: () => answer(false) },
        { text: okLabel, variant: tone === "danger" ? "danger" : "primary", onClick: () => answer(true) }
      ],
      // Fechar pelo X, pelo Escape ou pelo fundo e uma recusa, nao um limbo:
      // sem isto a promessa ficaria pendente para sempre.
      onClose: (reason, m) => {
        if (!decided) resolve(false);
        rest.onClose?.(reason, m);
      }
    }).open();
  });
}
function autoInit8(scope = document) {
  const out = [];
  for (const node of scope.querySelectorAll("dialog.tuc-modal:not([data-tuc-ready])")) {
    node.setAttribute("data-tuc-ready", "");
    const d = node.dataset;
    const m = Object.create(Modal.prototype);
    m.opts = { ...DEFAULTS8, closable: d.closable !== "false", closeOnBackdrop: d.backdrop !== "false" };
    m.id = node.id || nextId("modal");
    m._cleanups = [];
    m.panel = node.querySelector(".tuc-modal__panel");
    m.body = node.querySelector(".tuc-modal__body");
    m._adopt(node);
    for (const b of node.querySelectorAll("[data-tuc-modal-close]")) {
      b.addEventListener("click", () => m.close("button"));
    }
    out.push(m);
  }
  for (const trigger of scope.querySelectorAll("[data-tuc-modal]:not([data-tuc-ready])")) {
    trigger.setAttribute("data-tuc-ready", "");
    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelector(trigger.dataset.tucModal)?._tucano?.open();
    });
  }
  return out;
}

// src/js/components/drawer.js
var DEFAULTS9 = {
  title: null,
  text: "",
  side: "right",
  // left | right | top | bottom
  size: "md",
  // sm | md | lg — nas laterais, largura da coluna
  tone: "default",
  // default | danger | success | warning
  closable: true,
  closeOnBackdrop: true,
  actions: null,
  // [{ text, variant, onClick, closes }] — closes:false mantem aberto
  onClose: null,
  className: ""
};
var Drawer = class extends Dialog {
  constructor(options = {}) {
    super();
    this.opts = { ...DEFAULTS9, ...omitUndefined(options) };
    this.id = nextId("drawer");
    this._cleanups = [];
    this._build();
  }
  _build() {
    const titleId = `${this.id}-title`;
    this.panel = buildPanel("tuc-drawer", this.opts, this, titleId, DRAWER_TEXTS.close);
    this.node = el("dialog", {
      class: [
        "tuc-drawer",
        `is-${this.opts.side}`,
        `is-${this.opts.size}`,
        `is-${this.opts.tone}`,
        this.opts.className
      ].filter(Boolean).join(" "),
      id: this.id,
      ...this.opts.title ? { "aria-labelledby": titleId } : this.opts.text ? { "aria-label": this.opts.text } : {}
    }, [this.panel]);
    this.body = this.panel.querySelector(".tuc-drawer__body");
    this.node._tucano = this;
  }
};
function drawer(optionsOrText, extra = {}) {
  const base = typeof optionsOrText === "string" ? { text: optionsOrText } : optionsOrText;
  return new Drawer({ ...base, ...extra }).open();
}
function autoInit9(scope = document) {
  const out = [];
  for (const node of scope.querySelectorAll("dialog.tuc-drawer:not([data-tuc-ready])")) {
    node.setAttribute("data-tuc-ready", "");
    const d = node.dataset;
    const g = Object.create(Drawer.prototype);
    g.opts = { ...DEFAULTS9, closable: d.closable !== "false", closeOnBackdrop: d.backdrop !== "false" };
    g.id = node.id || nextId("drawer");
    g._cleanups = [];
    g.panel = node.querySelector(".tuc-drawer__panel");
    g.body = node.querySelector(".tuc-drawer__body");
    g._adopt(node);
    for (const b of node.querySelectorAll("[data-tuc-drawer-close]")) {
      b.addEventListener("click", () => g.close("button"));
    }
    out.push(g);
  }
  for (const trigger of scope.querySelectorAll("[data-tuc-drawer]:not([data-tuc-ready])")) {
    trigger.setAttribute("data-tuc-ready", "");
    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelector(trigger.dataset.tucDrawer)?._tucano?.open();
    });
  }
  return out;
}

// src/js/components/accordion.js
var DEFAULTS10 = {
  single: false
  // abrir um recolhe os outros
};
var SAFETY_MS = 500;
var Accordion = class {
  constructor(target, options = {}) {
    this.node = typeof target === "string" ? document.querySelector(target) : target;
    if (!this.node) throw new Error("[Accordion] elemento n\xE3o encontrado");
    this.opts = { ...DEFAULTS10, ...omitUndefined(options) };
    this._cleanups = [];
    this._build();
  }
  get items() {
    return [...this.node.querySelectorAll(":scope > details")];
  }
  _build() {
    this.node.classList.add("tuc-accordion");
    this.node._tucano = this;
    for (const item of this.items) {
      item.classList.add("tuc-accordion__item");
      const trigger = item.querySelector(":scope > summary");
      if (!trigger) continue;
      trigger.classList.add("tuc-accordion__trigger");
      if (!trigger.querySelector(".tuc-accordion__arrow")) {
        trigger.append(el(
          "span",
          { class: "tuc-accordion__arrow", "aria-hidden": "true" },
          [icon(ICON_CHEVRON_DOWN, 16)]
        ));
      }
      if (!item.querySelector(":scope > .tuc-accordion__body")) {
        const rest = [...item.childNodes].filter((n) => n !== trigger);
        const content = el("div", { class: "tuc-accordion__content" });
        content.append(...rest);
        item.append(el("div", { class: "tuc-accordion__body" }, [content]));
      }
      this._cleanups.push(on(trigger, "click", (e) => this._toggle(e, item)));
    }
    this._warmUp();
  }
  /*
   * Adianta o primeiro layout do conteudo.
   *
   * Enquanto o <details> esta fechado o navegador nao renderiza os filhos, e a
   * primeira abertura carrega junto o calculo de estilo, o layout e a pintura
   * de uma subarvore inedita — e e por isso que so a primeira engasga. Aqui o
   * item e aberto e fechado no mesmo bloco sincrono: nada chega a pintar,
   * porque o quadro so e desenhado quando a pilha termina, mas o navegador e
   * obrigado a medir pelo offsetHeight no meio.
   */
  _warmUp() {
    for (const item of this.items) {
      if (item.open) continue;
      item.open = true;
      void item.querySelector(":scope > .tuc-accordion__body")?.offsetHeight;
      item.open = false;
    }
  }
  _toggle(e, item) {
    e.preventDefault();
    if (item.open) this.close(item);
    else this.open(item);
  }
  open(item) {
    item._tucTeardown?.();
    if (item.open) return this;
    if (this.opts.single) {
      for (const other of this.items) if (other !== item && other.open) this.close(other);
    }
    item.open = true;
    return this;
  }
  close(item) {
    if (!item.open || item.classList.contains("is-closing")) return this;
    const body = item.querySelector(":scope > .tuc-accordion__body");
    item.classList.add("is-closing");
    const teardown = () => {
      clearTimeout(item._tucExit);
      body?.removeEventListener("transitionend", onDone);
      item._tucTeardown = null;
      item.classList.remove("is-closing");
      item.open = false;
    };
    const onDone = (e) => {
      if (e.target === body && e.propertyName === "grid-template-rows") teardown();
    };
    item._tucTeardown = teardown;
    body?.addEventListener("transitionend", onDone);
    item._tucExit = setTimeout(teardown, SAFETY_MS);
    return this;
  }
  destroy() {
    this._cleanups.forEach((fn) => fn());
    this._cleanups = [];
  }
};
function autoInit10(scope = document) {
  const out = [];
  for (const node of scope.querySelectorAll("[data-tuc-accordion]:not([data-tuc-ready])")) {
    node.setAttribute("data-tuc-ready", "");
    out.push(new Accordion(node, { single: node.dataset.single === "true" }));
  }
  return out;
}

// src/js/components/tabs.js
var DEFAULTS11 = {
  selected: null,
  // indice da aba inicial; sem ele vale a marcada com aria-selected="true", ou a primeira
  manual: false,
  // setas so movem o foco, e Enter ou Espaco trocam o painel — para painel que carrega por HTMX
  onChange: null
  // (index, detail) a cada troca feita pela pessoa ou por select()
};
var FOCUSABLE2 = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"]), [contenteditable]';
var Tabs = class {
  constructor(target, options = {}) {
    this.node = typeof target === "string" ? document.querySelector(target) : target;
    if (!this.node) throw new Error("[Tabs] elemento n\xE3o encontrado");
    this.list = this.node.querySelector(":scope > .tuc-tabs__list");
    if (!this.list) throw new Error("[Tabs] faltou o .tuc-tabs__list");
    this.opts = { ...DEFAULTS11, ...omitUndefined(options) };
    this._cleanups = [];
    this._build();
  }
  /* `:scope >` porque aba dentro de painel e de outro conjunto de abas. */
  get tabs() {
    return [...this.list.querySelectorAll(":scope > .tuc-tabs__tab")];
  }
  get panels() {
    return [...this.node.querySelectorAll(":scope > .tuc-tabs__panel")];
  }
  /** Indice da aba aberta, ou -1. */
  get index() {
    return this.tabs.findIndex((t) => t.getAttribute("aria-selected") === "true");
  }
  _build() {
    this.node.classList.add("tuc-tabs");
    this.node._tucano = this;
    this.list.setAttribute("role", "tablist");
    const base = this.node.id || nextId("tuc-tabs");
    const panels = this.panels;
    this.tabs.forEach((tab, i) => {
      if (tab.tagName === "BUTTON" && !tab.hasAttribute("type")) tab.type = "button";
      tab.id ||= `${base}-tab-${i}`;
      tab.setAttribute("role", "tab");
      const panel = panels[i];
      if (!panel) return;
      panel.id ||= `${base}-panel-${i}`;
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", tab.id);
      tab.setAttribute("aria-controls", panel.id);
      if (!panel.hasAttribute("tabindex") && !panel.querySelector(FOCUSABLE2)) panel.tabIndex = 0;
    });
    this._cleanups.push(
      on(this.list, "click", (e) => {
        const tab = e.target.closest(".tuc-tabs__tab");
        if (tab && this._enabled(tab)) this.select(this.tabs.indexOf(tab));
      }),
      on(this.list, "keydown", (e) => this._onKey(e))
    );
    const marked = this.index;
    const first = this.tabs.findIndex((t) => this._enabled(t));
    this.select(this.opts.selected ?? (marked >= 0 ? marked : Math.max(first, 0)), { silent: true });
  }
  _enabled(tab) {
    return !tab.disabled && tab.getAttribute("aria-disabled") !== "true";
  }
  select(index, { silent = false } = {}) {
    const tabs = this.tabs;
    const tab = tabs[index];
    if (!tab || !this._enabled(tab)) return this;
    const before = this.index;
    tabs.forEach((t, i) => {
      t.setAttribute("aria-selected", String(i === index));
      t.tabIndex = i === index ? 0 : -1;
    });
    this.panels.forEach((p, i) => {
      p.hidden = i !== index;
    });
    if (!silent && before !== index) this._emit();
    return this;
  }
  _onKey(e) {
    const usable = this.tabs.filter((t) => this._enabled(t));
    const current = usable.indexOf(document.activeElement);
    if (current < 0) return;
    let next = null;
    if (e.key === "ArrowRight") next = (current + 1) % usable.length;
    else if (e.key === "ArrowLeft") next = (current - 1 + usable.length) % usable.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = usable.length - 1;
    if (next === null) return;
    e.preventDefault();
    const target = usable[next];
    target.focus();
    target.scrollIntoView({ block: "nearest", inline: "nearest" });
    if (!this.opts.manual) this.select(this.tabs.indexOf(target));
  }
  _emit() {
    const value = this.index;
    const detail = { value, tab: this.tabs[value], panel: this.panels[value], instance: this };
    this.opts.onChange?.(value, detail);
    this.node.dispatchEvent(new CustomEvent("tucano:change", { detail, bubbles: true }));
  }
  destroy() {
    this._cleanups.forEach((fn) => fn());
    this._cleanups = [];
    delete this.node._tucano;
  }
};
function autoInit11(scope = document) {
  const out = [];
  for (const node of scope.querySelectorAll("[data-tuc-tabs]:not([data-tuc-ready])")) {
    node.setAttribute("data-tuc-ready", "");
    out.push(new Tabs(node, { manual: node.dataset.manual === "true" }));
  }
  return out;
}

// src/js/components/dropdown.js
var DEFAULTS12 = {
  placement: "bottom-start",
  items: null,
  // [{ text, icon, shortcut, onClick, href, variant, disabled, separator, label }]
  // separator: true vira uma linha; label sozinho vira titulo de grupo
  // ou { separator: true } / { label: 'Seção' }
  closeOnPick: true
};
var FOCUSABLE3 = '.tuc-dropdown__item:not([disabled]):not([aria-disabled="true"])';
var Dropdown = class {
  constructor(trigger, options = {}) {
    this.trigger = typeof trigger === "string" ? document.querySelector(trigger) : trigger;
    if (!this.trigger) throw new Error("[Dropdown] gatilho n\xE3o encontrado");
    this.opts = { ...DEFAULTS12, ...omitUndefined(options) };
    this._cleanups = [];
    this._build();
  }
  _build() {
    this.panel = this.opts.panel ?? el("div", {}, (this.opts.items ?? []).map((i) => this._item(i)));
    this.panel.classList.add("tuc-dropdown");
    this.panel.setAttribute("role", "menu");
    for (const item of this.panel.querySelectorAll(".tuc-dropdown__item")) {
      item.setAttribute("role", "menuitem");
      item.setAttribute("tabindex", "-1");
    }
    this.trigger.setAttribute("aria-haspopup", "menu");
    this.trigger.setAttribute("aria-expanded", "false");
    this._cleanups.push(
      on(this.trigger, "click", (e) => {
        e.preventDefault();
        this.toggle();
      }),
      on(this.trigger, "keydown", (e) => {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          this.open();
          this._move(e.key === "ArrowUp" ? -1 : 0, true);
        }
      }),
      on(this.panel, "keydown", (e) => this._onKey(e)),
      on(this.panel, "click", (e) => {
        const item = e.target.closest(".tuc-dropdown__item");
        if (!item || item.hasAttribute("aria-disabled")) return;
        if (this.opts.closeOnPick) this.close();
      })
    );
    this.trigger._tucano = this;
    this.panel._tucano = this;
  }
  _item(data) {
    if (data.separator) return el("hr", { class: "tuc-dropdown__separator", role: "separator" });
    if (data.label) return el("div", { class: "tuc-dropdown__label", text: data.label });
    const tag = data.href ? "a" : "button";
    const children = [];
    if (data.icon) children.push(el("span", { class: "tuc-dropdown__icon", "aria-hidden": "true" }, [icon(data.icon, 15)]));
    children.push(el("span", { class: "tuc-dropdown__text", text: data.text ?? "" }));
    if (data.shortcut) children.push(el("span", { class: "tuc-dropdown__shortcut", text: data.shortcut }));
    return el(tag, {
      class: `tuc-dropdown__item${data.variant ? ` is-${data.variant}` : ""}`,
      href: data.href,
      type: data.href ? null : "button",
      "aria-disabled": data.disabled && "true",
      onclick: !data.disabled && (() => data.onClick?.(this))
    }, children);
  }
  get items() {
    return [...this.panel.querySelectorAll(FOCUSABLE3)];
  }
  _move(step, absolute = false) {
    const items = this.items;
    if (!items.length) return;
    const current = items.indexOf(document.activeElement);
    let i;
    if (absolute) i = step < 0 ? items.length - 1 : 0;
    else i = (current + step + items.length) % items.length;
    items[i]?.focus();
  }
  _onKey(e) {
    const keys = {
      ArrowDown: () => this._move(1),
      ArrowUp: () => this._move(-1),
      Home: () => this._move(0, true),
      End: () => this._move(-1, true),
      // Escape nao entra: com o menu aberto quem o trata e o Popover.
      Tab: () => this.close()
    };
    const action = keys[e.key];
    if (!action) return;
    if (e.key !== "Tab") e.preventDefault();
    action();
  }
  open() {
    if (this.isOpen) return this;
    this.isOpen = true;
    this.trigger.setAttribute("aria-expanded", "true");
    this.popover = new Popover(this.trigger, this.panel, {
      placement: this.opts.placement,
      offset: 6,
      closeIfDetached: true,
      closeOnFocusOut: true,
      onDismiss: () => this.close()
    });
    this.popover.show();
    this._move(0, true);
    return this;
  }
  close() {
    if (!this.isOpen) return this;
    this.isOpen = false;
    this.trigger.setAttribute("aria-expanded", "false");
    this.popover?.destroy();
    this.popover = null;
    if (this.panel.contains(document.activeElement)) {
      this.trigger.focus({ preventScroll: true });
    }
    return this;
  }
  toggle() {
    return this.isOpen ? this.close() : this.open();
  }
  destroy() {
    this.close();
    this._cleanups.forEach((fn) => fn());
    this._cleanups = [];
  }
};
function autoInit12(scope = document) {
  const out = [];
  for (const trigger of scope.querySelectorAll("[data-tuc-dropdown]:not([data-tuc-ready])")) {
    trigger.setAttribute("data-tuc-ready", "");
    const panel = document.querySelector(trigger.dataset.tucDropdown);
    if (!panel) continue;
    panel.hidden = false;
    panel.remove();
    out.push(new Dropdown(trigger, {
      panel,
      placement: trigger.dataset.placement || void 0
    }));
  }
  return out;
}

// src/js/components/table.js
var DEFAULTS13 = {
  sortable: true,
  sortMode: "server",
  // server | client
  sortParam: "sort",
  dirParam: "dir",
  selectable: false,
  // coluna de selecao em massa
  selectName: "selected",
  onSort: null,
  // definido, intercepta o clique e cancela a navegacao
  onSelect: null
};
var toNumber = (s) => parseFloat(s.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".") || 0);
var COMPARE = {
  number: (a, b) => toNumber(a) - toNumber(b),
  date: (a, b) => new Date(a).getTime() - new Date(b).getTime(),
  text: (a, b) => a.localeCompare(b, "pt-BR", { numeric: true, sensitivity: "base" })
};
var Table = class {
  constructor(node, options = {}) {
    this.node = typeof node === "string" ? document.querySelector(node) : node;
    if (!this.node) throw new Error("[Table] elemento alvo nao encontrado");
    if (this.node.tagName !== "TABLE") throw new Error("[Table] o alvo precisa ser uma <table>");
    this.opts = { ...DEFAULTS13, ...omitUndefined(options) };
    this._cleanups = [];
    this._build();
  }
  get rows() {
    return [...this.node.tBodies[0]?.rows ?? []];
  }
  _build() {
    this.node.classList.add("tuc-table");
    if (!this.node.parentElement?.classList.contains("tuc-table-wrap")) {
      const wrap = el("div", { class: "tuc-table-wrap" });
      this.node.replaceWith(wrap);
      wrap.append(this.node);
    }
    this.wrap = this.node.parentElement;
    this.node._tucano = this;
    if (this.opts.selectable) this._buildSelection();
    if (this.opts.sortable) this._buildSort();
  }
  /* ---------------------------------------------------------------- *
   * Ordenacao                                                        *
   * ---------------------------------------------------------------- */
  _buildSort() {
    const head = this.node.tHead?.rows[0];
    if (!head) return;
    this.sortable = [];
    const onServer = this.opts.sortMode !== "client";
    const current = new URLSearchParams(location.search);
    const currentField = current.get(this.opts.sortParam);
    const currentDir = current.get(this.opts.dirParam) === "desc" ? "descending" : "ascending";
    [...head.cells].forEach((th, i) => {
      const type = th.dataset.sort;
      if (!type || type === "none") return;
      const field = th.dataset.field || String(i);
      th.classList.add("tuc-table__sortable");
      const marked = onServer && currentField === field;
      th.setAttribute("aria-sort", marked ? currentDir : "none");
      const next = marked && currentDir === "ascending" ? "desc" : "asc";
      const children = [
        el("span", { text: th.textContent.trim() }),
        el("span", { class: "tuc-table__sorticon", "aria-hidden": "true" }, [icon(ICON_CHEVRONS_UP_DOWN, 13)])
      ];
      const trigger = onServer ? el("a", { class: "tuc-table__sortbtn", href: this._sortHref(field, next) }, children) : el("button", { type: "button", class: "tuc-table__sortbtn" }, children);
      th.textContent = "";
      th.append(trigger);
      this.sortable.push({ th, index: i, type, field });
      this._cleanups.push(on(trigger, "click", (e) => this._onSortClick(e, th, i, type, field)));
    });
  }
  /** Mesma URL, com a ordem trocada e o resto da query string intacto. */
  _sortHref(field, direction) {
    const url = new URL(location.href);
    url.searchParams.set(this.opts.sortParam, field);
    url.searchParams.set(this.opts.dirParam, direction);
    url.searchParams.delete("page");
    return `${url.pathname}${url.search}${url.hash}`;
  }
  _onSortClick(e, th, index, type, field) {
    const onServer = this.opts.sortMode !== "client";
    const previous = th.getAttribute("aria-sort");
    const dir = previous === "ascending" ? "descending" : "ascending";
    const detail = { column: index, field, direction: dir === "ascending" ? "asc" : "desc" };
    this.node.dispatchEvent(new CustomEvent("tucano:sort", { bubbles: true, detail }));
    if (this.opts.onSort) {
      e.preventDefault();
      this.opts.onSort(detail, this);
      return;
    }
    if (onServer) return;
    e.preventDefault();
    for (const s of this.sortable) s.th.setAttribute("aria-sort", "none");
    th.setAttribute("aria-sort", dir);
    this.sort(index, detail.direction, type);
  }
  /** Ordena as linhas visíveis. `type`: text | number | date. */
  sort(index, direction = "asc", type = "text") {
    const body = this.node.tBodies[0];
    if (!body) return this;
    const cmp = COMPARE[type] ?? COMPARE.text;
    const key = (tr) => {
      const cell = tr.cells[index];
      return cell?.dataset.sortValue ?? cell?.textContent.trim() ?? "";
    };
    const sign = direction === "desc" ? -1 : 1;
    const sorted = this.rows.sort((a, b) => sign * cmp(key(a), key(b)));
    for (const tr of sorted) body.append(tr);
    return this;
  }
  /* ---------------------------------------------------------------- *
   * Selecao em massa                                                 *
   * ---------------------------------------------------------------- */
  _buildSelection() {
    const head = this.node.tHead?.rows[0];
    if (!head) return;
    this.checkAll = el("input", {
      type: "checkbox",
      class: "tuc-check tuc-table__check",
      "aria-label": TABLE_TEXTS.selectAll
    });
    const th = el("th", { class: "tuc-table__pick", scope: "col" }, [this.checkAll]);
    head.prepend(th);
    for (const tr of this.rows) {
      const check = el("input", {
        type: "checkbox",
        class: "tuc-check tuc-table__check",
        name: this.opts.selectName,
        value: tr.dataset.id ?? "",
        "aria-label": TABLE_TEXTS.selectRow
      });
      const td = el("td", { class: "tuc-table__pick" }, [check]);
      tr.prepend(td);
      this._cleanups.push(on(check, "change", () => this._afterPick(tr, check.checked)));
    }
    this._cleanups.push(on(this.checkAll, "change", () => {
      const checked = this.checkAll.checked;
      for (const tr of this.rows) {
        const c = tr.querySelector(".tuc-table__check");
        if (c) {
          c.checked = checked;
          this._afterPick(tr, checked);
        }
      }
    }));
  }
  _afterPick(tr, marked) {
    tr.classList.toggle("is-selected", marked);
    const checkboxes = this.rows.map((r) => r.querySelector(".tuc-table__check")).filter(Boolean);
    const checkedBoxes = checkboxes.filter((c) => c.checked);
    if (this.checkAll) {
      this.checkAll.checked = checkedBoxes.length === checkboxes.length && checkboxes.length > 0;
      this.checkAll.indeterminate = checkedBoxes.length > 0 && checkedBoxes.length < checkboxes.length;
    }
    const detail = { selected: this.getSelected(), row: tr };
    this.node.dispatchEvent(new CustomEvent("tucano:select", { bubbles: true, detail }));
    this.opts.onSelect?.(detail, this);
  }
  /** Valores marcados — os mesmos que o formulário enviaria. */
  getSelected() {
    return this.rows.filter((tr) => tr.querySelector(".tuc-table__check")?.checked).map((tr) => tr.querySelector(".tuc-table__check").value);
  }
  clearSelection() {
    for (const tr of this.rows) {
      const c = tr.querySelector(".tuc-table__check");
      if (c) {
        c.checked = false;
        tr.classList.remove("is-selected");
      }
    }
    if (this.checkAll) {
      this.checkAll.checked = false;
      this.checkAll.indeterminate = false;
    }
    return this;
  }
  destroy() {
    this._cleanups.forEach((fn) => fn());
    this._cleanups = [];
  }
};
function autoInit13(scope = document) {
  const out = [];
  for (const node of scope.querySelectorAll("table[data-tuc-table]:not([data-tuc-ready])")) {
    node.setAttribute("data-tuc-ready", "");
    const d = node.dataset;
    out.push(new Table(node, {
      sortable: d.sortable !== "false",
      sortMode: d.sortMode || void 0,
      sortParam: d.sortParam || void 0,
      dirParam: d.dirParam || void 0,
      selectable: d.selectable !== void 0 && d.selectable !== "false",
      selectName: d.selectName || void 0
    }));
  }
  return out;
}

// src/js/components/pagination.js
var DEFAULTS14 = {
  page: 1,
  pages: 1,
  param: "page",
  around: 1,
  // paginas visiveis de cada lado da atual
  edges: 1,
  // paginas visiveis nas pontas
  prevText: void 0,
  // default: setTexts ("Anterior")
  nextText: void 0,
  // default: setTexts ("Próxima")
  label: void 0,
  // default: setTexts ("Paginação")
  onChange: null
};
function pageWindow(page, pages, { around = 1, edges = 1 } = {}) {
  const visible = /* @__PURE__ */ new Set();
  for (let i = 1; i <= Math.min(edges, pages); i++) visible.add(i);
  for (let i = Math.max(1, pages - edges + 1); i <= pages; i++) visible.add(i);
  for (let i = page - around; i <= page + around; i++) if (i >= 1 && i <= pages) visible.add(i);
  const sorted = [...visible].sort((a, b) => a - b);
  const out = [];
  let previous = 0;
  for (const n of sorted) {
    if (n - previous === 2) out.push(previous + 1);
    else if (n - previous > 2) out.push(null);
    out.push(n);
    previous = n;
  }
  return out;
}
var Pagination = class {
  constructor(options = {}) {
    this.opts = { ...DEFAULTS14, ...PAGINATION_TEXTS, ...omitUndefined(options) };
    this._cleanups = [];
    this.node = el("nav", { class: "tuc-pagination", role: "navigation", "aria-label": this.opts.label });
    this.node._tucano = this;
    this.render();
  }
  /** Monta o href preservando o resto da query string — filtros, busca, ordem. */
  href(page) {
    const url = new URL(location.href);
    url.searchParams.set(this.opts.param, String(page));
    return `${url.pathname}${url.search}${url.hash}`;
  }
  _item(page, { text, current = false, disabled = false, edge = false, label } = {}) {
    const className = [
      "tuc-btn",
      current ? "is-outline" : "is-ghost",
      edge ? "tuc-pagination__edge" : "",
      disabled ? "is-disabled" : ""
    ].filter(Boolean).join(" ");
    const children = typeof text === "string" ? [text] : text;
    if (disabled) return el("span", { class: className, "aria-hidden": "true", "aria-disabled": "true" }, children);
    const a = el("a", {
      class: className,
      href: this.href(page),
      ...current ? { "aria-current": "page" } : {},
      // Abaixo de 40rem a palavra some e o icone e aria-hidden: sem isto a ponta
      // ficava um link sem nome para o leitor de tela.
      ...label ? { "aria-label": label } : {}
    }, children);
    this._cleanups.push(on(a, "click", (e) => {
      if (!this.opts.onChange) return;
      e.preventDefault();
      this.opts.onChange(page, this);
    }));
    return a;
  }
  render() {
    this._cleanups.forEach((fn) => fn());
    this._cleanups = [];
    this.node.textContent = "";
    const { page, pages } = this.opts;
    if (pages <= 1) return this;
    this.node.append(this._item(page - 1, {
      // O svg direto no botao, sem span em volta: e assim que o .tuc-btn o dimensiona.
      text: [
        icon(ICON_CHEVRON_LEFT, 15),
        el("span", { class: "tuc-pagination__word", text: this.opts.prevText })
      ],
      disabled: page <= 1,
      edge: true,
      label: this.opts.prevText
    }));
    for (const n of pageWindow(page, pages, this.opts)) {
      if (n === null) {
        this.node.append(el("span", { class: "tuc-pagination__gap", "aria-hidden": "true", text: "\u2026" }));
        continue;
      }
      this.node.append(this._item(n, { text: String(n), current: n === page }));
    }
    this.node.append(this._item(page + 1, {
      text: [
        el("span", { class: "tuc-pagination__word", text: this.opts.nextText }),
        icon(ICON_CHEVRON_RIGHT, 15)
      ],
      disabled: page >= pages,
      edge: true,
      label: this.opts.nextText
    }));
    return this;
  }
  /** Troca a página mostrada como atual — para quem navega sem recarregar. */
  setPage(page) {
    this.opts.page = Math.min(Math.max(1, page), this.opts.pages);
    const hadFocus = this.node.contains(document.activeElement);
    this.render();
    if (hadFocus) this.node.querySelector('[aria-current="page"]')?.focus();
    return this;
  }
  destroy() {
    this._cleanups.forEach((fn) => fn());
    this._cleanups = [];
    this.node.remove();
  }
};
function pagination(options = {}) {
  return new Pagination(options).node;
}
function autoInit14(scope = document) {
  const out = [];
  for (const node of scope.querySelectorAll("[data-tuc-pagination]:not([data-tuc-ready])")) {
    node.setAttribute("data-tuc-ready", "");
    const d = node.dataset;
    const p = new Pagination({
      page: parseInt(d.page, 10) || 1,
      pages: parseInt(d.pages, 10) || 1,
      param: d.param || void 0,
      around: d.around ? parseInt(d.around, 10) : void 0,
      edges: d.edges ? parseInt(d.edges, 10) : void 0,
      prevText: d.prevText || void 0,
      nextText: d.nextText || void 0
    });
    node.textContent = "";
    node.append(p.node);
    node._tucano = p;
    out.push(p);
  }
  return out;
}

// src/js/core/sanitize.js
var ALLOWED = /* @__PURE__ */ new Set([
  "P",
  "BR",
  "STRONG",
  "B",
  "EM",
  "I",
  "U",
  "S",
  "H2",
  "H3",
  "UL",
  "OL",
  "LI",
  "BLOCKQUOTE",
  "CODE",
  "PRE",
  "A",
  "TABLE",
  "THEAD",
  "TBODY",
  "TR",
  "TH",
  "TD"
]);
var TRANSPARENT = /* @__PURE__ */ new Set(["DIV", "SPAN", "FONT", "SECTION", "ARTICLE", "MAIN"]);
var BLOCKS = "p, h2, h3, ul, ol, blockquote, pre, table";
var EQUIVALENTS = { B: "STRONG", I: "EM" };
var ALIGNMENTS = /* @__PURE__ */ new Set(["left", "center", "right", "justify"]);
var ALIGNABLE = /* @__PURE__ */ new Set(["P", "H2", "H3", "LI", "BLOCKQUOTE", "TD", "TH"]);
function copyAlignment(source, target) {
  if (!ALIGNABLE.has(target.tagName)) return;
  const value = (source.style?.textAlign || "").toLowerCase();
  if (ALIGNMENTS.has(value)) target.setAttribute("style", `text-align: ${value}`);
}
function safeUrl(url) {
  const plain = (url || "").trim();
  return /^(https?:|mailto:|tel:|#|\/(?![/\\]))/i.test(plain) ? plain : "";
}
function clearNode(node, destination, doc) {
  for (const child of [...node.childNodes]) {
    if (child.nodeType === Node.TEXT_NODE) {
      destination.append(doc.createTextNode(child.nodeValue));
      continue;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) continue;
    const tag = child.tagName;
    if (tag === "SCRIPT" || tag === "STYLE" || tag === "IFRAME" || tag === "OBJECT") continue;
    if (tag === "P" && !child.firstChild) continue;
    if (TRANSPARENT.has(tag) || !ALLOWED.has(tag) || tag === "P" && child.querySelector(BLOCKS)) {
      clearNode(child, destination, doc);
      continue;
    }
    const fresh = doc.createElement(EQUIVALENTS[tag] || tag);
    copyAlignment(child, fresh);
    if (fresh.tagName === "A") {
      const href = safeUrl(child.getAttribute("href"));
      if (!href) {
        clearNode(child, destination, doc);
        continue;
      }
      fresh.setAttribute("href", href);
      fresh.setAttribute("target", "_blank");
      fresh.setAttribute("rel", "noopener noreferrer");
    }
    clearNode(child, fresh, doc);
    destination.append(fresh);
  }
}
function sanitize(html) {
  const doc = document.implementation.createHTMLDocument("");
  const input = doc.createElement("div");
  input.innerHTML = String(html ?? "");
  const exit = doc.createElement("div");
  clearNode(input, exit, doc);
  return exit.innerHTML;
}

// src/js/core/highlight.js
var WORDS = [
  // fluxo, comum a quase tudo
  "if",
  "else",
  "elif",
  "for",
  "while",
  "return",
  "break",
  "continue",
  "try",
  "catch",
  "except",
  "finally",
  "switch",
  "case",
  "in",
  "is",
  "not",
  "and",
  "or",
  "with",
  "as",
  "from",
  // declaracao
  "const",
  "let",
  "var",
  "function",
  "def",
  "class",
  "import",
  "export",
  "default",
  "async",
  "await",
  "new",
  "this",
  "self",
  "lambda",
  "pass",
  "yield",
  // valores
  "true",
  "false",
  "null",
  "undefined",
  "None",
  "True",
  "False",
  // shell
  "npm",
  "git",
  "cd",
  "echo",
  "sudo",
  "pip",
  "python",
  "node",
  // SQL costuma vir em caixa alta, entao as duas formas entram
  "select",
  "SELECT",
  "FROM",
  "where",
  "WHERE",
  "join",
  "JOIN",
  "insert",
  "INSERT",
  "update",
  "UPDATE",
  "delete",
  "DELETE",
  "values",
  "VALUES",
  "order",
  "ORDER",
  "group",
  "GROUP",
  "limit",
  "LIMIT",
  "having",
  "HAVING",
  // marcadores que aparecem em varias linguagens
  "public",
  "private",
  "static",
  "void",
  "int",
  "float",
  "string",
  "bool",
  "struct",
  "enum",
  "interface",
  "type",
  "end",
  "do",
  "then",
  "fn",
  "func"
].join("|");
var RULES = [
  // `//` so abre comentario se nao vier colado a `:` ou a uma letra: em
  // https://… ele pintava o resto da linha como comentario. E `#` so e
  // comentario no comeco da linha ou depois de espaco, seguido de espaco: sem
  // isso toda cor hex de CSS (#4f46e5) saia como comentario.
  ["comment", /(&lt;!--[\s\S]*?--&gt;|\/\*[\s\S]*?\*\/|(?<![:\w])\/\/[^\n]*|(?<![^\s])#(?:\s[^\n]*)?$|(?<![^\s])#\s[^\n]*)/m],
  ["text", /("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`)/],
  ["tmpl", /(\{%[\s\S]*?%\}|\{\{[\s\S]*?\}\})/],
  ["tag", /(&lt;\/?[a-zA-Z][\w-]*)/],
  ["attr", /([a-zA-Z-][\w-]*)(?==)/],
  ["num", /\b(\d+(?:\.\d+)?)\b/],
  /*
   * As palavras entram na mesma expressao, e nao numa segunda passada.
   *
   * Separadas, elas eram procuradas de novo no HTML que a primeira passada
   * acabara de gerar — e `class` esta na lista, entao a palavra era encontrada
   * dentro do atributo `class="tuc-tok-attr"` e envolvida outra vez. O
   * resultado era marcacao aninhada quebrada, que o navegador mostrava como
   * text solto no meio do codigo.
   */
  ["key", new RegExp(`\\b(${WORDS})\\b`)]
];
var COMBINED = new RegExp(RULES.map(([, re]) => re.source).join("|"), "g");
function highlight(code) {
  const text = escapeHtml(code ?? "");
  return text.replace(COMBINED, (whole, ...groups) => {
    const i = groups.findIndex((g) => g !== void 0);
    const className = RULES[i]?.[0];
    return className ? `<span class="tuc-tok-${className}">${whole}</span>` : whole;
  });
}
function autoInit15(scope = document) {
  for (const table of scope.querySelectorAll(".tuc-prose table")) {
    if (table.parentElement.classList.contains("tuc-prose__scroll")) continue;
    const box = el("div", { class: "tuc-prose__scroll" });
    table.before(box);
    box.append(table);
  }
  const blocks = [...scope.querySelectorAll(".tuc-prose pre > code:not([data-tuc-painted])")];
  for (const code of blocks) {
    code.setAttribute("data-tuc-painted", "");
    code.innerHTML = highlight(code.textContent);
    addCopy(code.parentElement);
  }
  return blocks;
}
function addCopy(pre) {
  if (!pre || pre.querySelector(".tuc-copy")) return;
  pre.classList.add("tuc-prose__block");
  const btn = el("button", {
    type: "button",
    class: "tuc-btn is-outline is-icon is-sm tuc-copy",
    "aria-label": PROSE_TEXTS.copy
  }, [icon(ICON_COPY, 14), icon(ICON_CHECK, 14)]);
  btn.children[1].classList.add("tuc-copy__ok");
  on(btn, "click", async () => {
    const text = pre.querySelector("code")?.textContent ?? pre.textContent;
    try {
      await navigator.clipboard.writeText(text.trim());
    } catch {
      const sel = getSelection();
      sel.removeAllRanges();
      const r = document.createRange();
      r.selectNodeContents(pre);
      sel.addRange(r);
      return;
    }
    btn.classList.add("is-copied");
    btn.setAttribute("aria-label", PROSE_TEXTS.copied);
    setTimeout(() => {
      btn.classList.remove("is-copied");
      btn.setAttribute("aria-label", PROSE_TEXTS.copy);
    }, 1600);
  });
  pre.append(btn);
}

// src/js/components/editor.js
var DEFAULTS15 = {
  toolbar: [
    "bold",
    "italic",
    "underline",
    "title",
    "subheading",
    "list",
    "numbered",
    "left",
    "center",
    "right",
    "justify",
    "quote",
    "code",
    "link",
    "table",
    "clear"
  ],
  table: { rows: 3, cols: 3 },
  minHeight: "9rem",
  placeholder: ""
};
var ICONS = {
  bold: "M6 4h6a4 4 0 010 8H6zM6 12h7a4 4 0 010 8H6z",
  italic: "M19 4h-9M14 20H5M15 4L9 20",
  underline: "M6 4v6a6 6 0 0012 0V4M4 21h16",
  title: "M6 4v16M18 4v16M6 12h12",
  subheading: "M6 6v12M16 6v12M6 12h10",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  numbered: "M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1",
  quote: "M6 17h3l2-4V7H5v6h3zM14 17h3l2-4V7h-6v6h3z",
  link: "M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1",
  clear: "M4 7V4h16v3M5 20h6M13 4L8 20M15 15l5 5M20 15l-5 5",
  table: "M3 5h18v14H3zM3 10h18M3 15h18M9 5v14M15 5v14",
  left: "M3 6h18M3 12h11M3 18h15",
  center: "M3 6h18M6 12h12M4 18h16",
  right: "M3 6h18M10 12h11M6 18h15",
  justify: "M3 6h18M3 12h18M3 18h18",
  code: "M16 18l6-6-6-6M8 6l-6 6 6 6"
};
var COMMANDS = {
  bold: () => document.execCommand("bold"),
  italic: () => document.execCommand("italic"),
  underline: () => document.execCommand("underline"),
  title: () => toggleBlock("H2"),
  subheading: () => toggleBlock("H3"),
  list: () => document.execCommand("insertUnorderedList"),
  numbered: () => document.execCommand("insertOrderedList"),
  quote: () => toggleBlock("BLOCKQUOTE"),
  clear: () => document.execCommand("removeFormat"),
  left: () => document.execCommand("justifyLeft"),
  center: () => document.execCommand("justifyCenter"),
  right: () => document.execCommand("justifyRight"),
  justify: () => document.execCommand("justifyFull"),
  code: () => toggleCode(),
  table: (ed) => insertTable(ed),
  link: (ed) => ed._askForLink()
};
var STATES = {
  bold: "bold",
  italic: "italic",
  underline: "underline",
  list: "insertUnorderedList",
  numbered: "insertOrderedList",
  left: "justifyLeft",
  center: "justifyCenter",
  right: "justifyRight",
  justify: "justifyFull",
  title: "h2",
  subheading: "h3",
  quote: "blockquote",
  code: "pre, code",
  link: "a",
  table: "table"
};
var SHORTCUTS = { b: "bold", i: "italic", u: "underline", k: "link" };
function select(range) {
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}
function toggleCode() {
  const sel = window.getSelection();
  if (!sel?.rangeCount) return;
  const start = sel.anchorNode?.nodeType === Node.ELEMENT_NODE ? sel.anchorNode : sel.anchorNode?.parentElement;
  const inside = start?.closest?.("pre, code");
  if (inside) {
    const target = inside.closest("pre") || inside;
    const text2 = target.textContent;
    const r = document.createRange();
    r.setStartBefore(target);
    r.setEndAfter(target);
    select(r);
    if (target.tagName === "PRE") {
      const block = document.createDocumentFragment();
      for (const row of text2.split("\n")) {
        const paragraph = document.createElement("p");
        if (row) paragraph.textContent = row;
        else paragraph.append(document.createElement("br"));
        block.append(paragraph);
      }
      const first = block.firstChild;
      target.replaceWith(block);
      if (first) {
        const pos = document.createRange();
        pos.selectNodeContents(first);
        pos.collapse(true);
        select(pos);
      }
      return;
    }
    document.execCommand("insertText", false, text2);
    return;
  }
  const text = sel.toString();
  if (!text) return;
  const escaped = escapeHtml(text.replace(/\n{2,}/g, "\n"));
  if (/\n/.test(text)) {
    document.execCommand("insertHTML", false, `<pre><code>${escaped}</code></pre><p><br></p>`);
    return;
  }
  document.execCommand("insertHTML", false, `<code>${escaped}</code>`);
}
function toggleBlock(tag) {
  const current = document.queryCommandValue("formatBlock")?.toUpperCase();
  document.execCommand("formatBlock", false, current === tag ? "P" : tag);
}
var SCROLL = "tuc-editor__scroll";
function wrapTables(area) {
  for (const box of area.querySelectorAll(`.${SCROLL}`)) {
    const table = [...box.children].find((n) => n.tagName === "TABLE");
    const extra = [...box.childNodes].filter((n) => n !== table);
    if (extra.length) box.after(...extra);
    if (!table) box.remove();
  }
  for (const table of area.querySelectorAll("table")) {
    if (table.parentElement.classList.contains(SCROLL)) continue;
    const box = document.createElement("div");
    box.className = SCROLL;
    table.before(box);
    box.append(table);
  }
}
function insertTable(ed) {
  const { rows, cols } = ed.opts.table;
  const row = (tag) => `<tr>${`<${tag}><br></${tag}>`.repeat(cols)}</tr>`;
  const inside = ed._currentCell()?.closest("table");
  if (inside) {
    const r = document.createRange();
    r.setStartAfter(inside.closest(`.${SCROLL}`) || inside);
    select(r);
  }
  document.execCommand("insertHTML", false, `<div class="${SCROLL}"><table><thead>${row("th")}</thead><tbody>${row("td").repeat(rows - 1)}</tbody></table></div><p><br></p>`);
  focusCell(ed._currentNode()?.closest("p")?.previousElementSibling?.querySelector("th"));
}
function nextCell(cell, back) {
  const table = cell.closest("table");
  const cells = [...table.querySelectorAll("th, td")];
  return cells[cells.indexOf(cell) + (back ? -1 : 1)] || null;
}
var TABLE = {
  rowAbove: (c) => insertRow(c, 0),
  rowBelow: (c) => insertRow(c, 1),
  colBefore: (c) => insertColumn(c, 0),
  colAfter: (c) => insertColumn(c, 1),
  deleteRow: (c) => deleteRow(c),
  deleteColumn: (c) => deleteColumn(c),
  deleteTable: (c) => c.closest("table")?.remove()
};
var TABLE_ICONS = {
  rowAbove: "M12 3v8M8 7h8M3 15h18M3 20h18",
  rowBelow: "M3 4h18M3 9h18M12 21v-8M8 17h8",
  colBefore: "M3 12h8M7 8v8M15 3v18M20 3v18",
  colAfter: "M4 3v18M9 3v18M21 12h-8M17 8v8",
  deleteRow: "M3 6h18M3 18h18M9 12h6",
  deleteColumn: "M6 3v18M18 3v18M12 9v6",
  deleteTable: "M4 7h16M10 11v6M14 11v6M5 7l1 13a2 2 0 002 2h8a2 2 0 002-2l1-13M9 7V4h6v3"
};
var emptyCell = (tag) => {
  const c = document.createElement(tag);
  c.append(document.createElement("br"));
  return c;
};
function insertRow(cell, after) {
  const row = cell.parentElement;
  const newRow = document.createElement("tr");
  for (let i = 0; i < row.children.length; i++) newRow.append(emptyCell("td"));
  const body = cell.closest("table").querySelector("tbody");
  if (row.parentElement.tagName === "THEAD" && body) {
    body.prepend(newRow);
  } else {
    row.parentElement.insertBefore(newRow, after ? row.nextSibling : row);
  }
  return newRow.firstElementChild;
}
function insertColumn(cell, after) {
  const i = [...cell.parentElement.children].indexOf(cell);
  for (const row of cell.closest("table").querySelectorAll("tr")) {
    const model = row.children[i];
    const newCell = emptyCell(model?.tagName === "TH" ? "th" : "td");
    row.insertBefore(newCell, after ? model?.nextSibling : model);
  }
  return cell.parentElement.children[after ? i + 1 : i];
}
function deleteRow(cell) {
  const row = cell.parentElement;
  const table = cell.closest("table");
  if (table.querySelectorAll("tr").length <= 1) {
    table.remove();
    return null;
  }
  const sibling = row.nextElementSibling || row.previousElementSibling;
  row.remove();
  return sibling?.firstElementChild ?? null;
}
function deleteColumn(cell) {
  const row = cell.parentElement;
  const i = [...row.children].indexOf(cell);
  const table = cell.closest("table");
  if (row.children.length <= 1) {
    table.remove();
    return null;
  }
  for (const l of table.querySelectorAll("tr")) l.children[i]?.remove();
  return row.children[Math.max(0, i - 1)] ?? null;
}
function focusCell(cell) {
  if (!cell) return;
  const r = document.createRange();
  r.selectNodeContents(cell);
  r.collapse(true);
  select(r);
}
function offsetInBlock(block) {
  const sel = window.getSelection();
  if (!sel?.rangeCount || !block.contains(sel.anchorNode)) return null;
  const r = sel.getRangeAt(0).cloneRange();
  r.selectNodeContents(block);
  r.setEnd(sel.getRangeAt(0).endContainer, sel.getRangeAt(0).endOffset);
  return r.toString().length;
}
function restoreOffset(block, howMany) {
  if (howMany == null) return;
  const step = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
  let counted = 0;
  let node;
  while (node = step.nextNode()) {
    if (counted + node.length >= howMany) {
      const r = document.createRange();
      r.setStart(node, howMany - counted);
      r.collapse(true);
      select(r);
      return;
    }
    counted += node.length;
  }
}
var Editor = class {
  constructor(target, options = {}) {
    this.field = typeof target === "string" ? document.querySelector(target) : target;
    if (!this.field) throw new Error("[Editor] elemento n\xE3o encontrado");
    this.opts = { ...DEFAULTS15, ...omitUndefined(options) };
    this._cleanups = [];
    this._build();
  }
  _build() {
    const field = this.field;
    this.area = el("div", {
      class: "tuc-editor__area",
      contenteditable: "true",
      role: "textbox",
      "aria-multiline": "true",
      "data-placeholder": this.opts.placeholder || field.placeholder || ""
    });
    this.area.style.minHeight = this.opts.minHeight;
    this.area.innerHTML = sanitize(field.value) || "<p><br></p>";
    wrapTables(this.area);
    const GROUPS2 = /* @__PURE__ */ new Set(["left", "quote"]);
    this.toolbar = el(
      "div",
      { class: "tuc-editor__toolbar", role: "toolbar", "aria-label": EDITOR_TEXTS.toolbar },
      this.opts.toolbar.flatMap((name) => {
        const b = el("button", {
          type: "button",
          class: "tuc-btn is-ghost is-icon is-sm",
          "aria-label": EDITOR_TEXTS[name] ?? name,
          "data-tuc-tip": EDITOR_TEXTS[name] ?? name,
          "aria-pressed": "false",
          // mousedown e nao click: click viria depois do blur, e a selecao
          // dentro da area ja teria sido perdida.
          onmousedown: (e) => {
            e.preventDefault();
            this.apply(name);
          },
          // Enter e Espaco num botao focado viram click com detail 0 — o mouse
          // ja agiu no mousedown, entao so o teclado passa daqui. Sem isto a
          // barra so funcionava com mouse.
          onclick: (e) => {
            if (e.detail === 0) this.apply(name);
          }
        }, [icon(ICONS[name] ?? ICONS.clear, 15)]);
        b.dataset.action = name;
        return GROUPS2.has(name) ? [el("span", { class: "tuc-editor__sep", "aria-hidden": "true" }), b] : [b];
      })
    );
    this.tableBar = el("div", {
      class: "tuc-editor__toolbar is-table",
      role: "toolbar",
      "aria-label": EDITOR_TEXTS.tableToolbar,
      hidden: true
    }, Object.keys(TABLE).map((name) => el("button", {
      type: "button",
      class: `tuc-btn is-ghost is-icon is-sm${name.startsWith("delete") ? " is-remove" : ""}`,
      "aria-label": EDITOR_TEXTS[name],
      "data-tuc-tip": EDITOR_TEXTS[name],
      onmousedown: (e) => {
        e.preventDefault();
        this.inTable(name);
      },
      onclick: (e) => {
        if (e.detail === 0) this.inTable(name);
      }
    }, [icon(TABLE_ICONS[name], 15)])));
    this.root = el("div", { class: "tuc-editor" }, [this.toolbar, this.tableBar, this.area]);
    field.parentNode.insertBefore(this.root, field);
    this.root.append(field);
    field.hidden = true;
    field.classList.add("tuc-editor__value");
    this._cleanups.push(
      on(this.area, "input", () => {
        wrapTables(this.area);
        this._sync();
        this._schedulePaint();
      }),
      on(this.area, "paste", (e) => this._paste(e)),
      /*
       * Arrastar para dentro entra como texto puro, pelo mesmo motivo de colar:
       * soltar um trecho de outra pagina trazia fonte, cor, <h1> e <img> — que a
       * peneira tirava do valor, mas nao da tela, e a imagem ainda era baixada.
       */
      on(this.area, "beforeinput", (e) => {
        if (e.inputType !== "insertFromDrop") return;
        e.preventDefault();
        const [target] = e.getTargetRanges();
        const r = document.createRange();
        r.setStart(target.startContainer, target.startOffset);
        select(r);
        this._insertPlain(e.dataTransfer.getData("text/plain"));
      }),
      on(this.area, "keydown", (e) => this._onKey(e)),
      // selectionchange e global: e o unico evento que pega o cursor mudando
      // de lugar por qualquer caminho, inclusive clique fora e volta.
      on(document, "selectionchange", () => {
        const sel = window.getSelection();
        if (sel?.rangeCount && this.area.contains(sel.anchorNode)) this._range = sel.getRangeAt(0).cloneRange();
        else if (this.root.contains(document.activeElement)) return;
        this._syncTableBar();
        this._markActive();
      }),
      // O reset do formulario volta o textarea ao valor de origem; a area vai junto.
      // Adiado porque o evento chega antes de o navegador trocar o valor.
      on(field.form ?? field, "reset", () => setTimeout(() => this.setValue(field.value))),
      // Campo obrigatorio vazio: o textarea escondido nao recebe foco, e o
      // navegador barrava o envio sem mostrar onde. O foco vai para a area.
      on(field, "invalid", () => this.area.focus())
    );
    this._paint();
    this.area.classList.toggle("is-empty", !this.getValue());
    field._tucano = this;
    this.area._tucano = this;
  }
  /*
   * Pinta os blocos de codigo. A coloracao e so exibicao: a peneira dissolve
   * <span>, entao nada disso chega ao valor salvo — e nem deveria, porque cor
   * e decisao de quem exibe, nao conteudo.
   */
  _paint() {
    for (const code of this.area.querySelectorAll("pre > code")) {
      for (const br of code.querySelectorAll("br")) br.replaceWith("\n");
      const painted = highlight(code.textContent);
      if (code.innerHTML === painted) continue;
      const where = offsetInBlock(code);
      code.innerHTML = painted;
      restoreOffset(code, where);
    }
  }
  /* O textarea escondido e a fonte da verdade para o formulario. */
  _sync() {
    const plain = this.getValue();
    this.area.classList.toggle("is-empty", !plain);
    if (this.field.value === plain) return;
    this.field.value = plain;
    this.field.dispatchEvent(new Event("input", { bubbles: true }));
    this.field.dispatchEvent(new Event("change", { bubbles: true }));
  }
  /* Adiado: repintar a cada tecla brigaria com a digitacao. */
  _schedulePaint() {
    clearTimeout(this._brush);
    this._brush = setTimeout(() => this._paint(), 180);
  }
  _paste(e) {
    e.preventDefault();
    this._insertPlain(e.clipboardData.getData("text/plain"));
  }
  /*
   * Texto puro no cursor. Dentro do bloco de codigo cada quebra vai por
   * insertLineBreak: o WebKit (Safari) transforma o "\n" do insertText num
   * <pre> novo, e o trecho colado virava uma pilha de blocos de uma linha.
   * Chromium e Firefox escrevem o mesmo <br> pelos dois caminhos.
   */
  _insertPlain(text) {
    if (!this._currentNode()?.closest("pre")) {
      document.execCommand("insertText", false, text);
      return;
    }
    text.split(/\r\n?|\n/).forEach((line, i) => {
      if (i) document.execCommand("insertLineBreak");
      if (line) document.execCommand("insertText", false, line);
    });
  }
  _onKey(e) {
    if (e.key === "Enter" && !e.isComposing && !e.metaKey && !e.ctrlKey && this._currentNode()?.closest("pre")) {
      e.preventDefault();
      document.execCommand("insertLineBreak");
      return;
    }
    const cell = e.key === "Tab" && this._currentCell();
    if (cell) {
      let target = nextCell(cell, e.shiftKey);
      if (!target && e.shiftKey) return;
      e.preventDefault();
      if (!target) {
        target = insertRow(cell, 1);
        this._sync();
      }
      focusCell(target);
      return;
    }
    const t = e.key.toLowerCase();
    if ((e.metaKey || e.ctrlKey) && SHORTCUTS[t]) {
      e.preventDefault();
      this.apply(SHORTCUTS[t]);
    }
  }
  /*
   * Foco sem arrastar a pagina.
   *
   * focus() traz o elemento a vista, e num editor ja visivel isso vira salto:
   * aplicar um titulo na primeira linha jogava a pagina para cima.
   *
   * Aqui para. Devolver a rolagem depois, como eu fazia, criava uma segunda
   * correcao competindo com o ajuste que o proprio navegador faz — o resultado
   * era a pagina ir e voltar, que e pior que o salto original. Quando um bloco
   * acima cresce, quem mantem a viewport parada e o scroll anchoring, e ele so
   * funciona se ninguem mexer na rolagem por fora.
   */
  _focus() {
    const outside = !this.area.contains(window.getSelection()?.anchorNode);
    this.area.focus({ preventScroll: true });
    if (this._range && outside) select(this._range);
  }
  /* Elemento em volta do cursor, dentro da area. */
  _currentNode() {
    const sel = window.getSelection();
    if (!sel?.anchorNode || !this.area.contains(sel.anchorNode)) return null;
    return sel.anchorNode.nodeType === Node.ELEMENT_NODE ? sel.anchorNode : sel.anchorNode.parentElement;
  }
  /* Botao aceso quando o cursor esta dentro daquela formatacao. */
  _markActive() {
    const node = this._currentNode();
    for (const b of this.toolbar.querySelectorAll("[data-action]")) {
      const state = STATES[b.dataset.action];
      if (!state) continue;
      let active = false;
      try {
        active = !!node && (!!node.closest(state) || document.queryCommandState(state));
      } catch {
      }
      b.setAttribute("aria-pressed", active);
      b.classList.toggle("is-active", active);
    }
  }
  /** Celula onde o cursor esta, ou nada. */
  _currentCell() {
    const cell = this._currentNode()?.closest("th, td");
    return cell && this.area.contains(cell) ? cell : null;
  }
  _syncTableBar() {
    this.tableBar.hidden = !this._currentCell();
  }
  /** Operacao de tabela na celula onde o cursor esta. */
  inTable(name) {
    const cell = this._currentCell();
    if (!cell) return this;
    const destination = TABLE[name]?.(cell);
    wrapTables(this.area);
    this._focus();
    focusCell(destination);
    this._sync();
    this._syncTableBar();
    return this;
  }
  apply(name) {
    this._focus();
    COMMANDS[name]?.(this);
    this._sync();
    this._markActive();
    this._paint();
    return this;
  }
  /*
   * Endereco do link pelo nosso modal, e nao pelo prompt do navegador.
   *
   * O prompt e uma caixa do sistema: aparece fora do desenho da pagina, ignora
   * o tema e nao da para estilizar. Como o modal rouba o foco, a selecao
   * precisa ser guardada antes e devolvida depois — sem isso o createLink nao
   * teria em que trecho aplicar.
   */
  _askForLink() {
    const sel = window.getSelection();
    const mark = sel?.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
    const existing = this._currentNode()?.closest("a");
    const field = el("input", {
      type: "url",
      class: "tuc-input",
      placeholder: "https://",
      value: existing?.getAttribute("href") ?? "https://"
    });
    let decided = null;
    const actions = [{ text: EDITOR_TEXTS.cancel, variant: "outline" }];
    if (existing) {
      actions.push({ text: EDITOR_TEXTS.removeLink, variant: "ghost", onClick: () => {
        decided = "remove";
      } });
    }
    actions.push({
      text: existing ? EDITOR_TEXTS.save : EDITOR_TEXTS.insert,
      variant: "primary",
      onClick: () => {
        decided = field.value.trim();
      }
    });
    const dialog = new Modal({
      title: existing ? EDITOR_TEXTS.editLink : EDITOR_TEXTS.insertLink,
      size: "sm",
      actions,
      onClose: () => {
        if (!decided) return;
        this.area.focus({ preventScroll: true });
        let range = mark;
        if (existing) {
          range = document.createRange();
          range.selectNode(existing);
        }
        if (range) select(range);
        if (decided === "remove") {
          document.execCommand("unlink");
        } else {
          const url = safeUrl(/^([a-z][\w+.-]*:|[#/])/i.test(decided) ? decided : `https://${decided}`);
          if (url && url !== "https://") document.execCommand("createLink", false, url);
        }
        this._sync();
        this._markActive();
      }
    });
    dialog.content(field);
    dialog.open();
    field.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      dialog.panel.querySelector(".tuc-btn.is-primary")?.click();
    });
    field.focus();
    field.select();
    return this;
  }
  getValue() {
    const html = sanitize(this.area.innerHTML);
    return html === "<p><br></p>" ? "" : html;
  }
  setValue(html) {
    this.area.innerHTML = sanitize(html) || "<p><br></p>";
    wrapTables(this.area);
    this._paint();
    this._sync();
    return this;
  }
  destroy() {
    clearTimeout(this._brush);
    this._cleanups.forEach((fn) => fn());
    this.field.hidden = false;
    this.field.classList.remove("tuc-editor__value");
    this.root.replaceWith(this.field);
    delete this.field._tucano;
  }
};
function autoInit16(scope = document) {
  const out = [];
  for (const node of scope.querySelectorAll("[data-tuc-editor]:not([data-tuc-ready])")) {
    node.setAttribute("data-tuc-ready", "");
    out.push(new Editor(node, {
      minHeight: node.dataset.minHeight || void 0,
      placeholder: node.dataset.placeholder || void 0
    }));
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
    modals: autoInit8(scope),
    drawers: autoInit9(scope),
    accordions: autoInit10(scope),
    tabs: autoInit11(scope),
    dropdowns: autoInit12(scope),
    tables: autoInit13(scope),
    pagination: autoInit14(scope),
    editors: autoInit16(scope),
    prose: autoInit15(scope),
    // Por último de propósito: componentes que criam a própria barra de botões
    // marcam neles `data-tuc-tip`, e esses elementos só existem depois que eles
    // se montam. Antes, os botões do editor nasciam sem dica.
    tooltips: autoInit7(scope)
  };
}
export {
  Accordion,
  ColorPicker,
  DatePicker,
  Drawer,
  Dropdown,
  Editor,
  FORMATS,
  ICON_CHECK,
  ICON_COPY,
  ICON_X,
  Mask,
  Modal,
  Pagination,
  Popover,
  Select,
  Table,
  Tabs,
  Toast,
  Tooltip,
  Upload,
  autoFormat,
  autoInit10 as autoInitAccordions,
  autoInit3 as autoInitColorPickers,
  autoInit as autoInitDatePickers,
  autoInit9 as autoInitDrawers,
  autoInit12 as autoInitDropdowns,
  autoInit16 as autoInitEditors,
  autoInit5 as autoInitMasks,
  autoInit8 as autoInitModals,
  autoInit14 as autoInitPagination,
  autoInit15 as autoInitProse,
  autoInit2 as autoInitSelects,
  autoInit13 as autoInitTables,
  autoInit11 as autoInitTabs,
  autoInit6 as autoInitToasts,
  autoInit7 as autoInitTooltips,
  autoInit4 as autoInitUploads,
  color_exports as color,
  confirm,
  dates_exports as dates,
  drawer,
  getTexts,
  highlight,
  icon,
  init,
  listenForEvents,
  mask_exports as mask,
  modal,
  pageWindow,
  pagination,
  sanitize,
  setTexts,
  toast
};
