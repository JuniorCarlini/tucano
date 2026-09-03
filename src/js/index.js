export { DatePicker, autoInit as autoInitDatePickers } from './components/datepicker.js';
export { Select, autoInit as autoInitSelects } from './components/select.js';
export { ColorPicker, autoInit as autoInitColorPickers } from './components/colorpicker.js';
export { Upload, autoInit as autoInitUploads } from './components/upload.js';
export { Mask, FORMATOS, autoInit as autoInitMasks, autoFormat } from './components/mask.js';
export { Toast, toast, autoInit as autoInitToasts, ouvirEventos } from './components/toast.js';
export { Tooltip, autoInit as autoInitTooltips } from './components/tooltip.js';
export { Modal, modal, confirmar, autoInit as autoInitModals } from './components/modal.js';
export { Gaveta, gaveta, autoInit as autoInitGavetas } from './components/offcanvas.js';
export { Acordeon, autoInit as autoInitAcordeoes } from './components/acordeon.js';
export * as mask from './core/mask.js';
export * as color from './core/color.js';
export * as dates from './core/dates.js';
export { Popover } from './core/popover.js';

import { autoInit } from './components/datepicker.js';
import { autoInit as autoInitSelect } from './components/select.js';
import { autoInit as autoInitColor } from './components/colorpicker.js';
import { autoInit as autoInitUpload } from './components/upload.js';
import { autoInit as autoInitMask, autoFormat } from './components/mask.js';
import { autoInit as autoInitToast, ouvirEventos } from './components/toast.js';
import { autoInit as autoInitTip } from './components/tooltip.js';
import { autoInit as autoInitModal } from './components/modal.js';
import { autoInit as autoInitGaveta } from './components/offcanvas.js';
import { autoInit as autoInitAcordeao } from './components/acordeon.js';

/** Inicializa todos os componentes marcados por data-attribute no escopo dado. */
export function init(scope = document) {
  return {
    datepickers: autoInit(scope),
    selects: autoInitSelect(scope),
    colorpickers: autoInitColor(scope),
    uploads: autoInitUpload(scope),
    masks: autoInitMask(scope),
    formatted: autoFormat(scope),
    toasts: autoInitToast(scope),
    tooltips: autoInitTip(scope),
    modals: autoInitModal(scope),
    gavetas: autoInitGaveta(scope),
    acordeoes: autoInitAcordeao(scope),
  };
}

// Auto-init no DOM inicial e depois de cada swap do HTMX.
if (typeof document !== 'undefined') {
  const boot = () => { ouvirEventos(); init(document); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  document.addEventListener('htmx:afterSwap', (e) => init(e.target));
}
