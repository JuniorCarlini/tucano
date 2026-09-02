import { el, icon, ICONS, nextId, on } from '../core/dom.js';
import { ICONS_EXTRA } from '../core/dom-extra.js';

const DEFAULTS = {
  type: 'info',        // 'info' | 'sucesso' | 'aviso' | 'erro'
  title: null,
  text: '',
  duration: undefined, // ms. null nao fecha sozinho. Padrao depende do tipo
  position: 'top-end', // top-start|top-center|top-end|bottom-start|bottom-center|bottom-end
  closable: true,
  action: null,        // { text, onClick }
  max: 4,              // toasts simultaneos na mesma posicao
};

const ICONE = {
  info: ICONS_EXTRA.info,
  sucesso: ICONS_EXTRA.check,
  aviso: ICONS_EXTRA.alert,
  erro: ICONS_EXTRA.alert,
};

/** Erro fica mais tempo: a pessoa precisa ler e, muitas vezes, agir. */
const DURACAO = { info: 4000, sucesso: 3500, aviso: 6000, erro: 8000 };

const containers = new Map();

/**
 * Um container por posicao, criado na primeira vez que e usado.
 *
 * `aria-live` fica no container, e nao no toast: um live region precisa
 * existir no DOM *antes* do conteudo chegar, senao o leitor de tela nao
 * anuncia. Criar a regiao junto com a mensagem e o erro classico.
 */
function container(posicao) {
  if (containers.has(posicao)) return containers.get(posicao);
  const node = el('div', {
    class: `tuc-toasts is-${posicao}`,
    role: 'region',
    'aria-label': 'Notificações',
  }, [
    el('div', { class: 'tuc-toasts__live', 'aria-live': 'polite', 'aria-atomic': 'false' }),
    el('div', { class: 'tuc-toasts__live is-urgente', 'aria-live': 'assertive', 'aria-atomic': 'false' }),
  ]);
  document.body.append(node);
  containers.set(posicao, node);
  return node;
}

export class Toast {
  constructor(opcoes = {}) {
    this.opts = { ...DEFAULTS, ...omitUndefined(opcoes) };
    if (this.opts.duration === undefined) this.opts.duration = DURACAO[this.opts.type] ?? 4000;
    this.id = nextId('toast');
    this._cleanups = [];
    this._montar();
  }

  _montar() {
    const { type, title, text, closable, action } = this.opts;
    const urgente = type === 'erro';

    this.node = el('div', {
      class: `tuc-toast is-${type}`,
      // role no proprio toast ajuda quem chega nele navegando.
      role: urgente ? 'alert' : 'status',
      id: this.id,
    }, [
      el('span', { class: 'tuc-toast__icon' }, [icon(ICONE[type] ?? ICONE.info, 17)]),
      el('div', { class: 'tuc-toast__body' }, [
        title ? el('strong', { class: 'tuc-toast__title', text: title }) : null,
        el('span', { class: 'tuc-toast__text', text }),
      ]),
      action ? el('button', {
        type: 'button', class: 'tuc-toast__action', text: action.text,
        onclick: () => { action.onClick?.(this); this.close(); },
      }) : null,
      closable ? el('button', {
        type: 'button', class: 'tuc-toast__close', 'aria-label': 'Fechar',
        onclick: () => this.close(),
      }, [icon(ICONS.x, 14)]) : null,
      this.opts.duration ? el('span', { class: 'tuc-toast__bar' }) : null,
    ]);

    this.node._tucano = this;

    const alvo = container(this.opts.position);
    const regiao = alvo.querySelector(urgente ? '.is-urgente' : '.tuc-toasts__live:not(.is-urgente)');
    regiao.append(this.node);

    this._limitar(regiao);

    if (this.opts.duration) {
      this.node.style.setProperty('--tuc-toast-dur', `${this.opts.duration}ms`);
      this._iniciarRelogio();
      // Parar ao passar o mouse ou focar: ninguem consegue ler algo que some
      // enquanto se tenta clicar no botao dele.
      this._cleanups.push(
        on(this.node, 'mouseenter', () => this._pausar()),
        on(this.node, 'mouseleave', () => this._retomar()),
        on(this.node, 'focusin', () => this._pausar()),
        on(this.node, 'focusout', () => this._retomar()),
      );
    }

    requestAnimationFrame(() => this.node.classList.add('is-open'));
  }

