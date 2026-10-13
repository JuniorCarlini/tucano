import { omitUndefined, on } from '../core/dom.js';
import { SLIDER_TEXTS as T } from '../core/texts.js';

/*
 * Slider: um valor so, ou um intervalo de minimo e maximo.
 *
 * O controle e o <input type="range"> nativo com o desenho trocado — e, no
 * intervalo, dois deles sobrepostos na mesma trilha. Assim o valor, o `name`, o
 * POST, o `reset`, o teclado (setas, PageUp, PageDown, Home, End) e o anuncio do
 * leitor de tela continuam sendo os do navegador. Um controle desenhado com
 * role="slider" pediria tudo isso de novo, mais um campo escondido por valor.
 *
 * O que fica aqui e o que o nativo nao da: pintar o trecho escolhido da trilha
 * (so o Firefox tem pseudo-elemento para isso), impedir que o minimo passe do
 * maximo, escrever o valor por extenso e, no intervalo, decidir qual das duas
 * pontas o ponteiro pegou.
 */

const DEFAULTS = {
  output: null,      // elemento ou seletor onde o valor aparece escrito; no intervalo, "min – max"
  currency: null,    // codigo ISO 4217 ('BRL'): escreve o valor como dinheiro
  locale: undefined, // default: lang do documento ou do navegador
  format: null,      // (value) => texto; vence currency. Vale para o output e para o leitor de tela
  onChange: null,    // (value, detail) a cada valor novo: no arrasto, a cada movimento; o `change` nativo sai so ao soltar
};

export class Slider {
  constructor(target, options = {}) {
    const node = typeof target === 'string' ? document.querySelector(target) : target;
    if (!node) throw new Error('[Slider] elemento alvo nao encontrado');
    if (node._tucano instanceof Slider) node._tucano.destroy();

    this.node = node;
    this.opts = { ...DEFAULTS, ...omitUndefined(options) };
    // O proprio <input> e o slider simples; um contêiner com dois e o intervalo.
    this.inputs = node.matches('input') ? [node] : [...node.querySelectorAll('input[type=range]')].slice(0, 2);
    if (!this.inputs.length) throw new Error('[Slider] faltou o <input type="range">');
    this.isRange = this.inputs.length === 2;

    const { output, currency, locale } = this.opts;
    this.output = typeof output === 'string' ? document.querySelector(output) : output;
    // Casas pelo `step`: passo 1 escreve "R$ 1.000", e nao "R$ 1.000,00".
    const decimals = (String(this.inputs[0].step).split('.')[1] || '').length;
    this._number = new Intl.NumberFormat(locale || document.documentElement.lang || navigator.language || 'pt-BR', {
      style: currency ? 'currency' : 'decimal', currency: currency || undefined,
      minimumFractionDigits: decimals, maximumFractionDigits: decimals,
    });
    this._labeled = [];
    this._cleanups = [];
    this._build();
  }

  _build() {
    const { node } = this;
    node.classList.add('tuc-slider');
    if (this.isRange) node.classList.add('is-range');
    node._tucano = this;

    // As duas pontas precisam de nome proprio, senao o leitor de tela diz
    // "controle deslizante" duas vezes. So entra onde o template nao deu um.
    this.inputs.forEach((input, i) => {
      if (!this.isRange || input.labels?.length || input.hasAttribute('aria-label') || input.hasAttribute('aria-labelledby')) return;
      input.setAttribute('aria-label', i ? T.max : T.min);
      this._labeled.push(input);
    });

    /*
     * No arrasto, como no color picker, o nosso evento sai a cada movimento — e
     * o que serve a previa ao vivo — e o `change` nativo uma vez, ao soltar, que
     * e o que o HTMX e o filtro por formulario devem ouvir.
     */
    this._cleanups.push(on(node, 'input', (e) => {
      this._clamp(e.target);
      this._paint();
      this._emit();
    }));
    /*
     * No intervalo, os dois nativos ficam com `pointer-events: none` e o ponteiro
     * e tratado aqui. Sobrepostos, quem recebia o clique era sempre o de cima:
     * com as duas pontas no mesmo valor, uma delas ficava presa embaixo da outra.
     */
    if (this.isRange) {
      this._cleanups.push(
        on(node, 'pointerdown', (e) => this._onDown(e)),
        on(node, 'pointermove', (e) => this._onMove(e)),
        on(node, 'lostpointercapture', () => this._onUp()),
      );
    }
    // O reset volta o nativo ao atributo `value` sem disparar nada, e a trilha
    // ficava pintada no valor antigo. O evento chega antes de o valor voltar.
    const form = this.inputs[0].form;
    if (form) this._cleanups.push(on(form, 'reset', () => setTimeout(() => { this._paint(); this._last = String(this.getValue()); })));

    this._paint();
    this._last = String(this.getValue());
  }

  /* ---------------------------------------------------------------- *
   * API publica                                                       *
   * ---------------------------------------------------------------- */

  /** Numero no simples; `[min, max]` no intervalo. */
  getValue() {
    const values = this.inputs.map((i) => +i.value);
    return this.isRange ? values : values[0];
  }

