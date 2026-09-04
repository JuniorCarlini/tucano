import { openWithTransition, el, icon, ICONS, nextId, on } from '../core/dom.js';
import { ICONS_EXTRA } from '../core/dom-extra.js';

const DEFAULTS = {
  type: 'info',        // 'info' | 'success' | 'warning' | 'error' | 'loading'
  title: null,
  text: '',
  duration: undefined, // ms. null nao fecha sozinho. Padrao depende do tipo
  position: 'bottom-end', // top-start|top-center|top-end|bottom-start|bottom-center|bottom-end
  closable: true,
  action: null,        // { text, onClick }
  max: 4,              // toasts simultaneos na mesma posicao
};

const ICON = {
  info: ICONS_EXTRA.info,
  success: ICONS_EXTRA.check,
  warning: ICONS_EXTRA.alert,
  error: ICONS_EXTRA.alert,
  loading: ICONS_EXTRA.spinner,
};

/**
 * Erro fica mais tempo: a pessoa precisa ler e, muitas vezes, agir.
 * Carregando nao fecha sozinho — quem fecha e o fim da operacao.
 */
const DURATION = { info: 4000, success: 3500, warning: 6000, error: 8000, loading: null };

const containers = new Map();

/**
 * Um container por posicao, criado na primeira vez que e usado.
 *
 * `aria-live` fica no container, e nao no toast: um live region precisa
 * existir no DOM *antes* do conteudo chegar, senao o leitor de tela nao
 * anuncia. Criar a regiao junto com a mensagem e o erro classico.
 */
function container(position) {
  if (containers.has(position)) return containers.get(position);
  // As duas regioes existem para o leitor de tela, nao para o layout. Elas
  // ficam dentro de um palco unico e sem altura propria, para que um erro
  // (assertivo) e um sucesso (polido) dividam o mesmo sistema de coordenadas
  // e formem uma pilha so — antes cada regiao se posicionava por conta e as
  // duas viravam pilhas paralelas na tela.
  const node = el('div', {
    class: `tuc-toasts is-${position}`,
    role: 'region',
    'aria-label': 'Notificações',
  }, [
    el('div', { class: 'tuc-toasts__stage' }, [
      el('div', { class: 'tuc-toasts__live', 'aria-live': 'polite', 'aria-atomic': 'false' }),
      el('div', { class: 'tuc-toasts__live is-urgent', 'aria-live': 'assertive', 'aria-atomic': 'false' }),
    ]),
  ]);
  // O respiro sai daqui para o CSS porque a ponte de hover precisa cobrir
  // exatamente o mesmo vao que arranjar() distribui — dois valores soltos
  // divergiriam na primeira vez que alguem mexesse em um deles.
  node.style.setProperty('--tuc-toast-gap', `${GAP}px`);
  document.body.append(node);
  containers.set(position, node);

  // Empilhado por padrao, em leque quando o ponteiro entra ou algo dentro
  // recebe foco — quem navega por teclado tambem precisa ver a pilha inteira.
  const expand = (yes) => {
    node.classList.toggle('is-expanded', yes);
    arrange(node);
  };
  node.addEventListener('pointerenter', () => expand(true));
  node.addEventListener('pointerleave', () => expand(false));
  node.addEventListener('focusin', () => expand(true));
  node.addEventListener('focusout', () => { if (!node.contains(document.activeElement)) expand(false); });
  return node;
}

const RECUO = 14;      // quanto de cada toast de tras fica a mostra
const VISIVEIS = 3;    // alem disso some: uma pilha de dez nao ajuda ninguem
const GAP = 12;    // espaco entre toasts quando aberto em leque

// A ordem do DOM percorre uma regiao inteira antes da outra, entao ela nao
// diz mais quem chegou primeiro. Este contador diz.
let seq = 0;

/**
 * Coloca cada toast no lugar.
 *
 * Empilhado, os de tras encolhem e recuam, deixando so uma faixa a mostra.
 * Em leque, cada um sobe a altura real dos que estao na frente — por isso a
 * medida vem do DOM e nao de um valor fixo: toast com titulo e mais alto que
 * um sem, e chutar a altura desalinha a pilha.
 */
