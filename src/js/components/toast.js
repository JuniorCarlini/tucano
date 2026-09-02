import { abrirComTransicao, el, icon, ICONS, nextId, on } from '../core/dom.js';
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
  // As duas regioes existem para o leitor de tela, nao para o layout. Elas
  // ficam dentro de um palco unico e sem altura propria, para que um erro
  // (assertivo) e um sucesso (polido) dividam o mesmo sistema de coordenadas
  // e formem uma pilha so — antes cada regiao se posicionava por conta e as
  // duas viravam pilhas paralelas na tela.
  const node = el('div', {
    class: `tuc-toasts is-${posicao}`,
    role: 'region',
    'aria-label': 'Notificações',
  }, [
    el('div', { class: 'tuc-toasts__palco' }, [
      el('div', { class: 'tuc-toasts__live', 'aria-live': 'polite', 'aria-atomic': 'false' }),
      el('div', { class: 'tuc-toasts__live is-urgente', 'aria-live': 'assertive', 'aria-atomic': 'false' }),
    ]),
  ]);
  // O respiro sai daqui para o CSS porque a ponte de hover precisa cobrir
  // exatamente o mesmo vao que arranjar() distribui — dois valores soltos
  // divergiriam na primeira vez que alguem mexesse em um deles.
  node.style.setProperty('--tuc-toast-respiro', `${RESPIRO}px`);
  document.body.append(node);
  containers.set(posicao, node);

  // Empilhado por padrao, em leque quando o ponteiro entra ou algo dentro
  // recebe foco — quem navega por teclado tambem precisa ver a pilha inteira.
  const expandir = (sim) => {
    node.classList.toggle('is-expandido', sim);
    arranjar(node);
  };
  node.addEventListener('pointerenter', () => expandir(true));
  node.addEventListener('pointerleave', () => expandir(false));
  node.addEventListener('focusin', () => expandir(true));
  node.addEventListener('focusout', () => { if (!node.contains(document.activeElement)) expandir(false); });
  return node;
}

const RECUO = 14;      // quanto de cada toast de tras fica a mostra
const VISIVEIS = 3;    // alem disso some: uma pilha de dez nao ajuda ninguem
const RESPIRO = 12;    // espaco entre toasts quando aberto em leque

// A ordem do DOM percorre uma regiao inteira antes da outra, entao ela nao
// diz mais quem chegou primeiro. Este contador diz.
let sequencia = 0;

/**
 * Coloca cada toast no lugar.
 *
 * Empilhado, os de tras encolhem e recuam, deixando so uma faixa a mostra.
 * Em leque, cada um sobe a altura real dos que estao na frente — por isso a
 * medida vem do DOM e nao de um valor fixo: toast com titulo e mais alto que
 * um sem, e chutar a altura desalinha a pilha.
 */
function arranjar(cont) {
  // Uma leitura de layout antes de medir: recem-inserido, o toast ainda nao
  // teve o CSS aplicado, e offsetHeight devolveria a altura sem estilo.
  void cont.offsetHeight;

  // Sem largura nao ha layout de verdade — aba oculta, container escondido.
  // Medir aqui gravaria posicoes absurdas nos elementos; melhor esperar a
  // proxima chamada, que vem no proximo toast ou no hover.
  if (!cont.offsetWidth) return;

  const debaixo = cont.className.includes('is-bottom');
  const sentido = debaixo ? -1 : 1;
  const aberto = cont.classList.contains('is-expandido');

  const palco = cont.querySelector('.tuc-toasts__palco');
  const toasts = [...palco.querySelectorAll('.tuc-toast:not(.is-closing)')]
    .sort((a, b) => +a.dataset.seq - +b.dataset.seq);
  const frente = toasts.length - 1;   // o mais novo fica na frente
  let acumulado = 0;

  for (let i = frente; i >= 0; i--) {
    const k = frente - i;             // 0 = frente
    const t = toasts[i];
    const y = aberto ? acumulado : k * RECUO;
    const escala = aberto ? 1 : 1 - k * 0.05;

    t.style.setProperty('--tuc-toast-y', `${sentido * y}px`);
    t.style.setProperty('--tuc-toast-escala', String(escala));
    t.style.zIndex = String(100 - k);
    t.classList.toggle('is-oculto', !aberto && k >= VISIVEIS);
    t.setAttribute('aria-hidden', !aberto && k >= VISIVEIS ? 'true' : 'false');

    acumulado += t.offsetHeight + RESPIRO;
  }

  // A altura do palco acompanha o conteudo: sem isso o ponteiro nao alcanca
  // os de tras, e o leque abriria para fora da area sensivel.
  const alturaFrente = toasts[frente]?.offsetHeight ?? 0;
  const total = aberto ? acumulado - RESPIRO : alturaFrente + Math.min(toasts.length - 1, VISIVEIS - 1) * RECUO;
  palco.style.height = toasts.length ? `${total}px` : '0px';
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
        type: 'button', class: 'tuc-btn is-outline is-sm tuc-toast__action', text: action.text,
        onclick: () => { action.onClick?.(this); this.close(); },
      }) : null,
      closable ? el('button', {
        type: 'button', class: 'tuc-btn is-ghost is-icon is-sm tuc-toast__close',
        'aria-label': 'Fechar', onclick: () => this.close(),
      }, [icon(ICONS.x, 14)]) : null,
    ]);

    this.node._tucano = this;
    this.node.dataset.seq = String(++sequencia);
    const alvo = container(this.opts.position);
    this.container = alvo;
    const regiao = alvo.querySelector(urgente ? '.is-urgente' : '.tuc-toasts__live:not(.is-urgente)');
    regiao.append(this.node);
    this.regiao = regiao;

    this._limitar(alvo);
    arranjar(alvo);

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

    abrirComTransicao(this.node);
  }

  /**
   * Fecha os mais antigos que passarem do limite.
   *
   * A instancia fica no proprio no: sem isso nao ha como chamar close() a
   * partir do elemento, e o limite nao acontece.
   */
  _limitar(cont) {
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
    if (this._fechando) return;
    this._fechando = true;
    clearTimeout(this.timer);
    this._cleanups.forEach((fn) => fn());

    this.node.classList.remove('is-open');
    this.node.classList.add('is-closing');
    // Os que ficam ja se acomodam enquanto este some: esperar o fim faria a
    // pilha dar um solavanco no final.
    arranjar(this.container);

    const remover = () => {
      if (this._removido) return;
      this._removido = true;
      this.node.remove();
      arranjar(this.container);
      this.node.dispatchEvent(new CustomEvent('tucano:toast-fechado'));
    };
    this.node.addEventListener('transitionend', (e) => {
      if (e.propertyName === 'opacity') remover();
    });
    setTimeout(remover, 500);
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