  setValue(value, { silent = false } = {}) {
    const values = [].concat(value).map(Number);
    if (this.isRange) values.sort((a, b) => a - b);
    const before = this.inputs.map((i) => i.value);
    this.inputs.forEach((input, i) => { if (!Number.isNaN(values[i])) input.value = values[i]; });
    this._clamp();
    this._paint();
    if (silent) this._last = String(this.getValue());
    else {
      // `input` e `change` no nativo que mudou, para validacao e HTMX. O nosso
      // evento sai no primeiro `input`, ja com o par inteiro, e uma vez so.
      this.inputs.forEach((input, i) => {
        if (input.value === before[i]) return;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }
    return this;
  }

  destroy() {
    this._cleanups.forEach((fn) => fn());
    this._cleanups = [];
    this._labeled.forEach((input) => input.removeAttribute('aria-label'));
    this.inputs.forEach((input) => input.removeAttribute('aria-valuetext'));
    this.node.style.removeProperty('--tuc-slider-from');
    this.node.style.removeProperty('--tuc-slider-to');
    delete this.node._tucano;
  }

  /* ---------------------------------------------------------------- *
   * Interno                                                           *
   * ---------------------------------------------------------------- */

  /** Posicao de 0 a 1 do valor dentro de min e max (os padroes do nativo: 0 e 100). */
  _at(input) {
    const min = +input.min || 0, max = input.max === '' ? 100 : +input.max;
    return max > min ? (input.value - min) / (max - min) : 0;
  }

  /* A ponta que se move para na outra: o minimo nunca passa do maximo. */
  _clamp(moved) {
    const [low, high] = this.inputs;
    if (high && +low.value > +high.value) {
      if (moved === high) high.value = low.value;
      else low.value = high.value;
    }
  }

  _format(input) {
    return this.opts.format ? this.opts.format(+input.value) : this._number.format(+input.value);
  }

  _paint() {
    const [low, high] = this.inputs;
    if (high) this.node.style.setProperty('--tuc-slider-from', this._at(low));
    this.node.style.setProperty('--tuc-slider-to', this._at(high || low));
    // O leitor de tela le "R$ 1.000" no lugar de "1000".
    const texts = this.inputs.map((input) => {
      const text = this._format(input);
      input.setAttribute('aria-valuetext', text);
      return text;
    });
    if (this.output) this.output.textContent = high ? T.range(texts[0], texts[1]) : texts[0];
  }

  /* So quando o valor muda: a ponta que empurra a outra dispara `input` parada. */
  _emit() {
    const value = this.getValue();
    if (String(value) === this._last) return;
    this._last = String(value);
    const detail = { value, instance: this };
    this.opts.onChange?.(value, detail);
    this.node.dispatchEvent(new CustomEvent('tucano:change', { detail, bubbles: true }));
  }

  /*
   * Posicao do ponteiro de 0 a 1. O centro do botao anda de meio botao ate a
   * largura menos meio botao — sem descontar isso, o botao fugia do ponteiro
   * perto das pontas. A medida vem do token, em rem ou px.
   */
  _pointer(e) {
    const r = this.node.getBoundingClientRect();
    const token = getComputedStyle(this.node).getPropertyValue('--tuc-slider-thumb').trim();
    const thumb = parseFloat(token) * (token.endsWith('rem') ? parseFloat(getComputedStyle(document.documentElement).fontSize) : 1);
    return Math.min(1, Math.max(0, (e.clientX - r.left - thumb / 2) / (r.width - thumb)));
  }

  _onDown(e) {
    const [low, high] = this.inputs;
    if (e.button !== 0 || low.matches(':disabled')) return;
    // Sem isto o arrasto selecionava o texto em volta, e o foco ia para o contêiner.
    e.preventDefault();
    const at = this._pointer(e);
    const toLow = Math.abs(at - this._at(low)), toHigh = Math.abs(at - this._at(high));
    this._from = at;
    this._before = this.inputs.map((i) => i.value);
    // Empate e as duas pontas no mesmo lugar: quem decide e o primeiro movimento.
    this._active = toLow === toHigh ? null : toLow < toHigh ? low : high;
    this.node.setPointerCapture(e.pointerId);
    if (this._active) this._move(at);
  }

  _onMove(e) {
    if (!this._before || !this.node.hasPointerCapture(e.pointerId)) return;
    const at = this._pointer(e);
    if (!this._active) {
      if (at === this._from) return;
      this._active = this.inputs[at < this._from ? 0 : 1];
    }
    this._move(at);
  }

  _move(at) {
    const input = this._active;
    if (document.activeElement !== input) input.focus({ preventScroll: true });
    const min = +input.min || 0, max = input.max === '' ? 100 : +input.max;
    // O navegador arredonda para o `step` e prende entre min e max sozinho.
    input.value = min + at * (max - min);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  _onUp() {
    const input = this._active, before = this._before;
    this._active = this._before = null;
    if (input && input.value !== before[this.inputs.indexOf(input)]) {
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
}

export function autoInit(scope = document) {
  const out = [];
  for (const node of scope.querySelectorAll('[data-tuc-slider]:not([data-tuc-ready])')) {
    node.setAttribute('data-tuc-ready', '');
    const d = node.dataset;
    out.push(new Slider(node, { output: d.output, currency: d.currency, locale: d.locale }));
  }
  return out;
}
