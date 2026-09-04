import { csrfToken, fileId, formatSize, isImage, matchesAccept, parseSize, uploadFile } from '../core/files.js';
import { el, icon, ICON_ALERT, ICON_CHECK, ICON_FILE, ICON_RETRY, ICON_UPLOAD, ICON_X, nextId, omitUndefined, on } from '../core/dom.js';

const DEFAULTS = {
  url: null,             // com url: upload direto. sem: os arquivos vao no submit
  method: 'POST',
  fieldName: 'file',     // nome do campo no FormData do upload direto
  extraData: {},         // campos extras enviados junto
  headers: {},
  csrf: true,            // manda X-CSRFToken lido do cookie (Django)
  responseId: 'id',      // chave do id na resposta JSON
  responseUrl: 'url',    // chave da url na resposta JSON
  deleteUrl: null,       // se definido, remover chama DELETE aqui
  maxSize: null,         // '5mb' ou bytes
  maxFiles: null,
  autoUpload: true,      // no modo direto, comeca ao soltar
  locale: undefined,
  texts: {},
  onChange: null,
  onError: null,
};

const TEXTS = {
  zone: 'Arraste arquivos aqui ou clique para escolher',
  zoneOne: 'Arraste um arquivo aqui ou clique para escolher',
  drop: 'Solte para enviar',
  uploading: 'Enviando...',
  pronto: 'Enviado',
  cancel: 'Cancelar',
  remove: 'Remover',
  repeat: 'Tentar de novo',
  large: (max) => `Arquivo maior que ${max}`,
  type: 'Tipo de arquivo não aceito',
  others: (n) => `No máximo ${n} arquivo${n > 1 ? 's' : ''}`,
};

/**
 * Campo de upload.
 *
 * Dois lugares, escolhidos pela presenca de `url`:
 *
 * - Sem `url` — o componente e um campo do formulario. Os arquivos ficam no
 *   <input type="file"> nativo e sobem no submit, entao o servidor recebe em
 *   request.FILES como sempre. Nao ha progresso por arquivo: num submit comum
 *   o navegador envia tudo num bloco so e nao reporta andamento.
 *
 * - Com `url` — cada arquivo sobe na hora, com barra propria, cancelar e
 *   repetir. O formulario posta so os ids devolvidos. Funciona tambem sem
 *   formulario nenhum, como zona de envio solta.
 */
