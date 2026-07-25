<template>
    <div ref="wrapperEl" class="jp-rte" :class="{ '-readonly': isReadonly }" :style="rootStyle" data-capture>
        <!-- Editor surface: TipTap mounts into this element -->
        <div ref="editorEl" class="jp-rte__surface"></div>

        <!-- Floating selection menu = dropzone the user fills with their own buttons.
             Teleported to the page root at runtime so ancestor `overflow: hidden`
             cannot clip it and it is not trapped in a parent stacking context. -->
        <Teleport :to="teleportTo" :disabled="teleportDisabled">
            <div
                v-if="showMenu"
                ref="menuEl"
                class="jp-rte__menu"
                :style="menuStyle"
                role="toolbar"
                :aria-label="toolbarLabel"
                tabindex="-1"
                @keydown="onMenuKeydown"
                @pointerdown="onMenuPointerDown"
                @focusin="onMenuFocusIn"
                @focusout="onMenuFocusOut"
            >
                <wwLayout path="toolbarContent" direction="row" class="jp-rte__menu-layout" />
            </div>
        </Teleport>
    </div>
</template>

<script>
import { computed, inject, ref, shallowRef, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
// TipTap 3 ships Color and FontFamily inside the text-style package (the old
// standalone packages are now re-export shims), and the utility extensions —
// Placeholder among them — inside @tiptap/extensions.
import { TextStyle, Color, FontFamily } from '@tiptap/extension-text-style';
import { Placeholder } from '@tiptap/extensions';
import { CONTENT_TYPES, TYPO_FIELDS } from './settings';

export default {
    props: {
        content: { type: Object, required: true },
        uid: { type: String, required: true },
        wwElementState: { type: Object, required: true },
        /* wwEditor:start */
        wwEditorState: { type: Object, required: false },
        /* wwEditor:end */
    },
    emits: ['trigger-event', 'add-state', 'remove-state'],
    setup(props, { emit }) {
        const wrapperEl = ref(null);
        const editorEl = ref(null);
        const menuEl = ref(null);
        const editorInstance = shallowRef(null);
        const debounceTimeout = ref(null);
        const blurTimeout = ref(null);

        // Reactive mirror of the editor's formatting state (read by NoCode buttons).
        const editorState = ref({});
        const selectedText = ref('');
        const hasSelection = ref(false);
        const isFocused = ref(false);
        // True while keyboard focus sits inside the floating toolbar. The editor is
        // blurred at that point, so without this the menu would unmount from under
        // the very button the user just focused.
        const isMenuFocused = ref(false);
        // Latched open: with `Manual close` the toolbar stays visible once it has
        // appeared, so a dropdown that renders its panel at the page root (moving
        // focus out of the toolbar) doesn't dismiss it. The latch survives focus
        // leaving, but not the user clicking away — see onDocumentPointerDown.
        const menuLatched = ref(false);
        // Whether focus entered the toolbar via the keyboard (Alt+F10) rather than a
        // pointer. Keyboard focus must hold the toolbar open unconditionally; pointer
        // focus must not, or clicking the toolbar would keep it alive on its own and
        // Manual close off would behave exactly like Manual close on.
        const menuFocusFromKeyboard = ref(false);
        // Local-context data (context.local.data['richText']). Kept as a ref and
        // reassigned explicitly on every state change — a lazy `computed` was not
        // re-tracked reliably by the dropzone bindings, so it looked frozen.
        const localData = ref({});
        // Manual dismiss (via the closeToolbar action); reset on the next selection change.
        const menuDismissed = ref(false);
        // Selection geometry: edges relative to the wrapper (for absolute positioning)
        // plus raw viewport coords (for fixed positioning and flip detection).
        const selectionRect = ref(null);
        const resolvedPlacement = ref({ vertical: 'top', horizontal: 'center' });
        // True when the selection has scrolled out of view. While teleported the menu
        // is fixed, so it would otherwise hover over unrelated content.
        const isSelectionOffscreen = ref(false);

        /* wwEditor:start */
        const isEditing = computed(() => props?.wwEditorState?.isEditing ?? false);
        /* wwEditor:end */

        // ---- Teleport target ----
        // Resolved through wwLib rather than a "body" selector string: a selector is
        // resolved against the wrong document in the editor realm.
        const teleportRoot = ref(null);
        const teleportTo = computed(() => teleportRoot.value || 'body');
        const teleportDisabled = computed(() => {
            if (!teleportRoot.value) return true;
            /* wwEditor:start */
            // Keep the menu inside the component on the editor canvas so WeWeb's
            // drag & drop and selection overlays keep working on the dropzone.
            if (isEditing.value) return true;
            /* wwEditor:end */
            return false;
        });

        // ---- Value exposure (HTML) as internal variable ----
        const { value: variableValue, setValue } = wwLib.wwVariable.useComponentVariable({
            uid: props.uid,
            name: 'value',
            type: 'string',
            defaultValue: computed(() => String(props.content?.initialValue ?? '')),
        });

        // ---- Form integration ----
        // Registers the field with a parent ww-form-container so its value is
        // submitted, validated and reset with the form. The injections fall back to
        // no-ops, so the component works exactly as before outside a form.
        /* wwEditor:start */
        const selectForm = inject('_wwForm:selectForm', () => {});
        /* wwEditor:end */

        // The form resets a field by calling setValue. The raw variable setter would
        // leave the editor still showing the old content, so push it into TipTap too.
        const setFormValue = html => {
            const next = html ?? '';
            setValue(next);
            const editor = editorInstance.value;
            if (editor && next !== editor.getHTML()) {
                editor.commands.setContent(next, { emitUpdate: false });
                // setContent suppresses the update event, so re-sync explicitly or
                // the exposed formatting state keeps describing the replaced content.
                refreshState();
            }
        };

        const useForm = inject('_wwForm:useForm', () => {});
        useForm(
            variableValue,
            {
                fieldName: computed(() => props.content?.fieldName || props.wwElementState?.name),
                validation: computed(() => props.content?.validation),
                customValidation: computed(() => props.content?.customValidation),
                initialValue: computed(() => props.content?.initialValue ?? ''),
            },
            {
                elementState: props.wwElementState,
                emit,
                sidepanelFormPath: 'form',
                setValue: setFormValue,
            }
        );

        // Live formatting state of the current selection, exposed as a component
        // variable so toolbar buttons can drive an "active" state, e.g.
        // variables['<uid>-state']?.isBold. Globally bindable (unlike local context).
        const { setValue: setStateVar } = wwLib.wwVariable.useComponentVariable({
            uid: props.uid,
            name: 'state',
            type: 'object',
            defaultValue: {},
        });

        // Single source of truth for the exposed selection state. Pushes the same
        // snapshot into BOTH the local context (ref) and the `state` variable so
        // they always update together, on every selection / formatting change.
        // Non-reactive sentinel: guards against publishing an identical snapshot,
        // which would hand every binding a new object identity on each keystroke.
        let lastSnapshotKey = '';
        const syncExposed = () => {
            // No `html` here on purpose: the content lives in the `value` variable.
            // Duplicating it would lag behind whenever debounce is on, and would
            // republish this snapshot on every keystroke.
            const snapshot = {
                ...editorState.value,
                hasSelection: hasSelection.value,
                selectedText: selectedText.value,
                isEmpty: !!editorInstance.value?.isEmpty,
            };
            // Flat object of primitives — a stable serialization is a cheap and
            // reliable equality check.
            const key = JSON.stringify(snapshot);
            if (key === lastSnapshotKey) return;
            lastSnapshotKey = key;
            localData.value = snapshot;
            setStateVar(snapshot);
        };

        // ---- Editable / readonly (editor state overrides content) ----
        const isReadonly = computed(() => {
            const override = props.wwElementState?.props?.readonly;
            return override === undefined ? !!props.content?.readonly : !!override;
        });
        const isEditable = computed(() => {
            /* wwEditor:start */
            // Never editable on the editor canvas: typing there is never persisted
            // back to `initialValue`, so it would silently be lost on reload.
            // Preview mode (isEditing === false) edits normally.
            if (isEditing.value) return false;
            /* wwEditor:end */
            const override = props.wwElementState?.props?.editable;
            const editable = override === undefined ? props.content?.editable !== false : !!override;
            return editable && !isReadonly.value;
        });

        // Drives the `readonly` WeWeb state. Uses the author's intent only — the
        // editor-canvas read-only override is deliberately excluded, or the state
        // would be pinned on the whole time you are designing.
        const isReadonlyState = computed(() => {
            if (isReadonly.value) return true;
            const override = props.wwElementState?.props?.editable;
            return override === undefined ? props.content?.editable === false : !override;
        });

        // WeWeb states on coded components are emit-driven: declaring them in
        // ww-config only makes them selectable, the component has to announce when
        // each one is active or the per-state styles never apply.
        watch(
            isReadonlyState,
            active => emit(active ? 'add-state' : 'remove-state', 'readonly'),
            { immediate: true }
        );
        watch(
            isFocused,
            active => emit(active ? 'add-state' : 'remove-state', 'focus'),
            { immediate: true }
        );

        const debounceDelay = computed(() => {
            const parsed = wwLib.wwUtils.getLengthUnit(props.content?.debounceDelay || '400ms');
            return Array.isArray(parsed) ? parsed[0] : 400;
        });

        // ---- Menu visibility & position ----
        const showMenu = computed(() => {
            // The author drives the editor from their own toolbar elsewhere on the page,
            // so there is no floating one to show — on the canvas either, where it would
            // only get in the way of a layout that does not use it. Checked before
            // force-open so it also wins there.
            if (props.content?.hideToolbar) return false;
            if (menuDismissed.value) return false;
            let forceOpen = false;
            /* wwEditor:start */
            forceOpen = isEditing.value && props.content?.forceOpenMenu !== false;
            /* wwEditor:end */
            if (forceOpen) return true;
            if (!isEditable.value) return false;
            // No selection, or no anchor to position against, means there is nothing
            // to format and nowhere to put the toolbar. The corner fallback in
            // menuStyle exists only for the force-open editor canvas, so never reach
            // it at runtime — not even while latched.
            if (!hasSelection.value || !selectionRect.value) return false;
            // Still hide when the selection scrolls away — the toolbar is anchored to
            // it, so staying open would leave it floating over unrelated content.
            if (isSelectionOffscreen.value) return false;
            // Latched only waives the focus requirement, never the selection one.
            if (menuLatched.value && props.content?.manualClose) return true;
            // Focus inside the toolbar keeps it open when it arrived by keyboard
            // (Alt+F10 relies on this) or when Manual close is on. A plain click must
            // not hold it open by itself — the editor regaining focus is what keeps
            // the toolbar alive for ordinary buttons.
            const heldByMenu =
                isMenuFocused.value &&
                (menuFocusFromKeyboard.value || !!props.content?.manualClose);
            return isFocused.value || heldByMenu;
        });

        // Accessible name: the property wins, but if it is cleared we still derive
        // something meaningful rather than falling straight to a generic string —
        // the author already named this field as the form field and in the element
        // tree (same precedence the form integration uses).
        const accessibleName = computed(
            () =>
                props.content?.ariaLabel?.trim() ||
                props.content?.fieldName?.trim() ||
                props.wwElementState?.name ||
                'Rich text editor'
        );
        const toolbarLabel = computed(() => props.content?.toolbarLabel?.trim() || 'Text formatting');

        // Drop the latch as soon as there is no selection left to format.
        watch(hasSelection, has => {
            if (!has) menuLatched.value = false;
        });

        // Latch on the natural open condition rather than on showMenu itself, to
        // avoid feeding a computed back into its own dependency.
        watch(
            () =>
                isEditable.value &&
                hasSelection.value &&
                (isFocused.value || isMenuFocused.value),
            open => {
                if (open && props.content?.manualClose) menuLatched.value = true;
            }
        );

        const MENU_GAP = 8; // inherent spacing between selection and menu

        // The menu's own CSS variables. These MUST live on the menu element itself,
        // not on the component root: once teleported the menu is no longer a DOM
        // descendant, so inherited custom properties would silently fall back to
        // their defaults and every menu styling property would stop applying.
        const menuVars = computed(() => ({
            '--rt-menu-bg': props.content?.menuBackground || '#111827',
            '--rt-menu-border': props.content?.menuBorder || 'none',
            '--rt-menu-radius': props.content?.menuBorderRadius || '8px',
            '--rt-menu-padding': props.content?.menuPadding || '6px',
            '--rt-menu-gap': props.content?.menuGap || '4px',
            '--rt-menu-shadow': props.content?.menuShadow || '0px 8px 24px 0px rgba(0,0,0,0.24)',
        }));

        const menuStyle = computed(() => {
            const offsetX = props.content?.menuOffsetX || '0px';
            const offsetY = props.content?.menuOffsetY || '0px';
            const teleported = !teleportDisabled.value;
            const base = {
                ...menuVars.value,
                // Teleported to the page root → fixed, positioned in viewport space.
                // Left in place (editor canvas) → absolute inside the component.
                position: teleported ? 'fixed' : 'absolute',
                zIndex: props.content?.menuZIndex ?? 1000,
            };
            const rect = selectionRect.value;
            if (!rect) {
                // Fallback (e.g. editor mode with no live selection): pin near the top-left.
                return { ...base, left: '8px', top: '8px', transform: `translate(${offsetX}, ${offsetY})` };
            }
            const { vertical, horizontal } = resolvedPlacement.value;

            // Same anchors in either space: viewport coords when fixed, wrapper-relative
            // coords when absolute.
            const edgeLeft = teleported ? rect.vLeft : rect.left;
            const edgeRight = teleported ? rect.vRight : rect.right;
            const edgeCenterX = teleported ? rect.vCenterX : rect.centerX;
            const edgeTop = teleported ? rect.vTop : rect.top;
            const edgeBottom = teleported ? rect.vBottom : rect.bottom;

            // Horizontal anchor + translate
            const left =
                horizontal === 'left' ? edgeLeft : horizontal === 'right' ? edgeRight : edgeCenterX;
            const tx = horizontal === 'left' ? '0' : horizontal === 'right' ? '-100%' : '-50%';

            // Vertical anchor + translate (menu sits above or below the selection)
            const top = vertical === 'bottom' ? edgeBottom : edgeTop;
            const ty =
                vertical === 'bottom' ? `calc(0% + ${MENU_GAP}px)` : `calc(-100% - ${MENU_GAP}px)`;

            return {
                ...base,
                left: `${left}px`,
                top: `${top}px`,
                transform: `translate(${tx}, ${ty}) translate(${offsetX}, ${offsetY})`,
            };
        });

        // ---- Styling: map content props to CSS variables ----
        const rootStyle = computed(() => {
            const style = {
                '--rt-font-family': props.content?.editorFontFamily || 'inherit',
                '--rt-font-size': props.content?.editorFontSize || '16px',
                '--rt-color': props.content?.editorColor || '#1f2937',
                '--rt-placeholder-color': props.content?.placeholderColor || '#6b7280',
                '--rt-code-bg': props.content?.codeBackground || '#f3f4f6',
                '--rt-code-block-padding': props.content?.codeBlockPadding || '0.75em 1em',
                '--rt-code-inline-padding': props.content?.codeInlinePadding || '0.1em 0.3em',
                '--rt-link-decoration': props.content?.linkTextDecoration || 'underline',
                '--rt-quote-bar': props.content?.blockquoteBar || '3px solid #6b7280',
                '--rt-quote-bg': props.content?.blockquoteBackground || 'transparent',
                '--rt-quote-padding': props.content?.blockquotePadding || '0px 0px 0px 1em',
                '--rt-quote-margin-inline-start': props.content?.blockquoteMarginLeft || '40px',
                '--rt-quote-margin-inline-end': props.content?.blockquoteMarginRight || '40px',
                // Menu variables intentionally live on the menu element (see menuVars).
            };
            // Per-element-type typography variables (e.g. --rt-h1-font-size).
            for (const { prefix } of CONTENT_TYPES) {
                for (const { suffix, css } of TYPO_FIELDS) {
                    const val = props.content?.[`${prefix}${suffix}`];
                    if (val !== undefined && val !== null && val !== '') {
                        style[`--rt-${prefix}-${css}`] = val;
                    }
                }
            }
            return style;
        });

        // ---- Editor helpers ----
        const refreshSelectionAnchor = () => {
            const editor = editorInstance.value;
            const wrapper = wrapperEl.value;
            if (!editor || !wrapper || typeof wrapper.getBoundingClientRect !== 'function') return;
            // Derive focus from the editor itself so it never gets stuck out of
            // sync with a stale blur timer (fixes the menu not reopening on reselect).
            isFocused.value = !!editor.isFocused;
            const { from, to, empty } = editor.state.selection;
            selectedText.value = empty ? '' : editor.state.doc.textBetween(from, to, ' ');
            hasSelection.value = !empty;
            syncExposed();
            if (empty) {
                selectionRect.value = null;
                isSelectionOffscreen.value = false;
                return;
            }
            try {
                const start = editor.view.coordsAtPos(from);
                const end = editor.view.coordsAtPos(to);
                const box = wrapper.getBoundingClientRect();
                // Viewport-space selection box (start/end may span lines).
                const vTop = Math.min(start.top, end.top);
                const vBottom = Math.max(start.bottom, end.bottom);
                const vLeft = Math.min(start.left, end.left);
                const vRight = Math.max(start.right, end.right);
                selectionRect.value = {
                    // wrapper-relative anchors
                    left: vLeft - box.left,
                    right: vRight - box.left,
                    centerX: (vLeft + vRight) / 2 - box.left,
                    top: vTop - box.top,
                    bottom: vBottom - box.top,
                    // viewport coords for space detection
                    vTop,
                    vBottom,
                    vLeft,
                    vRight,
                    vCenterX: (vLeft + vRight) / 2,
                };
                // Scrolled out of view: a fixed menu would hover over unrelated content.
                const win = wwLib.getFrontWindow();
                isSelectionOffscreen.value = win
                    ? vBottom < 0 || vTop > win.innerHeight || vRight < 0 || vLeft > win.innerWidth
                    : false;
                resolvePlacement();
            } catch (e) {
                selectionRect.value = null;
                isSelectionOffscreen.value = false;
            }
        };

        const parsePx = value => {
            const n = parseFloat(value);
            return Number.isFinite(n) ? n : 0;
        };

        // A fixed menu does not scroll with the content, so recompute its anchor on
        // scroll and resize. Coalesced through rAF: scroll fires far more often than
        // we need to reposition.
        let repositionFrame = null;
        const scheduleReposition = () => {
            const win = wwLib.getFrontWindow();
            if (!win || repositionFrame !== null) return;
            repositionFrame = win.requestAnimationFrame(() => {
                repositionFrame = null;
                if (showMenu.value || hasSelection.value) refreshSelectionAnchor();
            });
        };

        // Decide the effective side, flipping to the opposite side when the menu
        // would overflow the viewport (if auto-flip is enabled). Reads the rendered
        // menu size, so it must run after the menu is in the DOM.
        const resolvePlacement = () => {
            const rect = selectionRect.value;
            const win = wwLib.getFrontWindow();
            if (!rect || !win) return;

            const desiredV = props.content?.menuVerticalPosition === 'bottom' ? 'bottom' : 'top';
            const desiredH = ['left', 'center', 'right'].includes(props.content?.menuHorizontalPosition)
                ? props.content.menuHorizontalPosition
                : 'center';

            if (props.content?.menuAutoFlip === false) {
                resolvedPlacement.value = { vertical: desiredV, horizontal: desiredH };
                return;
            }

            const menu = menuEl.value;
            const mh = menu?.offsetHeight || 40;
            const mw = menu?.offsetWidth || 160;
            const nudgeX = parsePx(props.content?.menuOffsetX);
            const nudgeY = parsePx(props.content?.menuOffsetY);

            // Vertical flip. A positive offsetY shifts the menu down, so it needs
            // that much less room above and that much more below (and vice versa).
            // Using the absolute offset here would inflate both sides and flip the
            // menu even when the nudge moved it toward the available space.
            let vertical = desiredV;
            const needAbove = mh + MENU_GAP - nudgeY;
            const needBelow = mh + MENU_GAP + nudgeY;
            const spaceAbove = rect.vTop;
            const spaceBelow = win.innerHeight - rect.vBottom;
            if (vertical === 'top' && spaceAbove < needAbove && spaceBelow > spaceAbove) vertical = 'bottom';
            else if (vertical === 'bottom' && spaceBelow < needBelow && spaceAbove > spaceBelow)
                vertical = 'top';

            // Horizontal flip (predict the menu's viewport edges for a given anchor)
            let horizontal = desiredH;
            const edgesFor = h => {
                const anchor = h === 'left' ? rect.vLeft : h === 'right' ? rect.vRight : rect.vCenterX;
                const l = (h === 'left' ? anchor : h === 'right' ? anchor - mw : anchor - mw / 2) + nudgeX;
                return { l, r: l + mw };
            };
            const fits = edges => edges.l >= 0 && edges.r <= win.innerWidth;

            const chosen = edgesFor(horizontal);
            if (!fits(chosen)) {
                // Fall back through the remaining anchors, starting from the side
                // that pulls the menu back into view. Trying every alternative is
                // what lets an already left/right-anchored menu recover — anchoring
                // it to the same side again would be a no-op.
                const order =
                    chosen.r > win.innerWidth ? ['right', 'center', 'left'] : ['left', 'center', 'right'];
                const better = order.find(h => h !== horizontal && fits(edgesFor(h)));
                if (better) horizontal = better;
            }

            resolvedPlacement.value = { vertical, horizontal };
        };

        const refreshState = () => {
            const editor = editorInstance.value;
            if (!editor) return;
            const textStyle = editor.getAttributes('textStyle') || {};
            editorState.value = {
                isBold: editor.isActive('bold'),
                isItalic: editor.isActive('italic'),
                isUnderline: editor.isActive('underline'),
                isStrike: editor.isActive('strike'),
                isCode: editor.isActive('code'),
                isCodeBlock: editor.isActive('codeBlock'),
                isBulletList: editor.isActive('bulletList'),
                isOrderedList: editor.isActive('orderedList'),
                isBlockquote: editor.isActive('blockquote'),
                isLink: editor.isActive('link'),
                currentHeadingLevel:
                    [1, 2, 3, 4, 5, 6].find(level => editor.isActive('heading', { level })) || 0,
                currentColor: textStyle.color || null,
                currentFontFamily: textStyle.fontFamily || null,
                linkHref: editor.getAttributes('link')?.href || null,
            };
            syncExposed();
        };

        const emitChange = html => {
            if (props.content?.debounce) {
                clearTimeout(debounceTimeout.value);
                debounceTimeout.value = setTimeout(() => {
                    setValue(html);
                    emit('trigger-event', { name: 'change', event: { value: html } });
                }, debounceDelay.value);
            } else {
                setValue(html);
                emit('trigger-event', { name: 'change', event: { value: html } });
            }
        };

        // ---- Commands exposed to NoCode buttons ----
        const withChain = fn => {
            const editor = editorInstance.value;
            if (!editor) return;
            fn(editor.chain().focus()).run();
            refreshState();
        };
        const toggleBold = () => withChain(c => c.toggleBold());
        const toggleItalic = () => withChain(c => c.toggleItalic());
        const toggleUnderline = () => withChain(c => c.toggleUnderline());
        const toggleStrike = () => withChain(c => c.toggleStrike());
        const toggleCode = () => withChain(c => c.toggleCode());
        const toggleCodeBlock = () => withChain(c => c.toggleCodeBlock());
        const toggleBulletList = () => withChain(c => c.toggleBulletList());
        const toggleOrderedList = () => withChain(c => c.toggleOrderedList());
        const toggleBlockquote = () => withChain(c => c.toggleBlockquote());
        const setParagraph = () => withChain(c => c.setParagraph());
        const setHeading = level => withChain(c => c.toggleHeading({ level: Number(level) || 1 }));
        const setColor = color => withChain(c => (color ? c.setColor(color) : c.unsetColor()));
        const unsetColor = () => withChain(c => c.unsetColor());
        const setFontFamily = family =>
            withChain(c => (family ? c.setFontFamily(family) : c.unsetFontFamily()));
        const setLink = href =>
            withChain(c =>
                href ? c.extendMarkRange('link').setLink({ href }) : c.extendMarkRange('link').unsetLink()
            );
        const unsetLink = () => withChain(c => c.extendMarkRange('link').unsetLink());
        const clearFormatting = () => withChain(c => c.unsetAllMarks().clearNodes());
        const focus = () => editorInstance.value?.commands.focus();
        const closeToolbar = () => {
            menuDismissed.value = true;
            menuLatched.value = false;
        };

        // ---- Accessibility ----
        // ProseMirror renders a bare contenteditable div: no name, and no role that
        // assistive tech can rely on. Set them on the editable node itself.
        const syncA11yAttributes = () => {
            const dom = editorInstance.value?.view?.dom;
            if (!dom || typeof dom.setAttribute !== 'function') return;
            dom.setAttribute('role', 'textbox');
            dom.setAttribute('aria-multiline', 'true');
            dom.setAttribute('aria-label', accessibleName.value);
            dom.setAttribute('aria-readonly', isEditable.value ? 'false' : 'true');
        };

        // Focusable children of the toolbar, in DOM order.
        const toolbarFocusables = () => {
            const menu = menuEl.value;
            if (!menu || typeof menu.querySelectorAll !== 'function') return [];
            return Array.from(
                menu.querySelectorAll(
                    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
                )
            );
        };

        // Move focus into the toolbar (Alt+F10, the convention used by editors like
        // TinyMCE and CKEditor). Falls back to the container, which is focusable via
        // tabindex="-1", so the toolbar is still announced when the buttons the user
        // dropped are not focusable themselves.
        const focusToolbar = () => {
            if (!showMenu.value) return false;
            const [first] = toolbarFocusables();
            const target = first || menuEl.value;
            if (!target || typeof target.focus !== 'function') return false;
            isMenuFocused.value = true;
            menuFocusFromKeyboard.value = true;
            target.focus();
            return true;
        };

        // Leave the toolbar: hide it and put the caret back where it was.
        const dismissToolbar = () => {
            menuDismissed.value = true;
            menuLatched.value = false;
            isMenuFocused.value = false;
            menuFocusFromKeyboard.value = false;
            editorInstance.value?.commands.focus();
        };

        const onMenuFocusIn = () => {
            isMenuFocused.value = true;
        };

        // Fires before focusin, so the origin is already correct by the time
        // showMenu re-evaluates.
        const onMenuPointerDown = () => {
            menuFocusFromKeyboard.value = false;
        };

        // Controls inside the toolbar render their own UI at the page root — a select's
        // listbox, a popover — so a pointer landing there is still the user operating the
        // toolbar, not leaving it. Matched by role rather than by class so it holds for
        // any dropped component, not just WeWeb's select.
        const FLOATING_LAYER_SELECTOR =
            '[role="listbox"], [role="menu"], [role="dialog"], [role="tree"], [role="grid"], [aria-modal="true"]';

        // Duck-typed: the editor evaluates this bundle in a different realm from the
        // canvas DOM, where `instanceof Element` is silently false.
        const containsNode = (container, node) =>
            !!container && typeof container.contains === 'function' && container.contains(node);

        // `Manual close` exists so that interacting with the toolbar cannot dismiss it —
        // not so the toolbar outlives the user's attention. A pointer landing outside the
        // editor, the toolbar and any panel the toolbar opened is the user leaving, so it
        // drops the latch and lets showMenu close as usual.
        const onDocumentPointerDown = event => {
            if (!showMenu.value) return;
            const target = event?.target;
            if (containsNode(menuEl.value, target)) return;
            if (containsNode(editorInstance.value?.view?.dom, target)) return;
            if (typeof target?.closest === 'function' && target.closest(FLOATING_LAYER_SELECTOR)) return;
            menuLatched.value = false;
            isMenuFocused.value = false;
            menuFocusFromKeyboard.value = false;
        };

        // focusout fires before focusin when moving between two buttons, so settle
        // first and then ask whether focus actually left the toolbar.
        const onMenuFocusOut = () => {
            setTimeout(() => {
                const menu = menuEl.value;
                const active = wwLib.getFrontDocument()?.activeElement;
                const stillInside = !!(
                    menu &&
                    active &&
                    typeof menu.contains === 'function' &&
                    menu.contains(active)
                );
                isMenuFocused.value = stillInside;
                if (!stillInside) menuFocusFromKeyboard.value = false;
            }, 0);
        };

        // Roving arrow-key navigation between the dropped buttons, per the toolbar
        // pattern; Escape returns to the editor.
        const onMenuKeydown = event => {
            if (event.key === 'Escape') {
                event.preventDefault();
                dismissToolbar();
                return;
            }
            if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
            const items = toolbarFocusables();
            if (items.length < 2) return;
            const active = wwLib.getFrontDocument()?.activeElement;
            const index = items.indexOf(active);
            if (index === -1) return;
            event.preventDefault();
            const step = event.key === 'ArrowRight' ? 1 : -1;
            const next = items[(index + step + items.length) % items.length];
            if (typeof next?.focus === 'function') next.focus();
        };

        // ---- Local context registration (data updated via syncExposed above) ----

        // Formatting actions are declared in ww-config.js `actions` (with typed
        // args) and exposed to WeWeb by returning them from setup() below. The
        // local context only carries reactive STATE for bindings/formulas.
        const markdown = `### Rich Text Editor
State exposed as \`context.local.data?.['richText']\`:
- \`isEmpty\`, \`hasSelection\`, \`selectedText\` (the HTML content is the \`value\` variable)
- \`isBold\`, \`isItalic\`, \`isUnderline\`, \`isStrike\`, \`isCode\`, \`isCodeBlock\`
- \`isBulletList\`, \`isOrderedList\`, \`isBlockquote\`, \`isLink\`, \`linkHref\`
- \`currentHeadingLevel\` (0 = paragraph), \`currentColor\`, \`currentFontFamily\`

Bind your dropped buttons to the exposed actions (Toggle Bold, Set Heading, …).`;

        wwLib.wwElement.useRegisterElementLocalContext('richText', localData, {}, markdown);

        // ---- Lifecycle ----
        onMounted(() => {
            // Teleport target: the front document's body, never a "body" selector.
            teleportRoot.value = wwLib.getFrontDocument()?.body ?? null;

            const win = wwLib.getFrontWindow();
            // capture: scroll does not bubble, so capturing is what catches scrolling
            // in any ancestor container, not just the page itself.
            win?.addEventListener('scroll', scheduleReposition, { capture: true, passive: true });
            win?.addEventListener('resize', scheduleReposition, { passive: true });
            // capture, so a control that stops propagation cannot keep the toolbar alive.
            wwLib
                .getFrontDocument()
                ?.addEventListener('pointerdown', onDocumentPointerDown, { capture: true });

            editorInstance.value = new Editor({
                element: editorEl.value,
                editable: isEditable.value,
                content: props.content?.initialValue || '',
                extensions: [
                    StarterKit.configure({
                        // Underline and Link are part of StarterKit since TipTap 3, so
                        // they are configured here instead of being registered again —
                        // a second registration under the same name is a duplicate
                        // extension, which TipTap only warns about and whose winning
                        // options are unspecified.
                        link: { openOnClick: false, autolink: false },
                        // Off on purpose: TrailingNode is new in StarterKit 3 and keeps an
                        // empty paragraph after any last block that is not one. That
                        // paragraph is a real node, not a rendering affordance, so it would
                        // add a stray `<p></p>` to the HTML this field submits.
                        trailingNode: false,
                    }),
                    TextStyle,
                    Color,
                    FontFamily,
                    Placeholder.configure({ placeholder: () => props.content?.placeholder || '' }),
                ],
                autofocus: props.content?.autofocus ? 'end' : false,
                editorProps: {
                    handleKeyDown: (_view, event) => {
                        // Alt+F10 moves focus into the toolbar; Escape dismisses it.
                        // Both return true to swallow the key once handled.
                        if (event.altKey && event.key === 'F10') return focusToolbar();
                        if (event.key === 'Escape' && showMenu.value && !menuDismissed.value) {
                            menuDismissed.value = true;
                            menuLatched.value = false;
                            return true;
                        }
                        return false;
                    },
                },
                onUpdate: ({ editor }) => {
                    emitChange(editor.getHTML());
                    refreshState();
                },
                onSelectionUpdate: () => {
                    // A new selection re-enables the menu after a manual close.
                    menuDismissed.value = false;
                    refreshState();
                    refreshSelectionAnchor();
                    emit('trigger-event', { name: 'selectionChange', event: { text: selectedText.value } });
                },
                onFocus: () => {
                    clearTimeout(blurTimeout.value);
                    isFocused.value = true;
                    refreshSelectionAnchor();
                    emit('trigger-event', { name: 'focus', event: {} });
                },
                onBlur: () => {
                    // Delay so a click on a menu button (which blurs the editor, then
                    // re-focuses it via the command) still runs. Only hide if the
                    // editor really lost focus and didn't get it back.
                    clearTimeout(blurTimeout.value);
                    blurTimeout.value = setTimeout(() => {
                        if (!editorInstance.value?.isFocused) isFocused.value = false;
                    }, 150);
                    emit('trigger-event', { name: 'blur', event: {} });
                },
            });
            // Seed the internal value from the initial content.
            setValue(editorInstance.value.getHTML());
            refreshState();
            syncA11yAttributes();
        });

        onBeforeUnmount(() => {
            clearTimeout(debounceTimeout.value);
            clearTimeout(blurTimeout.value);
            const win = wwLib.getFrontWindow();
            win?.removeEventListener('scroll', scheduleReposition, { capture: true });
            win?.removeEventListener('resize', scheduleReposition);
            wwLib
                .getFrontDocument()
                ?.removeEventListener('pointerdown', onDocumentPointerDown, { capture: true });
            if (repositionFrame !== null) win?.cancelAnimationFrame(repositionFrame);
            editorInstance.value?.destroy();
            editorInstance.value = null;
        });

        // ---- Watchers ----
        watch(
            () => props.content?.initialValue,
            newValue => {
                const editor = editorInstance.value;
                if (!editor) return;
                const next = newValue || '';
                if (next !== editor.getHTML()) {
                    editor.commands.setContent(next, { emitUpdate: false });
                    setValue(editor.getHTML());
                    // setContent suppresses the update event, so re-sync explicitly or
                    // the exposed formatting state keeps describing the replaced content.
                    refreshState();
                }
                // Emitted whenever the bound initial value changes, even if the
                // content already matched it — the trigger reports the new source
                // value, not whether the document happened to differ.
                emit('trigger-event', { name: 'initValueChange', event: { value: next } });
            }
        );

        watch(isEditable, value => {
            editorInstance.value?.setEditable(value);
            // setEditable rewrites the node's attributes, so re-apply ours after it.
            syncA11yAttributes();
        });

        watch(accessibleName, syncA11yAttributes);

        watch(
            () => props.content?.placeholder,
            () => {
                const editor = editorInstance.value;
                if (editor) editor.view.dispatch(editor.state.tr);
            }
        );

        // Re-measure/flip once the menu is actually in the DOM, and whenever the
        // positioning props change in the editor.
        watch(
            [
                showMenu,
                selectionRect,
                () => props.content?.menuVerticalPosition,
                () => props.content?.menuHorizontalPosition,
                () => props.content?.menuAutoFlip,
            ],
            () => {
                nextTick(resolvePlacement);
            }
        );

        return {
            wrapperEl,
            editorEl,
            menuEl,
            isReadonly,
            showMenu,
            menuStyle,
            rootStyle,
            teleportTo,
            teleportDisabled,
            toolbarLabel,
            onMenuKeydown,
            onMenuFocusIn,
            onMenuFocusOut,
            onMenuPointerDown,
            // Component actions (declared in ww-config.js `actions`)
            toggleBold,
            toggleItalic,
            toggleUnderline,
            toggleStrike,
            toggleCode,
            toggleCodeBlock,
            toggleBulletList,
            toggleOrderedList,
            toggleBlockquote,
            setParagraph,
            setHeading,
            setColor,
            unsetColor,
            setFontFamily,
            setLink,
            unsetLink,
            clearFormatting,
            focus,
            closeToolbar,
        };
    },
};
</script>

<style lang="scss">
.jp-rte {
    position: relative;
    width: 100%;
    // The box itself — background, padding, border, radius, min height, and the
    // focused look — is the instance's own WeWeb style on this root. The editing
    // surface below just fills it, so clicking anywhere inside puts the caret in.
    flex-direction: column;

    &.-readonly {
        opacity: 0.85;
    }

    &__surface {
        display: flex;
        flex: 1;
        width: 100%;

        .ProseMirror {
            width: 100%;
            flex: 1;
            box-sizing: border-box;
            cursor: text;
            font-family: var(--rt-font-family, inherit);
            font-size: var(--rt-font-size, 16px);
            color: var(--rt-color, #1f2937);

            // No ring of our own: the focus indicator is the instance's `focus`
            // state style (the component emits that state), so a browser outline
            // on this inner element would sit inside — and fight — that box.
            outline: none;

            > * + * {
                margin-top: 0.5em;
            }

            // Placeholder (shown on the empty first block).
            p.is-editor-empty:first-child::before {
                content: attr(data-placeholder);
                float: left;
                height: 0;
                pointer-events: none;
                color: var(--rt-placeholder-color, #6b7280);
            }

            // Top-level paragraphs only. TipTap wraps quote and list-item content in
            // <p>, so an unscoped `p` rule would repaint those with the Paragraph
            // colour/typography and the Quote and Lists settings would never show.
            // Direct children only, so nested paragraphs inherit their container.
            > p {
                font-family: var(--rt-paragraph-font-family, inherit);
                font-size: var(--rt-paragraph-font-size, inherit);
                font-weight: var(--rt-paragraph-font-weight, inherit);
                color: var(--rt-paragraph-color, inherit);
                line-height: var(--rt-paragraph-line-height, 1.5);
                margin-top: var(--rt-paragraph-margin-top, 0);
                margin-bottom: var(--rt-paragraph-margin-bottom, 0);
            }

            // Nested paragraphs now inherit everything, but they would also pick the
            // browser's 1em block margins back up, adding stray gaps inside quotes
            // and list items. Their container owns the spacing instead.
            blockquote p,
            li p {
                margin-top: 0;
                margin-bottom: 0;
            }

            @each $h in h1, h2, h3, h4, h5, h6 {
                #{$h} {
                    font-family: var(--rt-#{$h}-font-family, inherit);
                    font-size: var(--rt-#{$h}-font-size, inherit);
                    font-weight: var(--rt-#{$h}-font-weight, 700);
                    color: var(--rt-#{$h}-color, inherit);
                    line-height: var(--rt-#{$h}-line-height, 1.2);
                    margin-top: var(--rt-#{$h}-margin-top, 0);
                    margin-bottom: var(--rt-#{$h}-margin-bottom, 0);
                }
            }

            blockquote {
                font-family: var(--rt-blockquote-font-family, inherit);
                font-size: var(--rt-blockquote-font-size, inherit);
                font-weight: var(--rt-blockquote-font-weight, inherit);
                color: var(--rt-blockquote-color, #6b7280);
                line-height: var(--rt-blockquote-line-height, 1.5);
                margin-top: var(--rt-blockquote-margin-top, 0);
                margin-bottom: var(--rt-blockquote-margin-bottom, 0);
                // margin-top/bottom above do not touch the UA margin-inline, so
                // without these the browser's 40px would be uncontrollable.
                margin-inline-start: var(--rt-quote-margin-inline-start, 40px);
                margin-inline-end: var(--rt-quote-margin-inline-end, 40px);
                background: var(--rt-quote-bg, transparent);
                padding: var(--rt-quote-padding, 0px 0px 0px 1em);
                // The left padding is what separates the bar from the text.
                border-left: var(--rt-quote-bar, 3px solid #6b7280);
            }

            // Code blocks and inline code share the "Code" style group, so both
            // follow the same font/size/weight/color/background settings.
            pre {
                font-family: var(--rt-code-font-family, ui-monospace, monospace);
                font-size: var(--rt-code-font-size, 0.9em);
                font-weight: var(--rt-code-font-weight, inherit);
                color: var(--rt-code-color, #1f2937);
                line-height: var(--rt-code-line-height, 1.5);
                margin-top: var(--rt-code-margin-top, 0);
                margin-bottom: var(--rt-code-margin-bottom, 0);
                background: var(--rt-code-bg, #f3f4f6);
                border-radius: 6px;
                padding: var(--rt-code-block-padding, 0.75em 1em);
                overflow-x: auto;

                // The block already paints the background; its inner <code> must
                // not paint a second one on top.
                code {
                    background: none;
                    color: inherit;
                    padding: 0;
                }
            }

            code {
                font-family: var(--rt-code-font-family, ui-monospace, monospace);
                font-size: var(--rt-code-font-size, 0.9em);
                font-weight: var(--rt-code-font-weight, inherit);
                color: var(--rt-code-color, #1f2937);
                background: var(--rt-code-bg, #f3f4f6);
                padding: var(--rt-code-inline-padding, 0.1em 0.3em);
                border-radius: 4px;
            }

            ul,
            ol {
                font-family: var(--rt-list-font-family, inherit);
                font-size: var(--rt-list-font-size, inherit);
                font-weight: var(--rt-list-font-weight, inherit);
                color: var(--rt-list-color, inherit);
                line-height: var(--rt-list-line-height, 1.5);
                margin-top: var(--rt-list-margin-top, 0);
                margin-bottom: var(--rt-list-margin-bottom, 0);
                padding-left: 1.4em;
            }

            a {
                // WeWeb's front stylesheet sets a global `a { display: block }`,
                // which would break the line around every link. Restore the inline
                // flow explicitly — this rule out-specifies theirs.
                display: inline;
                font-family: var(--rt-link-font-family, inherit);
                font-weight: var(--rt-link-font-weight, inherit);
                color: var(--rt-link-color, #2563eb);
                text-decoration: var(--rt-link-decoration, underline);
                cursor: pointer;
            }
        }
    }

    // Single floating box. `position` and `z-index` are set inline, since the menu
    // is fixed when teleported to the page root and absolute when left in place.
    // Positioning uses the inline `transform` (translate); the appear animation uses
    // the independent `scale` property so the two never collide. It scales from its
    // own center (default origin).
    //
    // Note these are flat BEM class selectors (`.jp-rte__menu`), not descendants of
    // `.jp-rte`, so the styles still match once the menu is teleported out.
    &__menu {
        display: inline-flex;
        align-items: center;
        gap: var(--rt-menu-gap, 4px);
        padding: var(--rt-menu-padding, 6px);
        background: var(--rt-menu-bg, #111827);
        border: var(--rt-menu-border, none);
        border-radius: var(--rt-menu-radius, 8px);
        box-shadow: var(--rt-menu-shadow, 0px 8px 24px 0px rgba(0, 0, 0, 0.24));
        white-space: nowrap;
        animation: jp-rte-menu-in 150ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    &__menu-layout {
        display: inline-flex;
        align-items: center;
        gap: var(--rt-menu-gap, 4px);
        min-width: 24px;
        min-height: 24px;
    }
}

@keyframes jp-rte-menu-in {
    from {
        opacity: 0;
        scale: 0.9;
    }
    to {
        opacity: 1;
        scale: 1;
    }
}

@media (prefers-reduced-motion: reduce) {
    .jp-rte__menu {
        animation: none;
    }
}
</style>
