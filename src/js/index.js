export { DatePicker, autoInit as autoInitDatePickers } from './components/datepicker.js';
export { Select, autoInit as autoInitSelects } from './components/select.js';
export { ColorPicker, autoInit as autoInitColorPickers } from './components/colorpicker.js';
export { Upload, autoInit as autoInitUploads } from './components/upload.js';
export { Mask, FORMATS, autoInit as autoInitMasks, autoFormat } from './components/mask.js';
export { Toast, toast, autoInit as autoInitToasts, listenForEvents } from './components/toast.js';
export { Tooltip, autoInit as autoInitTooltips } from './components/tooltip.js';
export { Modal, modal, confirm, autoInit as autoInitModals } from './components/modal.js';
export { Drawer, drawer, autoInit as autoInitDrawers } from './components/drawer.js';
export { Accordion, autoInit as autoInitAccordions } from './components/accordion.js';
export { Tabs, autoInit as autoInitTabs } from './components/tabs.js';
export { Dropdown, autoInit as autoInitDropdowns } from './components/dropdown.js';
export { Table, autoInit as autoInitTables } from './components/table.js';
export { Pagination, pagination, pageWindow, autoInit as autoInitPagination } from './components/pagination.js';
export { Editor, autoInit as autoInitEditors } from './components/editor.js';
export { sanitize } from './core/sanitize.js';
export { highlight, autoInit as autoInitProse } from './core/highlight.js';
export * as mask from './core/mask.js';
export * as color from './core/color.js';
export * as dates from './core/dates.js';
export { Popover } from './core/popover.js';
// Textos da interface: o portugues e o padrao, e setTexts troca por grupo.
export { setTexts, getTexts } from './core/texts.js';
// O helper e os ícones que os componentes usam por dentro — para quem monta um
// botão ao lado deles não desenhar um segundo X ou um segundo copiar.
export { icon, ICON_CHECK, ICON_COPY, ICON_X } from './core/dom.js';

import { autoInit } from './components/datepicker.js';
import { autoInit as autoInitSelect } from './components/select.js';
import { autoInit as autoInitColor } from './components/colorpicker.js';
import { autoInit as autoInitUpload } from './components/upload.js';
import { autoInit as autoInitMask, autoFormat } from './components/mask.js';
import { autoInit as autoInitToast, listenForEvents } from './components/toast.js';
import { autoInit as autoInitTip } from './components/tooltip.js';
import { autoInit as autoInitModal } from './components/modal.js';
import { autoInit as autoInitDrawer } from './components/drawer.js';
import { autoInit as autoInitAccordion } from './components/accordion.js';
import { autoInit as autoInitTab } from './components/tabs.js';
import { autoInit as autoInitDropdown } from './components/dropdown.js';
import { autoInit as autoInitTable } from './components/table.js';
import { autoInit as autoInitPag } from './components/pagination.js';
import { autoInit as autoInitEditor } from './components/editor.js';
import { autoInit as autoInitProse } from './core/highlight.js';

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
    drawers: autoInitDrawer(scope),
    accordions: autoInitAccordion(scope),
    tabs: autoInitTab(scope),
    dropdowns: autoInitDropdown(scope),
    tables: autoInitTable(scope),
    pagination: autoInitPag(scope),
    editors: autoInitEditor(scope),
    prose: autoInitProse(scope),
    // Por último de propósito: componentes que criam a própria barra de botões
    // marcam neles `data-tuc-tip`, e esses elementos só existem depois que eles
    // se montam. Antes, os botões do editor nasciam sem dica.
    tooltips: autoInitTip(scope),
  };
}
