import { apply, applyCurrency, capacity, clear, cursorAfter, format, pickTemplate, placeholderFromTemplate, validateCNPJ, validateCPF, validateCpfCnpj } from '../core/mask.js';
import { maskMiddle } from '../core/mask.js';
import { el, icon, ICON_EYE, ICON_EYE_OFF, omitUndefined, on } from '../core/dom.js';

/**
 * Formatos prontos.
 *
 * Um array significa gabarito escolhido pelo tamanho: telefone fixo ou celular,
 * documento que pode ser CPF ou CNPJ.
 *
 * O `cnpj` aceita letras nas doze primeiras posicoes porque e o que o formato
 * novo permite; as duas ultimas seguem numericas. Quem precisa recusar letras
 * durante a transicao usa `cnpj-numeric`.
 */
export const FORMATS = {
  cpf: { template: '###.###.###-##', validate: validateCPF, error: 'CPF inválido' },
  cnpj: { template: '**.***.***/****-##', validate: validateCNPJ, error: 'CNPJ inválido', uppercase: true },
  'cnpj-numeric': { template: '##.###.###/####-##', validate: validateCNPJ, error: 'CNPJ inválido' },
  'cpf-cnpj': {
    template: ['###.###.###-##', '**.***.***/****-##'],
    validate: validateCpfCnpj, error: 'Documento inválido', uppercase: true,
  },
  phone: { template: ['(##) ####-####', '(##) #####-####'] },
  mobile: { template: '(##) #####-####' },
  cep: { template: '#####-###' },
  date: { template: '##/##/####' },
  time: { template: '##:##' },
  card: { template: '#### #### #### ####' },
  currency: { isCurrency: true },
  real: { isCurrency: true, currency: 'BRL' },
};

/*
 * Nomes antigos, de quando valor de opcao ainda saia em portugues. Continuam
 * aceitos para quem ja escreveu no template; fora daqui, so os nomes novos.
 */
const LEGACY_FORMATS = { 'cnpj-numerico': 'cnpj-numeric' };

const DEFAULTS = {
  format: null,        // nome de FORMATS ou gabarito livre
  validate: false,     // valida no blur e bloqueia o submit
  decimals: 2,
  currency: null,      // 'BRL' formata com R$
  reveal: false,       // olhinho para mostrar e ocultar
  revealVisible: 2,    // quantos caracteres ficam a mostra no modo 'end'
  revealMode: null,    // 'end' | 'email' | 'all'. null decide pelo campo
  locale: undefined,
  errorText: null,
  onChange: null,
};

/**
 * Mascara de campo. Nao envolve nem substitui o input: e comportamento puro,
 * entao o estilo do projeto continua valendo sem nenhum ajuste.
 */
export class Mask {
  constructor(target, options = {}) {
    const node = typeof target === 'string' ? document.querySelector(target) : target;
    if (!node) throw new Error('[Mask] elemento alvo nao encontrado');

    this.opts = { ...DEFAULTS, ...omitUndefined(options) };
    this.opts.locale = this.opts.locale || document.documentElement.lang || 'pt-BR';
    this.input = node;
    // O componente e dono do proprio campo, entao ele veste a classe: quem
    // escreve o template nao deveria ter de lembrar disso, e sem ela o input
    // aparece com a caixa nativa do navegador ao lado dos nossos controles.
    node.classList.add('tuc-input');

    this.opts.format = LEGACY_FORMATS[this.opts.format] ?? this.opts.format;
    const preset = FORMATS[this.opts.format];
    this.preset = preset || null;
    this.isCurrency = !!preset?.isCurrency;
    this.templates = preset ? preset.template : this.opts.format;
    this.uppercase = !!preset?.uppercase;
    if (preset?.currency && !this.opts.currency) this.opts.currency = preset.currency;
    if (!this.isCurrency && !this.templates && !this.opts.reveal) {
      throw new Error('[Mask] informe um formato ou gabarito');
    }

    // So preenche o que o autor deixou vazio: placeholder escrito a mao manda.
    // Moeda nao tem gabarito, entao o texto e o zero ja formatado — sem ele o
    // campo nascia em branco e parecia campo comum ao lado do CPF.
    if (!node.getAttribute('placeholder')) {
      if (this.isCurrency) {
        node.placeholder = applyCurrency('0', {
          decimals: this.opts.decimals, locale: this.opts.locale, currency: this.opts.currency,
        });
      } else if (this.templates) {
        node.placeholder = placeholderFromTemplate(this.templates);
      }
    }

    this._cleanups = [];
    this._wire();
    if (node.value && !this.isCurrency && this.templates) this._format({ keepCursor: false });
    else if (node.value && this.isCurrency) this._format({ keepCursor: false });
    if (this.opts.reveal) this._buildEye();
    node._tucano = this;
  }

