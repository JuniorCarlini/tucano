/*
 * Comportamento compartilhado do site de documentacao.
 *
 * Roda depois do dist/tucano.js, entao usa o helper de icone da biblioteca em vez
 * de repetir SVG. O que e especifico de uma pagina fica no <script> dela.
 */
(() => {
  const root = document.documentElement;

  /* Tema: a classe .dark no <html>, lembrada entre paginas. Os rotulos vem do
     proprio botao, que o gerador escreve no idioma da pagina. */
  const rotular = () => {
    const dark = root.classList.contains('dark');
    document.querySelectorAll('[data-tema]').forEach((b) =>
      b.setAttribute('aria-label', dark ? b.dataset.labelLight : b.dataset.labelDark));
  };
  document.querySelectorAll('[data-tema]').forEach((b) => b.addEventListener('click', () => {
    root.classList.toggle('dark');
    try { localStorage.setItem('tucano-tema', root.classList.contains('dark') ? 'dark' : 'light'); } catch {}
    rotular();
  }));
  rotular();

  /* Menu do celular: a barra lateral vira o painel que o botao abre. */
  const lateral = document.getElementById('side');
  const menu = document.getElementById('menu');
  const ICON_MENU = 'M3 6h18M3 12h18M3 18h18';
  const abrir = (sim) => {
    lateral.classList.toggle('is-open', sim);
    menu.setAttribute('aria-expanded', String(sim));
    menu.replaceChildren(Tucano.icon(sim ? Tucano.ICON_X : ICON_MENU, 16));
  };
  menu?.addEventListener('click', () => abrir(!lateral.classList.contains('is-open')));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && lateral.classList.contains('is-open')) abrir(false); });

  /*
   * Link para a propria pagina — o item atual do menu, a marca no inicio — so
   * volta ao topo. Seguir o link recarregava a pagina inteira, e recarregar nao
   * passa pela transicao entre paginas: a tela piscava sem nada ter mudado.
   * Link com ancora (#secao) continua descendo ate a secao, como sempre.
   */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank') return;
    const destino = new URL(a.href, location.href);
    if (destino.origin !== location.origin || destino.pathname !== location.pathname || destino.search !== location.search || destino.hash) return;
    e.preventDefault();
    if (lateral?.classList.contains('is-open')) abrir(false);
    scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* Saida dos exemplos: o valor de cada campo aparece embaixo dele, em #<id>-out. */
  document.addEventListener('tucano:change', (e) => {
    const out = document.getElementById(`${e.target.id}-out`);
    if (!out) return;
    const d = e.detail;
    out.textContent = d.files
      ? (d.files.map((f) => f.name).join(', ') || '—')
      : d.iso ?? (Array.isArray(d.value) ? (d.value.join(', ') || '—') : (d.value || '—'));
  });
})();
