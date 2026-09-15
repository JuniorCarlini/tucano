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

/**
 * "5mb", "5 MB", "5m", "500kb", "1,5 MiB", 1048576 -> bytes. Base 1024. O que
 * nao se le devolve null.
 */
export function parseSize(value) {
  if (typeof value === 'number') return value;
  const m = /^([\d.,]+)\s*([kmg]?)(?:i?b)?$/i.exec(String(value ?? '').trim());
  return m ? Math.round(parseFloat(m[1].replace(',', '.')) * 1024 ** ' kmg'.indexOf(m[2].toLowerCase() || ' ')) : null;
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
export function csrfToken() {
  const m = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]*)/);
  return m ? decodeURIComponent(m[1]) : null;
}

/** A url aponta para a origem da pagina? Relativa conta como mesma origem. */
export function sameOrigin(url, base = location.href) {
  try { return new URL(url, base).origin === new URL(base).origin; } catch { return false; }
}

/**
 * Envia um arquivo com progresso. Usa XMLHttpRequest, e nao fetch: fetch
 * ainda nao reporta progresso de upload de forma confiavel entre navegadores.
 *
 * Devolve { promise, abort }.
 */
export function uploadFile({ url, file, field, extras, headers, method, texts, onProgress }) {
  const xhr = new XMLHttpRequest();
  const promise = new Promise((resolve, reject) => {
    const data = new FormData();
    data.append(field, file);
    for (const [k, v] of Object.entries(extras)) data.append(k, v);

    xhr.open(method, url);
    xhr.responseType = 'json';
    for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total);
    });
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response ?? {});
      } else {
        // A mensagem aparece na linha do arquivo, entao sai dos textos.
        reject(new Error(texts.serverError(xhr.status)));
      }
    });
    xhr.addEventListener('error', () => reject(new Error(texts.networkError)));
    xhr.addEventListener('abort', () => reject(Object.assign(new Error('Cancelado'), { canceled: true })));
    xhr.send(data);
  });
  return { promise, abort: () => xhr.abort() };
}
