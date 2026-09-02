export { DatePicker, autoInit as autoInitDatePickers } from './components/datepicker.js';
export { Select, autoInit as autoInitSelects } from './components/select.js';
export { ColorPicker, autoInit as autoInitColorPickers } from './components/colorpicker.js';
export * as color from './core/color.js';
export * as dates from './core/dates.js';
export { Popover } from './core/popover.js';

import { autoInit } from './components/datepicker.js';
import { autoInit as autoInitSelect } from './components/select.js';
import { autoInit as autoInitColor } from './components/colorpicker.js';

/** Inicializa todos os componentes marcados por data-attribute no escopo dado. */
export function init(scope = document) {
  return {
    datepickers: autoInit(scope),
    selects: autoInitSelect(scope),
    colorpickers: autoInitColor(scope),
  };
}

// Auto-init no DOM inicial e depois de cada swap do HTMX.
if (typeof document !== 'undefined') {
  const boot = () => init(document);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  document.addEventListener('htmx:afterSwap', (e) => init(e.target));
}