export class Upload {
  constructor(target, options = {}) {
    const node = typeof target === 'string' ? document.querySelector(target) : target;
    if (!node) throw new Error('[Upload] elemento alvo nao encontrado');
    if (node.tagName !== 'INPUT' || node.type !== 'file') {
      throw new Error('[Upload] o alvo precisa ser um <input type="file">');
    }

    this.opts = { ...DEFAULTS, ...omitUndefined(options) };
    this.opts.locale = this.opts.locale || document.documentElement.lang || 'pt-BR';
    this.t = { ...TEXTS, ...this.opts.texts };
    this.opts.maxSize = this.opts.maxSize == null ? null : parseSize(this.opts.maxSize);

    this.input = node;
    this.direct = !!this.opts.url;
    this.multiple = node.multiple;
    this.id = nextId('up');
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
      name: i.file.name, size: i.file.size, type: i.file.type,
      status: i.estado, progress: i.progress, id: i.idServidor ?? null, url: i.url ?? null,
      file: i.file,
    }));
  }

  /** Ids devolvidos pelo servidor (modo direto). E o que o formulario posta. */
  getValue() {
    const ready = this.items.filter((i) => i.estado === 'pronto' && i.idServidor != null);
    return this.direct ? ready.map((i) => i.idServidor) : this.items.map((i) => i.file);
  }

  /** Sobe o que estiver pendente. Util com autoUpload: false. */
  uploadAll() {
    for (const item of this.items) if (item.estado === 'pendente') this._upload(item);
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
    this.input.classList.remove('tuc-upload-native');
    this.hidden?.remove();
    delete this.input._tucano;
  }

  /* ---------------------------------------------------------------- *
   * Construcao                                                        *
   * ---------------------------------------------------------------- */

  _build() {
    const input = this.input;
    input.classList.add('tuc-upload-native');

    // No modo direto quem posta sao os ids, nao os arquivos.
    if (this.direct && input.name) {
      this.fieldName = input.name;
      input.removeAttribute('name');
    }

    this.zone = el('div', {
      class: 'tuc-upload__zone',
      role: 'button',
      tabindex: 0,
      'aria-describedby': `${this.id}-dica`,
    }, [
      el('span', { class: 'tuc-upload__icon' }, [icon(ICON_UPLOAD, 20)]),
      el('span', { class: 'tuc-upload__label', text: this.multiple ? this.t.zone : this.t.zoneOne }),
      el('span', { class: 'tuc-upload__hint', id: `${this.id}-dica`, text: this._hint() }),
    ]);

    this.list = el('ul', { class: 'tuc-upload__list' });
    this.root = el('div', { class: 'tuc-upload', id: this.id }, [this.zone, this.list]);
    input.replaceWith(this.root);
    this.root.append(input);

    const open = () => input.click();
    this._cleanups.push(
      on(this.zone, 'click', open),
      on(this.zone, 'keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      }),
      on(input, 'change', () => { this._add([...input.files]); }),
      ...this._dragAndDrop(),
    );

    this._renderList();
  }

  _hint() {
    const parts = [];
    if (this.input.accept) parts.push(this.input.accept.split(',').map((s) => s.trim()).join(', '));
    if (this.opts.maxSize) parts.push(`até ${formatSize(this.opts.maxSize, this.opts.locale)}`);
    if (this.opts.maxFiles) parts.push(this.t.others(this.opts.maxFiles).toLowerCase());
    return parts.join(' · ');
  }

  /**
   * Arrastar e soltar. O contador existe porque `dragleave` dispara tambem ao
   * passar de um filho para outro dentro da zona — sem contar entradas e
   * saidas, o realce pisca.
   */
  _dragAndDrop() {
    const stop = (e) => { e.preventDefault(); e.stopPropagation(); };
    return [
      on(this.root, 'dragenter', (e) => {
        stop(e);
        this._dragging++;
        this.root.classList.add('is-dragging');
        this.zone.querySelector('.tuc-upload__label').textContent = this.t.drop;
      }),
      on(this.root, 'dragover', stop),
      on(this.root, 'dragleave', (e) => {
        stop(e);
        if (--this._dragging <= 0) this._stopDrag();
      }),
      on(this.root, 'drop', (e) => {
        stop(e);
        this._dragging = 0;
        this._stopDrag();
        this._add([...(e.dataTransfer?.files || [])]);
      }),
    ];
  }

  _stopDrag() {
    this._dragging = 0;
    this.root.classList.remove('is-dragging');
    this.zone.querySelector('.tuc-upload__label').textContent = this.multiple ? this.t.zone : this.t.zoneOne;
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
      if (error) { this._fail(error, file); continue; }

      const item = {
        key: fileId(), file, estado: 'pendente', progress: 0,
        preview: isImage(file) ? URL.createObjectURL(file) : null,
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
      // Navegador sem DataTransfer editavel: o que veio pelo dialogo continua valendo.
    }
  }

  _upload(item) {
    item.estado = 'enviando';
    item.progress = 0;
    item.error = null;
    this._renderList();

    const headers = { ...this.opts.headers };
    if (this.opts.csrf && !headers['X-CSRFToken']) {
      const token = csrfToken();
      if (token) headers['X-CSRFToken'] = token;
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
      },
    });
    item.abort = abort;

    promise.then((response) => {
      item.estado = 'pronto';
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
        item.estado = 'error';
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
      if (this.opts.csrf) { const t = csrfToken(); if (t) headers['X-CSRFToken'] = t; }
      fetch(`${this.opts.deleteUrl}${item.idServidor}/`, { method: 'DELETE', headers }).catch(() => {});
    }

    this._syncNative();
    this._renderList();
    if (!silent) this._emit();
  }

  _fail(message, file) {
    this.opts.onError?.(new Error(message), file);
    const warning = el('li', { class: 'tuc-upload__item is-rejected' }, [
      el('span', { class: 'tuc-upload__thumb' }, [icon(ICON_ALERT, 16)]),
      el('div', { class: 'tuc-upload__info' }, [
        el('span', { class: 'tuc-upload__name', text: file.name }),
        el('span', { class: 'tuc-upload__meta', text: message }),
      ]),
    ]);
    this.list.append(warning);
    setTimeout(() => warning.remove(), 5000);
  }

  /* ---------------------------------------------------------------- *
   * Render                                                            *
   * ---------------------------------------------------------------- */

  /** So a barra: chamado a cada evento de progresso, nao pode refazer a lista. */
  _paintProgress(item) {
    const li = this.list.querySelector(`[data-key="${item.key}"]`);
    if (!li) return;
    const toolbar = li.querySelector('.tuc-upload__barfill');
    if (toolbar) toolbar.style.width = `${Math.round(item.progress * 100)}%`;
    const meta = li.querySelector('.tuc-upload__meta');
    if (meta) meta.textContent = `${Math.round(item.progress * 100)}% · ${formatSize(item.file.size, this.opts.locale)}`;
  }

  _renderList() {
    for (const n of [...this.list.children]) if (!n.classList.contains('is-rejected')) n.remove();

    for (const item of this.items) {
      const pct = Math.round(item.progress * 100);
      const meta = item.estado === 'enviando'
        ? `${pct}% · ${formatSize(item.file.size, this.opts.locale)}`
        : item.estado === 'error'
          ? item.error
          : formatSize(item.file.size, this.opts.locale);

      const actions = [];
      if (item.estado === 'enviando') {
        actions.push(this._button(ICON_X, this.t.cancel, () => item.abort?.()));
      } else if (item.estado === 'error') {
        actions.push(this._button(ICON_RETRY, this.t.repeat, () => this._upload(item)));
        actions.push(this._button(ICON_X, this.t.remove, () => this._remove(item)));
      } else {
        actions.push(this._button(ICON_X, this.t.remove, () => this._remove(item)));
      }

      this.list.append(el('li', {
        class: `tuc-upload__item is-${item.estado}`,
        dataset: { key: item.key },
      }, [
        item.preview
          ? el('img', { class: 'tuc-upload__thumb', src: item.preview, alt: '' })
          : el('span', { class: 'tuc-upload__thumb' }, [icon(ICON_FILE, 16)]),
        el('div', { class: 'tuc-upload__info' }, [
          el('span', { class: 'tuc-upload__name', title: item.file.name, text: item.file.name }),
          el('span', { class: 'tuc-upload__meta', text: meta }),
          item.estado === 'enviando'
            ? el('span', { class: 'tuc-upload__bar' }, [
                el('span', { class: 'tuc-upload__barfill', style: `width:${pct}%` }),
              ])
            : null,
        ]),
        item.estado === 'pronto' ? el('span', { class: 'tuc-upload__ok' }, [icon(ICON_CHECK, 15)]) : null,
        el('div', { class: 'tuc-upload__actions' }, actions),
      ]));
    }

    this._syncHidden();
    this.root.classList.toggle('is-empty', !this.items.length);
  }

  _button(path, label, onClick) {
    return el('button', {
      type: 'button', class: 'tuc-btn is-ghost is-icon is-sm tuc-upload__action', 'aria-label': label, title: label,
      onclick: (e) => { e.stopPropagation(); onClick(); },
    }, [icon(path, 14)]);
  }

  /** Modo direto: os ids prontos viram inputs hidden com o `name` original. */
  _syncHidden() {
    if (!this.direct || !this.fieldName) return;
    this.hidden?.remove();
    this.hidden = el('span', { class: 'tuc-upload__hidden' },
      this.items
        .filter((i) => i.estado === 'pronto' && i.idServidor != null)
        .map((i) => el('input', { type: 'hidden', name: this.fieldName, value: String(i.idServidor) })));
    this.root.append(this.hidden);
  }

  _emit() {
    const detail = { value: this.getValue(), files: this.getFiles(), instance: this };
    this.opts.onChange?.(detail.value, detail);
    this.input.dispatchEvent(new CustomEvent('tucano:change', { detail, bubbles: true }));
  }
}

/* ------------------------------------------------------------------ */


export function autoInit(scope = document) {
  const out = [];
  for (const node of scope.querySelectorAll('input[type=file][data-tuc-upload]:not([data-tuc-ready])')) {
    const d = node.dataset;
    node.setAttribute('data-tuc-ready', '');
    out.push(new Upload(node, {
      url: d.url || undefined,
      deleteUrl: d.deleteUrl || undefined,
      fieldName: d.fieldName || undefined,
      responseId: d.responseId || undefined,
      responseUrl: d.responseUrl || undefined,
      maxSize: d.maxSize || undefined,
      maxFiles: d.maxFiles ? +d.maxFiles : undefined,
      autoUpload: d.autoUpload === 'false' ? false : undefined,
      csrf: d.csrf === 'false' ? false : undefined,
    }));
  }
  return out;
}
