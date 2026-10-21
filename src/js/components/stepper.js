import { omitUndefined, on } from '../core/dom.js';

/*
 * Assistente em etapas.
 *
 * O template traz tudo desenhado: o indicador (.tuc-steps, que funciona sozinho,
 * sem script), os paineis com `hidden` a partir do segundo e os botoes. O que
 * fica aqui e o que HTML nao da: trocar de etapa, conferir os campos da etapa
 * antes de avancar e levar o foco ao titulo do painel novo.
 *
 * O <form> continua um so, com tudo dentro. Painel escondido nao sai do DOM,
 * entao todo `name` vai no POST final, e o servidor recebe o mesmo que receberia
 * de um formulario comprido. Por isso nao ha estado em JS para sincronizar.
 */

const DEFAULTS = {
  start: null,       // indice da etapa inicial; sem ele, a do primeiro campo com erro, a marcada com aria-current="step", ou a primeira
  validate: true,    // avancar confere os campos da etapa atual; voltar nunca confere
  onChange: null,    // (index, detail) a cada troca de etapa feita pela pessoa ou por go()
};

const FIELDS = 'input, select, textarea';

export class Stepper {
  constructor(target, options = {}) {
    this.node = typeof target === 'string' ? document.querySelector(target) : target;
    if (!this.node) throw new Error('[Stepper] elemento não encontrado');
    this.opts = { ...DEFAULTS, ...omitUndefined(options) };
    this.index = -1;
    this._cleanups = [];
    this._watched = new WeakSet();
    this._build();
  }

  /* `:scope >` porque um assistente pode morar dentro do painel de outro. */
  get steps() {
    return [...this.node.querySelectorAll(':scope > .tuc-steps > .tuc-steps__item')];
  }

  get panels() {
    return [...this.node.querySelectorAll(':scope > .tuc-stepper__panel')];
  }

  _build() {
    this.node.classList.add('tuc-stepper');
    this.node._tucano = this;

    this._cleanups.push(
      on(this.node, 'click', (e) => {
        const button = e.target.closest('[data-step]');
        if (!button || button.closest('.tuc-stepper') !== this.node) return;
        if (button.dataset.step === 'next') this.next();
        else if (button.dataset.step === 'prev') this.prev();
      }),
      /*
       * Enter num campo de texto envia o formulario — e, com a etapa final ainda
       * escondida, o navegador barrava o envio por um campo obrigatorio que a
       * pessoa nem viu, sem dizer qual. Antes da ultima etapa, Enter e Continuar.
       * Quem ja tratou a tecla (o select, o date picker) chamou preventDefault.
       */
      on(this.node, 'keydown', (e) => {
        if (e.key !== 'Enter' || e.defaultPrevented || e.isComposing) return;
        if (!e.target.matches('input:not([type=checkbox], [type=radio], [type=button], [type=submit], [type=reset], [type=file])')) return;
        if (e.target.closest('.tuc-stepper') !== this.node || this.index >= this.panels.length - 1) return;
        e.preventDefault();
        this.next();
      }),
    );
    // Reset do formulario volta ao comeco, junto com os valores.
    const form = this.node.closest('form');
    if (form) this._cleanups.push(on(form, 'reset', () => this.go(0, { focus: false })));

    this.go(this._initial(), { silent: true, focus: false });
  }

  /*
   * O formulario que volta do servidor com erro precisa abrir na etapa do erro:
   * o Django marca o campo com aria-invalid, e abrir na primeira deixaria a
   * mensagem escondida duas etapas adiante.
   */
  _initial() {
    if (this.opts.start != null) return this.opts.start;
    const panels = this.panels;
    const failed = panels.findIndex((p) => p.querySelector('[aria-invalid="true"]'));
    if (failed >= 0) return failed;
    const marked = this.steps.findIndex((s) => s.getAttribute('aria-current') === 'step');
    return marked >= 0 && marked < panels.length ? marked : 0;
  }