function arrange(cont) {
  // Uma leitura de layout antes de medir: recem-inserido, o toast ainda nao
  // teve o CSS aplicado, e offsetHeight devolveria a altura sem estilo.
  void cont.offsetHeight;

  // Sem largura nao ha layout de verdade — aba oculta, container escondido.
  // Medir aqui gravaria posicoes absurdas nos elementos; melhor esperar a
  // proxima chamada, que vem no proximo toast ou no hover.
  if (!cont.offsetWidth) return;

  const debaixo = cont.className.includes('is-bottom');
  const sentido = debaixo ? -1 : 1;
  const isOpen = cont.classList.contains('is-expanded');

  const stage = cont.querySelector('.tuc-toasts__stage');
  const toasts = [...stage.querySelectorAll('.tuc-toast:not(.is-closing)')]
    .sort((a, b) => +a.dataset.seq - +b.dataset.seq);
  const frente = toasts.length - 1;   // o mais novo fica na frente
  let acumulado = 0;

  for (let i = frente; i >= 0; i--) {
    const k = frente - i;             // 0 = frente
    const t = toasts[i];
    const y = isOpen ? acumulado : k * RECUO;
    const escala = isOpen ? 1 : 1 - k * 0.05;

    t.style.setProperty('--tuc-toast-y', `${sentido * y}px`);
    t.style.setProperty('--tuc-toast-escala', String(escala));
    t.style.zIndex = String(100 - k);
    t.classList.toggle('is-hidden', !isOpen && k >= VISIVEIS);
    t.setAttribute('aria-hidden', !isOpen && k >= VISIVEIS ? 'true' : 'false');

    acumulado += t.offsetHeight + GAP;
  }

  // A altura do palco acompanha o conteudo: sem isso o ponteiro nao alcanca
  // os de tras, e o leque abriria para fora da area sensivel.
  const frontHeight = toasts[frente]?.offsetHeight ?? 0;
  const total = isOpen ? acumulado - GAP : frontHeight + Math.min(toasts.length - 1, VISIVEIS - 1) * RECUO;
  stage.style.height = toasts.length ? `${total}px` : '0px';
}

export class Toast {
  constructor(options = {}) {
    this.opts = { ...DEFAULTS, ...omitUndefined(options) };
    // `in` e nao `??`: o null de carregando quer dizer "nao fecha sozinho", e
    // com ?? ele cairia no padrao de 4s e o toast sumiria no meio da operacao.
    if (this.opts.duration === undefined) {
      this.opts.duration = this.opts.type in DURATION ? DURATION[this.opts.type] : 4000;
    }
    this.id = nextId('toast');
    this._cleanups = [];
    this._build();
  }

  /** Os filhos do toast. Sai do _montar para que atualizar() reaproveite. */
  _content() {
    const { type, title, text, closable, action } = this.opts;
    return [
      el('span', { class: 'tuc-toast__icon' }, [icon(ICON[type] ?? ICON.info, 17)]),
      el('div', { class: 'tuc-toast__body' }, [
        title ? el('strong', { class: 'tuc-toast__title', text: title }) : null,
        el('span', { class: 'tuc-toast__text', text }),
      ]),
      action ? el('button', {
        type: 'button', class: 'tuc-btn is-outline is-sm tuc-toast__action', text: action.text,
        onclick: () => { action.onClick?.(this); this.close(); },
      }) : null,
      closable ? el('button', {
        type: 'button', class: 'tuc-btn is-ghost is-icon is-sm tuc-toast__close',
        'aria-label': 'Fechar', onclick: () => this.close(),
      }, [icon(ICONS.x, 14)]) : null,
    ];
  }

  /**
   * Troca o conteudo sem recriar o toast: e o que faz um "salvando" virar
   * "salvo" no mesmo cartao, sem a pilha reorganizar e sem o olho perder de
   * vista o aviso que ja estava lendo.
   */
  update(options = {}) {
    if (!this.node) return this;

    const anterior = this.opts.type;
    this.opts = { ...this.opts, ...omitUndefined(options) };
    const { type } = this.opts;

    // Mudou de tipo sem duracao explicita: vale a do tipo novo. Sem isto o
    // carregando, que nao fecha sozinho, viraria um "salvo" eterno na tela.
    if (options.duration === undefined && type !== anterior) {
      this.opts.duration = type in DURATION ? DURATION[type] : 4000;
    }

    this.node.classList.replace(`is-${anterior}`, `is-${type}`);
    this.node.replaceChildren(...this._content().filter(Boolean));

    // Erro fala numa live region assertiva e o resto numa polida; mudar de
    // regiao e o que faz o leitor de tela anunciar a virada. So nao desloca
    // nada na tela porque a posicao vem do palco, e nao da regiao.
    const urgent = type === 'error';
    this.node.setAttribute('role', urgent ? 'alert' : 'status');
    const destino = this.container.querySelector(
      urgent ? '.is-urgent' : '.tuc-toasts__live:not(.is-urgent)');
    if (destino !== this.regiao) {
      destino.append(this.node);
      this.regiao = destino;
    }

    clearTimeout(this.timer);
    if (this.opts.duration) this._iniciarRelogio();
    arrange(this.container);
    return this;
  }