  /**
   * Fecha os mais antigos que passarem do limite.
   *
   * A instancia fica no proprio no: sem isso nao ha como chamar close() a
   * partir do elemento, e o limite nao acontece.
   */
  _limitar(regiao) {
    const irmaos = [...regiao.children];
    const excedente = irmaos.length - this.opts.max;
    for (let i = 0; i < excedente; i++) irmaos[i]._tucano?.close();
  }

  _iniciarRelogio() {
    this.restante = this.opts.duration;
    this.inicio = Date.now();
    this.timer = setTimeout(() => this.close(), this.restante);
    this.node.style.setProperty('--tuc-toast-play', 'running');
  }

  _pausar() {
    if (!this.timer) return;
    clearTimeout(this.timer);
    this.timer = null;
    this.restante -= Date.now() - this.inicio;
    this.node.style.setProperty('--tuc-toast-play', 'paused');
  }

  _retomar() {
    if (this.timer || !this.opts.duration) return;
    this.inicio = Date.now();
    this.timer = setTimeout(() => this.close(), Math.max(this.restante, 0));
    this.node.style.setProperty('--tuc-toast-play', 'running');
  }

  close() {
    if (this._fechando) return;
    this._fechando = true;
    clearTimeout(this.timer);
    this._cleanups.forEach((fn) => fn());
    this.node.classList.remove('is-open');
    this.node.classList.add('is-closing');
    const remover = () => { this.node.remove(); this.node.dispatchEvent(new CustomEvent('tucano:toast-fechado')); };
    // Espera a animacao, mas nao depende dela: transitionend nao dispara se o
    // elemento estiver escondido ou com movimento reduzido.
    this.node.addEventListener('transitionend', remover, { once: true });
    setTimeout(remover, 400);
  }
}

/** Atalho: Tucano.toast('Salvo') ou Tucano.toast({ type:'erro', text:'...' }). */
export function toast(opcoesOuTexto, extra = {}) {
  const base = typeof opcoesOuTexto === 'string' ? { text: opcoesOuTexto } : opcoesOuTexto;
  return new Toast({ ...base, ...extra });
}

for (const tipo of ['info', 'sucesso', 'aviso', 'erro']) {
  toast[tipo] = (texto, extra = {}) => toast({ type: tipo, text: texto, ...extra });
}

function omitUndefined(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) if (v !== undefined) out[k] = v;
  return out;
}

const MAPA_DJANGO = { debug: 'info', info: 'info', success: 'sucesso', warning: 'aviso', error: 'erro' };

/**
 * Converte mensagens ja renderizadas em toast — a saida do framework de
 * messages do Django entra direto, sem escrever JavaScript:
 *
 *   {% for m in messages %}
 *     <div data-tuc-toast data-type="{{ m.tags }}">{{ m }}</div>
 *   {% endfor %}
 */
export function autoInit(scope = document) {
  const out = [];
  for (const node of scope.querySelectorAll('[data-tuc-toast]:not([data-tuc-ready])')) {
    node.setAttribute('data-tuc-ready', '');
    const d = node.dataset;
    const bruto = (d.type || 'info').trim().split(/\s+/)[0];
    out.push(toast({
      type: MAPA_DJANGO[bruto] ?? bruto,
      title: d.title || undefined,
      text: (d.text ?? node.textContent).trim(),
      duration: d.duration === 'false' ? null : (d.duration ? +d.duration : undefined),
      position: d.position || undefined,
    }));
    node.remove();
  }
  return out;
}

/**
 * Deixa o servidor disparar um toast pelo cabecalho HX-Trigger do HTMX:
 *
 *   return HttpResponse(headers={"HX-Trigger": json.dumps(
 *       {"tucano:toast": {"type": "sucesso", "text": "Salvo"}})})
 */
export function ouvirEventos() {
  if (typeof document === 'undefined' || document.__tucToastOuvindo) return;
  document.__tucToastOuvindo = true;
  document.body?.addEventListener('tucano:toast', (e) => {
    const d = e.detail;
    if (!d) return;
    toast(typeof d === 'string' ? { text: d } : d);
  });
}
