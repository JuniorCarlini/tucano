/// <reference path="../../dist/tucano.d.ts" />
/*
 * Uso pelo <script> do CDN: JavaScript sem import, conferido com checkJs. O
 * `Tucano` global vem do `export as namespace` do d.ts, que so vale em script —
 * exatamente o caso de quem nao empacota.
 */

const period = new Tucano.DatePicker('#periodo', { mode: 'range' });
period.getValue().start?.getFullYear();

Tucano.toast.success('Salvo');
Tucano.setTexts({ modal: { confirm: 'OK' } });
document.body.addEventListener('tucano:change', (e) => e.detail.value);

/** @type {Tucano.SelectOptions} */
const options = { clearable: false, maxItems: 3 };
new Tucano.Select('#estado', options).getValue();

// @ts-expect-error opcao em portugues nao existe
new Tucano.Select('#estado', { buscar: true });
// @ts-expect-error grupo de textos que nao existe
Tucano.setTexts({ janela: { fechar: 'x' } });
