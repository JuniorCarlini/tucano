import { clamp, formatColor, hsvToRgb, isDark, parseColor, rgbToHex } from '../core/color.js';
import { el, icon, ICON_PIPETTE, nextId, omitUndefined, on } from '../core/dom.js';
import { Popover } from '../core/popover.js';
import { COLORPICKER_TEXTS as T } from '../core/texts.js';

const PALETTE = [
  '#0a0a0a', '#525252', '#a3a3a3', '#e5e5e5', '#ffffff',
  '#e11d48', '#ea580c', '#f59e0b', '#16a34a', '#0d9488',
  '#0284c7', '#4f46e5', '#7c3aed', '#c026d3', '#be123c',
];

const DEFAULTS = {
  format: 'hex',          // 'hex' | 'rgb' | 'hsl'
  alpha: true,
  swatches: PALETTE,       // false desliga
  placement: 'bottom-center',   // mesma regra do date picker: centralizado, preso na borda da tela
  appendTo: undefined,
  onChange: null,
};

/**
 * Seletor de cor ancorado num <input> de texto.
 *
 * O input do projeto nao e tocado — ele so ganha um botao de amostra ao lado,
 * dentro de um wrapper flex. Assim qualquer estilo que o projeto ja aplique no
 * campo continua valendo.
 */
export class ColorPicker {
  constructor(target, options = {}) {
    const node = typeof target === 'string' ? document.querySelector(target) : target;
    if (!node) throw new Error('[ColorPicker] elemento alvo nao encontrado');
    // Segunda instancia no mesmo campo: a anterior sai antes. Duas ao mesmo tempo
    // aninhavam um envolucro no outro, com duas amostras lado a lado.
    if (node._tucano instanceof ColorPicker) {
      // O destroy tira o data-tuc-ready; quem chamou (o autoInit) acabou de po-lo.
      const ready = node.hasAttribute('data-tuc-ready');
      node._tucano.destroy();
      node.toggleAttribute('data-tuc-ready', ready);
    }

    this.opts = { ...DEFAULTS, ...omitUndefined(options) };
    this.input = node;
    this.id = nextId('color');
    this.isOpen = false;
    this._cleanups = [];
    this.hsva = { h: 243, s: 0.7, v: 0.9, a: 1 };
    // Campo sem cor nasce vazio. Escrever uma cor de fabrica fazia o formulario
    // postar o que ninguem escolheu, e o `required` nunca barrava o envio — o
    // campo ja chegava preenchido. O HSVA acima e so onde o painel abre.
    this.empty = true;

    this._build();
    // Pelo setValue, e nao pelo parseColor direto: sem opacidade, o alfa do valor
    // inicial precisa sair tambem, e `#ff000080` ficava no campo com a trilha escondida.
    const initial = node.value || this.opts.value || '';
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
    // null e '' limpam: e como o formulario volta ao vazio no reset.
    if (value == null || value === '') {
      this.empty = true;
      this._commit(silent);
      return true;
    }
    const color = parseColor(value);
    if (!color) return false;
    this.empty = false;
    const { h, s } = this.hsva;
    /*
     * Cinza nao tem matiz e preto nao tem saturacao: o parseColor devolve 0, e a
     * area pulava para o vermelho. Fica o que ja estava — a cor e a mesma, e a
     * regra e a de guardar HSVA (AGENTS.md).
     */
    this.hsva = {
      h: color.s && color.v ? color.h : h,
      s: color.v ? color.s : s,
      v: color.v,
      a: this.opts.alpha ? color.a : 1,
    };
    this._commit(silent);
    return true;
  }

