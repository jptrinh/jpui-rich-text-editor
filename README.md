# Rich Text Editor — WeWeb custom component

A lightweight, **TipTap-powered** rich text editor for WeWeb. Its formatting
toolbar isn't hardcoded: it's a **floating dropzone** that appears on text
selection, into which you drop your **own** buttons and wire each to the
editor's exposed formatting actions. You keep full control of the toolbar's look
and contents while the component handles the editing engine, positioning and
state.

> Built with Vue 3 + `@weweb/cli`. Output is clean HTML, ready for forms,
> bindings and workflows.

---

## Highlights

- ✍️ **Full rich text editing** — bold, italic, underline, strike, inline code,
  code blocks, headings (H1–H6), bullet / ordered lists, blockquotes, links,
  text color and font family.
- 🎯 **Bring-your-own toolbar** — a floating dropzone (`wwLayout`) you fill with
  any WeWeb elements; buttons trigger the editor through exposed actions.
- 🧭 **Smart positioning** — choose above/below and left/center/right, with
  **auto-flip** when the menu would overflow the viewport, plus offset X/Y.
- 🔎 **Live formatting state** — every active mark/node is exposed both as a
  global `state` variable and as local context, so your buttons can show their
  active state.
- 🎨 **Per-element-type styling** — independent typography controls for
  paragraph, each heading level, quote, code, lists and links.
- 🧩 **NoCode-friendly** — HTML value as an internal variable (form-ready) and
  `change` / `initValueChange` / `focus` / `blur` / `selectionChange` events.

---

## How it works

1. The user selects text in the editor.
2. A floating menu appears next to the selection. Its content is **your**
   dropzone (`toolbarContent`), which starts with a styled `Toolbar container`
   flexbox — drop your buttons, icons and dividers inside it.
   When selecting with a pointer the menu waits for the button to be released,
   so it doesn't chase the range mid-drag; keyboard selection (`Shift`+arrows)
   shows it right away.
3. Each button's `onClick` workflow calls a **component action** (e.g. *Toggle
   Bold*, *Set Heading*), which applies the formatting to the current selection.
4. Buttons can read the editor's **live state** to highlight themselves when
   their formatting is active.

In the WeWeb editor the menu stays open (see `Force open floating toolbar`) so
you can drop and arrange elements without needing a live selection.

**Toolbars containing a dropdown.** By default the toolbar closes when focus leaves
it. A `ww-input-select` (or any popup) renders its panel at the **page root**, so
opening it moves focus outside the toolbar and closes it before you can pick anything.
Turn on **`Manual close`**, then close it yourself with the
`closeToolbar` action once the selection is applied. `Escape` still closes it too.
With `Manual close` on, a click anywhere outside the editor, the toolbar and the
panel does close it — including through the transparent full-page overlay a select
puts up while its panel is open, so clicking the toolbar to dismiss the panel
leaves the toolbar standing.

**The editor is read-only on the WeWeb canvas.** That's deliberate: typing on the
canvas is never written back to `Initial value`, so it would be silently lost on
reload. Use Preview to type — editing works normally there and at runtime.

**Where it renders.** At runtime the toolbar is teleported to the page root and
positioned with `position: fixed`, so a parent with `overflow: hidden` can't clip
it and a parent stacking context can't bury it — use `Menu z-index` to layer it
against your own overlays. On the editor canvas it deliberately stays inside the
component instead, so WeWeb's drag & drop into the dropzone keeps working.

---

## Testing

`TEST.md` holds the manual test plan — risk-ordered, with the editor-canvas vs
Preview differences called out and a regression suite for bugs already fixed.

## Getting started

```bash
npm i
npm run serve --port=4040   # then add the custom element in WeWeb's developer popup
npm run build -- --name=jpui-rich-text-editor --type=wwobject
```

---

## Properties

### Settings

