/**
 * Conversoes de cor. Sem dependencias.
 *
 * A representacao interna e HSVA — e o espaco que os controles manipulam
 * (area de saturacao/valor, trilha de matiz). RGB e hex sao so entrada e saida:
 * converter a cada movimento perderia a matiz quando a saturacao chega a zero.
 */

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

const round = (n) => Math.round(n * 255);
const hex2 = (n) => n.toString(16).padStart(2, '0');

/** h em graus [0,360); s, v e a em [0,1]. */
export function hsvToRgb({ h, s, v }) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  const sector = Math.floor(h / 60) % 6;
  const [r, g, b] = [
    [c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x],
  ][sector];
  return { r: round(r + m), g: round(g + m), b: round(b + m) };
}

export function rgbToHsv({ r, g, b }) {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;

  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

export function rgbToHex({ r, g, b }, a = 1) {
  const base = `#${hex2(r)}${hex2(g)}${hex2(b)}`;
  return a >= 1 ? base : base + hex2(Math.round(a * 255));
}

/**
 * Le hex (#rgb, #rgba, #rrggbb, #rrggbbaa), rgb()/rgba() e hsl()/hsla().
 * Devolve { h, s, v, a } ou null.
 */
export function parseColor(input) {
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
    return { ...rgbToHsv({ r: clamp(p[0], 0, 255), g: clamp(p[1], 0, 255), b: clamp(p[2], 0, 255) }),
             a: p[3] === undefined ? 1 : clamp(p[3], 0, 1) };
  }

  const hsl = /^hsla?\(([^)]+)\)$/.exec(text);
  if (hsl) {
    const p = hsl[1].replace(/%/g, '').split(/[\s,/]+/).filter(Boolean).map(Number);
    if (p.length < 3 || p.slice(0, 3).some(Number.isNaN)) return null;
    return { ...hslToHsv(p[0], p[1] / 100, p[2] / 100), a: p[3] === undefined ? 1 : clamp(p[3], 0, 1) };
  }

  return null;
}

function hslToHsv(h, s, l) {
  const v = l + s * Math.min(l, 1 - l);
  return { h: ((h % 360) + 360) % 360, s: v === 0 ? 0 : 2 * (1 - l / v), v };
}

/** Serializa no formato pedido: 'hex', 'rgb' ou 'hsl'. */
export function formatColor(hsva, format = 'hex') {
  const { r, g, b } = hsvToRgb(hsva);
  const a = Math.round(hsva.a * 100) / 100;

  if (format === 'rgb') {
    return a >= 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  if (format === 'hsl') {
    const { h, s, l } = hsvToHsl(hsva);
    const hs = `${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%`;
    return a >= 1 ? `hsl(${hs})` : `hsla(${hs}, ${a})`;
  }
  return rgbToHex({ r, g, b }, hsva.a);
}

export function hsvToHsl({ h, s, v }) {
  const l = v * (1 - s / 2);
  return { h, s: l === 0 || l === 1 ? 0 : (v - l) / Math.min(l, 1 - l), l };
}

/**
 * Luminancia relativa (WCAG). Serve para escolher texto claro ou escuro por
 * cima da cor — o olho nao le luminosidade como media aritmetica dos canais.
 */
export function luminance({ r, g, b }) {
  const canal = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

export function isDark(hsva) {
  return luminance(hsvToRgb(hsva)) < 0.4;
}
