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

export const ICONS = {
  chevronLeft: 'M15 18l-6-6 6-6',
  chevronRight: 'M9 18l6-6-6-6',
  chevronDown: 'M6 9l6 6 6-6',
  calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z',
  clock: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2',
  x: 'M18 6L6 18M6 6l12 12',
};

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
