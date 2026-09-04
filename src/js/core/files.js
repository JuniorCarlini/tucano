/**
 * Utilitarios de arquivo. Sem dependencias.
 */

/** Tamanho legivel: 1536 -> "1,5 KB". */
export function formatSize(bytes, locale = 'pt-BR') {
  if (!Number.isFinite(bytes) || bytes < 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let n = bytes / 1024;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  const places = n < 10 ? 1 : 0;
  return `${n.toLocaleString(locale, { maximumFractionDigits: places })} ${units[i]}`;
}

/** "5mb", "500kb", 1048576 -> bytes. */
export function parseSize(value) {
  if (typeof value === 'number') return value;
  const m = /^([\d.,]+)\s*(b|kb|mb|gb)?$/i.exec(String(value || '').trim());
  if (!m) return null;
  const n = parseFloat(m[1].replace(',', '.'));
  const factor = { b: 1, kb: 1024, mb: 1024 ** 2, gb: 1024 ** 3 }[(m[2] || 'b').toLowerCase()];
  return Math.round(n * factor);
}

/**
 * Verifica um arquivo contra o atributo `accept` do input
 * (".pdf,image/*,image/png"). Sem accept, tudo passa.
 */
export function matchesAccept(file, accept) {
  if (!accept) return true;
  const name = file.name.toLowerCase();
  const type = (file.type || '').toLowerCase();
  return accept.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean).some((rule) => {
    if (rule.startsWith('.')) return name.endsWith(rule);
    if (rule.endsWith('/*')) return type.startsWith(rule.slice(0, -1));
    return type === rule;
  });
}

export function isImage(file) {
  return (file.type || '').startsWith('image/');
}

/**
 * Le o cookie de CSRF do Django. Sem isso, POST de upload volta 403 —
 * e o erro nao e obvio de diagnosticar.
 */
export function csrfToken(name = 'csrftoken') {
  const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

/**
 * Envia um arquivo com progresso. Usa XMLHttpRequest, e nao fetch: fetch
 * ainda nao reporta progresso de upload de forma confiavel entre navegadores.
 *
 * Devolve { promessa, abortar }.
 */
export function uploadFile({ url, file, field = 'file', extras = {}, headers = {}, onProgress }) {
  const xhr = new XMLHttpRequest();
  const promise = new Promise((resolve, reject) => {
    const data = new FormData();
    data.append(field, file);
    for (const [k, v] of Object.entries(extras)) data.append(k, v);

    xhr.open('POST', url);
    xhr.responseType = 'json';
    for (const [k, v] of Object.entries(headers)) if (v != null) xhr.setRequestHeader(k, v);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total, e.loaded, e.total);
    });
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response ?? {});
      } else {
        reject(new Error(`O servidor respondeu ${xhr.status}`));
      }
    });
    xhr.addEventListener('error', () => reject(new Error('Falha de rede')));
    xhr.addEventListener('abort', () => reject(Object.assign(new Error('Cancelado'), { canceled: true })));
    xhr.send(data);
  });
  return { promise, abort: () => xhr.abort() };
}

let seq = 0;
export function fileId() {
  return `f${Date.now().toString(36)}${(seq++).toString(36)}`;
}
