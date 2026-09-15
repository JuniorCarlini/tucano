/*
 * Entrada que se inicializa sozinha.
 *
 * Este arquivo existe para o index.js nao ter efeito colateral. Enquanto o
 * boot morava la, importar `tucano` executava o init(), que alcanca os onze
 * componentes — e empacotador nenhum consegue descartar o que e usado. Medido:
 * importar so o DatePicker custava os mesmos 31,9 KB de importar tudo, contra
 * 9,8 KB depois da separacao.
 *
 * O build IIFE, que e o do CDN, aponta para ca: quem usa <script src> continua
 * recebendo tudo pronto sem escrever uma linha. Quem empacota importa de
 * `tucano` e leva so o que referenciou.
 */
import { init, listenForEvents } from './index.js';

export * from './index.js';

// Auto-init no DOM inicial e depois de cada swap do HTMX.
if (typeof document !== 'undefined') {
  const boot = () => { listenForEvents(); init(document); };
  /*
   * Espera o DOMContentLoaded sempre que ele ainda nao disparou — inclusive com
   * `defer`, em que o script executa com readyState "interactive" mas antes do
   * evento. Montando ali na hora, nao sobrava momento para Tucano.setTexts: nem
   * num listener do DOMContentLoaded nem num script defer depois deste, e os
   * componentes nasciam em portugues. O readyState sozinho nao separa o antes
   * do depois do evento; a entrada de navegacao separa.
   */
  const nav = typeof performance !== 'undefined' && performance.getEntriesByType?.('navigation')[0];
  const ready = document.readyState === 'complete'
    || (nav ? nav.domContentLoadedEventStart > 0 : document.readyState !== 'loading');
  if (ready) boot();
  else document.addEventListener('DOMContentLoaded', boot);
  document.addEventListener('htmx:afterSwap', (e) => init(e.target));
}
