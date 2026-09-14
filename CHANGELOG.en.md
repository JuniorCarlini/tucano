# Changelog

What changed in each Tucano release, newest first. Check the "Before upgrading"
section of each version first: that is where you will find what requires changes
in your project.

## Unreleased

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