  /* ---------------------------------------------------------------- *
   * API publica                                                       *
   * ---------------------------------------------------------------- */

  /** Conteudo sem formatacao: so digitos, ou digitos e letras. */
  getRaw() {
    const text = this.rawValue ?? this.input.value;
    if (this.isCurrency) return text.replace(/\D/g, '');
    if (!this.templates) return text;
    return clear(text, [].concat(this.templates).join(''));
  }

  /** Numero, no formato moeda. */
  getNumber() {
    if (!this.isCurrency) return null;
    const d = this.getRaw();
    return d ? Number(d) / 10 ** this.opts.decimals : null;
  }

  setValue(value) {
    this.input.value = String(value ?? '');
    this._format({ keepCursor: false });
    // O escondido do campo sensivel e quem posta; sem isto ele so acompanhava a
    // digitacao, e um valor posto por codigo nao chegava ao servidor.
    if (this.hidden) this.hidden.value = this.getRaw();
    this._emit();
  }

  isValid() {
    const validate = this.preset?.validate;
    if (!validate) return true;
    const raw = this.getRaw();
    return raw ? validate(raw) : true;   // vazio e problema do `required`
  }

  destroy() {
    this._cleanups.forEach((fn) => fn());
    this._cleanups = [];
    if (this.wrapper) {
      if (this.rawValue != null) this.input.value = this.rawValue;
      if (this.realName) this.input.name = this.realName;
      this.input.readOnly = this.readOnlyOriginal ?? false;
      this.wrapper.replaceWith(this.input);
      this.hidden?.remove();
    }
    this.input.setCustomValidity?.('');
    this.input.classList.remove('tuc-invalid');
    this.input.removeAttribute('data-tuc-valid');
    delete this.input._tucano;
  }


  /* ---------------------------------------------------------------- *
   * Olhinho: mostrar e ocultar                                        *
   * ---------------------------------------------------------------- */

  /**
   * Campo sensivel.
   *
   * Num <input type="password"> o olho so alterna o `type`, que e o
   * comportamento que todo mundo espera.
   *
   * Nos demais, o valor real fica num input hidden que carrega o `name`, e o
   * campo visivel mostra `•••.•••.•••-01`. Assim o que aparece na tela nunca
   * e o dado inteiro, mas o formulario posta o valor certo — nada muda no
   * servidor. Campo vazio comeca visivel: quem esta digitando precisa ver.
   */
  _buildEye() {
    const input = this.input;
    this.password = input.type === 'password';

    this.wrapper = el('span', { class: 'tuc-field' });
    input.replaceWith(this.wrapper);
    this.wrapper.append(input);

    if (!this.password && input.name) {
      this.realName = input.name;
      input.removeAttribute('name');
      this.hidden = el('input', { type: 'hidden', name: this.realName, value: this.getRaw() });
      this.wrapper.append(this.hidden);
    }

    this.eye = el('button', {
      type: 'button',
      class: 'tuc-btn is-ghost is-icon is-sm tuc-field__eye',
      'aria-label': 'Mostrar',
      'aria-pressed': 'false',
      onclick: () => this._toggle(),
    });
    this.wrapper.append(this.eye);

    // Vazio comeca a mostra; com conteudo, comeca escondido.
    this.showing = !input.value;
    this._paintEye();

    this._cleanups.push(on(input, 'input', () => {
      if (this.hidden) this.hidden.value = this.getRaw();
    }));
  }