  /** Confere os campos da etapa atual. O primeiro invalido recebe o aviso do navegador e o foco. */
  checkStep() {
    const panel = this.panels[this.index];
    if (!panel) return true;
    for (const field of panel.querySelectorAll(FIELDS)) {
      if (field.checkValidity()) continue;
      // Quem valida aqui e o componente, entao o atributo e dele ate a pessoa
      // mexer no campo — ver "Atributo de erro e de quem renderizou o campo".
      field.setAttribute('aria-invalid', 'true');
      if (!this._watched.has(field)) {
        this._watched.add(field);
        const clear = () => { if (field.checkValidity()) field.removeAttribute('aria-invalid'); };
        field.addEventListener('input', clear);
        field.addEventListener('change', clear);
      }
      field.reportValidity();
      return false;
    }
    return true;
  }

  next() {
    if (this.opts.validate && !this.checkStep()) return this;
    return this.go(this.index + 1);
  }

  prev() {
    return this.go(this.index - 1);
  }

  go(index, { silent = false, focus = true } = {}) {
    const panels = this.panels;
    if (index < 0 || index >= panels.length || index === this.index) return this;
    this.index = index;

    this.steps.forEach((step, i) => {
      step.classList.toggle('is-done', i < index);
      if (i === index) step.setAttribute('aria-current', 'step');
      else step.removeAttribute('aria-current');
    });
    panels.forEach((panel, i) => { panel.hidden = i !== index; });

    const last = index === panels.length - 1;
    for (const button of this._buttons('[data-step="prev"]')) button.hidden = index === 0;
    for (const button of this._buttons('[data-step="next"]')) button.hidden = last;
    for (const button of this._buttons('[type="submit"]')) button.hidden = !last;

    if (focus) this._focus(panels[index]);
    if (!silent) this._emit();
    return this;
  }

  /* Botoes da barra deste assistente, nao de um aninhado. */
  _buttons(selector) {
    return [...this.node.querySelectorAll(`:scope > .tuc-stepper__actions ${selector}`)];
  }

  /*
   * O foco vai ao titulo do painel novo: o leitor de tela anuncia a etapa, e o
   * proximo Tab chega ao primeiro campo. Deixar o foco no botao Continuar, que
   * pode ate ter sumido na ultima etapa, largava a pessoa no meio do nada.
   */
  _focus(panel) {
    const heading = panel.querySelector('h1, h2, h3, h4, h5, h6, legend') || panel;
    if (!heading.hasAttribute('tabindex')) heading.tabIndex = -1;
    // O painel acabou de perder o `hidden`, e o Firefox so considera focavel o
    // que ja tem caixa: sem forcar o layout aqui, o focus() era ignorado calado
    // e o foco ficava no campo da etapa anterior, agora escondido.
    void panel.offsetHeight;
    heading.focus({ preventScroll: true });
    // Num formulario comprido o topo da etapa nova pode ter ficado acima da tela.
    if (this.node.getBoundingClientRect().top < 0) this.node.scrollIntoView({ block: 'start' });
  }

  _emit() {
    const value = this.index;
    const detail = { value, step: this.steps[value], panel: this.panels[value], instance: this };
    this.opts.onChange?.(value, detail);
    this.node.dispatchEvent(new CustomEvent('tucano:change', { detail, bubbles: true }));
  }

  destroy() {
    this._cleanups.forEach((fn) => fn());
    this._cleanups = [];
    delete this.node._tucano;
  }
}

export function autoInit(scope = document) {
  const out = [];
  for (const node of scope.querySelectorAll('[data-tuc-stepper]:not([data-tuc-ready])')) {
    node.setAttribute('data-tuc-ready', '');
    const start = node.dataset.start;
    out.push(new Stepper(node, {
      start: start ? Number(start) : undefined,
      validate: node.dataset.validate === 'false' ? false : undefined,
    }));
  }
  return out;
}
