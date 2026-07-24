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
- 🔎 **Live formatting state** — every active mark/node is exposed as a local
  variable so your buttons can show their active state.
- 🎨 **Per-element-type styling** — independent typography controls for
  paragraph, each heading level, quote, code, lists and links.
- 🧩 **NoCode-friendly** — HTML value as an internal variable (form-ready) and
  `change` / `focus` / `blur` / `selectionChange` events.

---

## How it works

1. The user selects text in the editor.
2. A floating menu appears next to the selection. Its content is **your**
   dropzone (`toolbarContent`) — drop in buttons, icons, dividers, anything.
3. Each button's `onClick` workflow calls a **component action** (e.g. *Toggle
   Bold*, *Set Heading*), which applies the formatting to the current selection.
4. Buttons can read the editor's **live state** to highlight themselves when
   their formatting is active.

In the WeWeb editor the menu stays open (see `Force open floating toolbar`) so
you can drop and arrange elements without needing a live selection.

---

## Getting started

```bash
npm i
npm run serve --port=4040   # then add the custom element in WeWeb's developer popup
npm run build -- --name=rich-text-editor --type=wwobject
```

---

## Properties

### Settings

| Property | Type | Description |
|---|---|---|
| `Initial value (HTML)` | Textarea | HTML string used as the starting content (reactive). |
| `Placeholder` | Text | Shown when the editor is empty. |
| `Editable` | OnOff | Allow the user to edit. |
| `Read only` | OnOff | Force read-only (overrides Editable). |
| `Autofocus` | OnOff | Focus the editor on load. |
| `Force open floating toolbar` | OnOff | **Editor mode only** — keep the menu open to drop/arrange buttons. No runtime effect. |
| `Debounce change event` (+ delay) | OnOff / Length | Debounce the `change` event. |
| `Field name`, `Custom validation`, `Validation` | Text / OnOff / Formula | Form settings — only shown when the editor sits inside a form. |

### Selection menu (Style panel)

| Property | Description |
|---|---|
| `Vertical position` | `Above` / `Below` the selection. |
| `Horizontal position` | `Align left` / `Center` / `Align right`. |
| `Auto flip if no space` | Open on the opposite side if the menu would overflow the viewport. |
| `Menu offset X` / `Menu offset Y` | Fine-tune placement (accepts negative px). |
| `Background`, `Border`, `Radius`, `Padding`, `Gap`, `Shadow` | Menu appearance. |

### Content styles (Style panel)

Independent typography controls — **Font, Size, Weight, Color, Line height,
Margin top/bottom** — grouped per element type: **Paragraph, Heading 1–6, Quote,
Code, Lists, Link**.

The **Code** group also has a **Background** control, and applies to both code
blocks and inline code so the two stay visually consistent.

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

---

## Tech

Vue 3 (Composition API) · TipTap / ProseMirror (`@tiptap/*` `2.27.2`) ·
`@weweb/cli`.
