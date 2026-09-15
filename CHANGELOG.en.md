# Changelog

What changed in each Tucano release, newest first. Check the "Before upgrading"
section of each version first: that is where you will find what requires changes
in your project.

## Unreleased

### Before upgrading

- The value of an empty editor changed from `<p><br></p>` to `''`, in
  `getValue()` and in the `<textarea>` that goes in the POST. Code that detected
  emptiness by comparing to `<p><br></p>`, in JavaScript or on the server, now
  gets an empty string — and a `required` field now blocks the submit, as it
  should.
- With the script loaded with `defer`, auto-init now waits for
  `DOMContentLoaded` instead of running the moment the script executes. That is
  what leaves room to call `Tucano.setTexts()` before the components mount. A
  script of yours, also deferred, that read `element._tucano` right when it ran
  now finds `undefined`: read it inside a `DOMContentLoaded` listener.
- The Brazilian real currency format was renamed from `real` to `brl`, in
  English like the other code names: `data-tuc-mask="brl"`,
  `data-tuc-format="brl"`, `format: 'brl'` and `Tucano.FORMATS.brl`. `real` no
  longer works: the field gets no mask and display text shows raw.
- `Tucano.mask.format(value, 'document')`, an undocumented alias of
  `'cpf-cnpj'`, was removed. Use `'cpf-cnpj'`.
- The table events now share the prefix of the others: `tuc:sort` is now
  `tucano:sort`, and `tuc:select` is `tucano:select`. The old names no longer
  fire.
- The date picker's `openOnFocus` option was removed. It only existed to keep
  the old behavior of opening the calendar when tabbing in; opening is still
  `↓`, `Space` on an empty field, or a click.
- The select's server search only reads the documented response formats:
  `[{value, label}]`, `["a", "b"]`, DRF's `{results: [...]}` and Select2's
  `{id, text}`, with `next` to tell whether there is another page. `{items}`,
  `{data}`, `pk`, `name` and `has_more` are no longer read: answer in one of the
  formats above or use `loadOptions`.
- Portuguese names left in code: `Popover` passes the reasons `'focus'` and
  `'detached'` to `onDismiss` (they were `'foco'` and `'solto'`), and the color
  picker area's custom property is `--hue` (it was `--matiz`).
- State classes that no CSS rule read are gone — the select's `is-multiple` and
  `is-empty`, the upload's `is-empty`, the date picker's `is-range` and
  `is-timed` — and so is the `id` property of a `Table` instance, which nothing
  used. If your project relied on them, use
  `.tuc-select-native[multiple] + .tuc-select`, `.tuc-select:not(.has-value)`,
  `instance.isRange`, `instance.opts.time` and the `<table>`'s own `id`.
- The CSS got almost 1 KB smaller (gzip) without the fallbacks Tailwind injected
  for old browsers. Below Chrome 111, Safari 16.2 and Firefox 113 — Tailwind 4's
  own baseline — soft backgrounds, focus rings and the off switch track, which
  use `color-mix`, no longer show. And component font weights are fixed at 500
  and 600 instead of reading your project's Tailwind theme.
- Date picker with the Apply button (the default with `time`, or
  `autoApply: false`): picking a day, time or preset no longer fires
  `tucano:change`, `change` or `onChange`. The event fires once, on Apply, and
  closing with `Escape` or a click outside discards the choice. Before, every
  click already emitted, Apply emitted again and closing outside kept the
  change. With `autoApply: true` nothing changes. Code that saved on every event
  now only gets the confirmed value.
- Dates outside `min` and `max` are no longer pulled to the limit. Typed, they
  are refused and the previous value stays; in `setValue()` and in the initial
  `value`, the field is left empty, as already happened with `disabledDates`.
  Before, `2027-01-15` with `max` at `2026-12-31` silently became 12/31/2026. A
  typed range without a valid end is also refused whole, instead of keeping just
  the start.
- `Tucano.dates.parseISO()` only reads ISO (`yyyy-mm-dd`, with optional time)
  and `Date`. Text in any other format fell back to `new Date(text)`, which
  reads `07/09/2026` as July 9, and now returns `null`. For what people type,
  use `Tucano.dates.parseUserInput()`.

### New

- `data-tuc-reveal` also works on loose text on the page, not only on fields: a
  CPF on a profile, the card number in a table cell, an API key in a paragraph.
  The text shows hidden, with the eye next to it, in the same modes (`end`,
  `email`, `all`) and together with `data-tuc-format`. It is visual only: the
  full value is still in the HTML, so anything that must not reach the browser
  has to be hidden on the server.
