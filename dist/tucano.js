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

  // src/js/auto.js
  var auto_exports = {};
  __export(auto_exports, {
    Accordion: () => Accordion,
    ColorPicker: () => ColorPicker,
    DatePicker: () => DatePicker,
    Drawer: () => Drawer,
    Dropdown: () => Dropdown,
    Editor: () => Editor,
    FORMATS: () => FORMATS,
    Mask: () => Mask,
    Modal: () => Modal,
    Pagination: () => Pagination,
    Popover: () => Popover,
    Select: () => Select,
    Table: () => Table,
    Toast: () => Toast,
    Tooltip: () => Tooltip,
    Upload: () => Upload,
    autoFormat: () => autoFormat,
    autoInitAccordions: () => autoInit10,
    autoInitColorPickers: () => autoInit3,
    autoInitDatePickers: () => autoInit,
    autoInitDrawers: () => autoInit9,
    autoInitDropdowns: () => autoInit11,
    autoInitEditors: () => autoInit15,
    autoInitMasks: () => autoInit5,
    autoInitModals: () => autoInit8,
    autoInitPagination: () => autoInit13,
    autoInitProse: () => autoInit14,
    autoInitSelects: () => autoInit2,
    autoInitTables: () => autoInit12,
    autoInitToasts: () => autoInit6,
    autoInitTooltips: () => autoInit7,
    autoInitUploads: () => autoInit4,
    color: () => color_exports,
    confirm: () => confirm,
    dates: () => dates_exports,
    drawer: () => drawer,
    highlight: () => highlight,
    init: () => init,
    listenForEvents: () => listenForEvents,
    mask: () => mask_exports,
    modal: () => modal,
    pageWindow: () => pageWindow,
    pagination: () => pagination,
    sanitize: () => sanitize,
    toast: () => toast
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
  var ICON_CHEVRON_LEFT = "M15 18l-6-6 6-6";
  var ICON_CHEVRON_RIGHT = "M9 18l6-6-6-6";
  var ICON_CHEVRON_DOWN = "M6 9l6 6 6-6";
  var ICON_X = "M18 6L6 18M6 6l12 12";
  var ICON_CHECK = "M20 6L9 17l-5-5";
  var ICON_CHEVRONS_UP_DOWN = "M7 15l5 5 5-5M7 9l5-5 5 5";
  var ICON_PIPETTE = "M2 22l1-4 10-10 3 3L6 21l-4 1zM15 5l4-4 4 4-4 4-4-4z";
  var ICON_UPLOAD = "M12 16V4M7 9l5-5 5 5M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2";
  var ICON_FILE = "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6";
  var ICON_RETRY = "M21 12a9 9 0 11-9-9c2.5 0 4.9 1 6.7 2.7L21 8M21 3v5h-5";
  var ICON_SPINNER = "M21 12a9 9 0 11-9-9";
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
  var EXIT_MS = 170;
  var Popover = class {
    constructor(anchor, panel, options = {}) {
      this.anchor = anchor;
      this.panel = panel;
      this.placement = options.placement || "bottom-start";
      this.offset = options.offset ?? 8;
      this.padding = options.padding ?? 8;
      this.appendTo = options.appendTo || document.body;
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
      clearTimeout(this._exitTimer);
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
        on(document, "keydown", (e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            this.onDismiss("escape");
          }
        }, true)
      );
      if (this.closeOnFocusOut) {
        this._cleanups.push(on(document, "focusin", (e) => {
          if (this.panel.contains(e.target) || this.anchor.contains(e.target)) return;
          this.onDismiss("foco");
        }, true));
      }
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
    hide({ animate = true } = {}) {
      if (!this.open) return;
      this.open = false;
      this._cleanups.forEach((fn) => fn());
      this._cleanups = [];
      if (this._frame) {
        cancelAnimationFrame(this._frame);
        this._frame = 0;
      }
      this._ro?.disconnect();
      this._ro = null;
      clearTimeout(this._exitTimer);
      if (!animate) {
        this.panel.classList.remove("is-closing");
        this.panel.remove();
        return;
      }
      this.panel.classList.add("is-closing");
      this._exitTimer = setTimeout(() => {
        this.panel.classList.remove("is-closing");
        this.panel.remove();
      }, EXIT_MS);
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
        this.onDismiss("solto");
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
    /*
     * Chegar de Tab nao abre o calendario. Quem tabula por um formulario para
     * alcancar o botao de salvar nao deveria levar um painel na cara a cada
     * campo, cobrindo o proximo — e era isso que fazia os paineis se empilharem.
     * Abre com seta para baixo, com clique, ou com openOnFocus: true para quem
     * prefere o comportamento antigo.
     */
    openOnFocus: false,
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
      node.classList.add("tuc-input");
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
        closeOnFocusOut: true,
        // Clique fora: nao devolvemos o foco, senao roubariamos de onde o usuario clicou.
        onDismiss: (reason) => this.close({ restoreFocus: reason === "escape" })
      });
      this.popover.show();
      this._revealed = null;
      this._revealTimes();
      openWithTransition(this.panel);
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
      if (restoreFocus && !this._compact) {
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
    get _compact() {
      if (typeof window === "undefined") return false;
      return !!window.matchMedia?.("(max-width: 40rem) and (pointer: coarse)").matches;
    }
    _setupTarget() {
      if (this.native) return this._setupNative();
      const input = this.input;
      if (this._compact) {
        input.readOnly = true;
        this._cleanups.push(on(input, "pointerdown", (e) => {
          e.preventDefault();
          this.isOpen ? this.close({ restoreFocus: false }) : this.open();
        }));
      }
      input.setAttribute("autocomplete", "off");
      this._mask = this._compact ? null : this._maskTemplate();
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
          if (!this._suppressOpen && !this._compact) this.open();
        }),
        on(input, "keydown", (e) => {
          if (e.key === "ArrowDown" && !this.isOpen) {
            e.preventDefault();
            this.open();
          } else if (e.key === " " && !this.isOpen && !input.value) {
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
     * Reescreve o field a cada tecla mantendo o template. Apagar em cima de um
     * separator remove o digito anterior junto — senao a mascara o recolocaria
     * na hora e o field travaria.
     */
    _onMaskInput(e) {
      const input = this.input;
      const raw = input.value;
      const caret = input.selectionStart ?? raw.length;
      const deleting = typeof e.inputType === "string" && e.inputType.startsWith("delete");
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
     * Com a mascara completa, move o calendario para a data digitada sem close
     * nem reescrever o field — commit de verdade so no Enter ou ao sair.
     */
    _previewTyped() {
      const raw = this.input.value;
      if (this.isRange) {
        const [a, b] = raw.split(/\s*—\s*/);
        const start = this._keepTime(parseUserInput(a, this.opts.locale), this.start);
        if (!start) return;
        this.start = start;
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
     * Normaliza o que foi digitado. Quando o text nao traz hora (parseUserInput
     * marca isso em `hasTime`), mantem a hora que ja estava selecionada em vez de
     * jogar o value para meia-noite.
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
     * Rola cada coluna de hora ate o value selecionado — mas so quando esse value
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
          class: "tuc-btn is-ghost is-icon is-sm tuc-dp__nav",
          "aria-label": "Mes anterior",
          disabled: this._navBlocked(-1),
          onclick: () => this._shiftView(-1)
        }, [icon(ICON_CHEVRON_LEFT)]) : el("span", { class: "tuc-dp__nav is-ghost" }),
        el("button", {
          type: "button",
          class: "tuc-dp__label",
          "aria-live": "polite",
          onclick: () => {
            this.view = "months";
            this.viewDate = clone(monthDate);
            this._render();
          }
        }, [`${this.L.monthsLong[month]} ${year}`, icon(ICON_CHEVRON_DOWN, 14)]),
        showNext ? el("button", {
          type: "button",
          class: "tuc-btn is-ghost is-icon is-sm tuc-dp__nav",
          "aria-label": "Proximo mes",
          disabled: this._navBlocked(1),
          onclick: () => this._shiftView(1)
        }, [icon(ICON_CHEVRON_RIGHT)]) : el("span", { class: "tuc-dp__nav is-ghost" })
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
     * engoliria o clique — era isso que impedia de close o periodo.
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
          class: "tuc-btn is-ghost is-icon is-sm tuc-dp__nav",
          "aria-label": "Anterior",
          onclick: () => {
            this.viewDate = addYears(this.viewDate, -step);
            this._render();
          }
        }, [icon(ICON_CHEVRON_LEFT)]),
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
          class: "tuc-btn is-ghost is-icon is-sm tuc-dp__nav",
          "aria-label": "Proximo",
          onclick: () => {
            this.viewDate = addYears(this.viewDate, step);
            this._render();
          }
        }, [icon(ICON_CHEVRON_RIGHT)])
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
      this.opts = { ...DEFAULTS2, ...omitUndefined(options) };
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
      this.remote = !!(this.opts.url || this.opts.loadOptions);
      this.opts.search = this.remote ? true : this.opts.search ?? this.items.length >= this.opts.searchMinItems;
      this.searchState = null;
      this._cache = /* @__PURE__ */ new Map();
      this._empties = /* @__PURE__ */ new Set();
      this._page = 1;
      this._hasMore = false;
      this._build();
      this._syncFromNative();
      node._tucano = this;
    }
    /* ---------------------------------------------------------------- *
     * API publica                                                       *
     * ---------------------------------------------------------------- */
    getValue() {
      const chosen = this.items.filter((i) => i.selected).map((i) => i.value);
      return this.multiple ? chosen : chosen[0] ?? null;
    }
    setValue(value, { silent = false } = {}) {
      const target = new Set([].concat(value ?? []).map(String));
      for (const item of this.items) item.selected = target.has(item.value);
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
      this._empties.clear();
      this.items = readOptions(this.native);
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
        appendTo: this.opts.appendTo || document.body,
        matchWidth: true,
        closeOnFocusOut: true,
        onDismiss: () => this.close()
      });
      this.popover.show();
      openWithTransition(this.menu);
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
      clearTimeout(this._searchTimer);
      this._abort();
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
      }, [icon(ICON_X, 14)]);
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
        el("span", { class: "tuc-select__arrow" }, [icon(ICON_CHEVRONS_UP_DOWN, 15)])
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
          if (this.remote) {
            this._scheduleSearch();
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
        on(this.list, "scroll", () => this._onListScroll())
      );
    }
    _syncFromNative() {
      const chosen = new Set([...this.native.selectedOptions].map((o) => o.value));
      for (const item of this.items) item.selected = chosen.has(item.value);
      this._renderControl();
    }
    _pushToNative() {
      this._pushing = true;
      if (this.remote) {
        for (const item of this.items) {
          if (!item.selected) continue;
          if ([...this.native.options].some((o) => o.value === item.value)) continue;
          this.native.append(el("option", { value: item.value, text: item.label }));
        }
      }
      const chosen = new Set(this.items.filter((i) => i.selected).map((i) => i.value));
      for (const opt of this.native.options) opt.selected = chosen.has(opt.value);
      if (!this.multiple && !chosen.size) {
        const empty = [...this.native.options].find((o) => o.value === "");
        if (empty) empty.selected = true;
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
    _scheduleSearch() {
      clearTimeout(this._searchTimer);
      const term = this.query.trim();
      this._page = 1;
      if (term.length < this.opts.minChars) {
        this._abort();
        this.searchState = null;
        this.items = this._chosen();
        this._hasMore = false;
        this._renderMenu();
        return;
      }
      const saved = this.opts.cache ? this._cache.get(term) : null;
      if (saved) {
        this._abort();
        this.searchState = null;
        this._applyResult(saved, { append: false });
        return;
      }
      if (this._noChance(term)) {
        this._abort();
        this.searchState = null;
        this._applyResult([], { append: false });
        return;
      }
      if (this._termInFlight === term) return;
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
     */
    _noChance(term) {
      if (!this.opts.shortCircuit) return false;
      for (const empty of this._empties) if (term.startsWith(empty)) return true;
      return false;
    }
    _store(term, items) {
      if (!this.opts.cache) return;
      if (this._cache.size >= this.opts.cacheSize) {
        this._cache.delete(this._cache.keys().next().value);
      }
      this._cache.set(term, items);
      if (!items.length) this._empties.add(term);
    }
    /** Junta o que veio com quem ja estava escolhido e desenha. */
    _applyResult(incoming, { append }) {
      const chosen = this._chosen();
      const base = append ? this.items : chosen;
      const fresh = incoming.filter((i) => !base.some((e) => e.value === i.value));
      this.items = [...base, ...fresh];
      this.activeIndex = this.items.findIndex((i) => !i.disabled && !i.selected);
      this._renderMenu();
    }
    _abort() {
      this._control?.abort();
      this._control = null;
    }
    async _fetch(term, { page = 1 } = {}) {
      this._abort();
      const control = new AbortController();
      this._control = control;
      this._termInFlight = term;
      try {
        const raws = this.opts.loadOptions ? await this.opts.loadOptions(term, { signal: control.signal, page }) : await this._fetchUrl(term, control.signal, page);
        if (control.signal.aborted) return;
        const incoming = normalizeOptions(raws);
        this._hasMore = hasNextPage(raws, incoming, this.opts.pageParam);
        this.searchState = null;
        if (page === 1) this._store(term, incoming);
        this._applyResult(incoming, { append: page > 1 });
        return;
      } catch (e) {
        if (e.name === "AbortError" || control.signal.aborted) return;
        this.searchState = "error";
        this._renderMenu();
      } finally {
        if (this._control === control) {
          this._control = null;
          this._termInFlight = null;
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
     */
    _onListScroll() {
      if (!this.remote || !this._hasMore || this.searchState === "loading") return;
      const l = this.list;
      if (l.scrollTop + l.clientHeight < l.scrollHeight - 48) return;
      this._page += 1;
      this.searchState = "loading";
      this._renderMenu();
      this._fetch(this.query.trim(), { page: this._page });
    }
    _chosen() {
      return this.items.filter((i) => i.selected);
    }
    /* ---------------------------------------------------------------- *
     * Render                                                            *
     * ---------------------------------------------------------------- */
    _renderControl() {
      const chosen = this.items.filter((i) => i.selected);
      for (const n of [...this.values.children]) if (n !== this.search) n.remove();
      if (this.multiple) {
        for (const item of chosen) {
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
      this.control.classList.toggle("is-empty", empty);
      this.control.classList.toggle("has-value", chosen.length > 0);
      this.search.readOnly = !this.opts.search;
    }
    _filtered() {
      if (this.remote) return this.items;
      const q = this.query.trim().toLowerCase();
      if (!q) return this.items;
      return this.items.filter((i) => i.search.includes(q));
    }
    _renderMenu() {
      const visible = this._filtered();
      this.list.replaceChildren();
      if (this.searchState === "loading") {
        this.list.append(el("div", { class: "tuc-select__empty is-loading", text: this.opts.loadingText }));
        return;
      }
      if (this.searchState === "error") {
        this.list.append(el("div", { class: "tuc-select__empty is-error", text: this.opts.errorText }));
        return;
      }
      if (!visible.length) {
        const remainingToType = this.remote && this.query.trim().length < this.opts.minChars;
        this.list.append(el("div", {
          class: "tuc-select__empty",
          text: remainingToType ? `Digite ${this.opts.minChars} caractere${this.opts.minChars > 1 ? "s" : ""} para buscar` : this.opts.emptyText
        }));
        return;
      }
      let currentGroup = null;
      visible.forEach((item, i) => {
        if (item.group && item.group !== currentGroup) {
          currentGroup = item.group;
          this.list.append(el("div", { class: "tuc-select__group", text: item.group, role: "presentation" }));
        }
        const active = i === this.activeIndex;
        const node = el("div", {
          class: `tuc-select__option${item.selected ? " is-selected" : ""}${active ? " is-active" : ""}${item.disabled ? " is-disabled" : ""}`,
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
          item.selected ? el("span", { class: "tuc-select__check" }, [icon(ICON_CHECK, 15)]) : null
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
      const options = this.list.querySelectorAll(".tuc-select__option");
      options.forEach((n, i) => n.classList.toggle("is-active", i === this.activeIndex));
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
      const visible = this._filtered();
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!this.isOpen) return this.open();
        const step = e.key === "ArrowDown" ? 1 : -1;
        for (let n = 1; n <= visible.length; n++) {
          const i = (this.activeIndex + step * n + visible.length * n) % visible.length;
          if (!visible[i].disabled) {
            this.activeIndex = i;
            break;
          }
        }
        this._paintActive();
        this._scrollToActive();
      } else if (e.key === "Enter" || e.key === " ") {
        if (!this.isOpen) {
          if (e.key === " " && this.search.value) return;
          e.preventDefault();
          return this.open();
        }
        if (e.key === " ") return;
        e.preventDefault();
        const item = visible[this.activeIndex];
        if (item) this._toggleItem(item);
      } else if (e.key === "Escape") {
        if (this.isOpen) {
          e.preventDefault();
          e.stopPropagation();
          this.close();
          this.control.focus?.();
        }
      } else if (e.key === "Backspace" && !this.search.value && this.multiple) {
        const chosen = this.items.filter((i) => i.selected);
        if (chosen.length) this._toggleItem(chosen[chosen.length - 1]);
      } else if (e.key === "Home" || e.key === "End") {
        if (!this.isOpen) return;
        e.preventDefault();
        this.activeIndex = e.key === "Home" ? 0 : visible.length - 1;
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
  function normalizeOptions(data) {
    const list = Array.isArray(data) ? data : data?.results ?? data?.items ?? data?.data ?? [];
    return list.map((o) => {
      if (o == null) return null;
      if (typeof o !== "object") return { value: String(o), label: String(o), disabled: false, group: null, selected: false, search: normalize(String(o)) };
      const value = String(o.value ?? o.id ?? o.pk ?? "");
      const label = String(o.label ?? o.text ?? o.name ?? o.name ?? value);
      return { value, label, disabled: !!o.disabled, group: o.group ?? o.group ?? null, selected: false, search: normalize(`${label} ${value}`) };
    }).filter((o) => o && o.value !== "");
  }
  function hasNextPage(raws, items, pageParam) {
    if (!pageParam) return false;
    if (raws && typeof raws === "object" && !Array.isArray(raws)) {
      if ("next" in raws) return !!raws.next;
      if ("has_more" in raws) return !!raws.has_more;
    }
    return items.length > 0;
  }
  function readOptions(select) {
    return [...select.options].filter((o) => o.value !== "").map((o) => ({
      value: o.value,
      label: o.textContent.trim(),
      disabled: o.disabled,
      group: o.parentElement.tagName === "OPTGROUP" ? o.parentElement.label : null,
      selected: o.selected,
      // Normaliza acentos: buscar "sao" acha "São Paulo".
      search: normalize(`${o.textContent} ${o.value}`)
    }));
  }
  function normalize(s) {
    return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  }
  function firstEmptyLabel(select) {
    const o = [...select.options].find((x) => x.value === "");
    return o ? o.textContent.trim() : null;
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
    return a >= 1 ? base : base + hex2(Math.round(a * 255));
  }
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
    const rgb = /^rgba?\(([^)]+)\)$/.exec(text);
    if (rgb) {
      const p = rgb[1].split(/[\s,/]+/).filter(Boolean).map(Number);
      if (p.length < 3 || p.slice(0, 3).some(Number.isNaN)) return null;
      return {
        ...rgbToHsv({ r: clamp(p[0], 0, 255), g: clamp(p[1], 0, 255), b: clamp(p[2], 0, 255) }),
        a: p[3] === void 0 ? 1 : clamp(p[3], 0, 1)
      };
    }
    const hsl = /^hsla?\(([^)]+)\)$/.exec(text);
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
  function formatColor(hsva, format3 = "hex") {
    const { r, g, b } = hsvToRgb(hsva);
    const a = Math.round(hsva.a * 100) / 100;
    if (format3 === "rgb") {
      return a >= 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${a})`;
    }
    if (format3 === "hsl") {
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
  var ColorPicker = class {
    constructor(target, options = {}) {
      const node = typeof target === "string" ? document.querySelector(target) : target;
      if (!node) throw new Error("[ColorPicker] elemento alvo nao encontrado");
      this.opts = { ...DEFAULTS3, ...omitUndefined(options) };
      this.input = node;
      this.id = nextId("cor");
      this.isOpen = false;
      this._cleanups = [];
      this._dragging = null;
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
      const color = parseColor(value);
      if (!color) return false;
      this.hsva = this.opts.alpha ? color : { ...color, a: 1 };
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
        closeOnFocusOut: true,
        onDismiss: () => this.close()
      });
      this.popover.show();
      openWithTransition(this.panel);
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
        onclick: () => this.toggle(),
        // Enter e Espaco o navegador ja converte em clique num <button>; a seta
        // para baixo e a que falta, e e a mesma dos outros campos.
        onkeydown: (e) => {
          if (e.key === "ArrowDown" && !this.isOpen) {
            e.preventDefault();
            this.open();
          }
        }
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
      const fieldRow = el("div", { class: "tuc-colorpicker__row" }, [
        this.preview,
        this.hexField,
        supportsEyeDropper() ? el("button", {
          type: "button",
          class: "tuc-btn is-ghost is-icon tuc-colorpicker__pick",
          "aria-label": "Capturar cor da tela",
          onclick: () => this._pickFromScreen()
        }, [icon(ICON_PIPETTE, 15)]) : null
      ]);
      const tracks = el("div", { class: "tuc-colorpicker__tracks" }, [this.hue.root, this.alpha?.root]);
      this.panel = el("div", {
        class: "tuc-colorpicker",
        role: "dialog",
        "aria-label": "Seletor de cor",
        id: this.id
      }, [this.area, tracks, fieldRow, this.opts.swatches ? this._buildSwatches() : null]);
      this._cleanups.push(
        this._dragHandler(this.area, (x, y) => {
          this.hsva = { ...this.hsva, s: x, v: 1 - y };
          this._commit();
        }),
        on(this.area, "keydown", (e) => this._areaKeys(e)),
        on(this.input, "change", () => {
          if (this._emitting) return;
          if (!this.setValue(this.input.value)) this._syncInput();
        }),
        /*
         * Abrir no foco do campo de texto atrapalhava duas vezes: o painel subia
         * so de tabular por um formulario, e cobria o proprio campo de quem
         * queria digitar o hex. O gatilho e a amostra ao lado, que e <button> e
         * ja responde a Enter e Espaco por conta do navegador. Aqui fica so a
         * seta para baixo, igual a do campo de data.
         */
        on(this.input, "keydown", (e) => {
          if (e.key === "ArrowDown" && !this.isOpen) {
            e.preventDefault();
            this.open();
          }
        }),
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
      this._cleanups.push(
        this._dragHandler(root, (x) => {
          this.hsva = type === "hue" ? { ...this.hsva, h: x * 360 } : { ...this.hsva, a: x };
          this._commit();
        }),
        on(root, "keydown", (e) => {
          const step = e.shiftKey ? 10 : 1;
          const delta = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[e.key];
          if (!delta) return;
          e.preventDefault();
          this.hsva = type === "hue" ? { ...this.hsva, h: (this.hsva.h + delta * step + 360) % 360 } : { ...this.hsva, a: clamp(this.hsva.a + delta * step / 100, 0, 1) };
          this._commit();
        })
      );
      return { root, thumb };
    }
    _buildSwatches() {
      return el(
        "div",
        { class: "tuc-colorpicker__swatches" },
        this.opts.swatches.map((color) => el("button", {
          type: "button",
          class: "tuc-colorpicker__swatchbtn",
          style: `--color: ${color}`,
          "aria-label": color,
          title: color,
          dataset: { color: normalize2(color) },
          onclick: () => {
            this.setValue(color);
          }
        }))
      );
    }
    /**
     * Arrasto normalizado em [0,1]. Usa pointer capture para o gesto continuar
     * valendo quando o cursor sai do elemento — sem isso o thumb "gruda" na borda.
     */
    _dragHandler(node, onMove) {
      const applyPointer = (e) => {
        const r = node.getBoundingClientRect();
        onMove(clamp((e.clientX - r.left) / r.width, 0, 1), clamp((e.clientY - r.top) / r.height, 0, 1));
      };
      const down = (e) => {
        e.preventDefault();
        node.setPointerCapture(e.pointerId);
        node.focus();
        applyPointer(e);
      };
      const move = (e) => {
        if (node.hasPointerCapture(e.pointerId)) applyPointer(e);
      };
      const up = (e) => {
        if (node.hasPointerCapture(e.pointerId)) node.releasePointerCapture(e.pointerId);
      };
      const offs = [on(node, "pointerdown", down), on(node, "pointermove", move), on(node, "pointerup", up)];
      return () => offs.forEach((f) => f());
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
    _commit() {
      this._syncInput();
      this._paint();
      this._emit();
    }
    _syncInput() {
      const value = this.getValue();
      this.input.value = value;
      this.swatch.style.setProperty("--color", value);
    }
    /** Repinta os controles a partir do HSVA atual. */
    _paint() {
      const { h, s, v, a } = this.hsva;
      const pure = rgbToHex(hsvToRgb({ h, s: 1, v: 1 }));
      const solid = rgbToHex(hsvToRgb(this.hsva));
      this.area.style.setProperty("--matiz", pure);
      this.area.firstElementChild.style.left = `${s * 100}%`;
      this.area.firstElementChild.style.top = `${(1 - v) * 100}%`;
      this.area.firstElementChild.style.setProperty("--color", solid);
      this.area.firstElementChild.classList.toggle("is-dark", isDark(this.hsva));
      this.hue.thumb.style.left = `${h / 360 * 100}%`;
      this.hue.thumb.style.setProperty("--color", pure);
      this.hue.root.setAttribute("aria-valuenow", String(Math.round(h)));
      if (this.alpha) {
        this.alpha.root.style.setProperty("--color", solid);
        this.alpha.thumb.style.left = `${a * 100}%`;
        this.alpha.thumb.style.setProperty("--color", solid);
        this.alpha.root.setAttribute("aria-valuenow", a.toFixed(2));
      }
      this.preview.style.setProperty("--color", formatColor(this.hsva, "rgb"));
      const current = rgbToHex(hsvToRgb(this.hsva));
      for (const btn of this.panel.querySelectorAll(".tuc-colorpicker__swatchbtn")) {
        btn.classList.toggle("is-selected", btn.dataset.color === current);
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
  function normalize2(color) {
    const p = parseColor(color);
    return p ? rgbToHex(hsvToRgb(p)) : String(color).toLowerCase();
  }
  function supportsEyeDropper() {
    return typeof window !== "undefined" && "EyeDropper" in window;
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
    const m = /^([\d.,]+)\s*(b|kb|mb|gb)?$/i.exec(String(value || "").trim());
    if (!m) return null;
    const n = parseFloat(m[1].replace(",", "."));
    const factor = { b: 1, kb: 1024, mb: 1024 ** 2, gb: 1024 ** 3 }[(m[2] || "b").toLowerCase()];
    return Math.round(n * factor);
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
  function csrfToken(name = "csrftoken") {
    const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
    return m ? decodeURIComponent(m[1]) : null;
  }
  function uploadFile({ url, file, field = "file", extras = {}, headers = {}, onProgress }) {
    const xhr = new XMLHttpRequest();
    const promise = new Promise((resolve, reject) => {
      const data = new FormData();
      data.append(field, file);
      for (const [k, v] of Object.entries(extras)) data.append(k, v);
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
      xhr.addEventListener("abort", () => reject(Object.assign(new Error("Cancelado"), { canceled: true })));
      xhr.send(data);
    });
    return { promise, abort: () => xhr.abort() };
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
  var TEXTS = {
    zone: "Arraste arquivos aqui ou clique para escolher",
    zoneOne: "Arraste um arquivo aqui ou clique para escolher",
    drop: "Solte para enviar",
    uploading: "Enviando...",
    pronto: "Enviado",
    cancel: "Cancelar",
    remove: "Remover",
    repeat: "Tentar de novo",
    large: (max) => `Arquivo maior que ${max}`,
    type: "Tipo de arquivo n\xE3o aceito",
    others: (n) => `No m\xE1ximo ${n} arquivo${n > 1 ? "s" : ""}`
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
      this.t = { ...TEXTS, ...this.opts.texts };
      this.opts.maxSize = this.opts.maxSize == null ? null : parseSize(this.opts.maxSize);
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
        status: i.estado,
        progress: i.progress,
        id: i.idServidor ?? null,
        url: i.url ?? null,
        file: i.file
      }));
    }
    /** Ids devolvidos pelo servidor (modo direto). E o que o formulario posta. */
    getValue() {
      const ready = this.items.filter((i) => i.estado === "pronto" && i.idServidor != null);
      return this.direct ? ready.map((i) => i.idServidor) : this.items.map((i) => i.file);
    }
    /** Sobe o que estiver pendente. Util com autoUpload: false. */
    uploadAll() {
      for (const item of this.items) if (item.estado === "pendente") this._upload(item);
    }
    clear() {
      for (const item of [...this.items]) this._remove(item, { silent: true });
      this._emit();
    }
    destroy() {
      this._cleanups.forEach((fn) => fn());
      this._cleanups = [];
      for (const i of this.items) if (i.preview) URL.revokeObjectURL(i.preview);
      this.root.replaceWith(this.input);
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
      if (this.direct && input.name) {
        this.fieldName = input.name;
        input.removeAttribute("name");
      }
      this.zone = el("div", {
        class: "tuc-upload__zone",
        role: "button",
        tabindex: 0,
        "aria-describedby": `${this.id}-dica`
      }, [
        el("span", { class: "tuc-upload__icon" }, [icon(ICON_UPLOAD, 20)]),
        el("span", { class: "tuc-upload__label", text: this.multiple ? this.t.zone : this.t.zoneOne }),
        el("span", { class: "tuc-upload__hint", id: `${this.id}-dica`, text: this._hint() })
      ]);
      this.list = el("ul", { class: "tuc-upload__list" });
      this.root = el("div", { class: "tuc-upload", id: this.id }, [this.zone, this.list]);
      input.replaceWith(this.root);
      this.root.append(input);
      const open = () => input.click();
      this._cleanups.push(
        on(this.zone, "click", open),
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
      this._renderList();
    }
    _hint() {
      const parts = [];
      if (this.input.accept) parts.push(this.input.accept.split(",").map((s) => s.trim()).join(", "));
      if (this.opts.maxSize) parts.push(`at\xE9 ${formatSize(this.opts.maxSize, this.opts.locale)}`);
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
          this._dragging = 0;
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
      if (!files.length) return;
      if (!this.multiple) {
        for (const item of [...this.items]) this._remove(item, { silent: true });
        files = files.slice(0, 1);
      }
      for (const file of files) {
        const error = this._validate(file);
        if (error) {
          this._fail(error, file);
          continue;
        }
        const item = {
          key: fileId(),
          file,
          estado: "pendente",
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
    _validate(file) {
      if (this.opts.maxFiles && this.items.length >= this.opts.maxFiles) {
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
     * escrever em input.files.
     */
    _syncNative() {
      if (this.direct) return;
      try {
        const dt = new DataTransfer();
        for (const item of this.items) dt.items.add(item.file);
        this.input.files = dt.files;
      } catch {
      }
    }
    _upload(item) {
      item.estado = "enviando";
      item.progress = 0;
      item.error = null;
      this._renderList();
      const headers = { ...this.opts.headers };
      if (this.opts.csrf && !headers["X-CSRFToken"]) {
        const token = csrfToken();
        if (token) headers["X-CSRFToken"] = token;
      }
      const { promise, abort } = uploadFile({
        url: this.opts.url,
        file: item.file,
        field: this.opts.fieldName,
        extras: this.opts.extraData,
        headers,
        onProgress: (fraction) => {
          item.progress = fraction;
          this._paintProgress(item);
        }
      });
      item.abort = abort;
      promise.then((response) => {
        item.estado = "pronto";
        item.progress = 1;
        item.response = response;
        item.idServidor = response?.[this.opts.responseId] ?? null;
        item.url = response?.[this.opts.responseUrl] ?? null;
      }).catch((e) => {
        if (e.canceled) {
          const i = this.items.indexOf(item);
          if (i >= 0) this.items.splice(i, 1);
          if (item.preview) URL.revokeObjectURL(item.preview);
        } else {
          item.estado = "error";
          item.error = e.message;
          this.opts.onError?.(e, item.file);
        }
      }).finally(() => {
        item.abort = null;
        this._renderList();
        this._emit();
      });
    }
    _remove(item, { silent = false } = {}) {
      item.abort?.();
      const i = this.items.indexOf(item);
      if (i >= 0) this.items.splice(i, 1);
      if (item.preview) URL.revokeObjectURL(item.preview);
      if (this.direct && this.opts.deleteUrl && item.idServidor != null) {
        const headers = { ...this.opts.headers };
        if (this.opts.csrf) {
          const t = csrfToken();
          if (t) headers["X-CSRFToken"] = t;
        }
        fetch(`${this.opts.deleteUrl}${item.idServidor}/`, { method: "DELETE", headers }).catch(() => {
        });
      }
      this._syncNative();
      this._renderList();
      if (!silent) this._emit();
    }
    _fail(message, file) {
      this.opts.onError?.(new Error(message), file);
      const warning = el("li", { class: "tuc-upload__item is-rejected" }, [
        el("span", { class: "tuc-upload__thumb" }, [icon(ICON_ALERT, 16)]),
        el("div", { class: "tuc-upload__info" }, [
          el("span", { class: "tuc-upload__name", text: file.name }),
          el("span", { class: "tuc-upload__meta", text: message })
        ])
      ]);
      this.list.append(warning);
      setTimeout(() => warning.remove(), 5e3);
    }
    /* ---------------------------------------------------------------- *
     * Render                                                            *
     * ---------------------------------------------------------------- */
    /** So a barra: chamado a cada evento de progresso, nao pode refazer a lista. */
    _paintProgress(item) {
      const li = this.list.querySelector(`[data-key="${item.key}"]`);
      if (!li) return;
      const toolbar = li.querySelector(".tuc-upload__barfill");
      if (toolbar) toolbar.style.width = `${Math.round(item.progress * 100)}%`;
      const meta = li.querySelector(".tuc-upload__meta");
      if (meta) meta.textContent = `${Math.round(item.progress * 100)}% \xB7 ${formatSize(item.file.size, this.opts.locale)}`;
    }
    _renderList() {
      for (const n of [...this.list.children]) if (!n.classList.contains("is-rejected")) n.remove();
      for (const item of this.items) {
        const pct = Math.round(item.progress * 100);
        const meta = item.estado === "enviando" ? `${pct}% \xB7 ${formatSize(item.file.size, this.opts.locale)}` : item.estado === "error" ? item.error : formatSize(item.file.size, this.opts.locale);
        const actions = [];
        if (item.estado === "enviando") {
          actions.push(this._button(ICON_X, this.t.cancel, () => item.abort?.()));
        } else if (item.estado === "error") {
          actions.push(this._button(ICON_RETRY, this.t.repeat, () => this._upload(item)));
          actions.push(this._button(ICON_X, this.t.remove, () => this._remove(item)));
        } else {
          actions.push(this._button(ICON_X, this.t.remove, () => this._remove(item)));
        }
        this.list.append(el("li", {
          class: `tuc-upload__item is-${item.estado}`,
          dataset: { key: item.key }
        }, [
          item.preview ? el("img", { class: "tuc-upload__thumb", src: item.preview, alt: "" }) : el("span", { class: "tuc-upload__thumb" }, [icon(ICON_FILE, 16)]),
          el("div", { class: "tuc-upload__info" }, [
            el("span", { class: "tuc-upload__name", title: item.file.name, text: item.file.name }),
            el("span", { class: "tuc-upload__meta", text: meta }),
            item.estado === "enviando" ? el("span", { class: "tuc-upload__bar" }, [
              el("span", { class: "tuc-upload__barfill", style: `width:${pct}%` })
            ]) : null
          ]),
          item.estado === "pronto" ? el("span", { class: "tuc-upload__ok" }, [icon(ICON_CHECK, 15)]) : null,
          el("div", { class: "tuc-upload__actions" }, actions)
        ]));
      }
      this._syncHidden();
      this.root.classList.toggle("is-empty", !this.items.length);
    }
    _button(path, label, onClick) {
      return el("button", {
        type: "button",
        class: "tuc-btn is-ghost is-icon is-sm tuc-upload__action",
        "aria-label": label,
        title: label,
        onclick: (e) => {
          e.stopPropagation();
          onClick();
        }
      }, [icon(path, 14)]);
    }
    /** Modo direto: os ids prontos viram inputs hidden com o `name` original. */
    _syncHidden() {
      if (!this.direct || !this.fieldName) return;
      this.hidden?.remove();
      this.hidden = el(
        "span",
        { class: "tuc-upload__hidden" },
        this.items.filter((i) => i.estado === "pronto" && i.idServidor != null).map((i) => el("input", { type: "hidden", name: this.fieldName, value: String(i.idServidor) }))
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
  function applyCurrency(digits, { decimals = 2, locale = "pt-BR", currency = null } = {}) {
    const cleaned = String(digits).replace(/\D/g, "").replace(/^0+(?=\d)/, "");
    if (!cleaned) return "";
    const n = Number(cleaned) / 10 ** decimals;
    return n.toLocaleString(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      ...currency ? { style: "currency", currency } : {}
    });
  }
  function mod11Digit(values, startWeight) {
    let soma = 0;
    let peso = startWeight;
    for (const v of values) {
      soma += v * peso;
      peso = peso === 2 ? 9 : peso - 1;
    }
    const rest = soma % 11;
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
    if (format3 === "currency" || format3 === "real") {
      const n = typeof value === "number" ? value : Number(raw.replace(/\.(?=\d{3}\b)/g, "").replace(",", "."));
      if (!Number.isFinite(n)) return raw;
      const { decimals = 2, locale = "pt-BR" } = options;
      const currency = options.currency ?? (format3 === "real" ? "BRL" : null);
      return n.toLocaleString(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        ...currency ? { style: "currency", currency } : {}
      });
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
    document: ["###.###.###-##", "**.***.***/****-##"],
    phone: ["(##) ####-####", "(##) #####-####"],
    mobile: "(##) #####-####",
    cep: "#####-###",
    card: "#### #### #### ####"
  };
  var PONTO = "\u2022";
  function maskMiddle(text, visible = 2, mode = "fim") {
    const s = String(text ?? "");
    if (!s) return s;
    if (mode === "email") return maskEmail(s);
    const alphanumeric = (c) => /[0-9A-Za-z]/.test(c);
    const total = [...s].filter(alphanumeric).length;
    const show = mode === "tudo" ? 0 : visible;
    let seen = 0;
    return [...s].map((c) => {
      if (!alphanumeric(c)) return mode === "tudo" ? PONTO : c;
      seen++;
      return seen > total - show ? c : PONTO;
    }).join("");
  }
  function maskEmail(value) {
    const s = String(value ?? "");
    const arroba = s.lastIndexOf("@");
    if (arroba < 1) return maskMiddle(s, 0, "tudo");
    const local = s.slice(0, arroba);
    const domain = s.slice(arroba);
    return local[0] + PONTO.repeat(Math.max(local.length - 1, 1)) + domain;
  }

  // src/js/components/mask.js
  var FORMATS = {
    cpf: { template: "###.###.###-##", validate: validateCPF, error: "CPF inv\xE1lido" },
    cnpj: { template: "**.***.***/****-##", validate: validateCNPJ, error: "CNPJ inv\xE1lido", uppercase: true },
    "cnpj-numerico": { template: "##.###.###/####-##", validate: validateCNPJ, error: "CNPJ inv\xE1lido" },
    "cpf-cnpj": {
      template: ["###.###.###-##", "**.***.***/****-##"],
      validate: validateCpfCnpj,
      error: "Documento inv\xE1lido",
      uppercase: true
    },
    phone: { template: ["(##) ####-####", "(##) #####-####"] },
    mobile: { template: "(##) #####-####" },
    cep: { template: "#####-###" },
    date: { template: "##/##/####" },
    time: { template: "##:##" },
    card: { template: "#### #### #### ####" },
    currency: { isCurrency: true },
    real: { isCurrency: true, currency: "BRL" }
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
      this.opts = { ...DEFAULTS5, ...omitUndefined(options) };
      this.opts.locale = this.opts.locale || document.documentElement.lang || "pt-BR";
      this.input = node;
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
      if (!node.getAttribute("placeholder") && this.templates && !this.isCurrency) {
        node.placeholder = placeholderFromTemplate(this.templates);
      }
      this._cleanups = [];
      this._wire();
      if (node.value && !this.isCurrency && this.templates) this._format({ keepCursor: false });
      else if (node.value && this.isCurrency) this._format({ keepCursor: false });
      if (this.opts.reveal) this._buildEye();
      node._tucano = this;
    }
    /* ---------------------------------------------------------------- *
     * API publica                                                       *
     * ---------------------------------------------------------------- */
    /** Conteudo sem formatacao: so digitos, ou digitos e letras. */
    getRaw() {
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
      if (this.wrapper) {
        if (this.rawValue != null) this.input.value = this.rawValue;
        if (this.realName) this.input.name = this.realName;
        this.input.readOnly = this.readOnlyOriginal ?? false;
        this.wrapper.replaceWith(this.input);
        this.hidden?.remove();
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
        "aria-label": "Mostrar",
        "aria-pressed": "false",
        onclick: () => this._toggle()
      });
      this.wrapper.append(this.eye);
      this.showing = !input.value;
      this._paintEye();
      this._cleanups.push(on(input, "input", () => {
        if (this.hidden) this.hidden.value = this.getRaw();
      }));
    }
    /**
     * Modo de esconder. Escolhido pelo campo quando nao informado: `type=email`
     * guarda o dominio, o resto guarda o fim.
     */
    _hiddenMode() {
      if (this.opts.revealMode) return this.opts.revealMode;
      if (this.input.type === "email") return "email";
      return "fim";
    }
    _toggle() {
      this.showing = !this.showing;
      this._paintEye();
      if (this.showing) this.input.focus();
    }
    _paintEye() {
      const input = this.input;
      const showing = this.showing;
      if (this.password) {
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
      this.eye.setAttribute("aria-label", showing ? "Ocultar" : "Mostrar");
      this.eye.setAttribute("aria-pressed", String(showing));
      this.wrapper.classList.toggle("is-hidden", !showing);
    }
    /* ---------------------------------------------------------------- *
     * Interno                                                           *
     * ---------------------------------------------------------------- */
    _template(given) {
      if (this.isCurrency) return "";
      const chars = given ?? clear(this.input.value, [].concat(this.templates).join(""));
      return pickTemplate(chars, this.templates);
    }
    _wire() {
      const input = this.input;
      if (!input.getAttribute("inputmode")) {
        input.setAttribute("inputmode", this.isCurrency || !/[A*]/.test([].concat(this.templates).join("")) ? "numeric" : "text");
      }
      input.setAttribute("autocomplete", input.getAttribute("autocomplete") || "off");
      this._cleanups.push(
        on(input, "input", (e) => this._onType(e)),
        on(input, "blur", () => {
          if (this.opts.validate) this._validate();
        }),
        on(input, "focus", () => this._mark(true))
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
      if (this.opts.validate) this._mark(true);
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
      this._mark(ok);
      return ok;
    }
    /**
     * Marca o campo. setCustomValidity faz o formulario do navegador barrar o
     * submit sozinho, sem o projeto escrever nada.
     */
    _mark(ok) {
      const msg = ok ? "" : this.opts.errorText || this.preset?.error || "Valor inv\xE1lido";
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
    error: ICON_ALERT,
    loading: ICON_SPINNER
  };
  var DURATION = { info: 4e3, success: 3500, warning: 6e3, error: 8e3, loading: null };
  var containers = /* @__PURE__ */ new Map();
  function container(position) {
    if (containers.has(position)) return containers.get(position);
    const node = el("div", {
      class: `tuc-toasts is-${position}`,
      role: "region",
      "aria-label": "Notifica\xE7\xF5es"
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
  var seq2 = 0;
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
      if (this.opts.duration === void 0) {
        this.opts.duration = this.opts.type in DURATION ? DURATION[this.opts.type] : 4e3;
      }
      this.id = nextId("toast");
      this._cleanups = [];
      this._build();
    }
    /** Os filhos do toast. Sai do _montar para que atualizar() reaproveite. */
    _content() {
      const { type, title, text, closable, action } = this.opts;
      return [
        el("span", { class: "tuc-toast__icon" }, [icon(ICON[type] ?? ICON.info, 17)]),
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
      const anterior = this.opts.type;
      this.opts = { ...this.opts, ...omitUndefined(options) };
      const { type } = this.opts;
      if (options.duration === void 0 && type !== anterior) {
        this.opts.duration = type in DURATION ? DURATION[type] : 4e3;
      }
      this.node.classList.replace(`is-${anterior}`, `is-${type}`);
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
      this.node.dataset.seq = String(++seq2);
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
        this.node.dispatchEvent(new CustomEvent("tucano:toast-fechado"));
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
    const t = toast.loading(loading ?? "Carregando...", rest);
    const render = (v, data, fallback) => {
      const r = typeof v === "function" ? v(data) : v;
      return r ?? fallback;
    };
    Promise.resolve(promise).then(
      (data) => t.update({ type: "success", text: render(success, data, "Pronto") }),
      (failure) => t.update({ type: "error", text: render(error, failure, "Algo deu errado") })
    );
    return promise;
  };
  var DJANGO_MAP = { debug: "info", info: "info", success: "success", warning: "warning", error: "error" };
  function autoInit6(scope = document) {
    const out = [];
    for (const node of scope.querySelectorAll("[data-tuc-toast]:not([data-tuc-ready])")) {
      node.setAttribute("data-tuc-ready", "");
      const d = node.dataset;
      const raw = (d.type || "info").trim().split(/\s+/)[0];
      out.push(toast({
        type: DJANGO_MAP[raw] ?? raw,
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
      const toque = () => window.matchMedia?.("(pointer: coarse)").matches;
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
          if (toque()) this.isOpen ? this._hide() : this._show();
        }),
        on(document, "keydown", (e) => {
          if (e.key === "Escape" && this.isOpen) this._hide();
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
      openWithTransition(this.panel);
    }
    _hide() {
      clearTimeout(this._timer);
      if (!this.isOpen) return;
      this.isOpen = false;
      if (isOpen === this) isOpen = null;
      this.panel.classList.remove("is-open");
      this.popover?.destroy();
      this.popover = null;
    }
    setText(text) {
      this.opts.text = text;
      this.panel.textContent = text;
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
  var EXIT_MS2 = 160;
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
      if (!this._adopted) document.body.append(this.node);
      this.node.showModal();
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
        this.node.classList.remove("is-closing");
        if (this.node.open) this.node.close();
        if (!this._adopted) this.node.remove();
        this.opts.onClose?.(reason, this);
      }, EXIT_MS2);
      return this;
    }
    /** Conteudo livre no corpo: um form do Django, uma tabela, o que for. */
    content(no) {
      this.body?.replaceChildren(...(Array.isArray(no) ? no : [no]).filter(Boolean));
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
          if (this.opts.closeOnBackdrop && e.target === this.node) this.close("fundo");
        })
      );
    }
  };
  function buildPanel(prefix, opts, owner, titleId) {
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
          "aria-label": "Fechar",
          onclick: () => owner.close("botao")
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
    // [{ texto, variante, onClick, fecha }]
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
      this.panel = buildPanel("tuc-modal", this.opts, this, titleId);
      this.node = el("dialog", {
        class: [
          "tuc-modal",
          `is-${this.opts.size}`,
          `is-${this.opts.tone}`,
          this.opts.sheet ? "is-sheet" : "",
          this.opts.className
        ].filter(Boolean).join(" "),
        id: this.id,
        // O titulo nomeia o dialogo; sem titulo o proprio texto serve.
        ...this.opts.title ? { "aria-labelledby": titleId } : {}
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
    const { confirm: okLabel = "Confirmar", cancel = "Cancelar", ...rest } = options;
    const tone = rest.tone ?? "danger";
    return new Promise((resolve) => {
      let decided = false;
      const responder = (v) => {
        decided = true;
        resolve(v);
      };
      new Modal({
        ...rest,
        tone,
        actions: [
          { text: cancel, variant: "outline", onClick: () => responder(false) },
          { text: okLabel, variant: tone === "danger" ? "danger" : "primary", onClick: () => responder(true) }
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
        b.addEventListener("click", () => m.close("botao"));
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
      this.panel = buildPanel("tuc-drawer", this.opts, this, titleId);
      this.node = el("dialog", {
        class: [
          "tuc-drawer",
          `is-${this.opts.side}`,
          `is-${this.opts.size}`,
          `is-${this.opts.tone}`,
          this.opts.className
        ].filter(Boolean).join(" "),
        id: this.id,
        ...this.opts.title ? { "aria-labelledby": titleId } : {}
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
        b.addEventListener("click", () => g.close("botao"));
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
      item._tucTeardown = () => {
        teardown();
        item.classList.remove("is-closing");
      };
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

  // src/js/components/dropdown.js
  var DEFAULTS11 = {
    placement: "bottom-start",
    items: null,
    // [{ texto, icone, atalho, onClick, href, variante, desabilitado }]
    // ou { separador: true } / { rotulo: 'Seção' }
    closeOnPick: true
  };
  var FOCUSABLE2 = '.tuc-dropdown__item:not([disabled]):not([aria-disabled="true"])';
  var Dropdown = class {
    constructor(trigger, options = {}) {
      this.trigger = typeof trigger === "string" ? document.querySelector(trigger) : trigger;
      if (!this.trigger) throw new Error("[Dropdown] gatilho n\xE3o encontrado");
      this.opts = { ...DEFAULTS11, ...omitUndefined(options) };
      this._cleanups = [];
      this._build();
    }
    _build() {
      this.panel = this.opts.panel ?? el(
        "div",
        { class: "tuc-dropdown", role: "menu" },
        (this.opts.items ?? []).map((i) => this._item(i))
      );
      this.panel.classList.add("tuc-dropdown");
      this.panel.setAttribute("role", "menu");
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
        role: "menuitem",
        // tabindex -1 de proposito: quem navega e a seta, nao o Tab. Deixar os
        // itens tabulaveis faria o Tab sair do menu item a item.
        tabindex: "-1",
        ...data.href ? { href: data.href } : { type: "button" },
        ...data.disabled ? { "aria-disabled": "true" } : {},
        ...data.disabled ? {} : { onclick: () => data.onClick?.(this) }
      }, children);
    }
    get items() {
      return [...this.panel.querySelectorAll(FOCUSABLE2)];
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
        Escape: () => this.close(),
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
      openWithTransition(this.panel);
      this._move(0, true);
      return this;
    }
    close() {
      if (!this.isOpen) return this;
      this.isOpen = false;
      this.trigger.setAttribute("aria-expanded", "false");
      this.panel.classList.remove("is-open");
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
  function autoInit11(scope = document) {
    const out = [];
    for (const trigger of scope.querySelectorAll("[data-tuc-dropdown]:not([data-tuc-ready])")) {
      trigger.setAttribute("data-tuc-ready", "");
      const panel = document.querySelector(trigger.dataset.tucDropdown);
      if (!panel) continue;
      panel.hidden = false;
      panel.remove();
      for (const item of panel.querySelectorAll(".tuc-dropdown__item")) {
        item.setAttribute("role", "menuitem");
        item.setAttribute("tabindex", "-1");
      }
      out.push(new Dropdown(trigger, {
        panel,
        placement: trigger.dataset.placement || void 0
      }));
    }
    return out;
  }

  // src/js/components/table.js
  var DEFAULTS12 = {
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
  var SETAS = "M7 15l5 5 5-5M7 9l5-5 5 5";
  var COMPARE = {
    number: (a, b) => parseFloat(a.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".") || 0) - parseFloat(b.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".") || 0),
    date: (a, b) => new Date(a).getTime() - new Date(b).getTime(),
    text: (a, b) => a.localeCompare(b, "pt-BR", { numeric: true, sensitivity: "base" })
  };
  var Table = class {
    constructor(node, options = {}) {
      this.node = typeof node === "string" ? document.querySelector(node) : node;
      if (!this.node) throw new Error("[Table] elemento alvo nao encontrado");
      if (this.node.tagName !== "TABLE") throw new Error("[Table] o alvo precisa ser uma <table>");
      this.opts = { ...DEFAULTS12, ...omitUndefined(options) };
      this.id = this.node.id || nextId("table");
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
      const noServidor = this.opts.sortMode !== "client";
      const atual = new URLSearchParams(location.search);
      const campoAtual = atual.get(this.opts.sortParam);
      const dirAtual = atual.get(this.opts.dirParam) === "desc" ? "descending" : "ascending";
      [...head.cells].forEach((th, i) => {
        const type = th.dataset.sort;
        if (!type || type === "none") return;
        const field = th.dataset.field || String(i);
        th.classList.add("tuc-table__sortable");
        const marcada = noServidor && campoAtual === field;
        th.setAttribute("aria-sort", marcada ? dirAtual : "none");
        const proxima = marcada && dirAtual === "ascending" ? "desc" : "asc";
        const filhos = [
          el("span", { text: th.textContent.trim() }),
          el("span", { class: "tuc-table__sorticon", "aria-hidden": "true" }, [icon(SETAS, 13)])
        ];
        const gatilho = noServidor ? el("a", { class: "tuc-table__sortbtn", href: this._sortHref(field, proxima) }, filhos) : el("button", { type: "button", class: "tuc-table__sortbtn" }, filhos);
        th.textContent = "";
        th.append(gatilho);
        this.sortable.push({ th, index: i, type, field });
        this._cleanups.push(on(gatilho, "click", (e) => this._onSortClick(e, th, i, type, field)));
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
      const noServidor = this.opts.sortMode !== "client";
      const anterior = th.getAttribute("aria-sort");
      const dir = anterior === "ascending" ? "descending" : "ascending";
      const detalhe = { column: index, field, direction: dir === "ascending" ? "asc" : "desc" };
      this.node.dispatchEvent(new CustomEvent("tuc:sort", { bubbles: true, detail: detalhe }));
      if (this.opts.onSort) {
        e.preventDefault();
        this.opts.onSort(detalhe, this);
        return;
      }
      if (noServidor) return;
      e.preventDefault();
      for (const s of this.sortable) s.th.setAttribute("aria-sort", "none");
      th.setAttribute("aria-sort", dir);
      this.sort(index, detalhe.direction, type);
    }
    /** Ordena as linhas visíveis. `type`: text | number | date. */
    sort(index, direction = "asc", type = "text") {
      const body = this.node.tBodies[0];
      if (!body) return this;
      const cmp = COMPARE[type] ?? COMPARE.text;
      const chave = (tr) => {
        const cell = tr.cells[index];
        return cell?.dataset.sortValue ?? cell?.textContent.trim() ?? "";
      };
      const sinal = direction === "desc" ? -1 : 1;
      const ordenadas = this.rows.sort((a, b) => sinal * cmp(chave(a), chave(b)));
      for (const tr of ordenadas) body.append(tr);
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
        "aria-label": "Selecionar todas as linhas desta p\xE1gina"
      });
      const th = el("th", { class: "tuc-table__pick", scope: "col" }, [this.checkAll]);
      head.prepend(th);
      for (const tr of this.rows) {
        const check = el("input", {
          type: "checkbox",
          class: "tuc-check tuc-table__check",
          name: this.opts.selectName,
          value: tr.dataset.id ?? "",
          "aria-label": "Selecionar linha"
        });
        const td = el("td", { class: "tuc-table__pick" }, [check]);
        tr.prepend(td);
        this._cleanups.push(on(check, "change", () => this._afterPick(tr, check.checked)));
      }
      this._cleanups.push(on(this.checkAll, "change", () => {
        const marcar = this.checkAll.checked;
        for (const tr of this.rows) {
          const c = tr.querySelector(".tuc-table__check");
          if (c) {
            c.checked = marcar;
            this._afterPick(tr, marcar);
          }
        }
      }));
    }
    _afterPick(tr, marcada) {
      tr.classList.toggle("is-selected", marcada);
      const todas = this.rows.map((r) => r.querySelector(".tuc-table__check")).filter(Boolean);
      const marcadas = todas.filter((c) => c.checked);
      if (this.checkAll) {
        this.checkAll.checked = marcadas.length === todas.length && todas.length > 0;
        this.checkAll.indeterminate = marcadas.length > 0 && marcadas.length < todas.length;
      }
      const detalhe = { selected: this.getSelected(), row: tr };
      this.node.dispatchEvent(new CustomEvent("tuc:select", { bubbles: true, detail: detalhe }));
      this.opts.onSelect?.(detalhe, this);
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
  function autoInit12(scope = document) {
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
  var DEFAULTS13 = {
    page: 1,
    pages: 1,
    param: "page",
    around: 1,
    // paginas visiveis de cada lado da atual
    edges: 1,
    // paginas visiveis nas pontas
    prevText: "Anterior",
    nextText: "Pr\xF3xima",
    label: "Pagina\xE7\xE3o",
    onChange: null
  };
  var SETA_ESQ = "M15 18l-6-6 6-6";
  var SETA_DIR = "M9 18l6-6-6-6";
  function pageWindow(page, pages, { around = 1, edges = 1 } = {}) {
    const mostrar = /* @__PURE__ */ new Set();
    for (let i = 1; i <= Math.min(edges, pages); i++) mostrar.add(i);
    for (let i = Math.max(1, pages - edges + 1); i <= pages; i++) mostrar.add(i);
    for (let i = page - around; i <= page + around; i++) if (i >= 1 && i <= pages) mostrar.add(i);
    const ordenadas = [...mostrar].sort((a, b) => a - b);
    const saida = [];
    let anterior = 0;
    for (const n of ordenadas) {
      if (n - anterior === 2) saida.push(anterior + 1);
      else if (n - anterior > 2) saida.push(null);
      saida.push(n);
      anterior = n;
    }
    return saida;
  }
  var Pagination = class {
    constructor(options = {}) {
      this.opts = { ...DEFAULTS13, ...omitUndefined(options) };
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
    _item(page, { text, current = false, disabled = false, edge = false } = {}) {
      const classe = [
        "tuc-btn",
        current ? "is-outline" : "is-ghost",
        edge ? "tuc-pagination__edge" : "",
        disabled ? "is-disabled" : ""
      ].filter(Boolean).join(" ");
      const filhos = typeof text === "string" ? [text] : text;
      if (disabled) return el("span", { class: classe, "aria-hidden": "true" }, filhos);
      const a = el("a", {
        class: classe,
        href: this.href(page),
        ...current ? { "aria-current": "page" } : {}
      }, filhos);
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
        text: [
          el("span", { class: "tuc-pagination__ico", "aria-hidden": "true" }, [icon(SETA_ESQ, 15)]),
          el("span", { class: "tuc-pagination__word", text: this.opts.prevText })
        ],
        disabled: page <= 1,
        edge: true
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
          el("span", { class: "tuc-pagination__ico", "aria-hidden": "true" }, [icon(SETA_DIR, 15)])
        ],
        disabled: page >= pages,
        edge: true
      }));
      return this;
    }
    /** Troca a página mostrada como atual — para quem navega sem recarregar. */
    setPage(page) {
      this.opts.page = Math.min(Math.max(1, page), this.opts.pages);
      return this.render();
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
  function autoInit13(scope = document) {
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
  var EQUIVALENTS = { B: "STRONG", I: "EM" };
  var ALIGNMENTS = /* @__PURE__ */ new Set(["left", "center", "right", "justify"]);
  var ALIGNABLE = /* @__PURE__ */ new Set(["P", "H2", "H3", "LI", "BLOCKQUOTE", "TD", "TH"]);
  function copyAlignment(de, para) {
    if (!ALIGNABLE.has(para.tagName)) return;
    const value = (de.style?.textAlign || "").toLowerCase();
    if (ALIGNMENTS.has(value)) para.setAttribute("style", `text-align: ${value}`);
  }
  function safeUrl(url) {
    const plain = (url || "").trim();
    return /^(https?:|mailto:|tel:|#|\/)/i.test(plain) ? plain : "";
  }
  function clearNode(no, destination, doc) {
    for (const child of [...no.childNodes]) {
      if (child.nodeType === Node.TEXT_NODE) {
        destination.append(doc.createTextNode(child.nodeValue));
        continue;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) continue;
      const tag = child.tagName;
      if (tag === "SCRIPT" || tag === "STYLE" || tag === "IFRAME" || tag === "OBJECT") continue;
      if (TRANSPARENT.has(tag) || !ALLOWED.has(tag)) {
        clearNode(child, destination, doc);
        continue;
      }
      const novo = doc.createElement(EQUIVALENTS[tag] || tag);
      copyAlignment(child, novo);
      if (novo.tagName === "A") {
        const href = safeUrl(child.getAttribute("href"));
        if (!href) {
          clearNode(child, destination, doc);
          continue;
        }
        novo.setAttribute("href", href);
        novo.setAttribute("target", "_blank");
        novo.setAttribute("rel", "noopener noreferrer");
      }
      clearNode(child, novo, doc);
      destination.append(novo);
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
  function textOnly(html) {
    const doc = document.implementation.createHTMLDocument("");
    const d = doc.createElement("div");
    d.innerHTML = String(html ?? "");
    return d.textContent || "";
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
    "from",
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
    "func",
    "let"
  ].join("|");
  var RULES = [
    ["coment", /(&lt;!--[\s\S]*?--&gt;|\/\*[\s\S]*?\*\/|\/\/[^\n]*|#[^\n]*)/],
    ["text", /("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`)/],
    ["tmpl", /(\{%[\s\S]*?%\}|\{\{[\s\S]*?\}\})/],
    ["tag", /(&lt;\/?[a-zA-Z][\w-]*)/],
    ["attr", /([a-zA-Z-][\w-]*)(?==)/],
    ["num", /\b(\d+(?:\.\d+)?)\b/],
    /*
     * As palavras entram na mesma expressao, e nao numa segunda passada.
     *
     * Separadas, elas eram procuradas de novo no HTML que a primeira passada
     * acabara de gerar — e `class` esta na list, entao a palavra era encontrada
     * dentro do atributo `class="tuc-tok-attr"` e envolvida outra vez. O
     * resultado era marcacao aninhada quebrada, que o navegador mostrava como
     * text solto no meio do codigo.
     */
    ["key", new RegExp(`\\b(${WORDS})\\b`)]
  ];
  var COMBINADA = new RegExp(RULES.map(([, re]) => re.source).join("|"), "g");
  function highlight(code) {
    const text = escapeHtml(code ?? "");
    return text.replace(COMBINADA, (todo, ...grupos) => {
      const i = grupos.findIndex((g) => g !== void 0);
      const className = RULES[i]?.[0];
      return className ? `<span class="tuc-tok-${className}tuc-tok-${className}tuc-tok-${className}tuc-tok-${className}tuc-tok-${className}tuc-tok-${className}tuc-tok-${className}tuc-tok-${className}">${todo}</span>` : todo;
    });
  }
  function autoInit14(scope = document) {
    const blocks = [...scope.querySelectorAll(".tuc-prose pre > code:not([data-tuc-painted])")];
    for (const code of blocks) {
      code.setAttribute("data-tuc-painted", "");
      code.innerHTML = highlight(code.textContent);
    }
    return blocks;
  }

  // src/js/components/editor.js
  var DEFAULTS14 = {
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
  var LABELS = {
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
    code: "C\xF3digo"
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
    code: () => toggleCode()
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
    justify: "justifyFull"
  };
  var ANCESTORS = {
    title: "h2",
    subheading: "h3",
    quote: "blockquote",
    code: "pre, code",
    link: "a",
    table: "table"
  };
  var SHORTCUTS = { b: "bold", i: "italic", u: "underline", k: "link" };
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
      sel.removeAllRanges();
      sel.addRange(r);
      if (target.tagName === "PRE") {
        const block = document.createDocumentFragment();
        for (const row of text2.split("\n")) {
          const par = document.createElement("p");
          if (row) par.textContent = row;
          else par.append(document.createElement("br"));
          block.append(par);
        }
        const first = block.firstChild;
        target.replaceWith(block);
        if (first) {
          const pos = document.createRange();
          pos.selectNodeContents(first);
          pos.collapse(true);
          sel.removeAllRanges();
          sel.addRange(pos);
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
  function buildTable(doc, rows, cols) {
    const cel = (tag) => {
      const c = doc.createElement(tag);
      c.append(doc.createElement("br"));
      return c;
    };
    const table = doc.createElement("table");
    const thead = doc.createElement("thead");
    const trCab = doc.createElement("tr");
    for (let c = 0; c < cols; c++) trCab.append(cel("th"));
    thead.append(trCab);
    const tbody = doc.createElement("tbody");
    for (let l = 0; l < rows - 1; l++) {
      const tr = doc.createElement("tr");
      for (let c = 0; c < cols; c++) tr.append(cel("td"));
      tbody.append(tr);
    }
    table.append(thead, tbody);
    return table;
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
  var TABLE_LABELS = {
    rowAbove: "Inserir linha acima",
    rowBelow: "Inserir linha abaixo",
    colBefore: "Inserir coluna \xE0 esquerda",
    colAfter: "Inserir coluna \xE0 direita",
    deleteRow: "Excluir linha",
    deleteColumn: "Excluir coluna",
    deleteTable: "Excluir tabela"
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
    const nova = document.createElement("tr");
    for (let i = 0; i < row.children.length; i++) nova.append(emptyCell("td"));
    const body = cell.closest("table").querySelector("tbody");
    if (row.parentElement.tagName === "THEAD" && body) {
      after ? body.prepend(nova) : body.prepend(nova);
    } else {
      row.parentElement.insertBefore(nova, after ? row.nextSibling : row);
    }
    return nova.firstElementChild;
  }
  function insertColumn(cell, after) {
    const i = [...cell.parentElement.children].indexOf(cell);
    for (const row of cell.closest("table").querySelectorAll("tr")) {
      const model = row.children[i];
      const nova = emptyCell(model?.tagName === "TH" ? "th" : "td");
      row.insertBefore(nova, after ? model?.nextSibling : model);
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
    const s = window.getSelection();
    s.removeAllRanges();
    s.addRange(r);
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
    let no;
    while (no = step.nextNode()) {
      if (counted + no.length >= howMany) {
        const r = document.createRange();
        r.setStart(no, howMany - counted);
        r.collapse(true);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(r);
        return;
      }
      counted += no.length;
    }
  }
  var Editor = class {
    constructor(target, options = {}) {
      this.field = typeof target === "string" ? document.querySelector(target) : target;
      if (!this.field) throw new Error("[Editor] elemento n\xE3o encontrado");
      this.opts = { ...DEFAULTS14, ...omitUndefined(options) };
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
      const GROUPS = /* @__PURE__ */ new Set(["left", "quote"]);
      this.toolbar = el(
        "div",
        { class: "tuc-editor__toolbar", role: "toolbar", "aria-label": "Formata\xE7\xE3o" },
        this.opts.toolbar.flatMap((name) => {
          const b = el("button", {
            type: "button",
            class: "tuc-btn is-ghost is-icon is-sm",
            "aria-label": LABELS[name] ?? name,
            "data-tuc-tip": LABELS[name] ?? name,
            "aria-pressed": "false",
            // mousedown e nao click: click viria depois do blur, e a selecao
            // dentro da area ja teria sido perdida.
            onmousedown: (e) => {
              e.preventDefault();
              this.apply(name);
            }
          }, [icon(ICONS[name] ?? ICONS.clear, 15)]);
          b.dataset.action = name;
          return GROUPS.has(name) ? [el("span", { class: "tuc-editor__sep", "aria-hidden": "true" }), b] : [b];
        })
      );
      this.tableBar = el("div", {
        class: "tuc-editor__toolbar is-table",
        role: "toolbar",
        "aria-label": "Tabela",
        hidden: true
      }, Object.keys(TABLE).map((name) => el("button", {
        type: "button",
        class: `tuc-btn is-ghost is-icon is-sm${name.startsWith("remove") ? " is-remove" : ""}`,
        "aria-label": TABLE_LABELS[name],
        "data-tuc-tip": TABLE_LABELS[name],
        onmousedown: (e) => {
          e.preventDefault();
          this.inTable(name);
        }
      }, [icon(TABLE_ICONS[name], 15)])));
      this.root = el("div", { class: "tuc-editor" }, [this.toolbar, this.tableBar, this.area]);
      field.parentNode.insertBefore(this.root, field);
      this.root.append(field);
      field.hidden = true;
      field.classList.add("tuc-editor__value");
      this._cleanups.push(
        on(this.area, "input", () => {
          this._sync();
          this._schedulePaint();
        }),
        on(this.area, "blur", () => this._sync()),
        on(this.area, "paste", (e) => this._paste(e)),
        on(this.area, "keydown", (e) => this._onKey(e)),
        on(this.area, "keyup", () => this._markActive()),
        on(this.area, "mouseup", () => this._markActive()),
        // selectionchange e global: e o unico evento que pega o cursor mudando
        // de lugar por qualquer caminho, inclusive clique fora e volta.
        on(document, "selectionchange", () => {
          this._syncTableBar();
          this._markActive();
        })
      );
      this._paint();
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
        const raw = code.textContent;
        const painted = highlight(raw);
        if (code.innerHTML === painted) continue;
        const where = offsetInBlock(code);
        code.innerHTML = painted;
        restoreOffset(code, where);
      }
    }
    /* O textarea escondido e a fonte da verdade para o formulario. */
    _sync() {
      const plain = sanitize(this.area.innerHTML);
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
      const text = e.clipboardData?.getData("text/plain") ?? textOnly(e.clipboardData?.getData("text/html"));
      document.execCommand("insertText", false, text);
    }
    _onKey(e) {
      if (e.key === "Tab") {
        const cell = window.getSelection()?.anchorNode?.parentElement?.closest?.("th, td");
        if (cell) {
          e.preventDefault();
          let target = nextCell(cell, e.shiftKey);
          if (!target && !e.shiftKey) {
            const body = cell.closest("table").querySelector("tbody") || cell.closest("table");
            const model = body.querySelector("tr") || cell.parentElement;
            const nova = document.createElement("tr");
            for (let i = 0; i < model.children.length; i++) {
              const td = document.createElement("td");
              td.append(document.createElement("br"));
              nova.append(td);
            }
            body.append(nova);
            target = nova.firstElementChild;
            this._sync();
          }
          if (target) {
            const r = document.createRange();
            r.selectNodeContents(target);
            r.collapse(true);
            const s = window.getSelection();
            s.removeAllRanges();
            s.addRange(r);
          }
          return;
        }
      }
      const t = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && SHORTCUTS[t]) {
        e.preventDefault();
        this.apply(SHORTCUTS[t]);
      }
    }
    /* Botao aceso quando o cursor esta dentro daquela formatacao. */
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
      this.area.focus({ preventScroll: true });
    }
    /* Elemento em volta do cursor, dentro da area. */
    _currentNode() {
      const sel = window.getSelection();
      if (!sel?.anchorNode || !this.area.contains(sel.anchorNode)) return null;
      return sel.anchorNode.nodeType === Node.ELEMENT_NODE ? sel.anchorNode : sel.anchorNode.parentElement;
    }
    _markActive() {
      const no = this._currentNode();
      for (const b of this.toolbar.querySelectorAll("[data-action]")) {
        const action = b.dataset.action;
        const cmd = STATES[action];
        const selector = ANCESTORS[action];
        if (!cmd && !selector) continue;
        let active = false;
        if (cmd) {
          try {
            active = document.queryCommandState(cmd);
          } catch {
          }
        } else if (no) {
          active = !!no.closest?.(selector);
        }
        b.setAttribute("aria-pressed", String(active));
        b.classList.toggle("is-active", active);
      }
    }
    /** Celula onde o cursor esta, ou nada. */
    _currentCell() {
      const sel = window.getSelection();
      if (!sel?.anchorNode || !this.area.contains(sel.anchorNode)) return null;
      const no = sel.anchorNode.nodeType === Node.ELEMENT_NODE ? sel.anchorNode : sel.anchorNode.parentElement;
      const cell = no?.closest?.("th, td") ?? null;
      return cell && this.area.contains(cell) ? cell : null;
    }
    _syncTableBar() {
      const inside = !!this._currentCell();
      if (this.tableBar.hidden !== !inside) this.tableBar.hidden = !inside;
    }
    /** Operacao de tabela na celula onde o cursor esta. */
    inTable(name) {
      const cell = this._currentCell();
      if (!cell) return this;
      const destination = TABLE[name]?.(cell);
      this._focus();
      focusCell(destination);
      this._sync();
      this._syncTableBar();
      return this;
    }
    apply(name) {
      this._focus();
      if (name === "table") {
        const { rows, cols } = this.opts.table;
        const table = buildTable(document, rows, cols);
        const sel = window.getSelection();
        const inside = this._currentCell()?.closest("table");
        if (inside) {
          inside.after(table);
          const p = document.createElement("p");
          p.append(document.createElement("br"));
          table.after(p);
          focusCell(table.querySelector("th"));
          this._sync();
          return this;
        }
        if (sel?.rangeCount) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          range.insertNode(table);
          const p = document.createElement("p");
          p.append(document.createElement("br"));
          table.after(p);
          const first = table.querySelector("th");
          if (first) {
            const r = document.createRange();
            r.selectNodeContents(first);
            r.collapse(true);
            sel.removeAllRanges();
            sel.addRange(r);
          }
        }
        this._sync();
        return this;
      }
      if (name === "link") {
        this._askForLink();
        return this;
      }
      COMMANDS[name]?.();
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
      const restoreSelection = () => {
        this.area.focus({ preventScroll: true });
        if (!mark) return;
        const s = window.getSelection();
        s.removeAllRanges();
        s.addRange(mark);
      };
      let decided = null;
      const actions = [{ text: "Cancelar", variant: "outline" }];
      if (existing) {
        actions.push({ text: "Remover", variant: "ghost", onClick: () => {
          decided = "remove";
        } });
      }
      actions.push({
        text: existing ? "Salvar" : "Inserir",
        variant: "primary",
        onClick: () => {
          decided = field.value.trim();
        }
      });
      const dialog = new Modal({
        title: existing ? "Editar link" : "Inserir link",
        size: "sm",
        actions,
        onClose: () => {
          if (!decided) return;
          {
            if (decided === "remove") {
              this.area.focus({ preventScroll: true });
              const r = document.createRange();
              r.selectNodeContents(existing);
              const sel2 = window.getSelection();
              sel2.removeAllRanges();
              sel2.addRange(r);
              document.execCommand("unlink");
            } else {
              restoreSelection();
              if (decided !== "https://") document.execCommand("createLink", false, decided);
            }
            this._sync();
            this._markActive();
          }
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
      return sanitize(this.area.innerHTML);
    }
    setValue(html) {
      this.area.innerHTML = sanitize(html) || "<p><br></p>";
      this._paint();
      this._sync();
      return this;
    }
    destroy() {
      this._cleanups.forEach((fn) => fn());
      this.field.hidden = false;
      this.root.parentNode?.insertBefore(this.field, this.root);
      this.root.remove();
    }
  };
  function autoInit15(scope = document) {
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
      dropdowns: autoInit11(scope),
      tables: autoInit12(scope),
      pagination: autoInit13(scope),
      editors: autoInit15(scope),
      prose: autoInit14(scope),
      // Por último de propósito: componentes que criam a própria barra de botões
      // marcam neles `data-tuc-tip`, e esses elementos só existem depois que eles
      // se montam. Antes, os botões do editor nasciam sem dica.
      tooltips: autoInit7(scope)
    };
  }

  // src/js/auto.js
  if (typeof document !== "undefined") {
    const boot = () => {
      listenForEvents();
      init(document);
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
    document.addEventListener("htmx:afterSwap", (e) => init(e.target));
  }
  return __toCommonJS(auto_exports);
})();