  /**
   * Modo de esconder. Escolhido pelo campo quando nao informado: `type=email`
   * guarda o dominio, o resto guarda o fim.
   */
  _hiddenMode() {
    if (this.opts.revealMode) return this.opts.revealMode;
    if (this.input.type === 'email') return 'email';
    return 'end';
  }

  _toggle() {
    this.showing = !this.showing;
    this._paintEye();
    if (this.showing) this.input.focus();
  }

  _paintEye() {
    const input = this.input;
    const showing = this.showing;

    if (this.password) {
      input.type = showing ? 'text' : 'password';
    } else {
      if (showing) {
        if (this.rawValue != null) { input.value = this.rawValue; this.rawValue = null; }
        input.readOnly = this.readOnlyOriginal ?? false;
      } else {
        this.readOnlyOriginal = input.readOnly;
        this.rawValue = input.value;
        input.value = maskMiddle(input.value, this.opts.revealVisible, this._hiddenMode());
        // So leitura enquanto oculto: digitar em cima dos pontos escreveria
        // por cima do valor real sem a pessoa perceber.
        input.readOnly = true;
      }
    }

    this.eye.replaceChildren(icon(showing ? ICON_EYE_OFF : ICON_EYE, 16));
    this.eye.setAttribute('aria-label', showing ? 'Ocultar' : 'Mostrar');
    this.eye.setAttribute('aria-pressed', String(showing));
    this.wrapper.classList.toggle('is-hidden', !showing);
  }

  /* ---------------------------------------------------------------- *
   * Interno                                                           *
   * ---------------------------------------------------------------- */

  _wire() {
    const input = this.input;
    if (!input.getAttribute('inputmode')) {
      input.setAttribute('inputmode', this.isCurrency || !/[A*]/.test([].concat(this.templates).join('')) ? 'numeric' : 'text');
    }
    input.setAttribute('autocomplete', input.getAttribute('autocomplete') || 'off');

    this._cleanups.push(
      on(input, 'input', (e) => this._onType(e)),
      on(input, 'blur', () => { if (this.opts.validate) this._validate(); }),
      // So quem valida mexe no erro. Sem `validate`, o aria-invalid e de quem
      // renderizou o campo — o Django 5 o escreve no campo que voltou com erro — e
      // zera-lo no foco apagava a marca vermelha no primeiro clique. No foco o
      // vermelho sai, mas o verde de um valor ja certo fica.
      on(input, 'focus', () => { if (this.opts.validate) this._mark(true, this._complete()); }),
    );
  }

  _onType(e) {
    const input = this.input;
    const cursor = input.selectionStart ?? input.value.length;
    const type = typeof e.inputType === 'string' ? e.inputType : '';
    this._format({
      cursor,
      deleting: type.startsWith('delete'),
      forward: type === 'deleteContentForward',
    });
    this._emit();
    /*
     * Digitando, o erro nunca aparece: acusar um CPF pela metade so porque ainda
     * falta digito e punir antes da hora. Mas o acerto aparece na hora — assim que
     * o valor fica completo e certo, o campo fica verde, sem esperar sair dele.
     */
    if (this.opts.validate) this._mark(true, this._complete());
  }

  /** Valor inteiro (do tamanho do gabarito escolhido) e aprovado pela validacao. */
  _complete() {
    if (!this.templates) return false;
    const raw = this.getRaw();
    if (!raw) return false;
    return raw.length >= capacity(pickTemplate([...raw], this.templates)) && this.isValid();
  }

