import { clamp, formatColor, hsvToRgb, isDark, parseColor, rgbToHex } from '../core/color.js';
import { openWithTransition, el, icon, ICONS, nextId, on } from '../core/dom.js';
import { ICONS_EXTRA } from '../core/dom-extra.js';
import { Popover } from '../core/popover.js';

const PALETA = [
  '#0a0a0a', '#525252', '#a3a3a3', '#e5e5e5', '#ffffff',
  '#e11d48', '#ea580c', '#f59e0b', '#16a34a', '#0d9488',
  '#0284c7', '#4f46e5', '#7c3aed', '#c026d3', '#be123c',
];

const DEFAULTS = {
  format: 'hex',          // 'hex' | 'rgb' | 'hsl'
  alpha: true,
  swatches: PALETA,       // false desliga
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

    this.opts = { ...DEFAULTS, ...omitUndefined(options) };
    this.input = node;
    this.id = nextId('cor');
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
      onDismiss: () => this.close(),
    });
    this.popover.show();
    openWithTransition(this.panel);
    this.swatch.setAttribute('aria-expanded', 'true');
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.panel.classList.remove('is-open');
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
    delete this.input._tucano;
  }

  /* ---------------------------------------------------------------- *
   * Construcao                                                        *
   * ---------------------------------------------------------------- */

  _build() {
    this.swatch = el('button', {
      type: 'button',
      class: 'tuc-color-field__swatch',
      'aria-label': 'Escolher cor',
      'aria-haspopup': 'dialog',
      'aria-expanded': 'false',
      onclick: () => this.toggle(),
      // Enter e Espaco o navegador ja converte em clique num <button>; a seta
      // para baixo e a que falta, e e a mesma dos outros campos.
      onkeydown: (e) => {
        if (e.key === 'ArrowDown' && !this.isOpen) { e.preventDefault(); this.open(); }
      },
    });

    this.field = el('div', { class: 'tuc-color-field' });
    this.input.replaceWith(this.field);
    this.input.classList.add('tuc-color-field__value');
    this.field.append(this.swatch, this.input);

    // Clicar em qualquer parte do controle leva o cursor ao valor.
    this._cleanups.push(on(this.field, 'mousedown', (e) => {
      if (e.target === this.field) { e.preventDefault(); this.input.focus(); }
    }));

    this.area = el('div', {
      class: 'tuc-colorpicker__area', tabindex: 0, role: 'application',
      'aria-label': 'Saturacao e brilho',
    }, [el('span', { class: 'tuc-colorpicker__thumb' })]);

    this.hue = this._buildSlider('hue', 'Matiz', 360);
    this.alpha = this.opts.alpha ? this._buildSlider('alpha', 'Opacidade', 1) : null;

    this.preview = el('span', { class: 'tuc-colorpicker__preview' });
    this.hexField = el('input', {
      class: 'tuc-colorpicker__field', type: 'text', spellcheck: 'false',
      autocomplete: 'off', 'aria-label': 'Valor da cor',
    });

    const fieldRow = el('div', { class: 'tuc-colorpicker__row' }, [
      this.preview,
      this.hexField,
      supportsEyeDropper() ? el('button', {
        type: 'button', class: 'tuc-btn is-ghost is-icon tuc-colorpicker__pick', 'aria-label': 'Capturar cor da tela',
        onclick: () => this._capturarDaTela(),
      }, [icon(ICONS_EXTRA.pipette, 15)]) : null,
    ]);

    const trilhas = el('div', { class: 'tuc-colorpicker__tracks' }, [this.hue.root, this.alpha?.root]);

    this.panel = el('div', {
      class: 'tuc-colorpicker', role: 'dialog', 'aria-label': 'Seletor de cor', id: this.id,
    }, [this.area, trilhas, fieldRow, this.opts.swatches ? this._buildSwatches() : null]);

    this._cleanups.push(
      this._dragHandler(this.area, (x, y) => {
        this.hsva = { ...this.hsva, s: x, v: 1 - y };
        this._commit();
      }),
      on(this.area, 'keydown', (e) => this._areaKeys(e)),
      on(this.input, 'change', () => {
        // Ignora o `change` que nos mesmos disparamos em _emit(): sem isso,
        // setValue -> _emit -> change -> setValue vira recursao infinita.
        if (this._emitting) return;
        // Texto invalido volta para o valor atual, em vez de zerar a cor.
        if (!this.setValue(this.input.value)) this._syncInput();
      }),
      /*
       * Abrir no foco do campo de texto atrapalhava duas vezes: o painel subia
       * so de tabular por um formulario, e cobria o proprio campo de quem
       * queria digitar o hex. O gatilho e a amostra ao lado, que e <button> e
       * ja responde a Enter e Espaco por conta do navegador. Aqui fica so a
       * seta para baixo, igual a do campo de data.
       */
      on(this.input, 'keydown', (e) => {
        if (e.key === 'ArrowDown' && !this.isOpen) { e.preventDefault(); this.open(); }
      }),
      on(this.hexField, 'change', () => {
        if (!this.setValue(this.hexField.value)) this._paint();
      }),
      on(this.panel, 'keydown', (e) => {
        if (e.key === 'Escape') { e.stopPropagation(); this.close(); this.swatch.focus(); }
      }),
    );
  }

  _buildSlider(type, label, max) {
    const thumb = el('span', { class: 'tuc-colorpicker__thumb' });
    const root = el('div', {
      class: `tuc-colorpicker__slider is-${type}`, tabindex: 0, role: 'slider',
      'aria-label': label, 'aria-valuemin': '0', 'aria-valuemax': String(max),
    }, [el('span', { class: 'tuc-colorpicker__track' }), thumb]);

    this._cleanups.push(
      this._dragHandler(root, (x) => {
        this.hsva = type === 'hue' ? { ...this.hsva, h: x * 360 } : { ...this.hsva, a: x };
        this._commit();
      }),
      on(root, 'keydown', (e) => {
        const step = e.shiftKey ? 10 : 1;
        const delta = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[e.key];
        if (!delta) return;
        e.preventDefault();
        this.hsva = type === 'hue'
          ? { ...this.hsva, h: (this.hsva.h + delta * step + 360) % 360 }
          : { ...this.hsva, a: clamp(this.hsva.a + delta * step / 100, 0, 1) };
        this._commit();
      }),
    );
    return { root, thumb };
  }

  _buildSwatches() {
    return el('div', { class: 'tuc-colorpicker__swatches' },
      this.opts.swatches.map((color) => el('button', {
        type: 'button',
        class: 'tuc-colorpicker__swatchbtn',
        style: `--color: ${color}`,
        'aria-label': color,
        title: color,
        dataset: { color: normalize(color) },
        onclick: () => { this.setValue(color); },
      })));
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
    const move = (e) => { if (node.hasPointerCapture(e.pointerId)) applyPointer(e); };
    const up = (e) => { if (node.hasPointerCapture(e.pointerId)) node.releasePointerCapture(e.pointerId); };

    const offs = [on(node, 'pointerdown', down), on(node, 'pointermove', move), on(node, 'pointerup', up)];
    return () => offs.forEach((f) => f());
  }

  _areaKeys(e) {
    const step = (e.shiftKey ? 10 : 2) / 100;
    const mapa = {
      ArrowLeft: { s: -step }, ArrowRight: { s: step },
      ArrowUp: { v: step }, ArrowDown: { v: -step },
    };
    const d = mapa[e.key];
    if (!d) return;
    e.preventDefault();
    this.hsva = {
      ...this.hsva,
      s: clamp(this.hsva.s + (d.s || 0), 0, 1),
      v: clamp(this.hsva.v + (d.v || 0), 0, 1),
    };
    this._commit();
  }

  async _capturarDaTela() {
    try {
      const { sRGBHex } = await new window.EyeDropper().open();
      this.setValue(sRGBHex);
    } catch { /* usuario cancelou */ }
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
    this.swatch.style.setProperty('--color', value);
  }

  /** Repinta os controles a partir do HSVA atual. */
  _paint() {
    const { h, s, v, a } = this.hsva;
    const pure = rgbToHex(hsvToRgb({ h, s: 1, v: 1 }));
    const solid = rgbToHex(hsvToRgb(this.hsva));

    this.area.style.setProperty('--matiz', pure);
    this.area.firstElementChild.style.left = `${s * 100}%`;
    this.area.firstElementChild.style.top = `${(1 - v) * 100}%`;
    this.area.firstElementChild.style.setProperty('--color', solid);
    this.area.firstElementChild.classList.toggle('is-dark', isDark(this.hsva));

    this.hue.thumb.style.left = `${(h / 360) * 100}%`;
    this.hue.thumb.style.setProperty('--color', pure);
    this.hue.root.setAttribute('aria-valuenow', String(Math.round(h)));

    if (this.alpha) {
      this.alpha.root.style.setProperty('--color', solid);
      this.alpha.thumb.style.left = `${a * 100}%`;
      this.alpha.thumb.style.setProperty('--color', solid);
      this.alpha.root.setAttribute('aria-valuenow', a.toFixed(2));
    }

    this.preview.style.setProperty('--color', formatColor(this.hsva, 'rgb'));

    // Marca a amostra da paleta que corresponde a cor atual.
    const atual = rgbToHex(hsvToRgb(this.hsva));
    for (const btn of this.panel.querySelectorAll('.tuc-colorpicker__swatchbtn')) {
      btn.classList.toggle('is-selected', btn.dataset.color === atual);
    }
    if (document.activeElement !== this.hexField) this.hexField.value = this.getValue();
  }

  _emit() {
    const value = this.getValue();
    const detail = { value, rgb: this.getRgb(), hsva: { ...this.hsva }, instance: this };
    this._emitting = true;
    try {
      this.opts.onChange?.(value, detail);
      this.input.dispatchEvent(new CustomEvent('tucano:change', { detail, bubbles: true }));
      // 'change' nativo para validacao de formulario e HTMX enxergarem o valor.
      this.input.dispatchEvent(new Event('change', { bubbles: true }));
    } finally {
      this._emitting = false;
    }
  }
}

/* ------------------------------------------------------------------ */

/** Reduz qualquer notacao a hex de 6 digitos, para comparar amostras. */
function normalize(color) {
  const p = parseColor(color);
  return p ? rgbToHex(hsvToRgb(p)) : String(color).toLowerCase();
}

function supportsEyeDropper() {
  return typeof window !== 'undefined' && 'EyeDropper' in window;
}

function omitUndefined(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) if (v !== undefined) out[k] = v;
  return out;
}

export function autoInit(scope = document) {
  const out = [];
  for (const node of scope.querySelectorAll('[data-tuc-color]:not([data-tuc-ready])')) {
    const d = node.dataset;
    node.setAttribute('data-tuc-ready', '');
    out.push(new ColorPicker(node, {
      format: d.format || undefined,
      alpha: d.alpha === 'false' ? false : undefined,
      swatches: d.swatches === 'false' ? false : (d.swatches ? d.swatches.split(/\s*,\s*/) : undefined),
      placement: d.placement || undefined,
    }));
  }
  return out;
}
