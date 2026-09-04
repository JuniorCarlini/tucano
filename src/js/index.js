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
export { Dropdown, autoInit as autoInitDropdowns } from './components/dropdown.js';
export { Rico, autoInit as autoInitRicos } from './components/rico.js';
export { sanitizar } from './core/sanitizar.js';
export { destacar, autoInit as autoInitProsa } from './core/destacar.js';
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
import { autoInit as autoInitDropdown } from './components/dropdown.js';
import { autoInit as autoInitRico } from './components/rico.js';
import { autoInit as autoInitProsa } from './core/destacar.js';

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
    modals: autoInitModal(scope),
    gavetas: autoInitGaveta(scope),
    acordeoes: autoInitAcordeao(scope),
    dropdowns: autoInitDropdown(scope),
    ricos: autoInitRico(scope),
    prosa: autoInitProsa(scope),
    // Por último de propósito: componentes que criam a própria barra de botões
    // marcam neles `data-tuc-tip`, e esses elementos só existem depois que eles
    // se montam. Antes, os botões do editor nasciam sem dica.
    tooltips: autoInitTip(scope),
  };
}
