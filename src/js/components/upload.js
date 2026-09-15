import { csrfToken, formatSize, isImage, matchesAccept, parseSize, sameOrigin, uploadFile } from '../core/files.js';
import { el, icon, ICON_ALERT, ICON_CHECK, ICON_FILE, ICON_RETRY, ICON_UPLOAD, ICON_X, nextId, omitUndefined, on } from '../core/dom.js';
import { UPLOAD_TEXTS } from '../core/texts.js';

const DEFAULTS = {
  url: null,             // com url: upload direto. sem: os arquivos vao no submit
  method: 'POST',
  fieldName: 'file',     // nome do campo no FormData do upload direto
  extraData: {},         // campos extras enviados junto
  headers: {},
  csrf: true,            // manda X-CSRFToken lido do cookie (Django), so para a mesma origem
  responseId: 'id',      // chave do id na resposta JSON
  responseUrl: 'url',    // chave da url na resposta JSON
  deleteUrl: null,       // se definido, remover chama DELETE aqui
  maxSize: null,         // '5mb' ou bytes
  maxFiles: null,
  autoUpload: true,      // no modo direto, comeca ao soltar
  locale: undefined,
  texts: {},             // por cima de Tucano.setTexts({ upload }), so nesta instancia
  onChange: null,
  onError: null,
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
    this.t = { ...UPLOAD_TEXTS, ...this.opts.texts };
    // Tamanho que nao se le vira "sem limite" — por isso avisa, em vez de calar.
    const maxSize = this.opts.maxSize;
    this.opts.maxSize = maxSize == null ? null : parseSize(maxSize);
    if (maxSize != null && this.opts.maxSize == null) console.warn(`[Upload] maxSize invalido: ${maxSize}`);

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
      status: i.state, progress: i.progress, id: i.serverId ?? null, url: i.url ?? null,
      file: i.file,
    }));
  }

  /** Ids devolvidos pelo servidor (modo direto). E o que o formulario posta. */
  getValue() {
    return this.direct
      ? this.items.filter((i) => i.state === 'ready' && i.serverId != null).map((i) => i.serverId)
      : this.items.map((i) => i.file);
  }

  /** Sobe o que estiver pendente. Util com autoUpload: false. */
  uploadAll() {
    for (const item of this.items) if (item.state === 'pending') this._upload(item);
    this._renderList();
  }

  clear() {
    for (const item of [...this.items]) this._remove(item, { silent: true });
    this._emit();
  }

  destroy() {
    // Antes de abortar: o abort resolve a promessa, e o que ainda chegasse
    // redesenharia uma lista solta e emitiria num campo que ja nao e nosso.
    this._destroyed = true;
    this._cleanups.forEach((fn) => fn());
    this._cleanups = [];
    for (const i of this.items) {
      i.abort?.();
      if (i.preview) URL.revokeObjectURL(i.preview);
    }
    this.root.replaceWith(this.input);
    this.input.classList.remove('tuc-upload-native');
    if (this.fieldName) this.input.name = this.fieldName;
    if (this._tabindex == null) this.input.removeAttribute('tabindex');
    else this.input.setAttribute('tabindex', this._tabindex);
    this.input.removeAttribute('data-tuc-ready');
    delete this.input._tucano;
  }

  /* ---------------------------------------------------------------- *
   * Construcao                                                        *
   * ---------------------------------------------------------------- */

  _build() {
    const input = this.input;
    input.classList.add('tuc-upload-native');
    // A zona e a parada de Tab. O nativo, invisivel, virava uma segunda parada
    // sem anel de foco logo depois dos botoes da lista.
    this._tabindex = input.getAttribute('tabindex');
    input.tabIndex = -1;

    // No modo direto quem posta sao os ids, nao os arquivos.
    if (this.direct && input.name) {
      this.fieldName = input.name;
      input.removeAttribute('name');
    }

    this.zone = el('div', {
      class: 'tuc-upload__zone',
      role: 'button',
      tabindex: 0,
      'aria-describedby': `${this.id}-hint`,
    }, [
      el('span', { class: 'tuc-upload__icon' }, [icon(ICON_UPLOAD, 20)]),
      el('span', { class: 'tuc-upload__label', text: this.multiple ? this.t.zone : this.t.zoneOne }),
      el('span', { class: 'tuc-upload__hint', id: `${this.id}-hint`, text: this._hint() }),
    ]);

    this.list = el('ul', { class: 'tuc-upload__list' });
    this.root = el('div', { class: 'tuc-upload', id: this.id }, [this.zone, this.list]);
    input.replaceWith(this.root);
    this.root.append(input);

    const open = () => input.click();
    this._cleanups.push(
      // preventDefault: dentro de um <label>, o clique tambem ativaria o label,
      // que clica no input de novo — Firefox e Safari abriam a janela duas vezes.
      on(this.zone, 'click', (e) => { e.preventDefault(); open(); }),
      on(this.zone, 'keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      }),
      on(input, 'change', () => { this._add([...input.files]); }),
      ...this._dragAndDrop(),
    );
    // O reset esvazia input.files sem avisar; a lista ficava mostrando arquivos
    // que o submit ja nao levava. No modo direto quem posta sao os hidden, que o
    // reset nao toca, entao a lista continua certa.
    if (!this.direct && input.form) {
      this._cleanups.push(on(input.form, 'reset', () => setTimeout(() => this.clear())));
    }

    this._renderList();
  }

  _hint() {
    const parts = [];
    if (this.input.accept) parts.push(this.input.accept.split(',').map((s) => s.trim()).join(', '));
    if (this.opts.maxSize) parts.push(this.t.upTo(formatSize(this.opts.maxSize, this.opts.locale)));
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
    // Desativado (no input ou num fieldset): a janela ja nao abre, e soltar
    // tambem nao pode entrar — no modo direto o arquivo subia assim mesmo.
    if (!files.length || this.input.matches(':disabled')) return;
    if (!this.multiple) {
      // Valida antes de trocar: um arquivo recusado levava embora o que ja
      // estava escolhido, e no modo direto ainda apagava o anterior no servidor.
      const error = this._validate(files[0], 0);
      if (error) {
        this._fail(error, files[0]);
        this._syncNative(); // a janela ja trocou input.files pelo recusado
        return;
      }
      for (const item of [...this.items]) this._remove(item, { silent: true });
      files = files.slice(0, 1);
    }

    for (const file of files) {
      const error = this._validate(file, this.items.length);
      if (error) { this._fail(error, file); continue; }

      const item = {
        key: nextId('f'), file, state: 'pending', progress: 0,
        preview: isImage(file) ? URL.createObjectURL(file) : null,
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
    const given = Object.keys(headers).some((k) => k.toLowerCase() === 'x-csrftoken');
    if (this.opts.csrf && !given && sameOrigin(url)) {
      const token = csrfToken();
      if (token) headers['X-CSRFToken'] = token;
    }
    // null e "nao mande": o fetch do DELETE escreveria a palavra "null".
    for (const k in headers) if (headers[k] == null) delete headers[k];
    return headers;
  }

  /** Comeca o envio. Nao redesenha: quem chama redesenha uma vez, depois de todos. */
  _upload(item) {
    item.state = 'uploading';
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
      },
    });
    item.abort = abort;

    promise.then((response) => {
      item.serverId = response?.[this.opts.responseId] ?? null;
      item.url = response?.[this.opts.responseUrl] ?? null;
      // Sem id nao ha o que postar: marcar como pronto perdia o arquivo em
      // silencio (resposta HTML, 204, chave com outro nome).
      if (this.fieldName && (item.serverId == null || item.serverId === '')) throw new Error(this.t.noId);
      item.state = 'ready';
      item.progress = 1;
    }).catch((e) => {
      if (!e.canceled) {
        item.state = 'error';
        item.error = e.message;
        this.opts.onError?.(e, item.file);
        return;
      }
      const i = this.items.indexOf(item);
      // Fora da lista, ou destruido: quem tirou ja redesenhou, avisou e revogou.
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
      // O id vem do servidor: sem codificar, "../" saia do deleteUrl.
      const url = `${this.opts.deleteUrl}${encodeURIComponent(item.serverId)}/`;
      fetch(url, { method: 'DELETE', headers: this._headers(url) }).catch(() => {});
    }

    this._syncNative();
    this._renderList();
    if (!silent) this._emit();
  }

  _fail(message, file) {
    this.opts.onError?.(new Error(message), file);
    // O aviso do sistema, e com role="alert": a recusa aparece depois da acao
    // e some sozinha, entao quem usa leitor de tela precisa ouvi-la na hora.
    const warning = el('li', { class: 'tuc-alert is-danger tuc-upload__rejected', role: 'alert' }, [
      icon(ICON_ALERT, 16),
      el('div', { class: 'tuc-alert__body' }, [
        el('p', { class: 'tuc-alert__title', text: file.name }),
        el('p', { text: message }),
      ]),
    ]);
    this.list.append(warning);
    setTimeout(() => warning.remove(), 5000);
  }

  /* ---------------------------------------------------------------- *
   * Render                                                            *
   * ---------------------------------------------------------------- */

  _meta(item) {
    const size = formatSize(item.file.size, this.opts.locale);
    if (item.state === 'uploading') return `${Math.round(item.progress * 100)}% · ${size}`;
    return item.state === 'error' ? item.error : size;
  }

  /** So a barra: chamado a cada evento de progresso, nao pode refazer a lista. */
  _paintProgress(item) {
    const li = this.list.querySelector(`[data-key="${item.key}"]`);
    if (!li) return;
    const fill = li.querySelector('.tuc-upload__barfill');
    if (fill) fill.style.width = `${Math.round(item.progress * 100)}%`;
    li.querySelector('.tuc-upload__meta').textContent = this._meta(item);
  }

  _renderList() {
    // Refazer a lista tira do DOM o botao focado, e o foco caia no <body> —
    // inclusive quando era outro arquivo que terminava de subir. Guarda o item e
    // o rotulo para focar o equivalente; se o item saiu, o foco vai para a zona.
    const focused = this.list.contains(document.activeElement) ? document.activeElement : null;
    const focusedKey = focused?.closest('[data-key]')?.dataset.key;
    const focusedLabel = focused?.getAttribute('aria-label');

    for (const n of [...this.list.children]) if (!n.classList.contains('tuc-upload__rejected')) n.remove();

    for (const item of this.items) {
      const actions = [];
      if (item.state === 'uploading') {
        actions.push(this._button(ICON_X, this.t.cancel, () => item.abort?.()));
      } else {
        if (item.state === 'error') {
          actions.push(this._button(ICON_RETRY, this.t.repeat, () => { this._upload(item); this._renderList(); }));
        }
        actions.push(this._button(ICON_X, this.t.remove, () => this._remove(item)));
      }

      this.list.append(el('li', {
        class: `tuc-upload__item is-${item.state}`,
        dataset: { key: item.key },
      }, [
        item.preview
          ? el('img', { class: 'tuc-upload__thumb', src: item.preview, alt: '' })
          : el('span', { class: 'tuc-upload__thumb' }, [icon(ICON_FILE, 16)]),
        el('div', { class: 'tuc-upload__info' }, [
          el('span', { class: 'tuc-upload__name', title: item.file.name, text: item.file.name }),
          el('span', { class: 'tuc-upload__meta', text: this._meta(item) }),
          item.state === 'uploading'
            ? el('span', { class: 'tuc-upload__bar' }, [
                el('span', { class: 'tuc-upload__barfill', style: `width:${Math.round(item.progress * 100)}%` }),
              ])
            : null,
        ]),
        item.state === 'ready' ? el('span', { class: 'tuc-upload__ok' }, [icon(ICON_CHECK, 15)]) : null,
        el('div', { class: 'tuc-upload__actions' }, actions),
      ]));
    }

    if (focused) {
      const li = [...this.list.children].find((n) => n.dataset.key === focusedKey);
      const buttons = li ? [...li.querySelectorAll('button')] : [];
      (buttons.find((b) => b.getAttribute('aria-label') === focusedLabel) || buttons[0] || this.zone).focus();
    }

    this._syncHidden();
  }

  _button(path, label, onClick) {
    return el('button', {
      type: 'button', class: 'tuc-btn is-ghost is-icon is-sm', 'aria-label': label, title: label,
      onclick: (e) => { e.stopPropagation(); onClick(); },
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
    const form = this.input.getAttribute('form');
    this.hidden = el('span', { class: 'tuc-upload__hidden' },
      this.getValue().map((id) => el('input', { type: 'hidden', name: this.fieldName, value: String(id), form })));
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