  open() {
    // `:disabled` pega tambem o <fieldset disabled>; campo so de leitura nao se edita pelo painel.
    if (this.isOpen || this.input.matches(':disabled, [readonly]')) return;
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
        if (reason === 'escape' && inside) this.swatch.focus();
      },
    });
    this.popover.show();
    this.swatch.setAttribute('aria-expanded', 'true');
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.popover?.destroy();
    this.popover = null;
    this.swatch.setAttribute('aria-expanded', 'false');
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  destroy() {
    this.close();
    this._cleanups.forEach((fn) => fn());
    this._cleanups = [];
    this.input.classList.remove('tuc-color-field__value');
    this.field.replaceWith(this.input);
    this.panel.remove();
    // Sem isto o Tucano.init seguinte pulava o campo, que ficava sem componente.
    this.input.removeAttribute('data-tuc-ready');
    delete this.input._tucano;
  }

  /* ---------------------------------------------------------------- *
   * Construcao                                                        *
   * ---------------------------------------------------------------- */

  _build() {
    /*
     * Aberto pelo teclado, o foco entra no painel. O painel mora no fim do <body>,
     * longe do campo na ordem de Tab: com o foco na amostra, o Tab seguinte saia
     * do campo, o closeOnFocusOut fechava, e area, trilhas e valor ficavam
     * inalcancaveis sem mouse. `detail` 0 e o clique que veio de Enter ou Espaco.
     */
    const openInto = () => { this.open(); if (this.isOpen) this.area.focus(); };
    this.swatch = el('button', {
      type: 'button',
      class: 'tuc-color-field__swatch',
      'aria-label': T.pick,
      'aria-haspopup': 'dialog',
      'aria-expanded': 'false',
      onclick: (e) => (this.isOpen || e.detail ? this.toggle() : openInto()),
    });

    this.field = el('div', { class: 'tuc-color-field' });
    this.input.replaceWith(this.field);
    this.input.classList.add('tuc-color-field__value');
    this.field.append(this.swatch, this.input);

    this.area = el('div', {
      class: 'tuc-colorpicker__area', tabindex: 0, role: 'application',
      'aria-label': T.area,
    }, [el('span', { class: 'tuc-colorpicker__thumb' })]);

    this.hue = this._buildSlider('hue', T.hue, 360);
    this.alpha = this.opts.alpha ? this._buildSlider('alpha', T.alpha, 1) : null;

    this.preview = el('span', { class: 'tuc-colorpicker__preview' });
    this.hexField = el('input', {
      class: 'tuc-input tuc-colorpicker__field', type: 'text', spellcheck: 'false',
      autocomplete: 'off', 'aria-label': T.value,
    });

    const fieldRow = el('div', { class: 'tuc-colorpicker__row' }, [
      this.preview,
      this.hexField,
      // O conta-gotas ainda e so do Chrome e do Edge: esta checagem continua valendo.
      'EyeDropper' in window ? el('button', {
        type: 'button', class: 'tuc-btn is-outline is-icon is-sm tuc-colorpicker__pick', 'aria-label': T.eyeDropper,
        onclick: () => this._pickFromScreen(),
      }, [icon(ICON_PIPETTE, 15)]) : null,
    ]);

    const tracks = el('div', { class: 'tuc-colorpicker__tracks' }, [this.hue.root, this.alpha?.root]);

    this.panel = el('div', {
      class: 'tuc-colorpicker', role: 'dialog', 'aria-label': T.dialog, id: this.id,
    }, [this.area, tracks, fieldRow, this.opts.swatches ? this._buildSwatches() : null]);

    this._cleanups.push(
      // Clicar em qualquer parte do controle leva o cursor ao valor.
      on(this.field, 'mousedown', (e) => {
        if (e.target === this.field) { e.preventDefault(); this.input.focus(); }
      }),
      /*
       * Abrir no foco do campo de texto atrapalhava duas vezes: o painel subia
       * so de tabular por um formulario, e cobria o proprio campo de quem
       * queria digitar o hex. O gatilho e a amostra, que e <button> e ja
       * responde a Enter e Espaco. Aqui fica so a seta para baixo, igual a do
       * campo de data, ouvida no envolucro para valer na amostra e no campo.
       */
      on(this.field, 'keydown', (e) => {
        if (e.key === 'ArrowDown' && !this.isOpen) { e.preventDefault(); openInto(); }
      }),
      ...this._dragHandler(this.area, (x, y) => {
        this.hsva = { ...this.hsva, s: x, v: 1 - y };
        this.empty = false;   // mexer na area e escolher
        this._commit(false, false);
      }),
      on(this.area, 'keydown', (e) => this._areaKeys(e)),
      on(this.input, 'change', () => {
        // Ignora o `change` que nos mesmos disparamos: sem isso o valor era relido
        // do texto a cada emissao, e a matiz e a precisao do arrasto se perdiam.
        if (this._emitting) return;
        /*
         * O change de quem digitou ja saiu; daqui sai so o tucano:change. Com o
         * nativo repetido, o HTMX mandava duas requisicoes. Texto invalido volta
         * para o valor atual, em vez de zerar a cor.
         */
        if (!this.setValue(this.input.value, { silent: true })) return this._syncInput();
        this._emit(false);
      }),
      // Sempre reescrito: o foco ainda esta no campo quando o change sai, e o
      // _paint pula campo focado — texto invalido ficava la, mentindo o valor.
      on(this.hexField, 'change', () => {
        this.setValue(this.hexField.value);
        this.hexField.value = this.empty ? '' : this._color();
      }),
    );

    /*
     * O reset do formulario volta o campo ao atributo `value` sem disparar change:
     * a amostra e a instancia seguiam com a cor antiga. O evento chega antes de
     * o valor voltar, entao a leitura espera a vez — como no select e no date picker.
     */
    if (this.input.form) {
      this._cleanups.push(on(this.input.form, 'reset', () => setTimeout(() => {
        this.setValue(this.input.value, { silent: true }) || this._syncInput();
      })));
    }
  }

  _buildSlider(type, label, max) {
    const thumb = el('span', { class: 'tuc-colorpicker__thumb' });
    const root = el('div', {
      class: `tuc-colorpicker__slider is-${type}`, tabindex: 0, role: 'slider',
      'aria-label': label, 'aria-valuemin': '0', 'aria-valuemax': String(max),
    }, [el('span', { class: 'tuc-colorpicker__track' }), thumb]);

    // As duas trilhas andam em [0,1]; a matiz so e escalada para graus ao gravar.
    const hue = type === 'hue';
    const set = (x, native) => {
      this.hsva = hue ? { ...this.hsva, h: x * 360 } : { ...this.hsva, a: x };
      this.empty = false;   // mexer na trilha e escolher
      this._commit(false, native);
    };

    this._cleanups.push(
      ...this._dragHandler(root, (x) => set(x, false)),
      on(root, 'keydown', (e) => {
        const step = (e.shiftKey ? 10 : 1) / (hue ? 360 : 100);
        // Home e End como no slider do ARIA APG.
        const delta = { ArrowLeft: -step, ArrowDown: -step, ArrowRight: step, ArrowUp: step, Home: -1, End: 1 }[e.key];
        if (!delta) return;
        e.preventDefault();
        set(clamp((hue ? this.hsva.h / 360 : this.hsva.a) + delta, 0, 1));
      }),
    );
    return { root, thumb };
  }

  _buildSwatches() {
    return el('div', { class: 'tuc-colorpicker__swatches' },
      this.opts.swatches.map((color) => {
        const parsed = parseColor(color);
        return el('button', {
          type: 'button',
          class: 'tuc-colorpicker__swatchbtn',
          style: `--color: ${color}`,
          'aria-label': color,
          title: color,
          // Comparada com o alfa: `#00ff0080` marcado como a cor `#00ff00` indicava a amostra errada.
          dataset: { color: parsed && formatColor(this.opts.alpha ? parsed : { ...parsed, a: 1 }) },
          onclick: () => { this.setValue(color); },
        });
      }));
  }

  /**
   * Arrasto normalizado em [0,1]. Usa pointer capture para o gesto continuar
   * valendo quando o cursor sai do elemento — sem isso o thumb "gruda" na borda.
   * O navegador solta a captura sozinho no pointerup e no pointercancel, e
   * avisa com `lostpointercapture`.
   */
  _dragHandler(node, onMove) {
    let start;
    const apply = (e) => {
      const r = node.getBoundingClientRect();
      onMove(clamp((e.clientX - r.left) / r.width, 0, 1), clamp((e.clientY - r.top) / r.height, 0, 1));
    };
    return [
      on(node, 'pointerdown', (e) => {
        // So o botao principal: o direito abria o menu de contexto e mudava a cor junto.
        if (e.button) return;
        e.preventDefault();
        node.setPointerCapture(e.pointerId);
        node.focus();
        start = this.input.value;
        apply(e);
      }),
      on(node, 'pointermove', (e) => { if (node.hasPointerCapture(e.pointerId)) apply(e); }),
      /*
       * O change nativo sai uma vez, ao soltar, como no <input type="range">; o
       * tucano:change continua a cada movimento. Com o nativo a cada pixel, um
       * `hx-trigger="change"` mandava uma requisicao por movimento do mouse.
       */
      on(node, 'lostpointercapture', () => { if (this.input.value !== start) this._change(); }),
    ];
  }

  _areaKeys(e) {
    const step = (e.shiftKey ? 10 : 2) / 100;
    const map = {
      ArrowLeft: { s: -step }, ArrowRight: { s: step },
      ArrowUp: { v: step }, ArrowDown: { v: -step },
    };
    const d = map[e.key];
    if (!d) return;
    e.preventDefault();
    this.empty = false;   // mexer pelo teclado e escolher
    this.hsva = {
      ...this.hsva,
      s: clamp(this.hsva.s + (d.s || 0), 0, 1),
      v: clamp(this.hsva.v + (d.v || 0), 0, 1),
    };
    this._commit();
  }

  async _pickFromScreen() {
    try {
      const { sRGBHex } = await new window.EyeDropper().open();
      this.setValue(sRGBHex);
    } catch { /* usuario cancelou */ }
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
    const value = this.empty ? '' : this._color();
    this.input.value = value;
    // Sem cor, o xadrez do fundo da amostra aparece sozinho — o mesmo desenho
    // que ela ja usa para cor translucida.
    this.swatch.style.setProperty('--color', value || 'transparent');
  }

  /** Repinta os controles a partir do HSVA atual. */
  _paint() {
    const { h, s, v, a } = this.hsva;
    const pure = rgbToHex(hsvToRgb({ h, s: 1, v: 1 }));
    const solid = rgbToHex(hsvToRgb(this.hsva));
    const thumb = this.area.firstElementChild;
    const value = this.empty ? '' : this._color();

    this.area.style.setProperty('--hue', pure);
    thumb.style.left = `${s * 100}%`;
    thumb.style.top = `${(1 - v) * 100}%`;
    thumb.style.setProperty('--color', solid);
    thumb.classList.toggle('is-dark', isDark(this.hsva));

    this.hue.thumb.style.left = `${(h / 360) * 100}%`;
    this.hue.thumb.style.setProperty('--color', pure);
    this.hue.root.setAttribute('aria-valuenow', String(Math.round(h)));

    if (this.alpha) {
      this.alpha.root.style.setProperty('--color', solid);
      this.alpha.thumb.style.left = `${a * 100}%`;
      this.alpha.thumb.style.setProperty('--color', solid);
      this.alpha.root.setAttribute('aria-valuenow', a.toFixed(2));
    }

    // Qualquer formato de saida e cor CSS valida.
    this.preview.style.setProperty('--color', value || 'transparent');

    // Marca a amostra da paleta que corresponde a cor atual.
    const current = this.empty ? null : formatColor(this.hsva);
    for (const btn of this.panel.querySelectorAll('.tuc-colorpicker__swatchbtn')) {
      btn.classList.toggle('is-selected', btn.dataset.color === current);
    }
    if (document.activeElement !== this.hexField) this.hexField.value = value;
  }

  _emit(native = true) {
    const value = this.getValue();
    const detail = { value, rgb: this.getRgb(), hsva: { ...this.hsva }, instance: this };
    this.opts.onChange?.(value, detail);
    this.input.dispatchEvent(new CustomEvent('tucano:change', { detail, bubbles: true }));
    if (native) this._change();
  }

  /** 'change' nativo para validacao de formulario e HTMX enxergarem o valor. */
  _change() {
    this._emitting = true;
    try {
      this.input.dispatchEvent(new Event('change', { bubbles: true }));
    } finally {
      this._emitting = false;
    }
  }
}

/* ------------------------------------------------------------------ */

export function autoInit(scope = document) {
  const out = [];
  for (const node of scope.querySelectorAll('[data-tuc-color]:not([data-tuc-ready])')) {
    const d = node.dataset;
    node.setAttribute('data-tuc-ready', '');
    out.push(new ColorPicker(node, {
      format: d.format || undefined,
      alpha: d.alpha === 'false' ? false : undefined,
      // Virgula dentro de parenteses nao separa: `rgb(255, 0, 0)` virava tres amostras quebradas.
      swatches: d.swatches === 'false' ? false : (d.swatches ? d.swatches.split(/\s*,\s*(?![^(]*\))/) : undefined),
      placement: d.placement || undefined,
    }));
  }
  return out;
}
