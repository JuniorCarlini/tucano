import { aplicar, aplicarMoeda, capacidade, cursorApos, escolherGabarito, formatar, limpar, validarCpfCnpj, validarCNPJ, validarCPF } from '../core/mask.js';
import { obscurecer } from '../core/mask.js';
import { el, icon, on } from '../core/dom.js';
import { ICONS_EXTRA } from '../core/dom-extra.js';

/**
 * Formatos prontos.
 *
 * Um array significa gabarito escolhido pelo tamanho: telefone fixo ou celular,
 * documento que pode ser CPF ou CNPJ.
 *
 * O `cnpj` aceita letras nas doze primeiras posicoes porque e o que o formato
 * novo permite; as duas ultimas seguem numericas. Quem precisa recusar letras
 * durante a transicao usa `cnpj-numerico`.
 */
export const FORMATOS = {
  cpf: { gabarito: '###.###.###-##', validar: validarCPF, erro: 'CPF inválido' },
  cnpj: { gabarito: '**.***.***/****-##', validar: validarCNPJ, erro: 'CNPJ inválido', maiusculas: true },
  'cnpj-numerico': { gabarito: '##.###.###/####-##', validar: validarCNPJ, erro: 'CNPJ inválido' },
  'cpf-cnpj': {
    gabarito: ['###.###.###-##', '**.***.***/****-##'],
    validar: validarCpfCnpj, erro: 'Documento inválido', maiusculas: true,
  },
  telefone: { gabarito: ['(##) ####-####', '(##) #####-####'] },
  celular: { gabarito: '(##) #####-####' },
  cep: { gabarito: '#####-###' },
  data: { gabarito: '##/##/####' },
  hora: { gabarito: '##:##' },
  cartao: { gabarito: '#### #### #### ####' },
  moeda: { moeda: true },
  real: { moeda: true, currency: 'BRL' },
};

