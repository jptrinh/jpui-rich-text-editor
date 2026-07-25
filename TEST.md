# Test plan

Manual test checklist for the Rich Text Editor component. Ordered by risk — sections
**A–C** cover everything most likely to be broken, so start there.

Behaviour deliberately differs between the two modes, and several tests only make
sense in one of them:

| | Editor canvas | Preview / runtime |
|---|---|---|
| Editing | **read-only** (typing is never persisted) | editable |
| Toolbar | force-open, for arranging buttons | appears on text selection |
| Toolbar DOM | inside the component | teleported to the page root, `position: fixed` |

---

## A. Prerequisites

- [ ] **Re-sync the component from GitHub in WeWeb.** Nothing below is live until you do.
- [ ] Confirm the new build landed: the Style panel shows **Focus ring color** and
      **Menu z-index**; Settings shows **Manual close** and **Accessible label**.

> ### ⚠️ If styles look stale or a rule is struck out in devtools
> Running the dev server *and* having the GitHub-synced version installed loads
> **two copies** of the component's CSS. The selectors are identical, so load order
> decides and the older bundle can win — you'll see the same rule twice in devtools,
> one of them struck through. Use one or the other: either put the dev-mode element
> on the page, or re-sync and stop the dev server.

## B. Smoke test (2 min, Preview)

- [ ] Editor renders; placeholder appears when you empty it
- [ ] Typing works; selecting text opens the toolbar next to the selection
- [ ] A toolbar button applies formatting
- [ ] No console errors

If any of these fail, stop — the sync didn't take.

## C. Highest risk / never verified

### Teleport and clipping (Preview)
- [ ] Put the editor inside a `ww-div` with `overflow: hidden` and a small height →
      select text near the edge → **the toolbar is not clipped**
- [ ] **Menu styling still applies** — change Menu background / radius / padding / gap /
      shadow and confirm each takes effect *(if these silently revert to defaults, the
      CSS-variable relocation broke)*
- [ ] Inspect the DOM: the toolbar is a direct child of `<body>`, not of the component
- [ ] **Menu z-index** — place a high-`z-index` element over the editor, raise the
      value, confirm the toolbar wins
- [ ] Select text, scroll a little → the toolbar **follows** the selection
- [ ] Keep scrolling until the selection leaves the viewport → the toolbar **hides**

### Action arguments (Canvas)
- [ ] `Set text color` shows a **Color** argument field in the workflow editor
- [ ] Same for `Set heading` (Level), `Set font family` (Family), `Set link` (URL)

### Manual close, with a dropdown in the toolbar (Preview)
- [ ] `Manual close` **off**: opening a `ww-input-select` in the toolbar closes the
      toolbar *(the default, focus-based behaviour)*
- [ ] `Manual close` **on**: the toolbar **stays open** while the select's panel is open
- [ ] Pick a value → the format applies → your `closeToolbar` action closes the toolbar
- [ ] `Escape` also closes it while latched
- [ ] Toggle `Manual close` off while a toolbar is open → it stops staying open immediately

### Form integration (Preview)
- [ ] Wrap in `ww-form-container`, set **Field name**, submit → the HTML arrives under
      that name
- [ ] Reset the form → **the visible content returns to Initial value**, not just the variable
- [ ] After a reset, active-state buttons are **not** stuck showing the old formatting
- [ ] Outside a form, the Field name / Custom validation / Validation settings stay hidden

### States (Canvas + Preview)
- [ ] The state picker offers **focus** and **readonly**
- [ ] Style the `readonly` state, then turn **Read only** on → the style applies
- [ ] Turning **Editable** off also activates the `readonly` state
- [ ] Style the `focus` state → it applies when the editor is focused in Preview
- [ ] The `readonly` state is **not** permanently on while designing on the canvas

### Exposed state (Preview)
- [ ] Bind a text element to `context.local.data?.['richText']?.isBold` → it flips live
      as you select bold vs plain text
- [ ] Same through `variables['<editorUid>-state']?.isBold`

---

## D. Core editing (Preview)

- [ ] Bold, italic, underline, strikethrough, inline code, code block
- [ ] H1–H6, and back to paragraph
- [ ] Bullet list, ordered list, blockquote
- [ ] Text color, font family, link add/remove, clear formatting
- [ ] `Initial value` bound to a variable → changing it reloads the content
- [ ] `Editable` off → cannot type; `Read only` on → cannot type (overrides Editable)
- [ ] `Autofocus` on → cursor starts in the editor
- [ ] `Debounce` on at 1000ms → `On change` fires once after typing stops

## E. Toolbar positioning (Preview)