  _build() {
    const urgent = this.opts.type === 'error';

    this.node = el('div', {
      class: `tuc-toast is-${this.opts.type}`,
      // role no proprio toast ajuda quem chega nele navegando.
      role: urgent ? 'alert' : 'status',
      id: this.id,
    }, this._content());

    this.node._tucano = this;
    this.node.dataset.seq = String(++seq);
    const target = container(this.opts.position);
    this.container = target;
    const regiao = target.querySelector(urgent ? '.is-urgent' : '.tuc-toasts__live:not(.is-urgent)');
    regiao.append(this.node);
    this.regiao = regiao;

    this._capStack(target);
    arrange(target);

    if (this.opts.duration) {
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

    openWithTransition(this.node);
  }

  /**
   * Fecha os mais antigos que passarem do limite.
   *
   * A instancia fica no proprio no: sem isso nao ha como chamar close() a
   * partir do elemento, e o limite nao acontece.
   */
  _capStack(cont) {
    // O limite vale para a pilha inteira, nao por regiao de acessibilidade:
    // contadas em separado, tres avisos e tres erros passariam seis na tela.
    const abertos = [...cont.querySelectorAll('.tuc-toast:not(.is-closing)')]
      .sort((a, b) => +a.dataset.seq - +b.dataset.seq);
    const excedente = abertos.length - this.opts.max;
    for (let i = 0; i < excedente; i++) abertos[i]._tucano?.close();
  }

  _iniciarRelogio() {
    this.restante = this.opts.duration;
    this.inicio = Date.now();
    this.timer = setTimeout(() => this.close(), this.restante);
  }

  _pausar() {
    if (!this.timer) return;
    clearTimeout(this.timer);
    this.timer = null;
    this.restante -= Date.now() - this.inicio;
  }

  _retomar() {
    if (this.timer || !this.opts.duration) return;
    this.inicio = Date.now();
    this.timer = setTimeout(() => this.close(), Math.max(this.restante, 0));
  }

  close() {
    if (this._closing) return;
    this._closing = true;
    clearTimeout(this.timer);
    this._cleanups.forEach((fn) => fn());

    this.node.classList.remove('is-open');
    this.node.classList.add('is-closing');
    // Os que ficam ja se acomodam enquanto este some: esperar o fim faria a
    // pilha dar um solavanco no final.
    arrange(this.container);

    const remove = () => {
      if (this._removido) return;
      this._removido = true;
      this.node.remove();
      arrange(this.container);
      this.node.dispatchEvent(new CustomEvent('tucano:toast-fechado'));
    };
    this.node.addEventListener('transitionend', (e) => {
      if (e.propertyName === 'opacity') remove();
    });
    setTimeout(remove, 500);
  }
}

/** Atalho: Tucano.toast('Salvo') ou Tucano.toast({ type:'error', text:'...' }). */
export function toast(optionsOrText, extra = {}) {
  const base = typeof optionsOrText === 'string' ? { text: optionsOrText } : optionsOrText;
  return new Toast({ ...base, ...extra });
}

for (const type of ['info', 'success', 'warning', 'error', 'loading']) {
  toast[type] = (text, extra = {}) => toast({ type: type, text: text, ...extra });
}

/**
 * Acompanha uma promessa num toast so: abre em carregando e vira sucesso ou
 * erro no mesmo cartao, em vez de fechar um e abrir outro.
 *
 *   Tucano.toast.promise(fetch(url), {
 *     carregando: 'Enviando...',
 *     sucesso: (r) => `Enviado (${r.status})`,
 *     erro: 'Nao deu para enviar',
 *   });
 *
 * Devolve a promessa recebida, para nao atrapalhar quem ja encadeava nela.
 */
toast.promise = (promise, msgs = {}) => {
  const { loading, success, error, ...rest } = msgs;
  const t = toast.loading(loading ?? 'Carregando...', rest);
  const render = (v, dado, padrao) => {
    const r = typeof v === 'function' ? v(dado) : v;
    return r ?? padrao;
  };
  Promise.resolve(promise).then(
    (dado) => t.update({ type: 'success', text: render(success, dado, 'Pronto') }),
    (falha) => t.update({ type: 'error', text: render(error, falha, 'Algo deu errado') }),
  );
  return promise;
};

function omitUndefined(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) if (v !== undefined) out[k] = v;
  return out;
}

const MAPA_DJANGO = { debug: 'info', info: 'info', success: 'success', warning: 'warning', error: 'error' };

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
 *       {"tucano:toast": {"type": "success", "text": "Salvo"}})})
 */
export function listenForEvents() {
  if (typeof document === 'undefined' || document.__tucToastOuvindo) return;
  document.__tucToastOuvindo = true;
  document.body?.addEventListener('tucano:toast', (e) => {
    const d = e.detail;
    if (!d) return;
    toast(typeof d === 'string' ? { text: d } : d);
  });
}
