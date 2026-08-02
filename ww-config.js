import { typographyGroup, CONTENT_TYPES } from './src/settings';

// Build one typography group of style properties per content element type.
const contentStyleProperties = CONTENT_TYPES.reduce(
    (acc, { prefix, label }) => ({ ...acc, ...typographyGroup(prefix, label) }),
    {}
);

// Build the collapsible side-panel groups for those style properties.
const contentStyleGroups = CONTENT_TYPES.map(({ prefix, label, extras = [] }) => ({
    label,
    isCollapsible: true,
    properties: [
        `${prefix}FontFamily`,
        `${prefix}FontSize`,
        `${prefix}FontWeight`,
        `${prefix}Color`,
        `${prefix}LineHeight`,
        `${prefix}MarginTop`,
        `${prefix}MarginBottom`,
        ...extras,
    ],
}));

const offsetLength = {
    type: 'Length',
    options: {
        unitChoices: [{ value: 'px', label: 'px', min: -500, max: 500 }],
        noRange: true,
    },
    bindable: true,
    responsive: true,
};

export default {
    editor: {
        label: { en: 'Rich Text Editor', fr: 'Éditeur de texte riche' },
        icon: 'text',
        customStylePropertiesOrder: [
            {
                label: 'Editor box',
                isCollapsible: true,
                properties: [
                    'editorFontFamily',
                    'editorFontSize',
                    'editorColor',
                    'placeholderColor',
                    'selectionColor',
                ],
            },
            {
                label: 'Selection menu',
                isCollapsible: true,
                properties: [
                    'menuVerticalPosition',
                    'menuHorizontalPosition',
                    'menuAutoFlip',
                    'menuOffsetX',
                    'menuOffsetY',
                    'menuZIndex',
                ],
            },
            ...contentStyleGroups,
        ],
        customSettingsPropertiesOrder: [
            'initialValue',
            'placeholder',
            'editable',
            'readonly',
            'autofocus',
            'hideToolbar',
            'forceOpenMenu',
            'manualClose',
            'debounce',
            'debounceDelay',
            ['ariaLabel', 'toolbarLabel'],
            'formInfobox',
            ['fieldName', 'customValidation', 'validation'],
        ],
    },
    // Selectable in the editor's state picker, so style properties marked
    // `states: true` can be given per-state values (e.g. a focus ring).
    states: ['focus', 'readonly'],
    properties: {
        // ---- Accessibility ----
        ariaLabel: {
            label: { en: 'Accessible label' },
            type: 'Text',
            section: 'settings',
            defaultValue: 'Rich text editor',
            bindable: true,
            /* wwEditor:start */
            bindingValidation: {
                type: 'string',
                tooltip: 'The name screen readers announce for the editing area.',
            },
            propertyHelp: {
                tooltip: 'Names the editing area for screen readers. Without it the field is announced with no indication of what it is — required when the editor sits in a form.',
            },
            /* wwEditor:end */
        },
        toolbarLabel: {
            label: { en: 'Toolbar accessible label' },
            type: 'Text',
            section: 'settings',
            defaultValue: 'Text formatting',
            bindable: true,
            /* wwEditor:start */
            bindingValidation: {
                type: 'string',
                tooltip: 'The name screen readers announce for the floating toolbar.',
            },
            propertyHelp: {
                tooltip: 'Names the floating toolbar for screen readers. Press Alt+F10 in the editor to move focus into it, Escape to leave.',
            },
            /* wwEditor:end */
        },

        // ---- Settings ----
        initialValue: {
            label: { en: 'Initial value (HTML)', fr: 'Valeur initiale (HTML)' },
            type: 'Textarea',
            section: 'settings',
            defaultValue: '<p>Edit me…</p>',
            bindable: true,
            /* wwEditor:start */
            bindingValidation: {
                type: 'string',
                tooltip: 'HTML string used as the initial content of the editor.',
            },
            propertyHelp: {
                tooltip: 'Content the editor starts with. Changing it reloads the content and fires "On init value change".',
            },
            /* wwEditor:end */
        },
        placeholder: {
            label: { en: 'Placeholder' },
            type: 'Text',
            section: 'settings',
            defaultValue: 'Start writing…',
            bindable: true,
            /* wwEditor:start */
            bindingValidation: { type: 'string', tooltip: 'Text shown while the editor is empty.' },
            propertyHelp: { tooltip: 'Shown in the first empty block, until the user types.' },
            /* wwEditor:end */
        },
        editable: {
            label: { en: 'Editable' },
            type: 'OnOff',
            section: 'settings',
            defaultValue: true,
            bindable: true,
            /* wwEditor:start */
            bindingValidation: { type: 'boolean', tooltip: 'Allow the user to edit the content.' },
            propertyHelp: {
                tooltip: 'Turn off to display the content without letting the user change it. The editor is always read-only on the WeWeb canvas.',
            },
            /* wwEditor:end */
        },
        readonly: {
            label: { en: 'Read only' },
            type: 'OnOff',
            section: 'settings',
            defaultValue: false,
            bindable: true,
            /* wwEditor:start */
            bindingValidation: { type: 'boolean', tooltip: 'Force read-only, overrides Editable.' },
            propertyHelp: { tooltip: 'Takes priority over Editable — useful to lock the field from a formula.' },
            /* wwEditor:end */
        },
        autofocus: {
            label: { en: 'Autofocus' },
            type: 'OnOff',
            section: 'settings',
            defaultValue: false,
            bindable: true,
            /* wwEditor:start */
            bindingValidation: { type: 'boolean', tooltip: 'A boolean value: \n\n`true` or `false`' },
            propertyHelp: { tooltip: 'Place the cursor at the end of the content as soon as the page loads.' },
            /* wwEditor:end */
        },
        hideToolbar: {
            label: { en: 'Hide floating toolbar', fr: 'Masquer la barre flottante' },
            type: 'OnOff',
            section: 'settings',
            defaultValue: false,
            bindable: true,
            /* wwEditor:start */
            bindingValidation: { type: 'boolean', tooltip: 'A boolean value: \n\n`true` or `false`' },
            propertyHelp: {
                tooltip: 'Turn on when you build your own toolbar elsewhere on the page and drive this editor with its actions (Toggle Bold, Set Heading, …) and exposed state. The floating toolbar then never appears — in the editor or at runtime — and Alt+F10 does nothing, since there is nothing to move focus to.',
            },
            /* wwEditor:end */
        },
        forceOpenMenu: {
            label: { en: 'Force open floating toolbar' },
            type: 'OnOff',
            section: 'settings',
            defaultValue: true,
            bindable: true,
            // Pointless while the toolbar is hidden — and misleading, since it looks
            // like it would bring it back.
            hidden: content => !!content?.hideToolbar,
            /* wwEditor:start */
            bindingValidation: {
                type: 'boolean',
                tooltip: 'Editor mode only: keep the floating toolbar open so you can drop and arrange buttons. Has no effect at runtime.',
            },
            propertyHelp: {
                tooltip: 'When ON, the floating selection menu stays open in the WeWeb editor so you can drop elements into it. When OFF, it only appears on text selection, like at runtime.',
            },
            /* wwEditor:end */
        },
        manualClose: {
            label: { en: 'Manual close', fr: 'Fermeture manuelle' },
            type: 'OnOff',
            section: 'settings',
            defaultValue: false,
            bindable: true,
            hidden: content => !!content?.hideToolbar,
            /* wwEditor:start */
            bindingValidation: { type: 'boolean', tooltip: 'A boolean value: \n\n`true` or `false`' },
            propertyHelp: {
                tooltip: 'Turn on when the toolbar contains a dropdown or popup. Those render their panel at the page root, so focus leaves the toolbar and it would otherwise close as soon as you open them. While on, interacting with the toolbar never dismisses it — close it with the "Close toolbar" action, or Escape. Clicking away from the editor still closes it, as usual.',
            },
            /* wwEditor:end */
        },
        debounce: {
            label: { en: 'Debounce change event' },
            type: 'OnOff',
            section: 'settings',
            defaultValue: false,
            /* wwEditor:start */
            propertyHelp: {
                tooltip: 'Wait until the user stops typing before firing "On change" and updating the value. Useful when the change triggers a save or an API call.',
            },
            /* wwEditor:end */
        },
        debounceDelay: {
            label: { en: 'Debounce delay' },
            type: 'Length',
            section: 'settings',
            options: {
                unitChoices: [{ value: 'ms', label: 'ms', min: 1, max: 5000 }],
                noRange: true,
            },
            defaultValue: '400ms',
            hidden: content => !content?.debounce,
            /* wwEditor:start */
            propertyHelp: { tooltip: 'How long to wait after the last keystroke, in milliseconds.' },
            /* wwEditor:end */
        },

        // ---- Form integration (only surfaced inside a ww-form-container) ----
        form: {
            editorOnly: true,
            hidden: true,
            defaultValue: false,
        },
        /* wwEditor:start */
        formInfobox: {
            type: 'InfoBox',
            section: 'settings',
            options: (_, sidePanelContent) => ({
                variant: sidePanelContent.form?.name ? 'success' : 'warning',
                icon: 'pencil',
                title: sidePanelContent.form?.name || 'Unnamed form',
                content: !sidePanelContent.form?.name && 'Give your form a meaningful name.',
                cta: { label: 'Select form', action: 'selectForm' },
            }),
            hidden: (_, sidePanelContent) => !sidePanelContent.form?.uid,
        },
        /* wwEditor:end */
        fieldName: {
            label: { en: 'Field name' },
            section: 'settings',
            type: 'Text',
            defaultValue: '',
            states: true,
            bindable: true,
            responsive: true,
            /* wwEditor:start */
            bindingValidation: {
                type: 'string',
                tooltip: 'A string value representing the field name for form submission.',
            },
            propertyHelp: { tooltip: 'The name of the field when used in a form submission.' },
            /* wwEditor:end */
            hidden: (_, sidePanelContent) => !sidePanelContent.form?.uid,
        },
        customValidation: {
            label: { en: 'Custom validation' },
            section: 'settings',
            type: 'OnOff',
            defaultValue: false,
            states: true,
            bindable: true,
            responsive: true,
            /* wwEditor:start */
            bindingValidation: { type: 'boolean', tooltip: 'A boolean value: \n\n`true` or `false`' },
            propertyHelp: { tooltip: 'Enable custom validation rules for this form field.' },
            /* wwEditor:end */
            hidden: (_, sidePanelContent) => !sidePanelContent.form?.uid,
        },
        validation: {
            label: { en: 'Validation' },
            section: 'settings',
            type: 'Formula',
            defaultValue: '',
            states: true,
            bindable: false,
            responsive: true,
            hidden: (content, sidePanelContent) =>
                !sidePanelContent.form?.uid || !content.customValidation,
            /* wwEditor:start */
            propertyHelp: {
                tooltip: 'Formula evaluated before the form is submitted. Return true when the field is valid.',
            },
            /* wwEditor:end */
        },

        // ---- Selection menu dropzone (hidden array) ----
        toolbarContent: {
            hidden: true,
            // Seeded with the container that carries the toolbar's look. It is an
            // ordinary dropped element: the user styles, renames or deletes it
            // freely, and drops the buttons inside it. Only new instances get it —
            // WeWeb applies `defaultValue` at creation, so instances already on a
            // page keep theirs.
            // The container arrives UNSTYLED and the user styles it once. Seeding a
            // look is not possible: `type` and `name` are honoured, styles are not.
            // Tried and rejected — `style: { default: {…} }` at the top level (the
            // element's own stored shape) and `state: { style: { default: {…} } }`
            // (what the native elements in weweb-assets ship). Both leave the created
            // element at `style: { default: {} }`, confirmed by reading it back with
            // getPageElementsByUid. Don't spend another round on a fourth spelling.
            defaultValue: [
                {
                    isWwObject: true,
                    type: 'ww-flexbox',
                    name: 'Toolbar container',
                },
            ],
            /* wwEditor:start */
            bindingValidation: {
                type: 'array',
                tooltip: 'Elements dropped into the floating selection menu.',
            },
            /* wwEditor:end */
        },

        // ---- Editor box style ----
        editorFontFamily: {
            label: { en: 'Base font' },
            type: 'FontFamily',
            section: 'style',
            bindable: true,
            responsive: true,
            /* wwEditor:start */
            bindingValidation: {
                cssSupports: 'font-family',
                type: 'string',
                tooltip: 'Font family, e.g. `"Inter, sans-serif"`.',
            },
            propertyHelp: {
                tooltip: 'Default font for the whole editor. Each element type can override it in its own group.',
            },
            /* wwEditor:end */
        },
        editorFontSize: {
            label: { en: 'Base font size' },
            type: 'Length',
            section: 'style',
            options: { unitChoices: [{ value: 'px', label: 'px', min: 8, max: 72 }], noRange: true },
            defaultValue: '16px',
            bindable: true,
            responsive: true,
            /* wwEditor:start */
            bindingValidation: {
                cssSupports: 'font-size',
                type: 'string',
                tooltip: 'A CSS size with a unit: `"16px"` | `"1rem"`.',
            },
            propertyHelp: {
                tooltip: 'Default text size. Element types with their own Size setting override it.',
            },
            /* wwEditor:end */
        },
        editorColor: {
            label: { en: 'Base text color' },
            type: 'Color',
            section: 'style',
            defaultValue: '#1f2937',
            bindable: true,
            responsive: true,
            states: true,
            classes: true,
            /* wwEditor:start */
            bindingValidation: { cssSupports: 'color', type: 'string', tooltip: 'A CSS color.' },
            propertyHelp: { tooltip: 'Default text color for content without a per-type color.' },
            /* wwEditor:end */
        },
        // Background, padding, min height, border, radius and the focus ring are
        // deliberately NOT properties: they belong to the box, which is the
        // instance's own WeWeb style (including its per-state values).
        placeholderColor: {
            label: { en: 'Placeholder color' },
            type: 'Color',
            section: 'style',
            defaultValue: '#6b7280',
            bindable: true,
            responsive: true,
            states: true,
            classes: true,
            /* wwEditor:start */
            bindingValidation: { cssSupports: 'color', type: 'string', tooltip: 'A CSS color.' },
            propertyHelp: { tooltip: 'Color of the placeholder text shown while the editor is empty.' },
            /* wwEditor:end */
        },
        selectionColor: {
            label: { en: 'Unfocused selection' },
            type: 'Color',
            section: 'style',
            defaultValue: 'rgba(100, 116, 139, 0.3)',
            bindable: true,
            responsive: true,
            states: true,
            classes: true,
            /* wwEditor:start */
            bindingValidation: { cssSupports: 'color', type: 'string', tooltip: 'A CSS color.' },
            propertyHelp: {
                tooltip: 'Highlight painted over the selected text while a toolbar control that takes focus — a link dropdown\'s URL field, a color picker — is open and the browser stops drawing its own selection. Keep it muted and translucent: it should read as "still selected, but the keyboard is elsewhere", not compete with the real selection.',
            },
            /* wwEditor:end */
        },

        // ---- Selection menu positioning ----
        menuVerticalPosition: {
            label: { en: 'Vertical position' },
            type: 'TextSelect',
            section: 'style',
            options: {
                options: [
                    { value: 'top', label: { en: 'Above selection' } },
                    { value: 'bottom', label: { en: 'Below selection' } },
                ],
            },
            defaultValue: 'top',
            bindable: true,
            responsive: true,
            /* wwEditor:start */
            bindingValidation: { type: 'string', tooltip: 'Valid values: top | bottom' },
            propertyHelp: { tooltip: 'Which side of the selected text the toolbar opens on.' },
            /* wwEditor:end */
        },
        menuHorizontalPosition: {
            label: { en: 'Horizontal position' },
            type: 'TextSelect',
            section: 'style',
            options: {
                options: [
                    { value: 'left', label: { en: 'Align left' } },
                    { value: 'center', label: { en: 'Center' } },
                    { value: 'right', label: { en: 'Align right' } },
                ],
            },
            defaultValue: 'center',
            bindable: true,
            responsive: true,
            /* wwEditor:start */
            bindingValidation: { type: 'string', tooltip: 'Valid values: left | center | right' },
            propertyHelp: { tooltip: 'How the toolbar aligns horizontally against the selected text.' },
            /* wwEditor:end */
        },
        menuAutoFlip: {
            label: { en: 'Auto flip if no space' },
            type: 'OnOff',
            section: 'style',
            defaultValue: true,
            bindable: true,
            /* wwEditor:start */
            bindingValidation: { type: 'boolean', tooltip: 'Flip the menu to the opposite side when it would overflow the viewport.' },
            propertyHelp: { tooltip: 'When ON, if the menu does not fit in the chosen direction it opens on the opposite side.' },
            /* wwEditor:end */
        },

        // ---- Selection menu placement ----
        // The menu's look — background, border, radius, padding, gap, shadow — is
        // not a property here: it belongs to the container seeded into the
        // `toolbarContent` dropzone, styled like any other WeWeb element.
        menuOffsetX: {
            label: { en: 'Menu offset X' },
            section: 'style',
            defaultValue: '0px',
            ...offsetLength,
            /* wwEditor:start */
            bindingValidation: { type: 'string', tooltip: 'Horizontal offset of the floating menu, e.g. "8px" or "-12px".' },
            propertyHelp: {
                tooltip: 'Nudges the toolbar sideways from its computed position. Negative moves it left.',
            },
            /* wwEditor:end */
        },
        menuOffsetY: {
            label: { en: 'Menu offset Y' },
            section: 'style',
            defaultValue: '0px',
            ...offsetLength,
            /* wwEditor:start */
            bindingValidation: { type: 'string', tooltip: 'Vertical offset of the floating menu, e.g. "-8px".' },
            propertyHelp: {
                tooltip: 'Nudges the toolbar vertically from its computed position. Negative moves it up. Also taken into account when deciding whether to flip sides.',
            },
            /* wwEditor:end */
        },

        menuZIndex: {
            label: { en: 'Menu z-index' },
            type: 'Number',
            section: 'style',
            defaultValue: 1000,
            bindable: true,
            /* wwEditor:start */
            bindingValidation: { type: 'number', tooltip: 'Stacking order of the floating toolbar.' },
            propertyHelp: {
                tooltip: 'The toolbar is rendered at the page root, so this competes with your app-level overlays. Raise it if the toolbar appears behind something.',
            },
            /* wwEditor:end */
        },

        // Shown inside the "Quote" group.
        blockquoteBar: {
            label: { en: 'Bar', fr: 'Barre' },
            type: 'Border',
            section: 'style',
            states: true,
            classes: true,
            bindable: true,
            responsive: true,
            defaultValue: '3px solid #6b7280',
            /* wwEditor:start */
            bindingValidation: {
                cssSupports: 'border',
                type: 'string',
                tooltip: 'A CSS border shorthand: `"3px solid #6b7280"` | `"none"`.',
            },
            propertyHelp: {
                tooltip: 'The vertical bar down the left of a quote. Set it to "none" to remove it.',
            },
            /* wwEditor:end */
        },
        blockquoteBackground: {
            label: { en: 'Background', fr: 'Fond' },
            type: 'Color',
            section: 'style',
            defaultValue: null,
            bindable: true,
            responsive: true,
            options: { nullable: true },
            /* wwEditor:start */
            bindingValidation: {
                cssSupports: 'background-color',
                type: 'string',
                tooltip: 'A CSS color. Leave empty for no background.',
            },
            propertyHelp: { tooltip: 'Background behind the whole quote block.' },
            /* wwEditor:end */
        },
        blockquotePadding: {
            label: { en: 'Padding', fr: 'Marge intérieure' },
            type: 'Spacing',
            section: 'style',
            options: {
                unitChoices: [
                    { value: 'px', label: 'px', min: 0, max: 200 },
                    { value: 'em', label: 'em', min: 0, max: 10 },
                ],
                noRange: true,
                useVar: true,
            },
            defaultValue: '0px 0px 0px 1em',
            bindable: true,
            responsive: true,
            /* wwEditor:start */
            bindingValidation: {
                cssSupports: 'padding',
                type: 'string',
                tooltip: 'A CSS padding value: `"16px"` | `"0px 0px 0px 16px"`.',
            },
            propertyHelp: {
                tooltip: 'Space inside the quote block. The left value is the gap between the bar and the text.',
            },
            /* wwEditor:end */
        },

        // Browsers apply a UA margin-inline of 40px to blockquote. Declared
        // explicitly (keeping that 40px default) so the indent is controllable
        // instead of being an untouchable browser default.
        blockquoteMarginLeft: {
            label: { en: 'Margin left', fr: 'Marge gauche' },
            type: 'Length',
            section: 'style',
            options: {
                unitChoices: [
                    { value: 'px', label: 'px', min: 0, max: 200 },
                    { value: 'em', label: 'em', min: 0, max: 10 },
                    { value: 'rem', label: 'rem', min: 0, max: 10 },
                ],
                noRange: true,
                useVar: true,
            },
            defaultValue: '40px',
            bindable: true,
            responsive: true,
            /* wwEditor:start */
            bindingValidation: {
                cssSupports: 'margin-inline-start',
                type: 'string',
                tooltip: 'A CSS length with a unit: `"0px"` | `"40px"`.',
            },
            propertyHelp: {
                tooltip: 'Applied as margin-inline-start, so it follows the text direction and flips in RTL. Defaults to the 40px browsers use for quotes — set it to 0 to align the quote with the surrounding text.',
            },
            /* wwEditor:end */
        },
        blockquoteMarginRight: {
            label: { en: 'Margin right', fr: 'Marge droite' },
            type: 'Length',
            section: 'style',
            options: {
                unitChoices: [
                    { value: 'px', label: 'px', min: 0, max: 200 },
                    { value: 'em', label: 'em', min: 0, max: 10 },
                    { value: 'rem', label: 'rem', min: 0, max: 10 },
                ],
                noRange: true,
                useVar: true,
            },
            defaultValue: '40px',
            bindable: true,
            responsive: true,
            /* wwEditor:start */
            bindingValidation: {
                cssSupports: 'margin-inline-end',
                type: 'string',
                tooltip: 'A CSS length with a unit: `"0px"` | `"40px"`.',
            },
            propertyHelp: {
                tooltip: 'Applied as margin-inline-end, so it follows the text direction and flips in RTL. Defaults to the 40px browsers use for quotes — set it to 0 to align the quote with the surrounding text.',
            },
            /* wwEditor:end */
        },

        // Shown inside the "Link" group.
        linkTextDecoration: {
            label: { en: 'Text decoration', fr: 'Décoration' },
            type: 'TextSelect',
            section: 'style',
            options: {
                options: [
                    { value: 'underline', label: { en: 'Underline', fr: 'Souligné' } },
                    { value: 'none', label: { en: 'None', fr: 'Aucune' } },
                    { value: 'line-through', label: { en: 'Line through', fr: 'Barré' } },
                    { value: 'overline', label: { en: 'Overline', fr: 'Surligné' } },
                ],
            },
            defaultValue: 'underline',
            bindable: true,
            responsive: true,
            /* wwEditor:start */
            bindingValidation: {
                cssSupports: 'text-decoration-line',
                type: 'string',
                tooltip: 'Valid values: underline | none | line-through | overline',
            },
            propertyHelp: {
                tooltip: 'Underline is the accessible default: without it, links are distinguished from body text by color alone, which fails WCAG 1.4.1 unless you add another visual cue.',
            },
            /* wwEditor:end */
        },

        // Block and inline code need separate padding: a block is a box around
        // several lines, inline code is a chip inside a sentence.
        codeBlockPadding: {
            label: { en: 'Block padding', fr: 'Marge intérieure (bloc)' },
            type: 'Spacing',
            section: 'style',
            options: {
                unitChoices: [
                    { value: 'px', label: 'px', min: 0, max: 200 },
                    { value: 'em', label: 'em', min: 0, max: 10 },
                ],
                noRange: true,
                useVar: true,
            },
            defaultValue: '0.75em 1em 0.75em 1em',
            bindable: true,
            responsive: true,
            /* wwEditor:start */
            bindingValidation: {
                cssSupports: 'padding',
                type: 'string',
                tooltip: 'A CSS padding value: `"12px"` | `"0.75em 1em"`.',
            },
            propertyHelp: { tooltip: 'Padding inside a code block (a multi-line `pre`).' },
            /* wwEditor:end */
        },
        codeInlinePadding: {
            label: { en: 'Inline padding', fr: 'Marge intérieure (en ligne)' },
            type: 'Spacing',
            section: 'style',
            options: {
                unitChoices: [
                    { value: 'px', label: 'px', min: 0, max: 100 },
                    { value: 'em', label: 'em', min: 0, max: 5 },
                ],
                noRange: true,
                useVar: true,
            },
            defaultValue: '0.1em 0.3em 0.1em 0.3em',
            bindable: true,
            responsive: true,
            /* wwEditor:start */
            bindingValidation: {
                cssSupports: 'padding',
                type: 'string',
                tooltip: 'A CSS padding value: `"2px 4px"` | `"0.1em 0.3em"`.',
            },
            propertyHelp: {
                tooltip: 'Padding around inline code inside a sentence. Keep vertical values small so the code chip does not push the line height around.',
            },
            /* wwEditor:end */
        },

        // Shown inside the "Code" group; applies to both code blocks and inline code.
        codeBackground: {
            label: { en: 'Background', fr: 'Fond' },
            type: 'Color',
            section: 'style',
            defaultValue: '#f3f4f6',
            bindable: true,
            responsive: true,
            /* wwEditor:start */
            bindingValidation: {
                cssSupports: 'background-color',
                type: 'string',
                tooltip: 'Background color of code blocks and inline code.',
            },
            propertyHelp: { tooltip: 'Background behind both code blocks and inline code.' },
            /* wwEditor:end */
        },

        // ---- Per-element-type content styles ----
        ...contentStyleProperties,
    },
    triggerEvents: [
        { name: 'change', label: { en: 'On change' }, event: { value: '' } },
        { name: 'initValueChange', label: { en: 'On init value change' }, event: { value: '' } },
        { name: 'focus', label: { en: 'On focus' }, event: {} },
        { name: 'blur', label: { en: 'On blur' }, event: {} },
        { name: 'selectionChange', label: { en: 'On selection change' }, event: { text: '' } },
    ],
    actions: [
        { label: { en: 'Toggle bold' }, action: 'toggleBold' },
        { label: { en: 'Toggle italic' }, action: 'toggleItalic' },
        { label: { en: 'Toggle underline' }, action: 'toggleUnderline' },
        { label: { en: 'Toggle strikethrough' }, action: 'toggleStrike' },
        { label: { en: 'Toggle inline code' }, action: 'toggleCode' },
        { label: { en: 'Toggle code block' }, action: 'toggleCodeBlock' },
        { label: { en: 'Toggle bullet list' }, action: 'toggleBulletList' },
        { label: { en: 'Toggle ordered list' }, action: 'toggleOrderedList' },
        { label: { en: 'Toggle quote' }, action: 'toggleBlockquote' },
        { label: { en: 'Set paragraph' }, action: 'setParagraph' },
        {
            label: { en: 'Set heading' },
            action: 'setHeading',
            args: [{ name: 'level', type: 'number', label: { en: 'Level (1-6)' } }],
        },
        {
            label: { en: 'Set text color' },
            action: 'setColor',
            args: [{ name: 'color', type: 'string', label: { en: 'Color (hex or CSS color)' } }],
        },
        { label: { en: 'Clear text color' }, action: 'unsetColor' },
        {
            label: { en: 'Set font family' },
            action: 'setFontFamily',
            args: [{ name: 'family', type: 'string', label: { en: 'Font family' } }],
        },
        {
            label: { en: 'Set link' },
            action: 'setLink',
            args: [{ name: 'href', type: 'string', label: { en: 'URL' } }],
        },
        { label: { en: 'Remove link' }, action: 'unsetLink' },
        { label: { en: 'Clear formatting' }, action: 'clearFormatting' },
        { label: { en: 'Focus editor' }, action: 'focus' },
        { label: { en: 'Close toolbar' }, action: 'closeToolbar' },
    ],
};
