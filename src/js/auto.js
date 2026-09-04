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
import { init, ouvirEventos } from './index.js';

export * from './index.js';

// Auto-init no DOM inicial e depois de cada swap do HTMX.
if (typeof document !== 'undefined') {
  const boot = () => { ouvirEventos(); init(document); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  document.addEventListener('htmx:afterSwap', (e) => init(e.target));
}
