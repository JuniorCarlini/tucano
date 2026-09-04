/** Helpers de DOM minimos, para nao repetir createElement em todo lugar. */

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'html') node.innerHTML = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else node.setAttribute(key, value === true ? '' : value);
  }
  for (const child of [].concat(children)) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child.nodeType ? child : document.createTextNode(child));
  }
  return node;
}

/** Icone inline como <svg>. Evita depender de icon font ou sprite externo. */
export function icon(path, size = 16) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p.setAttribute('d', path);
  svg.append(p);
  return svg;
}

/*
 * Cada icone e uma constante exportada, e nao uma chave num objeto. Objeto e
 * indivisivel para o empacotador: quem importava uma seta levava o mapa inteiro
 * — medido, 0,6 KB a mais no bundle de quem usa so o date picker. Constante
 * solta o esbuild descarta quando ninguem a importa.
 */
export const ICON_CHEVRON_LEFT = 'M15 18l-6-6 6-6';
export const ICON_CHEVRON_RIGHT = 'M9 18l6-6-6-6';
export const ICON_CHEVRON_DOWN = 'M6 9l6 6 6-6';
export const ICON_CALENDAR = 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z';
export const ICON_CLOCK = 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2';
export const ICON_X = 'M18 6L6 18M6 6l12 12';
export const ICON_CHECK = 'M20 6L9 17l-5-5';
export const ICON_SEARCH = 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35';
export const ICON_CHEVRONS_UP_DOWN = 'M7 15l5 5 5-5M7 9l5-5 5 5';
export const ICON_PIPETTE = 'M2 22l1-4 10-10 3 3L6 21l-4 1zM15 5l4-4 4 4-4 4-4-4z';
export const ICON_UPLOAD = 'M12 16V4M7 9l5-5 5 5M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2';
export const ICON_FILE = 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6';
export const ICON_RETRY = 'M21 12a9 9 0 11-9-9c2.5 0 4.9 1 6.7 2.7L21 8M21 3v5h-5';
export const ICON_SPINNER = 'M21 12a9 9 0 11-9-9';
export const ICON_ALERT = 'M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z';
export const ICON_INFO = 'M12 16v-4M12 8h.01M12 22a10 10 0 100-20 10 10 0 000 20z';
export const ICON_EYE = 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z M12 15a3 3 0 100-6 3 3 0 000 6z';
export const ICON_EYE_OFF = 'M10.6 10.6a3 3 0 004.2 4.2 M9.4 5.2A9.7 9.7 0 0112 5c6.4 0 10 7 10 7a17 17 0 01-2.8 3.7 M6.6 6.6A17 17 0 002 12s3.6 7 10 7c1.7 0 3.2-.4 4.5-1 M2 2l20 20';

/** O mapa existe para a galeria em tools/icones.html; componente importa a constante. */
export const ICONS = {
  chevronLeft: ICON_CHEVRON_LEFT,
  chevronRight: ICON_CHEVRON_RIGHT,
  chevronDown: ICON_CHEVRON_DOWN,
  calendar: ICON_CALENDAR,
  clock: ICON_CLOCK,
  x: ICON_X,
  check: ICON_CHECK,
  search: ICON_SEARCH,
  chevronsUpDown: ICON_CHEVRONS_UP_DOWN,
  pipette: ICON_PIPETTE,
  upload: ICON_UPLOAD,
  file: ICON_FILE,
  retry: ICON_RETRY,
  spinner: ICON_SPINNER,
  alert: ICON_ALERT,
  info: ICON_INFO,
  eye: ICON_EYE,
  eyeOff: ICON_EYE_OFF,
};

/*
 * Tira as chaves undefined antes de mesclar com os padroes. Sem isto,
 * `new X(node, { delay: undefined })` apagaria o padrao em vez de mante-lo.
 * Existia copiado em doze componentes, com dois nomes.
 */
export function omitUndefined(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) if (v !== undefined) out[k] = v;
  return out;
}

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };
/** Escapa o minimo que torna texto seguro dentro de HTML. */
export const escapeHtml = (t) => String(t).replace(/[&<>]/g, (c) => ESCAPES[c]);

let uid = 0;
export function nextId(prefix = 'ui') {
  return `${prefix}-${Date.now().toString(36)}-${(uid++).toString(36)}`;
}

/** Registra listener e devolve a funcao de remocao — simplifica o destroy(). */
export function on(target, type, handler, options) {
  target.addEventListener(type, handler, options);
  return () => target.removeEventListener(type, handler, options);
}

/**
 * Liga a transicao de entrada de um painel.
 *
 * Ler `offsetHeight` forca o navegador a calcular o layout com o estado
 * inicial ainda aplicado; so depois a classe entra, e a transicao acontece.
 *
 * O caminho comum e `requestAnimationFrame`, mas ele nao dispara em aba
 * de segundo plano — e ai o elemento fica preso no estado inicial, fora da
 * tela ou invisivel, sem nunca animar.
 */
export function openWithTransition(node, className = 'is-open') {
  void node.offsetHeight;
  node.classList.add(className);
}