const DEFAULTS = {
  format: null,        // nome de FORMATOS ou gabarito livre
  validate: false,     // valida no blur e bloqueia o submit
  decimals: 2,
  currency: null,      // 'BRL' formata com R$
  reveal: false,       // olhinho para mostrar e ocultar
  revealVisible: 2,    // quantos caracteres ficam a mostra no modo 'fim'
  revealMode: null,    // 'fim' | 'email' | 'tudo'. null decide pelo campo
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

    const preset = FORMATOS[this.opts.format];
    this.preset = preset || null;
    this.moeda = !!preset?.moeda;
    this.gabaritos = preset ? preset.gabarito : this.opts.format;
    this.maiusculas = !!preset?.maiusculas;
    if (preset?.currency && !this.opts.currency) this.opts.currency = preset.currency;
    if (!this.moeda && !this.gabaritos && !this.opts.reveal) {
      throw new Error('[Mask] informe um formato ou gabarito');
    }

    this._cleanups = [];
    this._ligar();
    if (node.value && !this.moeda && this.gabaritos) this._formatar({ manterCursor: false });
    else if (node.value && this.moeda) this._formatar({ manterCursor: false });
    if (this.opts.reveal) this._montarOlho();
    node._tucano = this;
  }

  /* ---------------------------------------------------------------- *
   * API publica                                                       *
   * ---------------------------------------------------------------- */

  /** Conteudo sem formatacao: so digitos, ou digitos e letras. */
  getRaw() {
    const texto = this.valorReal ?? this.input.value;
    if (this.moeda) return texto.replace(/\D/g, '');
    if (!this.gabaritos) return texto;
    return limpar(texto, [].concat(this.gabaritos).join(''));
  }

  /** Numero, no formato moeda. */
  getNumber() {
    if (!this.moeda) return null;
    const d = this.getRaw();
    return d ? Number(d) / 10 ** this.opts.decimals : null;
  }

  setValue(valor) {
    this.input.value = String(valor ?? '');
    this._formatar({ manterCursor: false });
    this._emit();
  }

  isValid() {
    const validar = this.preset?.validar;
    if (!validar) return true;
    const bruto = this.getRaw();
    return bruto ? validar(bruto) : true;   // vazio e problema do `required`
  }

  destroy() {
    this._cleanups.forEach((fn) => fn());
    this._cleanups = [];
    if (this.envolucro) {
      if (this.valorReal != null) this.input.value = this.valorReal;
      if (this.nomeReal) this.input.name = this.nomeReal;
      this.input.readOnly = this.readOnlyOriginal ?? false;
      this.envolucro.replaceWith(this.input);
      this.oculto?.remove();
    }
    this.input.setCustomValidity?.('');
    this.input.classList.remove('tuc-invalid');
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
  _montarOlho() {
    const input = this.input;
    this.senha = input.type === 'password';

    this.envolucro = el('span', { class: 'tuc-field' });
    input.replaceWith(this.envolucro);
    this.envolucro.append(input);

    if (!this.senha && input.name) {
      this.nomeReal = input.name;
      input.removeAttribute('name');
      this.oculto = el('input', { type: 'hidden', name: this.nomeReal, value: this.getRaw() });
      this.envolucro.append(this.oculto);
    }

    this.olho = el('button', {
      type: 'button',
      class: 'tuc-field__eye',
      'aria-label': 'Mostrar',
      'aria-pressed': 'false',
      onclick: () => this._alternar(),
    });
    this.envolucro.append(this.olho);

    // Vazio comeca a mostra; com conteudo, comeca escondido.
    this.mostrando = !input.value;
    this._pintarOlho();

    this._cleanups.push(on(input, 'input', () => {
      if (this.oculto) this.oculto.value = this.getRaw();
    }));
  }

  /**
   * Modo de esconder. Escolhido pelo campo quando nao informado: `type=email`
   * guarda o dominio, o resto guarda o fim.
   */
  _modoOculto() {
    if (this.opts.revealMode) return this.opts.revealMode;
    if (this.input.type === 'email') return 'email';
    return 'fim';
  }

  _alternar() {
    this.mostrando = !this.mostrando;
    this._pintarOlho();
    if (this.mostrando) this.input.focus();
  }

  _pintarOlho() {
    const input = this.input;
    const mostrando = this.mostrando;

    if (this.senha) {
      input.type = mostrando ? 'text' : 'password';
    } else {
      if (mostrando) {
        if (this.valorReal != null) { input.value = this.valorReal; this.valorReal = null; }
        input.readOnly = this.readOnlyOriginal ?? false;
      } else {
        this.readOnlyOriginal = input.readOnly;
        this.valorReal = input.value;
        input.value = obscurecer(input.value, this.opts.revealVisible, this._modoOculto());
        // So leitura enquanto oculto: digitar em cima dos pontos escreveria
        // por cima do valor real sem a pessoa perceber.
        input.readOnly = true;
      }
    }

    this.olho.replaceChildren(icon(mostrando ? ICONS_EXTRA.eyeOff : ICONS_EXTRA.eye, 16));
    this.olho.setAttribute('aria-label', mostrando ? 'Ocultar' : 'Mostrar');
    this.olho.setAttribute('aria-pressed', String(mostrando));
    this.envolucro.classList.toggle('is-hidden', !mostrando);
  }

  /* ---------------------------------------------------------------- *
   * Interno                                                           *
   * ---------------------------------------------------------------- */

  _gabarito(caracteres) {
    if (this.moeda) return '';
    const chars = caracteres ?? limpar(this.input.value, [].concat(this.gabaritos).join(''));
    return escolherGabarito(chars, this.gabaritos);
  }

  _ligar() {
    const input = this.input;
    if (!input.getAttribute('inputmode')) {
      input.setAttribute('inputmode', this.moeda || !/[A*]/.test([].concat(this.gabaritos).join('')) ? 'numeric' : 'text');
    }
    input.setAttribute('autocomplete', input.getAttribute('autocomplete') || 'off');

    this._cleanups.push(
      on(input, 'input', (e) => this._aoDigitar(e)),
      on(input, 'blur', () => { if (this.opts.validate) this._validar(); }),
      on(input, 'focus', () => this._marcar(true)),
    );
  }

  _aoDigitar(e) {
    const input = this.input;
    const cursor = input.selectionStart ?? input.value.length;
    const tipo = typeof e.inputType === 'string' ? e.inputType : '';
    this._formatar({
      cursor,
      apagando: tipo.startsWith('delete'),
      paraFrente: tipo === 'deleteContentForward',
    });
    this._emit();
    if (this.opts.validate) this._marcar(true);   // some o erro enquanto digita
  }

  _formatar({ cursor = null, apagando = false, paraFrente = false, manterCursor = true } = {}) {
    const input = this.input;
    const bruto = input.value;

    if (this.moeda) {
      const digitos = bruto.replace(/\D/g, '');
      const texto = aplicarMoeda(digitos, {
        decimais: this.opts.decimals, locale: this.opts.locale, moeda: this.opts.currency,
      });
      input.value = texto;
      // Moeda enche da direita: o cursor fica sempre no fim.
      if (manterCursor) input.setSelectionRange(texto.length, texto.length);
      return;
    }

    const todos = [].concat(this.gabaritos).join('');
    let chars = [...limpar(bruto, todos)];
    if (this.maiusculas) chars = chars.map((c) => c.toUpperCase());

    let antes = cursor === null ? chars.length : [...limpar(bruto.slice(0, cursor), todos)].length;

    // Apagar em cima de um separador remove o caractere vizinho: senao a
    // mascara o recolocaria na hora e a tecla nao faria nada.
    if (apagando && chars.length === this._ultimo?.length) {
      const idx = paraFrente ? antes : antes - 1;
      if (idx >= 0 && idx < chars.length) {
        chars.splice(idx, 1);
        if (!paraFrente) antes -= 1;
      }
    }

    const gabarito = escolherGabarito(chars, this.gabaritos);
    chars = chars.slice(0, capacidade(gabarito));
    const texto = aplicar(chars.join(''), gabarito);

    this._ultimo = chars.join('');
    input.value = texto;
    if (manterCursor) {
      const pos = cursorApos(texto, Math.min(antes, chars.length));
      input.setSelectionRange(pos, pos);
    }
  }

  _validar() {
    const ok = this.isValid();
    this._marcar(ok);
    return ok;
  }

  /**
   * Marca o campo. setCustomValidity faz o formulario do navegador barrar o
   * submit sozinho, sem o projeto escrever nada.
   */
  _marcar(ok) {
    const msg = ok ? '' : (this.opts.errorText || this.preset?.erro || 'Valor inválido');
    this.input.setCustomValidity?.(msg);
    this.input.classList.toggle('tuc-invalid', !ok);
    this.input.setAttribute('aria-invalid', ok ? 'false' : 'true');
  }

  _emit() {
    const detail = { value: this.input.value, raw: this.getRaw(), number: this.getNumber(), instance: this };
    this.opts.onChange?.(detail.value, detail);
    this.input.dispatchEvent(new CustomEvent('tucano:change', { detail, bubbles: true }));
  }
}

/* ------------------------------------------------------------------ */

function omitUndefined(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) if (v !== undefined) out[k] = v;
  return out;
}

export function autoInit(scope = document) {
  const out = [];
  const alvos = scope.querySelectorAll('[data-tuc-mask]:not([data-tuc-ready]), [data-tuc-reveal]:not([data-tuc-ready])');
  for (const node of alvos) {
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
    const bruto = (node.dataset.value ?? node.textContent).trim();
    node.textContent = formatar(bruto, d.tucFormat, {
      decimais: d.decimals ? +d.decimals : undefined,
      moeda: d.currency || undefined,
    });
    out.push(node);
  }
  return out;
}
