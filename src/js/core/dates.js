/**
 * Utilitarios de data. Sem dependencias: usa Intl para nomes/ordem de locale.
 * Toda data e tratada como "meia-noite local" — sem UTC, sem timezone shifting,
 * que e a origem classica do bug de "um dia a menos".
 */

export const MS_DAY = 86400000;

/** Novo Date normalizado para 00:00:00 local. */
export function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function isValid(d) {
  return d instanceof Date && !Number.isNaN(d.getTime());
}

export function clone(d) {
  return new Date(d.getTime());
}

export function addDays(d, n) {
  const x = clone(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function addMonths(d, n) {
  const x = clone(d);
  const day = x.getDate();
  x.setDate(1);
  x.setMonth(x.getMonth() + n);
  // Preserva o dia sem estourar para o mes seguinte (31 jan + 1 mes = 28/29 fev).
  x.setDate(Math.min(day, daysInMonth(x.getFullYear(), x.getMonth())));
  return x;
}

export function addYears(d, n) {
  return addMonths(d, n * 12);
}

export function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

export function startOfMonth(d) {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
}

export function endOfMonth(d) {
  const x = startOfDay(d);
  x.setMonth(x.getMonth() + 1, 0);
  return x;
}

/** Compara apenas ano/mes/dia. Retorna -1, 0 ou 1. */
export function compareDay(a, b) {
  const av = a.getFullYear() * 10000 + a.getMonth() * 100 + a.getDate();
  const bv = b.getFullYear() * 10000 + b.getMonth() * 100 + b.getDate();
  return av === bv ? 0 : av < bv ? -1 : 1;
}

export function isSameDay(a, b) {
  return isValid(a) && isValid(b) && compareDay(a, b) === 0;
}

export function isSameMonth(a, b) {
  return isValid(a) && isValid(b) && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function isBetween(d, start, end) {
  return compareDay(d, start) >= 0 && compareDay(d, end) <= 0;
}

export function clampDate(d, min, max) {
  if (min && compareDay(d, min) < 0) return clone(min);
  if (max && compareDay(d, max) > 0) return clone(max);
  return d;
}

/** Copia hora/minuto/segundo de `time` para o dia de `day`. */
export function withTime(day, time) {
  const x = clone(day);
  x.setHours(time.getHours(), time.getMinutes(), time.getSeconds(), 0);
  return x;
}

/**
 * Grade de 6 semanas (42 celulas) cobrindo o mes, sempre do mesmo tamanho
 * para o calendario nao "pular de altura" ao trocar de mes.
 */
export function buildMonthGrid(year, month, firstDayOfWeek = 0) {
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

/* ------------------------------------------------------------------ *
 * Locale                                                              *
 * ------------------------------------------------------------------ */

const localeCache = new Map();

/** Nomes de mes/dia e primeiro dia da semana para um locale, memoizados. */
export function getLocaleData(locale) {
  if (localeCache.has(locale)) return localeCache.get(locale);

  const monthsLong = [];
  const monthsShort = [];
  const fmtLong = new Intl.DateTimeFormat(locale, { month: 'long' });
  const fmtShort = new Intl.DateTimeFormat(locale, { month: 'short' });
  for (let m = 0; m < 12; m++) {
    const d = new Date(2021, m, 1);
    monthsLong.push(capitalize(fmtLong.format(d)));
    monthsShort.push(capitalize(fmtShort.format(d).replace('.', '')));
  }

  // 2021-08-01 foi um domingo: base estavel para gerar os nomes na ordem certa.
  const weekdaysNarrow = [];
  const weekdaysShort = [];
  const fmtNarrow = new Intl.DateTimeFormat(locale, { weekday: 'narrow' });
  const fmtWdShort = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  for (let i = 0; i < 7; i++) {
    const d = new Date(2021, 7, 1 + i);
    weekdaysNarrow.push(fmtNarrow.format(d).toUpperCase());
    weekdaysShort.push(capitalize(fmtWdShort.format(d).replace('.', '')));
  }

  const data = {
    monthsLong,
    monthsShort,
    weekdaysNarrow,
    weekdaysShort,
    firstDayOfWeek: resolveFirstDayOfWeek(locale),
    hour12: resolveHour12(locale),
  };
  localeCache.set(locale, data);
  return data;
}

/** Intl.Locale.getWeekInfo e recente; cai para heuristica quando ausente. */
function resolveFirstDayOfWeek(locale) {
  try {
    const loc = new Intl.Locale(locale);
    const info = typeof loc.getWeekInfo === 'function' ? loc.getWeekInfo() : loc.weekInfo;
    if (info && info.firstDay) return info.firstDay === 7 ? 0 : info.firstDay;
  } catch { /* ignora */ }
  const lang = String(locale).toLowerCase();
  const sundayFirst = ['en-us', 'en-ca', 'ja', 'pt-br', 'es-mx', 'ko', 'zh-cn', 'he', 'ar'];
  return sundayFirst.some((l) => lang.startsWith(l)) ? 0 : 1;
}

function resolveHour12(locale) {
  try {
    const parts = new Intl.DateTimeFormat(locale, { hour: 'numeric' }).formatToParts(new Date(2021, 0, 1, 13));
    return parts.some((p) => p.type === 'dayPeriod');
  } catch {
    return false;
  }
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ------------------------------------------------------------------ *
 * Formatacao e parsing                                                *
 * ------------------------------------------------------------------ */

const pad = (n, len = 2) => String(n).padStart(len, '0');

/**
 * Formata via tokens. Suporta: yyyy yy MMMM MMM MM M dd d EEEE EEE HH H mm ss a
 * Texto entre aspas simples e literal: "'de' MMMM".
 */
export function format(date, pattern, locale = 'pt-BR') {
  if (!isValid(date)) return '';
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
    EEEE: () => new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(date),
    EEE: () => L.weekdaysShort[date.getDay()],
    HH: () => pad(date.getHours()),
    H: () => String(date.getHours()),
    hh: () => pad(h12),
    h: () => String(h12),
    mm: () => pad(date.getMinutes()),
    m: () => String(date.getMinutes()),
    ss: () => pad(date.getSeconds()),
    s: () => String(date.getSeconds()),
    a: () => (date.getHours() < 12 ? 'AM' : 'PM'),
  };
  const tokens = Object.keys(map).sort((a, b) => b.length - a.length);
  const re = new RegExp(`'[^']*'|${tokens.join('|')}`, 'g');
  return pattern.replace(re, (t) => (t.startsWith("'") ? t.slice(1, -1) : map[t]()));
}

/** ISO local (sem timezone) — o formato que o Django espera em DateField/DateTimeField. */
export function toISODate(date) {
  return isValid(date) ? `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` : '';
}

export function toISODateTime(date, seconds = false) {
  if (!isValid(date)) return '';
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}${seconds ? `:${pad(date.getSeconds())}` : ''}`;
  return `${toISODate(date)}T${time}`;
}

/** Le "yyyy-mm-dd", "yyyy-mm-ddTHH:MM" ou qualquer coisa que o Date aceite. */
export function parseISO(value) {
  if (!value) return null;
  if (value instanceof Date) return isValid(value) ? value : null;
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(String(value).trim());
  if (m) {
    const d = new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
    return isValid(d) ? d : null;
  }
  const d = new Date(value);
  return isValid(d) ? d : null;
}

/**
 * Parse tolerante do que o usuario digita: aceita 25/12/2025, 25-12-2025,
 * 25122025 e 2512 (ano corrente), respeitando a ordem dia/mes do locale.
 */
export function parseUserInput(text, locale = 'pt-BR', reference = new Date()) {
  let raw = String(text || '').trim();
  if (!raw) return null;

  const iso = /^\d{4}-\d{2}-\d{2}/.test(raw) ? parseISO(raw) : null;
  if (iso) { iso.hasTime = /[T ]\d{2}:\d{2}/.test(raw); return iso; }

  // Tira a hora antes de olhar a data, senao "10/09/2026 09:00" viraria dia 10/09/09.
  let time = null;
  raw = raw.replace(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?/i, (_, h, m, sec, period) => {
    let hours = +h;
    if (period) hours = (hours % 12) + (period.toLowerCase() === 'pm' ? 12 : 0);
    time = { h: hours, m: +m, s: +(sec || 0) };
    return ' ';
  }).trim();
  if (!raw && time) return null;

  const digits = raw.replace(/\D/g, '');
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

  if (year === undefined) year = reference.getFullYear();
  else if (year < 100) year += year < 70 ? 2000 : 1900;

  if (!(month >= 1 && month <= 12)) return null;
  if (!(day >= 1 && day <= daysInMonth(year, month - 1))) return null;

  const out = new Date(year, month - 1, day, time ? time.h : 0, time ? time.m : 0, time ? time.s : 0);
  // Marca se o texto trazia hora, para quem chama decidir se preserva a anterior.
  out.hasTime = !!time;
  return out;
}

/** Descobre se o locale escreve mes antes do dia (en-US) ou dia antes (pt-BR). */
export function isMonthFirst(locale) {
  try {
    const parts = new Intl.DateTimeFormat(locale).formatToParts(new Date(2021, 0, 2));
    const order = parts.filter((p) => p.type === 'day' || p.type === 'month').map((p) => p.type);
    return order[0] === 'month';
  } catch {
    return false;
  }
}

/** Padrao numerico do locale, usado como formato de exibicao default. */
export function localeDatePattern(locale) {
  return isMonthFirst(locale) ? 'MM/dd/yyyy' : 'dd/MM/yyyy';
}