- `Tucano.setTexts()` replaces any text the components show or announce: the
  date picker's "Limpar" and "Aplicar", the range presets, the select's
  "Buscar..." and "Nenhum resultado", the "Fechar" of modal, drawer and toast,
  the editor buttons, the mask's "Mostrar"/"Ocultar" and the labels read by
  screen readers. A project in English or Spanish no longer shows Portuguese.
  Texts are replaced per group (`Tucano.setTexts({ datepicker: { clear:
  'Clear' } })`), apply to whatever mounts afterwards, and the per-instance
  option (`data-placeholder`, `emptyText`, `prevText`, the upload's `texts`)
  still wins. Portuguese remains the default, with no language dictionaries in
  the package, and `Tucano.getTexts()` returns the current texts. The day name
  that screen readers read in the calendar now comes from the page language.

### Fixed

- `data-tuc-reveal` on a field without `data-tuc-mask`, such as a password or
  a token, threw an error on every keystroke.
- An empty password field with `data-tuc-reveal` started visible, switched to
  `type="text"`, and showed what was typed. It now always starts hidden.
- A field with only the eye got `inputmode="numeric"`, so phones opened the
  number keyboard for passwords and tokens. And the password field lost the
  browser's `autocomplete`, which got in the way of password managers.
- Some default Portuguese texts were missing accents: "Mês anterior", "Próximo
  mês", "Próximo" and "Selecionar período" in the date picker, "Limpar seleção"
  in the select and "Saturação e brilho" in the color picker. If a test in your
  project compares those texts, update it.
- `Escape` in a select, calendar or color picker opened inside a modal closed
  the modal too. It now closes only the panel.
- `Escape` in the color picker left focus on `<body>`, and the next `Tab`
  started over from the top of the page. Focus now returns to the swatch, as in
  the other fields.
- The checkerboard behind translucent colors — on the swatch, the preview and
  the color picker's transparency track — did not show.
- Select, date picker, color picker, menu and tooltip left the DOM at the exact
  moment the exit animation would end, and the end could look cut off.
- Typed ranges in the date picker: `25-12-2025 a 31-12-2025` was cut at the
  date's hyphens, `aa` and `aé` counted as separators, and the "AM" of a
  12-hour time split the text. Separators are now `a`, `até` and `-` between
  spaces, and `–` or `—`.
- Removing a file in direct upload overwrote the `X-CSRFToken` given in
  `headers`; the upload itself already respected it.
- Reopening a modal or drawer less than 200 ms after closing it made the dialog
  close again right away: the scheduled close was not cancelled. Reopening now
  cancels the pending close.
- The date picker read ambiguous dates US-style in the initial `value` and in
  `setValue()`: `07/09/2026` became July 9 in a Portuguese field, with time too.
  Text now goes through the locale's parsing, and a `Date` is taken as is.
- A date typed into the date picker didn't fire `tucano:change` or `onChange`,
  `Enter` with the panel open neither confirmed nor closed, and `Escape` didn't
  discard the text: the preview wrote the value while typing.
- Starting a new range and closing with `Escape` or a click outside erased the
  range that was already chosen. It now comes back.
- Closing and reopening the date picker, select, color picker, menu or tooltip
  within 200 ms removed the panel from the DOM while the component was still
  open.
- Keyboard focus in the calendar: the arrow onto a disabled day sent focus to
  `<body>`; opening with `↓` focused day 1, disabled when `min` falls
  mid-month, instead of the chosen day or today; and with two months the
  repeated day of the neighboring month got focus, with two Tab stops in the
  grid.
- Clicking or pressing `Enter` on the calendar's arrows, month label, month and
  year cells, presets and times sent focus to `<body>`.
- Wrong week number in the calendar when the week starts on Sunday, as in pt-BR
  and en-US: it showed the previous week's.
- Date picker time columns: every button was a Tab stop (194 with seconds) and
  the arrows did nothing. Each column is now a single stop, `↑`, `↓`, `Home`
  and `End` move within it, and `Enter` or `Space` pick.
- The date picker's `destroy()` left the field without `name`, so the form
  stopped posting, plus the attributes, the class and `data-tuc-ready`, which
  kept `Tucano.init` from mounting it again; in native mode the wrapper and the
  overlay stayed. And `new DatePicker` twice on the same field created two
  instances: the second now replaces the first.
- `form.reset()` left the date picker out of sync: the field showed the raw
  `value` text and the hidden input kept the old value.
- Date picker: in native mode with time, `max` blocked every time on the last
  day; range presets with time ended at midnight ("Hoje" was 00:00 — 00:00); in
  a 12-hour locale the panel's time readout showed 24-hour time; and
  `data-native="auto"` wasn't read.
- The calendar's month and year views ignored `min` and `max`. What falls
  outside is now disabled, and so are the arrows.
- The date picker's compact layout was decided only at mount: widening the
  screen or rotating the tablet left the field without typing and without a
  mask.
- The calendar grid had no `role="row"`, and the region that announces the
  month change was recreated on every render, so screen readers didn't announce
  it.
- Dragging a passage from another page into the editor brought its HTML along —
  heading, color, style and `<img>`, which the browser even downloaded. Dropping
  now comes in as plain text, like pasting.
- The editor's sanitizer accepted `//site.com` and `/\site.com` as local paths,
  so the saved link pointed to another domain.
- Editor link box: a typed `javascript:` became a clickable link in the area
  (the saved value was clean); an address without a scheme, such as
  `example.com`, silently vanished on save and now gets `https://`; and changing
  the address with the cursor inside the link split it in two.
- `Enter` and pasting inside an editor code block lost the line breaks on
  repaint, and the lines merged into one.
- `Tab` in an editor table moved only one cell and never left an empty cell. It
  now walks through all of them and adds a row at the last one.
- The editor's `placeholder` never showed.
- `required` on the editor didn't work: untouched, it blocked the submit without
  showing where; cleared, it posted `<p><br></p>` and passed. And the form's
  `reset` didn't bring the editor back to its original content.
- A table inserted in the editor landed inside the cursor's paragraph, left an
  extra `<p></p>` in the value, and the next `Ctrl+Z` undid the text and kept
  the table.
- Selecting bold text outside the editor lit up the Bold button of every editor
  on the page.
- A list applied to a paragraph left `<p></p>` before and after it in the saved
  value.
- The editor's `destroy()` left `_tucano` and the class on the textarea, and the
  scheduled repaint still ran.
- In Safari, `Enter` inside an editor code block started a new block instead of
  breaking the line, and pasting or dropping multi-line text there produced one
  block per line.
- In Safari, an editor toolbar button triggered from the keyboard (`Tab` to it,
  then `Space` or `Enter`) applied the command to an empty caret at the start of
  the text instead of the selected text.
- In Firefox, `Ctrl+Z` right after inserting a table in the editor did not
  remove it.
- In Firefox, changing a link's address with the caret inside it left an empty
  `<a>` in front of the link in the saved value.

## 0.33.1 — 2026-09-14

### Fixed

- In a single select, `Backspace` and `Delete` with the search empty did
  nothing: only multiple mode responded, removing the last tag. Someone who
  tabbed to a filled select could not empty it without reaching for the X with
  the mouse. Both keys now clear the value, like the X. With `clearable: false`
  there is no X, and the keyboard does not clear either.
- Clearing a single select with no `<option value="">` — by the X or by the
  keyboard — showed an empty field, but the `<select>` fell back to its first
  option on its own and the form posted the old value. The native element now
  ends up with nothing selected: the field is not posted, and `required` blocks
  the submit.
- Typing into a searchable select with the list closed lost the first letter:
  it opened the list, and opening cleared the search. "sa" became "a". The
  search now keeps everything typed, remote selects included.
- The form's `reset()` put the `<select>` back to its initial value, but the
  component kept showing the old one, because reset does not fire `change`. The
  display now follows the reset.

## 0.33.0 — 2026-09-14

### Before upgrading

- The default accent color is now neutral: `#0a0a0a` in light mode and `#fafafa`
  in dark mode, with the text on top inverted. The color belongs to your project,
  and the package doesn't impose a brand. If you don't set `--tuc-accent`, the
  primary button, checked box, active tab and selected day will change from
  orange to black (or near-white, in dark mode). To keep the orange, set in
  `:root, .dark` `--tuc-accent: #FF7501`, `--tuc-accent-hover: #FF8A2A`,
  `--tuc-accent-fg: #ffffff`, `--tuc-thumb: #ffffff` and `--tuc-accent-text: #B84300`
  — the last one `#FF7501` in `.dark`. The full recipe is on the Theme page.
- The reasons the modal and the drawer pass to `onClose` are now in English, like
  the rest of the API: `'button'` instead of `'botao'` and `'backdrop'` instead of
  `'fundo'`. If your code compares the reason, update both.
- In the mask, `data-tuc-reveal`, `data-reveal-mode` and `revealMode` are now
  `end` or `all` (they were `fim` and `tudo`), and the `cnpj-numerico` format is
  now `cnpj-numeric`. The old names no longer work: update your templates.

### New

- Fields with `data-validate` turn green when they pass. On a mask, as soon as the
  value is complete and correct, while typing (`data-tuc-valid`); red still shows
  only when leaving the field. On a native `.tuc-input` with `data-validate`, the
  green comes from `:user-valid`. Without the attribute, nothing changes.

### Fixed

- A drawer with content taller than the screen — a long menu, a filter form —
  overflowed the screen and did not scroll. The body now scrolls and the panel
  stays the height of the screen, on all four edges; the modal got the same fix.
- `.tuc-menu` in a fixed-height column, such as an app's sidebar, overflowed
  the column and the whole page scrolled instead. The menu now scrolls on its
  own there; outside such a column, nothing changes.
- With a modal or drawer open, the mouse wheel scrolled the page behind it —
  over the dimmed backdrop and after the dialog content reached its end. The
  page now stays still while a dialog is open, and reaching the end of the
  body no longer passes the scroll on.
- The close X on modals and drawers sat about 2px inside the line where the
  content and the footer buttons end. The X stroke now ends on that same line.
- Opening a modal or drawer on a page whose scrollbar takes up space (Windows,
  or macOS with a mouse) made the background content jump sideways: the scroll
  lock hid the scrollbar and the page gained its width. The scrollbar's space
  is now reserved while the dialog is open.
- A table with many columns in the editor and in `.tuc-prose` was locked to the
  available width and squeezed the text to one word per line. Each column now
  has a minimum width and a wide table scrolls horizontally, on its own,
  without moving the rest of the text. The saved HTML doesn't change.

## 0.32.1 — 2026-09-13

### Fixed

- The date picker field declared `aria-expanded` without a role that accepts
  it, and screen readers ignored the attribute. It is now `role="combobox"`, the
  ARIA role for a field that opens a panel.
- Date picker and select kept `aria-controls` pointing at the panel even when
  closed, when it is not in the DOM — an invalid value for screen readers and
  for Lighthouse. The attribute now exists only while the panel is open.

## 0.32.0 — 2026-09-13

### Before upgrading

- The default accent color is now the toucan orange, `#FF7501`, in both
  themes, with white text on top (`--tuc-accent-fg`). The contrast of white
  on this orange is 2.7; if you need 4.5 on the primary button, set
  `--tuc-accent-fg: #0a0a0a` in your own project. Where the
  accent is the text color itself — link, active menu item, tag — the new
  `--tuc-accent-text` applies, darker in light mode to stay readable. If you
  already set `--tuc-accent` in your project, check these two as well.
- A file rejected by the upload is a `.tuc-alert is-danger`, with the class
  `.tuc-upload__rejected`. The `.tuc-upload__item.is-rejected` rule no longer exists.
- The color picker hex field is a `.tuc-input`, and the eyedropper a
  `.tuc-btn is-outline is-sm`.
- The `tuc-upload__action` and `tuc-pagination__ico` classes were removed.
- The active `.tuc-menu` item no longer has the stroke on its left border.
- Info badge, alert and toast use the new `--tuc-info` (blue), and no
  longer the accent color. If you overrode `--tuc-accent` to change that shade,
  override `--tuc-info` instead.

### New

- Checkbox, radio and switch: `.tuc-radio`, `.tuc-switch` and the `.tuc-choice` label, which
  aligns the control with the first line of text, with `.tuc-choices` for groups.
- Forms: `.tuc-label`, `.tuc-hint` and `.tuc-error`, and the invalid state via
  `aria-invalid="true"` on every field — Django 5 already writes the attribute.
  `.tuc-input` also works on the native `<select>`.
- Tabs (`data-tuc-tabs`), with ARIA APG keyboard support, a manual mode for panels
  loaded via HTMX and a segmented variant.
- Inline page alert (`.tuc-alert`), in four tones.
- Loading: `.tuc-spinner` and `.tuc-skeleton`. A button with `aria-busy` does not fade.
- Timeline (`.tuc-timeline`), class only: tones, filled or hollow dot and an
  optional icon in place of the dot.
- The package exports `icon`, `ICON_CHECK`, `ICON_COPY` and `ICON_X`.
- Documentation with one page per component, generated at build time.

### Changed

- Components use the library's own pieces internally: the calendar label and
  shortcuts are `.tuc-btn`, the toast and select loading indicator is the
  `.tuc-spinner`, the menu counter is `.tuc-badge`.
- The modal and drawer glow follows the accent color.

### Fixed

- The mask currency field started without a placeholder and looked like a plain field.
  It now shows zero already formatted, such as `R$ 0,00`.
- The calendar's month navigation arrows were invisible and not clickable.
- A button made with `<a>` came out underlined.
- Upload, the dropdown danger item and the mask invalid field used
  hardcoded red and green, which did not lighten in dark mode.
- The tabs panel focus ring rose above the list.
- The server search error looked the same as "no results".
- In the date picker, opening with `↓` or `Espaço` left focus on the field: the arrows
  did not reach the days and `Tab` closed the panel. Focus now moves to the day.
- The mask cleared the field's `aria-invalid` on focus, and the error Django
  sent disappeared on the first click. Now only the mask's own validation touches
  it.
- `setValue()` on the sensitive field did not update the value submitted with the form.
- The editor toolbar only responded to the mouse: with focus on a button, `Enter` and
  `Espaço` did nothing. They now work, and the command applies to the text that
  was selected.
- The editor's delete row, column and table buttons did not turn red.
- The upload `method` option was ignored, and the request was always sent as POST.
- A toast coming from Django messages got the wrong type when the message
  had `extra_tags`: it read only the first word.
- `Tooltip.setText()` removed the arrow along with the text.
- An empty `data-tuc-tip` stopped the following tooltips from mounting.
- A dropdown created in JS with `panel` left its items without `role="menuitem"`.
- Select, date picker and color picker inside a modal or drawer opened the panel
  behind the dialog. The panel is now created inside the open `<dialog>`.
- A modal without a title had no name for screen readers; the text now names it.
- The dialog left the DOM 10 ms before the exit animation finished.
- In pagination, the ends had no name on mobile, and `setPage()` lost
  focus for keyboard users.
- The range date picker misread its own ISO value
  (`2026-03-01,2026-03-15`), which is what Django returns when the form
  comes back with errors.
- Changing `--tuc-accent` or a tone on a container did not change the soft background or the
  focus ring, which stayed in the root color.
- The code highlighter painted the rest of the line as a comment after
  `https://`, and every CSS hex color (`#4f46e5`) as a comment.

## 0.31.0 — 2026-09-04

### Before upgrading

- The `tuc-menu__secao` class was removed. Use `tuc-menu__section`.

### Changed

- Test suite in the repository and in CI: pure functions, in-browser
  behavior, real keyboard, documentation examples checked against the code and
  cross-checks of names.

### Fixed

- The accordion did not expose `node._tucano`.
- Modal and drawer advertised `actions` with the old keys.
- `toast.promise` documented `carregando/sucesso/erro` instead of
  `loading/success/error`.

## 0.30.2 — 2026-09-04

### Fixed

- The 0.30.1 tag did not include the rename of the `tucano:toast-fechado` event to
  `tucano:toast-closed`, which npm was already publishing. GitHub, jsDelivr and npm once again
  have the same content.

### New

- Full API reference, generated from the code, inside `llms.txt`.

## 0.30.1 — 2026-09-04

### Before upgrading

- The API is now entirely in English: method, option, value, CSS class and
  event names. `Modal.abrir()` became `open()`, `tom: 'perigo'` became
  `tone: 'danger'`, `.tuc-gaveta` became `.tuc-drawer`.
- The table sorts on the server by default; sorting on the page requires
  `data-sort-mode="client"`.
- Arriving via `Tab` no longer opens the field panels. Opening is always explicit.

### New

- Table, with sorting and bulk selection, and pagination built for the Paginator.
- Dropdown.
- Status badge, custom-styled checkbox and a copy button on code
  blocks.
- Fields draw their border and height before the script runs.

### Changed

- Tokens on `:root` and a reset with a single selector.

## 0.25.1 — 2026-09-03

- The browser anchors scrolling on its own, with no manual fix.

## 0.25.0 — 2026-09-03

- Importing `tucano` no longer runs anything: the bundler takes only what is used.

## 0.24.2 — 2026-09-03

- Applying a heading in the editor no longer makes the text jump, and links are requested in a modal.

## 0.23.3 — 2026-09-03

- The scrollbar follows the theme.

## 0.23.1 — 2026-09-03

- Same content as 0.23.0, published under a different number because npm reserved the
  previous one.

## 0.23.0 — 2026-09-03

- Rich text editor with tables, alignment and code blocks. The Markdown field
  was removed, leaving a single editor.
- The tooltip sits far enough away that the arrow does not touch the trigger.

## 0.22.1 — 2026-09-03

- All controls measured to have the same height.

## 0.19.0 — 2026-09-03

- Text editor that shows the result as you type.

## 0.18.1 — 2026-09-03

- The formatted field preview replaces the field instead of stacking below it.

## 0.18.0 — 2026-09-03

- Formatted text field, in Markdown.

## 0.17.1 — 2026-09-03

- The icon no longer overlaps the text in fields with an icon.

## 0.17.0 — 2026-09-03

- Styling for the textarea, which the library had never had.

## 0.16.3 — 2026-09-03

- AI files up to date with the library.

## 0.16.2 — 2026-09-03

- Accordion example with real content.

## 0.16.1 — 2026-09-03

- Generic names in the example menu.

## 0.16.0 — 2026-09-03

- Submenu in the sidebar menu, with a rail and highlighting of the open branch.

## 0.15.1 — 2026-09-03

- The icon follows the button size.

## 0.15.0 — 2026-09-03

- Sidebar menu, and icons now use the library's button.

## 0.14.3 — 2026-09-03

- The accordion no longer stutters on first open.

## 0.14.2 — 2026-09-03

- The accordion collapses all the way to zero, and the background glow spreads further.

## 0.14.1 — 2026-09-03

- The end of the accordion is no longer cut off, and the drawer glow starts in the right place.

## 0.14.0 — 2026-09-03

- Accordion built on native `<details>`.

## 0.13.0 — 2026-09-03

- The drawer becomes its own component, on the same base as the modal.

## 0.12.0 — 2026-09-03

- Drawer (off-canvas).

## 0.11.1 — 2026-09-02

- A closed `<dialog>` no longer covers the whole page.
- The advertised sizes now come from the build.

## 0.11.0 — 2026-09-02

- Modal built on native `<dialog>`.

## 0.10.2 — 2026-09-02

- Listener leak in the popover.

## 0.10.1 — 2026-09-02

- Panels positioned with `left`/`top` instead of `transform`.

## 0.10.0 — 2026-09-02

- Full tooltip: four sides, arrow and customizable color.

## 0.9.9 — 2026-09-02

- The toast moves to the bottom right corner, and the margin on mobile was fixed.

## 0.9.8 — 2026-09-02

- Loading toast that turns into the result in the same card.

## 0.9.7 — 2026-09-02

- The toast's two accessibility regions become a single stack.

## 0.9.6 — 2026-09-02

- Icon and close button centered in the toast.

## 0.9.5 — 2026-09-02

- New tooltip animation.

## 0.9.4 — 2026-09-02

- The toast stack does not close when moving the mouse from one toast to another.

## 0.9.3 — 2026-09-02

- Toast and tooltip are exempt from the 16px mobile rule.

## 0.9.2 — 2026-09-02

- Motion reviewed and heights checked.

## 0.9.1 — 2026-09-02

- A disabled button shows the not-allowed cursor.

## 0.9.0 — 2026-09-02

- Stacked toasts and button styles.

## 0.8.0 — 2026-09-02

- Toast and tooltip.

## 0.7.1 — 2026-09-02

- Fewer requests in server search.

## 0.7.0 — 2026-09-02

- Server search in Select.

## 0.6.1 — 2026-09-02

- Hiding modes for the sensitive field, and the password field fixed.

## 0.6.0 — 2026-09-02

- Masks, document validation and sensitive field.

## 0.5.2 — 2026-09-02

- Accepted upload types documented.

## 0.5.1 — 2026-09-02

- Retry icon fixed.

## 0.5.0 — 2026-09-02

- Upload field.

## 0.4.2 — 2026-09-02

- Date picker attributes documented on the page.

## 0.4.1 — 2026-09-02

- Color picker value row aligned.

## 0.4.0 — 2026-09-02

- Full customization via CSS variables.
- Recursion in the color picker fixed.

## 0.3.0 — 2026-09-02

- No zoom on mobile when focusing a field, and the custom panel becomes the default.

## 0.2.1 — 2026-09-02

- Native mode and calendar on mobile fixed.
- `llms.txt` and `AGENTS.md`, so AI knows how to use the library.

## 0.2.0 — 2026-09-01

- First release: lightweight form components, with no dependencies.