- [ ] Vertical position `Above` / `Below`
- [ ] Horizontal position `Left` / `Center` / `Right`
- [ ] `Menu offset X` / `Menu offset Y`, including negative values
- [ ] **Auto flip:** select text at the very top of the page with `Above` → flips below
- [ ] **Flip from an anchor:** set Horizontal `Right`, select text near the right edge →
      it recovers instead of staying overflowed
- [ ] **Offset doesn't over-flip:** `Menu offset Y` = `20px` with `Above`, selection
      mid-page → it must **not** flip
- [ ] `Auto flip` off → stays on the chosen side even when clipped
- [ ] Appear animation: subtle scale-from-centre + fade, **one box only** (no second
      shadowed rectangle behind it)

## F. Styling

### Editor box
- [ ] Base font / size / color, background, padding, min height, border, radius
- [ ] Placeholder color

### Per element type
- [ ] Set H1 size + color, Quote color, Lists spacing → each affects only its own type
- [ ] Labels read `Font`, `Size`, `Weight`… with no repeated type-name prefix
- [ ] Hovering a property label shows a help tooltip

### Quote
- [ ] **Bar** — change width / style / color; set it to `none` → the bar disappears
- [ ] **Background** — fills the whole quote block
- [ ] **Padding** — the **left** value changes the gap between the bar and the text
- [ ] **Margin left / right** — default 40px; set to 0 → the quote aligns with body text

### Code
- [ ] **Block padding** affects code blocks only
- [ ] **Inline padding** affects inline code only
- [ ] **Background** applies to both, with **no doubled background** inside a code block
      (the block paints it once, not the inner element too)
- [ ] Code font / size / weight / color affect **both** block and inline

### Link
- [ ] A link stays **inline** — it must not break onto its own line
- [ ] **Text decoration**: `underline` / `none` / `line-through` / `overline`
- [ ] Link color

## G. Accessibility (Preview + devtools)

- [ ] Inspect the editable div: `role="textbox"`, `aria-multiline="true"`, and
      `aria-label` matching **Accessible label**
- [ ] **Clear** `Accessible label` → `aria-label` falls back to `Field name`, or to the
      element's name in the tree — never blank
- [ ] Turn Read only on → `aria-readonly="true"`; toggle back → `"false"`
- [ ] Tab to the editor → **visible focus ring**; click with the mouse → **no ring**
- [ ] Change `Focus ring color` → the ring updates
- [ ] Select text and press **`Alt+F10`** → focus moves into the toolbar, which stays open
- [ ] **`Escape`** from inside the toolbar → closes it, caret returns to the editor
- [ ] **`Escape`** while editing with the toolbar open → dismisses it
- [ ] Re-select text after dismissing → the toolbar returns

## H. Events

- [ ] `On change` — fires with the HTML
- [ ] `On init value change` — fires when the bound initial value changes
- [ ] `On focus` / `On blur`
- [ ] `On selection change` — carries the selected text

## I. Regression suite

Bugs already found and fixed — confirm they stay fixed.

- [ ] **Toolbar returns after formatting**: apply bold → toolbar closes → re-select the
      same text → it reappears, *every time* (this used to fail intermittently)
- [ ] **No toolbar without a selection**: click into the editor without selecting, and
      click away after selecting → the toolbar must **never** appear parked in the
      page's top-left corner
- [ ] **No stale state after a reset**: bold some text, reset the form or change Initial
      value → active-state buttons are not stuck on
- [ ] **Canvas is read-only**: you cannot type on the canvas, but you can in Preview
- [ ] **`Force open floating toolbar`** off → the toolbar only appears on selection, even
      on the canvas
- [ ] **`closeToolbar`** action hides the toolbar; the next selection brings it back
- [ ] **`Cmd/Ctrl+E`** applies inline code *(expected TipTap shortcut, not a bug)*

## J. Performance

- [ ] Type a long paragraph quickly → no lag
- [ ] With an element bound to `state.isBold`, type continuously → no thrashing
      (identical snapshots are suppressed)

---

## K. Expected behaviour — not bugs

- **`ww-div` toolbar buttons are not keyboard focusable.** `Alt+F10` focuses the toolbar
  container and arrow keys do nothing. Use `ww-button` (or set `tabindex`) if keyboard
  access matters.
- **The canvas editor is read-only** by design — canvas typing is never saved.
- **`focus-visible` is not offered as a state**; it isn't in WeWeb's state vocabulary, so
  the keyboard-only ring is handled in CSS.
- **The quote bar has an explicit color**, so it no longer follows the quote text color
  unless you set it to match.
- **Default colors changed** to meet WCAG AA — placeholder `#6b7280` (4.8:1) and editor
  border `#878e9c` (3.3:1).