| Property | Type | Description |
|---|---|---|
| `Initial value (HTML)` | Textarea | HTML string used as the starting content (reactive). |
| `Placeholder` | Text | Shown when the editor is empty. |
| `Editable` | OnOff | Allow the user to edit. Note the editor is always read-only on the WeWeb canvas — see below. |
| `Read only` | OnOff | Force read-only (overrides Editable). |
| `Autofocus` | OnOff | Focus the editor on load. |
| `Force open floating toolbar` | OnOff | **Editor mode only** — keep the menu open to drop/arrange buttons. No runtime effect. |
| `Manual close` | OnOff | Stops the toolbar auto-closing when focus leaves it. Turn on when the toolbar holds a **dropdown or popup** — see below. |
| `Debounce change event` (+ delay) | OnOff / Length | Debounce the `change` event. |
| `Accessible label` | Text | Name screen readers announce for the editing area. Defaults to `Rich text editor`; see [Accessibility](#accessibility). |
| `Toolbar accessible label` | Text | Name screen readers announce for the floating toolbar. |
| `Field name`, `Custom validation`, `Validation` | Text / OnOff / Formula | Form settings — only shown when the editor sits inside a form. |

### Editor box (Style panel)

| Property | Description |
|---|---|
| `Base font`, `Base font size`, `Base text color` | Defaults for all content; each element type can override them in its own group. |
| `Placeholder color` | Color of the placeholder text. |

The **box** itself — background, padding, min height, border, border radius — is
not a component property: style the element instance directly in WeWeb, as you
would any other element. The editing surface fills that box, so clicking anywhere
inside it puts the caret in the text.

The component declares the **`focus`** and **`readonly`** states, so you can pick
them in the editor's state selector and give the instance per-state styles.
Use the `focus` state for the **focus indicator** — a border or shadow change —
since the editor draws no ring of its own. `readonly` follows the **Read only**
property and **Editable** being off — not the editor-canvas read-only override, so
it isn't stuck on while you design.

### Selection menu (Style panel)

| Property | Description |
|---|---|
| `Vertical position` | `Above` / `Below` the selection. |
| `Horizontal position` | `Align left` / `Center` / `Align right`. |
| `Auto flip if no space` | Open on the opposite side if the menu would overflow the viewport. |
| `Menu offset X` / `Menu offset Y` | Fine-tune placement (accepts negative px). |
| `Menu z-index` | Layering against your app's overlays (the toolbar renders at the page root). |

The menu's **appearance** — background, border, radius, padding, gap, shadow — is
not a component property. The floating menu is a bare positioning shell that
shrink-wraps its content; the box is a **`Toolbar container`** flexbox that a new
instance already has in its dropzone, pre-styled with the look above. Select it in
the navigator and restyle it as you would any other element — or rename, replace or
delete it. Drop your buttons **inside** it.

### Content styles (Style panel)

Independent typography controls — **Font, Size, Weight, Color, Line height,
Margin top/bottom** — grouped per element type: **Paragraph, Heading 1–6, Quote,
Code, Lists, Link**.

The **Quote** group adds **Bar** (the vertical rule on the left — set it to `none` to
remove it), **Background**, **Padding** (whose left value is the gap between the bar and
the text) and **Margin left / right**. Those last two are applied as
`margin-inline-start` / `margin-inline-end`, so they follow the text direction; they
default to the 40px browsers put on quotes — set them to 0 to align a quote with the
surrounding text. The **Code** group applies to both code blocks and inline code so the two stay
visually consistent, and adds a **Background** control plus separate **Block padding**
and **Inline padding** — a block is a box around several lines, inline code is a chip
inside a sentence, so they rarely want the same value. The **Link** group
adds a **Text decoration** control (`underline` by default — see
[Accessibility](#accessibility) before removing it).

---

## Actions

Bind a dropped button's `onClick` to any of these (group **Rich Text**):

| Action | Argument | Effect |
|---|---|---|
| `toggleBold` / `toggleItalic` / `toggleUnderline` / `toggleStrike` | — | Toggle the mark. |
| `toggleCode` / `toggleCodeBlock` | — | Inline code / code block. |
| `toggleBulletList` / `toggleOrderedList` | — | Toggle a list. |
| `toggleBlockquote` | — | Toggle a blockquote. |
| `setParagraph` | — | Convert block to paragraph. |
| `setHeading` | level `1`–`6` | Set heading level. |
| `setColor` / `unsetColor` | hex | Apply / remove text color. |
| `setFontFamily` | family | Apply a font family. |
| `setLink` / `unsetLink` | href | Add / remove a link. |
| `clearFormatting` | — | Remove all formatting. |
| `focus` | — | Focus the editor. |
| `closeToolbar` | — | Hide the menu until the next selection. |

---

## Exposed state

Read the editor's live state from `context.local.data?.['richText']`:

| Group | Keys |
|---|---|
| Selection | `isEmpty`, `hasSelection`, `selectedText` |
| Active marks | `isBold`, `isItalic`, `isUnderline`, `isStrike`, `isCode`, `isCodeBlock` |
| Active nodes | `isBulletList`, `isOrderedList`, `isBlockquote`, `isLink`, `linkHref` |
| Current | `currentHeadingLevel` (0 = paragraph), `currentColor`, `currentFontFamily` |

The same snapshot is exposed globally as the **`state`** variable
(`variables['<uid>-state']`), which is what toolbar buttons bind to for their
active state.

The HTML content is **not** part of that snapshot — it lives in the **`value`**
variable and is emitted through the **`On change`** event.

---

## Use it in a form

Drop the editor inside a `ww-form-container` and it registers itself as a field:
its HTML is submitted under **`Field name`** (defaults to the element name), it
runs the optional **`Validation`** formula before submit, and a form reset
restores **`Initial value`** — in the variable *and* in the visible content.

Outside a form nothing changes: the injections fall back to no-ops and the form
settings stay hidden in the panel.

---

## Events

| Event | Payload |
|---|---|
| `On change` | `{ value }` — HTML content |
| `On init value change` | `{ value }` — the new initial value |
| `On focus` / `On blur` | `{}` |
| `On selection change` | `{ text }` — currently selected text |

---

## Keyboard shortcuts

Standard TipTap shortcuts are active: `Cmd/Ctrl+B` bold, `+I` italic, `+U`
underline, `+E` inline code, `+Alt+1…6` headings, `+Shift+7/8` lists, and more.

The component adds two of its own:

| Key | Effect |
|---|---|
| `Alt+F10` | Move focus into the floating toolbar (the convention used by TinyMCE and CKEditor). |
| `Escape` | Dismiss the toolbar; from inside it, return focus to the editor. |

Inside the toolbar, `←` / `→` move between focusable buttons.

---

## Accessibility

What the component handles:

- The editing area is exposed as `role="textbox"` with `aria-multiline="true"`,
  named by **`Accessible label`**, and `aria-readonly` tracks the read-only state.
  If you clear that field the name is derived instead — `Field name`, else the
  element's name in the tree — so the editor is never left unnamed.
- The toolbar is a `role="toolbar"` named by **`Toolbar accessible label`**,
  reachable with `Alt+F10`, dismissible with `Escape`, with arrow-key navigation
  between buttons. It stays open while focus is inside it.
- The focus indicator is yours to set: give the instance a `focus`-state style
  (border or shadow) with at least 3:1 contrast against its surroundings. The
  component suppresses the browser's own outline, so without one there is no
  visible focus indicator (WCAG 2.4.7).
- The default text colors meet WCAG AA — body text 14.7:1, placeholder 4.8:1 and
  links 5.2:1 (underlined, not color-only). Keep the instance's border at 3:1
  against the page to satisfy the minimum for control boundaries.
- The toolbar's appear animation respects `prefers-reduced-motion`.

**What you have to do:**

1. **Set `Accessible label`.** It ships as `Rich text editor`, which is only a
   placeholder — give it the field's real purpose, especially in a form or when
   there is more than one editor on the page.
2. **Give every dropped toolbar button an accessible name.** Icon-only buttons
   are the most common failure in this pattern: an icon with no text is
   announced as nothing. Use a `ww-button` with text, or add an `aria-label`.
3. **Make dropped buttons focusable.** `Alt+F10` and the arrow keys can only
   reach natively focusable elements (`ww-button`, links, inputs). A styled
   `ww-div` is not focusable — if that's all the toolbar contains, focus lands
   on the toolbar container itself and the buttons stay keyboard-unreachable.
4. **Keep the toolbar container's contrast.** The floating menu is transparent and
   unpadded, so the `Toolbar container` in the dropzone owns the toolbar's
   background, spacing and shadow — and its contrast against the page behind it.
   It ships white, so the shadow is what separates it from a light page: if you
   remove the shadow, give it a border instead, and keep the buttons legible
   against whatever background you set.
5. **Mind the heading levels.** Authors can insert H1–H6 into content, which can
   break the page's heading hierarchy. Restrict which levels your toolbar
   offers if that matters for the surrounding page.

If you keep the toolbar buttons non-focusable, note that the standard formatting
is still keyboard-operable through the shortcuts above — but any custom action
that exists only as a toolbar button will not be.

---

## Tech

Vue 3 (Composition API) · TipTap / ProseMirror (`@tiptap/*` `3.29.0`) ·
`@weweb/cli`.
