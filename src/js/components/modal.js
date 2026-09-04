import { el, nextId, omitUndefined } from '../core/dom.js';
import { Dialog, buildPanel } from '../core/dialog.js';

/*
 * Modal: dialogo centrado na tela.
 *
 * A mecanica do <dialog> — top layer, foco preso, Escape, devolver o foco —
 * mora em core/dialogo.js, compartilhada com a gaveta. Aqui fica so o que e
 * proprio do modal: a caixa no centro, e uma entrada que cresce em vez de
 * deslizar.
 */

const DEFAULTS = {
  title: null,
  text: '',
  size: 'md',       // sm | md | lg | full
  tone: 'default',       // default | danger | success | warning
  sheet: false,        // no celular sobe do rodape em vez de surgir no centro
  closable: true,      // botao X e Escape
  closeOnBackdrop: true,
  actions: null,         // [{ text, variant, onClick, closes }] — closes:false mantem aberto
  onClose: null,
  className: '',
};

export class Modal extends Dialog {
  constructor(options = {}) {
    super();
    this.opts = { ...DEFAULTS, ...omitUndefined(options) };
    this.id = nextId('modal');
    this._cleanups = [];
    this._build();
  }

  _build() {
    const titleId = `${this.id}-title`;
    this.panel = buildPanel('tuc-modal', this.opts, this, titleId);

    this.node = el('dialog', {
      class: [
        'tuc-modal',
        `is-${this.opts.size}`,
        `is-${this.opts.tone}`,
        this.opts.sheet ? 'is-sheet' : '',
        this.opts.className,
      ].filter(Boolean).join(' '),
      id: this.id,
      // O titulo nomeia o dialogo; sem titulo o proprio texto serve.
      ...(this.opts.title ? { 'aria-labelledby': titleId } : {}),
    }, [this.panel]);

    this.body = this.panel.querySelector('.tuc-modal__body');
    this.node._tucano = this;
  }
}

/** Atalho: cria e abre num passo. */
export function modal(optionsOrText, extra = {}) {
  const base = typeof optionsOrText === 'string' ? { text: optionsOrText } : optionsOrText;
  return new Modal({ ...base, ...extra }).open();
}

/**
 * Confirmacao que devolve promessa — o caso mais comum de modal num CRUD:
 *
 *   if (await Tucano.confirmar({ title: 'Excluir contrato?' })) excluir();
 */
export function confirm(options = {}) {
  const { confirm: okLabel = 'Confirmar', cancel = 'Cancelar', ...rest } = options;
  // O tom sai daqui, e nao de resto.tom, porque o padrao e perigo: lendo so o
  // que veio de fora, um dialogo vermelho ganhava botao azul de confirmar.
  const tone = rest.tone ?? 'danger';
  return new Promise((resolve) => {
    let decided = false;
    const responder = (v) => { decided = true; resolve(v); };
    new Modal({
      ...rest,
      tone,
      actions: [
        { text: cancel, variant: 'outline', onClick: () => responder(false) },
        { text: okLabel, variant: tone === 'danger' ? 'danger' : 'primary', onClick: () => responder(true) },
      ],
      // Fechar pelo X, pelo Escape ou pelo fundo e uma recusa, nao um limbo:
      // sem isto a promessa ficaria pendente para sempre.
      onClose: (reason, m) => { if (!decided) resolve(false); rest.onClose?.(reason, m); },
    }).open();
  });
}

/**
 * Modais escritos no template — util quando o conteudo vem renderizado pelo
 * servidor, como um form do Django:
 *
 *   <dialog class="tuc-modal is-md" id="excluir"> ... </dialog>
 *   <button data-tuc-modal="#excluir">Excluir</button>
 */
export function autoInit(scope = document) {
  const out = [];

  for (const node of scope.querySelectorAll('dialog.tuc-modal:not([data-tuc-ready])')) {
    node.setAttribute('data-tuc-ready', '');
    const d = node.dataset;
    const m = Object.create(Modal.prototype);
    m.opts = { ...DEFAULTS, closable: d.closable !== 'false', closeOnBackdrop: d.backdrop !== 'false' };
    m.id = node.id || nextId('modal');
    m._cleanups = [];
    m.panel = node.querySelector('.tuc-modal__panel');
    m.body = node.querySelector('.tuc-modal__body');
    m._adopt(node);

    for (const b of node.querySelectorAll('[data-tuc-modal-close]')) {
      b.addEventListener('click', () => m.close('botao'));
    }
    out.push(m);
  }

  for (const trigger of scope.querySelectorAll('[data-tuc-modal]:not([data-tuc-ready])')) {
    trigger.setAttribute('data-tuc-ready', '');
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelector(trigger.dataset.tucModal)?._tucano?.open();
    });
  }

  return out;
}