  _format({ cursor = null, deleting = false, forward = false, keepCursor = true } = {}) {
    const input = this.input;
    const raw = input.value;

    if (this.isCurrency) {
      const digits = raw.replace(/\D/g, '');
      const text = applyCurrency(digits, {
        decimals: this.opts.decimals, locale: this.opts.locale, currency: this.opts.currency,
      });
      input.value = text;
      // Moeda enche da direita: o cursor fica sempre no fim.
      if (keepCursor) input.setSelectionRange(text.length, text.length);
      return;
    }

    const all = [].concat(this.templates).join('');
    let chars = [...clear(raw, all)];
    if (this.uppercase) chars = chars.map((c) => c.toUpperCase());

    let before = cursor === null ? chars.length : [...clear(raw.slice(0, cursor), all)].length;

    // Apagar em cima de um separador remove o caractere vizinho: senao a
    // mascara o recolocaria na hora e a tecla nao faria nada.
    if (deleting && chars.length === this._last?.length) {
      const idx = forward ? before : before - 1;
      if (idx >= 0 && idx < chars.length) {
        chars.splice(idx, 1);
        if (!forward) before -= 1;
      }
    }

    const template = pickTemplate(chars, this.templates);
    chars = chars.slice(0, capacity(template));
    const text = apply(chars.join(''), template);

    this._last = chars.join('');
    input.value = text;
    if (keepCursor) {
      const pos = cursorAfter(text, Math.min(before, chars.length));
      input.setSelectionRange(pos, pos);
    }
  }

  _validate() {
    const ok = this.isValid();
    this._mark(ok, ok && this._complete());
    return ok;
  }

  /**
   * Marca o campo. setCustomValidity faz o formulario do navegador barrar o
   * submit sozinho, sem o projeto escrever nada.
   *
   * `aprovado` acende o verde (data-tuc-valid): so para valor preenchido e certo.
   * Vazio fica neutro — obrigatoriedade e assunto do `required`, nao da mascara.
   */
  _mark(ok, aprovado = false) {
    const msg = ok ? '' : (this.opts.errorText || this.preset?.error || 'Valor inválido');
    this.input.setCustomValidity?.(msg);
    this.input.classList.toggle('tuc-invalid', !ok);
    this.input.setAttribute('aria-invalid', ok ? 'false' : 'true');
    this.input.toggleAttribute('data-tuc-valid', ok && aprovado);
  }

  _emit() {
    const detail = { value: this.input.value, raw: this.getRaw(), number: this.getNumber(), instance: this };
    this.opts.onChange?.(detail.value, detail);
    this.input.dispatchEvent(new CustomEvent('tucano:change', { detail, bubbles: true }));
  }
}

/* ------------------------------------------------------------------ */


export function autoInit(scope = document) {
  const out = [];
  const targets = scope.querySelectorAll('[data-tuc-mask]:not([data-tuc-ready]), [data-tuc-reveal]:not([data-tuc-ready])');
  for (const node of targets) {
    const d = node.dataset;
    node.setAttribute('data-tuc-ready', '');
    out.push(new Mask(node, {
      format: d.tucMask || null,
      validate: d.validate === 'true' || d.validate === '',
      decimals: d.decimals ? +d.decimals : undefined,
      currency: d.currency || undefined,
      errorText: d.errorText || undefined,
      reveal: d.tucReveal !== undefined,
      revealVisible: d.revealVisible ? +d.revealVisible : undefined,
      revealMode: d.tucReveal || d.revealMode || undefined,
    }));
  }
  return out;
}

/**
 * Formata elementos de exibicao: <span data-tuc-format="cpf">12345678901</span>
 * vira 123.456.789-01. Serve para o que ja vem do banco, sem input nenhum.
 */
export function autoFormat(scope = document) {
  const out = [];
  for (const node of scope.querySelectorAll('[data-tuc-format]:not([data-tuc-formatted])')) {
    const d = node.dataset;
    node.setAttribute('data-tuc-formatted', '');
    const raw = (node.dataset.value ?? node.textContent).trim();
    node.textContent = format(raw, d.tucFormat, {
      decimals: d.decimals ? +d.decimals : undefined,
      currency: d.currency || undefined,
    });
    out.push(node);
  }
  return out;
}
